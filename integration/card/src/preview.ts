import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import type { Dashboard, Hass } from "./types";
import { mapCardColors, mapCardValue } from "./types";
import { visibilityMatches } from "./visibility";
import { displayColors } from "./color-field";

export class MiniDisplayPreview extends LitElement {
  @property({ attribute: false }) dashboard?: Dashboard;
  @property({ attribute: false }) hass?: Hass;
  @property({ type: Number }) page = 0;
  @property({ type: Boolean }) autoRotate = false;
  @property({ type: Number }) width = 240;
  @property({ type: Number }) height = 240;
  @state() private now = new Date();
  @state() private autoPage = 0;
  private clockTimer?: number;
  private pageShownAt = Date.now();

  static styles = css`
    :host{display:block;width:240px;max-width:100%}.screen-frame{position:relative;width:100%;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.22)}.screen{position:absolute;inset:0;box-sizing:border-box;padding:6px;background:#090b10;color:white;display:flex;flex-direction:column;gap:4px;overflow:hidden}
    .loading{background:linear-gradient(110deg,#090b10 30%,#181c24 45%,#090b10 60%);background-size:220% 100%;animation:loading 1.4s linear infinite}h3{font:700 13px sans-serif;text-align:center;margin:0}.row{display:grid;gap:4px;min-height:0;flex:1}.group{display:flex;flex-direction:column;min-height:0}.title{font:9px sans-serif;color:#aaa}.card{min-width:0;padding:5px;background:#20242d;border-radius:6px;display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden}.card small{font:9px sans-serif;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.value-wrap{display:flex;min-width:0;min-height:0}.value{max-width:100%;font:700 14px sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bar{height:4px;background:#3d424e;border-radius:2px;margin-top:4px}.bar i{display:block;height:100%;background:#42a5f5;border-radius:2px}.ring{width:42px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;margin:3px auto}.ring:after{content:"";width:30px;aspect-ratio:1;border-radius:50%;background:var(--ring-bg,#20242d)}
    @keyframes loading{to{background-position:-220% 0}}@media(prefers-reduced-motion:reduce){.loading{animation:none}}
  `;

  connectedCallback() {
    super.connectedCallback();
    this.clockTimer = window.setInterval(() => {
      this.now = new Date();
      const pages = this.dashboard?.pages ?? [];
      const duration = (pages[this.autoPage]?.durationSeconds ?? 10) * 1000;
      if (this.autoRotate && pages.length > 1 && Date.now() - this.pageShownAt >= duration) {
        this.autoPage = (this.autoPage + 1) % pages.length;
        this.pageShownAt = Date.now();
      }
    }, 1000);
  }
  disconnectedCallback() { window.clearInterval(this.clockTimer); super.disconnectedCallback(); }

  private cardValue(card: Dashboard["pages"][number]["rows"][number]["cards"][number]) {
    if (card.type === "clock") return this.now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: card.showSeconds ? "2-digit" : undefined, hour12: card.format === "12h" });
    const raw = card.source ? this.hass?.states[card.source]?.state ?? "—" : card.text ?? "—";
    if (card.type === "status") return ["on", "true", "1", "open", "home"].includes(raw.toLowerCase()) ? card.onText ?? "On" : card.offText ?? "Off";
    const mapped = mapCardValue(card, raw);
    return `${mapped.value}${!mapped.mapped && card.unit ? ` ${card.unit}` : ""}`;
  }

  render() {
    const page = this.dashboard?.pages[this.autoRotate ? this.autoPage : this.page];
    const screenStyle = `aspect-ratio:${Math.max(1, this.width)}/${Math.max(1, this.height)}`;
    if (!page) return html`<div class="screen-frame" style=${screenStyle}><div class="screen loading" aria-label="Loading display preview"></div></div>`;
    const rows = page.rows.filter(row => visibilityMatches(this.hass, row.visibility)).map(row => ({ ...row, cards: row.cards.filter(card => visibilityMatches(this.hass, card.visibility)) })).filter(row => row.cards.length > 0);
    if (rows.length === 0) return html`<div class="screen-frame" style=${screenStyle}><div class="screen"><div class="card"><div class="value">No visible content</div></div></div></div>`;
    return html`<div class="screen-frame" style=${screenStyle}><div class="screen">${page.title && page.showTitle !== false ? html`<h3>${page.title}</h3>` : null}${rows.map(row => html`<div class="group" style="flex:${row.weight ?? 1}">${row.title && row.showTitle !== false ? html`<div class="title">${row.title}</div>` : null}<div class="row" style="grid-template-columns:repeat(${row.cards.length},minmax(0,1fr))">${row.cards.map(card => {
      const raw = card.source ? this.hass?.states[card.source]?.state ?? "—" : card.text ?? "—";
      const numeric = Number(raw); const min = card.minimum ?? 0; const max = card.maximum ?? 100; const progress = Number.isFinite(numeric) && max > min ? Math.max(0,Math.min(100,(numeric-min)/(max-min)*100)) : 0;
      const family = {sans:"sans-serif","sans-bold":"sans-serif",mono:"monospace",serif:"serif"}[card.valueStyle?.fontFamily ?? "sans"];
      const size = {auto:14,small:10,medium:13,large:17,xlarge:22}[card.valueStyle?.fontSize ?? "auto"];
      const colorMapping = mapCardColors(card, raw);
      const backgroundValue = colorMapping?.background ?? card.style?.background ?? "";
      const foregroundValue = colorMapping?.foreground ?? card.style?.foreground ?? "";
      const background = (displayColors[backgroundValue] ?? backgroundValue) || "#20242d"; const accent = displayColors[card.style?.accent ?? ""] ?? card.style?.accent ?? "#42a5f5"; const foreground = (displayColors[foregroundValue] ?? foregroundValue) || "white";
      const horizontal = { left: "flex-start", center: "center", right: "flex-end" }[card.valueStyle?.horizontalAlign ?? "center"];
      const vertical = { top: "flex-start", middle: "center", bottom: "flex-end" }[card.valueStyle?.verticalAlign ?? "middle"];
      const textAlign = card.valueStyle?.horizontalAlign ?? "center";
      return html`<div class="card" style=${`background:${background};color:${foreground}`}><small>${card.title ?? ""}</small><div class="value-wrap" style=${`align-items:${vertical};justify-content:${horizontal};text-align:${textAlign}`}><div class="value" style=${`font-family:${family};font-size:${size}px;font-weight:${card.valueStyle?.fontFamily === "sans-bold" ? 700 : 600}`}>${this.cardValue(card)}</div></div>${card.progress === "bar" ? html`<div class="bar"><i style=${`width:${progress}%;background:${accent}`}></i></div>` : card.progress === "ring" ? html`<div class="ring" style=${`background:conic-gradient(${accent} ${progress}%,#3d424e 0);--ring-bg:${background}`}></div>` : null}</div>`;
    })}</div></div>`)}</div></div>`;
  }
}

if (!customElements.get("mini-display-preview")) {
  customElements.define("mini-display-preview", MiniDisplayPreview);
}
