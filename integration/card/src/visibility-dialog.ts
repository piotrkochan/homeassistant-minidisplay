import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Hass, Visibility, VisibilityCondition, VisibilityOperator } from "./types";

const operatorNames: Record<VisibilityOperator, string> = {
  equals: "is",
  not_equals: "is not",
  above: "is above",
  below: "is below",
  available: "is available",
  unavailable: "is unavailable",
};

const emit = (element: HTMLElement, type: string, detail?: unknown) => {
  element.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
};

@customElement("mini-display-visibility-dialog")
export class MiniDisplayVisibilityDialog extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property() targetName = "";
  @property({ attribute: false }) value?: Visibility;
  @state() private draft: Visibility = { mode: "all", conditions: [] };

  static styles = css`
    :host { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 16px; font-family: var(--ha-font-family-body, Roboto, sans-serif); background: rgba(0,0,0,.48); }
    ha-card { width: min(620px,100%); max-height: min(760px,calc(100vh - 32px)); overflow: auto; }
    header { padding: 16px; border-bottom: 1px solid var(--divider-color); }
    h2 { margin: 0; font-size: 20px; font-weight: 500; }
    main { display: grid; gap: 14px; padding: 16px; }
    p { margin: 0; color: var(--secondary-text-color); font-size: 13px; }
    label { display: grid; gap: 5px; color: var(--secondary-text-color); font-size: 12px; }
    select, input { min-height: 40px; padding: 8px; color: var(--primary-text-color); font: inherit; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 8px; }
    .condition { display: grid; grid-template-columns: minmax(180px,1fr) 140px minmax(100px,.7fr) 40px; gap: 8px; align-items: end; padding: 12px; border: 1px solid var(--divider-color); border-radius: 10px; }
    .icon { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; color: var(--error-color); background: transparent; border: 0; border-radius: 50%; cursor: pointer; }
    .actions { display: flex; justify-content: space-between; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--divider-color); }
    .right { display: flex; gap: 8px; }
    @media(max-width:650px) { .condition { grid-template-columns: 1fr; } .icon { justify-self: end; } }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.draft = structuredClone(this.value ?? { mode: "all", conditions: [{ entity: "", operator: "equals", value: "" }] });
  }

  render() {
    return html`
      <ha-card role="dialog" aria-modal="true" aria-labelledby="visibility-title" @click=${(event: Event) => event.stopPropagation()}>
        <header><h2 id="visibility-title">${this.targetName} visibility</h2></header>
        <main>
          <p>Show this item only when the entity conditions match.</p>
          ${this.draft.conditions.length > 1 ? html`
            <label>Match<select .value=${this.draft.mode} @change=${(event: Event) => this.draft = { ...this.draft, mode: (event.target as HTMLSelectElement).value as "all" | "any" }}><option value="all">All conditions</option><option value="any">Any condition</option></select></label>
          ` : nothing}
          ${this.draft.conditions.map((condition, index) => this.renderCondition(condition, index))}
          <ha-button .disabled=${this.draft.conditions.length >= 5} @click=${this.addCondition}>Add condition</ha-button>
        </main>
        <footer class="actions">
          <ha-button @click=${() => emit(this, "visibility-clear")}>Always visible</ha-button>
          <div class="right"><ha-button @click=${() => emit(this, "visibility-cancel")}>Cancel</ha-button><ha-button @click=${() => emit(this, "visibility-save", this.draft)}>Save</ha-button></div>
        </footer>
      </ha-card>
    `;
  }

  private renderCondition(condition: VisibilityCondition, index: number) {
    const needsValue = !["available", "unavailable"].includes(condition.operator);
    return html`
      <div class="condition">
        <ha-form
          .hass=${this.hass}
          .data=${{ entity: condition.entity }}
          .schema=${[{ name: "entity", required: true, selector: { entity: {} } }]}
          .computeLabel=${() => "Entity"}
          @value-changed=${(event: CustomEvent) => this.updateCondition(index, { entity: event.detail.value.entity })}
        ></ha-form>
        <label>Condition<select .value=${condition.operator} @change=${(event: Event) => this.updateCondition(index, { operator: (event.target as HTMLSelectElement).value as VisibilityOperator })}>${Object.entries(operatorNames).map(([value, name]) => html`<option value=${value}>${name}</option>`)}</select></label>
        ${needsValue ? html`<label>Value<input .value=${condition.value ?? ""} @input=${(event: Event) => this.updateCondition(index, { value: (event.target as HTMLInputElement).value })}></label>` : html`<span></span>`}
        <button class="icon" aria-label="Remove condition" @click=${() => this.removeCondition(index)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
      </div>
    `;
  }

  private updateCondition(index: number, patch: Partial<VisibilityCondition>) {
    this.draft = { ...this.draft, conditions: this.draft.conditions.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) };
  }

  private addCondition() {
    this.draft = { ...this.draft, conditions: [...this.draft.conditions, { entity: "", operator: "equals", value: "" }] };
  }

  private removeCondition(index: number) {
    this.draft = { ...this.draft, conditions: this.draft.conditions.filter((_, itemIndex) => itemIndex !== index) };
  }
}
