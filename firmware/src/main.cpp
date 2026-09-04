#include <Arduino.h>
#include <ArduinoJson.h>
#include <ctype.h>
#include <EEPROM.h>
#if defined(ESP8266)
#include <ESP8266mDNS.h>
#include <ESP8266WebServer.h>
#include <ESP8266WiFi.h>
#include <sntp.h>
#include <Updater.h>
#else
#include <esp_sntp.h>
#include <ESPmDNS.h>
#include <WebServer.h>
#include <WiFi.h>
#include <Update.h>
#endif
#include <LittleFS.h>
#include <WiFiUdp.h>
#include "DisplayCompat.h"
#include "PageTransitionRenderer.h"
#include "ProgressRenderer.h"
#include "WebAssets.generated.h"

namespace {

constexpr uint32_t kLegacyConfigMagic = 0x53445031;
constexpr uint32_t kV2ConfigMagic = 0x53445032;
constexpr uint32_t kV3ConfigMagic = 0x53445033;
constexpr uint32_t kConfigMagic = 0x53445034;
constexpr size_t kEepromSize = 512;
constexpr uint32_t kConnectTimeoutMs = 20000;
constexpr uint8_t kDefaultWifiRetryLimit = 3;
#ifndef MINI_DISPLAY_VERSION
#define MINI_DISPLAY_VERSION "0.3.0-dev"
#endif
constexpr char kFirmwareVersion[] = MINI_DISPLAY_VERSION;
#if defined(HARDWARE_PROFILE_GEEKMAGIC_ESP32C2)
constexpr char kHardwareProfile[] = "geekmagic-smalltv-esp32c2";
constexpr char kHardwareModel[] = "GeekMagic SmallTV (ESP32-C2)";
#elif defined(HARDWARE_PROFILE_GEEKMAGIC_PRO)
constexpr char kHardwareProfile[] = "geekmagic-smalltv-pro";
constexpr char kHardwareModel[] = "GeekMagic SmallTV Pro";
#elif defined(HARDWARE_PROFILE_GEEKMAGIC_NOCS)
constexpr char kHardwareProfile[] = "geekmagic-smalltv-nocs";
constexpr char kHardwareModel[] = "GeekMagic SmallTV (no CS)";
#elif defined(HARDWARE_PROFILE_GEEKMAGIC_CS15)
constexpr char kHardwareProfile[] = "geekmagic-smalltv-cs15";
constexpr char kHardwareModel[] = "GeekMagic SmallTV / Ultra (CS15)";
#else
constexpr char kHardwareProfile[] = "juzipi-sd-pro";
constexpr char kHardwareModel[] = "JUZIPi SD PRO";
#endif
constexpr char kDashboardPath[] = "/dashboard.json";
constexpr char kDashboardTempPath[] = "/dashboard.tmp";
constexpr char kDashboardBackupPath[] = "/dashboard.bak";
constexpr char kDisplaySettingsPath[] = "/display.json";
constexpr char kDisplaySettingsTempPath[] = "/display.tmp";
constexpr char kNetworkSettingsPath[] = "/network.json";
constexpr char kNetworkSettingsTempPath[] = "/network.tmp";
constexpr size_t kMaxDashboardBytes = 12 * 1024;
constexpr size_t kMaxDataBytes = 8 * 1024;
constexpr uint8_t kMaxPages = 16;
constexpr uint8_t kMaxValues = 32;
constexpr uint8_t kMaxPixelShift = 10;
constexpr uint32_t kPixelShiftIntervalMs = 60000;
constexpr char kDefaultTimezone[] = "CET-1CEST,M3.5.0,M10.5.0/3";
constexpr char kDefaultNtpServer[] = "pool.ntp.org";
constexpr uint8_t kExtendLeft = 1U << 0;
constexpr uint8_t kExtendRight = 1U << 1;
constexpr uint8_t kExtendTop = 1U << 2;
constexpr uint8_t kExtendBottom = 1U << 3;

struct LegacyDeviceConfig {
  uint32_t magic;
  char ssid[33];
  char wifiPassword[65];
  char otaPassword[33];
  uint32_t checksum;
};

struct DeviceConfig {
  uint32_t magic;
  char ssid[33];
  char wifiPassword[65];
  char apiPassword[33];
  char otaPassword[33];
  char hostname[33];
  char username[33];
  uint8_t apiAuthEnabled;
  uint8_t otaAuthEnabled;
  uint8_t wifiRetryLimit;
  uint8_t resetApiAuthOnRecovery;
  uint8_t directOtaEnabled;
  uint8_t reserved[3];
  uint32_t checksum;
};

struct V3DeviceConfig {
  uint32_t magic;
  char ssid[33];
  char wifiPassword[65];
  char apiPassword[33];
  char otaPassword[33];
  char hostname[33];
  uint8_t apiAuthEnabled;
  uint8_t otaAuthEnabled;
  uint8_t wifiRetryLimit;
  uint8_t resetApiAuthOnRecovery;
  uint8_t directOtaEnabled;
  uint8_t reserved[3];
  uint32_t checksum;
};

struct V2DeviceConfig {
  uint32_t magic;
  char ssid[33];
  char wifiPassword[65];
  char apiPassword[33];
  char otaPassword[33];
  char hostname[33];
  uint8_t apiAuthEnabled;
  uint8_t otaAuthEnabled;
  uint8_t wifiRetryLimit;
  uint8_t resetApiAuthOnRecovery;
  uint32_t checksum;
};

struct NetworkSettings {
  char recoveryPassword[64];
  char ntpServer[64] = "pool.ntp.org";
  char staticIp[16];
  char gateway[16];
  char subnet[16];
  char dns1[16];
  char dns2[16];
  bool staticIpEnabled;
  bool ntpFromDhcp;
};

DeviceConfig config{};
NetworkSettings networkSettings{};
#if defined(ESP8266)
ESP8266WebServer server(80);
#else
WebServer server(80);
#endif
MiniDisplay display;
uint32_t connectStartedAt = 0;
uint8_t wifiAttemptCount = 0;
bool wifiWasConnected = false;
bool accessPointRunning = false;
uint8_t setupStationCount = UINT8_MAX;
uint32_t setupScreenUpdatedAt = 0;
uint32_t reconnectCount = 0;
wl_status_t lastDisconnectStatus = WL_IDLE_STATUS;
bool routesReady = false;
bool filesystemReady = false;
bool mdnsReady = false;
bool displayOn = true;
uint8_t displayBrightness = 100;
uint8_t displayPixelShift = 0;
char displayTimezone[64] = "CET-1CEST,M3.5.0,M10.5.0/3";
int8_t pixelShiftX = 0;
int8_t pixelShiftY = 0;
uint32_t pixelShiftAt = 0;
bool pageRotationAuto = true;
uint8_t activePageIndex = 0;
uint32_t pageShownAt = 0;
time_t lastClockTick = static_cast<time_t>(-1);

struct DashboardPage {
  char id[33];
  uint32_t durationMs;
  PageTransitionConfig transition;
  bool hasClock;
  bool clockShowsSeconds;
};

DashboardPage dashboardPages[kMaxPages]{};
uint8_t dashboardPageCount = 0;

struct DashboardValue {
  char source[65];
  char state[49];
  bool available;
};

DashboardValue dashboardValues[kMaxValues]{};
uint8_t dashboardValueCount = 0;
CachedPage transitionPages[2]{};
uint32_t pendingChangedValues = 0;
bool fullRenderPending = false;
uint32_t lastValueUpdateAt = 0;
bool hasValueUpdate = false;
uint32_t minimumFreeHeapBytes = UINT32_MAX;
#if defined(ESP8266)
char lastResetReason[48]{};
#endif

bool renderDashboardPage();
bool renderDashboardPage(const uint32_t *changedValues,
                         bool clear = true);
void showPageWithTransition(uint8_t nextPageIndex);
void showSetupScreen();

void recordFreeHeap() {
  minimumFreeHeapBytes = min(minimumFreeHeapBytes, ESP.getFreeHeap());
}

void updatePixelShift() {
  if (displayPixelShift == 0) {
    pixelShiftX = 0;
    pixelShiftY = 0;
    return;
  }
  int8_t nextX = pixelShiftX;
  int8_t nextY = pixelShiftY;
  for (uint8_t attempt = 0; attempt < 8 && nextX == pixelShiftX &&
                            nextY == pixelShiftY;
       ++attempt) {
    nextX = random(-displayPixelShift, displayPixelShift + 1);
    nextY = random(-displayPixelShift, displayPixelShift + 1);
  }
  if (nextX == pixelShiftX && nextY == pixelShiftY) {
    nextX = pixelShiftX == displayPixelShift ? -displayPixelShift
                                             : pixelShiftX + 1;
  }
  pixelShiftX = nextX;
  pixelShiftY = nextY;
}

void loadDisplaySettings() {
  if (!filesystemReady || !LittleFS.exists(kDisplaySettingsPath)) return;
  File file = LittleFS.open(kDisplaySettingsPath, "r");
  if (!file) return;
  StaticJsonDocument<192> document;
  const auto error = deserializeJson(document, file);
  file.close();
  if (error) return;
  const int brightness = document["brightness"] | 100;
  const int pixelShift = document["pixelShift"] | 0;
  strlcpy(displayTimezone, document["timezone"] | kDefaultTimezone,
          sizeof(displayTimezone));
  if (brightness >= 0 && brightness <= 100) displayBrightness = brightness;
  if (pixelShift >= 0 && pixelShift <= kMaxPixelShift) {
    displayPixelShift = pixelShift;
  }
  updatePixelShift();
  pixelShiftAt = millis();
}

void saveDisplaySettings() {
  if (!filesystemReady) return;
  File file = LittleFS.open(kDisplaySettingsTempPath, "w");
  if (!file) return;
  StaticJsonDocument<192> document;
  document["brightness"] = displayBrightness;
  document["pixelShift"] = displayPixelShift;
  document["timezone"] = displayTimezone;
  if (serializeJson(document, file) == 0) {
    file.close();
    LittleFS.remove(kDisplaySettingsTempPath);
    return;
  }
  file.close();
  LittleFS.remove(kDisplaySettingsPath);
  LittleFS.rename(kDisplaySettingsTempPath, kDisplaySettingsPath);
}

bool timezoneValid(const char *value) {
  const size_t length = strlen(value);
  if (length == 0 || length >= sizeof(displayTimezone)) return false;
  for (size_t index = 0; index < length; ++index) {
    const unsigned char character = value[index];
    if (character < 0x20 || character > 0x7e) return false;
  }
  return true;
}

void applyTimezone() {
  setenv("TZ", displayTimezone, 1);
  tzset();
}

void loadNetworkSettings() {
  if (!filesystemReady || !LittleFS.exists(kNetworkSettingsPath)) return;
  File file = LittleFS.open(kNetworkSettingsPath, "r");
  if (!file) return;
  StaticJsonDocument<512> document;
  const auto error = deserializeJson(document, file);
  file.close();
  if (error) return;
  strlcpy(networkSettings.recoveryPassword,
          document["recoveryPassword"] | "",
          sizeof(networkSettings.recoveryPassword));
  strlcpy(networkSettings.ntpServer,
          document["ntpServer"] | kDefaultNtpServer,
          sizeof(networkSettings.ntpServer));
  strlcpy(networkSettings.staticIp, document["staticIp"] | "",
          sizeof(networkSettings.staticIp));
  strlcpy(networkSettings.gateway, document["gateway"] | "",
          sizeof(networkSettings.gateway));
  strlcpy(networkSettings.subnet, document["subnet"] | "",
          sizeof(networkSettings.subnet));
  strlcpy(networkSettings.dns1, document["dns1"] | "",
          sizeof(networkSettings.dns1));
  strlcpy(networkSettings.dns2, document["dns2"] | "",
          sizeof(networkSettings.dns2));
  networkSettings.staticIpEnabled = document["staticIpEnabled"] | false;
  networkSettings.ntpFromDhcp = document["ntpFromDhcp"] | false;
}

bool saveNetworkSettings() {
  if (!filesystemReady) return false;
  File file = LittleFS.open(kNetworkSettingsTempPath, "w");
  if (!file) return false;
  StaticJsonDocument<512> document;
  document["recoveryPassword"] = networkSettings.recoveryPassword;
  document["ntpServer"] = networkSettings.ntpServer;
  document["ntpFromDhcp"] = networkSettings.ntpFromDhcp;
  document["staticIpEnabled"] = networkSettings.staticIpEnabled;
  document["staticIp"] = networkSettings.staticIp;
  document["gateway"] = networkSettings.gateway;
  document["subnet"] = networkSettings.subnet;
  document["dns1"] = networkSettings.dns1;
  document["dns2"] = networkSettings.dns2;
  if (serializeJson(document, file) == 0) {
    file.close();
    LittleFS.remove(kNetworkSettingsTempPath);
    return false;
  }
  file.close();
  LittleFS.remove(kNetworkSettingsPath);
  return LittleFS.rename(kNetworkSettingsTempPath, kNetworkSettingsPath);
}

bool ipv4Valid(const char *value, bool required) {
  if (!value[0]) return !required;
  IPAddress address;
  return address.fromString(value);
}

bool ntpServerValid(const char *value) {
  const size_t length = strlen(value);
  if (length == 0 || length >= sizeof(networkSettings.ntpServer)) return false;
  for (size_t index = 0; index < length; ++index) {
    const unsigned char character = value[index];
    if (!isalnum(character) && character != '.' && character != '-' &&
        character != ':' && character != '_') {
      return false;
    }
  }
  return true;
}

bool networkExtrasValid(const JsonDocument &document) {
  const bool recoveryPasswordEnabled =
      document["recoveryPasswordEnabled"] |
      (networkSettings.recoveryPassword[0] != '\0');
  const char *recoveryPassword = document["recoveryPassword"] | "";
  const size_t nextRecoveryPasswordLength =
      recoveryPassword[0] ? strlen(recoveryPassword)
                          : strlen(networkSettings.recoveryPassword);
  const bool staticIpEnabled =
      document["staticIpEnabled"] | networkSettings.staticIpEnabled;
  const bool ntpFromDhcp =
      document["ntpFromDhcp"] | networkSettings.ntpFromDhcp;
  const char *ntpServer = document["ntpServer"] | networkSettings.ntpServer;
  const char *staticIp = document["staticIp"] | networkSettings.staticIp;
  const char *gateway = document["gateway"] | networkSettings.gateway;
  const char *subnet = document["subnet"] | networkSettings.subnet;
  const char *dns1 = document["dns1"] | networkSettings.dns1;
  const char *dns2 = document["dns2"] | networkSettings.dns2;
  return (!recoveryPasswordEnabled ||
          (nextRecoveryPasswordLength >= 8 &&
           nextRecoveryPasswordLength <= 63)) &&
         (!ntpFromDhcp || !staticIpEnabled) &&
         (ntpFromDhcp || ntpServerValid(ntpServer)) &&
         (!staticIpEnabled ||
          (ipv4Valid(staticIp, true) && ipv4Valid(gateway, true) &&
           ipv4Valid(subnet, true) && ipv4Valid(dns1, false) &&
           ipv4Valid(dns2, false)));
}

void updateNetworkExtras(const JsonDocument &document) {
  const bool recoveryPasswordEnabled =
      document["recoveryPasswordEnabled"] |
      (networkSettings.recoveryPassword[0] != '\0');
  const char *recoveryPassword = document["recoveryPassword"] | "";
  if (!recoveryPasswordEnabled) {
    memset(networkSettings.recoveryPassword, 0,
           sizeof(networkSettings.recoveryPassword));
  } else if (recoveryPassword[0]) {
    strlcpy(networkSettings.recoveryPassword, recoveryPassword,
            sizeof(networkSettings.recoveryPassword));
  }
  networkSettings.staticIpEnabled =
      document["staticIpEnabled"] | networkSettings.staticIpEnabled;
  networkSettings.ntpFromDhcp =
      document["ntpFromDhcp"] | networkSettings.ntpFromDhcp;
  strlcpy(networkSettings.ntpServer,
          document["ntpServer"] | networkSettings.ntpServer,
          sizeof(networkSettings.ntpServer));
  strlcpy(networkSettings.staticIp,
          document["staticIp"] | networkSettings.staticIp,
          sizeof(networkSettings.staticIp));
  strlcpy(networkSettings.gateway,
          document["gateway"] | networkSettings.gateway,
          sizeof(networkSettings.gateway));
  strlcpy(networkSettings.subnet,
          document["subnet"] | networkSettings.subnet,
          sizeof(networkSettings.subnet));
  strlcpy(networkSettings.dns1, document["dns1"] | networkSettings.dns1,
          sizeof(networkSettings.dns1));
  strlcpy(networkSettings.dns2, document["dns2"] | networkSettings.dns2,
          sizeof(networkSettings.dns2));
}

uint32_t checksum(const DeviceConfig &value) {
  const auto *bytes = reinterpret_cast<const uint8_t *>(&value);
  uint32_t hash = 2166136261UL;
  for (size_t index = 0; index < offsetof(DeviceConfig, checksum); ++index) {
    hash ^= bytes[index];
    hash *= 16777619UL;
  }
  return hash;
}

uint32_t checksum(const LegacyDeviceConfig &value) {
  const auto *bytes = reinterpret_cast<const uint8_t *>(&value);
  uint32_t hash = 2166136261UL;
  for (size_t index = 0; index < offsetof(LegacyDeviceConfig, checksum);
       ++index) {
    hash ^= bytes[index];
    hash *= 16777619UL;
  }
  return hash;
}

uint32_t checksum(const V2DeviceConfig &value) {
  const auto *bytes = reinterpret_cast<const uint8_t *>(&value);
  uint32_t hash = 2166136261UL;
  for (size_t index = 0; index < offsetof(V2DeviceConfig, checksum); ++index) {
    hash ^= bytes[index];
    hash *= 16777619UL;
  }
  return hash;
}

uint32_t checksum(const V3DeviceConfig &value) {
  const auto *bytes = reinterpret_cast<const uint8_t *>(&value);
  uint32_t hash = 2166136261UL;
  for (size_t index = 0; index < offsetof(V3DeviceConfig, checksum); ++index) {
    hash ^= bytes[index];
    hash *= 16777619UL;
  }
  return hash;
}

bool configValid() {
  return config.magic == kConfigMagic && config.checksum == checksum(config) &&
         config.ssid[0] != '\0';
}

bool legacyConfigValid(const LegacyDeviceConfig &value) {
  return value.magic == kLegacyConfigMagic &&
         value.checksum == checksum(value) && value.ssid[0] != '\0' &&
         strlen(value.otaPassword) >= 8;
}

bool v2ConfigValid(const V2DeviceConfig &value) {
  return value.magic == kV2ConfigMagic && value.checksum == checksum(value) &&
         value.ssid[0] != '\0';
}

bool v3ConfigValid(const V3DeviceConfig &value) {
  return value.magic == kV3ConfigMagic && value.checksum == checksum(value) &&
         value.ssid[0] != '\0';
}

void saveConfig();

void loadConfig() {
  EEPROM.begin(kEepromSize);
  EEPROM.get(0, config);
  if (configValid()) return;

  V3DeviceConfig v3{};
  EEPROM.get(0, v3);
  if (v3ConfigValid(v3)) {
    memset(&config, 0, sizeof(config));
    strlcpy(config.ssid, v3.ssid, sizeof(config.ssid));
    strlcpy(config.wifiPassword, v3.wifiPassword,
            sizeof(config.wifiPassword));
    strlcpy(config.apiPassword, v3.apiPassword,
            sizeof(config.apiPassword));
    strlcpy(config.otaPassword, v3.otaPassword,
            sizeof(config.otaPassword));
    strlcpy(config.hostname, v3.hostname, sizeof(config.hostname));
    strlcpy(config.username, "admin", sizeof(config.username));
    config.apiAuthEnabled = v3.apiAuthEnabled;
    config.otaAuthEnabled = v3.otaAuthEnabled;
    config.wifiRetryLimit = v3.wifiRetryLimit;
    config.resetApiAuthOnRecovery = v3.resetApiAuthOnRecovery;
    config.directOtaEnabled = v3.directOtaEnabled;
    saveConfig();
    return;
  }

  V2DeviceConfig v2{};
  EEPROM.get(0, v2);
  if (v2ConfigValid(v2)) {
    memset(&config, 0, sizeof(config));
    strlcpy(config.ssid, v2.ssid, sizeof(config.ssid));
    strlcpy(config.wifiPassword, v2.wifiPassword,
            sizeof(config.wifiPassword));
    strlcpy(config.apiPassword, v2.apiPassword,
            sizeof(config.apiPassword));
    strlcpy(config.otaPassword, v2.otaPassword,
            sizeof(config.otaPassword));
    strlcpy(config.hostname, v2.hostname, sizeof(config.hostname));
    strlcpy(config.username, "admin", sizeof(config.username));
    config.apiAuthEnabled = v2.apiAuthEnabled;
    config.otaAuthEnabled = v2.otaAuthEnabled;
    config.wifiRetryLimit = v2.wifiRetryLimit;
    config.resetApiAuthOnRecovery = v2.resetApiAuthOnRecovery;
    config.directOtaEnabled = 1;
    saveConfig();
    return;
  }

  LegacyDeviceConfig legacy{};
  EEPROM.get(0, legacy);
  if (legacyConfigValid(legacy)) {
    memset(&config, 0, sizeof(config));
    strlcpy(config.ssid, legacy.ssid, sizeof(config.ssid));
    strlcpy(config.wifiPassword, legacy.wifiPassword,
            sizeof(config.wifiPassword));
    strlcpy(config.apiPassword, legacy.otaPassword,
            sizeof(config.apiPassword));
    strlcpy(config.otaPassword, legacy.otaPassword,
            sizeof(config.otaPassword));
    strlcpy(config.username, "admin", sizeof(config.username));
    config.apiAuthEnabled = 1;
    config.otaAuthEnabled = 1;
    config.directOtaEnabled = 1;
    config.wifiRetryLimit = kDefaultWifiRetryLimit;
    saveConfig();
    return;
  }
  memset(&config, 0, sizeof(config));
}

void saveConfig() {
  config.magic = kConfigMagic;
  config.checksum = checksum(config);
  EEPROM.put(0, config);
  EEPROM.commit();
}

String deviceSuffix() {
  char suffix[7];
#if defined(ESP8266)
  snprintf(suffix, sizeof(suffix), "%06X", ESP.getChipId());
#else
  snprintf(suffix, sizeof(suffix), "%06X",
           static_cast<uint32_t>(ESP.getEfuseMac()));
#endif
  return String(suffix);
}

String configuredHostname() {
  if (config.hostname[0]) return String(config.hostname);
  return "mini-display-" + deviceSuffix();
}

const char *configuredUsername() {
  return config.username[0] ? config.username : "admin";
}

bool usernameValid(const char *username) {
  const size_t length = strlen(username);
  if (length == 0 || length > 32) return false;
  for (size_t index = 0; index < length; ++index) {
    const char character = username[index];
    if (!isalnum(static_cast<unsigned char>(character)) && character != '-' &&
        character != '_' && character != '.') {
      return false;
    }
  }
  return true;
}

const char *disconnectReason() {
  if (reconnectCount == 0) return "None";
  switch (lastDisconnectStatus) {
    case WL_NO_SSID_AVAIL:
      return "Network not found";
    case WL_CONNECT_FAILED:
      return "Authentication failed";
    case WL_CONNECTION_LOST:
      return "Connection lost";
    case WL_DISCONNECTED:
      return "Disconnected";
    default:
      return "Unknown";
  }
}

void configureIpAddress() {
  IPAddress zero(static_cast<uint32_t>(0));
  if (!networkSettings.staticIpEnabled) {
    WiFi.config(zero, zero, zero);
    return;
  }
  IPAddress address;
  IPAddress gateway;
  IPAddress subnet;
  IPAddress dns1;
  IPAddress dns2;
  address.fromString(networkSettings.staticIp);
  gateway.fromString(networkSettings.gateway);
  subnet.fromString(networkSettings.subnet);
  if (!dns1.fromString(networkSettings.dns1)) dns1 = gateway;
  dns2.fromString(networkSettings.dns2);
  WiFi.config(address, gateway, subnet, dns1, dns2);
}

void configureTimeService() {
  const char *server = networkSettings.ntpServer[0]
                           ? networkSettings.ntpServer
                           : kDefaultNtpServer;
#if defined(ESP8266)
  configTime(displayTimezone, server);
  sntp_servermode_dhcp(networkSettings.ntpFromDhcp ? 1 : 0);
#else
  configTzTime(displayTimezone, server);
  esp_sntp_servermode_dhcp(networkSettings.ntpFromDhcp);
#endif
}

String currentNtpServer() {
#if defined(ESP8266)
  const char *name = sntp_getservername(0);
  const ip_addr_t *address = sntp_getserver(0);
#else
  const char *name = esp_sntp_getservername(0);
  const ip_addr_t *address = esp_sntp_getserver(0);
#endif
  if (name && name[0]) return String(name);
  if (address && !ip_addr_isany(address)) return String(ipaddr_ntoa(address));
  return networkSettings.ntpFromDhcp ? "Waiting for DHCP"
                                     : String(networkSettings.ntpServer);
}

bool hostnameValid(const char *hostname) {
  const size_t length = strlen(hostname);
  if (length == 0 || length > 32 || hostname[0] == '-' ||
      hostname[length - 1] == '-') {
    return false;
  }
  for (size_t index = 0; index < length; ++index) {
    const char character = hostname[index];
    if (!isalnum(static_cast<unsigned char>(character)) && character != '-') {
      return false;
    }
  }
  return true;
}

bool directOtaAuthenticated() {
  if (!configValid()) {
    if (accessPointRunning) return true;
    server.send(403, "text/plain", "Setup mode is not active");
    return false;
  }
  if (!config.directOtaEnabled) {
    server.send(403, "text/plain", "Direct OTA is disabled");
    return false;
  }
  if (!config.otaAuthEnabled) return true;
  if (server.authenticate(configuredUsername(), config.otaPassword)) return true;
  server.requestAuthentication();
  return false;
}

bool webAuthenticated() {
  if (accessPointRunning) return true;
  if (!config.apiAuthEnabled) return true;
  if (server.authenticate(configuredUsername(), config.apiPassword)) return true;
  server.requestAuthentication();
  return false;
}

bool apiAuthenticated() {
  if (accessPointRunning) {
    server.send(403, "application/json", "{\"error\":\"setup_mode\"}");
    return false;
  }
  if (!configValid()) {
    server.send(403, "application/json", "{\"error\":\"not_configured\"}");
    return false;
  }
  if (!config.apiAuthEnabled) return true;
  char expected[sizeof(config.apiPassword) + 8];
  snprintf(expected, sizeof(expected), "Bearer %s", config.apiPassword);
  if (server.header("Authorization") == expected) return true;
  if (server.authenticate(configuredUsername(), config.apiPassword)) return true;
  server.requestAuthentication();
  return false;
}

void sendJsonError(int status, const __FlashStringHelper *error,
                   const __FlashStringHelper *message) {
  StaticJsonDocument<256> document;
  document["error"] = error;
  document["message"] = message;
  String body;
  body.reserve(192);
  serializeJson(document, body);
  server.send(status, "application/json", body);
}

void applyBacklight() {
  pinMode(TFT_BL, OUTPUT);
  if (!displayOn || displayBrightness == 0) {
    digitalWrite(TFT_BL, !TFT_BACKLIGHT_ON);
    return;
  }
  #if defined(ESP8266)
  analogWriteRange(100);
  const int pwm = TFT_BACKLIGHT_ON == LOW ? 100 - displayBrightness
                                          : displayBrightness;
  #else
  analogWriteResolution(TFT_BL, 8);
  const int brightness = map(displayBrightness, 0, 100, 0, 255);
  const int pwm = TFT_BACKLIGHT_ON == LOW ? 255 - brightness : brightness;
  #endif
  analogWrite(TFT_BL, pwm);
}

void showCurrentPage() {
  if (dashboardPageCount && renderDashboardPage()) return;
  display.fillScreen(TFT_BLACK);
  display.setTextDatum(MC_DATUM);
  display.setTextColor(TFT_WHITE, TFT_BLACK);
  if (dashboardPageCount == 0) {
    display.drawString("MINI-DISPLAY", 120, 92, 4);
    display.setTextColor(TFT_YELLOW, TFT_BLACK);
    display.drawString("WAITING FOR DASHBOARD", 120, 135, 2);
    return;
  }
  display.drawString(dashboardPages[activePageIndex].id, 120, 105, 4);
  display.setTextColor(TFT_DARKGREY, TFT_BLACK);
  display.drawString(pageRotationAuto ? "AUTO" : "MANUAL", 120, 145, 2);
}

DashboardValue *findValue(const char *source, bool create) {
  if (source == nullptr || source[0] == '\0') return nullptr;
  for (uint8_t index = 0; index < dashboardValueCount; ++index) {
    if (strcmp(dashboardValues[index].source, source) == 0) {
      return &dashboardValues[index];
    }
  }
  if (!create || dashboardValueCount >= kMaxValues) return nullptr;
  DashboardValue *slot = &dashboardValues[dashboardValueCount++];
  memset(slot, 0, sizeof(*slot));
  strlcpy(slot->source, source, sizeof(slot->source));
  return slot;
}

uint16_t parseColor(JsonVariantConst value, uint16_t fallback) {
  if (!value.is<const char *>()) return fallback;
  const char *text = value.as<const char *>();
  if (text[0] == '#' && strlen(text) == 7) {
    const uint32_t rgb = strtoul(text + 1, nullptr, 16);
    return display.color565((rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF);
  }
  if (strcmp(text, "surface") == 0) return display.color565(30, 34, 42);
  if (strcmp(text, "primary") == 0) return TFT_WHITE;
  if (strcmp(text, "secondary") == 0) return display.color565(158, 158, 158);
  if (strcmp(text, "muted") == 0) return display.color565(102, 102, 102);
  if (strcmp(text, "accent") == 0) return TFT_CYAN;
  if (strcmp(text, "success") == 0) return TFT_GREEN;
  if (strcmp(text, "warning") == 0) return TFT_ORANGE;
  if (strcmp(text, "error") == 0) return TFT_RED;
  if (strcmp(text, "background") == 0) return TFT_BLACK;
  return fallback;
}

const GFXfont *fontFor(const char *family, uint8_t size) {
  if (family == nullptr) family = "sans";
  if (strcmp(family, "sans-bold") == 0) {
    const GFXfont *fonts[] = {&FreeSansBold9pt7b, &FreeSansBold12pt7b,
                              &FreeSansBold18pt7b, &FreeSansBold24pt7b};
    return fonts[min<uint8_t>(size, 3)];
  }
  if (strcmp(family, "mono") == 0) {
    const GFXfont *fonts[] = {&FreeMono9pt7b, &FreeMono12pt7b,
                              &FreeMono18pt7b, &FreeMono24pt7b};
    return fonts[min<uint8_t>(size, 3)];
  }
  if (strcmp(family, "serif") == 0) {
    const GFXfont *fonts[] = {&FreeSerif9pt7b, &FreeSerif12pt7b,
                              &FreeSerif18pt7b, &FreeSerif24pt7b};
    return fonts[min<uint8_t>(size, 3)];
  }
  const GFXfont *fonts[] = {&FreeSans9pt7b, &FreeSans12pt7b,
                            &FreeSans18pt7b, &FreeSans24pt7b};
  return fonts[min<uint8_t>(size, 3)];
}

uint8_t requestedFontSize(JsonVariantConst style, int16_t height) {
  const char *size = style["fontSize"] | "auto";
  if (strcmp(size, "small") == 0) return 0;
  if (strcmp(size, "medium") == 0) return 1;
  if (strcmp(size, "large") == 0) return 2;
  if (strcmp(size, "xlarge") == 0) return 3;
  if (height >= 58) return 3;
  if (height >= 42) return 2;
  if (height >= 28) return 1;
  return 0;
}

const GFXfont *selectBestFont(const String &text, JsonVariantConst style,
                              int16_t width, int16_t height) {
  const char *family = style["fontFamily"] | "sans";
  int8_t size = requestedFontSize(style, height);
  while (size > 0) {
    const GFXfont *font = fontFor(family, size);
    display.setFreeFont(font);
    if (display.textWidth(text) <= width - 6 && display.fontHeight() <= height) {
      return font;
    }
    --size;
  }
  const GFXfont *font = fontFor(family, 0);
  display.setFreeFont(font);
  return font;
}

void drawPositionedFit(const String &text, JsonVariantConst style, int16_t x,
                       int16_t y, int16_t width, int16_t height,
                       uint16_t foreground, uint16_t background,
                       const char *defaultHorizontal = "center",
                       const char *defaultVertical = "middle",
                       int16_t fontHeight = 0) {
  const char *horizontal = style["horizontalAlign"] | defaultHorizontal;
  const char *vertical = style["verticalAlign"] | defaultVertical;
  const bool left = strcmp(horizontal, "left") == 0;
  const bool right = strcmp(horizontal, "right") == 0;
  const bool top = strcmp(vertical, "top") == 0;
  const bool bottom = strcmp(vertical, "bottom") == 0;
  const uint8_t datum = top
                              ? (left ? TL_DATUM : right ? TR_DATUM : TC_DATUM)
                              : bottom
                                    ? (left ? BL_DATUM
                                            : right ? BR_DATUM : BC_DATUM)
                                    : (left ? ML_DATUM
                                            : right ? MR_DATUM : MC_DATUM);
  display.setTextDatum(datum);
  display.setTextColor(foreground, background);
  selectBestFont(text, style, width,
                 fontHeight > 0 ? min(height, fontHeight) : height);
  String clipped = text;
  while (clipped.length() > 1 && display.textWidth(clipped) > width - 8) {
    clipped.remove(clipped.length() - 1);
  }
  const int16_t textX = left ? x + 4 : right ? x + width - 4 : x + width / 2;
  const int16_t textY = top ? y + 3 : bottom ? y + height - 3 : y + height / 2;
  display.drawString(clipped, textX, textY);
}

struct RingLayout {
  int16_t x;
  int16_t y;
  int16_t diameter;
  int16_t valueY;
  int16_t valueHeight;
};

RingLayout ringLayout(int16_t x, int16_t y, int16_t width, int16_t height) {
  const int16_t valueHeight =
      min(static_cast<int16_t>(22),
          max(static_cast<int16_t>(12), static_cast<int16_t>(height / 4)));
  const int16_t available =
      max(static_cast<int16_t>(8),
          static_cast<int16_t>(height - valueHeight - 8));
  const int16_t diameter =
      min(static_cast<int16_t>(52),
          min(static_cast<int16_t>(width - 10), available));
  const int16_t groupHeight = diameter + 2 + valueHeight;
  const int16_t top =
      y + max(static_cast<int16_t>(3),
              static_cast<int16_t>((height - groupHeight) / 2));
  return {static_cast<int16_t>(x + (width - diameter) / 2), top, diameter,
          static_cast<int16_t>(top + diameter + 2), valueHeight};
}

float progressRatio(JsonObjectConst card, DashboardValue *value) {
  const float minimum = card["minimum"] | 0.0F;
  const float maximum = card["maximum"] | 100.0F;
  const float current = value ? atof(value->state) : minimum;
  return maximum > minimum
             ? constrain((current - minimum) / (maximum - minimum), 0.0F,
                         1.0F)
             : 0.0F;
}

void drawCenteredFit(String text, JsonVariantConst style, int16_t x,
                     int16_t y, int16_t width, int16_t height,
                     uint16_t foreground, uint16_t background) {
  display.setTextDatum(MC_DATUM);
  display.setTextColor(foreground, background);
  selectBestFont(text, style, width, height);
  while (text.length() > 1 && display.textWidth(text) > width - 8) {
    text.remove(text.length() - 1);
  }
  display.drawString(text, x + width / 2, y + height / 2);
}

bool mappingMatches(const char *type, JsonObjectConst rule, const String &raw) {
  if (strcmp(type, "number") == 0) {
    char *end = nullptr;
    const float number = strtof(raw.c_str(), &end);
    if (end == raw.c_str() || *end != '\0') return false;
    const bool hasMinimum = !rule["minimum"].isNull();
    const bool hasMaximum = !rule["maximum"].isNull();
    return (!hasMinimum || number >= rule["minimum"].as<float>()) &&
           (!hasMaximum || number <= rule["maximum"].as<float>());
  }
  if (strcmp(type, "text") != 0) return false;
  const String match(rule["match"] | "");
  const char *operatorName = rule["operator"] | "equals";
  return strcmp(operatorName, "equals") == 0
             ? raw == match
             : strcmp(operatorName, "starts_with") == 0
                   ? raw.startsWith(match)
                   : strcmp(operatorName, "ends_with") == 0
                         ? raw.endsWith(match)
                         : strcmp(operatorName, "contains") == 0 &&
                               raw.indexOf(match) >= 0;
}

bool findCardMapping(JsonObjectConst card, const char *collection,
                     const String &raw, JsonObjectConst &matched) {
  JsonArrayConst mappings = card[collection].as<JsonArrayConst>();
  if (mappings.isNull()) return false;
  const char *type = card["type"] | "text";
  for (JsonObjectConst rule : mappings) {
    if (mappingMatches(type, rule, raw)) {
      matched = rule;
      return true;
    }
  }
  return false;
}

bool mappedCardValue(JsonObjectConst card, const String &raw, String &mapped) {
  JsonObjectConst rule;
  if (!findCardMapping(card, "valueMappings", raw, rule)) return false;
  mapped = String(rule["value"] | "");
  return true;
}

String cardValue(JsonObjectConst card) {
  const char *type = card["type"] | "text";
  if (strcmp(type, "clock") == 0) {
    time_t now = time(nullptr);
    struct tm localTime {};
    localtime_r(&now, &localTime);
    char buffer[24];
    const bool seconds = card["showSeconds"] | false;
    const char *format = card["format"] | "24h";
    strftime(buffer, sizeof(buffer),
             strcmp(format, "12h") == 0
                 ? (seconds ? "%I:%M:%S" : "%I:%M")
                 : (seconds ? "%H:%M:%S" : "%H:%M"),
             &localTime);
    return String(buffer);
  }
  const char *source = card["source"];
  if (source != nullptr) {
    DashboardValue *value = findValue(source, false);
    if (value == nullptr || !value->available) return String("--");
    const String raw(value->state);
    String result;
    const bool mapped = mappedCardValue(card, raw, result);
    if (!mapped) result = raw;
    const char *unit = card["unit"];
    if (!mapped && unit && unit[0]) result += " " + String(unit);
    return result;
  }
  return String(card["text"] | "");
}

void fillCardEdgeBackground(int16_t x, int16_t y, int16_t width,
                            int16_t height, uint16_t background,
                            uint8_t edges) {
  const int16_t left = max<int16_t>(0, x);
  const int16_t top = max<int16_t>(0, y);
  const int16_t right = min<int16_t>(240, x + width);
  const int16_t bottom = min<int16_t>(240, y + height);
  if ((edges & kExtendLeft) && x > 0 && bottom > top) {
    display.fillRect(0, top, x, bottom - top, background);
  }
  if ((edges & kExtendRight) && right < 240 && bottom > top) {
    display.fillRect(right, top, 240 - right, bottom - top, background);
  }
  if ((edges & kExtendTop) && y > 0 && right > left) {
    display.fillRect(left, 0, right - left, y, background);
  }
  if ((edges & kExtendBottom) && bottom < 240 && right > left) {
    display.fillRect(left, bottom, right - left, 240 - bottom, background);
  }
  if ((edges & kExtendLeft) && (edges & kExtendTop) && x > 0 && y > 0) {
    display.fillRect(0, 0, x, y, background);
  }
  if ((edges & kExtendRight) && (edges & kExtendTop) && right < 240 && y > 0) {
    display.fillRect(right, 0, 240 - right, y, background);
  }
  if ((edges & kExtendLeft) && (edges & kExtendBottom) && x > 0 && bottom < 240) {
    display.fillRect(0, bottom, x, 240 - bottom, background);
  }
  if ((edges & kExtendRight) && (edges & kExtendBottom) && right < 240 &&
      bottom < 240) {
    display.fillRect(right, bottom, 240 - right, 240 - bottom, background);
  }
}

void drawCard(JsonObjectConst card, int16_t x, int16_t y, int16_t width,
              int16_t height, uint8_t edgeExtensions = 0,
              uint16_t edgeBackground = TFT_BLACK) {
  JsonObjectConst colorMapping;
  const char *source = card["source"];
  DashboardValue *sourceValue = findValue(source, false);
  if (sourceValue != nullptr && sourceValue->available) {
    findCardMapping(card, "colorMappings", String(sourceValue->state),
                    colorMapping);
  }
  JsonVariantConst backgroundValue = colorMapping["background"];
  if (backgroundValue.isNull()) backgroundValue = card["style"]["background"];
  JsonVariantConst foregroundValue = colorMapping["foreground"];
  if (foregroundValue.isNull()) foregroundValue = card["style"]["foreground"];
  const uint16_t background =
      parseColor(backgroundValue, display.color565(30, 34, 42));
  const uint16_t foreground =
      parseColor(foregroundValue, TFT_WHITE);
  const uint16_t accent = parseColor(card["style"]["accent"], TFT_CYAN);
  fillCardEdgeBackground(x, y, width, height, edgeBackground, edgeExtensions);
  display.fillRoundRect(x, y, width, height, 5, background);

  const char *title = card["title"];
  int16_t contentHeight = height;
  const char *progressType = card["progress"] | "none";
  const bool bar = strcmp(progressType, "bar") == 0;
  const bool ring = strcmp(progressType, "ring") == 0;
  if (bar && contentHeight >= 20) contentHeight -= 9;
  JsonVariantConst valueStyle = card["valueStyle"];
  if (valueStyle.isNull()) valueStyle = card["style"];
  if (ring) {
    const RingLayout layout = ringLayout(x, y, width, height);
    drawProgressRing(display, layout.x, layout.y, layout.diameter,
                     progressRatio(card, sourceValue), TFT_DARKGREY, accent,
                     background);
    drawCenteredFit(cardValue(card), valueStyle, x, layout.valueY, width,
                    layout.valueHeight, foreground, background);
  } else {
    drawPositionedFit(cardValue(card), valueStyle, x, y, width,
                      contentHeight, foreground, background);
  }
  if (title && title[0] && height >= 28) {
    JsonVariantConst titleStyle = card["titleStyle"];
    if (titleStyle.isNull()) titleStyle = card["style"];
    const uint16_t titleForeground =
        parseColor(titleStyle["foreground"], TFT_LIGHTGREY);
    drawPositionedFit(String(title), titleStyle, x, y, width, contentHeight,
                      titleForeground, background, "left", "top", 18);
  }

  if (bar) {
    const float ratio = progressRatio(card, sourceValue);
    const int16_t barX = x + 5;
    const int16_t barY = y + height - 8;
    const int16_t barWidth = width - 10;
    display.fillRoundRect(barX, barY, barWidth, 4, 2, TFT_DARKGREY);
    display.fillRoundRect(barX, barY, static_cast<int16_t>(barWidth * ratio), 4,
                          2, accent);
  }
}

bool cacheText(CachedPage &page, const String &value, const GFXfont *font,
               uint8_t datum, int16_t x, int16_t y, uint16_t foreground,
               uint16_t background) {
  if (page.textCount >= kMaxPageTexts) return false;
  CachedText &text = page.texts[page.textCount++];
  text.x = x;
  text.y = y;
  display.setFreeFont(font);
  text.boundsWidth = display.textWidth(value);
  text.boundsHeight = display.fontHeight();
  const bool centeredX = datum == TC_DATUM || datum == MC_DATUM ||
                         datum == BC_DATUM;
  const bool rightX = datum == TR_DATUM || datum == MR_DATUM ||
                      datum == BR_DATUM;
  const bool centeredY = datum == ML_DATUM || datum == MC_DATUM ||
                         datum == MR_DATUM;
  const bool bottomY = datum == BL_DATUM || datum == BC_DATUM ||
                       datum == BR_DATUM;
  text.boundsX = centeredX ? x - text.boundsWidth / 2
                           : rightX ? x - text.boundsWidth : x;
  text.boundsY = centeredY ? y - text.boundsHeight / 2
                           : bottomY ? y - text.boundsHeight : y;
  text.foreground = foreground;
  text.background = background;
  text.font = font;
  text.datum = datum;
  strlcpy(text.value, value.c_str(), sizeof(text.value));
  return true;
}

bool cachePositionedText(CachedPage &page, String value,
                         JsonVariantConst style, int16_t x, int16_t y,
                         int16_t width, int16_t height, uint16_t foreground,
                         uint16_t background,
                         const char *defaultHorizontal = "center",
                         const char *defaultVertical = "middle",
                         int16_t fontHeight = 0) {
  const char *horizontal = style["horizontalAlign"] | defaultHorizontal;
  const char *vertical = style["verticalAlign"] | defaultVertical;
  const bool left = strcmp(horizontal, "left") == 0;
  const bool right = strcmp(horizontal, "right") == 0;
  const bool top = strcmp(vertical, "top") == 0;
  const bool bottom = strcmp(vertical, "bottom") == 0;
  const uint8_t datum = top
                            ? (left ? TL_DATUM : right ? TR_DATUM : TC_DATUM)
                            : bottom
                                  ? (left ? BL_DATUM
                                          : right ? BR_DATUM : BC_DATUM)
                                  : (left ? ML_DATUM
                                          : right ? MR_DATUM : MC_DATUM);
  const GFXfont *font = selectBestFont(
      value, style, width, fontHeight > 0 ? min(height, fontHeight) : height);
  while (value.length() > 1 && display.textWidth(value) > width - 8) {
    value.remove(value.length() - 1);
  }
  const int16_t textX = left ? x + 4 : right ? x + width - 4 : x + width / 2;
  const int16_t textY = top ? y + 3 : bottom ? y + height - 3 : y + height / 2;
  return cacheText(page, value, font, datum, textX, textY, foreground,
                   background);
}

bool cacheCenteredFit(CachedPage &page, String value, JsonVariantConst style,
                      int16_t x, int16_t y, int16_t width, int16_t height,
                      uint16_t foreground, uint16_t background) {
  const GFXfont *font = selectBestFont(value, style, width, height);
  while (value.length() > 1 && display.textWidth(value) > width - 8) {
    value.remove(value.length() - 1);
  }
  return cacheText(page, value, font, MC_DATUM, x + width / 2,
                   y + height / 2, foreground, background);
}

bool cacheCard(CachedPage &page, JsonObjectConst card, int16_t x, int16_t y,
               int16_t width, int16_t height) {
  if (page.cardCount >= kMaxPageCards) return false;
  JsonObjectConst colorMapping;
  const char *source = card["source"];
  DashboardValue *sourceValue = findValue(source, false);
  if (sourceValue != nullptr && sourceValue->available) {
    findCardMapping(card, "colorMappings", String(sourceValue->state),
                    colorMapping);
  }
  JsonVariantConst backgroundValue = colorMapping["background"];
  if (backgroundValue.isNull()) backgroundValue = card["style"]["background"];
  JsonVariantConst foregroundValue = colorMapping["foreground"];
  if (foregroundValue.isNull()) foregroundValue = card["style"]["foreground"];
  const uint16_t background =
      parseColor(backgroundValue, display.color565(30, 34, 42));
  const uint16_t foreground = parseColor(foregroundValue, TFT_WHITE);

  CachedCard &cachedCard = page.cards[page.cardCount++];
  cachedCard.x = x;
  cachedCard.y = y;
  cachedCard.width = width;
  cachedCard.height = height;
  cachedCard.background = background;

  const char *title = card["title"];
  int16_t contentHeight = height;
  const char *progressType = card["progress"] | "none";
  const bool bar = strcmp(progressType, "bar") == 0;
  const bool ring = strcmp(progressType, "ring") == 0;
  if (bar && contentHeight >= 20) contentHeight -= 9;
  JsonVariantConst valueStyle = card["valueStyle"];
  if (valueStyle.isNull()) valueStyle = card["style"];
  RingLayout ringGeometry{};
  if (ring) {
    ringGeometry = ringLayout(x, y, width, height);
    if (!cacheCenteredFit(page, cardValue(card), valueStyle, x,
                          ringGeometry.valueY, width,
                          ringGeometry.valueHeight, foreground, background)) {
      return false;
    }
  } else {
    if (!cachePositionedText(page, cardValue(card), valueStyle, x, y,
                             width, contentHeight, foreground, background)) {
      return false;
    }
  }
  if (title && title[0] && height >= 28) {
    JsonVariantConst titleStyle = card["titleStyle"];
    if (titleStyle.isNull()) titleStyle = card["style"];
    const uint16_t titleForeground =
        parseColor(titleStyle["foreground"], TFT_LIGHTGREY);
    if (!cachePositionedText(page, String(title), titleStyle, x, y, width,
                             contentHeight, titleForeground, background,
                             "left", "top", 18)) {
      return false;
    }
  }

  if (bar || ring) {
    const float ratio = progressRatio(card, sourceValue);
    CachedProgress &progress = page.progress[page.progressCount++];
    progress.ring = ring;
    progress.x = ring ? ringGeometry.x : x + 5;
    progress.y = ring ? ringGeometry.y : y + height - 8;
    progress.width = ring ? ringGeometry.diameter : width - 10;
    progress.fillWidth = static_cast<int16_t>((ring ? 1000 : progress.width) * ratio);
    progress.background = TFT_DARKGREY;
    progress.foreground = parseColor(card["style"]["accent"], TFT_CYAN);
    progress.center = background;
  }
  return true;
}

struct PageContentLayout {
  int16_t x;
  int16_t y;
  int16_t right;
  int16_t bottom;
  int16_t titleThickness;
  const char *titlePosition;
  bool hasTitle;
};

uint8_t pageTitleFontSize(JsonVariantConst style) {
  const char *size = style["fontSize"] | "small";
  if (strcmp(size, "medium") == 0) return 1;
  if (strcmp(size, "large") == 0) return 2;
  if (strcmp(size, "xlarge") == 0) return 3;
  return 0;
}

int16_t pageTitleThickness(JsonVariantConst style) {
  const uint8_t size = pageTitleFontSize(style);
  const int16_t thickness[] = {21, 29, 40, 52};
  return thickness[size];
}

const GFXfont *pageTitleFont(JsonVariantConst style) {
  return fontFor("sans-bold", pageTitleFontSize(style));
}

PageContentLayout pageContentLayout(JsonObjectConst page) {
  PageContentLayout layout{6, 6, 234, 234, 0, "top", false};
  const char *title = page["title"];
  layout.hasTitle = (page["showTitle"] | true) && title && title[0];
  layout.titlePosition = page["titlePosition"] | "top";
  if (!layout.hasTitle) return layout;
  layout.titleThickness = pageTitleThickness(page["titleStyle"]);
  if (strcmp(layout.titlePosition, "bottom") == 0) {
    layout.bottom -= layout.titleThickness;
  } else if (strcmp(layout.titlePosition, "left") == 0) {
    layout.x += layout.titleThickness;
  } else if (strcmp(layout.titlePosition, "right") == 0) {
    layout.right -= layout.titleThickness;
  } else {
    layout.y += layout.titleThickness;
  }
  return layout;
}

void drawVerticalPageTitle(const char *title, bool right, int16_t offsetX,
                           int16_t offsetY, int16_t thickness,
                           JsonVariantConst style, uint16_t foreground,
                           uint16_t background) {
  if (!title || !title[0]) return;
  const GFXfont *font = pageTitleFont(style);
  display.setFreeFont(font);
  String clipped(title);
  while (clipped.length() > 1 && display.textWidth(clipped) > 218) {
    clipped.remove(clipped.length() - 1);
  }
  const int16_t width = max<int16_t>(1, display.textWidth(clipped) + 4);
  const int16_t height = thickness;
  TFT_eSprite titleSprite(&display);
  titleSprite.setColorDepth(1);
  if (titleSprite.createSprite(width, height) == nullptr) return;
  titleSprite.setBitmapColor(foreground, background);
  titleSprite.fillSprite(TFT_BLACK);
  titleSprite.setTextColor(TFT_WHITE, TFT_BLACK);
  titleSprite.setFreeFont(font);
  titleSprite.setTextDatum(MC_DATUM);
  titleSprite.drawString(clipped, width / 2, height / 2);
  display.setPivot((right ? 240 - thickness / 2 : thickness / 2) + offsetX,
                   120 + offsetY);
  titleSprite.setPivot(width / 2, height / 2);
  titleSprite.pushRotated(right ? 90 : 270);
  titleSprite.deleteSprite();
  display.setPivot(120, 120);
}

bool cacheDashboardPage(JsonObjectConst source, CachedPage &page) {
  memset(&page, 0, sizeof(page));
  page.background = parseColor(source["style"]["background"], TFT_BLACK);
  JsonArrayConst rows = source["rows"].as<JsonArrayConst>();
  const PageContentLayout layout = pageContentLayout(source);
  const char *pageTitle = source["title"];
  JsonVariantConst titleStyle = source["titleStyle"];
  const uint16_t titleBackground =
      parseColor(titleStyle["background"], page.background);
  const uint16_t titleForeground =
      parseColor(titleStyle["foreground"], TFT_WHITE);
  if (layout.hasTitle) {
    page.hasTitleArea = true;
    page.titleArea.color = titleBackground;
    if (strcmp(layout.titlePosition, "bottom") == 0) {
      page.titleArea = {0, static_cast<int16_t>(240 - layout.titleThickness),
                        240, layout.titleThickness, titleBackground};
    } else if (strcmp(layout.titlePosition, "left") == 0) {
      page.titleArea = {0, 0, layout.titleThickness, 240, titleBackground};
    } else if (strcmp(layout.titlePosition, "right") == 0) {
      page.titleArea = {static_cast<int16_t>(240 - layout.titleThickness), 0,
                        layout.titleThickness, 240, titleBackground};
    } else {
      page.titleArea = {0, 0, 240, layout.titleThickness, titleBackground};
    }
  }
  if (layout.hasTitle && strcmp(layout.titlePosition, "top") == 0) {
    if (!cacheText(page, String(pageTitle), pageTitleFont(titleStyle), MC_DATUM,
                   120, layout.titleThickness / 2, titleForeground,
                   titleBackground)) {
      return false;
    }
  } else if (layout.hasTitle &&
             strcmp(layout.titlePosition, "bottom") == 0) {
    if (!cacheText(page, String(pageTitle), pageTitleFont(titleStyle), MC_DATUM,
                   120, 240 - layout.titleThickness / 2, titleForeground,
                   titleBackground)) {
      return false;
    }
  }

  uint16_t totalWeight = 0;
  for (JsonObjectConst row : rows) totalWeight += row["weight"] | 1;
  if (totalWeight == 0 || rows.size() == 0) return false;
  const int16_t gap = 4;
  const int16_t availableHeight =
      layout.bottom - layout.y - gap * (rows.size() - 1);
  int16_t rowY = layout.y;
  uint16_t consumedWeight = 0;
  for (size_t rowIndex = 0; rowIndex < rows.size(); ++rowIndex) {
    JsonObjectConst row = rows[rowIndex];
    const uint16_t weight = row["weight"] | 1;
    consumedWeight += weight;
    const int16_t nextY = rowIndex + 1 == rows.size()
                              ? layout.bottom
                              : layout.y + availableHeight * consumedWeight /
                                               totalWeight +
                                    gap * rowIndex;
    int16_t rowHeight = nextY - rowY;
    const char *rowTitle = row["title"];
    const bool showTitle = row["showTitle"] | true;
    if (showTitle && rowTitle && rowTitle[0] && rowHeight >= 24) {
      if (!cacheText(page, String(rowTitle), &FreeSans9pt7b, TL_DATUM,
                     layout.x + 2, rowY, TFT_LIGHTGREY, page.background)) {
        return false;
      }
      rowY += 17;
      rowHeight -= 17;
    }
    JsonArrayConst cards = row["cards"].as<JsonArrayConst>();
    if (cards.size() == 0) return false;
    const int16_t cardWidth =
        (layout.right - layout.x - gap * (cards.size() - 1)) / cards.size();
    int16_t cardX = layout.x;
    for (JsonObjectConst card : cards) {
      if (!cacheCard(page, card, cardX, rowY, cardWidth, rowHeight)) {
        return false;
      }
      cardX += cardWidth + gap;
    }
    rowY = nextY + gap;
  }
  return true;
}

bool drawDashboardPage(JsonObjectConst page, const uint32_t *changedValues,
                       int16_t offsetX = 0, int16_t offsetY = 0,
                       bool clear = true) {
  JsonArrayConst rows = page["rows"].as<JsonArrayConst>();

  const uint16_t pageBackground =
      parseColor(page["style"]["background"], TFT_BLACK);
  const bool partial = changedValues != nullptr;
  if (!partial && clear) display.fillScreen(pageBackground);
  const PageContentLayout layout = pageContentLayout(page);
  const char *pageTitle = page["title"];
  if (layout.hasTitle && !partial) {
    JsonVariantConst titleStyle = page["titleStyle"];
    const uint16_t titleBackground =
        parseColor(titleStyle["background"], pageBackground);
    const uint16_t titleForeground =
        parseColor(titleStyle["foreground"], TFT_WHITE);
    if (strcmp(layout.titlePosition, "left") == 0 ||
        strcmp(layout.titlePosition, "right") == 0) {
      const bool right = strcmp(layout.titlePosition, "right") == 0;
      display.fillRect((right ? 240 - layout.titleThickness : 0) + offsetX,
                       offsetY, layout.titleThickness, 240, titleBackground);
      drawVerticalPageTitle(pageTitle,
                            right, offsetX, offsetY, layout.titleThickness,
                            titleStyle, titleForeground, titleBackground);
    } else {
      const bool bottom = strcmp(layout.titlePosition, "bottom") == 0;
      const int16_t titleY = bottom ? 240 - layout.titleThickness : 0;
      display.fillRect(offsetX, titleY + offsetY, 240,
                       layout.titleThickness, titleBackground);
      display.setTextDatum(MC_DATUM);
      display.setTextColor(titleForeground, titleBackground);
      display.setFreeFont(pageTitleFont(titleStyle));
      String clipped(pageTitle);
      while (clipped.length() > 1 && display.textWidth(clipped) > 232) {
        clipped.remove(clipped.length() - 1);
      }
      display.drawString(clipped, 120 + offsetX,
                         titleY + layout.titleThickness / 2 + offsetY);
    }
  }

  uint16_t totalWeight = 0;
  for (JsonObjectConst row : rows) totalWeight += row["weight"] | 1;
  const int16_t gap = 4;
  const int16_t availableHeight =
      layout.bottom - layout.y - gap * (rows.size() - 1);
  int16_t rowY = layout.y;
  uint16_t consumedWeight = 0;
  for (size_t rowIndex = 0; rowIndex < rows.size(); ++rowIndex) {
    JsonObjectConst row = rows[rowIndex];
    const uint16_t weight = row["weight"] | 1;
    consumedWeight += weight;
    const int16_t nextY = rowIndex + 1 == rows.size()
                              ? layout.bottom
                              : layout.y + availableHeight * consumedWeight / totalWeight +
                                    gap * rowIndex;
    int16_t rowHeight = nextY - rowY;
    const char *rowTitle = row["title"];
    const bool showTitle = row["showTitle"] | true;
    const bool rowTitleShown =
        showTitle && rowTitle && rowTitle[0] && rowHeight >= 24;
    if (rowTitleShown) {
      if (!partial) {
        display.setTextDatum(TL_DATUM);
        display.setTextColor(TFT_LIGHTGREY, pageBackground);
        display.setFreeFont(&FreeSans9pt7b);
        display.drawString(rowTitle, layout.x + 2 + offsetX,
                           rowY + offsetY);
      }
      rowY += 17;
      rowHeight -= 17;
    }
    JsonArrayConst cards = row["cards"].as<JsonArrayConst>();
    const int16_t cardWidth =
        (layout.right - layout.x - gap * (cards.size() - 1)) / cards.size();
    int16_t cardX = layout.x + offsetX;
    size_t cardIndex = 0;
    for (JsonObjectConst card : cards) {
      const char *source = card["source"];
      DashboardValue *sourceValue = findValue(source, false);
      const bool sourceChanged =
          partial && sourceValue != nullptr &&
          (*changedValues & (1UL << (sourceValue - dashboardValues))) != 0;
      if (!partial || sourceChanged) {
        uint8_t edgeExtensions = 0;
        if (cardIndex == 0 && layout.x <= 6) edgeExtensions |= kExtendLeft;
        if (cardIndex + 1 == cards.size() && layout.right >= 234) {
          edgeExtensions |= kExtendRight;
        }
        if (rowIndex == 0 && layout.y <= 6 && !rowTitleShown) {
          edgeExtensions |= kExtendTop;
        }
        if (rowIndex + 1 == rows.size() && layout.bottom >= 234) {
          edgeExtensions |= kExtendBottom;
        }
        drawCard(card, cardX, rowY + offsetY, cardWidth, rowHeight,
                 edgeExtensions, pageBackground);
      }
      cardX += cardWidth + gap;
      ++cardIndex;
    }
    rowY = nextY + gap;
    yield();
  }
  return true;
}

bool renderDashboardPage() { return renderDashboardPage(nullptr); }

bool renderDashboardPage(const uint32_t *changedValues, bool clear) {
  if (!filesystemReady || !LittleFS.exists(kDashboardPath) ||
      activePageIndex >= dashboardPageCount) {
    return false;
  }
  File file = LittleFS.open(kDashboardPath, "r");
  if (!file) return false;
  DynamicJsonDocument document(12288);
  recordFreeHeap();
  const auto error = deserializeJson(document, file);
  file.close();
  if (error) return false;
  JsonArrayConst pages = document["pages"].as<JsonArrayConst>();
  if (activePageIndex >= pages.size()) return false;
  return drawDashboardPage(pages[activePageIndex].as<JsonObjectConst>(),
                           changedValues, pixelShiftX, pixelShiftY, clear);
}

void showPageWithTransition(uint8_t nextPageIndex) {
  if (nextPageIndex >= dashboardPageCount || nextPageIndex == activePageIndex) {
    return;
  }
  if (!filesystemReady || !LittleFS.exists(kDashboardPath)) {
    activePageIndex = nextPageIndex;
    showCurrentPage();
    return;
  }
  File file = LittleFS.open(kDashboardPath, "r");
  if (!file) {
    activePageIndex = nextPageIndex;
    showCurrentPage();
    return;
  }
  bool cached = false;
  {
    // Release the JSON allocation before the RGB565 compositor band is
    // created. Both cannot safely coexist in the ESP8266 heap.
    DynamicJsonDocument document(12288);
    const auto error = deserializeJson(document, file);
    file.close();
    JsonArrayConst pages = document["pages"].as<JsonArrayConst>();
    if (!error && activePageIndex < pages.size() &&
        nextPageIndex < pages.size()) {
      cached = cacheDashboardPage(
                   pages[activePageIndex].as<JsonObjectConst>(),
                   transitionPages[0]) &&
               cacheDashboardPage(pages[nextPageIndex].as<JsonObjectConst>(),
                                  transitionPages[1]);
    }
  }
  if (!cached) {
    activePageIndex = nextPageIndex;
    showCurrentPage();
    return;
  }
  const PageTransitionConfig &transition =
      dashboardPages[activePageIndex].transition;
  PageTransitionRenderer renderer(display, displayOn, displayBrightness,
                                  applyBacklight);
  renderer.render(transitionPages[0], transitionPages[1], transition,
                  pixelShiftX, pixelShiftY);
  activePageIndex = nextPageIndex;
  renderDashboardPage(nullptr, false);
  pageShownAt = millis();
}

bool loadDashboardMetadata(Stream &stream) {
  StaticJsonDocument<512> filter;
  filter["version"] = true;
  filter["pages"][0]["id"] = true;
  filter["pages"][0]["durationSeconds"] = true;
  filter["pages"][0]["transition"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["type"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["source"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["showSeconds"] = true;
  filter["defaults"]["pageDurationSeconds"] = true;
  filter["transition"] = true;

  DynamicJsonDocument document(6144);
  recordFreeHeap();
  const auto error = deserializeJson(
      document, stream, DeserializationOption::Filter(filter));
  if (error || document["version"].as<int>() != 1 ||
      !document["pages"].is<JsonArray>()) {
    return false;
  }

  const uint32_t defaultSeconds =
      document["defaults"]["pageDurationSeconds"] | 10;
  JsonArray pages = document["pages"].as<JsonArray>();
  if (pages.size() == 0 || pages.size() > kMaxPages) return false;

  PageTransitionConfig legacyTransition;
  if (!PageTransitionRenderer::parse(document["transition"], legacyTransition)) {
    return false;
  }
  uint8_t count = 0;
  for (JsonObject page : pages) {
    const char *id = page["id"];
    if (id == nullptr || id[0] == '\0' || strlen(id) > 32) return false;
    const uint32_t seconds = page["durationSeconds"] | defaultSeconds;
    if (seconds == 0 || seconds > 86400) return false;
    PageTransitionConfig parsedTransition;
    if (!page["transition"].isNull() &&
        !PageTransitionRenderer::parse(page["transition"],
                                       parsedTransition)) {
      return false;
    }
    JsonArray rows = page["rows"].as<JsonArray>();
    if (rows.size() == 0 || rows.size() > 6) return false;
    for (JsonObject row : rows) {
      JsonArray cards = row["cards"].as<JsonArray>();
      if (cards.size() == 0 || cards.size() > 3) return false;
      for (JsonObject card : cards) {
        const char *type = card["type"];
        if (type == nullptr ||
            (strcmp(type, "clock") != 0 && strcmp(type, "number") != 0 &&
             strcmp(type, "status") != 0 && strcmp(type, "text") != 0)) {
          return false;
        }
        const bool needsSource = strcmp(type, "number") == 0 ||
                                 strcmp(type, "status") == 0;
        if (needsSource && card["source"].isNull()) return false;
      }
    }
    ++count;
  }

  count = 0;
  for (JsonObject page : pages) {
    DashboardPage &parsed = dashboardPages[count++];
    strlcpy(parsed.id, page["id"], sizeof(parsed.id));
    const uint32_t seconds = page["durationSeconds"] | defaultSeconds;
    parsed.durationMs = seconds * 1000UL;
    parsed.hasClock = false;
    parsed.clockShowsSeconds = false;
    for (JsonObject row : page["rows"].as<JsonArray>()) {
      for (JsonObject card : row["cards"].as<JsonArray>()) {
        if (strcmp(card["type"] | "", "clock") == 0) {
          parsed.hasClock = true;
          parsed.clockShowsSeconds =
              parsed.clockShowsSeconds || (card["showSeconds"] | false);
        }
      }
    }
    if (page["transition"].isNull()) {
      parsed.transition = legacyTransition;
    } else {
      PageTransitionRenderer::parse(page["transition"], parsed.transition);
    }
  }
  for (uint8_t index = count; index < kMaxPages; ++index) {
    memset(&dashboardPages[index], 0, sizeof(dashboardPages[index]));
  }
  dashboardPageCount = count;
  if (activePageIndex >= dashboardPageCount) activePageIndex = 0;
  pageShownAt = millis();
  return true;
}

void loadStoredDashboard() {
  if (!filesystemReady || !LittleFS.exists(kDashboardPath)) return;
  File file = LittleFS.open(kDashboardPath, "r");
  if (!file) return;
  const bool valid = loadDashboardMetadata(file);
  file.close();
  if (!valid) Serial.println(F("Stored dashboard metadata invalid"));
}

void sendApiInfo() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<384> document;
  document["deviceId"] = "sdpro-" + deviceSuffix();
  document["name"] = "Home Assistant Mini-Display";
  document["model"] = kHardwareModel;
  document["hardwareProfile"] = kHardwareProfile;
  document["firmwareVersion"] = kFirmwareVersion;
  document["apiVersion"] = 1;
  document["width"] = 240;
  document["height"] = 240;
  JsonArray capabilities = document.createNestedArray("capabilities");
  capabilities.add("dashboard-v1");
  capabilities.add("brightness");
  capabilities.add("pixel-shift");
  capabilities.add("page-control");
  String body;
  body.reserve(384);
  serializeJson(document, body);
  server.send(200, "application/json", body);
}

void sendApiStatus() {
  if (!apiAuthenticated()) return;
  DynamicJsonDocument document(2560);
  document["connected"] = WiFi.status() == WL_CONNECTED;
  document["ip"] = WiFi.status() == WL_CONNECTED
                       ? WiFi.localIP().toString()
                       : WiFi.softAPIP().toString();
  document["displayOn"] = displayOn;
  document["brightness"] = displayBrightness;
  document["pixelShift"] = displayPixelShift;
  document["timezone"] = displayTimezone;
  time_t now = time(nullptr);
  if (now > 1000000000) {
    struct tm localTime;
    localtime_r(&now, &localTime);
    char timeBuffer[9];
    char dateBuffer[11];
    strftime(timeBuffer, sizeof(timeBuffer), "%H:%M:%S", &localTime);
    strftime(dateBuffer, sizeof(dateBuffer), "%Y-%m-%d", &localTime);
    document["localTime"] = timeBuffer;
    document["localDate"] = dateBuffer;
  } else {
    document["localTime"] = "--:--:--";
    document["localDate"] = "Not synchronized";
  }
  document["ntpServer"] = currentNtpServer();
  document["ntpFromDhcp"] = networkSettings.ntpFromDhcp;
  document["timeSynchronized"] = now > 1000000000;
  document["ssid"] = config.ssid;
  document["hostname"] = configuredHostname();
  document["staticIpEnabled"] = networkSettings.staticIpEnabled;
  document["gateway"] = WiFi.gatewayIP().toString();
  document["dns1"] = WiFi.dnsIP(0).toString();
  document["dns2"] = WiFi.dnsIP(1).toString();
  document["wifiChannel"] = WiFi.status() == WL_CONNECTED ? WiFi.channel() : 0;
  document["bssid"] = WiFi.status() == WL_CONNECTED ? WiFi.BSSIDstr() : "";
  document["mac"] = WiFi.macAddress();
  document["reconnectCount"] = reconnectCount;
  document["lastDisconnectReason"] = disconnectReason();
  document["wifiRetryLimit"] = config.wifiRetryLimit
                                     ? config.wifiRetryLimit
                                     : kDefaultWifiRetryLimit;
  document["recoverySsid"] = "SDPRO-Setup-" + deviceSuffix();
  document["recoveryPasswordSet"] =
      networkSettings.recoveryPassword[0] != '\0';
  document["apiAuthEnabled"] = config.apiAuthEnabled != 0;
  document["apiPasswordSet"] = config.apiPassword[0] != '\0';
  document["directOtaEnabled"] = config.directOtaEnabled != 0;
  document["otaAuthEnabled"] = config.otaAuthEnabled != 0;
  document["otaPasswordSet"] = config.otaPassword[0] != '\0';
  document["filesystemReady"] = filesystemReady;
  document["mdnsReady"] = mdnsReady;
  document["setupMode"] = accessPointRunning;
  document["dashboardPageCount"] = dashboardPageCount;
  document["trackedValueCount"] = dashboardValueCount;
  document["page"] = dashboardPageCount ? dashboardPages[activePageIndex].id : "";
  document["rotation"] = pageRotationAuto ? "auto" : "manual";
  document["uptimeSeconds"] = millis() / 1000UL;
  document["freeHeapBytes"] = ESP.getFreeHeap();
#if defined(ESP8266)
  document["totalHeapBytes"] = 81920;
  document["usedHeapBytes"] = 81920 - ESP.getFreeHeap();
  document["minimumFreeHeapBytes"] = minimumFreeHeapBytes;
  document["maximumFreeBlockBytes"] = ESP.getMaxFreeBlockSize();
  document["heapFragmentationPercent"] = ESP.getHeapFragmentation();
  document["resetReason"] = lastResetReason;
#else
  document["totalHeapBytes"] = ESP.getHeapSize();
  document["usedHeapBytes"] = ESP.getHeapSize() - ESP.getFreeHeap();
#endif
  document["wifiRssiDbm"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -127;
  if (hasValueUpdate) {
    document["lastValueUpdateAgeSeconds"] =
        (millis() - lastValueUpdateAt) / 1000UL;
  } else {
    document["lastValueUpdateAgeSeconds"] = -1;
  }
  document["firmwareVersion"] = kFirmwareVersion;
  JsonArray pages = document.createNestedArray("pages");
  for (uint8_t index = 0; index < dashboardPageCount; ++index) {
    pages.add(dashboardPages[index].id);
  }
  String body;
  body.reserve(2048);
  serializeJson(document, body);
  server.send(200, "application/json", body);
}

void sendApiDashboard() {
  if (!apiAuthenticated()) return;
  if (!filesystemReady || !LittleFS.exists(kDashboardPath)) {
    server.send(404, "application/json", "{\"error\":\"dashboard_not_found\"}");
    return;
  }
  File file = LittleFS.open(kDashboardPath, "r");
  server.streamFile(file, "application/json");
  file.close();
}

void receiveApiDashboard() {
  if (!apiAuthenticated()) return;
  if (!filesystemReady) {
    sendJsonError(503, F("filesystem_unavailable"), F("LittleFS unavailable"));
    return;
  }
  const String body = server.arg("plain");
  if (body.isEmpty() || body.length() > kMaxDashboardBytes) {
    sendJsonError(413, F("dashboard_too_large"), F("Dashboard exceeds limit"));
    return;
  }
  File temporary = LittleFS.open(kDashboardTempPath, "w");
  if (!temporary || temporary.print(body) != body.length()) {
    if (temporary) temporary.close();
    LittleFS.remove(kDashboardTempPath);
    sendJsonError(507, F("write_failed"), F("Could not store dashboard"));
    return;
  }
  temporary.close();
  File validation = LittleFS.open(kDashboardTempPath, "r");
  const bool valid = validation && loadDashboardMetadata(validation);
  validation.close();
  if (!valid) {
    LittleFS.remove(kDashboardTempPath);
    sendJsonError(422, F("invalid_dashboard"), F("Invalid version, pages, or durations"));
    return;
  }
  LittleFS.remove(kDashboardBackupPath);
  const bool hadDashboard = LittleFS.exists(kDashboardPath);
  if (hadDashboard &&
      !LittleFS.rename(kDashboardPath, kDashboardBackupPath)) {
    LittleFS.remove(kDashboardTempPath);
    sendJsonError(507, F("commit_failed"), F("Could not back up dashboard"));
    return;
  }
  if (!LittleFS.rename(kDashboardTempPath, kDashboardPath)) {
    if (hadDashboard) LittleFS.rename(kDashboardBackupPath, kDashboardPath);
    sendJsonError(507, F("commit_failed"), F("Could not activate dashboard"));
    return;
  }
  LittleFS.remove(kDashboardBackupPath);
  if (server.arg("render") != "false") {
    pageRotationAuto = true;
    pageShownAt = millis();
    fullRenderPending = true;
  }
  server.send(204);
}

void receiveApiData() {
  if (!apiAuthenticated()) return;
  const String body = server.arg("plain");
  if (body.isEmpty() || body.length() > kMaxDataBytes) {
    sendJsonError(413, F("data_too_large"), F("Data update exceeds limit"));
    return;
  }
  StaticJsonDocument<128> filter;
  filter["values"] = true;
  filter["render"] = true;
  DynamicJsonDocument document(4096);
  recordFreeHeap();
  const auto error = deserializeJson(document, body,
      DeserializationOption::Filter(filter));
  if (error || !document["values"].is<JsonObject>()) {
    sendJsonError(422, F("invalid_data"), F("Expected values object"));
    return;
  }
  JsonObject values = document["values"].as<JsonObject>();
  uint32_t changedValueMask = 0;
  for (JsonPair pair : values) {
    DashboardValue *slot = findValue(pair.key().c_str(), true);
    if (slot == nullptr) continue;
    JsonObject value = pair.value().as<JsonObject>();
    const char *state = value["state"] | "unknown";
    strlcpy(slot->state, state, sizeof(slot->state));
    slot->available = value["available"] | false;
    changedValueMask |= 1UL << (slot - dashboardValues);
  }
  if (document["render"] | true) {
    pendingChangedValues |= changedValueMask;
  }
  lastValueUpdateAt = millis();
  hasValueUpdate = true;
  server.send(204);
}

void receiveApiDisplay() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<256> document;
  if (deserializeJson(document, server.arg("plain"))) {
    sendJsonError(400, F("invalid_json"), F("Expected JSON object"));
    return;
  }
  bool settingsChanged = false;
  if (document.containsKey("on")) displayOn = document["on"].as<bool>();
  if (document.containsKey("brightness")) {
    const int value = document["brightness"].as<int>();
    if (value < 0 || value > 100) {
      sendJsonError(422, F("invalid_brightness"), F("Brightness must be 0-100"));
      return;
    }
    settingsChanged = settingsChanged || displayBrightness != value;
    displayBrightness = value;
  }
  if (document.containsKey("pixelShift")) {
    const int value = document["pixelShift"].as<int>();
    if (value < 0 || value > kMaxPixelShift) {
      sendJsonError(422, F("invalid_pixel_shift"),
                    F("Pixel shift must be 0-10"));
      return;
    }
    settingsChanged = settingsChanged || displayPixelShift != value;
    displayPixelShift = value;
    updatePixelShift();
    pixelShiftAt = millis();
    showCurrentPage();
  }
  if (document.containsKey("timezone")) {
    const char *value = document["timezone"] | "";
    if (!timezoneValid(value)) {
      sendJsonError(422, F("invalid_timezone"),
                    F("Timezone rule must contain 1-63 printable characters"));
      return;
    }
    const bool timezoneChanged = strcmp(displayTimezone, value) != 0;
    settingsChanged = settingsChanged || timezoneChanged;
    strlcpy(displayTimezone, value, sizeof(displayTimezone));
    applyTimezone();
    if (timezoneChanged) {
      lastClockTick = static_cast<time_t>(-1);
      showCurrentPage();
    }
  }
  if (settingsChanged) saveDisplaySettings();
  applyBacklight();
  server.send(204);
}

void receiveApiPage() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<192> document;
  if (deserializeJson(document, server.arg("plain"))) {
    sendJsonError(400, F("invalid_json"), F("Expected JSON object"));
    return;
  }
  const char *mode = document["mode"];
  const char *command = document["command"];
  const char *id = document["id"];
  if (mode && strcmp(mode, "auto") == 0) {
    pageRotationAuto = true;
  } else if (command && dashboardPageCount) {
    pageRotationAuto = false;
    if (strcmp(command, "next") == 0) {
      showPageWithTransition((activePageIndex + 1) % dashboardPageCount);
      server.send(204);
      return;
    } else if (strcmp(command, "previous") == 0) {
      showPageWithTransition(
          (activePageIndex + dashboardPageCount - 1) % dashboardPageCount);
      server.send(204);
      return;
    } else if (strcmp(command, "reload") != 0) {
      sendJsonError(422, F("invalid_command"), F("Unknown page command"));
      return;
    }
  } else if (id && dashboardPageCount) {
    bool found = false;
    for (uint8_t index = 0; index < dashboardPageCount; ++index) {
      if (strcmp(id, dashboardPages[index].id) == 0) {
        pageRotationAuto = false;
        showPageWithTransition(index);
        found = true;
        break;
      }
    }
    if (!found) {
      sendJsonError(404, F("page_not_found"), F("Unknown page id"));
      return;
    }
    pageShownAt = millis();
    server.send(204);
    return;
  } else {
    sendJsonError(422, F("invalid_page_request"), F("Expected mode, command, or id"));
    return;
  }
  pageShownAt = millis();
  showCurrentPage();
  server.send(204);
}

void receiveApiRestart() {
  if (!apiAuthenticated()) return;
  server.send(204);
  delay(100);
  ESP.restart();
}

void startAccessPoint() {
  if (accessPointRunning) return;
  if (configValid() && config.resetApiAuthOnRecovery) {
    memset(config.apiPassword, 0, sizeof(config.apiPassword));
    config.apiAuthEnabled = 0;
    saveConfig();
  }
  WiFi.mode(configValid() ? WIFI_AP_STA : WIFI_AP);
  const String ssid = "SDPRO-Setup-" + deviceSuffix();
  if (networkSettings.recoveryPassword[0]) {
    WiFi.softAP(ssid.c_str(), networkSettings.recoveryPassword);
  } else {
    WiFi.softAP(ssid.c_str());
  }
  accessPointRunning = true;
  setupStationCount = UINT8_MAX;
  showSetupScreen();
  Serial.printf("Setup AP: %s, http://%s/\n", ssid.c_str(),
                WiFi.softAPIP().toString().c_str());
}

void sendWebApp() {
  if (!accessPointRunning && configValid() && !webAuthenticated()) return;
  server.sendHeader("Cache-Control", "no-store");
  server.sendHeader("Content-Encoding", "gzip");
  server.sendHeader("Vary", "Accept-Encoding");
  server.send_P(200, PSTR("text/html; charset=utf-8"),
                reinterpret_cast<PGM_P>(kWebAppGzip), kWebAppGzipSize);
}

void sendApiSetup() {
  if (!accessPointRunning) {
    sendJsonError(409, F("setup_inactive"), F("Setup mode is not active"));
    return;
  }
  const bool configured = configValid();
  StaticJsonDocument<1024> document;
  document["configured"] = configured;
  document["ssid"] = configured ? config.ssid : "";
  document["hostname"] = configuredHostname();
  document["username"] = configured ? configuredUsername() : "admin";
  document["retryLimit"] = configured && config.wifiRetryLimit
                               ? config.wifiRetryLimit
                               : kDefaultWifiRetryLimit;
  document["resetApiAuthOnRecovery"] =
      configured && config.resetApiAuthOnRecovery;
  document["apiAuthEnabled"] = configured ? config.apiAuthEnabled != 0 : true;
  document["apiPasswordSet"] = configured && config.apiPassword[0];
  document["otaAuthEnabled"] = configured ? config.otaAuthEnabled != 0 : true;
  document["otaPasswordSet"] = configured && config.otaPassword[0];
  document["directOtaEnabled"] =
      configured ? config.directOtaEnabled != 0 : true;
  document["recoverySsid"] = "SDPRO-Setup-" + deviceSuffix();
  document["recoveryPasswordSet"] =
      networkSettings.recoveryPassword[0] != '\0';
  document["ntpServer"] = networkSettings.ntpServer;
  document["ntpFromDhcp"] = networkSettings.ntpFromDhcp;
  document["staticIpEnabled"] = networkSettings.staticIpEnabled;
  document["staticIp"] = networkSettings.staticIp;
  document["gateway"] = networkSettings.gateway;
  document["subnet"] = networkSettings.subnet;
  document["dns1"] = networkSettings.dns1;
  document["dns2"] = networkSettings.dns2;
  String body;
  body.reserve(768);
  serializeJson(document, body);
  server.send(200, "application/json", body);
}

void receiveApiSetup() {
  if (!accessPointRunning) {
    sendJsonError(409, F("setup_inactive"), F("Setup mode is not active"));
    return;
  }
  StaticJsonDocument<1024> document;
  if (deserializeJson(document, server.arg("plain"))) {
    sendJsonError(400, F("invalid_json"), F("Expected JSON object"));
    return;
  }
  const bool configured = configValid();
  const char *ssid = document["ssid"] | "";
  const char *wifiPassword = document["wifiPassword"] | "";
  const char *hostname = document["hostname"] | "";
  const char *username =
      document["username"] | (configured ? configuredUsername() : "admin");
  const char *legacyPassword = document["password"] | "";
  const char *apiPassword = document["apiPassword"] | legacyPassword;
  const char *otaPassword = document["otaPassword"] | legacyPassword;
  const bool apiAuthEnabled =
      document["apiAuthEnabled"] | (configured && config.apiAuthEnabled);
  const bool otaAuthEnabled =
      document["otaAuthEnabled"] | (configured && config.otaAuthEnabled);
  const bool directOtaEnabled =
      document["directOtaEnabled"] | (configured && config.directOtaEnabled);
  const int retryLimit = document["retryLimit"] |
                         static_cast<int>(kDefaultWifiRetryLimit);
  const size_t nextApiPasswordLength =
      apiPassword[0] ? strlen(apiPassword) : strlen(config.apiPassword);
  const size_t nextOtaPasswordLength =
      otaPassword[0] ? strlen(otaPassword) : strlen(config.otaPassword);
  if (!ssid[0] || strlen(ssid) > 32 || strlen(wifiPassword) > 64 ||
      !hostnameValid(hostname) || !usernameValid(username) || retryLimit < 1 ||
      retryLimit > 10 ||
      strlen(apiPassword) > 32 || strlen(otaPassword) > 32 ||
      !networkExtrasValid(document) ||
      (apiAuthEnabled && nextApiPasswordLength < 8) ||
      (directOtaEnabled && otaAuthEnabled && nextOtaPasswordLength < 8)) {
    sendJsonError(422, F("invalid_configuration"),
                  F("Check Wi-Fi and password values"));
    return;
  }
  DeviceConfig next = configured ? config : DeviceConfig{};
  strlcpy(next.ssid, ssid, sizeof(next.ssid));
  if (!configured || wifiPassword[0]) {
    strlcpy(next.wifiPassword, wifiPassword, sizeof(next.wifiPassword));
  }
  strlcpy(next.hostname, hostname, sizeof(next.hostname));
  strlcpy(next.username, username, sizeof(next.username));
  if (apiPassword[0]) {
    strlcpy(next.apiPassword, apiPassword, sizeof(next.apiPassword));
  }
  if (otaPassword[0]) {
    strlcpy(next.otaPassword, otaPassword, sizeof(next.otaPassword));
  }
  next.apiAuthEnabled = apiAuthEnabled;
  next.otaAuthEnabled = otaAuthEnabled;
  next.directOtaEnabled = directOtaEnabled;
  next.wifiRetryLimit = retryLimit;
  next.resetApiAuthOnRecovery =
      document["resetApiAuthOnRecovery"] | false;
  updateNetworkExtras(document);
  if (!saveNetworkSettings()) {
    sendJsonError(500, F("storage_error"), F("Could not save network settings"));
    return;
  }
  config = next;
  saveConfig();
  server.send(204);
  delay(400);
  ESP.restart();
}

void sendApiNetwork() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<1024> document;
  document["ssid"] = config.ssid;
  document["hostname"] = configuredHostname();
  document["ip"] = WiFi.status() == WL_CONNECTED
                       ? WiFi.localIP().toString()
                       : WiFi.softAPIP().toString();
  document["rssiDbm"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -127;
  document["gateway"] = WiFi.gatewayIP().toString();
  document["dns1Current"] = WiFi.dnsIP(0).toString();
  document["dns2Current"] = WiFi.dnsIP(1).toString();
  document["channel"] = WiFi.status() == WL_CONNECTED ? WiFi.channel() : 0;
  document["bssid"] =
      WiFi.status() == WL_CONNECTED ? WiFi.BSSIDstr() : "";
  document["mac"] = WiFi.macAddress();
  document["reconnectCount"] = reconnectCount;
  document["lastDisconnectReason"] = disconnectReason();
  document["retryLimit"] = config.wifiRetryLimit
                               ? config.wifiRetryLimit
                               : kDefaultWifiRetryLimit;
  document["resetApiAuthOnRecovery"] =
      config.resetApiAuthOnRecovery != 0;
  document["recoverySsid"] = "SDPRO-Setup-" + deviceSuffix();
  document["recoveryPasswordSet"] =
      networkSettings.recoveryPassword[0] != '\0';
  document["ntpServer"] = networkSettings.ntpServer;
  document["ntpFromDhcp"] = networkSettings.ntpFromDhcp;
  document["staticIpEnabled"] = networkSettings.staticIpEnabled;
  document["staticIp"] = networkSettings.staticIp;
  document["staticGateway"] = networkSettings.gateway;
  document["staticSubnet"] = networkSettings.subnet;
  document["staticDns1"] = networkSettings.dns1;
  document["staticDns2"] = networkSettings.dns2;
  String body;
  body.reserve(768);
  serializeJson(document, body);
  server.send(200, "application/json", body);
}

void receiveApiNetwork() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<768> document;
  if (deserializeJson(document, server.arg("plain"))) {
    sendJsonError(400, F("invalid_json"), F("Expected JSON object"));
    return;
  }
  const char *ssid = document["ssid"] | "";
  const char *password = document["password"] | "";
  const char *hostname = document["hostname"] | "";
  const int retryLimit = document["retryLimit"] |
                         static_cast<int>(kDefaultWifiRetryLimit);
  if (!ssid[0] || strlen(ssid) > 32 || strlen(password) > 64 ||
      !hostnameValid(hostname) || retryLimit < 1 || retryLimit > 10 ||
      !networkExtrasValid(document)) {
    sendJsonError(422, F("invalid_network"), F("Invalid Wi-Fi settings"));
    return;
  }
  strlcpy(config.ssid, ssid, sizeof(config.ssid));
  if (password[0]) {
    strlcpy(config.wifiPassword, password, sizeof(config.wifiPassword));
  }
  strlcpy(config.hostname, hostname, sizeof(config.hostname));
  config.wifiRetryLimit = retryLimit;
  config.resetApiAuthOnRecovery =
      document["resetApiAuthOnRecovery"] | false;
  updateNetworkExtras(document);
  if (!saveNetworkSettings()) {
    sendJsonError(500, F("storage_error"), F("Could not save network settings"));
    return;
  }
  saveConfig();
  server.send(204);
  delay(400);
  ESP.restart();
}

void receiveApiNetworkTest() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<768> document;
  if (deserializeJson(document, server.arg("plain"))) {
    sendJsonError(400, F("invalid_json"), F("Expected JSON object"));
    return;
  }
  const char *ssid = document["ssid"] | "";
  const char *password = document["password"] | "";
  const char *hostname = document["hostname"] | "";
  const int retryLimit = document["retryLimit"] |
                         static_cast<int>(kDefaultWifiRetryLimit);
  if (!ssid[0] || strlen(ssid) > 32 || strlen(password) > 64 ||
      !hostnameValid(hostname) || retryLimit < 1 || retryLimit > 10 ||
      !networkExtrasValid(document)) {
    sendJsonError(422, F("invalid_network"), F("Invalid network settings"));
    return;
  }
  server.send(204);
}

void sendApiSecurity() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<160> document;
  document["apiAuthEnabled"] = config.apiAuthEnabled != 0;
  document["otaAuthEnabled"] = config.otaAuthEnabled != 0;
  document["directOtaEnabled"] = config.directOtaEnabled != 0;
  document["username"] = configuredUsername();
  String body;
  body.reserve(128);
  serializeJson(document, body);
  server.send(200, "application/json", body);
}

void receiveApiSecurity() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<256> document;
  if (deserializeJson(document, server.arg("plain"))) {
    sendJsonError(400, F("invalid_json"), F("Expected JSON object"));
    return;
  }
  const bool apiAuthEnabled =
      document["apiAuthEnabled"] | (config.apiAuthEnabled != 0);
  const bool otaAuthEnabled =
      document["otaAuthEnabled"] | (config.otaAuthEnabled != 0);
  const bool directOtaEnabled =
      document["directOtaEnabled"] | (config.directOtaEnabled != 0);
  const char *username = document["username"] | configuredUsername();
  const char *apiPassword = document["apiPassword"] | "";
  const char *otaPassword = document["otaPassword"] | "";
  const size_t nextApiPasswordLength =
      apiPassword[0] ? strlen(apiPassword) : strlen(config.apiPassword);
  const size_t nextOtaPasswordLength =
      otaPassword[0] ? strlen(otaPassword) : strlen(config.otaPassword);
  if (!usernameValid(username) || strlen(apiPassword) > 32 ||
      strlen(otaPassword) > 32 ||
      (apiAuthEnabled && nextApiPasswordLength < 8) ||
      (directOtaEnabled && otaAuthEnabled && nextOtaPasswordLength < 8)) {
    sendJsonError(422, F("invalid_security"),
                  F("Check username and password settings"));
    return;
  }
  if (apiPassword[0]) {
    strlcpy(config.apiPassword, apiPassword, sizeof(config.apiPassword));
  }
  if (otaPassword[0]) {
    strlcpy(config.otaPassword, otaPassword, sizeof(config.otaPassword));
  }
  strlcpy(config.username, username, sizeof(config.username));
  config.apiAuthEnabled = apiAuthEnabled;
  config.otaAuthEnabled = otaAuthEnabled;
  config.directOtaEnabled = directOtaEnabled;
  saveConfig();
  server.send(204);
}

void finishFirmwareUpdate() {
  const bool success = !Update.hasError();
  server.send(success ? 200 : 500, "text/plain",
              success ? "Update complete. Restarting..." : "Update failed");
  if (success) {
    delay(250);
    ESP.restart();
  }
}

void receiveFirmwareUpdate() {
  HTTPUpload &upload = server.upload();
  if (upload.status == UPLOAD_FILE_START) {
#if defined(ESP8266)
    WiFiUDP::stopAll();
    Update.begin((ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000);
#else
    Update.begin(UPDATE_SIZE_UNKNOWN);
#endif
  } else if (upload.status == UPLOAD_FILE_WRITE) {
    Update.write(upload.buf, upload.currentSize);
  } else if (upload.status == UPLOAD_FILE_END) {
    Update.end(true);
  } else if (upload.status == UPLOAD_FILE_ABORTED) {
    Update.end();
  }
  yield();
}

void finishDirectUpdate() {
  if (!directOtaAuthenticated()) return;
  finishFirmwareUpdate();
}

void receiveDirectUpdate() {
  if (!directOtaAuthenticated()) return;
  receiveFirmwareUpdate();
}

void finishPanelUpdate() {
  if (!apiAuthenticated()) return;
  finishFirmwareUpdate();
}

void receivePanelUpdate() {
  if (!apiAuthenticated()) return;
  receiveFirmwareUpdate();
}

void configureRoutes() {
  if (routesReady) return;
  server.on("/", HTTP_GET, sendWebApp);
  server.on("/display", HTTP_GET, sendWebApp);
  server.on("/network", HTTP_GET, sendWebApp);
  server.on("/security", HTTP_GET, sendWebApp);
  server.on("/update", HTTP_GET, sendWebApp);
  server.on("/update", HTTP_POST, finishDirectUpdate, receiveDirectUpdate);
  server.on("/api/v1/firmware", HTTP_POST, finishPanelUpdate,
            receivePanelUpdate);
  server.on("/api/v1/setup", HTTP_GET, sendApiSetup);
  server.on("/api/v1/setup", HTTP_PUT, receiveApiSetup);
  server.on("/api/v1/info", HTTP_GET, sendApiInfo);
  server.on("/api/v1/status", HTTP_GET, sendApiStatus);
  server.on("/api/v1/network", HTTP_GET, sendApiNetwork);
  server.on("/api/v1/network", HTTP_PUT, receiveApiNetwork);
  server.on("/api/v1/network/test", HTTP_POST, receiveApiNetworkTest);
  server.on("/api/v1/security", HTTP_GET, sendApiSecurity);
  server.on("/api/v1/security", HTTP_PUT, receiveApiSecurity);
  server.on("/api/v1/dashboard", HTTP_GET, sendApiDashboard);
  server.on("/api/v1/dashboard", HTTP_PUT, receiveApiDashboard);
  server.on("/api/v1/data", HTTP_PATCH, receiveApiData);
  server.on("/api/v1/display", HTTP_PUT, receiveApiDisplay);
  server.on("/api/v1/page", HTTP_POST, receiveApiPage);
  server.on("/api/v1/restart", HTTP_POST, receiveApiRestart);
  server.onNotFound([] { server.send(404, "text/plain", "Not found"); });
  server.begin();
  routesReady = true;
}

void connectToWiFi() {
  if (!configValid()) {
    startAccessPoint();
    return;
  }
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  configureIpAddress();
#if defined(ESP8266)
  WiFi.hostname(configuredHostname().c_str());
#else
  WiFi.setHostname(configuredHostname().c_str());
#endif
  WiFi.begin(config.ssid, config.wifiPassword);
  connectStartedAt = millis();
  wifiAttemptCount = 1;
  wifiWasConnected = false;
}

void showDisplayTest() {
  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, TFT_BACKLIGHT_ON);
  display.init();
  display.setRotation(0);
  display.fillScreen(TFT_BLACK);
  display.fillRect(0, 0, 80, 80, TFT_RED);
  display.fillRect(80, 0, 80, 80, TFT_GREEN);
  display.fillRect(160, 0, 80, 80, TFT_BLUE);
  display.fillRect(0, 80, 240, 80, TFT_WHITE);
  display.fillRect(0, 160, 240, 80, TFT_BLACK);
  display.setTextDatum(MC_DATUM);
  display.setTextColor(TFT_BLACK, TFT_WHITE);
  display.drawString("SD PRO", 120, 110, 4);
  display.drawString("DISPLAY TEST 1", 120, 145, 2);
  display.setTextColor(TFT_YELLOW, TFT_BLACK);
  display.drawString("OTA + WIFI OK", 120, 200, 2);
}

void showSetupScreen() {
  if (!accessPointRunning) return;
  setupStationCount = WiFi.softAPgetStationNum();
  setupScreenUpdatedAt = millis();

  const uint16_t background = display.color565(9, 14, 23);
  const uint16_t panel = display.color565(25, 34, 47);
  const uint16_t muted = display.color565(150, 164, 181);
  const uint16_t accent = display.color565(3, 169, 244);
  display.fillScreen(background);
  display.fillRoundRect(12, 12, 216, 216, 12, panel);
  display.fillRoundRect(12, 12, 216, 6, 3, accent);

  display.setTextDatum(MC_DATUM);
  display.setTextColor(TFT_WHITE, panel);
  display.drawString("SETUP MODE", 120, 42, 4);
  display.setTextColor(muted, panel);
  display.drawString("WI-FI NETWORK", 120, 70, 2);
  display.setTextColor(TFT_WHITE, panel);
  display.drawString("SDPRO-Setup-" + deviceSuffix(), 120, 92, 2);
  if (networkSettings.recoveryPassword[0]) {
    display.setTextColor(muted, panel);
    display.drawString("PASSWORD", 120, 122, 2);
    display.setTextColor(TFT_WHITE, panel);
    const String password = networkSettings.recoveryPassword;
    if (password.length() <= 24) {
      display.drawString(password, 120, 144, 2);
    } else if (password.length() <= 36) {
      display.drawString(password, 120, 144, 1);
    } else {
      const size_t split = (password.length() + 1) / 2;
      display.drawString(password.substring(0, split), 120, 138, 1);
      display.drawString(password.substring(split), 120, 151, 1);
    }
  }
  display.setTextColor(muted, panel);
  display.drawString("CONNECTED DEVICES", 120,
                     networkSettings.recoveryPassword[0] ? 174 : 142, 2);
  display.setTextColor(accent, panel);
  display.drawString(String(setupStationCount), 120,
                     networkSettings.recoveryPassword[0] ? 205 : 180, 4);

  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, TFT_BACKLIGHT_ON);
}

void startMdns() {
  if (mdnsReady || WiFi.status() != WL_CONNECTED) return;
  const String host = configuredHostname();
  if (!MDNS.begin(host.c_str())) return;
  MDNS.addService("mini-display", "tcp", 80);
  MDNS.addServiceTxt("mini-display", "tcp", "api", "1");
  MDNS.addServiceTxt("mini-display", "tcp", "id", "mini-display-" + deviceSuffix());
  MDNS.addServiceTxt("mini-display", "tcp", "model", kHardwareProfile);
  mdnsReady = true;
}

}  // namespace

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.printf("Home Assistant Mini-Display firmware %s\n", kFirmwareVersion);
#if defined(ESP8266)
  const String resetReason = ESP.getResetReason();
  strlcpy(lastResetReason, resetReason.c_str(), sizeof(lastResetReason));
#endif
  loadConfig();
  filesystemReady = LittleFS.begin();
  loadDisplaySettings();
  loadNetworkSettings();
  configureTimeService();
  loadStoredDashboard();
  showDisplayTest();
  configureRoutes();
  connectToWiFi();
  if (accessPointRunning) {
    showSetupScreen();
  } else {
    if (dashboardPageCount) showCurrentPage();
    applyBacklight();
  }
  recordFreeHeap();
}

void loop() {
  server.handleClient();
  if (accessPointRunning) {
    if (configValid() && WiFi.status() == WL_CONNECTED) {
      WiFi.softAPdisconnect(true);
      accessPointRunning = false;
      wifiWasConnected = true;
      wifiAttemptCount = 0;
      showCurrentPage();
      applyBacklight();
    } else if (millis() - setupScreenUpdatedAt >= 1000 &&
               WiFi.softAPgetStationNum() != setupStationCount) {
      showSetupScreen();
    }
    recordFreeHeap();
    delay(2);
    return;
  }
  if (fullRenderPending) {
    fullRenderPending = false;
    pendingChangedValues = 0;
    showCurrentPage();
  } else if (pendingChangedValues != 0) {
    const uint32_t changedValues = pendingChangedValues;
    pendingChangedValues = 0;
    if (!renderDashboardPage(&changedValues)) showCurrentPage();
  }
  startMdns();
#if defined(ESP8266)
  if (mdnsReady) MDNS.update();
#endif
  if (pageRotationAuto && dashboardPageCount > 1 &&
      millis() - pageShownAt >= dashboardPages[activePageIndex].durationMs) {
    showPageWithTransition((activePageIndex + 1) % dashboardPageCount);
  }
  if (dashboardPageCount && dashboardPages[activePageIndex].hasClock) {
    const time_t now = time(nullptr);
    if (now > 1000000000) {
      const time_t tick = dashboardPages[activePageIndex].clockShowsSeconds
                              ? now
                              : now / 60;
      if (tick != lastClockTick) {
        lastClockTick = tick;
        renderDashboardPage(nullptr, false);
      }
    }
  }
  if (displayPixelShift > 0 &&
      millis() - pixelShiftAt >= kPixelShiftIntervalMs) {
    updatePixelShift();
    pixelShiftAt = millis();
    showCurrentPage();
  }
  if (configValid() && !accessPointRunning) {
    if (WiFi.status() == WL_CONNECTED) {
      wifiWasConnected = true;
      wifiAttemptCount = 0;
    } else if (wifiWasConnected) {
      wifiWasConnected = false;
      lastDisconnectStatus = WiFi.status();
      ++reconnectCount;
      wifiAttemptCount = 1;
      connectStartedAt = millis();
      WiFi.reconnect();
    } else if (millis() - connectStartedAt >= kConnectTimeoutMs) {
      const uint8_t retryLimit = config.wifiRetryLimit
                                     ? config.wifiRetryLimit
                                     : kDefaultWifiRetryLimit;
      if (wifiAttemptCount >= retryLimit) {
        startAccessPoint();
      } else {
        lastDisconnectStatus = WiFi.status();
        ++reconnectCount;
        ++wifiAttemptCount;
        connectStartedAt = millis();
        WiFi.disconnect();
        WiFi.begin(config.ssid, config.wifiPassword);
      }
    }
  }
  recordFreeHeap();
  delay(2);
}
