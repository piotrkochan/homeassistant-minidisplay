export type DeviceInfo = {
  name: string;
  model: string;
  hardwareProfile: string;
  firmwareVersion: string;
  width: number;
  height: number;
};

export type DeviceStatus = {
  connected: boolean;
  ip: string;
  displayOn: boolean;
  brightness: number;
  pixelShift: number;
  timezone: string;
  localTime: string;
  localDate: string;
  ntpServer: string;
  page: string;
  rotation: "auto" | "manual";
  uptimeSeconds: number;
  freeHeapBytes: number;
  totalHeapBytes: number;
  minimumFreeHeapBytes?: number;
  wifiRssiDbm: number;
  lastValueUpdateAgeSeconds: number;
  recoverySsid: string;
  pages: string[];
};

export type NetworkStatus = {
  ssid: string;
  hostname: string;
  ip: string;
  rssiDbm: number;
  gateway: string;
  dns1Current: string;
  dns2Current: string;
  channel: number;
  bssid: string;
  mac: string;
  reconnectCount: number;
  lastDisconnectReason: string;
  retryLimit: number;
  resetApiAuthOnRecovery: boolean;
  recoverySsid: string;
  recoveryPasswordSet: boolean;
  ntpServer: string;
  ntpFromDhcp: boolean;
  staticIpEnabled: boolean;
  staticIp: string;
  staticGateway: string;
  staticSubnet: string;
  staticDns1: string;
  staticDns2: string;
};

export type SecurityStatus = {
  username: string;
  apiAuthEnabled: boolean;
  otaAuthEnabled: boolean;
  directOtaEnabled: boolean;
};

export type SetupStatus = {
  configured: boolean;
  ssid: string;
  hostname: string;
  username: string;
  retryLimit: number;
  resetApiAuthOnRecovery: boolean;
  apiAuthEnabled: boolean;
  apiPasswordSet: boolean;
  otaAuthEnabled: boolean;
  otaPasswordSet: boolean;
  directOtaEnabled: boolean;
  recoverySsid: string;
  recoveryPasswordSet: boolean;
  ntpServer: string;
  ntpFromDhcp: boolean;
  staticIpEnabled: boolean;
  staticIp: string;
  gateway: string;
  subnet: string;
  dns1: string;
  dns2: string;
};

export class DeviceApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...init.headers }
      : init?.headers,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    const body = await response.text();
    try {
      const payload = JSON.parse(body) as { message?: string; error?: string };
      message = payload.message ?? payload.error ?? message;
    } catch {
      message = body || message;
    }
    throw new DeviceApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function uploadFirmware(
  file: File,
  endpoint = "/api/v1/firmware",
): Promise<string> {
  const body = new FormData();
  body.append("firmware", file);
  const response = await fetch(endpoint, {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    body,
  });
  const message = await response.text();
  if (!response.ok) {
    throw new DeviceApiError(
      response.status,
      message || `Upload failed (${response.status})`,
    );
  }
  return message;
}
