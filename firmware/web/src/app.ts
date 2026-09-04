import { html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  DeviceApiError,
  type DeviceInfo,
  type DeviceStatus,
  type NetworkStatus,
  type SecurityStatus,
  type SetupStatus,
  request,
} from "./api";
import "./pages/display";
import "./pages/diagnostics";
import "./pages/firmware";
import "./pages/network";
import "./pages/overview";
import "./pages/security";
import "./pages/setup";
import type {
  NetworkFormState,
  SecurityFormState,
  SubmitRequest,
} from "./pages/shared";
import { shellStyles } from "./styles";

type Page =
  "overview" | "display" | "network" | "security" | "diagnostics" | "firmware";

const pageFromPath = (): Page =>
  (({
    "/display": "display",
    "/network": "network",
    "/security": "security",
    "/diagnostics": "diagnostics",
    "/update": "firmware",
  })[location.pathname] as Page | undefined) ?? "overview";

@customElement("mini-display-device")
class MiniDisplayDevice extends LitElement {
  @state() private configured_ = true;
  @state() private loading_ = true;
  @state() private saving_ = false;
  @state() private message_ = "";
  @state() private error_ = "";
  @state() private info_?: DeviceInfo;
  @state() private status_?: DeviceStatus;
  @state() private network_?: NetworkStatus;
  @state() private security_?: SecurityStatus;
  @state() private setup_?: SetupStatus;
  @state() private networkState_: NetworkFormState = {
    recoveryProtected: false,
    staticIp: false,
    ntpFromDhcp: false,
  };
  @state() private securityState_: SecurityFormState = {
    apiAuth: true,
    otaAuth: true,
    directOta: true,
  };

  private readonly page_ = pageFromPath();
  private statusTimer_?: number;

  static styles = shellStyles;

  connectedCallback() {
    super.connectedCallback();
    void this.load_();
    this.statusTimer_ = window.setInterval(
      () => void this.refreshStatus_(),
      5000,
    );
  }

  disconnectedCallback() {
    if (this.statusTimer_ !== undefined)
      window.clearInterval(this.statusTimer_);
    super.disconnectedCallback();
  }

  private async refreshStatus_() {
    if (!this.configured_ || this.loading_ || this.saving_ || !this.status_)
      return;
    try {
      this.status_ = await request<DeviceStatus>("/api/v1/status");
    } catch {
      // Keep the last known state; the next interval retries.
    }
  }

  private async load_() {
    this.loading_ = true;
    this.error_ = "";
    try {
      const [info, status] = await Promise.all([
        request<DeviceInfo>("/api/v1/info"),
        request<DeviceStatus>("/api/v1/status"),
      ]);
      this.info_ = info;
      this.status_ = status;
      if (this.page_ === "network") {
        this.network_ = await request<NetworkStatus>("/api/v1/network");
        this.networkState_ = {
          recoveryProtected: this.network_.recoveryPasswordSet,
          staticIp: this.network_.staticIpEnabled,
          ntpFromDhcp: this.network_.ntpFromDhcp,
        };
      }
      if (this.page_ === "security")
        this.security_ = await request<SecurityStatus>("/api/v1/security");
    } catch (error) {
      if (error instanceof DeviceApiError && error.status === 403) {
        try {
          this.setup_ = await request<SetupStatus>("/api/v1/setup");
          this.configured_ = false;
          this.networkState_ = {
            recoveryProtected: this.setup_.recoveryPasswordSet,
            staticIp: this.setup_.staticIpEnabled,
            ntpFromDhcp: this.setup_.ntpFromDhcp,
          };
          this.securityState_ = {
            apiAuth: this.setup_.apiAuthEnabled,
            otaAuth: this.setup_.otaAuthEnabled,
            directOta: this.setup_.directOtaEnabled,
          };
        } catch (setupError) {
          this.error_ =
            setupError instanceof Error
              ? setupError.message
              : "Could not load setup mode";
        }
      } else {
        this.error_ =
          error instanceof Error ? error.message : "Could not load device";
      }
    } finally {
      this.loading_ = false;
    }
  }

  private readonly submit_: SubmitRequest = async (
    path,
    body,
    success,
    method = "PUT",
  ) => {
    this.saving_ = true;
    this.message_ = "";
    this.error_ = "";
    try {
      await request(path, { method, body: JSON.stringify(body) });
      this.message_ = success;
    } catch (error) {
      this.error_ = error instanceof Error ? error.message : "Request failed";
    } finally {
      this.saving_ = false;
    }
  };

  private uploadStart_ = () => {
    this.saving_ = true;
    this.message_ = "";
    this.error_ = "";
  };

  private uploadSuccess_ = (message: string) => {
    this.saving_ = false;
    this.message_ = message;
  };

  private uploadError_ = (message: string) => {
    this.saving_ = false;
    this.error_ = message;
  };

  private navigation_() {
    const items: [Page, string, string][] = [
      ["overview", "/", "Overview"],
      ["display", "/display", "Display"],
      ["network", "/network", "Network"],
      ["security", "/security", "Security"],
      ["diagnostics", "/diagnostics", "Diagnostics"],
      ["firmware", "/update", "Firmware"],
    ];
    return html`<nav>
      ${items.map(
        ([page, path, label]) =>
          html`<a
            href=${path}
            aria-current=${this.page_ === page ? "page" : nothing}
            >${label}</a
          >`,
      )}
    </nav>`;
  }

  private shell_(content: unknown) {
    return html`<header>
        <div class="head">
          <div>
            <h1>Mini Display</h1>
            <p>${this.info_?.model ?? "Local display control"}</p>
          </div>
          <div class="head-status">
            ${this.status_?.ip ?? "0.0.0.0"}<br />${
              this.status_?.wifiRssiDbm ?? -127
            }
            dBm
          </div>
        </div>
        ${this.navigation_()}
      </header>
      <main>
        ${
          this.message_
            ? html`<div class="notice">${this.message_}</div>`
            : nothing
        }
        ${this.error_ ? html`<div class="error">${this.error_}</div>` : nothing}
        ${content}
      </main>`;
  }

  private pageContent_() {
    if (!this.status_)
      return html`<mini-display-overview
        .info=${this.info_}
      ></mini-display-overview>`;
    if (this.page_ === "display")
      return html`<mini-display-display-page
        .status=${this.status_}
        .saving=${this.saving_}
        .submit=${this.submit_}
      ></mini-display-display-page>`;
    if (this.page_ === "network")
      return html`<mini-display-network-page
        .network=${this.network_}
        .networkState=${this.networkState_}
        .saving=${this.saving_}
        .submit=${this.submit_}
        .onNetworkState=${(state: NetworkFormState) =>
          (this.networkState_ = state)}
      ></mini-display-network-page>`;
    if (this.page_ === "security")
      return html`<mini-display-security-page
        .security=${this.security_}
        .saving=${this.saving_}
        .submit=${this.submit_}
        .onStart=${this.uploadStart_}
        .onSuccess=${this.uploadSuccess_}
        .onError=${this.uploadError_}
      ></mini-display-security-page>`;
    if (this.page_ === "firmware")
      return html`<mini-display-firmware-page
        .saving=${this.saving_}
        .onStart=${this.uploadStart_}
        .onSuccess=${this.uploadSuccess_}
        .onError=${this.uploadError_}
      ></mini-display-firmware-page>`;
    if (this.page_ === "diagnostics")
      return html`<mini-display-diagnostics-page
        .recoverySsid=${this.status_.recoverySsid}
        .status=${this.status_}
      ></mini-display-diagnostics-page>`;
    return html`<mini-display-overview
      .info=${this.info_}
      .status=${this.status_}
    ></mini-display-overview>`;
  }

  render() {
    if (this.loading_) return html`<div class="loading">Loading device…</div>`;
    if (!this.configured_)
      return html`<mini-display-setup-page
        .setup=${this.setup_}
        .saving=${this.saving_}
        .message=${this.message_}
        .error=${this.error_}
        .networkState=${this.networkState_}
        .securityState=${this.securityState_}
        .submit=${this.submit_}
        .onNetworkState=${(state: NetworkFormState) =>
          (this.networkState_ = state)}
        .onSecurityState=${(state: SecurityFormState) =>
          (this.securityState_ = state)}
        .onUploadStart=${this.uploadStart_}
        .onUploadSuccess=${this.uploadSuccess_}
        .onUploadError=${this.uploadError_}
      ></mini-display-setup-page>`;
    return this.shell_(this.pageContent_());
  }
}
