import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { uploadFirmware } from "../api";
import { pageStyles } from "../styles";

@customElement("mini-display-firmware-page")
export class FirmwarePage extends LitElement {
  @property({ attribute: false }) saving = false;
  @property({ attribute: false }) endpoint = "/api/v1/firmware";
  @property({ attribute: false }) onStart?: () => void;
  @property({ attribute: false }) onSuccess?: (message: string) => void;
  @property({ attribute: false }) onError?: (message: string) => void;
  @property({ attribute: false }) compact = false;

  static styles = pageStyles;

  private async upload_(event: SubmitEvent) {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const file = data.get("firmware");
    if (!(file instanceof File) || !file.size) return;
    this.onStart?.();
    try {
      this.onSuccess?.(await uploadFirmware(file, this.endpoint));
    } catch (error) {
      this.onError?.(
        error instanceof Error ? error.message : "Firmware upload failed",
      );
    }
  }

  render() {
    const form = html`<form class="stack" @submit=${this.upload_}>
      <label class="field"
        >Firmware image<input
          type="file"
          name="firmware"
          accept=".bin"
          required /></label
      ><button type="submit" ?disabled=${this.saving}>Upload firmware</button>
    </form>`;
    if (this.compact) return form;
    return html`<section class="card">
      <h2>Firmware update</h2>
      <p class="muted">
        Upload a compatible OTA image. Your panel login authorizes this update.
      </p>
      ${form}
    </section>`;
  }
}
