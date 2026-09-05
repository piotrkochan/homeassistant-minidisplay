import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

const units = [
  { label: "s", name: "Seconds", scale: 1 },
  { label: "min", name: "Minutes", scale: 60 },
  { label: "h", name: "Hours", scale: 3600 },
  { label: "d", name: "Days", scale: 86400 },
];

@customElement("mini-display-duration-field")
export class DurationField extends LitElement {
  @property({ type: Number }) seconds = 300;
  @property({ type: Number }) min = 30;
  @property({ type: Number }) max = 86400;
  @property() label = "Bucket duration";
  @state() private unit?: number;

  protected willUpdate(_changed: PropertyValues) {
    if (this.unit === undefined)
      this.unit = [...units].reverse().find(u => this.seconds >= u.scale && this.seconds % u.scale === 0)?.scale ?? 1;
  }

  static styles = css`
    :host { display:block; min-width:0; font:inherit; color:var(--primary-text-color); }
    * { box-sizing:border-box; }
    label { display:block; margin-bottom:6px; font-size:14px; }
    .field { display:flex; align-items:center; border:1px solid var(--divider-color); border-radius:8px; background:var(--card-background-color); }
    .field:focus-within { outline:2px solid var(--primary-color); }
    input[type=number] { min-width:0; width:100%; min-height:42px; border:0; background:none; color:inherit; font:inherit; padding:8px; outline:none; }
    .units { display:flex; flex-shrink:0; gap:2px; margin:4px; }
    .units label { position:relative; display:grid; place-items:center; min-width:30px; min-height:34px; margin:0; padding:0 5px; border-radius:5px; cursor:pointer; font-size:12px; font-weight:600; }
    .units input { position:absolute; opacity:0; width:1px; height:1px; }
    .units label:has(:checked) { background:var(--primary-color); color:var(--text-primary-color,#fff); }
    .units label:hover:not(:has(:checked)) { background:var(--secondary-background-color); }
    .units label:has(:focus-visible) { outline:2px solid var(--primary-color); outline-offset:2px; }
  `;

  render() {
    const scale = this.unit ?? 1;
    return html`<label for="duration">${this.label}</label><div class="field">
      <input id="duration" type="number" inputmode="decimal" step="any"
        min=${this.min / scale} max=${this.max / scale}
        aria-label=${`${this.label} (${units.find(u => u.scale === scale)?.name})`}
        .value=${String(Number((this.seconds / scale).toFixed(8)))}
        @change=${(event: Event) => {
          const input = event.target as HTMLInputElement;
          if (!input.value || !input.reportValidity()) return;
          const seconds = Math.round(input.valueAsNumber * scale);
          if (!Number.isFinite(seconds) || seconds < this.min || seconds > this.max) return;
          this.dispatchEvent(new CustomEvent("duration-changed", { detail: seconds, bubbles: true, composed: true }));
        }}>
      <div class="units" role="radiogroup" aria-label="Time unit">
        ${units.map(u => html`<label title=${u.name}><input type="radio" name="unit" aria-label=${u.name}
          .checked=${scale === u.scale} @change=${() => { this.unit = u.scale; }}>${u.label}</label>`)}
      </div>
    </div>`;
  }
}
