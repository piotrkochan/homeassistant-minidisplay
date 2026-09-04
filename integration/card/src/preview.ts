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
    :host{display:block;width:240px;max-width:100%}.screen-frame{position:relative;width:100%;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.22)}.screen{position:absolute;inset:0;box-sizing:border-box;padding:6px;background:#090b10;color:white;display:flex;flex-direction:column;gap:4px;overflow:hidden}.page-content{position:absolute;display:flex;flex-direction:column;gap:4px}.page-title{position:absolute;z-index:2;display:flex;align-items:center;justify-content:center;overflow:hidden;font-family:sans-serif;font-weight:700;white-space:nowrap}.page-title.top{top:0;right:0;left:0}.page-title.bottom{right:0;bottom:0;left:0}.page-title.left,.page-title.right{top:0;bottom:0}.page-title.left{left:0}.page-title.right{right:0}.page-title.left span{transform:rotate(-90deg)}.page-title.right span{transform:rotate(90deg)}
    .loading{background:linear-gradient(110deg,#090b10 30%,#181c24 45%,#090b10 60%);background-size:220% 100%;animation:loading 1.4s linear infinite}h3{font:700 13px sans-serif;text-align:center;margin:0}.row{display:grid;gap:4px;min-height:0;flex:1}.group{display:flex;flex-direction:column;min-height:0}.title{font:9px sans-serif;color:#aaa}.card{position:relative;min-width:0;background:#20242d;border-radius:6px;overflow:hidden}.card small,.value-wrap{position:absolute;display:flex;min-width:0;min-height:0}.card small{z-index:2;height:auto;font:9px sans-serif;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.value-wrap{z-index:1}.value{max-width:100%;font:700 14px sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bar{position:absolute;right:5px;bottom:5px;left:5px;height:4px;background:#3d424e;border-radius:2px}.bar i{display:block;height:100%;background:#42a5f5;border-radius:2px}.ring{position:absolute;bottom:5px;left:50%;width:42px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;transform:translateX(-50%)}.ring:after{content:"";width:30px;aspect-ratio:1;border-radius:50%;background:var(--ring-bg,#20242d)}
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
    const rows = page.rows.filter(row => visibilityMatches(this.hass, row.visibility)).map(row => ({ ...row, cards: row.cards.filter(card => visibilityMatches(this.hass, card.visibility, card)) })).filter(row => row.cards.length > 0);
    if (rows.length === 0) return html`<div class="screen-frame" style=${screenStyle}><div class="screen"><div class="card"><div class="value">No visible content</div></div></div></div>`;
    const showPageTitle = Boolean(page.title && page.showTitle !== false);
    const titlePosition = page.titlePosition ?? "top";
    const pageBackgroundValue = page.style?.background ?? "";
    const pageBackground = (displayColors[pageBackgroundValue] ?? pageBackgroundValue) || "#000000";
    const titleBackgroundValue = page.titleStyle?.background ?? "";
    const titleForegroundValue = page.titleStyle?.foreground ?? "";
    const titleBackground = (displayColors[titleBackgroundValue] ?? titleBackgroundValue) || pageBackground;
    const titleForeground = (displayColors[titleForegroundValue] ?? titleForegroundValue) || "#ffffff";
    const titleSize = page.titleStyle?.fontSize ?? "small";
    const titleThickness = { small: 21, medium: 29, large: 40, xlarge: 52, auto: 21 }[titleSize];
    const titleFontSize = { small: 13, medium: 17, large: 25, xlarge: 32, auto: 13 }[titleSize];
    const contentStyle = !showPageTitle ? "inset:6px" : titlePosition === "top" ? `top:${titleThickness + 6}px;right:6px;bottom:6px;left:6px` : titlePosition === "bottom" ? `top:6px;right:6px;bottom:${titleThickness + 6}px;left:6px` : titlePosition === "left" ? `top:6px;right:6px;bottom:6px;left:${titleThickness + 6}px` : `top:6px;right:${titleThickness + 6}px;bottom:6px;left:6px`;
    const titleStyle = `${titlePosition === "top" || titlePosition === "bottom" ? `height:${titleThickness}px` : `width:${titleThickness}px`};background:${titleBackground};color:${titleForeground};font-size:${titleFontSize}px`;
    return html`<div class="screen-frame" style=${screenStyle}><div class="screen" style=${`background:${pageBackground}`}>${showPageTitle ? html`<div class="page-title ${titlePosition}" style=${titleStyle}><span>${page.title}</span></div>` : null}<div class="page-content" style=${contentStyle}>${rows.map(row => html`<div class="group" style="flex:${row.weight ?? 1}">${row.title && row.showTitle !== false ? html`<div class="title">${row.title}</div>` : null}<div class="row" style="grid-template-columns:repeat(${row.cards.length},minmax(0,1fr))">${row.cards.map(card => {
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
      const titleHorizontal = { left: "flex-start", center: "center", right: "flex-end" }[card.titleStyle?.horizontalAlign ?? "left"];
      const titleVertical = { top: "flex-start", middle: "center", bottom: "flex-end" }[card.titleStyle?.verticalAlign ?? "top"];
      const contentBottom = card.progress && card.progress !== "none" ? 14 : 5;
      const contentArea = `top:5px;right:5px;bottom:${contentBottom}px;left:5px`;
      return html`<div class="card" style=${`background:${background};color:${foreground}`}>${card.title ? html`<small style=${`${contentArea};align-items:${titleVertical};justify-content:${titleHorizontal};text-align:${card.titleStyle?.horizontalAlign ?? "left"}`}>${card.title}</small>` : null}<div class="value-wrap" style=${`${contentArea};align-items:${vertical};justify-content:${horizontal};text-align:${textAlign}`}><div class="value" style=${`font-family:${family};font-size:${size}px;font-weight:${card.valueStyle?.fontFamily === "sans-bold" ? 700 : 600}`}>${this.cardValue(card)}</div></div>${card.progress === "bar" ? html`<div class="bar"><i style=${`width:${progress}%;background:${accent}`}></i></div>` : card.progress === "ring" ? html`<div class="ring" style=${`background:conic-gradient(${accent} ${progress}%,#3d424e 0);--ring-bg:${background}`}></div>` : null}</div>`;
    })}</div></div>`)}</div></div></div>`;
  }
}

if (!customElements.get("mini-display-preview")) {
  customElements.define("mini-display-preview", MiniDisplayPreview);
}
