import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { CardConfig, Dashboard, Hass } from "./types";
import "./preview";

@customElement("mini-display-dashboard-card")
export class MiniDisplayCard extends LitElement {
  @property({attribute:false}) hass?: Hass;
  @state() private config?: CardConfig;
  @state() private dashboard?: Dashboard;
  static styles=css`ha-card{padding:16px}mini-display-preview{width:max-content;margin:auto}`;
  private dashboardUpdated = (event: Event) => {
    const id = (event as CustomEvent).detail?.configEntryId;
    if (id === this.config?.config_entry_id) void this.load();
  };
  connectedCallback(){super.connectedCallback();window.addEventListener("mini-display-dashboard-updated",this.dashboardUpdated)}
  disconnectedCallback(){window.removeEventListener("mini-display-dashboard-updated",this.dashboardUpdated);super.disconnectedCallback()}
  setConfig(config:CardConfig){if(!config.config_entry_id)throw new Error("Select a Mini-Display");this.config=config;void this.load()}
  updated(changed:Map<string,unknown>){if(changed.has("hass")&&!this.dashboard)void this.load()}
  private async load(){if(!this.hass||!this.config)return;this.dashboard=await this.hass.callWS<Dashboard>({type:"mini_display/dashboard/get",config_entry_id:this.config.config_entry_id})}
  static getConfigElement(){return document.createElement("mini-display-dashboard-card-editor")}
  static getStubConfig(){return{config_entry_id:"",show_preview:true}}
  getCardSize(){return 4} getGridOptions(){return{columns:6,rows:4,min_columns:3,min_rows:2}}
  render(){return html`<ha-card><mini-display-preview .dashboard=${this.dashboard} .hass=${this.hass} .autoRotate=${true}></mini-display-preview></ha-card>`}
}
