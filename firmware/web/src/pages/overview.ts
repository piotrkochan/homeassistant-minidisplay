import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { DeviceInfo, DeviceStatus } from "../api";
import { formatMemory, formatUptime, lastUpdateAge } from "../format";
import { pageStyles } from "../styles";

@customElement("mini-display-overview")
export class OverviewPage extends LitElement {
  @property({ attribute: false }) info?: DeviceInfo;
  @property({ attribute: false }) status?: DeviceStatus;

  static styles = pageStyles;

  render() {
    const status = this.status;
    if (!status)
      return html`<section class="card">Device data is unavailable.</section>`;
    const updateAge = lastUpdateAge(status.lastValueUpdateAgeSeconds);
    return html`<div class="grid">
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
          ${
            status.rotation === "auto"
              ? "Automatic rotation"
              : "Manual selection"
          }
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
        <div class="metric">${this.info?.firmwareVersion}</div>
        <div class="muted">Uptime ${formatUptime(status.uptimeSeconds)}</div>
      </section>
    </div>`;
  }
}
