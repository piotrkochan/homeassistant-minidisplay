import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { DisplayCard, Hass, Visibility, VisibilityExpression, VisibilityGroupExpression, VisibilityRule, VisibilityRuleOperator } from "./types";

const operatorNames: Record<VisibilityRuleOperator, string> = {
  range: "is in number range", equals: "equals", not_equals: "does not equal",
  starts_with: "starts with", ends_with: "ends with", contains: "contains",
  available: "is available", unavailable: "is unavailable",
};

const emptyVisibility = (): Visibility => ({
  rules: [{ id: "rule_1", label: "Condition A", source: "entity", entity: "", operator: "equals", match: "" }],
  expression: { type: "group", operator: "and", children: [{ type: "rule", ruleId: "rule_1" }] },
});

const emit = (element: HTMLElement, type: string, detail?: unknown) => {
  element.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
};

@customElement("mini-display-visibility-dialog")
export class MiniDisplayVisibilityDialog extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property() targetName = "";
  @property() targetKind: "row" | "card" = "card";
  @property({ attribute: false }) card?: DisplayCard;
  @property({ attribute: false }) value?: Visibility;
  @state() private draft: Visibility = emptyVisibility();

  static styles = css`
    :host{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;font-family:var(--ha-font-family-body,Roboto,sans-serif);background:rgba(0,0,0,.48)}
    ha-card{width:min(760px,100%);max-height:min(880px,calc(100vh - 32px));overflow:auto}header{padding:16px;border-bottom:1px solid var(--divider-color)}
    h2,h3{margin:0;font-weight:500}h2{font-size:20px}h3{font-size:16px}main{display:grid;gap:20px;padding:16px}section{display:grid;gap:10px}
    .section-head{display:flex;align-items:center;justify-content:space-between;gap:12px}p{margin:0;color:var(--secondary-text-color);font-size:13px;line-height:1.45}
    label{display:grid;gap:5px;color:var(--secondary-text-color);font-size:12px}select,input{box-sizing:border-box;width:100%;min-height:40px;padding:8px;color:var(--primary-text-color);font:inherit;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px}
    select:focus-visible,input:focus-visible,button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.rule-list{display:grid;gap:10px}
    .rule{display:grid;gap:10px;padding:12px;border:1px solid var(--divider-color);border-radius:12px;background:var(--card-background-color)}
    .rule-head{display:grid;grid-template-columns:1fr 130px 40px;gap:8px;align-items:end}.rule-fields{display:grid;grid-template-columns:150px minmax(180px,1fr) minmax(180px,1fr);gap:8px;align-items:end}.range{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .icon{display:grid;place-items:center;width:40px;height:40px;padding:0;color:var(--secondary-text-color);background:transparent;border:0;border-radius:50%;cursor:pointer}.icon.danger{color:var(--error-color)}.icon:disabled{opacity:.38;cursor:default}
    .logic{padding:12px;border:1px solid var(--divider-color);border-radius:12px;background:color-mix(in srgb,var(--secondary-background-color) 60%,transparent)}.group{display:grid;gap:8px}.group.nested{margin-left:18px;padding:10px 0 4px 12px;border-left:3px solid var(--primary-color)}
    .group-head{display:flex;align-items:end;gap:8px}.group-head label:first-child{width:170px}.invert{display:flex;align-items:center;gap:7px;min-height:40px;color:var(--primary-text-color);font-size:13px}.invert input{width:18px;min-height:18px}
    .logic-child{display:grid;grid-template-columns:28px minmax(180px,1fr) auto 40px;gap:6px;align-items:center}.logic-index{display:grid;place-items:center;width:24px;height:24px;color:var(--text-primary-color);font-size:12px;font-weight:600;background:var(--primary-color);border-radius:50%}
    .move{display:flex}.move .icon{width:34px;height:34px}.group-actions{display:flex;flex-wrap:wrap;gap:8px;padding-top:4px}.error{color:var(--error-color)}
    .actions{display:flex;justify-content:space-between;gap:8px;padding:12px 16px;border-top:1px solid var(--divider-color)}.right{display:flex;gap:8px}
    @media(max-width:700px){.rule-head,.rule-fields{grid-template-columns:1fr}.rule-head .icon{justify-self:end}.logic-child{grid-template-columns:28px minmax(0,1fr) 40px}.move{grid-column:2}.group.nested{margin-left:8px}.actions{align-items:stretch;flex-direction:column}.right{justify-content:flex-end}}
  `;

  connectedCallback() {
    super.connectedCallback();
    this.draft = structuredClone(this.value ?? emptyVisibility());
    if (!this.value && this.canUseCardValue) this.draft.rules[0].source = "card";
  }

  render() {
    const validationError = this.validationError;
    return html`
      <ha-card role="dialog" aria-modal="true" aria-labelledby="visibility-title" @click=${(event: Event) => event.stopPropagation()}>
        <header><h2 id="visibility-title">${this.targetName} visibility</h2></header>
        <main>
          <p>Create reusable conditions, then combine them in the logic tree. Nested groups work like parentheses.</p>
          <section><div class="section-head"><h3>Conditions</h3><ha-button .disabled=${this.draft.rules.length >= 12} @click=${this.addRule}>Add condition</ha-button></div><div class="rule-list">${this.draft.rules.map((rule, index) => this.renderRule(rule, index))}</div></section>
          <section><div class="section-head"><h3>Logic</h3></div><div class="logic">${this.renderGroup(this.draft.expression, [])}</div>${validationError ? html`<p class="error" role="alert">${validationError}</p>` : nothing}</section>
        </main>
        <footer class="actions"><ha-button @click=${() => emit(this, "visibility-clear")}>Always visible</ha-button><div class="right"><ha-button @click=${() => emit(this, "visibility-cancel")}>Cancel</ha-button><ha-button .disabled=${Boolean(validationError)} @click=${this.save}>Save</ha-button></div></footer>
      </ha-card>`;
  }

  private get canUseCardValue() {
    return this.targetKind === "card" && Boolean(this.card?.source || (this.card?.type === "text" && this.card.text !== undefined));
  }

  private renderRule(rule: VisibilityRule, index: number) {
    const needsEntity = rule.source === "entity";
    const needsMatch = ["equals", "not_equals", "starts_with", "ends_with", "contains"].includes(rule.operator);
    return html`<article class="rule">
      <div class="rule-head">
        <label>Label<input maxlength="32" .value=${rule.label} @input=${(event: Event) => this.updateRule(index, { label: (event.target as HTMLInputElement).value })}></label>
        <label>Value source<select .value=${rule.source} @change=${(event: Event) => this.updateRule(index, { source: (event.target as HTMLSelectElement).value as "card" | "entity" })}><option value="card" ?disabled=${!this.canUseCardValue}>This card</option><option value="entity">Another entity</option></select></label>
        <button class="icon danger" ?disabled=${this.draft.rules.length === 1} aria-label=${`Remove ${rule.label || `condition ${index + 1}`}`} @click=${() => this.removeRule(index)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
      </div>
      <div class="rule-fields">
        <label>Comparison<select .value=${rule.operator} @change=${(event: Event) => this.changeOperator(index, (event.target as HTMLSelectElement).value as VisibilityRuleOperator)}>${Object.entries(operatorNames).map(([value, name]) => html`<option value=${value}>${name}</option>`)}</select></label>
        ${needsEntity ? html`<ha-form .hass=${this.hass} .data=${{ entity: rule.entity ?? "" }} .schema=${[{ name: "entity", required: true, selector: { entity: {} } }]} .computeLabel=${() => "Entity"} @value-changed=${(event: CustomEvent) => this.updateRule(index, { entity: event.detail.value.entity })}></ha-form>` : html`<p>Uses the raw value of this card.</p>`}
        ${rule.operator === "range" ? html`<div class="range">${this.numberField("From", rule.minimum, (minimum) => this.updateRule(index, { minimum }))}${this.numberField("To", rule.maximum, (maximum) => this.updateRule(index, { maximum }))}</div>` : needsMatch ? html`<label>Value<input maxlength="64" .value=${rule.match ?? ""} @input=${(event: Event) => this.updateRule(index, { match: (event.target as HTMLInputElement).value })}></label>` : nothing}
      </div>
    </article>`;
  }

  private numberField(label: string, value: number | undefined, update: (value: number | undefined) => void) {
    return html`<label>${label}<input type="number" .value=${value === undefined ? "" : String(value)} @input=${(event: Event) => { const raw = (event.target as HTMLInputElement).value; update(raw === "" ? undefined : Number(raw)); }}></label>`;
  }

  private renderGroup(group: VisibilityGroupExpression, path: number[]): TemplateResult {
    return html`<div class="group ${path.length ? "nested" : ""}">
      <div class="group-head"><label>Group logic<select .value=${group.operator} @change=${(event: Event) => this.updateGroup(path, { operator: (event.target as HTMLSelectElement).value as "and" | "or" })}><option value="and">All must match (AND)</option><option value="or">Any may match (OR)</option></select></label><label class="invert"><input type="checkbox" .checked=${group.negate === true} @change=${(event: Event) => this.updateGroup(path, { negate: (event.target as HTMLInputElement).checked })}>Invert result</label></div>
      ${group.children.map((child, index) => this.renderExpression(child, [...path, index], index, group.children.length))}
      <div class="group-actions"><ha-button @click=${() => this.addRuleReference(path)}>Add condition</ha-button><ha-button .disabled=${path.length >= 3} @click=${() => this.addGroup(path)}>Add group</ha-button></div>
    </div>`;
  }

  private renderExpression(expression: VisibilityExpression, path: number[], index: number, siblingCount: number): TemplateResult {
    if (expression.type === "group") return html`<div class="logic-child"><span class="logic-index">${index + 1}</span>${this.renderGroup(expression, path)}${this.moveButtons(path, index, siblingCount)}<button class="icon danger" ?disabled=${siblingCount === 1} aria-label="Remove group" @click=${() => this.removeExpression(path)}><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>`;
    return html`<div class="logic-child"><span class="logic-index">${index + 1}</span><div><label>Condition<select .value=${expression.ruleId} @change=${(event: Event) => this.updateExpression(path, { ...expression, ruleId: (event.target as HTMLSelectElement).value })}>${this.draft.rules.map((rule) => html`<option value=${rule.id}>${rule.label || rule.id}</option>`)}</select></label><label class="invert"><input type="checkbox" .checked=${expression.negate === true} @change=${(event: Event) => this.updateExpression(path, { ...expression, negate: (event.target as HTMLInputElement).checked })}>Invert condition</label></div>${this.moveButtons(path, index, siblingCount)}<button class="icon danger" ?disabled=${siblingCount === 1} aria-label="Remove condition from logic" @click=${() => this.removeExpression(path)}><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>`;
  }

  private moveButtons(path: number[], index: number, siblingCount: number) {
    return html`<div class="move"><button class="icon" ?disabled=${index === 0} aria-label="Move up" @click=${() => this.moveExpression(path, -1)}><ha-icon icon="mdi:chevron-up"></ha-icon></button><button class="icon" ?disabled=${index === siblingCount - 1} aria-label="Move down" @click=${() => this.moveExpression(path, 1)}><ha-icon icon="mdi:chevron-down"></ha-icon></button></div>`;
  }

  private updateRule(index: number, patch: Partial<VisibilityRule>) {
    this.draft = { ...this.draft, rules: this.draft.rules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule) };
  }

  private changeOperator(index: number, operator: VisibilityRuleOperator) {
    const rule = this.draft.rules[index];
    const next: VisibilityRule = { id: rule.id, label: rule.label, source: rule.source, entity: rule.entity, operator };
    if (operator === "range") { next.minimum = rule.minimum; next.maximum = rule.maximum; }
    else if (!["available", "unavailable"].includes(operator)) next.match = rule.match ?? "";
    this.draft = { ...this.draft, rules: this.draft.rules.map((item, ruleIndex) => ruleIndex === index ? next : item) };
  }

  private addRule() {
    const used = new Set(this.draft.rules.map((rule) => rule.id)); let number = 1;
    while (used.has(`rule_${number}`)) number += 1;
    const rule: VisibilityRule = { id: `rule_${number}`, label: `Condition ${String.fromCharCode(65 + Math.min(this.draft.rules.length, 25))}`, source: this.canUseCardValue ? "card" : "entity", entity: "", operator: "equals", match: "" };
    this.draft = { rules: [...this.draft.rules, rule], expression: { ...this.draft.expression, children: [...this.draft.expression.children, { type: "rule", ruleId: rule.id }] } };
  }

  private removeRule(index: number) {
    if (this.draft.rules.length === 1) return;
    const ruleId = this.draft.rules[index].id; const rules = this.draft.rules.filter((_, ruleIndex) => ruleIndex !== index); const fallback = rules[0].id;
    const replace = (expression: VisibilityExpression): VisibilityExpression => expression.type === "rule" ? expression.ruleId === ruleId ? { ...expression, ruleId: fallback } : expression : { ...expression, children: expression.children.map(replace) };
    this.draft = { rules, expression: replace(this.draft.expression) as VisibilityGroupExpression };
  }

  private groupAt(root: VisibilityGroupExpression, path: number[]): VisibilityGroupExpression {
    let group = root;
    for (const index of path) { const child = group.children[index]; if (!child || child.type !== "group") throw new Error("Invalid visibility group path"); group = child; }
    return group;
  }

  private parentAt(root: VisibilityGroupExpression, path: number[]) { return this.groupAt(root, path.slice(0, -1)); }
  private mutateExpression(mutator: (root: VisibilityGroupExpression) => void) { const expression = structuredClone(this.draft.expression); mutator(expression); this.draft = { ...this.draft, expression }; }
  private updateGroup(path: number[], patch: Partial<VisibilityGroupExpression>) { this.mutateExpression((root) => Object.assign(this.groupAt(root, path), patch)); }
  private updateExpression(path: number[], expression: VisibilityExpression) { this.mutateExpression((root) => { this.parentAt(root, path).children[path.at(-1)!] = expression; }); }
  private addRuleReference(path: number[]) { this.mutateExpression((root) => this.groupAt(root, path).children.push({ type: "rule", ruleId: this.draft.rules[0].id })); }
  private addGroup(path: number[]) { this.mutateExpression((root) => this.groupAt(root, path).children.push({ type: "group", operator: "and", children: [{ type: "rule", ruleId: this.draft.rules[0].id }] })); }
  private removeExpression(path: number[]) { this.mutateExpression((root) => { const parent = this.parentAt(root, path); if (parent.children.length > 1) parent.children.splice(path.at(-1)!, 1); }); }
  private moveExpression(path: number[], direction: -1 | 1) { this.mutateExpression((root) => { const parent = this.parentAt(root, path); const index = path.at(-1)!; const target = index + direction; if (target < 0 || target >= parent.children.length) return; [parent.children[index], parent.children[target]] = [parent.children[target], parent.children[index]]; }); }
  private get validationError(): string | undefined {
    const labels = new Set<string>();
    for (const rule of this.draft.rules) {
      const label = rule.label.trim();
      if (!label) return "Every condition needs a label.";
      if (labels.has(label.toLowerCase())) return "Condition labels must be unique.";
      labels.add(label.toLowerCase());
      if (rule.source === "card" && !this.canUseCardValue) return "This item has no card value to test.";
      if (rule.source === "entity" && !rule.entity?.trim()) return `${label} needs an entity.`;
      if (rule.operator === "range") {
        if (rule.minimum === undefined && rule.maximum === undefined) return `${label} needs a lower or upper limit.`;
        if ((rule.minimum !== undefined && !Number.isFinite(rule.minimum)) || (rule.maximum !== undefined && !Number.isFinite(rule.maximum))) return `${label} needs valid number limits.`;
        if (rule.minimum !== undefined && rule.maximum !== undefined && rule.minimum > rule.maximum) return `${label} has an invalid range.`;
      }
      if (["equals", "not_equals", "starts_with", "ends_with", "contains"].includes(rule.operator) && !rule.match?.length) return `${label} needs a value.`;
    }
    return undefined;
  }

  private save() {
    if (this.validationError) return;
    const draft = structuredClone(this.draft);
    for (const rule of draft.rules) { rule.label = rule.label.trim(); if (rule.entity !== undefined) rule.entity = rule.entity.trim(); }
    emit(this, "visibility-save", draft);
  }
}
