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
  @state() private configured = true;
  @state() private loading = true;
  @state() private saving = false;
  @state() private message = "";
  @state() private error = "";
  @state() private info?: DeviceInfo;
  @state() private status?: DeviceStatus;
  @state() private network?: NetworkStatus;
  @state() private security?: SecurityStatus;
  @state() private setup?: SetupStatus;
  @state() private brightness = 100;
  @state() private pixelShift = 0;
  @state() private setupApiAuth = true;
  @state() private setupOtaAuth = true;
  @state() private directOta = true;

  private readonly page = pageFromPath();
  private statusTimer?: number;

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
    void this.load();
    this.statusTimer = window.setInterval(
      () => void this.refreshStatus(),
      5000,
    );
  }

  disconnectedCallback() {
    if (this.statusTimer !== undefined) window.clearInterval(this.statusTimer);
    super.disconnectedCallback();
  }

  private async refreshStatus() {
    if (!this.configured || this.loading || this.saving || !this.status) return;
    try {
      this.status = await request<DeviceStatus>("/api/v1/status");
    } catch {
      // Keep the last known state; the next interval retries.
    }
  }

  private async load() {
    this.loading = true;
    this.error = "";
    try {
      const [info, status] = await Promise.all([
        request<DeviceInfo>("/api/v1/info"),
        request<DeviceStatus>("/api/v1/status"),
      ]);
      this.info = info;
      this.status = status;
      this.brightness = status.brightness;
      this.pixelShift = status.pixelShift;
      if (this.page === "network")
        this.network = await request<NetworkStatus>("/api/v1/network");
      if (this.page === "security") {
        this.security = await request<SecurityStatus>("/api/v1/security");
        this.setupApiAuth = this.security.apiAuthEnabled;
        this.setupOtaAuth = this.security.otaAuthEnabled;
        this.directOta = this.security.directOtaEnabled;
      }
    } catch (error) {
      if (error instanceof DeviceApiError && error.status === 403) {
        try {
          this.setup = await request<SetupStatus>("/api/v1/setup");
          this.configured = false;
          this.setupApiAuth = this.setup.apiAuthEnabled;
          this.setupOtaAuth = this.setup.otaAuthEnabled;
          this.directOta = this.setup.directOtaEnabled;
        } catch (setupError) {
          this.error =
            setupError instanceof Error
              ? setupError.message
              : "Could not load setup mode";
        }
      } else
        this.error =
          error instanceof Error ? error.message : "Could not load device";
    } finally {
      this.loading = false;
    }
  }

  private async submit(
    path: string,
    body: Record<string, unknown>,
    success: string,
    method: "PUT" | "POST" = "PUT",
  ) {
    this.saving = true;
    this.message = "";
    this.error = "";
    try {
      await request(path, { method, body: JSON.stringify(body) });
      this.message = success;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Request failed";
    } finally {
      this.saving = false;
    }
  }

  private navigation() {
    const items: [Page, string, string][] = [
      ["overview", "/", "Overview"],
      ["display", "/display", "Display"],
      ["network", "/network", "Network"],
      ["security", "/security", "Security"],
      ["firmware", "/update", "Firmware"],
    ];
    return html`<nav>
      ${items.map(([page, path, label]) => html`<a href=${path} aria-current=${this.page === page ? "page" : nothing}>${label}</a>`)}
    </nav>`;
  }

  private firmwareForm(endpoint = "/api/v1/firmware") {
    return html`<form
      class="stack"
      @submit=${async (event: SubmitEvent) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget as HTMLFormElement);
        const file = data.get("firmware");
        if (!(file instanceof File) || !file.size) return;
        this.saving = true;
        this.message = "";
        this.error = "";
        try {
          this.message = await uploadFirmware(file, endpoint);
        } catch (error) {
          this.error =
            error instanceof Error ? error.message : "Firmware upload failed";
        } finally {
          this.saving = false;
        }
      }}
    >
      <label class="field"
        >Firmware image<input
          type="file"
          name="firmware"
          accept=".bin"
          required /></label
      ><button type="submit" ?disabled=${this.saving}>Upload firmware</button>
    </form>`;
  }

  private shell(content: unknown) {
    return html`<header>
        <div class="head">
          <div>
            <h1>Mini Display</h1>
            <p>${this.info?.model ?? "Local display control"}</p>
          </div>
          <div class="head-status">
            ${this.status?.ip ?? "0.0.0.0"}<br />${this.status?.wifiRssiDbm ?? -127}
            dBm
          </div>
        </div>
        ${this.navigation()}
      </header>
      <main>
        ${this.message ? html`<div class="notice">${this.message}</div>` : nothing}${this.error ? html`<div class="error">${this.error}</div>` : nothing}${content}
      </main>`;
  }

  private overview() {
    const status = this.status!;
    const updateAge = lastUpdateAge(status.lastValueUpdateAgeSeconds);
    return this.shell(
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
          <h2>Memory</h2>
          <div class="metric">
            ${formatMemory(status.totalHeapBytes - status.freeHeapBytes)} used
          </div>
          <div class="muted">${formatMemory(status.freeHeapBytes)} free</div>
        </section>
        <section class="card">
          <h2>Firmware</h2>
          <div class="metric">${this.info?.firmwareVersion}</div>
          <div class="muted">Uptime ${formatUptime(status.uptimeSeconds)}</div>
        </section>
      </div>`,
    );
  }

  private displayPage() {
    const status = this.status!;
    return this.shell(
      html`<div class="grid">
        <section class="card">
          <h2>Screen</h2>
          <form
            class="stack"
            @submit=${(event: SubmitEvent) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget as HTMLFormElement);
              void this.submit(
                "/api/v1/display",
                {
                  on: data.has("on"),
                  brightness: this.brightness,
                  pixelShift: this.pixelShift,
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
              >Brightness <small>${this.brightness}%</small
              ><input
                type="range"
                min="0"
                max="100"
                .value=${String(this.brightness)}
                @input=${(event: Event) => (this.brightness = Number((event.target as HTMLInputElement).value))}
            /></label>
            <label class="field"
              >Pixel shift
              <small
                >${this.pixelShift}px · periodically moves content to reduce
                image retention</small
              ><input
                type="range"
                min="0"
                max="10"
                .value=${String(this.pixelShift)}
                @input=${(event: Event) => (this.pixelShift = Number((event.target as HTMLInputElement).value))}
            /></label>
            <button type="submit" ?disabled=${this.saving}>
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
                  @click=${() => void this.submit("/api/v1/page", command === "auto" ? { mode: "auto" } : { command }, `Page mode changed to ${label.toLowerCase()}.`, "POST")}
                >
                  ${label}
                </button>`,
            )}
          </div>
        </section>
      </div>`,
    );
  }

  private networkPage() {
    return this.shell(
      html`<section class="card">
        <h2>Wi-Fi</h2>
        <form
          class="stack"
          @submit=${(event: SubmitEvent) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget as HTMLFormElement);
            void this.submit(
              "/api/v1/network",
              {
                ssid: data.get("ssid"),
                password: data.get("password"),
                hostname: data.get("hostname"),
                retryLimit: Number(data.get("retryLimit")),
                resetApiAuthOnRecovery: data.has("resetApiAuthOnRecovery"),
              },
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
              .value=${this.network?.ssid ?? ""}
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
            <small
              >Available as
              ${this.network?.hostname ?? "mini-display"}.local</small
            ><input
              name="hostname"
              type="text"
              minlength="1"
              maxlength="32"
              pattern="[A-Za-z0-9](?:[A-Za-z0-9-]{0,30}[A-Za-z0-9])?"
              required
              .value=${this.network?.hostname ?? ""}
          /></label>
          <label class="field"
            >Attempts before recovery Wi-Fi
            <small
              >Each attempt lasts up to 20 seconds. Recovery network:
              ${this.network?.recoverySsid ?? "SDPRO-Setup"}</small
            ><input
              name="retryLimit"
              type="number"
              min="1"
              max="10"
              required
              .value=${String(this.network?.retryLimit ?? 3)}
          /></label>
          <label class="check"
            ><input
              type="checkbox"
              name="resetApiAuthOnRecovery"
              .checked=${this.network?.resetApiAuthOnRecovery ?? false}
            />Disable panel/API password when recovery Wi-Fi starts</label
          >
          <p class="muted">
            Firmware update protection is not changed by network recovery.
          </p>
          <button type="submit" ?disabled=${this.saving}>
            Save and restart
          </button>
        </form>
      </section>`,
    );
  }

  private securityPage() {
    const security = this.security!;
    return this.shell(
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
            void this.submit(
              "/api/v1/security",
              {
                username: data.get("username"),
                apiAuthEnabled: data.has("apiAuthEnabled"),
                apiPassword: data.get("apiPassword"),
                directOtaEnabled: this.directOta,
                otaAuthEnabled: this.setupOtaAuth,
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
              .checked=${this.setupApiAuth}
              @change=${(event: Event) =>
                (this.setupApiAuth = (
                  event.target as HTMLInputElement
                ).checked)}
            />Protect panel and Home Assistant API</label
          >
          <div class="dependent ${this.setupApiAuth ? "" : "disabled"}">
            <label class="field"
              >Username <small>Used for panel login and direct OTA</small
              ><input
                name="username"
                type="text"
                minlength="1"
                maxlength="32"
                pattern="[A-Za-z0-9._-]+"
                required
                ?disabled=${!this.setupApiAuth}
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
                ?disabled=${!this.setupApiAuth}
                autocomplete="new-password"
            /></label>
          </div>
          <label class="check"
            ><input
              type="checkbox"
              .checked=${this.directOta}
              @change=${(event: Event) => (this.directOta = (event.target as HTMLInputElement).checked)}
            />Allow direct OTA firmware updates</label
          >
          <div class="dependent ${this.directOta ? "" : "disabled"}">
            <label class="check"
              ><input
                type="checkbox"
                .checked=${this.setupOtaAuth}
                ?disabled=${!this.directOta}
                @change=${(event: Event) =>
                  (this.setupOtaAuth = (
                    event.target as HTMLInputElement
                  ).checked)}
              />Protect direct OTA with password</label
            >
            <div
              class="dependent ${
                this.directOta && this.setupOtaAuth ? "" : "disabled"
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
                  ?disabled=${!this.directOta || !this.setupOtaAuth}
                  autocomplete="new-password"
              /></label>
            </div>
          </div>
          <button type="submit" ?disabled=${this.saving}>
            Save security settings
          </button>
        </form>
      </section>`,
    );
  }

  private firmwarePage() {
    return this.shell(
      html`<section class="card">
        <h2>Firmware update</h2>
        <p class="muted">
          Upload a compatible OTA image. Your panel login authorizes this
          update.
        </p>
        ${this.firmwareForm()}
      </section>`,
    );
  }

  private setupPage() {
    const setup = this.setup;
    return html`<main class="center">
      <section class="card">
        <h1>Set up Mini Display</h1>
        <p class="muted">
          Connect to Wi-Fi and configure local access. Current setup network:
          ${setup?.recoverySsid ?? "SDPRO-Setup"}.
        </p>
        ${this.message ? html`<div class="notice">${this.message}</div>` : nothing}${this.error ? html`<div class="error">${this.error}</div>` : nothing}
        <form
          class="stack"
          @submit=${(event: SubmitEvent) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget as HTMLFormElement);
            void this.submit(
              "/api/v1/setup",
              {
                ssid: data.get("ssid"),
                wifiPassword: data.get("wifiPassword"),
                hostname: data.get("hostname"),
                username: data.get("username"),
                retryLimit: Number(data.get("retryLimit")),
                resetApiAuthOnRecovery: data.has("resetApiAuthOnRecovery"),
                apiAuthEnabled: this.setupApiAuth,
                apiPassword: data.get("apiPassword"),
                directOtaEnabled: this.directOta,
                otaAuthEnabled: this.setupOtaAuth,
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
              .value=${setup?.hostname ?? "mini-display"} /></label
          ><label class="field"
            >Attempts before setup Wi-Fi
            <small>Each attempt lasts up to 20 seconds</small
            ><input
              name="retryLimit"
              type="number"
              min="1"
              max="10"
              required
              .value=${String(setup?.retryLimit ?? 3)} /></label
          ><label class="check"
            ><input
              type="checkbox"
              name="resetApiAuthOnRecovery"
              .checked=${setup?.resetApiAuthOnRecovery ?? false}
            />Disable panel/API password when setup Wi-Fi starts</label
          ><label class="check"
            ><input
              type="checkbox"
              .checked=${this.setupApiAuth}
              @change=${(event: Event) => (this.setupApiAuth = (event.target as HTMLInputElement).checked)}
            />Protect panel and Home Assistant API</label
          >
          <div class="dependent ${this.setupApiAuth ? "" : "disabled"}">
            <label class="field"
              >Username <small>Used for panel login and direct OTA</small
              ><input
                name="username"
                type="text"
                minlength="1"
                maxlength="32"
                pattern="[A-Za-z0-9._-]+"
                required
                ?disabled=${!this.setupApiAuth}
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
                ?required=${this.setupApiAuth && !setup?.apiPasswordSet}
                ?disabled=${!this.setupApiAuth}
                autocomplete="new-password"
            /></label>
          </div>
          <label class="check"
            ><input
              type="checkbox"
              .checked=${this.directOta}
              @change=${(event: Event) => (this.directOta = (event.target as HTMLInputElement).checked)}
            />Allow direct OTA firmware updates</label
          >
          <div class="dependent ${this.directOta ? "" : "disabled"}">
            <label class="check"
              ><input
                type="checkbox"
                .checked=${this.setupOtaAuth}
                ?disabled=${!this.directOta}
                @change=${(event: Event) =>
                  (this.setupOtaAuth = (
                    event.target as HTMLInputElement
                  ).checked)}
              />Protect direct OTA with password</label
            >
            <div
              class="dependent ${
                this.directOta && this.setupOtaAuth ? "" : "disabled"
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
                  ?required=${this.directOta && this.setupOtaAuth && !setup?.otaPasswordSet}
                  ?disabled=${!this.directOta || !this.setupOtaAuth}
                  autocomplete="new-password"
              /></label>
            </div>
          </div>
          <button type="submit" ?disabled=${this.saving}>
            Save and restart
          </button>
        </form>
      </section>
      ${
        !setup?.configured || setup.directOtaEnabled
          ? html`<section class="card">
              <h2>Firmware recovery</h2>
              <p class="muted">
                Upload firmware without leaving setup mode. Existing direct OTA
                protection remains active after prior configuration.
              </p>
              ${this.firmwareForm("/update")}
            </section>`
          : nothing
      }
    </main>`;
  }

  render() {
    if (this.loading) return html`<div class="loading">Loading device…</div>`;
    if (!this.configured) return this.setupPage();
    if (!this.status)
      return this.shell(
        html`<section class="card">Device data is unavailable.</section>`,
      );
    if (this.page === "display") return this.displayPage();
    if (this.page === "network") return this.networkPage();
    if (this.page === "security") return this.securityPage();
    if (this.page === "firmware") return this.firmwarePage();
    return this.overview();
  }
}
