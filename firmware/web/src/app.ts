import { css, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  DeviceApiError,
  type DeviceInfo,
  type DeviceStatus,
  type NetworkStatus,
  type SecurityStatus,
  type SetupStatus,
  request,
  uploadFirmware,
} from "./api";

type Page = "overview" | "display" | "network" | "security" | "firmware";

const pageFromPath = (): Page =>
  (({
    "/display": "display",
    "/network": "network",
    "/security": "security",
    "/update": "firmware",
  })[location.pathname] as Page | undefined) ?? "overview";

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [days ? `${days}d` : "", hours ? `${hours}h` : "", `${minutes}m`]
    .filter(Boolean)
    .join(" ");
};

const formatMemory = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

const signalQuality = (rssi: number) => {
  if (rssi >= -50) return "Excellent";
  if (rssi >= -60) return "Good";
  if (rssi >= -70) return "Fair";
  return "Weak";
};

const timezones = [
  { label: "Europe/Warsaw", value: "CET-1CEST,M3.5.0,M10.5.0/3" },
  { label: "UTC", value: "UTC0" },
  { label: "Europe/London", value: "GMT0BST,M3.5.0/1,M10.5.0" },
  { label: "America/New York", value: "EST5EDT,M3.2.0/2,M11.1.0/2" },
  { label: "America/Los Angeles", value: "PST8PDT,M3.2.0/2,M11.1.0/2" },
  { label: "Asia/Tokyo", value: "JST-9" },
  { label: "Australia/Sydney", value: "AEST-10AEDT,M10.1.0,M4.1.0/3" },
] as const;

const timezonePreset = (rule: string) =>
  timezones.some((timezone) => timezone.value === rule) ? rule : "custom";

const lastUpdateAge = (seconds: number) => {
  if (seconds < 0) return { text: "Never", tone: "stale" };
  if (seconds < 60) return { text: `${seconds}s ago`, tone: "fresh" };
  if (seconds < 3600)
    return {
      text: `${Math.floor(seconds / 60)}m ago`,
      tone: seconds >= 300 ? "stale" : "warning",
    };
  if (seconds < 86400)
    return { text: `${Math.floor(seconds / 3600)}h ago`, tone: "stale" };
  return { text: `${Math.floor(seconds / 86400)}d ago`, tone: "stale" };
};

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
  @state() private brightness_ = 100;
  @state() private pixelShift_ = 0;
  @state() private timezone_: string = timezones[0].value;
  @state() private selectedTimezone_: string = timezones[0].value;
  @state() private setupApiAuth_ = true;
  @state() private setupOtaAuth_ = true;
  @state() private directOta_ = true;
  @state() private recoveryProtected_ = false;
  @state() private staticIp_ = false;
  @state() private ntpFromDhcp_ = false;

  private readonly page_ = pageFromPath();
  private statusTimer_?: number;

  static styles = css`
    :host {
      --bg: #f4f6f9;
      --panel: #fff;
      --text: #17212b;
      --muted: #637083;
      --line: #d9e0e8;
      --accent: #03a9f4;
      --accent-text: #062131;
      --good: #2e9d57;
      --warning: #d49a00;
      --danger: #d64545;
      display: block;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font:
        15px system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      line-height: 1.45;
    }
    * {
      box-sizing: border-box;
    }
    header {
      background: #151a21;
      color: #fff;
    }
    .head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      max-width: 860px;
      margin: auto;
      padding: 20px 18px 12px;
    }
    .head h1 {
      margin: 0;
      font-size: 22px;
    }
    .head p {
      margin: 3px 0 0;
      color: #aeb8c5;
      font-size: 13px;
    }
    .head-status {
      color: #cbd3dc;
      font-size: 13px;
      text-align: right;
      white-space: nowrap;
    }
    nav {
      display: flex;
      gap: 3px;
      max-width: 860px;
      margin: auto;
      padding: 0 14px;
      overflow-x: auto;
    }
    nav a {
      color: #cbd3dc;
      text-decoration: none;
      padding: 10px 12px;
      border-bottom: 3px solid transparent;
      white-space: nowrap;
    }
    nav a[aria-current="page"] {
      color: #fff;
      border-color: var(--accent);
    }
    main {
      max-width: 860px;
      margin: 20px auto;
      padding: 0 16px 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 12px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px;
    }
    .card h2 {
      font-size: 16px;
      margin: 0 0 12px;
    }
    .metric {
      font-size: 25px;
      font-weight: 650;
      margin: 2px 0;
    }
    .age-fresh {
      color: var(--good);
    }
    .age-warning {
      color: var(--warning);
    }
    .age-stale {
      color: var(--danger);
    }
    .muted {
      color: var(--muted);
      font-size: 13px;
    }
    .dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--good);
      margin-right: 7px;
    }
    .dot.off {
      background: var(--danger);
    }
    .stack {
      display: grid;
      gap: 14px;
    }
    .dependent {
      display: grid;
      gap: 14px;
      padding-left: 28px;
      transition: opacity 160ms ease;
    }
    .dependent.disabled {
      opacity: 0.42;
    }
    .field {
      display: grid;
      gap: 6px;
      font-weight: 600;
    }
    .field small {
      font-weight: 400;
      color: var(--muted);
    }
    input,
    select,
    button {
      font: inherit;
    }
    input:not([type]),
    input[type="text"],
    input[type="password"],
    input[type="number"],
    input[type="file"],
    select {
      width: 100%;
      padding: 10px 11px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      color: var(--text);
    }
    input[type="range"] {
      width: 100%;
      accent-color: var(--accent);
    }
    .check {
      display: flex;
      align-items: center;
      gap: 9px;
      font-weight: 600;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .actions form {
      margin: 0;
    }
    .choice {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin: 0;
      padding: 0;
      border: 0;
    }
    .choice legend {
      width: 100%;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .form-section {
      display: grid;
      gap: 14px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 10px;
    }
    .form-section h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 15px;
    }
    .form-section h3::after {
      content: "";
      height: 1px;
      flex: 1;
      background: var(--line);
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }
    .fact {
      min-width: 0;
    }
    .fact strong,
    .fact span {
      display: block;
      overflow-wrap: anywhere;
    }
    .fact strong {
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
    }
    button {
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      background: var(--accent);
      color: var(--accent-text);
      font-weight: 700;
      cursor: pointer;
    }
    button.secondary {
      background: #e2e8ef;
      color: #263442;
    }
    button.danger {
      background: var(--danger);
      color: #fff;
    }
    button:disabled {
      opacity: 0.55;
      cursor: wait;
    }
    .notice,
    .error {
      padding: 10px 12px;
      border-left: 4px solid var(--good);
      background: color-mix(in srgb, var(--good) 12%, var(--panel));
      border-radius: 6px;
      margin-bottom: 14px;
    }
    .error {
      border-color: var(--danger);
      background: color-mix(in srgb, var(--danger) 12%, var(--panel));
    }
    .center {
      display: grid;
      gap: 12px;
      max-width: 460px;
      margin: 8vh auto;
    }
    .loading {
      color: var(--muted);
      text-align: center;
      padding: 48px;
    }
    @media (prefers-color-scheme: dark) {
      :host {
        --bg: #0d1117;
        --panel: #171c24;
        --text: #edf2f7;
        --muted: #9aa7b5;
        --line: #303946;
      }
      .secondary,
      button.secondary {
        background: #303946;
        color: #edf2f7;
      }
    }
    @media (max-width: 520px) {
      .head {
        align-items: flex-start;
        padding-top: 16px;
      }
      .head-status {
        padding-top: 4px;
      }
      main {
        margin-top: 14px;
      }
      .grid {
        grid-template-columns: 1fr;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      * {
        scroll-behavior: auto !important;
      }
    }
  `;

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
      this.brightness_ = status.brightness;
      this.pixelShift_ = status.pixelShift;
      this.timezone_ = status.timezone;
      this.selectedTimezone_ = timezonePreset(status.timezone);
      if (this.page_ === "network") {
        this.network_ = await request<NetworkStatus>("/api/v1/network");
        this.recoveryProtected_ = this.network_.recoveryPasswordSet;
        this.staticIp_ = this.network_.staticIpEnabled;
        this.ntpFromDhcp_ = this.network_.ntpFromDhcp;
      }
      if (this.page_ === "security") {
        this.security_ = await request<SecurityStatus>("/api/v1/security");
        this.setupApiAuth_ = this.security_.apiAuthEnabled;
        this.setupOtaAuth_ = this.security_.otaAuthEnabled;
        this.directOta_ = this.security_.directOtaEnabled;
      }
    } catch (error) {
      if (error instanceof DeviceApiError && error.status === 403) {
        try {
          this.setup_ = await request<SetupStatus>("/api/v1/setup");
          this.configured_ = false;
          this.setupApiAuth_ = this.setup_.apiAuthEnabled;
          this.setupOtaAuth_ = this.setup_.otaAuthEnabled;
          this.directOta_ = this.setup_.directOtaEnabled;
          this.recoveryProtected_ = this.setup_.recoveryPasswordSet;
          this.staticIp_ = this.setup_.staticIpEnabled;
          this.ntpFromDhcp_ = this.setup_.ntpFromDhcp;
        } catch (setupError) {
          this.error_ =
            setupError instanceof Error
              ? setupError.message
              : "Could not load setup mode";
        }
      } else
        this.error_ =
          error instanceof Error ? error.message : "Could not load device";
    } finally {
      this.loading_ = false;
    }
  }

  private async submit_(
    path: string,
    body: Record<string, unknown>,
    success: string,
    method: "PUT" | "POST" = "PUT",
  ) {
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
  }

  private navigation_() {
    const items: [Page, string, string][] = [
      ["overview", "/", "Overview"],
      ["display", "/display", "Display"],
      ["network", "/network", "Network"],
      ["security", "/security", "Security"],
      ["firmware", "/update", "Firmware"],
    ];
    return html`<nav>
      ${items.map(([page, path, label]) => html`<a href=${path} aria-current=${this.page_ === page ? "page" : nothing}>${label}</a>`)}
    </nav>`;
  }

  private firmwareForm_(endpoint = "/api/v1/firmware") {
    return html`<form
      class="stack"
      @submit=${async (event: SubmitEvent) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget as HTMLFormElement);
        const file = data.get("firmware");
        if (!(file instanceof File) || !file.size) return;
        this.saving_ = true;
        this.message_ = "";
        this.error_ = "";
        try {
          this.message_ = await uploadFirmware(file, endpoint);
        } catch (error) {
          this.error_ =
            error instanceof Error ? error.message : "Firmware upload failed";
        } finally {
          this.saving_ = false;
        }
      }}
    >
      <label class="field"
        >Firmware image<input
          type="file"
          name="firmware"
          accept=".bin"
          required /></label
      ><button type="submit" ?disabled=${this.saving_}>Upload firmware</button>
    </form>`;
  }

  private shell_(content: unknown) {
    return html`<header>
        <div class="head">
          <div>
            <h1>Mini Display</h1>
            <p>${this.info_?.model ?? "Local display control"}</p>
          </div>
          <div class="head-status">
            ${this.status_?.ip ?? "0.0.0.0"}<br />${this.status_?.wifiRssiDbm ?? -127}
            dBm
          </div>
        </div>
        ${this.navigation_()}
      </header>
      <main>
        ${this.message_ ? html`<div class="notice">${this.message_}</div>` : nothing}${this.error_ ? html`<div class="error">${this.error_}</div>` : nothing}${content}
      </main>`;
  }

  private overview_() {
    const status = this.status_!;
    const updateAge = lastUpdateAge(status.lastValueUpdateAgeSeconds);
    return this.shell_(
      html`<div class="grid">
        <section class="card">
          <h2>Connection</h2>
          <div class="metric">
            <span class="dot ${status.connected ? "" : "off"}"></span
            >${status.connected ? "Online" : "Offline"}
          </div>
          <div class="muted">Wi-Fi ${status.wifiRssiDbm} dBm</div>
        </section>
        <section class="card">
          <h2>Current page</h2>
          <div class="metric">${status.page || "None"}</div>
          <div class="muted">
            ${status.rotation === "auto" ? "Automatic rotation" : "Manual selection"}
          </div>
        </section>
        <section class="card">
          <h2>Display</h2>
          <div class="metric">${status.brightness}%</div>
          <div class="muted">
            ${status.displayOn ? "Screen enabled" : "Screen disabled"} · pixel
            shift ${status.pixelShift}
          </div>
        </section>
        <section class="card">
          <h2>Last values update</h2>
          <div class="metric age-${updateAge.tone}">${updateAge.text}</div>
        </section>
        <section class="card">
          <h2>Time</h2>
          <div class="metric">${status.localTime}</div>
          <div>${status.localDate}</div>
          <div class="muted">NTP ${status.ntpServer}</div>
        </section>
        <section class="card">
          <h2>Memory</h2>
          <div class="metric">
            ${formatMemory(status.totalHeapBytes - status.freeHeapBytes)} used
          </div>
          <div class="muted">${formatMemory(status.freeHeapBytes)} free</div>
        </section>
        <section class="card">
          <h2>Firmware</h2>
          <div class="metric">${this.info_?.firmwareVersion}</div>
          <div class="muted">Uptime ${formatUptime(status.uptimeSeconds)}</div>
        </section>
      </div>`,
    );
  }

  private displayPage_() {
    const status = this.status_!;
    return this.shell_(
      html`<div class="grid">
        <section class="card">
          <h2>Screen</h2>
          <form
            class="stack"
            @submit=${(event: SubmitEvent) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget as HTMLFormElement);
              void this.submit_(
                "/api/v1/display",
                {
                  on: data.has("on"),
                  brightness: this.brightness_,
                  pixelShift: this.pixelShift_,
                  timezone: this.timezone_,
                },
                "Display settings saved.",
              );
            }}
          >
            <label class="check"
              ><input
                type="checkbox"
                name="on"
                .checked=${status.displayOn}
              />Screen enabled</label
            >
            <label class="field"
              >Brightness <small>${this.brightness_}%</small
              ><input
                type="range"
                min="0"
                max="100"
                .value=${String(this.brightness_)}
                @input=${(event: Event) => (this.brightness_ = Number((event.target as HTMLInputElement).value))}
            /></label>
            <label class="field"
              >Pixel shift
              <small
                >${this.pixelShift_}px · periodically moves content to reduce
                image retention</small
              ><input
                type="range"
                min="0"
                max="10"
                .value=${String(this.pixelShift_)}
                @input=${(event: Event) => (this.pixelShift_ = Number((event.target as HTMLInputElement).value))}
            /></label>
            <label class="field"
              >Time zone
              <small
                >Used by clock cards. Time stays synchronized over NTP.</small
              >
              <select
                .value=${this.selectedTimezone_}
                @change=${(event: Event) => {
                  const value = (event.target as HTMLSelectElement).value;
                  this.selectedTimezone_ = value;
                  if (value !== "custom") this.timezone_ = value;
                }}
              >
                ${timezones.map(
                  (timezone) =>
                    html`<option value=${timezone.value}>
                      ${timezone.label}
                    </option>`,
                )}
                <option value="custom">Custom POSIX rule</option>
              </select>
            </label>
            ${
              this.selectedTimezone_ === "custom"
                ? html`<label class="field"
                    >POSIX time zone rule
                    <input
                      maxlength="63"
                      required
                      .value=${this.timezone_}
                      @input=${(event: Event) =>
                        (this.timezone_ = (
                          event.target as HTMLInputElement
                        ).value)}
                    />
                  </label>`
                : nothing
            }
            <button type="submit" ?disabled=${this.saving_}>
              Save display settings
            </button>
          </form>
        </section>
        <section class="card">
          <h2>Page control</h2>
          <p class="muted">
            Temporarily change the visible page or resume automatic rotation.
          </p>
          <div class="actions">
            ${[
              ["previous", "Previous"],
              ["next", "Next"],
              ["auto", "Automatic"],
            ].map(
              ([command, label]) =>
                html`<button
                  class="secondary"
                  @click=${() => void this.submit_("/api/v1/page", command === "auto" ? { mode: "auto" } : { command }, `Page mode changed to ${label.toLowerCase()}.`, "POST")}
                >
                  ${label}
                </button>`,
            )}
          </div>
        </section>
      </div>`,
    );
  }

  private networkPayload_(data: FormData) {
    return {
      ssid: data.get("ssid"),
      password: data.get("password"),
      hostname: data.get("hostname"),
      retryLimit: Number(data.get("retryLimit")),
      resetApiAuthOnRecovery: data.has("resetApiAuthOnRecovery"),
      recoveryPasswordEnabled: this.recoveryProtected_,
      recoveryPassword: data.get("recoveryPassword"),
      ntpServer: data.get("ntpServer"),
      ntpFromDhcp: this.ntpFromDhcp_,
      staticIpEnabled: this.staticIp_,
      staticIp: data.get("staticIp"),
      gateway: data.get("gateway"),
      subnet: data.get("subnet"),
      dns1: data.get("dns1"),
      dns2: data.get("dns2"),
    };
  }

  private ipv4Fields_(values: {
    staticIp: string;
    gateway: string;
    subnet: string;
    dns1: string;
    dns2: string;
  }) {
    const fields: [keyof typeof values, string, string, boolean][] = [
      ["staticIp", "IP address", "192.168.1.50", true],
      ["gateway", "Gateway", "192.168.1.1", true],
      ["subnet", "Subnet mask", "255.255.255.0", true],
      ["dns1", "Primary DNS", "192.168.1.1", false],
      ["dns2", "Secondary DNS", "1.1.1.1", false],
    ];
    return fields.map(
      ([name, label, placeholder, required]) =>
        html`<label class="field"
          >${label}<input
            name=${name}
            type="text"
            inputmode="decimal"
            maxlength="15"
            placeholder=${placeholder}
            ?required=${this.staticIp_ && required}
            ?disabled=${!this.staticIp_}
            .value=${values[name]}
        /></label>`,
    );
  }

  private networkPage_() {
    const network = this.network_!;
    return this.shell_(
      html`<div class="stack">
        <section class="card">
          <h2>Connection</h2>
          <div class="facts">
            <div class="fact">
              <strong>Signal</strong
              ><span
                >${signalQuality(network.rssiDbm)} · ${network.rssiDbm}
                dBm</span
              >
            </div>
            <div class="fact">
              <strong>IP address</strong><span>${network.ip}</span>
            </div>
            <div class="fact">
              <strong>Gateway</strong><span>${network.gateway}</span>
            </div>
            <div class="fact">
              <strong>DNS</strong
              ><span
                >${network.dns1Current}${network.dns2Current !== "0.0.0.0" ? `, ${network.dns2Current}` : ""}</span
              >
            </div>
            <div class="fact">
              <strong>Channel</strong><span>${network.channel}</span>
            </div>
            <div class="fact">
              <strong>BSSID</strong
              ><span>${network.bssid || "Unavailable"}</span>
            </div>
            <div class="fact">
              <strong>Device MAC</strong><span>${network.mac}</span>
            </div>
            <div class="fact">
              <strong>Reconnects</strong
              ><span
                >${network.reconnectCount} ·
                ${network.lastDisconnectReason}</span
              >
            </div>
            <div class="fact">
              <strong>NTP source</strong
              ><span
                >${
                  network.ntpFromDhcp ? "DHCP option 42" : network.ntpServer
                }</span
              >
            </div>
          </div>
        </section>
        <section class="card">
          <h2>Wi-Fi settings</h2>
          <form
            class="stack"
            @submit=${(event: SubmitEvent) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget as HTMLFormElement);
              void this.submit_(
                "/api/v1/network",
                this.networkPayload_(data),
                "Network settings saved. The display is restarting.",
              );
            }}
          >
            <label class="field"
              >Network name<input
                name="ssid"
                type="text"
                maxlength="32"
                required
                .value=${network.ssid}
            /></label>
            <label class="field"
              >Wi-Fi password
              <small>Leave empty to keep the current password</small
              ><input
                name="password"
                type="password"
                maxlength="64"
                autocomplete="new-password"
            /></label>
            <label class="field"
              >Device hostname
              <small>Available as ${network.hostname}.local</small
              ><input
                name="hostname"
                type="text"
                minlength="1"
                maxlength="32"
                pattern="[A-Za-z0-9](?:[A-Za-z0-9-]{0,30}[A-Za-z0-9])?"
                required
                .value=${network.hostname}
            /></label>
            <fieldset class="choice">
              <legend>IP address assignment</legend>
              <label class="check"
                ><input
                  type="radio"
                  name="ipMode"
                  value="dhcp"
                  .checked=${!this.staticIp_}
                  @change=${() => (this.staticIp_ = false)}
                />DHCP</label
              >
              <label class="check"
                ><input
                  type="radio"
                  name="ipMode"
                  value="static"
                  .checked=${this.staticIp_}
                  @change=${() => {
                    this.staticIp_ = true;
                    this.ntpFromDhcp_ = false;
                  }}
                />Static</label
              >
            </fieldset>
            <div class="dependent ${this.staticIp_ ? "" : "disabled"}">
              ${this.ipv4Fields_({
                staticIp: network.staticIp,
                gateway: network.staticGateway,
                subnet: network.staticSubnet,
                dns1: network.staticDns1,
                dns2: network.staticDns2,
              })}
            </div>
            <fieldset class="choice">
              <legend>NTP server</legend>
              <label class="check"
                ><input
                  type="radio"
                  name="ntpMode"
                  value="custom"
                  .checked=${!this.ntpFromDhcp_}
                  @change=${() => (this.ntpFromDhcp_ = false)}
                />Custom</label
              >
              <label class="check"
                ><input
                  type="radio"
                  name="ntpMode"
                  value="dhcp"
                  ?disabled=${this.staticIp_}
                  .checked=${this.ntpFromDhcp_}
                  @change=${() => (this.ntpFromDhcp_ = true)}
                />From DHCP</label
              >
            </fieldset>
            <label
              class="field dependent ${this.ntpFromDhcp_ ? "disabled" : ""}"
              >NTP server address
              <small
                >Hostname or IP address. DHCP mode uses option 42 and requires
                DHCP address assignment.</small
              ><input
                name="ntpServer"
                type="text"
                maxlength="63"
                required
                ?disabled=${this.ntpFromDhcp_}
                .value=${network.ntpServer || "pool.ntp.org"}
            /></label>
            <section class="form-section">
              <h3>Setup mode</h3>
              <label class="field"
                >Attempts before activation
                <small
                  >Each attempt lasts up to 20 seconds. The display then opens
                  ${network.recoverySsid}.</small
                ><input
                  name="retryLimit"
                  type="number"
                  min="1"
                  max="10"
                  required
                  .value=${String(network.retryLimit)}
              /></label>
              <label class="check"
                ><input
                  type="checkbox"
                  .checked=${this.recoveryProtected_}
                  @change=${(event: Event) =>
                    (this.recoveryProtected_ = (
                      event.target as HTMLInputElement
                    ).checked)}
                />Protect Wi-Fi with password</label
              >
              <div
                class="dependent ${this.recoveryProtected_ ? "" : "disabled"}"
              >
                <label class="field"
                  >Wi-Fi password
                  <small
                    >Shown on the physical display while active. Leave empty to
                    keep the current password.</small
                  ><input
                    name="recoveryPassword"
                    type="password"
                    minlength="8"
                    maxlength="63"
                    ?required=${this.recoveryProtected_ && !network.recoveryPasswordSet}
                    ?disabled=${!this.recoveryProtected_}
                    autocomplete="new-password"
                /></label>
              </div>
              <label class="check"
                ><input
                  type="checkbox"
                  name="resetApiAuthOnRecovery"
                  .checked=${network.resetApiAuthOnRecovery}
                />Disable panel/API password when activated</label
              >
              <p class="muted">Firmware update protection remains unchanged.</p>
            </section>
            <div class="actions">
              <button type="submit" ?disabled=${this.saving_}>
                Save and restart
              </button>
              <button
                type="button"
                class="secondary"
                ?disabled=${this.saving_}
                @click=${(event: Event) => {
                  const form = (event.currentTarget as HTMLButtonElement).form!;
                  if (!form.reportValidity()) return;
                  void this.submit_(
                    "/api/v1/network/test",
                    this.networkPayload_(new FormData(form)),
                    "Settings are valid. Connection will be verified after save.",
                    "POST",
                  );
                }}
              >
                Test settings
              </button>
            </div>
          </form>
        </section>
      </div>`,
    );
  }

  private securityPage_() {
    const security = this.security_!;
    return this.shell_(
      html`<section class="card">
        <h2>Authentication</h2>
        <p class="muted">
          Panel/API and firmware updates can be protected independently. Empty
          password fields keep existing passwords.
        </p>
        <form
          class="stack"
          @submit=${(event: SubmitEvent) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget as HTMLFormElement);
            void this.submit_(
              "/api/v1/security",
              {
                username: data.get("username"),
                apiAuthEnabled: data.has("apiAuthEnabled"),
                apiPassword: data.get("apiPassword"),
                directOtaEnabled: this.directOta_,
                otaAuthEnabled: this.setupOtaAuth_,
                otaPassword: data.get("otaPassword"),
              },
              "Security settings saved. Reload if login credentials changed.",
            );
          }}
        >
          <label class="check"
            ><input
              type="checkbox"
              name="apiAuthEnabled"
              .checked=${this.setupApiAuth_}
              @change=${(event: Event) =>
                (this.setupApiAuth_ = (
                  event.target as HTMLInputElement
                ).checked)}
            />Protect panel and Home Assistant API</label
          >
          <div class="dependent ${this.setupApiAuth_ ? "" : "disabled"}">
            <label class="field"
              >Username <small>Used for panel login and direct OTA</small
              ><input
                name="username"
                type="text"
                minlength="1"
                maxlength="32"
                pattern="[A-Za-z0-9._-]+"
                required
                ?disabled=${!this.setupApiAuth_}
                autocomplete="username"
                .value=${security.username || "admin"}
            /></label>
            <label class="field"
              >New panel/API password
              <small
                >Leave empty to keep the current password · 8-32
                characters</small
              ><input
                name="apiPassword"
                type="password"
                minlength="8"
                maxlength="32"
                ?disabled=${!this.setupApiAuth_}
                autocomplete="new-password"
            /></label>
          </div>
          <label class="check"
            ><input
              type="checkbox"
              .checked=${this.directOta_}
              @change=${(event: Event) => (this.directOta_ = (event.target as HTMLInputElement).checked)}
            />Allow direct OTA firmware updates</label
          >
          <div class="dependent ${this.directOta_ ? "" : "disabled"}">
            <label class="check"
              ><input
                type="checkbox"
                .checked=${this.setupOtaAuth_}
                ?disabled=${!this.directOta_}
                @change=${(event: Event) =>
                  (this.setupOtaAuth_ = (
                    event.target as HTMLInputElement
                  ).checked)}
              />Protect direct OTA with password</label
            >
            <div
              class="dependent ${
                this.directOta_ && this.setupOtaAuth_ ? "" : "disabled"
              }"
            >
              <label class="field"
                >OTA firmware update password
                <small
                  >Leave empty to keep the current password · 8-32
                  characters</small
                ><input
                  name="otaPassword"
                  type="password"
                  minlength="8"
                  maxlength="32"
                  ?disabled=${!this.directOta_ || !this.setupOtaAuth_}
                  autocomplete="new-password"
              /></label>
            </div>
          </div>
          <button type="submit" ?disabled=${this.saving_}>
            Save security settings
          </button>
        </form>
      </section>`,
    );
  }

  private firmwarePage_() {
    return this.shell_(
      html`<section class="card">
        <h2>Firmware update</h2>
        <p class="muted">
          Upload a compatible OTA image. Your panel login authorizes this
          update.
        </p>
        ${this.firmwareForm_()}
      </section>`,
    );
  }

  private setupPage_() {
    const setup = this.setup_;
    return html`<main class="center">
      <section class="card">
        <h1>Set up Mini Display</h1>
        <p class="muted">
          Connect to Wi-Fi and configure local access. Current setup network:
          ${setup?.recoverySsid ?? "SDPRO-Setup"}.
        </p>
        ${this.message_ ? html`<div class="notice">${this.message_}</div>` : nothing}${this.error_ ? html`<div class="error">${this.error_}</div>` : nothing}
        <form
          class="stack"
          @submit=${(event: SubmitEvent) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget as HTMLFormElement);
            void this.submit_(
              "/api/v1/setup",
              {
                ssid: data.get("ssid"),
                wifiPassword: data.get("wifiPassword"),
                hostname: data.get("hostname"),
                recoveryPasswordEnabled: this.recoveryProtected_,
                recoveryPassword: data.get("recoveryPassword"),
                ntpServer: data.get("ntpServer"),
                ntpFromDhcp: this.ntpFromDhcp_,
                staticIpEnabled: this.staticIp_,
                staticIp: data.get("staticIp"),
                gateway: data.get("gateway"),
                subnet: data.get("subnet"),
                dns1: data.get("dns1"),
                dns2: data.get("dns2"),
                username: data.get("username"),
                retryLimit: Number(data.get("retryLimit")),
                resetApiAuthOnRecovery: data.has("resetApiAuthOnRecovery"),
                apiAuthEnabled: this.setupApiAuth_,
                apiPassword: data.get("apiPassword"),
                directOtaEnabled: this.directOta_,
                otaAuthEnabled: this.setupOtaAuth_,
                otaPassword: data.get("otaPassword"),
              },
              "Configuration saved. Reconnect after the display restarts.",
            );
          }}
        >
          <label class="field"
            >Wi-Fi name<input
              name="ssid"
              type="text"
              maxlength="32"
              required
              .value=${setup?.ssid ?? ""} /></label
          ><label class="field"
            >Wi-Fi password
            <small
              >${setup?.configured ? "Leave empty to keep the current password" : "Leave empty for an open network"}</small
            ><input name="wifiPassword" type="password" maxlength="64" /></label
          ><label class="field"
            >Device hostname<input
              name="hostname"
              type="text"
              minlength="1"
              maxlength="32"
              pattern="[A-Za-z0-9](?:[A-Za-z0-9-]{0,30}[A-Za-z0-9])?"
              required
              .value=${setup?.hostname ?? "mini-display"}
          /></label>
          <fieldset class="choice">
            <legend>IP address assignment</legend>
            <label class="check"
              ><input
                type="radio"
                name="ipMode"
                value="dhcp"
                .checked=${!this.staticIp_}
                @change=${() => (this.staticIp_ = false)}
              />DHCP</label
            >
            <label class="check"
              ><input
                type="radio"
                name="ipMode"
                value="static"
                .checked=${this.staticIp_}
                @change=${() => {
                  this.staticIp_ = true;
                  this.ntpFromDhcp_ = false;
                }}
              />Static</label
            >
          </fieldset>
          <div class="dependent ${this.staticIp_ ? "" : "disabled"}">
            ${this.ipv4Fields_({
              staticIp: setup?.staticIp ?? "",
              gateway: setup?.gateway ?? "",
              subnet: setup?.subnet ?? "",
              dns1: setup?.dns1 ?? "",
              dns2: setup?.dns2 ?? "",
            })}
          </div>
          <fieldset class="choice">
            <legend>NTP server</legend>
            <label class="check"
              ><input
                type="radio"
                name="ntpMode"
                value="custom"
                .checked=${!this.ntpFromDhcp_}
                @change=${() => (this.ntpFromDhcp_ = false)}
              />Custom</label
            >
            <label class="check"
              ><input
                type="radio"
                name="ntpMode"
                value="dhcp"
                ?disabled=${this.staticIp_}
                .checked=${this.ntpFromDhcp_}
                @change=${() => (this.ntpFromDhcp_ = true)}
              />From DHCP</label
            >
          </fieldset>
          <label class="field dependent ${this.ntpFromDhcp_ ? "disabled" : ""}"
            >NTP server address
            <small
              >Hostname or IP address. DHCP mode uses option 42 and requires
              DHCP address assignment.</small
            ><input
              name="ntpServer"
              type="text"
              maxlength="63"
              required
              ?disabled=${this.ntpFromDhcp_}
              .value=${setup?.ntpServer || "pool.ntp.org"}
          /></label>
          <section class="form-section">
            <h3>Setup mode</h3>
            <label class="field"
              >Attempts before activation
              <small>Each attempt lasts up to 20 seconds</small
              ><input
                name="retryLimit"
                type="number"
                min="1"
                max="10"
                required
                .value=${String(setup?.retryLimit ?? 3)}
            /></label>
            <label class="check"
              ><input
                type="checkbox"
                .checked=${this.recoveryProtected_}
                @change=${(event: Event) =>
                  (this.recoveryProtected_ = (
                    event.target as HTMLInputElement
                  ).checked)}
              />Protect Wi-Fi with password</label
            >
            <div class="dependent ${this.recoveryProtected_ ? "" : "disabled"}">
              <label class="field"
                >Wi-Fi password
                <small
                  >Shown on the physical display while active. Leave empty to
                  keep the current password.</small
                ><input
                  name="recoveryPassword"
                  type="password"
                  minlength="8"
                  maxlength="63"
                  ?required=${this.recoveryProtected_ && !setup?.recoveryPasswordSet}
                  ?disabled=${!this.recoveryProtected_}
                  autocomplete="new-password"
              /></label>
            </div>
            <label class="check"
              ><input
                type="checkbox"
                name="resetApiAuthOnRecovery"
                .checked=${setup?.resetApiAuthOnRecovery ?? false}
              />Disable panel/API password when activated</label
            >
          </section>
          <label class="check"
            ><input
              type="checkbox"
              .checked=${this.setupApiAuth_}
              @change=${(event: Event) => (this.setupApiAuth_ = (event.target as HTMLInputElement).checked)}
            />Protect panel and Home Assistant API</label
          >
          <div class="dependent ${this.setupApiAuth_ ? "" : "disabled"}">
            <label class="field"
              >Username <small>Used for panel login and direct OTA</small
              ><input
                name="username"
                type="text"
                minlength="1"
                maxlength="32"
                pattern="[A-Za-z0-9._-]+"
                required
                ?disabled=${!this.setupApiAuth_}
                autocomplete="username"
                .value=${setup?.username ?? "admin"}
            /></label>
            <label class="field"
              >Panel/API password
              <small
                >${setup?.apiPasswordSet ? "Leave empty to keep the current password" : "8-32 characters"}</small
              ><input
                name="apiPassword"
                type="password"
                minlength="8"
                maxlength="32"
                ?required=${this.setupApiAuth_ && !setup?.apiPasswordSet}
                ?disabled=${!this.setupApiAuth_}
                autocomplete="new-password"
            /></label>
          </div>
          <label class="check"
            ><input
              type="checkbox"
              .checked=${this.directOta_}
              @change=${(event: Event) => (this.directOta_ = (event.target as HTMLInputElement).checked)}
            />Allow direct OTA firmware updates</label
          >
          <div class="dependent ${this.directOta_ ? "" : "disabled"}">
            <label class="check"
              ><input
                type="checkbox"
                .checked=${this.setupOtaAuth_}
                ?disabled=${!this.directOta_}
                @change=${(event: Event) =>
                  (this.setupOtaAuth_ = (
                    event.target as HTMLInputElement
                  ).checked)}
              />Protect direct OTA with password</label
            >
            <div
              class="dependent ${
                this.directOta_ && this.setupOtaAuth_ ? "" : "disabled"
              }"
            >
              <label class="field"
                >OTA firmware update password
                <small
                  >${setup?.otaPasswordSet ? "Leave empty to keep the current password" : "8-32 characters"}</small
                ><input
                  name="otaPassword"
                  type="password"
                  minlength="8"
                  maxlength="32"
                  ?required=${this.directOta_ && this.setupOtaAuth_ && !setup?.otaPasswordSet}
                  ?disabled=${!this.directOta_ || !this.setupOtaAuth_}
                  autocomplete="new-password"
              /></label>
            </div>
          </div>
          <button type="submit" ?disabled=${this.saving_}>
            Save and restart
          </button>
        </form>
      </section>
      ${
        !setup?.configured || setup.directOtaEnabled
          ? html`<section class="card">
              <h2>Firmware update</h2>
              <p class="muted">
                Upload firmware without leaving setup mode. Existing direct OTA
                protection remains active after prior configuration.
              </p>
              ${this.firmwareForm_("/update")}
            </section>`
          : nothing
      }
    </main>`;
  }

  render() {
    if (this.loading_) return html`<div class="loading">Loading device…</div>`;
    if (!this.configured_) return this.setupPage_();
    if (!this.status_)
      return this.shell_(
        html`<section class="card">Device data is unavailable.</section>`,
      );
    if (this.page_ === "display") return this.displayPage_();
    if (this.page_ === "network") return this.networkPage_();
    if (this.page_ === "security") return this.securityPage_();
    if (this.page_ === "firmware") return this.firmwarePage_();
    return this.overview_();
  }
}
