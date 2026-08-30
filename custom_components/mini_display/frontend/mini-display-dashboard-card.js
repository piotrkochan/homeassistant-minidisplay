const CARD_TAG = "mini-display-dashboard-card";
const EDITOR_TAG = "mini-display-dashboard-card-editor";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

class MiniDisplayDashboardCard extends HTMLElement {
  setConfig(config) {
    if (!config.config_entry_id) {
      throw new Error("Select a Mini-Display");
    }
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._loadDashboard();
    this._render();
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return { columns: 6, rows: 4, min_columns: 3, min_rows: 2 };
  }

  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig() {
    return { config_entry_id: "", show_preview: true };
  }

  async _loadDashboard() {
    const id = this._config?.config_entry_id;
    if (!this._hass || !id || this._loadedFor === id) return;
    this._loadedFor = id;
    try {
      this._dashboard = await this._hass.callWS({
        type: "mini_display/dashboard/get",
        config_entry_id: id,
      });
      this._error = "";
    } catch (err) {
      this._dashboard = null;
      this._error = String(err);
    }
    this._render();
  }

  _card(card) {
    const state = card.source ? this._hass?.states?.[card.source] : null;
    const raw = state?.state ?? (card.text ?? "—");
    const value = card.type === "number" ? `${raw}${card.unit ? ` ${card.unit}` : ""}` : raw;
    const minimum = Number(card.minimum ?? 0);
    const maximum = Number(card.maximum ?? 100);
    const numeric = Number(raw);
    const progress = Number.isFinite(numeric) && maximum > minimum
      ? Math.max(0, Math.min(100, ((numeric - minimum) / (maximum - minimum)) * 100))
      : 0;
    const colors = { background: "#090b10", surface: "#20242d", primary: "#42a5f5", secondary: "#ab47bc", accent: "#42a5f5", success: "#43a047", warning: "#fb8c00", error: "#e53935", muted: "#9e9e9e" };
    const color = (value) => colors[value] || value;
    const style = card.style || {};
    const valueStyle = card.valueStyle || {};
    const radii = { none: 0, small: 3, medium: 6, large: 10 };
    const sizes = { small: 10, medium: 13, large: 17, xlarge: 23 };
    const families = { sans: "sans-serif", "sans-bold": "sans-serif", mono: "monospace", serif: "serif" };
    const cardCss = `${style.background ? `background:${color(style.background)};` : ""}${style.foreground ? `color:${color(style.foreground)};` : ""}${style.radius ? `border-radius:${radii[style.radius]}px;` : ""}`;
    const valueCss = `${valueStyle.fontFamily ? `font-family:${families[valueStyle.fontFamily]};` : ""}${valueStyle.fontFamily === "sans-bold" ? "font-weight:700;" : ""}${sizes[valueStyle.fontSize] ? `font-size:${sizes[valueStyle.fontSize]}px;` : ""}`;
    return `<div class="z-card" style="${escapeHtml(cardCss)}">
      ${card.title ? `<small>${escapeHtml(card.title)}</small>` : ""}
      <strong style="${escapeHtml(valueCss)}">${escapeHtml(value)}</strong>
      ${card.progress && card.progress !== "none" ? `<div class="bar"><i style="width:${progress}%;${style.accent ? `background:${color(style.accent)}` : ""}"></i></div>` : ""}
    </div>`;
  }

  _render() {
    if (!this._config) return;
    const id = this._config.config_entry_id;
    const page = this._dashboard?.pages?.find((item) => item.enabled !== false);
    const preview = page
      ? `<div class="screen">
          ${page.title ? `<h3>${escapeHtml(page.title)}</h3>` : ""}
          ${page.rows.map((row) => `<section style="flex:${row.weight || 1}">
            ${row.title && row.showTitle !== false ? `<label>${escapeHtml(row.title)}</label>` : ""}
            <div class="row">${row.cards.map((card) => this._card(card)).join("")}</div>
          </section>`).join("")}
        </div>`
      : `<div class="screen empty"><div><strong>240 × 240</strong><br><small>${escapeHtml(id)}</small></div></div>`;
    this.innerHTML = `
      <ha-card header="Home Assistant Mini-Display">
        <style>
          .wrap{padding:16px}.screen{box-sizing:border-box;width:240px;height:240px;margin:auto;padding:6px;background:#090b10;color:#fff;border-radius:12px;display:flex;flex-direction:column;gap:4px;overflow:hidden}.empty{display:grid;place-items:center;text-align:center}.screen h3{font-size:13px;line-height:16px;text-align:center;margin:0}.screen section{min-height:0;display:flex;flex-direction:column}.screen section>label{font-size:9px;color:#aaa}.row{display:flex;gap:4px;min-height:0;flex:1}.z-card{background:#20242d;border-radius:6px;min-width:0;flex:1;padding:5px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}.z-card small{font-size:9px;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.z-card strong{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bar{height:4px;background:#3d424e;border-radius:2px;margin-top:4px}.bar i{display:block;height:100%;background:#42a5f5;border-radius:2px}
        </style>
        <div class="wrap">${preview}${this._error ? `<p>${escapeHtml(this._error)}</p>` : ""}</div>
      </ha-card>`;
  }
}

class MiniDisplayDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._pageIndex = 0;
    this._render();
    this._loadDisplays();
  }

  set hass(hass) {
    this._hass = hass;
    this._loadDisplays();
    this._loadDashboard();
  }

  async _loadDisplays() {
    if (!this._hass || !this._config) return;
    try {
      this._displays = await this._hass.callWS({ type: "mini_display/displays" });
      this._render();
    } catch (err) {
      this._error = String(err);
      this._render();
    }
  }

  async _loadDashboard() {
    const id = this._config?.config_entry_id;
    if (!this._hass || !id || this._dashboardFor === id) return;
    this._dashboardFor = id;
    try {
      const dashboard = await this._hass.callWS({
        type: "mini_display/dashboard/get",
        config_entry_id: id,
      });
      this._dashboard = dashboard || this._newDashboard();
      this._error = "";
      this._render();
    } catch (err) {
      this._dashboardFor = "";
      this._error = String(err);
      this._render();
    }
  }

  async _apply() {
    try {
      await this._hass.callWS({
        type: "mini_display/dashboard/set",
        config_entry_id: this._config.config_entry_id,
        dashboard: this._dashboard,
      });
      this._error = "";
      this._message = "Dashboard accepted by display";
    } catch (err) {
      this._message = "";
      this._error = String(err);
    }
    this._render();
  }

  _newDashboard() {
    return { version: 1, defaults: { pageDurationSeconds: 10, theme: "dark" }, pages: [this._newPage(1)] };
  }

  _newPage(number) {
    return { id: `page_${number}`, title: `Page ${number}`, durationSeconds: 10, enabled: true, rows: [this._newRow()] };
  }

  _newRow() {
    return { weight: 1, gap: "small", cards: [{ type: "clock", format: "24h", showDate: true }] };
  }

  _newCard(type = "number") {
    if (type === "clock") return { type: "clock", format: "24h", showDate: true };
    if (type === "text") return { type: "text", text: "Text", align: "center", wrap: true, maxLines: 3 };
    if (type === "status") return { type: "status", source: "binary_sensor.example", onText: "On", offText: "Off" };
    return { type: "number", source: "sensor.example", unit: "", decimals: 1, progress: "none", showCurrent: true };
  }

  _touch() {
    this._message = "Unsaved changes";
    this._error = "";
    this._render();
  }

  _field(label, value, path, type = "text", options = null) {
    const encoded = escapeHtml(JSON.stringify(path));
    if (type === "checkbox") return `<label class="check"><input data-path="${encoded}" type="checkbox" ${value ? "checked" : ""}> ${label}</label>`;
    if (options) return `<label>${label}<select data-path="${encoded}">${options.map((item) => `<option ${item === value ? "selected" : ""}>${item}</option>`).join("")}</select></label>`;
    const entityList = label.startsWith("Entity") ? ' list="mini-display-entities"' : "";
    return `<label>${label}<input data-path="${encoded}" type="${type}"${entityList} value="${escapeHtml(value ?? "")}"></label>`;
  }

  _styleFields(card, prefix) {
    const style = card.style || {};
    const valueStyle = card.valueStyle || {};
    return `<details><summary>Colors and font</summary><div class="grid">
      ${this._field("Background (#RRGGBB or token)", style.background, [...prefix, "style", "background"])}
      ${this._field("Foreground (#RRGGBB or token)", style.foreground, [...prefix, "style", "foreground"])}
      ${this._field("Accent (#RRGGBB or token)", style.accent, [...prefix, "style", "accent"])}
      ${this._field("Font", valueStyle.fontFamily || "sans", [...prefix, "valueStyle", "fontFamily"], "text", ["sans", "sans-bold", "mono", "serif"])}
      ${this._field("Font size", valueStyle.fontSize || "auto", [...prefix, "valueStyle", "fontSize"], "text", ["auto", "small", "medium", "large", "xlarge"])}
      ${this._field("Corners", style.radius || "medium", [...prefix, "style", "radius"], "text", ["none", "small", "medium", "large"])}
    </div></details>`;
  }

  _cardEditor(card, pi, ri, ci) {
    const p = ["pages", pi, "rows", ri, "cards", ci];
    let specific = "";
    if (card.type === "number") specific = `${this._field("Entity", card.source, [...p, "source"])}${this._field("Unit", card.unit, [...p, "unit"])}${this._field("Decimals", card.decimals ?? 1, [...p, "decimals"], "number")}${this._field("Progress", card.progress || "none", [...p, "progress"], "text", ["none", "bar", "ring"])}${this._field("Minimum", card.minimum, [...p, "minimum"], "number")}${this._field("Maximum", card.maximum, [...p, "maximum"], "number")}`;
    if (card.type === "text") specific = `${this._field("Entity (optional)", card.source, [...p, "source"])}${this._field("Static text", card.text, [...p, "text"])}${this._field("Align", card.align || "center", [...p, "align"], "text", ["start", "center", "end"])}${this._field("Max lines", card.maxLines ?? 3, [...p, "maxLines"], "number")}`;
    if (card.type === "status") specific = `${this._field("Entity", card.source, [...p, "source"])}${this._field("On text", card.onText, [...p, "onText"])}${this._field("Off text", card.offText, [...p, "offText"])}`;
    if (card.type === "clock") specific = `${this._field("Format", card.format || "24h", [...p, "format"], "text", ["24h", "12h"])}${this._field("Show seconds", card.showSeconds, [...p, "showSeconds"], "checkbox")}${this._field("Show date", card.showDate, [...p, "showDate"], "checkbox")}`;
    return `<article><header><b>Card ${ci + 1}</b><span><button data-move-card="${ri},${ci},-1">↑</button><button data-move-card="${ri},${ci},1">↓</button><button class="danger" data-delete-card="${ri},${ci}">×</button></span></header><div class="grid">${this._field("Type", card.type, [...p, "type"], "text", ["number", "text", "clock", "status"])}${this._field("Title", card.title, [...p, "title"])}${specific}</div>${this._styleFields(card, p)}</article>`;
  }

  _rowEditor(row, pi, ri) {
    const p = ["pages", pi, "rows", ri];
    return `<section class="row-editor"><header><b>Row ${ri + 1}</b><span><button data-move-row="${ri},-1">↑</button><button data-move-row="${ri},1">↓</button><button class="danger" data-delete-row="${ri}">Delete row</button></span></header><div class="grid">${this._field("Row title", row.title, [...p, "title"])}${this._field("Show title", row.showTitle !== false, [...p, "showTitle"], "checkbox")}${this._field("Height weight", row.weight || 1, [...p, "weight"], "number")}${this._field("Gap", row.gap || "small", [...p, "gap"], "text", ["none", "small", "medium"])}</div><div class="cards">${row.cards.map((card, ci) => this._cardEditor(card, pi, ri, ci)).join("")}</div>${row.cards.length < 3 ? `<button data-add-card="${ri}">+ Add card</button>` : ""}</section>`;
  }

  _setPath(path, input) {
    let target = this._dashboard;
    for (const key of path.slice(0, -1)) {
      if (target[key] == null) target[key] = {};
      target = target[key];
    }
    const key = path.at(-1);
    if (key === "type") {
      const replacement = this._newCard(input.value);
      for (const existingKey of Object.keys(target)) delete target[existingKey];
      Object.assign(target, replacement);
      this._touch();
      return;
    }
    if (input.type === "checkbox") target[key] = input.checked;
    else if (input.type === "number") {
      if (input.value === "") delete target[key]; else target[key] = Number(input.value);
    } else if (input.value === "") delete target[key]; else target[key] = input.value;
    this._touch();
  }

  _move(items, index, delta) {
    const next = index + delta;
    if (next < 0 || next >= items.length) return;
    [items[index], items[next]] = [items[next], items[index]];
    this._touch();
  }

  _changed(event) {
    const config = { ...this._config, config_entry_id: event.target.value };
    this._config = config;
    this._dashboardFor = "";
    this._dashboard = null;
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config },
    }));
    this._loadDashboard();
  }

  _render() {
    if (!this._config) return;
    const displays = this._displays || [];
    const page = this._dashboard?.pages?.[this._pageIndex];
    const entities = Object.keys(this._hass?.states || {}).sort();
    this.innerHTML = `<style>
      :host{display:block}.editor{display:grid;gap:12px}label{display:grid;gap:4px;font-size:12px}input,select,button{box-sizing:border-box;min-height:36px;padding:6px 9px;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:6px}.check{display:flex;align-items:center}.check input{min-height:auto}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.toolbar,header,.tabs{display:flex;align-items:center;justify-content:space-between;gap:6px}.tabs{justify-content:flex-start;overflow:auto}.tabs button.active{background:var(--primary-color);color:var(--text-primary-color)}.row-editor,article{display:grid;gap:10px;padding:10px;border:1px solid var(--divider-color);border-radius:8px}.cards{display:grid;gap:8px}article{background:color-mix(in srgb,var(--card-background-color),var(--primary-color) 4%)}button{cursor:pointer}.danger{color:var(--error-color)}details{margin-top:4px}summary{cursor:pointer;font-size:12px}@media(max-width:500px){.grid{grid-template-columns:1fr}}
    </style><datalist id="mini-display-entities">${entities.map((entity) => `<option value="${escapeHtml(entity)}"></option>`).join("")}</datalist><div class="editor">
        <label for="mini_display-display">Display</label>
        <select id="mini_display-display">
          <option value="">Select display</option>
          ${displays.map((display) => `<option value="${display.config_entry_id}" ${display.config_entry_id === this._config.config_entry_id ? "selected" : ""}>${display.title}${display.available ? "" : " (offline)"}</option>`).join("")}
        </select>
        ${page ? `<div class="tabs">${this._dashboard.pages.map((item, index) => `<button data-page="${index}" class="${index === this._pageIndex ? "active" : ""}">${escapeHtml(item.title || item.id)}</button>`).join("")}<button data-add-page>+ Page</button></div>
        <div class="toolbar"><b>Page settings</b><span><button data-duplicate-page>Duplicate</button><button class="danger" data-delete-page>Delete</button></span></div>
        <div class="grid">${this._field("Page ID", page.id, ["pages", this._pageIndex, "id"])}${this._field("Title", page.title, ["pages", this._pageIndex, "title"])}${this._field("Duration (seconds)", page.durationSeconds ?? 10, ["pages", this._pageIndex, "durationSeconds"], "number")}${this._field("Enabled", page.enabled !== false, ["pages", this._pageIndex, "enabled"], "checkbox")}</div>
        ${page.rows.map((row, ri) => this._rowEditor(row, this._pageIndex, ri)).join("")}
        ${page.rows.length < 6 ? `<button data-add-row>+ Add row</button>` : ""}<button id="mini_display-apply" type="button">Apply to display</button>` : ""}
        ${this._error ? `<div style="color:var(--error-color)">${escapeHtml(this._error)}</div>` : ""}
        ${this._message ? `<div style="color:var(--success-color)">${escapeHtml(this._message)}</div>` : ""}
      </div>`;
    this.querySelector("select")?.addEventListener("change", (event) => this._changed(event));
    this.querySelector("#mini_display-apply")?.addEventListener("click", () => this._apply());
    this.querySelectorAll("[data-path]").forEach((input) => input.addEventListener("change", () => this._setPath(JSON.parse(input.dataset.path), input)));
    this.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => { this._pageIndex = Number(button.dataset.page); this._render(); }));
    this.querySelector("[data-add-page]")?.addEventListener("click", () => { this._dashboard.pages.push(this._newPage(this._dashboard.pages.length + 1)); this._pageIndex = this._dashboard.pages.length - 1; this._touch(); });
    this.querySelector("[data-duplicate-page]")?.addEventListener("click", () => { const copy = structuredClone(page); copy.id = `${page.id}_copy`.slice(0, 32); this._dashboard.pages.splice(this._pageIndex + 1, 0, copy); this._pageIndex++; this._touch(); });
    this.querySelector("[data-delete-page]")?.addEventListener("click", () => { if (this._dashboard.pages.length === 1) return; this._dashboard.pages.splice(this._pageIndex, 1); this._pageIndex = Math.max(0, this._pageIndex - 1); this._touch(); });
    this.querySelector("[data-add-row]")?.addEventListener("click", () => { page.rows.push(this._newRow()); this._touch(); });
    this.querySelectorAll("[data-delete-row]").forEach((button) => button.addEventListener("click", () => { if (page.rows.length === 1) return; page.rows.splice(Number(button.dataset.deleteRow), 1); this._touch(); }));
    this.querySelectorAll("[data-move-row]").forEach((button) => button.addEventListener("click", () => { const [i,d] = button.dataset.moveRow.split(",").map(Number); this._move(page.rows, i, d); }));
    this.querySelectorAll("[data-add-card]").forEach((button) => button.addEventListener("click", () => { page.rows[Number(button.dataset.addCard)].cards.push(this._newCard()); this._touch(); }));
    this.querySelectorAll("[data-delete-card]").forEach((button) => button.addEventListener("click", () => { const [r,c] = button.dataset.deleteCard.split(",").map(Number); if (page.rows[r].cards.length === 1) return; page.rows[r].cards.splice(c,1); this._touch(); }));
    this.querySelectorAll("[data-move-card]").forEach((button) => button.addEventListener("click", () => { const [r,c,d] = button.dataset.moveCard.split(",").map(Number); this._move(page.rows[r].cards,c,d); }));
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, MiniDisplayDashboardCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, MiniDisplayDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Home Assistant Mini-Display",
  description: "Configure and preview a physical Mini-Display",
  preview: true,
});
