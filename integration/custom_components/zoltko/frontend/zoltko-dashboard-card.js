const CARD_TAG = "zoltko-dashboard-card";
const EDITOR_TAG = "zoltko-dashboard-card-editor";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

class ZoltkoDashboardCard extends HTMLElement {
  setConfig(config) {
    if (!config.config_entry_id) {
      throw new Error("Select a Zoltko display");
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
        type: "zoltko/dashboard/get",
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
    return `<div class="z-card">
      ${card.title ? `<small>${escapeHtml(card.title)}</small>` : ""}
      <strong>${escapeHtml(value)}</strong>
      ${card.progress && card.progress !== "none" ? `<div class="bar"><i style="width:${progress}%"></i></div>` : ""}
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
      <ha-card header="Zoltko">
        <style>
          .wrap{padding:16px}.screen{box-sizing:border-box;width:240px;height:240px;margin:auto;padding:6px;background:#090b10;color:#fff;border-radius:12px;display:flex;flex-direction:column;gap:4px;overflow:hidden}.empty{display:grid;place-items:center;text-align:center}.screen h3{font-size:13px;line-height:16px;text-align:center;margin:0}.screen section{min-height:0;display:flex;flex-direction:column}.screen section>label{font-size:9px;color:#aaa}.row{display:flex;gap:4px;min-height:0;flex:1}.z-card{background:#20242d;border-radius:6px;min-width:0;flex:1;padding:5px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}.z-card small{font-size:9px;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.z-card strong{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bar{height:4px;background:#3d424e;border-radius:2px;margin-top:4px}.bar i{display:block;height:100%;background:#42a5f5;border-radius:2px}
        </style>
        <div class="wrap">${preview}${this._error ? `<p>${escapeHtml(this._error)}</p>` : ""}</div>
      </ha-card>`;
  }
}

class ZoltkoDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
    this._loadDisplays();
  }

  set hass(hass) {
    this._hass = hass;
    this._loadDisplays();
  }

  async _loadDisplays() {
    if (!this._hass || !this._config) return;
    try {
      this._displays = await this._hass.callWS({ type: "zoltko/displays" });
      this._render();
    } catch (err) {
      this._error = String(err);
      this._render();
    }
  }

  async _loadDashboard() {
    const id = this._config?.config_entry_id;
    if (!this._hass || !id) return;
    try {
      const dashboard = await this._hass.callWS({
        type: "zoltko/dashboard/get",
        config_entry_id: id,
      });
      this._dashboardText = JSON.stringify(dashboard || {
        version: 1,
        pages: [{ id: "home", durationSeconds: 10, rows: [{ cards: [{ type: "clock" }] }] }],
      }, null, 2);
      this._error = "";
      this._render();
    } catch (err) {
      this._error = String(err);
      this._render();
    }
  }

  async _apply() {
    try {
      const dashboard = JSON.parse(this.querySelector("textarea").value);
      await this._hass.callWS({
        type: "zoltko/dashboard/set",
        config_entry_id: this._config.config_entry_id,
        dashboard,
      });
      this._dashboardText = JSON.stringify(dashboard, null, 2);
      this._error = "";
      this._message = "Dashboard accepted by display";
    } catch (err) {
      this._message = "";
      this._error = String(err);
    }
    this._render();
  }

  _changed(event) {
    const config = { ...this._config, config_entry_id: event.target.value };
    this._config = config;
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
    this.innerHTML = `
      <div style="display:grid;gap:8px">
        <label for="zoltko-display">Display</label>
        <select id="zoltko-display">
          <option value="">Select display</option>
          ${displays.map((display) => `<option value="${display.config_entry_id}" ${display.config_entry_id === this._config.config_entry_id ? "selected" : ""}>${display.title}${display.available ? "" : " (offline)"}</option>`).join("")}
        </select>
        ${this._config.config_entry_id ? `<label for="zoltko-json">Dashboard JSON</label><textarea id="zoltko-json" rows="18" style="font:12px monospace;width:100%;box-sizing:border-box">${escapeHtml(this._dashboardText || "")}</textarea><button id="zoltko-apply" type="button">Apply to display</button>` : ""}
        ${this._error ? `<div style="color:var(--error-color)">${escapeHtml(this._error)}</div>` : ""}
        ${this._message ? `<div style="color:var(--success-color)">${escapeHtml(this._message)}</div>` : ""}
        <small>Visual page, row, and card controls will replace the temporary JSON editor.</small>
      </div>`;
    this.querySelector("select")?.addEventListener("change", (event) => this._changed(event));
    this.querySelector("button")?.addEventListener("click", () => this._apply());
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, ZoltkoDashboardCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, ZoltkoDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Zoltko Dashboard Card",
  description: "Configure and preview a physical Zoltko display",
  preview: true,
});
