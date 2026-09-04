import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { SecurityStatus } from "../api";
import { pageStyles } from "../styles";
import type { SubmitRequest } from "./shared";

@customElement("mini-display-security-page")
export class SecurityPage extends LitElement {
  @property({ attribute: false }) security?: SecurityStatus;
  @property({ attribute: false }) saving = false;
  @property({ attribute: false }) submit?: SubmitRequest;

  @state() private apiAuth_ = true;
  @state() private otaAuth_ = true;
  @state() private directOta_ = true;
  private initialized_ = false;

  static styles = pageStyles;

  protected willUpdate() {
    if (!this.security || this.initialized_) return;
    this.apiAuth_ = this.security.apiAuthEnabled;
    this.otaAuth_ = this.security.otaAuthEnabled;
    this.directOta_ = this.security.directOtaEnabled;
    this.initialized_ = true;
  }

  render() {
    const security = this.security;
    if (!security) return nothing;
    return html`<section class="card">
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
          this.submit?.(
            "/api/v1/security",
            {
              username: data.get("username"),
              apiAuthEnabled: data.has("apiAuthEnabled"),
              apiPassword: data.get("apiPassword"),
              directOtaEnabled: this.directOta_,
              otaAuthEnabled: this.otaAuth_,
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
            .checked=${this.apiAuth_}
            @change=${(event: Event) =>
              (this.apiAuth_ = (event.target as HTMLInputElement).checked)}
          />Protect panel and Home Assistant API</label
        >
        <div class="dependent ${this.apiAuth_ ? "" : "disabled"}">
          <label class="field"
            >Username <small>Used for panel login and direct OTA</small
            ><input
              name="username"
              type="text"
              minlength="1"
              maxlength="32"
              pattern="[A-Za-z0-9._-]+"
              required
              ?disabled=${!this.apiAuth_}
              autocomplete="username"
              .value=${security.username || "admin"}
          /></label>
          <label class="field"
            >New panel/API password
            <small
              >Leave empty to keep the current password · 8-32 characters</small
            ><input
              name="apiPassword"
              type="password"
              minlength="8"
              maxlength="32"
              ?disabled=${!this.apiAuth_}
              autocomplete="new-password"
          /></label>
        </div>
        <label class="check"
          ><input
            type="checkbox"
            .checked=${this.directOta_}
            @change=${(event: Event) =>
              (this.directOta_ = (event.target as HTMLInputElement).checked)}
          />Allow direct OTA firmware updates</label
        >
        <div class="dependent ${this.directOta_ ? "" : "disabled"}">
          <label class="check"
            ><input
              type="checkbox"
              .checked=${this.otaAuth_}
              ?disabled=${!this.directOta_}
              @change=${(event: Event) =>
                (this.otaAuth_ = (event.target as HTMLInputElement).checked)}
            />Protect direct OTA with password</label
          >
          <div
            class="dependent ${
              this.directOta_ && this.otaAuth_ ? "" : "disabled"
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
                ?disabled=${!this.directOta_ || !this.otaAuth_}
                autocomplete="new-password"
            /></label>
          </div>
        </div>
        <button type="submit" ?disabled=${this.saving}>
          Save security settings
        </button>
      </form>
    </section>`;
  }
}
