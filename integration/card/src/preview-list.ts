import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Dashboard, Display, Hass } from "./types";
import "./preview";

const emit = (element: HTMLElement, type: string, detail: unknown) => {
  element.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
};

@customElement("mini-display-preview-list")
export class MiniDisplayPreviewList extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @property({ attribute: false }) displays: Display[] = [];
  @property({ attribute: false }) dashboards: Record<string, Dashboard | null> = {};
  @property({ attribute: false }) pages: Record<string, number> = {};
  @property({ attribute: false }) dirtyDisplays = new Set<string>();
  @property() selectedDisplayId = "";
  @property() selectedSceneId = "";
  @property() selectedSceneName = "";

  static styles = css`
    :host { display: grid; gap: 12px; max-height: calc(100vh - 120px); overflow-y: auto; position: sticky; top: 16px; font-family: var(--ha-font-family-body, Roboto, sans-serif); }
    h2 { margin: 0 2px; font-size: 16px; font-weight: 500; }
    ha-card { display: grid; gap: 10px; padding: 12px; border: 2px solid transparent; cursor: pointer; }
    ha-card.selected { border-color: var(--primary-color); }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    strong, small { display: block; }
    strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    small { margin-top: 3px; color: var(--secondary-text-color); }
    .icon { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; color: var(--secondary-text-color); background: transparent; border: 0; border-radius: 50%; cursor: pointer; }
    .icon:hover, .icon.active { color: var(--primary-color); background: var(--secondary-background-color); }
    mini-display-preview { margin: auto; }
    nav { display: flex; align-items: center; justify-content: center; gap: 4px; color: var(--secondary-text-color); font-size: 12px; }
    nav .icon { width: 32px; height: 32px; }
    ha-button { width: 100%; }
    @media(max-width:1100px) { :host { grid-column: 1/-1; grid-template-columns: repeat(auto-fit,minmax(272px,1fr)); max-height: none; overflow: visible; position: static; } h2 { grid-column: 1/-1; } }
    @media(max-width:700px) { :host { grid-column: auto; grid-template-columns: 1fr; } }
  `;

  render() {
    return html`
      <h2>Preview</h2>
      ${this.displays.map((display) => this.renderDisplay(display))}
    `;
  }

  private renderDisplay(display: Display) {
    const dashboard = this.dashboards[display.config_entry_id];
    const page = Math.min(this.pages[display.config_entry_id] ?? 0, Math.max(0, (dashboard?.pages.length ?? 1) - 1));
    const previewing = display.preview_scene_id === this.selectedSceneId;
    const active = display.active_scene_id === this.selectedSceneId;
    const canShow = Boolean(dashboard);

    return html`
      <ha-card
        class=${display.config_entry_id === this.selectedDisplayId ? "selected" : ""}
        @click=${() => emit(this, "display-selected", display.config_entry_id)}
      >
        <header>
          <div><strong>${display.title}</strong><small>Active: ${display.active_scene_name ?? "Unknown"}</small></div>
          <button
            class="icon ${previewing ? "active" : ""}"
            title=${previewing ? "Stop temporary preview" : !dashboard ? "Add a layout first" : "Show temporarily for 5 minutes"}
            aria-label=${previewing ? "Stop temporary preview" : "Show temporary preview"}
            ?disabled=${!previewing && !canShow}
            @click=${(event: Event) => { event.stopPropagation(); emit(this, "preview-toggle", display); }}
          >
            <ha-icon icon=${previewing ? "mdi:eye" : "mdi:eye-off-outline"}></ha-icon>
          </button>
        </header>
        ${dashboard ? html`
          <mini-display-preview .dashboard=${dashboard} .hass=${this.hass} .page=${page} .width=${display.width} .height=${display.height}></mini-display-preview>
          ${dashboard.pages.length > 1 ? html`
            <nav>
              <button class="icon" aria-label="Previous page" @click=${(event: Event) => { event.stopPropagation(); emit(this, "preview-page", { displayId: display.config_entry_id, delta: -1 }); }}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <span>${page + 1} / ${dashboard.pages.length}</span>
              <button class="icon" aria-label="Next page" @click=${(event: Event) => { event.stopPropagation(); emit(this, "preview-page", { displayId: display.config_entry_id, delta: 1 }); }}><ha-icon icon="mdi:chevron-right"></ha-icon></button>
            </nav>
          ` : nothing}
        ` : html`<ha-alert alert-type="info">No layout in this scene.</ha-alert>`}
        ${!active && dashboard ? html`<ha-button .disabled=${this.dirtyDisplays.has(display.config_entry_id)} @click=${(event: Event) => { event.stopPropagation(); emit(this, "scene-activate", display); }}>Activate ${this.selectedSceneName}</ha-button>` : nothing}
      </ha-card>
    `;
  }
}
