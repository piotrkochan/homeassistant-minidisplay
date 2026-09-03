import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Dashboard, Display, DisplayCard, DisplayRow, Hass, NumberColorMapping, NumberValueMapping, PageTransition, Scene, Style, TextColorMapping, TextValueMapping, Visibility } from "./types";
import { newCard, newDashboard, newPage, newRow } from "./types";
import "./preview";
import "./color-field";
import "./preview-list";
import "./scene-sidebar";
import "./visibility-dialog";

@customElement("mini-display-editor")
export class MiniDisplayEditor extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @state() private displays: Display[] = [];
  @state() private scenes: Scene[] = [];
  @state() private dashboards: Record<string, Dashboard | null> = {};
  @state() private savedDashboards: Record<string, Dashboard | null> = {};
  @state() private selectedDisplayId = "";
  @state() private selectedSceneId = "";
  @state() private pageIndex = 0;
  @state() private previewPages: Record<string, number> = {};
  @state() private selected?: { row: number; card: number };
  @state() private syncState: "idle" | "syncing" | "success" | "error" = "idle";
  @state() private syncMessage = "";
  @state() private loaded = false;
  @state() private sceneForm: "rename" | null = null;
  @state() private sceneName = "";
  @state() private dirtyDisplays = new Set<string>();
  @state() private visibilityTarget?: { kind: "row" | "card"; row: number; card?: number };
  @state() private confirmation?:
    | { kind: "delete-row"; row: number }
    | { kind: "leave"; href: string };
  private previewsStarted = new Set<string>();
  private draggedMapping?: { kind: "value" | "color"; index: number };
  private draggedCard?: { row: number; index: number };
  private allowNavigation = false;

  static styles = css`
    :host{display:block;color:var(--primary-text-color);font-family:var(--ha-font-family-body,Roboto,sans-serif)}*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}.layout{display:grid;grid-template-columns:220px minmax(420px,1fr) 288px;gap:16px;align-items:start;min-width:0}ha-card{overflow:hidden;border:1px solid var(--divider-color);box-shadow:var(--ha-card-box-shadow,none)}
    .section-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:52px;padding:10px 12px;border-bottom:1px solid var(--divider-color)}.section-heading h2{margin:0;font-size:16px;font-weight:500}.icon-button{display:inline-grid;place-items:center;width:40px;height:40px;padding:0;color:var(--primary-text-color);background:transparent;border:0;border-radius:50%}.icon-button:hover{background:var(--secondary-background-color)}.icon-button.danger{color:var(--error-color)}.icon-button:disabled{opacity:.35;cursor:default}
    .scene-list{display:grid;gap:4px;padding:8px}.scene-row{display:grid;grid-template-columns:minmax(0,1fr) 36px;gap:4px;align-items:center;border-radius:10px}.scene-row.active{background:var(--secondary-background-color)}.scene-select{display:flex;align-items:center;gap:10px;min-width:0;min-height:44px;padding:8px 10px;color:var(--primary-text-color);text-align:left;background:transparent;border:0;border-radius:10px}.scene-select ha-icon{color:var(--secondary-text-color)}.scene-row.active .scene-select ha-icon{color:var(--primary-color)}.scene-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .scene-menu,.menu{position:relative}.scene-menu>summary,.menu>summary{display:grid;place-items:center;width:36px;height:36px;list-style:none;cursor:pointer;border-radius:50%}.menu>summary{width:40px;height:40px}.scene-menu>summary::-webkit-details-marker,.menu>summary::-webkit-details-marker{display:none}.scene-menu>summary:hover,.menu>summary:hover{background:var(--card-background-color)}.scene-popover,.menu-popover{position:absolute;right:0;z-index:10;display:grid;width:150px;padding:6px;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:10px;box-shadow:var(--ha-card-box-shadow)}.menu-popover{width:160px}.scene-popover button,.menu-popover button{min-height:38px;padding:8px;color:var(--primary-text-color);text-align:left;background:transparent;border:0;border-radius:6px}.scene-popover button:hover,.menu-popover button:hover{background:var(--secondary-background-color)}.scene-popover .danger,.menu-popover .danger{color:var(--error-color)}
    .display-picker{display:grid;gap:8px;padding:12px;border-bottom:1px solid var(--divider-color)}.display-picker label{display:grid;gap:5px;color:var(--secondary-text-color);font-size:12px}.display-picker select{width:100%;min-height:40px;padding:8px;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px}.scene-form{display:grid;gap:10px;padding:12px;border-top:1px solid var(--divider-color)}.scene-form-actions{display:flex;justify-content:flex-end;gap:8px}.editor-card{min-width:0}.editor-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--divider-color)}.editor-title{min-width:0}.editor-title strong,.editor-title small{display:block}.editor-title strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.editor-title small{margin-top:2px;color:var(--secondary-text-color)}
    .save-area,.save-actions{display:flex;align-items:center;gap:8px}.save-area{flex-wrap:wrap;justify-content:flex-end}.sync{display:flex;align-items:center;gap:7px;min-height:20px;color:var(--secondary-text-color);font-size:12px;white-space:nowrap}.sync i{width:8px;height:8px;border-radius:50%;background:var(--disabled-text-color)}.sync.syncing i{background:var(--warning-color)}.sync.success i{background:var(--success-color)}.sync.error{color:var(--error-color)}.sync.error i{background:var(--error-color)}.editor-content{display:grid;gap:14px;padding:16px}
    .tabs,.card-tabs{display:flex;align-items:center;gap:6px;overflow-x:auto;padding:2px;scrollbar-width:thin}.tab{min-height:40px;padding:7px 12px;color:var(--primary-text-color);white-space:nowrap;background:var(--secondary-background-color);border:1px solid transparent;border-radius:9px}.card-tabs .tab{cursor:grab}.card-tabs .tab:active{cursor:grabbing}.tab.active{color:var(--text-primary-color);background:var(--primary-color)}.tab.dragging{opacity:.4}.page-settings,.row-panel,.card-settings{padding:12px;border:1px solid var(--divider-color);border-radius:12px}.page-settings[open],.card-settings{display:grid;gap:12px}.page-summary{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;font-weight:500}.page-summary::marker{content:""}.rows{display:grid;gap:12px}.row-panel{display:grid;gap:12px;background:color-mix(in srgb,var(--card-background-color),var(--primary-color) 2%)}
    .row-head,.card-head,.row-title{display:flex;align-items:center;gap:8px}.row-head,.card-head{justify-content:space-between}.row-title small{color:var(--secondary-text-color)}.card-settings{border-color:var(--primary-color);background:var(--card-background-color)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.grid>ha-form{grid-column:1/-1}.field{display:grid;gap:5px;color:var(--secondary-text-color);font-size:12px}.field input,.field select{width:100%;min-height:40px;padding:8px 11px;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px}.check{display:flex;align-items:center;gap:8px;color:var(--primary-text-color);font-size:14px}.check input{width:18px;height:18px}.hint{grid-column:1/-1;margin:0;color:var(--secondary-text-color);font-size:12px;line-height:1.5}.add-button{width:100%;min-height:42px;color:var(--primary-color);background:transparent;border:1px dashed var(--primary-color);border-radius:10px}.style{padding-top:4px}.style>summary{cursor:pointer}
    .previews{display:grid;gap:12px;max-height:calc(100vh - 120px);overflow-y:auto;padding-right:2px;position:sticky;top:16px}.preview-title{margin:0;padding:0 2px;font-size:16px;font-weight:500}.display-card{display:grid;gap:10px;padding:12px;border:2px solid transparent;transition:border-color 150ms ease,background-color 150ms ease;cursor:pointer}.display-card.selected{border-color:var(--primary-color)}.display-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.display-name{min-width:0}.display-name strong,.display-name small{display:block}.display-name strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.display-name small{margin-top:3px;color:var(--secondary-text-color)}.status{display:inline-flex;align-items:center;gap:5px;font-size:12px}.status i{width:7px;height:7px;border-radius:50%;background:var(--error-color)}.status.online i{background:var(--success-color)}.preview-eye.active{color:var(--primary-color);background:var(--secondary-background-color)}mini-display-preview{margin:0 auto}.preview-nav{display:flex;align-items:center;justify-content:center;gap:4px;color:var(--secondary-text-color);font-size:12px}.preview-nav .icon-button{width:32px;height:32px}.activate{width:100%}
    .condition-mark{display:inline-flex;align-items:center;gap:4px;color:var(--primary-color);font-size:12px}.condition-mark ha-icon{width:16px;height:16px}.modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.48)}.visibility-modal{width:min(620px,100%);max-height:min(760px,calc(100vh - 32px));overflow:auto}.confirm-modal{width:min(440px,100%)}.confirm-heading{display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid var(--divider-color)}.confirm-heading ha-icon{color:var(--warning-color)}.confirm-heading h2{margin:0;font-size:20px;font-weight:500}.modal-body{display:grid;gap:14px;padding:16px}.modal-copy{margin:0;color:var(--secondary-text-color);font-size:13px;line-height:1.5}.condition{display:grid;grid-template-columns:minmax(180px,1fr) 150px minmax(120px,.7fr) 40px;gap:8px;align-items:end;padding:12px;border:1px solid var(--divider-color);border-radius:10px}.condition ha-form{min-width:0}.condition .icon-button{align-self:center}.modal-actions{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--divider-color)}.danger-action{--mdc-theme-primary:var(--error-color);color:var(--error-color)}
    .mappings{display:grid;gap:10px;padding-top:4px}.mappings>summary{cursor:pointer}.mapping-list{display:grid;gap:8px;margin-top:10px}.mapping-rule{display:grid;grid-template-columns:28px 1fr 1fr 1.4fr 40px;gap:8px;align-items:end;padding:10px;border:1px solid var(--divider-color);border-radius:10px}.mapping-rule.text{grid-template-columns:28px 140px 1fr 1fr 40px}.mapping-rule.colors{grid-template-columns:28px 1fr 1fr 1.2fr 1.2fr 40px}.mapping-rule.colors.text{grid-template-columns:28px 130px 1fr 1.2fr 1.2fr 40px}.mapping-rule.dragging{opacity:.45}.drag-handle{align-self:center;display:grid;place-items:center;width:28px;height:40px;color:var(--secondary-text-color);cursor:grab}.drag-handle:active{cursor:grabbing}.mapping-copy{margin:0;color:var(--secondary-text-color);font-size:12px}
    .segmented-field,.position-field{display:grid;gap:7px}.segmented-field>span,.position-field>span{color:var(--secondary-text-color);font-size:12px}.segmented{display:flex;flex-wrap:wrap;gap:4px;padding:3px;background:var(--secondary-background-color);border-radius:10px}.segment{display:flex;flex:1;align-items:center;justify-content:center;gap:6px;min-width:68px;min-height:36px;padding:6px 9px;color:var(--primary-text-color);background:transparent;border:0;border-radius:7px}.segment:hover{background:color-mix(in srgb,var(--card-background-color),transparent 20%)}.segment.active{color:var(--text-primary-color);background:var(--primary-color)}.segment ha-icon{width:18px;height:18px}.position-field{grid-column:1/-1}.position-grid{display:grid;grid-template-columns:repeat(3,38px);grid-template-rows:repeat(3,34px);gap:4px;width:max-content;padding:5px;background:var(--secondary-background-color);border-radius:10px}.position-button{display:grid;place-items:center;padding:0;background:transparent;border:0;border-radius:6px}.position-button:hover{background:var(--card-background-color)}.position-button.active{background:var(--primary-color)}.position-dot{width:7px;height:7px;background:var(--secondary-text-color);border-radius:50%}.position-button.active .position-dot{background:var(--text-primary-color)}
    .transition-settings{padding:12px;border:1px solid var(--divider-color);border-radius:12px}.transition-settings[open]{display:grid;gap:14px}.transition-summary{cursor:pointer;font-weight:500}.transition-summary::marker{content:""}.effect-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.effect{display:grid;justify-items:center;gap:5px;min-height:68px;padding:9px;color:var(--primary-text-color);background:var(--secondary-background-color);border:1px solid transparent;border-radius:10px}.effect:hover{border-color:var(--primary-color)}.effect.active{color:var(--primary-color);border-color:var(--primary-color);background:color-mix(in srgb,var(--primary-color),transparent 90%)}.effect ha-icon{width:22px;height:22px}.transition-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .empty{display:grid;justify-items:center;gap:14px;padding:64px 24px;text-align:center}.empty ha-icon{width:56px;height:56px;color:var(--secondary-text-color)}.empty h2{margin:0;font-size:20px}.empty p{max-width:440px;margin:0;color:var(--secondary-text-color)}.loading{padding:48px;text-align:center;color:var(--secondary-text-color)}input:focus-visible,select:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
    @media(max-width:1100px){.layout{grid-template-columns:200px minmax(0,1fr)}.previews{grid-column:1/-1;grid-template-columns:repeat(auto-fit,minmax(272px,1fr));max-height:none;position:static;overflow:visible}.preview-title{grid-column:1/-1}}@media(max-width:700px){.layout{grid-template-columns:1fr}.scene-list{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.previews{grid-column:auto;grid-template-columns:1fr}.grid,.condition,.mapping-rule,.mapping-rule.text,.mapping-rule.colors,.mapping-rule.colors.text,.transition-options{grid-template-columns:1fr}.effect-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.drag-handle{display:none}.editor-heading{align-items:flex-start;flex-direction:column}.condition .icon-button,.mapping-rule .icon-button{justify-self:end}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
  `;

  updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && !this.loaded) void this.load();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("beforeunload", this.beforeUnload);
    window.addEventListener("click", this.interceptNavigation, true);
  }

  disconnectedCallback() {
    this.stopPanelPreviews();
    window.removeEventListener("beforeunload", this.beforeUnload);
    window.removeEventListener("click", this.interceptNavigation, true);
    super.disconnectedCallback();
  }

  private beforeUnload = (event: BeforeUnloadEvent) => {
    this.stopPanelPreviews();
    if (!this.dirtyDisplays.size || this.allowNavigation) return;
    event.preventDefault();
    event.returnValue = "";
  };

  private interceptNavigation = (event: MouseEvent) => {
    if (!this.dirtyDisplays.size || this.allowNavigation || event.defaultPrevented || event.button !== 0) return;
    const anchor = event.composedPath().find((item): item is HTMLAnchorElement => item instanceof HTMLAnchorElement);
    if (!anchor?.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.hash === window.location.hash) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.confirmation = { kind: "leave", href: destination.href };
  };

  private stopPanelPreviews() {
    if (!this.hass) return;
    const displayIds = new Set(this.previewsStarted);
    for (const display of this.displays) {
      if (display.preview_scene_id) displayIds.add(display.config_entry_id);
    }
    for (const displayId of displayIds) {
      void this.hass.callWS({ type: "mini_display/scene/preview/stop", config_entry_id: displayId });
    }
    this.previewsStarted.clear();
  }

  private get selectedDisplay() { return this.displays.find((item) => item.config_entry_id === this.selectedDisplayId); }
  private get selectedScene() { return this.scenes.find((item) => item.id === this.selectedSceneId); }
  private get dashboard() { return this.dashboards[this.selectedDisplayId]; }

  private errorMessage(error: unknown) {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === "object") {
      const value = error as { message?: unknown; code?: unknown };
      if (typeof value.message === "string") {
        return typeof value.code === "string" ? `${value.message} (${value.code})` : value.message;
      }
      try { return JSON.stringify(error); } catch { return "Unknown error"; }
    }
    return String(error);
  }

  private async load(preferredSceneId?: string) {
    if (!this.hass) return;
    this.loaded = true;
    try {
      const [displays, scenes] = await Promise.all([
        this.hass.callWS<Display[]>({ type: "mini_display/displays" }),
        this.hass.callWS<Scene[]>({ type: "mini_display/scenes" }),
      ]);
      this.displays = displays;
      this.scenes = scenes;
      if (!displays.some((item) => item.config_entry_id === this.selectedDisplayId)) this.selectedDisplayId = displays[0]?.config_entry_id ?? "";
      const active = this.selectedDisplay?.active_scene_id ?? scenes[0]?.id ?? "";
      const wanted = preferredSceneId ?? this.selectedSceneId;
      this.selectedSceneId = scenes.some((item) => item.id === wanted) ? wanted : active;
      await this.loadSceneDashboards();
      this.syncState = "idle";
      this.syncMessage = "";
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }

  private async loadSceneDashboards() {
    if (!this.hass || !this.selectedSceneId) { this.dashboards = {}; return; }
    const entries = await Promise.all(this.displays.map(async (display) => {
      const dashboard = await this.hass!.callWS<Dashboard | null>({ type: "mini_display/dashboard/get", config_entry_id: display.config_entry_id, scene_id: this.selectedSceneId });
      return [display.config_entry_id, dashboard] as const;
    }));
    this.dashboards = Object.fromEntries(entries);
    this.savedDashboards = structuredClone(this.dashboards);
    this.dirtyDisplays = new Set();
    this.previewPages = Object.fromEntries(this.displays.map((item) => [item.config_entry_id, 0]));
    this.pageIndex = 0;
    this.selected = { row: 0, card: 0 };
  }

  private async selectScene(sceneId: string) {
    if (sceneId === this.selectedSceneId) return;
    if (this.dirtyDisplays.size && !window.confirm("Discard unsaved changes and switch scene?")) return;
    this.stopPanelPreviews();
    this.displays = this.displays.map((item) => ({ ...item, preview_scene_id: null }));
    this.selectedSceneId = sceneId;
    this.syncState = "idle";
    this.syncMessage = "";
    await this.loadSceneDashboards();
  }

  private selectDisplay(displayId: string) {
    this.selectedDisplayId = displayId;
    this.pageIndex = this.previewPages[displayId] ?? 0;
    this.selected = { row: 0, card: 0 };
  }

  private changed() {
    if (!this.dashboard) return;
    this.stopPreviewFor(this.selectedDisplayId);
    this.dashboards = { ...this.dashboards, [this.selectedDisplayId]: structuredClone(this.dashboard) };
    this.dirtyDisplays = new Set(this.dirtyDisplays).add(this.selectedDisplayId);
    this.syncState = "idle";
    this.syncMessage = "Unsaved changes";
  }

  private async save() {
    if (!this.hass || !this.dashboard || !this.selectedDisplayId || !this.selectedSceneId) return;
    try {
      this.syncState = "syncing";
      this.syncMessage = "Saving";
      await this.hass.callWS({ type: "mini_display/dashboard/set", config_entry_id: this.selectedDisplayId, scene_id: this.selectedSceneId, dashboard: this.dashboard });
      this.savedDashboards = { ...this.savedDashboards, [this.selectedDisplayId]: structuredClone(this.dashboard) };
      const dirty = new Set(this.dirtyDisplays);
      dirty.delete(this.selectedDisplayId);
      this.dirtyDisplays = dirty;
      this.syncState = "success";
      this.syncMessage = "Saved";
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }

  private async showPage(index: number) {
    await this.stopPreviewFor(this.selectedDisplayId);
    this.pageIndex = index;
    this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: index };
    this.selected = { row: 0, card: 0 };
  }

  private discard() {
    const saved = this.savedDashboards[this.selectedDisplayId];
    if (saved === undefined) return;
    this.dashboards = {
      ...this.dashboards,
      [this.selectedDisplayId]: saved ? structuredClone(saved) : null,
    };
    const dirty = new Set(this.dirtyDisplays);
    dirty.delete(this.selectedDisplayId);
    this.dirtyDisplays = dirty;
    this.pageIndex = 0;
    this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: 0 };
    this.selected = { row: 0, card: 0 };
    this.syncState = "idle";
    this.syncMessage = "Changes discarded";
  }

  private async stopPreviewFor(displayId: string) {
    const display = this.displays.find((item) => item.config_entry_id === displayId);
    if (!this.hass || !display?.preview_scene_id) return;
    try {
      await this.hass.callWS({ type: "mini_display/scene/preview/stop", config_entry_id: displayId });
      this.previewsStarted.delete(displayId);
      this.displays = this.displays.map((item) => item.config_entry_id === displayId ? { ...item, preview_scene_id: null } : item);
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }

  private async activateScene(display: Display) {
    if (!this.hass) return;
    try {
      await this.hass.callWS({ type: "mini_display/scene/activate", config_entry_id: display.config_entry_id, scene_id: this.selectedSceneId });
      this.previewsStarted.delete(display.config_entry_id);
      this.displays = this.displays.map((item) => item.config_entry_id === display.config_entry_id ? { ...item, active_scene_id: this.selectedSceneId, active_scene_name: this.selectedScene?.name ?? null, preview_scene_id: null } : item);
      this.syncState = "success";
      this.syncMessage = "Scene activated";
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }

  private async togglePreview(display: Display) {
    if (!this.hass) return;
    const isPreviewing = display.preview_scene_id === this.selectedSceneId;
    try {
      if (isPreviewing) {
        await this.hass.callWS({ type: "mini_display/scene/preview/stop", config_entry_id: display.config_entry_id });
        this.previewsStarted.delete(display.config_entry_id);
      } else {
        const dashboard = this.dashboards[display.config_entry_id];
        const pageIndex = this.previewPages[display.config_entry_id] ?? 0;
        await this.hass.callWS({ type: "mini_display/scene/preview/start", config_entry_id: display.config_entry_id, scene_id: this.selectedSceneId, page_id: dashboard?.pages[pageIndex]?.id, dashboard });
        this.previewsStarted.add(display.config_entry_id);
      }
      this.displays = this.displays.map((item) => item.config_entry_id === display.config_entry_id ? { ...item, preview_scene_id: isPreviewing ? null : this.selectedSceneId } : item);
      this.syncState = "success";
      this.syncMessage = isPreviewing ? "Preview stopped" : "Preview shown for 5 minutes";
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }

  private async createScene() {
    if (!this.hass) return;
    if (this.dirtyDisplays.size && !window.confirm("Discard unsaved changes and create a scene?")) return;
    const existing = new Set(this.scenes.map((scene) => scene.name.toLocaleLowerCase()));
    let name = "New scene";
    let suffix = 1;
    while (existing.has(name.toLocaleLowerCase())) name = `New scene (${suffix++})`;
    try {
      const scene = await this.hass.callWS<Scene>({ type: "mini_display/scene/create", name });
      await this.load(scene.id);
      this.syncState = "success";
      this.syncMessage = "Scene created";
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }
  private openRenameScene() { this.sceneForm = "rename"; this.sceneName = this.selectedScene?.name ?? ""; }

  private async saveSceneForm() {
    const name = this.sceneName.trim();
    if (!this.hass || !name) return;
    try {
      if (this.sceneForm === "rename" && this.selectedSceneId) {
        await this.hass.callWS({ type: "mini_display/scene/rename", scene_id: this.selectedSceneId, name });
        this.sceneForm = null;
        await this.load(this.selectedSceneId);
      }
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }

  private async deleteScene() {
    if (!this.hass || this.selectedScene?.is_default || !window.confirm(`Delete scene "${this.selectedScene?.name}"?`)) return;
    try {
      await this.hass.callWS({ type: "mini_display/scene/delete", scene_id: this.selectedSceneId });
      await this.load(this.scenes.find((scene) => scene.is_default)?.id);
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }

  private async duplicateScene() {
    if (!this.hass || !this.selectedSceneId) return;
    try {
      const scene = await this.hass.callWS<Scene>({
        type: "mini_display/scene/duplicate",
        source_scene_id: this.selectedSceneId,
      });
      await this.load(scene.id);
      this.syncState = "success";
      this.syncMessage = "Scene duplicated";
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }

  private async setDefaultScene() {
    if (!this.hass || !this.selectedSceneId || this.selectedScene?.is_default) return;
    try {
      await this.hass.callWS({
        type: "mini_display/scene/default",
        scene_id: this.selectedSceneId,
      });
      await this.load(this.selectedSceneId);
      this.syncState = "success";
      this.syncMessage = "Default scene changed";
    } catch (error) {
      this.syncState = "error";
      this.syncMessage = this.errorMessage(error);
    }
  }

  private createLayout() {
    if (!this.selectedDisplayId || this.dashboard) return;
    this.dashboards = {
      ...this.dashboards,
      [this.selectedDisplayId]: newDashboard(),
    };
    this.pageIndex = 0;
    this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: 0 };
    this.selected = { row: 0, card: 0 };
    this.dirtyDisplays = new Set(this.dirtyDisplays).add(this.selectedDisplayId);
    this.syncState = "idle";
    this.syncMessage = "Unsaved changes";
  }

  private deletePage() {
    if (!this.dashboard || this.dashboard.pages.length <= 1) return;
    const page = this.dashboard.pages[this.pageIndex];
    if (!window.confirm(`Delete page "${page.title || page.id}"?`)) return;
    this.dashboard.pages.splice(this.pageIndex, 1);
    this.pageIndex = Math.min(this.pageIndex, this.dashboard.pages.length - 1);
    this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: this.pageIndex };
    this.selected = { row: 0, card: 0 };
    this.changed();
  }

  private visibilityObject(): DisplayRow | DisplayCard | undefined {
    if (!this.visibilityTarget || !this.dashboard) return undefined;
    const row = this.dashboard.pages[this.pageIndex]?.rows[this.visibilityTarget.row];
    if (!row) return undefined;
    return this.visibilityTarget.kind === "row" ? row : row.cards[this.visibilityTarget.card ?? -1];
  }

  private openVisibility(kind: "row" | "card", row: number, card?: number) {
    this.visibilityTarget = { kind, row, card };
  }

  private saveVisibility(visibility: Visibility) {
    const target = this.visibilityObject();
    if (!target) return;
    const conditions = visibility.conditions
      .map((condition) => ({ ...condition, entity: condition.entity.trim() }))
      .filter((condition) => condition.entity);
    if (conditions.length) target.visibility = { ...visibility, conditions };
    else delete target.visibility;
    this.visibilityTarget = undefined;
    this.changed();
  }

  private clearVisibility() {
    const target = this.visibilityObject();
    if (target) delete target.visibility;
    this.visibilityTarget = undefined;
    this.changed();
  }

  private requestDeleteRow(row: number) {
    this.confirmation = { kind: "delete-row", row };
  }

  private closeConfirmation() {
    this.confirmation = undefined;
  }

  private async confirmAction() {
    const confirmation = this.confirmation;
    this.confirmation = undefined;
    if (!confirmation) return;
    if (confirmation.kind === "delete-row") {
      const page = this.dashboard?.pages[this.pageIndex];
      if (!page || page.rows.length <= 1 || !page.rows[confirmation.row]) return;
      page.rows.splice(confirmation.row, 1);
      this.selected = undefined;
      this.changed();
      return;
    }
    this.allowNavigation = true;
    this.stopPanelPreviews();
    const destination = new URL(confirmation.href);
    if (destination.origin === window.location.origin) {
      history.pushState(null, "", `${destination.pathname}${destination.search}${destination.hash}`);
      window.dispatchEvent(new Event("location-changed"));
    } else {
      window.location.assign(destination.href);
    }
  }

  private async previewPage(displayId: string, delta: number) {
    await this.stopPreviewFor(displayId);
    const dashboard = this.dashboards[displayId];
    if (!dashboard) return;
    const current = this.previewPages[displayId] ?? 0;
    const next = (current + delta + dashboard.pages.length) % dashboard.pages.length;
    this.previewPages = { ...this.previewPages, [displayId]: next };
    if (displayId === this.selectedDisplayId) { this.pageIndex = next; this.selected = { row: 0, card: 0 }; }
  }

  private field(label: string, value: unknown, update: (value: string) => void, type = "text") {
    return html`<label class="field">${label}<input type=${type} .value=${String(value ?? "")} @input=${(event: Event) => update((event.target as HTMLInputElement).value)}></label>`;
  }

  private select(label: string, value: string, values: string[], update: (value: string) => void) {
    return html`<label class="field">${label}<select @change=${(event: Event) => update((event.target as HTMLSelectElement).value)}>${values.map((item) => html`<option value=${item} ?selected=${item === value}>${item}</option>`)}</select></label>`;
  }

  private checkbox(label: string, value: boolean, update: (value: boolean) => void) {
    return html`<label class="check"><input type="checkbox" .checked=${value} @change=${(event: Event) => update((event.target as HTMLInputElement).checked)}>${label}</label>`;
  }

  private segmented<T extends string>(label: string, value: T, options: { value: T; label: string; icon?: string }[], update: (value: T) => void) {
    return html`<div class="segmented-field"><span>${label}</span><div class="segmented" role="radiogroup" aria-label=${label}>${options.map((option) => html`<button class="segment ${option.value === value ? "active" : ""}" role="radio" aria-checked=${option.value === value} title=${option.label} @click=${() => update(option.value)}>${option.icon ? html`<ha-icon icon=${option.icon}></ha-icon>` : nothing}<span>${option.label}</span></button>`)}</div></div>`;
  }

  private textPosition(style: Style) {
    const horizontal = style.horizontalAlign ?? "center";
    const vertical = style.verticalAlign ?? "middle";
    const positions: { horizontal: NonNullable<Style["horizontalAlign"]>; vertical: NonNullable<Style["verticalAlign"]>; label: string }[] = [
      { horizontal: "left", vertical: "top", label: "Top left" },
      { horizontal: "center", vertical: "top", label: "Top center" },
      { horizontal: "right", vertical: "top", label: "Top right" },
      { horizontal: "left", vertical: "middle", label: "Middle left" },
      { horizontal: "center", vertical: "middle", label: "Center" },
      { horizontal: "right", vertical: "middle", label: "Middle right" },
      { horizontal: "left", vertical: "bottom", label: "Bottom left" },
      { horizontal: "center", vertical: "bottom", label: "Bottom center" },
      { horizontal: "right", vertical: "bottom", label: "Bottom right" },
    ];
    return html`<div class="position-field"><span>Text position</span><div class="position-grid" role="radiogroup" aria-label="Text position">${positions.map((position) => {
      const active = position.horizontal === horizontal && position.vertical === vertical;
      return html`<button class="position-button ${active ? "active" : ""}" role="radio" aria-checked=${active} aria-label=${position.label} title=${position.label} @click=${() => { style.horizontalAlign = position.horizontal; style.verticalAlign = position.vertical; this.changed(); }}><span class="position-dot"></span></button>`;
    })}</div></div>`;
  }

  private entity(card: DisplayCard) {
    const domains: Record<DisplayCard["type"], string[]> = { number: ["sensor", "number", "input_number", "counter"], status: ["binary_sensor", "switch", "input_boolean", "lock", "cover", "person", "device_tracker"], text: ["sensor", "text", "input_text", "select", "input_select"], clock: [] };
    return html`<ha-form .hass=${this.hass} .data=${{ entity: card.source ?? "" }} .schema=${[{ name: "entity", required: card.type !== "text", selector: { entity: { domain: domains[card.type] } } }]} .computeLabel=${() => card.type === "number" ? "Numeric entity" : card.type === "status" ? "State entity" : "Text entity (optional)"} @value-changed=${(event: CustomEvent) => { card.source = event.detail.value.entity; this.changed(); }}></ha-form>`;
  }

  private menu(items: unknown) { return html`<details class="menu"><summary aria-label="More actions"><ha-icon icon="mdi:dots-vertical"></ha-icon></summary><div class="menu-popover">${items}</div></details>`; }

  private styleEditor(card: DisplayCard) {
    const style = card.style ??= {};
    const value = card.valueStyle ??= {};
    return html`<details class="style"><summary>Appearance</summary><div class="grid"><mini-display-color-field label="Background" .value=${style.background ?? ""} @color-changed=${(event: CustomEvent<string>) => { style.background = event.detail || undefined; this.changed(); }}></mini-display-color-field><mini-display-color-field label="Text color" .value=${style.foreground ?? ""} @color-changed=${(event: CustomEvent<string>) => { style.foreground = event.detail || undefined; this.changed(); }}></mini-display-color-field><mini-display-color-field label="Accent" .value=${style.accent ?? ""} @color-changed=${(event: CustomEvent<string>) => { style.accent = event.detail || undefined; this.changed(); }}></mini-display-color-field>${this.select("Font", value.fontFamily ?? "sans", ["sans", "sans-bold", "mono", "serif"], (input) => { value.fontFamily = input as Style["fontFamily"]; this.changed(); })}${this.select("Font size", value.fontSize ?? "auto", ["auto", "small", "medium", "large", "xlarge"], (input) => { value.fontSize = input as Style["fontSize"]; this.changed(); })}${this.textPosition(value)}</div></details>`;
  }

  private transitionEditor(page: Dashboard["pages"][number]) {
    const transition = page.transition ?? { type: "none" as const };
    const set = (next: PageTransition) => { page.transition = next; this.changed(); };
    const patch = (values: Partial<PageTransition>) => set({ ...transition, ...values });
    const effects: { type: PageTransition["type"]; label: string; icon: string }[] = [
      { type: "none", label: "None", icon: "mdi:cancel" },
      { type: "random", label: "Random", icon: "mdi:shuffle-variant" },
      { type: "slide", label: "Slide", icon: "mdi:arrow-right-bold" },
      { type: "bounce", label: "Bounce", icon: "mdi:arrow-up-bold-circle-outline" },
      { type: "fade", label: "Fade", icon: "mdi:brightness-6" },
      { type: "wipe", label: "Wipe", icon: "mdi:transition-masked" },
      { type: "dissolve", label: "Dissolve", icon: "mdi:dots-grid" },
    ];
    const defaults = (type: PageTransition["type"]): PageTransition => type === "none" ? { type }
      : type === "random" ? { type, speed: "normal" }
      : type === "dissolve" ? { type, speed: "normal", tileSize: "medium" }
      : type === "fade" ? { type, speed: "normal", intensity: "strong" }
      : type === "bounce" ? { type, direction: "left", speed: "normal", intensity: "subtle" }
      : { type, direction: "left", speed: "normal" };
    const directions = [
      { value: "left" as const, label: "Left", icon: "mdi:arrow-left" },
      { value: "right" as const, label: "Right", icon: "mdi:arrow-right" },
      { value: "up" as const, label: "Up", icon: "mdi:arrow-up" },
      { value: "down" as const, label: "Down", icon: "mdi:arrow-down" },
    ];
    const speeds = [
      { value: "slow" as const, label: "Slow" },
      { value: "normal" as const, label: "Normal" },
      { value: "fast" as const, label: "Fast" },
    ];
    return html`<details class="transition-settings"><summary class="transition-summary">Transition to next page · ${effects.find((effect) => effect.type === transition.type)?.label ?? "None"}</summary><div class="effect-grid">${effects.map((effect) => html`<button class="effect ${transition.type === effect.type ? "active" : ""}" aria-pressed=${transition.type === effect.type} @click=${() => set(defaults(effect.type))}><ha-icon icon=${effect.icon}></ha-icon><span>${effect.label}</span></button>`)}</div>${transition.type !== "none" ? html`<div class="transition-options">${["slide", "bounce", "wipe"].includes(transition.type) ? this.segmented("Direction", transition.direction ?? "left", directions, (value) => patch({ direction: value })) : nothing}${this.segmented("Speed", transition.speed ?? "normal", speeds, (value) => patch({ speed: value }))}${["bounce", "fade"].includes(transition.type) ? this.segmented("Intensity", transition.intensity ?? "subtle", [{ value: "subtle" as const, label: "Subtle" }, { value: "strong" as const, label: "Strong" }], (value) => patch({ intensity: value })) : nothing}${transition.type === "dissolve" ? this.segmented("Tile size", transition.tileSize ?? "medium", [{ value: "small" as const, label: "Small" }, { value: "medium" as const, label: "Medium" }, { value: "large" as const, label: "Large" }], (value) => patch({ tileSize: value })) : nothing}</div>` : nothing}</details>`;
  }

  private dragMapping(kind: "value" | "color", index: number, event: DragEvent) {
    this.draggedMapping = { kind, index };
    event.dataTransfer?.setData("text/plain", `${kind}:${index}`);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    this.requestUpdate();
  }

  private dropMapping(card: DisplayCard, kind: "value" | "color", index: number, event: DragEvent) {
    event.preventDefault();
    const dragged = this.draggedMapping;
    this.draggedMapping = undefined;
    if (!dragged || dragged.kind !== kind || dragged.index === index) { this.requestUpdate(); return; }
    const mappings = (kind === "value" ? card.valueMappings : card.colorMappings) as unknown[] | undefined;
    if (!mappings) return;
    const [mapping] = mappings.splice(dragged.index, 1);
    mappings.splice(index, 0, mapping);
    this.changed();
  }

  private dragHandle(kind: "value" | "color", index: number) {
    return html`<span
      class="drag-handle"
      draggable="true"
      title="Drag to reorder"
      aria-label="Drag to reorder"
      @dragstart=${(event: DragEvent) => this.dragMapping(kind, index, event)}
      @dragend=${() => { this.draggedMapping = undefined; this.requestUpdate(); }}
    ><ha-icon icon="mdi:drag-vertical"></ha-icon></span>`;
  }

  private dragCard(row: number, index: number, event: DragEvent) {
    this.draggedCard = { row, index };
    event.dataTransfer?.setData("text/plain", `card:${row}:${index}`);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    this.requestUpdate();
  }

  private dropCard(row: number, index: number, event: DragEvent) {
    event.preventDefault();
    const dragged = this.draggedCard;
    this.draggedCard = undefined;
    if (!dragged || dragged.row !== row || dragged.index === index) { this.requestUpdate(); return; }
    const cards = this.dashboard?.pages[this.pageIndex]?.rows[row]?.cards;
    if (!cards) return;
    const [card] = cards.splice(dragged.index, 1);
    cards.splice(index, 0, card);
    this.selected = { row, card: index };
    this.changed();
  }

  private valueMappingsEditor(card: DisplayCard) {
    if (card.type !== "number" && card.type !== "text") return nothing;
    const mappings = card.valueMappings ?? [];
    const updateNumber = (index: number, key: "minimum" | "maximum", input: string) => {
      const mapping = (mappings[index] as NumberValueMapping);
      if (input.trim() === "") delete mapping[key];
      else mapping[key] = Number(input);
      this.changed();
    };
    const remove = (index: number) => {
      mappings.splice(index, 1);
      if (!mappings.length) delete card.valueMappings;
      this.changed();
    };
    return html`<details class="mappings">
      <summary>Value mappings${mappings.length ? ` (${mappings.length})` : ""}</summary>
      <div class="mapping-list">
        <p class="mapping-copy">Rules are checked from top to bottom. The first match wins.</p>
        ${mappings.map((mapping, index) => card.type === "number" ? html`
          <div class="mapping-rule ${this.draggedMapping?.kind === "value" && this.draggedMapping.index === index ? "dragging" : ""}" @dragover=${(event: DragEvent) => event.preventDefault()} @drop=${(event: DragEvent) => this.dropMapping(card, "value", index, event)}>
            ${this.dragHandle("value", index)}
            ${this.field("From", (mapping as NumberValueMapping).minimum, (value) => updateNumber(index, "minimum", value), "number")}
            ${this.field("To", (mapping as NumberValueMapping).maximum, (value) => updateNumber(index, "maximum", value), "number")}
            ${this.field("Display as", mapping.value, (value) => { mapping.value = value; this.changed(); })}
            <button class="icon-button danger" title="Delete mapping" aria-label="Delete mapping" @click=${() => remove(index)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
          </div>
        ` : html`
          <div class="mapping-rule text ${this.draggedMapping?.kind === "value" && this.draggedMapping.index === index ? "dragging" : ""}" @dragover=${(event: DragEvent) => event.preventDefault()} @drop=${(event: DragEvent) => this.dropMapping(card, "value", index, event)}>
            ${this.dragHandle("value", index)}
            ${this.select("Match", (mapping as TextValueMapping).operator, ["equals", "starts_with", "ends_with", "contains"], (value) => { (mapping as TextValueMapping).operator = value as TextValueMapping["operator"]; this.changed(); })}
            ${this.field("Text", (mapping as TextValueMapping).match, (value) => { (mapping as TextValueMapping).match = value; this.changed(); })}
            ${this.field("Display as", mapping.value, (value) => { mapping.value = value; this.changed(); })}
            <button class="icon-button danger" title="Delete mapping" aria-label="Delete mapping" @click=${() => remove(index)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
          </div>
        `)}
        ${mappings.length < 12 ? html`<button class="add-button" @click=${() => {
          const mapping = card.type === "number"
            ? { minimum: 0, maximum: 100, value: "" }
            : { operator: "equals" as const, match: "", value: "" };
          card.valueMappings = [...mappings, mapping] as NumberValueMapping[] | TextValueMapping[];
          this.changed();
        }}>Add mapping</button>` : nothing}
      </div>
    </details>`;
  }

  private colorMappingsEditor(card: DisplayCard) {
    if (card.type !== "number" && card.type !== "text") return nothing;
    const mappings = card.colorMappings ?? [];
    const updateNumber = (index: number, key: "minimum" | "maximum", input: string) => {
      const mapping = mappings[index] as NumberColorMapping;
      if (input.trim() === "") delete mapping[key];
      else mapping[key] = Number(input);
      this.changed();
    };
    const updateColor = (mapping: NumberColorMapping | TextColorMapping, key: "background" | "foreground", value: string) => {
      if (value) mapping[key] = value;
      else delete mapping[key];
      this.changed();
    };
    const remove = (index: number) => {
      mappings.splice(index, 1);
      if (!mappings.length) delete card.colorMappings;
      this.changed();
    };
    return html`<details class="mappings">
      <summary>Color mappings${mappings.length ? ` (${mappings.length})` : ""}</summary>
      <div class="mapping-list">
        <p class="mapping-copy">The first matching rule sets the card colors.</p>
        ${mappings.map((mapping, index) => card.type === "number" ? html`
          <div class="mapping-rule colors ${this.draggedMapping?.kind === "color" && this.draggedMapping.index === index ? "dragging" : ""}" @dragover=${(event: DragEvent) => event.preventDefault()} @drop=${(event: DragEvent) => this.dropMapping(card, "color", index, event)}>
            ${this.dragHandle("color", index)}
            ${this.field("From", (mapping as NumberColorMapping).minimum, (value) => updateNumber(index, "minimum", value), "number")}
            ${this.field("To", (mapping as NumberColorMapping).maximum, (value) => updateNumber(index, "maximum", value), "number")}
            <mini-display-color-field label="Background" .value=${mapping.background ?? ""} @color-changed=${(event: CustomEvent<string>) => updateColor(mapping, "background", event.detail)}></mini-display-color-field>
            <mini-display-color-field label="Text color" .value=${mapping.foreground ?? ""} @color-changed=${(event: CustomEvent<string>) => updateColor(mapping, "foreground", event.detail)}></mini-display-color-field>
            <button class="icon-button danger" title="Delete color mapping" aria-label="Delete color mapping" @click=${() => remove(index)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
          </div>
        ` : html`
          <div class="mapping-rule colors text ${this.draggedMapping?.kind === "color" && this.draggedMapping.index === index ? "dragging" : ""}" @dragover=${(event: DragEvent) => event.preventDefault()} @drop=${(event: DragEvent) => this.dropMapping(card, "color", index, event)}>
            ${this.dragHandle("color", index)}
            ${this.select("Match", (mapping as TextColorMapping).operator, ["equals", "starts_with", "ends_with", "contains"], (value) => { (mapping as TextColorMapping).operator = value as TextColorMapping["operator"]; this.changed(); })}
            ${this.field("Text", (mapping as TextColorMapping).match, (value) => { (mapping as TextColorMapping).match = value; this.changed(); })}
            <mini-display-color-field label="Background" .value=${mapping.background ?? ""} @color-changed=${(event: CustomEvent<string>) => updateColor(mapping, "background", event.detail)}></mini-display-color-field>
            <mini-display-color-field label="Text color" .value=${mapping.foreground ?? ""} @color-changed=${(event: CustomEvent<string>) => updateColor(mapping, "foreground", event.detail)}></mini-display-color-field>
            <button class="icon-button danger" title="Delete color mapping" aria-label="Delete color mapping" @click=${() => remove(index)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
          </div>
        `)}
        ${mappings.length < 12 ? html`<button class="add-button" @click=${() => {
          const mapping = card.type === "number"
            ? { minimum: 0, maximum: 100 }
            : { operator: "equals" as const, match: "" };
          card.colorMappings = [...mappings, mapping] as NumberColorMapping[] | TextColorMapping[];
          this.changed();
        }}>Add color mapping</button>` : nothing}
      </div>
    </details>`;
  }

  private cardSettings(card: DisplayCard, rowIndex: number, cardIndex: number) {
    const cards = this.dashboard!.pages[this.pageIndex].rows[rowIndex].cards;
    const hints = { number: "Displays a numeric value with an optional unit and progress visualization.", text: "Displays text from an entity or the static text below.", status: "Maps a state entity to two readable labels.", clock: "Displays local time without using an entity." };
    return html`<section class="card-settings"><div class="card-head"><div><strong>${card.title || `Card ${cardIndex + 1}`}</strong>${card.visibility ? html`<span class="condition-mark"><ha-icon icon="mdi:eye-settings-outline"></ha-icon>Conditional</span>` : nothing}</div>${this.menu(html`<button @click=${() => this.openVisibility("card", rowIndex, cardIndex)}>Visibility</button><button @click=${() => { cards.splice(cardIndex + 1, 0, structuredClone(card)); this.selected = { row: rowIndex, card: cardIndex + 1 }; this.changed(); }}>Duplicate</button><button class="danger" ?disabled=${cards.length === 1} @click=${() => { if (cards.length > 1) { cards.splice(cardIndex, 1); this.selected = undefined; this.changed(); } }}>Delete</button>`)}</div><div class="grid">${this.select("Type", card.type, ["number", "text", "clock", "status"], (input) => { Object.keys(card).forEach((key) => delete (card as unknown as Record<string, unknown>)[key]); Object.assign(card, newCard(input as DisplayCard["type"])); this.changed(); })}${this.field("Title", card.title, (input) => { card.title = input; this.changed(); })}<p class="hint">${hints[card.type]}</p>${["number", "status", "text"].includes(card.type) ? this.entity(card) : nothing}${card.type === "number" ? html`${this.field("Unit", card.unit, (input) => { card.unit = input; this.changed(); })}${this.select("Progress", card.progress ?? "none", ["none", "bar", "ring"], (input) => { card.progress = input as DisplayCard["progress"]; this.changed(); })}${card.progress && card.progress !== "none" ? html`${this.field("Minimum", card.minimum, (input) => { card.minimum = Number(input); this.changed(); }, "number")}${this.field("Maximum", card.maximum, (input) => { card.maximum = Number(input); this.changed(); }, "number")}` : nothing}` : nothing}${card.type === "text" ? this.field("Static text", card.text, (input) => { card.text = input; this.changed(); }) : nothing}${card.type === "status" ? html`${this.field("On text", card.onText, (input) => { card.onText = input; this.changed(); })}${this.field("Off text", card.offText, (input) => { card.offText = input; this.changed(); })}` : nothing}</div>${this.valueMappingsEditor(card)}${this.colorMappingsEditor(card)}${this.styleEditor(card)}</section>`;
  }

  private rowEditor(row: DisplayRow, rowIndex: number) {
    const page = this.dashboard!.pages[this.pageIndex];
    return html`<section class="row-panel"><div class="row-head"><div class="row-title"><strong>Row ${rowIndex + 1}</strong><small>${row.cards.length} ${row.cards.length === 1 ? "card" : "cards"}</small>${row.visibility ? html`<span class="condition-mark"><ha-icon icon="mdi:eye-settings-outline"></ha-icon>Conditional</span>` : nothing}</div>${this.menu(html`<button @click=${() => this.openVisibility("row", rowIndex)}>Visibility</button><button @click=${() => { page.rows.splice(rowIndex + 1, 0, structuredClone(row)); this.changed(); }}>Duplicate</button><button class="danger" ?disabled=${page.rows.length === 1} @click=${() => { if (page.rows.length > 1) this.requestDeleteRow(rowIndex); }}>Delete</button>`)}</div>${this.field("Row title", row.title, (input) => { row.title = input; this.changed(); })}<nav class="card-tabs" aria-label=${`Cards in row ${rowIndex + 1}`}>${row.cards.map((card, cardIndex) => html`<button draggable="true" class="tab ${this.selected?.row === rowIndex && this.selected?.card === cardIndex ? "active" : ""} ${this.draggedCard?.row === rowIndex && this.draggedCard.index === cardIndex ? "dragging" : ""}" aria-pressed=${this.selected?.row === rowIndex && this.selected?.card === cardIndex} @dragstart=${(event: DragEvent) => this.dragCard(rowIndex, cardIndex, event)} @dragover=${(event: DragEvent) => event.preventDefault()} @drop=${(event: DragEvent) => this.dropCard(rowIndex, cardIndex, event)} @dragend=${() => { this.draggedCard = undefined; this.requestUpdate(); }} @click=${() => this.selected = { row: rowIndex, card: cardIndex }}>Card ${cardIndex + 1} · ${card.type}${card.visibility ? " · conditional" : ""}</button>`)}${row.cards.length < 3 ? html`<button class="icon-button" title="Add card" aria-label="Add card" @click=${() => { row.cards.push(newCard()); this.selected = { row: rowIndex, card: row.cards.length - 1 }; this.changed(); }}><ha-icon icon="mdi:plus"></ha-icon></button>` : nothing}</nav>${this.selected?.row === rowIndex ? this.cardSettings(row.cards[this.selected.card], rowIndex, this.selected.card) : nothing}</section>`;
  }

  private renderEditor() {
    const dashboard = this.dashboard;
    const page = dashboard?.pages[this.pageIndex];
    const dirty = this.dirtyDisplays.has(this.selectedDisplayId);
    return html`<ha-card class="editor-card"><div class="editor-heading"><div class="editor-title"><strong>${this.selectedDisplay?.title}</strong><small>${this.selectedScene?.name}</small></div><div class="save-area"><div class="sync ${this.syncState}" role=${this.syncState === "error" ? "alert" : "status"} aria-live="polite"><i></i><span>${this.syncMessage}</span></div><div class="save-actions"><ha-button .disabled=${!dirty} @click=${this.discard}>Discard</ha-button><ha-button .disabled=${!dirty || this.syncState === "syncing"} @click=${() => void this.save()}>Save</ha-button></div></div></div>${page && dashboard ? html`<div class="editor-content"><nav class="tabs" aria-label="Dashboard pages">${dashboard.pages.map((item, index) => html`<button class="tab ${index === this.pageIndex ? "active" : ""}" aria-pressed=${index === this.pageIndex} @click=${() => void this.showPage(index)}>${item.title || item.id}</button>`)}<button class="icon-button" aria-label="Add page" title="Add page" @click=${() => { dashboard.pages.push(newPage(dashboard.pages.length + 1)); this.pageIndex = dashboard.pages.length - 1; this.previewPages = { ...this.previewPages, [this.selectedDisplayId]: this.pageIndex }; this.selected = { row: 0, card: 0 }; this.changed(); }}><ha-icon icon="mdi:plus"></ha-icon></button></nav><details class="page-settings"><summary class="page-summary"><span>Page settings</span><button class="icon-button danger" aria-label="Delete page" title="Delete page" ?disabled=${dashboard.pages.length <= 1} @click=${(event: Event) => { event.preventDefault(); event.stopPropagation(); this.deletePage(); }}><ha-icon icon="mdi:delete-outline"></ha-icon></button></summary><div class="grid">${this.field("Page ID", page.id, (input) => { page.id = input; this.changed(); })}${this.field("Title", page.title, (input) => { page.title = input; this.changed(); })}${this.field("Duration in seconds", page.durationSeconds, (input) => { page.durationSeconds = Number(input); this.changed(); }, "number")}${this.checkbox("Show title", page.showTitle !== false, (input) => { page.showTitle = input; this.changed(); })}</div></details>${this.transitionEditor(page)}<div class="rows">${page.rows.map((row, index) => this.rowEditor(row, index))}</div>${page.rows.length < 6 ? html`<button class="add-button" @click=${() => { page.rows.push(newRow()); this.changed(); }}>Add row</button>` : nothing}</div>` : html`<div class="loading"><p>No layout configured for this display.</p><ha-button @click=${this.createLayout}>Create layout</ha-button></div>`}</ha-card>`;
  }

  render() {
    if (!this.loaded) return html`<div class="loading">Loading displays…</div>`;
    if (this.displays.length === 0) return html`<ha-card class="empty"><ha-icon icon="mdi:monitor-off"></ha-icon><h2>No Mini Displays yet</h2><p>Add a Mini Display integration first. Configured displays will appear here automatically.</p><ha-button @click=${() => { history.pushState(null, "", "/config/integrations"); window.dispatchEvent(new Event("location-changed")); }}><ha-icon icon="mdi:plus"></ha-icon>Add integration</ha-button></ha-card>`;
    const visibility = this.visibilityObject()?.visibility;
    const visibilityName = this.visibilityTarget?.kind === "row" ? "Row" : "Card";
    return html`
      <div class="layout">
        <mini-display-scene-sidebar
          .displays=${this.displays}
          .scenes=${this.scenes}
          .selectedDisplayId=${this.selectedDisplayId}
          .selectedSceneId=${this.selectedSceneId}
          .form=${this.sceneForm}
          .sceneName=${this.sceneName}
          @display-selected=${(event: CustomEvent<string>) => this.selectDisplay(event.detail)}
          @scene-selected=${(event: CustomEvent<string>) => void this.selectScene(event.detail)}
          @scene-create=${() => void this.createScene()}
          @scene-rename=${this.openRenameScene}
          @scene-duplicate=${() => void this.duplicateScene()}
          @scene-default=${() => void this.setDefaultScene()}
          @scene-delete=${() => void this.deleteScene()}
          @scene-name=${(event: CustomEvent<string>) => this.sceneName = event.detail}
          @scene-cancel=${() => this.sceneForm = null}
          @scene-save=${() => void this.saveSceneForm()}
        ></mini-display-scene-sidebar>

        ${this.renderEditor()}

        <mini-display-preview-list
          .hass=${this.hass}
          .displays=${this.displays}
          .dashboards=${this.dashboards}
          .pages=${this.previewPages}
          .dirtyDisplays=${this.dirtyDisplays}
          .selectedDisplayId=${this.selectedDisplayId}
          .selectedSceneId=${this.selectedSceneId}
          .selectedSceneName=${this.selectedScene?.name ?? ""}
          @display-selected=${(event: CustomEvent<string>) => this.selectDisplay(event.detail)}
          @preview-toggle=${(event: CustomEvent<Display>) => void this.togglePreview(event.detail)}
          @preview-page=${(event: CustomEvent<{ displayId: string; delta: number }>) => this.previewPage(event.detail.displayId, event.detail.delta)}
          @scene-activate=${(event: CustomEvent<Display>) => void this.activateScene(event.detail)}
        ></mini-display-preview-list>
      </div>

      ${this.visibilityTarget ? html`
        <mini-display-visibility-dialog
          .hass=${this.hass}
          .targetName=${visibilityName}
          .value=${visibility}
          @visibility-save=${(event: CustomEvent<Visibility>) => this.saveVisibility(event.detail)}
          @visibility-clear=${this.clearVisibility}
          @visibility-cancel=${() => this.visibilityTarget = undefined}
        ></mini-display-visibility-dialog>
      ` : nothing}

      ${this.confirmation ? html`
        <div class="modal-backdrop" @click=${this.closeConfirmation}>
          <ha-card class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" @click=${(event: Event) => event.stopPropagation()}>
            <div class="confirm-heading">
              <ha-icon icon=${this.confirmation.kind === "delete-row" ? "mdi:delete-alert-outline" : "mdi:content-save-alert-outline"}></ha-icon>
              <h2 id="confirm-title">${this.confirmation.kind === "delete-row" ? "Delete row?" : "Discard changes?"}</h2>
            </div>
            <div class="modal-body">
              <p class="modal-copy">${this.confirmation.kind === "delete-row"
                ? "This row and all cards inside it will be removed."
                : "You have unsaved changes. Leaving Mini Displays will discard them."}</p>
            </div>
            <div class="modal-actions">
              <ha-button @click=${this.closeConfirmation}>Cancel</ha-button>
              <ha-button class="danger-action" @click=${() => void this.confirmAction()}>${this.confirmation.kind === "delete-row" ? "Delete" : "Discard and leave"}</ha-button>
            </div>
          </ha-card>
        </div>
      ` : nothing}
    `;
  }
}
