import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Hass, ImageAsset } from "./types";

type EncodedImage = ImageAsset & { data: string };

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
};

const hash64 = (bytes: Uint8Array) => {
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
};

export const encodeRgb565Rle = (
  pixels: Uint8Array,
  width: number,
  height: number,
) => {
  const maximumBytes =
    8 + pixels.length + height * (2 + Math.ceil(width / 128));
  const encoded = new Uint8Array(maximumBytes);
  const encodedView = new DataView(encoded.buffer);
  encoded.set([77, 68, 73, 50], 0);
  encoded[4] = width & 0xff;
  encoded[5] = width >> 8;
  encoded[6] = height & 0xff;
  encoded[7] = height >> 8;
  const equal = (left: number, right: number) =>
    pixels[left * 2] === pixels[right * 2] &&
    pixels[left * 2 + 1] === pixels[right * 2 + 1];
  let target = 8;
  for (let row = 0; row < height; row += 1) {
    const rowEnd = (row + 1) * width;
    let source = row * width;
    const rowLengthOffset = target;
    target += 2;
    while (source < rowEnd) {
      let run = 1;
      while (
        run < 128 &&
        source + run < rowEnd &&
        equal(source, source + run)
      ) {
        run += 1;
      }
      if (run >= 2) {
        encoded[target++] = 0x80 | (run - 1);
        encoded[target++] = pixels[source * 2];
        encoded[target++] = pixels[source * 2 + 1];
        source += run;
        continue;
      }
      const literalStart = source++;
      while (source - literalStart < 128 && source < rowEnd) {
        run = 1;
        while (
          run < 2 &&
          source + run < rowEnd &&
          equal(source, source + run)
        ) {
          run += 1;
        }
        if (run >= 2) break;
        source += 1;
      }
      const literalPixels = source - literalStart;
      encoded[target++] = literalPixels - 1;
      const literal = pixels.subarray(literalStart * 2, source * 2);
      encoded.set(literal, target);
      target += literal.length;
    }
    encodedView.setUint16(rowLengthOffset, target - rowLengthOffset - 2, true);
  }
  return encoded.slice(0, target);
};

export const encodeImage = async (
  file: File,
  maximumWidth: number,
  maximumHeight: number,
): Promise<EncodedImage> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maximumWidth / bitmap.width,
    maximumHeight / bitmap.height,
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("This browser cannot optimize images");
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const rgba = context.getImageData(0, 0, width, height).data;
  const pixels = new Uint8Array(width * height * 2);
  const view = new DataView(pixels.buffer);
  for (
    let source = 0, target = 0;
    source < rgba.length;
    source += 4, target += 2
  ) {
    const color =
      ((rgba[source] & 0xf8) << 8) |
      ((rgba[source + 1] & 0xfc) << 3) |
      (rgba[source + 2] >> 3);
    view.setUint16(target, color, true);
  }
  const bytes = encodeRgb565Rle(pixels, width, height);
  return {
    id: hash64(bytes),
    name: file.name,
    width,
    height,
    bytes: bytes.length,
    data: bytesToBase64(bytes),
    preview: canvas.toDataURL("image/webp", 0.82),
  };
};

@customElement("mini-display-image-field")
export class MiniDisplayImageField extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) assets: ImageAsset[] = [];
  @property() displayId = "";
  @property() label = "Image";
  @property() value = "";
  @property({ type: Boolean }) uploadOnly = false;
  @property({ type: Number }) maximumWidth = 240;
  @property({ type: Number }) maximumHeight = 240;
  @state() private busy = false;
  @state() private error = "";

  static styles = css`
    :host {
      display: block;
    }
    .field {
      display: grid;
      gap: 8px;
    }
    .label {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .picker {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      min-height: 72px;
      padding: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
    }
    .thumb {
      width: 56px;
      height: 56px;
      object-fit: cover;
      background: var(--secondary-background-color);
      border-radius: 7px;
    }
    .empty {
      display: grid;
      place-items: center;
      color: var(--secondary-text-color);
    }
    select {
      width: 100%;
      min-height: 40px;
      padding: 0 10px;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }
    .upload {
      position: relative;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 50%;
      color: var(--primary-color);
      background: var(--secondary-background-color);
      cursor: pointer;
    }
    .actions {
      display: flex;
      gap: 4px;
    }
    .detach {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      color: var(--secondary-text-color);
      background: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
    }
    .detach:hover {
      color: var(--primary-text-color);
      background: var(--secondary-background-color);
    }
    .upload input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
    .error {
      font-size: 12px;
      color: var(--error-color);
    }
    small {
      color: var(--secondary-text-color);
    }
  `;

  render() {
    const selected = this.assets.find((asset) => asset.id === this.value);
    return html`<div class="field">
      <span class="label">${this.label}</span>
      <div class="picker">
        ${selected?.preview ? html`<img class="thumb" src=${selected.preview} alt="" />` : html`<div class="thumb empty"><ha-icon icon="mdi:image-outline"></ha-icon></div>`}
        <div>
          ${
            this.uploadOnly
              ? html`<strong>Add a new image</strong><br /><small
                    >Optimized for this display before upload</small
                  >`
              : html`<select
                    .value=${this.value}
                    ?disabled=${this.busy}
                    @change=${(event: Event) => this.select((event.target as HTMLSelectElement).value)}
                  >
                    <option value="">No image</option>
                    ${this.assets.map((asset) => html`<option value=${asset.id}>${asset.name} · ${asset.width}×${asset.height}</option>`)}</select
                  >${selected ? html`<small>${Math.ceil(selected.bytes / 1024)} KB on display</small>` : nothing}`
          }
        </div>
        <div class="actions">
          ${
            selected && !this.uploadOnly
              ? html`<button
                  class="detach"
                  title="Detach image"
                  aria-label="Detach image"
                  ?disabled=${this.busy}
                  @click=${() => this.select("")}
                >
                  <ha-icon icon="mdi:image-remove-outline"></ha-icon>
                </button>`
              : nothing
          }
          <label class="upload" title="Upload image"
            ><ha-icon icon=${this.busy ? "mdi:loading" : "mdi:upload"}></ha-icon
            ><input
              type="file"
              accept="image/*"
              ?disabled=${this.busy}
              @change=${this.upload}
          /></label>
        </div>
      </div>
      ${this.error ? html`<div class="error" role="alert">${this.error}</div>` : nothing}
    </div>`;
  }

  private select(value: string) {
    this.dispatchEvent(
      new CustomEvent("image-changed", {
        detail: value,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private upload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.hass || !this.displayId) return;
    this.busy = true;
    this.error = "";
    try {
      const asset = await encodeImage(
        file,
        Math.max(1, this.maximumWidth),
        Math.max(1, this.maximumHeight),
      );
      await this.hass.callWS({
        type: "mini_display/asset/upload",
        config_entry_id: this.displayId,
        asset_id: asset.id,
        name: asset.name,
        width: asset.width,
        height: asset.height,
        data: asset.data,
        preview: asset.preview,
      });
      this.dispatchEvent(
        new CustomEvent("asset-uploaded", {
          detail: asset,
          bubbles: true,
          composed: true,
        }),
      );
      if (!this.uploadOnly) this.select(asset.id);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.busy = false;
      input.value = "";
    }
  };
}
