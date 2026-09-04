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
  @property() displayId = "";
  @property({ type: Boolean }) interactive = false;
  @property({ type: Boolean }) showHidden = false;
  @state() private now = new Date();
  @state() private autoPage = 0;
  @state() private dragging?: { kind: "value" | "title" | "page-title"; row?: number; card?: number; label: string };
  @state() private dragTarget = "";
  @state() private dragPoint = { x: 0, y: 0 };
  private clockTimer?: number;
  private pageShownAt = Date.now();
  private measureContext?: CanvasRenderingContext2D | null;
  private pointerCandidate?: { pointerId: number; startX: number; startY: number; kind: "value" | "title" | "page-title"; row?: number; card?: number; label: string; cardElement?: HTMLElement };
  private suppressClickUntil = 0;

  static styles = css`
    :host{display:block;width:240px;max-width:100%}.screen-frame{position:relative;width:100%;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.22)}.screen{position:absolute;inset:0;box-sizing:border-box;padding:6px;background:#090b10;color:white;display:flex;flex-direction:column;gap:4px;overflow:hidden}.page-content{position:absolute;display:flex;flex-direction:column;gap:4px}.page-title{position:absolute;z-index:2;display:flex;align-items:center;justify-content:center;overflow:hidden;font-family:sans-serif;font-weight:700;white-space:nowrap}.page-title.interactive,.card.interactive,.title.interactive{cursor:pointer}.page-title.interactive span,.card-label,.value{cursor:grab}.page-title.interactive span:active,.card-label:active,.value:active{cursor:grabbing}.page-title.top{top:0;right:0;left:0}.page-title.bottom{right:0;bottom:0;left:0}.page-title.left,.page-title.right{top:0;bottom:0}.page-title.left{left:0}.page-title.right{right:0}.page-title.left span{transform:rotate(-90deg)}.page-title.right span{transform:rotate(90deg)}
    .loading{background:linear-gradient(110deg,#090b10 30%,#181c24 45%,#090b10 60%);background-size:220% 100%;animation:loading 1.4s linear infinite}h3{font:700 13px sans-serif;text-align:center;margin:0}.row{display:grid;gap:4px;min-height:0;flex:1}.group{display:flex;flex-direction:column;min-height:0}.title{font:9px sans-serif;color:#aaa}.card{position:relative;min-width:0;background:#20242d;border-radius:6px;overflow:hidden}.card small,.value-wrap{position:absolute;display:flex;min-width:0;min-height:0;pointer-events:none}.card small{z-index:2;height:auto;font:9px sans-serif;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.card-label,.value{pointer-events:auto}.value-wrap{z-index:1}.value{max-width:100%;font:700 14px sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hidden-item{opacity:.48;outline:1px dashed rgba(255,255,255,.85);outline-offset:-2px}.hidden-item.card{background-image:repeating-linear-gradient(135deg,transparent 0,transparent 7px,rgba(255,255,255,.08) 7px,rgba(255,255,255,.08) 9px)}.drop-grid{position:absolute;inset:3px;z-index:8;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:2px;padding:2px;background:rgba(0,0,0,.24);border:1px dashed rgba(255,255,255,.7);border-radius:5px}.drop-cell{display:grid;place-items:center;min-width:0;min-height:0;background:rgba(255,255,255,.08);border:1px solid transparent;border-radius:3px}.drop-cell::after{content:"";width:5px;height:5px;background:rgba(255,255,255,.58);border-radius:50%}.drop-cell.active{background:rgba(3,169,244,.38);border-color:#29b6f6}.drop-cell.active::after{background:white}.page-dropzones{position:absolute;inset:0;z-index:10;pointer-events:none}.page-dropzone{position:absolute;display:grid;place-items:center;color:white;background:rgba(0,0,0,.45);border:1px dashed rgba(255,255,255,.75);pointer-events:auto}.page-dropzone ha-icon{width:18px;height:18px}.page-dropzone.active{background:rgba(3,169,244,.58);border-color:#4fc3f7}.page-dropzone.top,.page-dropzone.bottom{right:18%;left:18%;height:25%}.page-dropzone.top{top:3px}.page-dropzone.bottom{bottom:3px}.page-dropzone.left,.page-dropzone.right{top:26%;bottom:26%;width:25%}.page-dropzone.left{left:3px}.page-dropzone.right{right:3px}.bar{position:absolute;right:5px;bottom:5px;left:5px;height:4px;background:#3d424e;border-radius:2px}.bar i{display:block;height:100%;background:#42a5f5;border-radius:2px}.ring-stack{position:absolute;inset:5px;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;pointer-events:none}.ring{width:min(42px,calc(100% - 8px));max-height:calc(100% - 18px);aspect-ratio:1;border-radius:50%;flex:0 1 auto}.ring:after{content:"";display:block;width:72%;aspect-ratio:1;margin:14%;border-radius:50%;background:var(--ring-bg,#20242d)}.ring-stack .value{flex:none;pointer-events:auto}
    .page-title.interactive span,.card-label,.value{touch-action:none;user-select:none}.drag-ghost{position:fixed;z-index:10000;max-width:180px;padding:6px 10px;color:white;background:rgba(30,34,42,.94);border:1px solid #4fc3f7;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.4);font:600 13px sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;transform:translate(-50%,-50%)}
    @keyframes loading{to{background-position:-220% 0}}@media(prefers-reduced-motion:reduce){.loading{animation:none}.drag-ghost{box-shadow:none}}
  `;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerdown", this.pointerDown);
    this.addEventListener("click", this.preventClickAfterDrag, true);
    window.addEventListener("pointermove", this.pointerMove, { passive: false });
    window.addEventListener("pointerup", this.pointerUp, true);
    window.addEventListener("pointercancel", this.pointerCancel, true);
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
  disconnectedCallback() {
    window.clearInterval(this.clockTimer);
    this.removeEventListener("pointerdown", this.pointerDown);
    this.removeEventListener("click", this.preventClickAfterDrag, true);
    window.removeEventListener("pointermove", this.pointerMove);
    window.removeEventListener("pointerup", this.pointerUp, true);
    window.removeEventListener("pointercancel", this.pointerCancel, true);
    super.disconnectedCallback();
  }

  private emit(type: string, detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(type, { detail: { displayId: this.displayId, page: this.autoRotate ? this.autoPage : this.page, ...detail }, bubbles: true, composed: true }));
  }

  private clickSelect(event: Event, detail: Record<string, unknown>) {
    event.stopPropagation();
    if (Date.now() < this.suppressClickUntil) return;
    this.emit("preview-select", detail);
  }

  private readonly preventClickAfterDrag = (event: Event) => {
    if (Date.now() >= this.suppressClickUntil) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  private readonly pointerDown = (event: PointerEvent) => {
    if (!this.interactive) return;
    const path = event.composedPath().filter((item): item is HTMLElement => item instanceof HTMLElement);
    const handle = path.find((item) => item.matches?.(".card-label,.value,.page-title span"));
    if (!handle) return;
    if (handle.matches(".page-title span")) {
      this.startPointer(event, { kind: "page-title", label: handle.textContent?.trim() || "Page title" });
      return;
    }
    const cardElement = path.find((item) => item.classList?.contains("card"));
    const groupElement = path.find((item) => item.classList?.contains("group"));
    if (!cardElement || !groupElement) return;
    const groups = Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>(".group") ?? []);
    const cards = Array.from(groupElement.querySelectorAll<HTMLElement>(".card"));
    const visibleRow = groups.indexOf(groupElement);
    const visibleCard = cards.indexOf(cardElement);
    const page = this.dashboard?.pages[this.autoRotate ? this.autoPage : this.page];
    if (!page || visibleRow < 0 || visibleCard < 0) return;
    const renderedRows = page.rows.map((row, rowIndex) => {
      const rowVisible = visibilityMatches(this.hass, row.visibility);
      const renderedCards = row.cards.map((card, cardIndex) => ({ cardIndex, hidden: !rowVisible || !visibilityMatches(this.hass, card.visibility, card) })).filter(({ hidden }) => this.showHidden || !hidden);
      return { rowIndex, cards: renderedCards };
    }).filter(({ cards: renderedCards }) => renderedCards.length > 0);
    const rowIndex = renderedRows[visibleRow]?.rowIndex;
    const cardIndex = renderedRows[visibleRow]?.cards[visibleCard]?.cardIndex;
    if (rowIndex === undefined || cardIndex === undefined) return;
    this.startPointer(event, {
      kind: handle.classList.contains("card-label") ? "title" : "value",
      row: rowIndex,
      card: cardIndex,
      label: handle.textContent?.trim() || (handle.classList.contains("card-label") ? "Title" : "Value"),
    }, cardElement);
  };

  private startPointer(event: PointerEvent, dragging: NonNullable<MiniDisplayPreview["dragging"]>, cardElement?: HTMLElement) {
    if (!this.interactive || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    this.pointerCandidate = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, ...dragging, cardElement };
  }

  private startDrag(event: DragEvent, _dragging?: unknown) { event.preventDefault(); }

  private readonly pointerMove = (event: PointerEvent) => {
    const candidate = this.pointerCandidate;
    if (!candidate || candidate.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - candidate.startX, event.clientY - candidate.startY);
    if (!this.dragging && distance < 5) return;
    event.preventDefault();
    if (!this.dragging) this.dragging = { kind: candidate.kind, row: candidate.row, card: candidate.card, label: candidate.label };
    this.dragPoint = { x: event.clientX, y: event.clientY };
    const screen = this.shadowRoot?.querySelector<HTMLElement>(".screen");
    if (!screen) return;
    const screenRect = screen.getBoundingClientRect();
    if (event.clientX < screenRect.left || event.clientX > screenRect.right || event.clientY < screenRect.top || event.clientY > screenRect.bottom) {
      this.dragTarget = "";
      return;
    }
    if (candidate.kind === "page-title") {
      const distances = [
        { target: "top", value: event.clientY - screenRect.top },
        { target: "right", value: screenRect.right - event.clientX },
        { target: "bottom", value: screenRect.bottom - event.clientY },
        { target: "left", value: event.clientX - screenRect.left },
      ];
      this.dragTarget = distances.reduce((closest, item) => item.value < closest.value ? item : closest).target;
      return;
    }
    const card = candidate.cardElement;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      this.dragTarget = "";
      return;
    }
    const horizontal = ["left", "center", "right"][Math.min(2, Math.floor((event.clientX - rect.left) / (rect.width / 3)))];
    const vertical = ["top", "middle", "bottom"][Math.min(2, Math.floor((event.clientY - rect.top) / (rect.height / 3)))];
    this.dragTarget = `${horizontal}-${vertical}`;
  };

  private readonly pointerUp = (event: PointerEvent) => {
    const candidate = this.pointerCandidate;
    if (!candidate || candidate.pointerId !== event.pointerId) return;
    if (this.dragging) {
      event.preventDefault();
      event.stopPropagation();
      if (candidate.kind === "page-title" && ["top", "right", "bottom", "left"].includes(this.dragTarget)) {
        this.emit("preview-position", { kind: "page-title", position: this.dragTarget });
      } else {
        const [horizontalAlign, verticalAlign] = this.dragTarget.split("-");
        if (["left", "center", "right"].includes(horizontalAlign) && ["top", "middle", "bottom"].includes(verticalAlign)) {
          this.emit("preview-position", { kind: candidate.kind, row: candidate.row, card: candidate.card, horizontalAlign, verticalAlign });
        }
      }
      this.suppressClickUntil = Date.now() + 350;
    } else {
      this.emit("preview-select", { kind: candidate.kind, row: candidate.row, card: candidate.card });
      this.suppressClickUntil = Date.now() + 100;
    }
    this.stopDrag();
  };

  private readonly pointerCancel = (event: PointerEvent) => {
    if (this.pointerCandidate?.pointerId === event.pointerId) this.stopDrag();
  };

  private stopDrag() {
    this.pointerCandidate = undefined;
    this.dragging = undefined;
    this.dragTarget = "";
  }

  private positionGrid(row: number, card: number) {
    if (!this.dragging || this.dragging.kind === "page-title" || this.dragging.row !== row || this.dragging.card !== card) return null;
    const horizontal = ["left", "center", "right"] as const;
    const vertical = ["top", "middle", "bottom"] as const;
    return html`<div class="drop-grid" aria-label="Choose text position">${vertical.flatMap((v) => horizontal.map((h) => {
      const key = `${h}-${v}`;
      return html`<div class="drop-cell ${this.dragTarget === key ? "active" : ""}"></div>`;
    }))}</div>`;
  }

  private pageDropzones() {
    const ghost = this.dragging ? html`<div class="drag-ghost" style=${`left:${this.dragPoint.x}px;top:${this.dragPoint.y}px`}>${this.dragging.label}</div>` : null;
    if (this.dragging?.kind !== "page-title") return ghost;
    const positions = ["top", "right", "bottom", "left"] as const;
    const icons = { top: "mdi:arrow-up", right: "mdi:arrow-right", bottom: "mdi:arrow-down", left: "mdi:arrow-left" };
    return html`${ghost}<div class="page-dropzones">${positions.map((position) => html`<div class="page-dropzone ${position} ${this.dragTarget === position ? "active" : ""}"><ha-icon icon=${icons[position]}></ha-icon></div>`)}</div>`;
  }

  private cardValue(card: Dashboard["pages"][number]["rows"][number]["cards"][number]) {
    if (card.type === "clock") return this.now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: card.showSeconds ? "2-digit" : undefined, hour12: card.format === "12h" });
    const raw = card.source ? this.hass?.states[card.source]?.state ?? "—" : card.text ?? "—";
    if (card.type === "status") return ["on", "true", "1", "open", "home"].includes(raw.toLowerCase()) ? card.onText ?? "On" : card.offText ?? "Off";
    const mapped = mapCardValue(card, raw);
    return `${mapped.value}${!mapped.mapped && card.unit ? ` ${card.unit}` : ""}`;
  }

  private valueFontSize(card: Dashboard["pages"][number]["rows"][number]["cards"][number], value: string, width: number, height: number) {
    // Adafruit GFX font names use point sizes. At the display's pixel density,
    // their browser equivalents are approximately 2 CSS pixels per point.
    const sizes = [18, 24, 36, 48];
    const lineHeights = [22, 29, 42, 56];
    const requested = card.valueStyle?.fontSize ?? "auto";
    let index = requested === "small" ? 0 : requested === "medium" ? 1 : requested === "large" ? 2 : requested === "xlarge" ? 3 : height >= 58 ? 3 : height >= 42 ? 2 : height >= 28 ? 1 : 0;
    const family = { sans: "sans-serif", "sans-bold": "sans-serif", mono: "monospace", serif: "serif" }[card.valueStyle?.fontFamily ?? "sans"];
    this.measureContext ??= document.createElement("canvas").getContext("2d");
    while (index > 0) {
      if (lineHeights[index] <= height) {
        if (!this.measureContext) break;
        this.measureContext.font = `${card.valueStyle?.fontFamily === "sans-bold" ? 700 : 400} ${sizes[index]}px ${family}`;
        if (this.measureContext.measureText(value).width <= width - 6) break;
      }
      index -= 1;
    }
    return sizes[index];
  }

  render() {
    const page = this.dashboard?.pages[this.autoRotate ? this.autoPage : this.page];
    const screenStyle = `aspect-ratio:${Math.max(1, this.width)}/${Math.max(1, this.height)}`;
    if (!page) return html`<div class="screen-frame" style=${screenStyle}><div class="screen loading" aria-label="Loading display preview"></div></div>`;
    const rows = page.rows.map((row, rowIndex) => {
      const rowVisible = visibilityMatches(this.hass, row.visibility);
      const cards = row.cards.map((card, cardIndex) => ({
        card,
        cardIndex,
        hidden: !rowVisible || !visibilityMatches(this.hass, card.visibility, card),
      })).filter(({ hidden }) => this.showHidden || !hidden);
      return { row, rowIndex, hidden: !rowVisible, cards };
    }).filter(({ cards }) => cards.length > 0);
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
    const horizontalTitle = showPageTitle && (titlePosition === "top" || titlePosition === "bottom") ? titleThickness : 0;
    const verticalTitle = showPageTitle && (titlePosition === "left" || titlePosition === "right") ? titleThickness : 0;
    const contentWidth = this.width - 12 - verticalTitle;
    const availableRowsHeight = this.height - 12 - horizontalTitle - 4 * Math.max(0, rows.length - 1);
    const totalWeight = rows.reduce((sum, item) => sum + (item.row.weight ?? 1), 0) || 1;
    const contentStyle = !showPageTitle ? "inset:6px" : titlePosition === "top" ? `top:${titleThickness + 6}px;right:6px;bottom:6px;left:6px` : titlePosition === "bottom" ? `top:6px;right:6px;bottom:${titleThickness + 6}px;left:6px` : titlePosition === "left" ? `top:6px;right:6px;bottom:6px;left:${titleThickness + 6}px` : `top:6px;right:${titleThickness + 6}px;bottom:6px;left:6px`;
    const titleStyle = `${titlePosition === "top" || titlePosition === "bottom" ? `height:${titleThickness}px` : `width:${titleThickness}px`};background:${titleBackground};color:${titleForeground};font-size:${titleFontSize}px`;
    return html`<div class="screen-frame" style=${screenStyle}><div class="screen" style=${`background:${pageBackground}`}>${showPageTitle ? html`<div class="page-title ${titlePosition} ${this.interactive ? "interactive" : ""}" style=${titleStyle} @click=${(event: Event) => { event.stopPropagation(); this.emit("preview-select", { kind: "page-title" }); }}><span .draggable=${this.interactive} @dragstart=${(event: DragEvent) => this.startDrag(event, { kind: "page-title" })} @dragend=${() => this.stopDrag()}>${page.title}</span></div>` : null}${this.pageDropzones()}<div class="page-content" style=${contentStyle}>${rows.map(({ row, rowIndex, hidden: rowHidden, cards }) => {
      const rowHeight = availableRowsHeight * (row.weight ?? 1) / totalWeight;
      const cardHeight = rowHeight - (row.title && row.showTitle !== false && rowHeight >= 24 ? 17 : 0);
      const cardWidth = (contentWidth - 4 * Math.max(0, cards.length - 1)) / cards.length;
      return html`<div class="group ${rowHidden ? "hidden-item" : ""}" style="flex:${row.weight ?? 1}">${row.title && row.showTitle !== false ? html`<div class="title ${this.interactive ? "interactive" : ""}" @click=${(event: Event) => { event.stopPropagation(); this.emit("preview-select", { kind: "row", row: rowIndex }); }}>${row.title}</div>` : null}<div class="row" style="grid-template-columns:repeat(${cards.length},minmax(0,1fr))">${cards.map(({ card, cardIndex, hidden }) => {
      const raw = card.source ? this.hass?.states[card.source]?.state ?? "—" : card.text ?? "—";
      const numeric = Number(raw); const min = card.minimum ?? 0; const max = card.maximum ?? 100; const progress = Number.isFinite(numeric) && max > min ? Math.max(0,Math.min(100,(numeric-min)/(max-min)*100)) : 0;
      const family = {sans:"sans-serif","sans-bold":"sans-serif",mono:"monospace",serif:"serif"}[card.valueStyle?.fontFamily ?? "sans"];
      const displayValue = this.cardValue(card);
      const valueHeight = card.progress === "ring" ? Math.min(22, Math.max(12, cardHeight / 4)) : cardHeight - (card.progress === "bar" ? 9 : 0);
      const size = this.valueFontSize(card, displayValue, cardWidth, valueHeight);
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
      const value = html`<div class="value" .draggable=${this.interactive} style=${`font-family:${family};font-size:${size}px;font-weight:${card.valueStyle?.fontFamily === "sans-bold" ? 700 : 600}`} @click=${(event: Event) => { event.stopPropagation(); this.emit("preview-select", { kind: "value", row: rowIndex, card: cardIndex }); }} @dragstart=${(event: DragEvent) => this.startDrag(event, { kind: "value", row: rowIndex, card: cardIndex })} @dragend=${() => this.stopDrag()}>${displayValue}</div>`;
      return html`<div class="card ${this.interactive ? "interactive" : ""} ${hidden && !rowHidden ? "hidden-item" : ""}" style=${`background:${background};color:${foreground}`} @click=${(event: Event) => { event.stopPropagation(); this.emit("preview-select", { kind: "card", row: rowIndex, card: cardIndex }); }}>${card.title ? html`<small style=${`${contentArea};align-items:${titleVertical};justify-content:${titleHorizontal};text-align:${card.titleStyle?.horizontalAlign ?? "left"}`}><span class="card-label" .draggable=${this.interactive} @click=${(event: Event) => { event.stopPropagation(); this.emit("preview-select", { kind: "title", row: rowIndex, card: cardIndex }); }} @dragstart=${(event: DragEvent) => this.startDrag(event, { kind: "title", row: rowIndex, card: cardIndex })} @dragend=${() => this.stopDrag()}>${card.title}</span></small>` : null}${card.progress === "ring" ? html`<div class="ring-stack"><div class="ring" style=${`background:conic-gradient(${accent} ${progress}%,#3d424e 0);--ring-bg:${background}`}></div>${value}</div>` : html`<div class="value-wrap" style=${`${contentArea};align-items:${vertical};justify-content:${horizontal};text-align:${textAlign}`}>${value}</div>`}${this.positionGrid(rowIndex, cardIndex)}${card.progress === "bar" ? html`<div class="bar"><i style=${`width:${progress}%;background:${accent}`}></i></div>` : null}</div>`;
    })}</div></div>`;})}</div></div></div>`;
  }
}

if (!customElements.get("mini-display-preview")) {
  customElements.define("mini-display-preview", MiniDisplayPreview);
}
