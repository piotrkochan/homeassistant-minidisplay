import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Dashboard, Hass } from "./types";

@customElement("mini-display-preview")
export class MiniDisplayPreview extends LitElement {
  @property({ attribute: false }) dashboard?: Dashboard;
  @property({ attribute: false }) hass?: Hass;
  @property({ type: Number }) page = 0;

  static styles = css`
    :host{display:block}.screen{box-sizing:border-box;width:240px;height:240px;padding:6px;background:#090b10;color:white;border-radius:10px;display:flex;flex-direction:column;gap:4px;overflow:hidden}
    h3{font:700 13px sans-serif;text-align:center;margin:0}.row{display:grid;gap:4px;min-height:0;flex:1}.group{display:flex;flex-direction:column;min-height:0}.title{font:9px sans-serif;color:#aaa}.card{min-width:0;padding:5px;background:#20242d;border-radius:6px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}.card small{font:9px sans-serif;color:#bbb}.value{font:700 14px sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bar{height:4px;background:#3d424e;border-radius:2px}.bar i{display:block;height:100%;background:#42a5f5}
  `;

  render() {
    const page = this.dashboard?.pages[this.page];
    if (!page) return html`<div class="screen">No dashboard</div>`;
    return html`<div class="screen">${page.title ? html`<h3>${page.title}</h3>` : null}${page.rows.map(row => html`<div class="group" style="flex:${row.weight ?? 1}">${row.title && row.showTitle !== false ? html`<div class="title">${row.title}</div>` : null}<div class="row" style="grid-template-columns:repeat(${row.cards.length},minmax(0,1fr))">${row.cards.map(card => {
      const raw = card.source ? this.hass?.states[card.source]?.state ?? "—" : card.type === "clock" ? new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : card.text ?? "—";
      const numeric = Number(raw); const min = card.minimum ?? 0; const max = card.maximum ?? 100; const progress = Number.isFinite(numeric) && max > min ? Math.max(0,Math.min(100,(numeric-min)/(max-min)*100)) : 0;
      return html`<div class="card" style=${`background:${card.style?.background ?? "#20242d"};color:${card.style?.foreground ?? "white"}`}><small>${card.title ?? ""}</small><div class="value">${raw}${card.unit ? ` ${card.unit}` : ""}</div>${card.progress && card.progress !== "none" ? html`<div class="bar"><i style=${`width:${progress}%;background:${card.style?.accent ?? "#42a5f5"}`}></i></div>` : null}</div>`;
    })}</div></div>`)}</div>`;
  }
}
