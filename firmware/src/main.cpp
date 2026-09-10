#include <Arduino.h>
#include <ArduinoJson.h>
#include <ctype.h>
#include <EEPROM.h>
#include <memory>
#include <new>
#include "FreeTextSizing.h"
#include "MarqueeState.h"
#include "DisplayRefresh.h"
#include "NotificationRequest.h"
#include "NumberTransform.h"
#include "FeatureFlags.h"
#if defined(ESP8266)
#include <ESP8266mDNS.h>
#include "RequestBodyWebServer.h"
#if MINI_DISPLAY_FEATURE_TLS
#include "DualWebServer.h"
#else
#include <ESP8266WebServer.h>
#endif
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
#include "DisplayScrollBuffer.h"
#include "NotificationPainter.h"
#include "ApiAccessPolicy.h"
#include "DashboardPageLoader.h"
#include "CrashDiagnostics.h"
#include "RuntimeProfiler.h"
#include "ImageAssets.h"
#include "GraphHistory.h"
#include "DisplayDataResponse.h"
#include "JsonStreamWriter.h"
#include "WeatherCardRenderer.h"
#include "fonts/WeatherGlyphs.h"
#include "ScenePageRenderer.h"
#include "SceneUpdatePainter.h"
#include "TextFlow.h"
#include "FreeTextFrame.h"
#include "ImageAssetApi.h"
#include "PageTransitionRenderer.h"
#include "ProgressRenderer.h"
#include "ScreenCapture.h"
#include "SceneLayout.h"
#include "SceneRenderScheduler.h"
#include "TextEffect.h"
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
#include "TlsCertificateManager.h"
#endif
#include "UserFonts.h"
#include "WebAssets.generated.h"
#include "fonts/InterTightCompact13.h"
#include "fonts/InterTightBold18.h"
#include "fonts/InterTightBold24.h"
#include "fonts/InterTightBold36.h"
#include "fonts/InterTightBold48.h"
#include "fonts/InterTightSmooth.h"

StaticSmoothFont notificationTitleFont() { return indexedSmoothFont(InterTightSmooth24); }
StaticSmoothFont notificationBodyFont() { return indexedSmoothFont(InterTightSmooth18); }

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
constexpr uint32_t kDiagnosticsCaptureTimeoutMs = 15000;
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
#if MINI_DISPLAY_FEATURE_TLS
DualWebServer server(80, 443);
#else
RequestBodyWebServer<ESP8266WebServer> server(80);
#endif
#else
WebServer server(80);
#endif

struct HttpChunkSink {
  void operator()(const char *bytes, size_t length) const {
    server.sendContent(bytes, length);
    yield();
  }
};

HttpChunkSink httpChunkSink;
JsonStreamWriter<HttpChunkSink> jsonStreamWriter(httpChunkSink);
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
TlsCertificateManager tlsCertificates;
#endif
MiniDisplay display;
DisplayScrollBuffer displayScrollBuffer(display);
SceneRenderScheduler<> sceneScheduler(240, 240, kSceneUpdateBandHeight);
std::unique_ptr<ScenePage> activeScene;
bool activeSceneReady = false;
uint8_t activeScenePage = 0xff;
uint32_t bootId = 0;
uint32_t connectStartedAt = 0;
uint8_t wifiAttemptCount = 0;
bool wifiWasConnected = false;
bool accessPointRunning = false;
uint8_t setupStationCount = UINT8_MAX;
uint32_t setupScreenUpdatedAt = 0;
bool startupSequenceActive = true;
uint32_t startupConnectedAt = 0;
uint32_t startupScreenUpdatedAt = 0;
uint8_t startupCountdownShown = UINT8_MAX;
bool connectionScreenVisible = false;
uint32_t reconnectCount = 0;
wl_status_t lastDisconnectStatus = WL_IDLE_STATUS;
bool routesReady = false;
bool filesystemReady = false;
bool mdnsReady = false;
bool displayOn = true;
uint8_t displayBrightness = 100;
uint8_t displayPixelShift = 0;
DisplayRefresh displayRefresh;
NotificationCenter notifications;
NotificationPosition notificationPosition = NotificationPosition::Top;
bool notificationAuthEnabled = true;
SceneRect notificationPaintedBounds{};
uint32_t notificationPaintedRevision = 0;
uint32_t notificationFrameAt = 0;
char displayTimezone[64] = "CET-1CEST,M3.5.0,M10.5.0/3";
FontRenderState displayFontState;
int8_t pixelShiftX = 0;
int8_t pixelShiftY = 0;
uint32_t pixelShiftAt = 0;
bool pageRotationAuto = true;
int16_t pendingPageIndex = -1;
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
DashboardPageLoader pageDefinition;

struct DashboardValue {
  char *source;
  uint32_t sourceHash;
  uint32_t sourceCheck;
  char state[49];
  bool available;
};

DashboardValue dashboardValues[kMaxValues]{};
uint8_t dashboardValueCount = 0;
uint32_t pendingChangedValues = 0;
uint32_t transitionDeferredValues = 0;
bool pageTransitionActive = false;
bool fullRenderPending = false;
uint32_t fullRenderNotBefore = 0;
uint32_t lastValueUpdateAt = 0;
bool hasValueUpdate = false;
constexpr uint16_t kRenderRetryDelayMs = 750;
constexpr uint8_t kMaxMarqueeTitles = kMaxSceneTexts;
MarqueeTitle marqueeTitles[kMaxMarqueeTitles]{};
uint8_t marqueeTitleCount = 0;
String diagnosticsLastData;
uint32_t diagnosticsCaptureAt = 0;
uint32_t minimumFreeHeapBytes = UINT32_MAX;
char lastTransitionType[12] = "none";
uint32_t lastTransitionDurationMs = 0;

enum class RenderFailure : uint8_t {
  None,
  DashboardUnavailable,
  FileOpen,
  Json,
  Page,
  SceneAllocation,
  SceneCompilation,
};

enum class SceneCompileFailure : uint8_t {
  None,
  Allocation,
  CardLimit,
  TextLimit,
  TextPool,
  Weather,
  Value,
  Title,
  EmptyRows,
  EmptyRow,
};

RenderFailure lastRenderFailure = RenderFailure::None;
SceneCompileFailure lastSceneCompileFailure = SceneCompileFailure::None;

const char *renderFailureName() {
  switch (lastRenderFailure) {
    case RenderFailure::None: return "none";
    case RenderFailure::DashboardUnavailable: return "dashboard_unavailable";
    case RenderFailure::FileOpen: return "file_open";
    case RenderFailure::Json: return "json";
    case RenderFailure::Page: return "page";
    case RenderFailure::SceneAllocation: return "scene_allocation";
    case RenderFailure::SceneCompilation: return "scene_compilation";
  }
  return "unknown";
}

const char *sceneCompileFailureName() {
  switch (lastSceneCompileFailure) {
    case SceneCompileFailure::None: return "none";
    case SceneCompileFailure::Allocation: return "allocation";
    case SceneCompileFailure::CardLimit: return "card_limit";
    case SceneCompileFailure::TextLimit: return "text_limit";
    case SceneCompileFailure::TextPool: return "text_pool";
    case SceneCompileFailure::Weather: return "weather";
    case SceneCompileFailure::Value: return "value";
    case SceneCompileFailure::Title: return "title";
    case SceneCompileFailure::EmptyRows: return "empty_rows";
    case SceneCompileFailure::EmptyRow: return "empty_row";
  }
  return "unknown";
}
#if defined(ESP8266)
char lastResetReason[48]{};
#endif

bool renderDashboardPage();
bool renderDashboardPage(const uint32_t *changedValues,
                         bool clear = true);
void registerDashboardMarquees(JsonObjectConst, ScenePage &scene,
                               bool preserve = false);
void invalidateSceneBand(const SceneRect &bounds, uint8_t expansion = 0);
bool renderPendingScene(const ScenePage &scene);
void showPageWithTransition(uint8_t nextPageIndex);
void showSetupScreen();
void startAccessPoint();

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
  StaticJsonDocument<320> document;
  const auto error = deserializeJson(document, file);
  file.close();
  if (error) return;
  const int brightness = document["brightness"] | 100;
  const int pixelShift = document["pixelShift"] | 0;
  displayRefresh.setRate(document["refreshRateHz"] | 60.0F);
  parseNotificationPosition(document["notificationPosition"] | "top",
      notificationPosition, display.width(), display.height());
  notifications.setMaxVisible(document["notificationMaxVisible"] | 3);
  notificationAuthEnabled = document["notificationAuthEnabled"] | true;
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
  StaticJsonDocument<320> document;
  document["brightness"] = displayBrightness;
  document["pixelShift"] = displayPixelShift;
  document["refreshRateHz"] = displayRefresh.rate();
  document["notificationPosition"] = notificationPositionName(notificationPosition);
  document["notificationMaxVisible"] = notifications.maxVisible();
  document["notificationAuthEnabled"] = notificationAuthEnabled;
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
  return config.magic == kConfigMagic && config.checksum == checksum(config);
}

bool wifiConfigured() { return configValid() && config.ssid[0] != '\0'; }

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

bool apiAccessAllowed(bool requirePassword) {
  const auto policy = apiAccessPolicy(accessPointRunning, configValid(), requirePassword, config.apiPassword[0]);
  if (policy == ApiAccessPolicy::SetupMode) {
    server.send(403, "application/json", "{\"error\":\"setup_mode\"}");
    return false;
  }
  if (policy == ApiAccessPolicy::NotConfigured) {
    server.send(403, "application/json", "{\"error\":\"not_configured\"}");
    return false;
  }
  if (policy == ApiAccessPolicy::Open) return true;
  if (policy == ApiAccessPolicy::PasswordMissing) {
    server.send(403, "application/json", "{\"error\":\"password_not_configured\"}");
    return false;
  }
  char expected[sizeof(config.apiPassword) + 8];
  snprintf(expected, sizeof(expected), "Bearer %s", config.apiPassword);
  if (server.header("Authorization") == expected) return true;
  if (server.authenticate(configuredUsername(), config.apiPassword)) return true;
  server.requestAuthentication();
  return false;
}

bool apiAuthenticated() { return apiAccessAllowed(config.apiAuthEnabled); }

ImageAssetApi imageAssetApi(server, filesystemReady, apiAuthenticated);

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

void requestFullRender(uint16_t delayMs = 0) {
  fullRenderPending = true;
  fullRenderNotBefore = millis() + delayMs;
}

void showCurrentPage() {
  if (dashboardPageCount) {
    if (renderDashboardPage()) {
      fullRenderPending = false;
      fullRenderNotBefore = 0;
      return;
    }
    // Rendering needs a contiguous JSON allocation. HTTP handling can
    // temporarily fragment the small ESP8266 heap, so preserve the last good
    // frame and retry after request-owned buffers have been released.
    requestFullRender(kRenderRetryDelayMs);
    return;
  }
  display.fillScreen(TFT_BLACK);
  display.setTextDatum(MC_DATUM);
  display.setTextColor(TFT_WHITE, TFT_BLACK);
  display.drawString("MINI-DISPLAY", 120, 92, 4);
  display.setTextColor(TFT_YELLOW, TFT_BLACK);
  display.drawString("WAITING FOR DASHBOARD", 120, 135, 2);
  paintNotification(display, notifications, 0, 0);
}

void fingerprintSource(const char *source, uint32_t &hash, uint32_t &check) {
  hash = 2166136261UL;
  check = 5381UL;
  for (const uint8_t *cursor = reinterpret_cast<const uint8_t *>(source);
       *cursor; ++cursor) {
    hash = (hash ^ *cursor) * 16777619UL;
    check = ((check << 5) + check) ^ *cursor;
  }
}

DashboardValue *findValue(const char *source, bool create) {
  if (source == nullptr || source[0] == '\0') return nullptr;
  uint32_t sourceHash = 0;
  uint32_t sourceCheck = 0;
  fingerprintSource(source, sourceHash, sourceCheck);
  for (uint8_t index = 0; index < dashboardValueCount; ++index) {
    if (dashboardValues[index].sourceHash == sourceHash &&
        dashboardValues[index].sourceCheck == sourceCheck &&
        strcmp(dashboardValues[index].source, source) == 0) {
      return &dashboardValues[index];
    }
  }
  if (!create || dashboardValueCount >= kMaxValues) return nullptr;
  const size_t length = strlen(source);
  if (length > 64) return nullptr;
  char *name = static_cast<char *>(malloc(length + 1));
  if (!name) return nullptr;
  memcpy(name, source, length + 1);
  DashboardValue *slot = &dashboardValues[dashboardValueCount++];
  memset(slot, 0, sizeof(*slot));
  slot->source = name;
  slot->sourceHash = sourceHash;
  slot->sourceCheck = sourceCheck;
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

uint16_t cardTitleForeground(JsonObjectConst card,
                             JsonObjectConst colorMapping) {
  JsonVariantConst foreground = colorMapping["foreground"];
  if (!foreground.isNull()) return parseColor(foreground, TFT_LIGHTGREY);
  JsonVariantConst titleStyle = card["titleStyle"];
  if (titleStyle.isNull()) titleStyle = card["style"];
  return parseColor(titleStyle["foreground"], TFT_LIGHTGREY);
}

TextEffect parseTextEffect(JsonVariantConst style) {
  TextEffect result{};
  result.offsetX = 2;
  result.offsetY = 2;
  result.thickness = 1;
  const char *type = style["textEffect"] | "none";
  if (strcmp(type, "shadow") == 0) {
    result.type = TextEffectType::Shadow;
  } else if (strcmp(type, "outline") == 0) {
    result.type = TextEffectType::Outline;
  }
  result.color = parseColor(style["effectColor"], TFT_BLACK);
  result.thickness = constrain(style["effectThickness"] | 1, 1, 3);
  result.offsetX = constrain(style["effectOffsetX"] | 2, -6, 6);
  result.offsetY = constrain(style["effectOffsetY"] | 2, -6, 6);
  return result;
}

const GFXfont *builtInFontFor(const char *family, uint8_t size) {
  if (family == nullptr) family = "sans";
  if (strcmp(family, "sans") == 0 || strcmp(family, "sans-bold") == 0) {
    const GFXfont *fonts[] = {
        &InterTightBold18, &InterTightBold24, &InterTightBold36,
        &InterTightBold48};
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
  const GFXfont *fonts[] = {
      &InterTightBold18, &InterTightBold24, &InterTightBold36,
      &InterTightBold48};
  return fonts[min<uint8_t>(size, 3)];
}

RenderFont renderFontFor(const char *family, uint8_t size) {
  RenderFont font{builtInFontFor(family, size), -1, size, nullptr};
#if defined(ESP8266)
  const bool font1 = family && strcmp(family, "font1") == 0;
  const bool font2 = family && strcmp(family, "font2") == 0;
  const bool defaultFont =
      family == nullptr || strcmp(family, "default") == 0 ||
      strcmp(family, "sans") == 0 || strcmp(family, "sans-bold") == 0;
  const int8_t requestedSlot = font1 ? 0 : font2 ? 1 : -1;
  if (requestedSlot >= 0 && userFonts.available(requestedSlot, size)) {
    font.userSlot = requestedSlot;
  } else if ((defaultFont || requestedSlot >= 0) &&
             userFonts.activeSlot() >= 0 &&
             userFonts.available(userFonts.activeSlot(), size)) {
    font.userSlot = userFonts.activeSlot();
  } else if (defaultFont && size < 2) {
    const uint8_t *fonts[] = {InterTightSmooth18, InterTightSmooth24};
    font.smooth = fonts[size];
  } else if (defaultFont) {
    font.coverage = builtInCoverageFont(size);
  }
#endif
  return font;
}

void applyDisplayFont(const RenderFont &font) {
  applyRenderFont(display, font, displayFontState);
}

void resetMarqueeTitles() {
  marqueeTitleCount = 0;
}

void drawMarqueeTitle(MarqueeTitle &item, int16_t offset) {
  if (pageTransitionActive) return;
  if (!activeSceneReady || !activeScene) return;
  const int16_t index = activeScene->graph.findById(item.sceneNodeId);
  if (index < 0) return;
  SceneNode &node = activeScene->graph.node(index);
  activeScene->texts[node.payloadIndex].marqueeOffset = offset;
  invalidateSceneBand(node.clip);
  // Recompose the background and overlapping cards before pushing the tile.
  // Never erase a title with a flat rectangle directly on the LCD.
  item.drawnOffset = offset;
}


void updateMarqueeTitles() {
  if (pageTransitionActive) return;
  if (!displayOn || displayBrightness == 0 || marqueeTitleCount == 0 ||
      !activeSceneReady || !activeScene || !displayRefresh.ready(millis())) return;
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::Marquee);
  const uint32_t now = millis();
  bool anyChanged = false;
  for (uint8_t index = 0; index < marqueeTitleCount; ++index) {
    MarqueeTitle &item = marqueeTitles[index];
    if (!stepMarquee(item, now)) continue;
    drawMarqueeTitle(item, item.drawnOffset);
    anyChanged = true;
  }
  if (!anyChanged) return;
  // Recompose all dirty text regions together. The main loop gives page and
  // data work priority before the next marquee frame.
  if (!renderPendingScene(*activeScene)) requestFullRender();
  // Rendering can take longer than one display interval on image-backed pages.
  // Count that work as frame time instead of adding another idle interval.
  displayRefresh.completed(now);
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

bool marqueeEnabled(JsonVariantConst style, bool fallback = false) {
  return (style["marquee"] | fallback) &&
         strcmp(style["textFlow"] | "default", "default") == 0;
}

RenderFont selectBestFont(const String &text, JsonVariantConst style,
                          int16_t width, int16_t height, bool scroll = false) {
  const char *family = style["fontFamily"] | "sans";
  int8_t size = requestedFontSize(style, height);
  if (strcmp(style["textFlow"] | "default", "default") != 0) {
    // Explicit flow preserves the chosen size; wrapping controls line breaks.
    if (strcmp(style["fontSize"] | "auto", "auto") == 0) size = min<int8_t>(size, 1);
    const RenderFont font = renderFontFor(family, size);
    applyDisplayFont(font);
    return font;
  }
  while (size > 0) {
    const RenderFont font = renderFontFor(family, size);
    applyDisplayFont(font);
    if ((scroll || display.textWidth(text) <= width - 6) && display.fontHeight() <= height) {
      return font;
    }
    --size;
  }
  const RenderFont font = renderFontFor(family, 0);
  applyDisplayFont(font);
  return font;
}

bool isBuiltInCardTitleFamily(const char *family) {
  return strcmp(family, "default") == 0 || strcmp(family, "sans") == 0 ||
         strcmp(family, "sans-bold") == 0;
}

RenderFont compactCardTitleFont() {
  return RenderFont{&InterTightCompact13, -1, 0,
#if defined(ESP8266)
                    InterTightSmooth13
#else
                    nullptr
#endif
  };
}

RenderFont selectCardTitleFont(const String &text, JsonVariantConst style,
                               int16_t width, int16_t height,
                               int8_t maximumAutoSize) {
  const char *size = style["fontSize"] | "auto";
  const char *family = style["fontFamily"] | "sans";
  const bool automatic = strcmp(size, "auto") == 0;
  if (!automatic) {
    if (strcmp(size, "small") == 0 && isBuiltInCardTitleFamily(family))
      return compactCardTitleFont();
    return renderFontFor(family, requestedFontSize(style, height));
  }
  if (strcmp(style["textFlow"] | "default", "default") != 0) {
    if (automatic && isBuiltInCardTitleFamily(family)) return compactCardTitleFont();
    return selectBestFont(text, style, width, height);
  }
  if (automatic) {
    for (int8_t candidate = maximumAutoSize; candidate >= 0; --candidate) {
      const RenderFont font = renderFontFor(family, candidate);
      applyDisplayFont(font);
      if (display.fontHeight() <= height &&
          (marqueeEnabled(style, true) || display.textWidth(text) <= width - 6)) {
        return font;
      }
    }
  }
  if ((automatic || strcmp(size, "small") == 0) &&
      isBuiltInCardTitleFamily(family)) {
    const RenderFont font = compactCardTitleFont();
    applyDisplayFont(font);
    return font;
  }
  return selectBestFont(text, style, width, height);
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

NumberTransform cardNumberTransform(JsonObjectConst card) {
  NumberTransform result;
  JsonObjectConst source = card["valueTransform"];
  if (source.isNull()) return result;
  result.multiply = source["multiply"] | 1.0F;
  result.add = source["add"] | 0.0F;
  result.absolute = source["absolute"] | false;
  if (!source["minimum"].isNull()) result.minimum = source["minimum"];
  if (!source["maximum"].isNull()) result.maximum = source["maximum"];
  if (!source["precision"].isNull()) result.precision = source["precision"];
  return result;
}

bool transformedCardNumber(JsonObjectConst card, const char *raw,
                           float &result) {
  if (raw == nullptr) return false;
  char *end = nullptr;
  result = strtof(raw, &end);
  if (end == raw || *end != '\0' || !isfinite(result)) return false;
  result = cardNumberTransform(card).apply(result);
  return isfinite(result);
}

String compactNumber(float value) {
  String result(value, 4);
  while (result.endsWith("0")) result.remove(result.length() - 1);
  if (result.endsWith(".")) result.remove(result.length() - 1);
  if (result == "-0") return String("0");
  return result;
}

String transformedCardNumberText(JsonObjectConst card, const char *raw,
                                 bool applyPrecision = true) {
  float value = 0.0F;
  if (!transformedCardNumber(card, raw, value)) return String(raw ? raw : "");
  const NumberTransform transform = cardNumberTransform(card);
  return applyPrecision && transform.precision >= 0
             ? String(value, static_cast<unsigned char>(transform.precision))
             : card["valueTransform"].isNull() ? String(raw)
                                                : compactNumber(value);
}

float progressRatio(JsonObjectConst card, DashboardValue *value) {
  const float minimum = card["minimum"] | 0.0F;
  const float maximum = card["maximum"] | 100.0F;
  float current = minimum;
  if (value) transformedCardNumber(card, value->state, current);
  return maximum > minimum
             ? constrain((current - minimum) / (maximum - minimum), 0.0F,
                         1.0F)
             : 0.0F;
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
    const bool numeric = strcmp(type, "number") == 0;
    const String raw = numeric ? transformedCardNumberText(card, value->state)
                               : String(value->state);
    const String mappingInput = numeric
                                    ? transformedCardNumberText(
                                          card, value->state, false)
                                    : raw;
    String result;
    const bool mapped = mappedCardValue(card, mappingInput, result);
    if (!mapped) result = raw;
    const char *unit = card["unit"];
    if (!mapped && unit && unit[0]) result += String(unit);
    return result;
  }
  String result(card["text"] | "");
  const char *unit = card["unit"];
  if (unit && unit[0]) result += String(unit);
  return result;
}

struct CardTextLayout {
  int16_t valueY;
  int16_t valueHeight;
  int16_t titleY;
  int16_t titleHeight;
  bool hasTitle;
  RenderFont titleFont;
};

CardTextLayout cardTextLayout(JsonObjectConst card, int16_t width, int16_t y,
                              int16_t height) {
  const char *title = card["title"];
  const bool hasTitle = (card["showTitle"] | true) && title && title[0] &&
                        height >= 28;
  const bool bar = strcmp(card["progress"] | "none", "bar") == 0;
  const int16_t contentHeight =
      max<int16_t>(1, height - (bar && height >= 20 ? 9 : 0));
  CardTextLayout layout{y, contentHeight, y, contentHeight, hasTitle,
                        compactCardTitleFont()};
  if (!hasTitle) return layout;

  JsonVariantConst titleStyle = card["titleStyle"];
  if (titleStyle.isNull()) titleStyle = card["style"];
  JsonVariantConst valueStyle = card["valueStyle"];
  if (valueStyle.isNull()) valueStyle = card["style"];
  const int16_t provisionalValueHeight = max<int16_t>(1, contentHeight - 17);
  const RenderFont valueFont = selectBestFont(
      cardValue(card), valueStyle, width, provisionalValueHeight);
  applyDisplayFont(valueFont);
  const int16_t valueFontHeight = display.fontHeight();
  const int8_t maximumAutoTitleSize =
      valueFont.size >= 3 ? 1 : valueFont.size >= 1 ? 0 : -1;

  const char *vertical = titleStyle["verticalAlign"] | "top";
  if (strcmp(vertical, "top") != 0 && strcmp(vertical, "bottom") != 0) {
    layout.titleFont = selectCardTitleFont(
        String(title), titleStyle, width - 10, contentHeight,
        maximumAutoTitleSize);
    return layout;
  }

  const int16_t maximumTitleHeight =
      strcmp(titleStyle["fontSize"] | "auto", "auto") != 0
          ? contentHeight
          : max<int16_t>(1, min<int16_t>(contentHeight / 2,
                                        contentHeight - valueFontHeight));
  layout.titleFont = selectCardTitleFont(
      String(title), titleStyle, width - 10, maximumTitleHeight,
      maximumAutoTitleSize);
  applyDisplayFont(layout.titleFont);
  const int16_t titleBand =
      min<int16_t>(maximumTitleHeight, display.fontHeight());
  const bool wrapped = strcmp(titleStyle["textFlow"] | "default", "wrap") == 0;
  const int16_t reserved = wrapped ? maximumTitleHeight : titleBand;
  layout.titleHeight = reserved;
  layout.valueHeight = max<int16_t>(1, contentHeight - reserved);
  if (strcmp(vertical, "top") == 0) {
    layout.valueY += reserved;
  } else {
    layout.titleY += contentHeight - reserved;
  }
  return layout;
}



bool compileText(ScenePage &page, const String &value, const RenderFont &font,
                 uint8_t datum, int16_t x, int16_t y,
                 uint16_t foreground, uint16_t background,
                 const TextEffect &effect = TextEffect{},
                 uint8_t lineCount = 1, int16_t blockWidth = 0,
                 uint16_t maxBytes = 48,
                 uint32_t sourceMask = 0, int16_t zIndex = 1000) {
  if (page.textCount >= kMaxSceneTexts) {
    lastSceneCompileFailure = SceneCompileFailure::TextLimit;
    return false;
  }
  const uint16_t valueBytes = min<size_t>(value.length(), maxBytes) + 1;
  if (page.textBytes + valueBytes > kMaxSceneTextBytes) {
    lastSceneCompileFailure = SceneCompileFailure::TextPool;
    return false;
  }
  if (!page.texts.ensure(page.textCount + 1) ||
      !page.textPool.ensure(page.textBytes + valueBytes)) {
    lastSceneCompileFailure = SceneCompileFailure::Allocation;
    return false;
  }
  const uint8_t payloadIndex = page.textCount;
  SceneText &text = page.texts[payloadIndex];
  text = SceneText{};
  text.x = x;
  text.y = y;
  applyDisplayFont(font);
  int16_t boundsWidth = display.textWidth(value);
  int16_t boundsHeight = display.fontHeight();
  text.lineCount = max<uint8_t>(1, lineCount);
  if (lineCount > 1) {
    boundsWidth = blockWidth;
    boundsHeight *= lineCount;
  }
  const bool centeredX = datum == TC_DATUM || datum == MC_DATUM ||
                         datum == BC_DATUM;
  const bool rightX = datum == TR_DATUM || datum == MR_DATUM ||
                      datum == BR_DATUM;
  const bool centeredY = datum == ML_DATUM || datum == MC_DATUM ||
                         datum == MR_DATUM;
  const bool bottomY = datum == BL_DATUM || datum == BC_DATUM ||
                       datum == BR_DATUM;
  int16_t boundsX = centeredX ? x - boundsWidth / 2
                              : rightX ? x - boundsWidth : x;
  int16_t boundsY = centeredY ? y - boundsHeight / 2
                              : bottomY ? y - boundsHeight : y;
  const int16_t effectExtent = textEffectExtent(effect);
  boundsX -= effectExtent;
  boundsY -= effectExtent;
  boundsWidth += effectExtent * 2;
  boundsHeight += effectExtent * 2;
  text.foreground = foreground;
  text.background = background;
  text.effect = effect;
  text.font = font.builtin;
  text.smoothFont = font.smooth;
  text.coverageFont = font.coverage;
  text.userFontSlot = font.userSlot;
  text.userFontSize = font.size;
  text.datum = datum;
  text.valueOffset = page.textBytes;
  strlcpy(page.textPool.data() + page.textBytes, value.c_str(), valueBytes);
  page.textBytes += valueBytes;
  SceneNode node;
  node.id = 0x4000U + payloadIndex;
  node.type = SceneNodeType::Text;
  node.payloadIndex = payloadIndex;
  node.sourceMask = sourceMask;
  node.zIndex = zIndex;
  node.bounds = {boundsX, boundsY, boundsWidth, boundsHeight};
  node.clip = {0, 0, 240, 240};
  if (!page.graph.add(node)) {
    lastSceneCompileFailure = SceneCompileFailure::TextLimit;
    return false;
  }
  ++page.textCount;
  return true;
}

RenderFont selectFreeTextFont(const String &text, JsonVariantConst style,
                              int16_t width, int16_t height,
                              bool scroll = false) {
  const char *family = style["fontFamily"] | "default";
  const int8_t selected = freeTextSize(width, height, scroll,
      [&](int8_t size, int16_t &textWidth, int16_t &textHeight) {
    const RenderFont font = renderFontFor(family, size);
    applyDisplayFont(font);
    textWidth = display.textWidth(text);
    textHeight = display.fontHeight();
  });
  if (selected >= 0) return renderFontFor(family, selected);
  return isBuiltInCardTitleFamily(family) ? compactCardTitleFont()
                                         : renderFontFor(family, 0);
}

bool compilePositionedText(ScenePage &page, String value,
                         JsonVariantConst style, int16_t x, int16_t y,
                         int16_t width, int16_t height, uint16_t foreground,
                         uint16_t background,
                         const char *defaultHorizontal = "center",
                         const char *defaultVertical = "middle",
                         int16_t fontHeight = 0,
                         const RenderFont *selectedFont = nullptr,
                         bool tightVerticalEdges = false,
                         bool freeFit = false,
                         uint32_t sourceMask = 0,
                         int16_t zIndex = 1000,
                         bool preserveText = false) {
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
  const int16_t availableHeight =
      fontHeight > 0 ? min(height, fontHeight) : height;
  const bool scroll = marqueeEnabled(style, preserveText);
  const RenderFont font = selectedFont != nullptr
                              ? *selectedFont
                              : freeFit ? selectFreeTextFont(value, style, width, availableHeight,
                                    scroll || strcmp(style["textFlow"] | "default", "overflow") == 0)
                                        : selectBestFont(value, style, width, availableHeight, scroll);
  applyDisplayFont(font);
  const char *flow = style["textFlow"] | "default";
  const bool wrap = strcmp(flow, "wrap") == 0;
  const bool overflow = strcmp(flow, "overflow") == 0;
  WrappedText wrapped;
  if (wrap) {
    wrapped = wrapDisplayText(value.c_str(), max<int16_t>(1, width - 8),
        max<int16_t>(1, min<int16_t>(6, height / max<int16_t>(1, display.fontHeight()))),
        [&](const char *line) { return display.textWidth(line); });
    value = wrapped.text;
  }
  while (!scroll && !wrap && !overflow && value.length() > 1 && display.textWidth(value) > width - 8) {
    value.remove(value.length() - 1);
  }
  const int16_t textX = left ? x + 4 : right ? x + width - 4 : x + width / 2;
  const int16_t textY = top    ? y + (tightVerticalEdges ? 0 : 3)
                        : bottom ? y + height - (tightVerticalEdges ? 1 : 3)
                                 : y + height / 2;
  if (!compileText(page, value, font, datum, textX, textY, foreground,
                   background, parseTextEffect(style), wrapped.lines, wrapped.width,
                   scroll ? value.length() : wrap || overflow ? 144 : 48,
                   sourceMask, zIndex)) return false;
  if (!overflow) {
    const uint16_t textNodeId = 0x4000U + page.textCount - 1;
    const int16_t textNodeIndex = page.graph.findById(textNodeId);
    if (textNodeIndex < 0) {
      lastSceneCompileFailure = SceneCompileFailure::TextLimit;
      return false;
    }
    SceneNode &node = page.graph.node(textNodeIndex);
    node.clip = {int16_t(x + 4), y, max<int16_t>(1, width - 8), height};
    node.bounds = node.clip;
    SceneText &text = page.texts[node.payloadIndex];
    if (scroll && display.textWidth(value) > width - 8) {
      text.marqueeIntervalMs = constrain(style["marqueeIntervalMs"] | 100, 50, 10000);
      text.marqueeStepPixels = constrain(style["marqueeStepPixels"] | 1, 1, 16);
      if (strcmp(style["marqueeEffect"] | "bounce", "loop") == 0)
        text.marqueeRepeat = display.textWidth(value) + 24;
      // Start at the first character, irrespective of the resting alignment.
      text.x = x + 4;
      text.datum = top ? TL_DATUM : bottom ? BL_DATUM : ML_DATUM;
    }
  }
  return true;
}

bool compileCenteredFit(ScenePage &page, String value, JsonVariantConst style,
                      int16_t x, int16_t y, int16_t width, int16_t height,
                      uint16_t foreground, uint16_t background,
                      bool freeFit = false, uint32_t sourceMask = 0,
                      int16_t zIndex = 1000) {
  return compilePositionedText(page, value, style, x, y, width, height,
      foreground, background, "center", "middle", 0, nullptr, false,
      freeFit, sourceMask, zIndex);
}

GraphPaintConfig compileGraph(JsonObjectConst card) {
  GraphPaintConfig result;
  result.series = graphHistory.find(card);
  JsonObjectConst graph = card["graph"];
  result.minimum = graph["minimum"] | NAN;
  result.maximum = graph["maximum"] | NAN;
  result.color = parseColor(graph["color"], TFT_CYAN);
  result.gridColor = parseColor(graph["gridColor"], TFT_DARKGREY);
  result.opacity = graph["opacity"] | 50;
  result.fillOpacity = graph["fillOpacity"] | 0;
  result.gridOpacity = graph["gridOpacity"] | 20;
  result.gridLines = graph["gridLines"] | 0;
  result.lineWidth = graph["lineWidth"] | 1;
  result.pointSize = graph["pointSize"] | 1;
  result.barGap = graph["barGap"] | 1;
  result.line = strcmp(graph["type"] | "bar", "line") == 0;
  result.fit = strcmp(graph["scale"] | (result.line ? "fit" : "zero"), "fit") == 0;
  result.showPoints = graph["showPoints"] | false;
  result.scalePadding = graph["scalePadding"] | 5;
  result.labels = graph["showValues"] | false;
  result.labelEvery = graph["labelEvery"] | 6;
  result.decimals = graph["decimals"] | 1;
  return result;
}

void addSceneSource(const char *source, uint32_t &mask) {
  DashboardValue *value = findValue(source, false);
  if (value == nullptr) return;
  const uint8_t index = static_cast<uint8_t>(value - dashboardValues);
  if (index < 32) mask |= uint32_t{1} << index;
}

void collectSceneSources(JsonVariantConst value, uint32_t &mask) {
  if (value.is<JsonArrayConst>()) {
    for (JsonVariantConst item : value.as<JsonArrayConst>()) {
      if (item.is<const char *>()) addSceneSource(item.as<const char *>(), mask);
      else collectSceneSources(item, mask);
    }
    return;
  }
  if (!value.is<JsonObjectConst>()) return;
  for (JsonPairConst pair : value.as<JsonObjectConst>()) {
    const char *key = pair.key().c_str();
    JsonVariantConst nested = pair.value();
    if ((strcmp(key, "source") == 0 || strcmp(key, "entity") == 0) &&
        nested.is<const char *>()) {
      addSceneSource(nested.as<const char *>(), mask);
    } else if (strcmp(key, "sources") == 0 ||
               nested.is<JsonObjectConst>() || nested.is<JsonArrayConst>()) {
      collectSceneSources(nested, mask);
    }
  }
}

bool compileCard(ScenePage &page, JsonObjectConst card, int16_t x, int16_t y,
               int16_t width, int16_t height, bool forceTransparent = false) {
  if (page.cardCount >= kMaxSceneCards) {
    lastSceneCompileFailure = SceneCompileFailure::CardLimit;
    return false;
  }
  if (!page.cards.ensure(page.cardCount + 1)) {
    lastSceneCompileFailure = SceneCompileFailure::Allocation;
    return false;
  }
  JsonObjectConst colorMapping;
  const char *source = card["source"];
  DashboardValue *sourceValue = findValue(source, false);
  uint32_t sourceMask = 0;
  collectSceneSources(card, sourceMask);
  if (sourceValue != nullptr && sourceValue->available) {
    const char *cardType = card["type"] | "";
    const String mappingValue = strcmp(cardType, "number") == 0
                                    ? transformedCardNumberText(
                                          card, sourceValue->state, false)
                                    : String(sourceValue->state);
    findCardMapping(card, "colorMappings", mappingValue, colorMapping);
  }
  JsonVariantConst backgroundValue = colorMapping["background"];
  if (backgroundValue.isNull()) backgroundValue = card["style"]["background"];
  JsonVariantConst foregroundValue = colorMapping["foreground"];
  if (foregroundValue.isNull()) foregroundValue = card["style"]["foreground"];
  const uint16_t background =
      parseColor(backgroundValue, display.color565(30, 34, 42));
  const uint16_t foreground = parseColor(foregroundValue, TFT_WHITE);

  const uint8_t payloadIndex = page.cardCount;
  SceneCard &sceneCard = page.cards[payloadIndex];
  sceneCard = SceneCard{};
  sceneCard.graph = compileGraph(card);
  sceneCard.background = background;
  const char *backgroundMode = card["backgroundMode"] | "";
  sceneCard.flags =
      (forceTransparent || strcmp(backgroundMode, "transparent") == 0 ||
       (card["transparentBackground"] | false))
          ? 1U
          : 0U;
  sceneCard.imageFit = parseImageFit(card["imageFit"] | "cover");
  const char *cardType = card["type"] | "";
  const char *image = strcmp(cardType, "image") == 0
                          ? card["image"] | ""
                          : strcmp(backgroundMode, "image") == 0 ||
                                    backgroundMode[0] == '\0'
                                ? card["backgroundImage"] | ""
                                : "";
  strlcpy(sceneCard.image, image, sizeof(sceneCard.image));
  SceneNode cardNode;
  cardNode.id = 0x2000U + payloadIndex;
  cardNode.type = SceneNodeType::Card;
  cardNode.payloadIndex = payloadIndex;
  cardNode.sourceMask = sourceMask;
  const int16_t cardZ = 20 + payloadIndex * 3;
  cardNode.zIndex = cardZ;
  cardNode.bounds = {x, y, width, height};
  cardNode.clip = {0, 0, 240, 240};
  if (!page.graph.add(cardNode)) {
    lastSceneCompileFailure = SceneCompileFailure::CardLimit;
    return false;
  }
  ++page.cardCount;
  if (strcmp(cardType, "image") == 0 || strcmp(cardType, "chart") == 0) return true;

  const char *title = card["title"];
  const char *progressType = card["progress"] | "none";
  const bool bar = strcmp(progressType, "bar") == 0;
  const bool ring = strcmp(progressType, "ring") == 0;
  CardTextLayout textLayout{y, height, y, height, false, compactCardTitleFont()};
  int16_t valueX = x, valueWidth = width, titleX = x, titleWidth = width;
  if (page.freeLayout) {
    const FreeTextFrame valueBox = freeTextFrame(card, false);
    const FreeTextFrame titleBox = freeTextFrame(card, true);
    valueX = valueBox.x;
    valueWidth = valueBox.width;
    textLayout.valueY = valueBox.y;
    textLayout.valueHeight = valueBox.height;
    titleX = titleBox.x;
    titleWidth = titleBox.width;
    textLayout.titleY = titleBox.y;
    textLayout.titleHeight = titleBox.height;
    textLayout.hasTitle = title && title[0] && (card["showTitle"] | true);
    textLayout.titleFont = selectFreeTextFont(String(title ? title : ""),
        card["titleStyle"], titleWidth, titleBox.height,
        marqueeEnabled(card["titleStyle"], true) ||
        strcmp(card["titleStyle"]["textFlow"] | "default", "overflow") == 0);
  } else textLayout = cardTextLayout(card, width, y, height);
  JsonVariantConst valueStyle = card["valueStyle"];
  if (valueStyle.isNull()) valueStyle = card["style"];
  RingLayout ringGeometry{};
  if (strcmp(cardType, "weather") == 0) {
    if (!compileWeatherContent(card, valueX, textLayout.valueY, valueWidth, textLayout.valueHeight, findValue,
        [&](const String &line, int16_t lx, int16_t ly, int16_t lw, int16_t lh) {
          return compilePositionedText(page, line, valueStyle, lx, ly, lw, lh,
                                     foreground, background, "center", "middle", 0, nullptr,
                                     false, page.freeLayout, sourceMask, cardZ + 1);
        },
        [&](uint8_t code, uint8_t size, int16_t cx, int16_t cy, bool colored) {
          RenderFont font;
          font.builtin = size == 96 ? &Weather96 : size == 48 ? &Weather48 : &Weather24;
          const uint16_t color = !colored ? foreground : code == 11 ? TFT_YELLOW :
              code == 0 ? TFT_LIGHTGREY : code == 4 || code == 5 ? TFT_ORANGE : TFT_CYAN;
          return compileText(page, String(char('A'+code)), font, MC_DATUM, cx,
                             cy, color, background, TextEffect{}, 1, 0, 48,
                             sourceMask, cardZ + 1);
        })) {
      if (lastSceneCompileFailure == SceneCompileFailure::None) {
        lastSceneCompileFailure = SceneCompileFailure::Weather;
      }
      return false;
    }
  } else if (ring) {
    ringGeometry =
        ringLayout(valueX, textLayout.valueY, valueWidth, textLayout.valueHeight);
    if (!compileCenteredFit(page, cardValue(card), valueStyle, valueX,
                          ringGeometry.valueY, valueWidth,
                          ringGeometry.valueHeight, foreground, background,
                          page.freeLayout, sourceMask, cardZ + 1)) {
      if (lastSceneCompileFailure == SceneCompileFailure::None) {
        lastSceneCompileFailure = SceneCompileFailure::Value;
      }
      return false;
    }
  } else {
    if (!compilePositionedText(page, cardValue(card), valueStyle, valueX,
                             textLayout.valueY, valueWidth, textLayout.valueHeight,
                             foreground, background, "center", "middle", 0,
                             nullptr, false, page.freeLayout, sourceMask,
                             cardZ + 1, page.freeLayout && strcmp(cardType, "text") == 0)) {
      if (lastSceneCompileFailure == SceneCompileFailure::None) {
        lastSceneCompileFailure = SceneCompileFailure::Value;
      }
      return false;
    }
  }
  if (textLayout.hasTitle) {
    JsonVariantConst titleStyle = card["titleStyle"];
    if (titleStyle.isNull()) titleStyle = card["style"];
    const uint16_t titleForeground =
        cardTitleForeground(card, colorMapping);
    if (!compilePositionedText(page, String(title), titleStyle, titleX,
                             textLayout.titleY, titleWidth, textLayout.titleHeight,
                             titleForeground, background, "left", "top",
                             textLayout.titleHeight, &textLayout.titleFont,
                             true, page.freeLayout, sourceMask, cardZ + 1,
                             true)) {
      if (lastSceneCompileFailure == SceneCompileFailure::None) {
        lastSceneCompileFailure = SceneCompileFailure::Title;
      }
      return false;
    }
  }

  if (bar || ring) {
    const float ratio = progressRatio(card, sourceValue);
    sceneCard.hasProgress = true;
    sceneCard.progressRing = ring;
    sceneCard.progressX = ring ? ringGeometry.x : x + 5;
    sceneCard.progressY = ring ? ringGeometry.y : y + height - 8;
    sceneCard.progressWidth = ring ? ringGeometry.diameter : width - 10;
    sceneCard.progressFill = static_cast<int16_t>(
        (ring ? 1000 : sceneCard.progressWidth) * ratio);
    sceneCard.progressBackground = TFT_DARKGREY;
    sceneCard.progressForeground =
        parseColor(card["style"]["accent"], TFT_CYAN);
    sceneCard.progressCenter = background;
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

RenderFont pageTitleFont(JsonVariantConst style) {
  return renderFontFor(style["fontFamily"] | "default",
                       pageTitleFontSize(style));
}

int16_t pageTitleThickness(JsonVariantConst style) {
  applyDisplayFont(pageTitleFont(style));
  return min<int16_t>(64, display.fontHeight() + 2);
}

RenderFont rowTitleFont(JsonVariantConst style) {
  const char *family = style["fontFamily"] | "default";
  const bool builtInFamily = strcmp(family, "default") == 0 ||
                             strcmp(family, "sans") == 0 ||
                             strcmp(family, "sans-bold") == 0;
  if (builtInFamily) return {&InterTightCompact13, -1, 0};
  return renderFontFor(family, 0);
}

int16_t rowTitleHeight(JsonVariantConst style) {
  applyDisplayFont(rowTitleFont(style));
  return display.fontHeight();
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

bool compileScenePage(JsonObjectConst source, ScenePage &page) {
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::SceneCompile);
  lastSceneCompileFailure = SceneCompileFailure::None;
  page.clear();
  page.background = parseColor(source["style"]["background"], TFT_BLACK);
  strlcpy(page.backgroundImage, source["backgroundImage"] | "",
          sizeof(page.backgroundImage));
  page.transparentCards = source["transparentCards"] | false;
  JsonArrayConst rows = source["rows"].as<JsonArrayConst>();
  page.freeLayout = strcmp(source["layout"] | "rows", "free") == 0;
  if (page.freeLayout) {
    for (JsonObjectConst row : rows) for (JsonObjectConst card : row["cards"].as<JsonArrayConst>()) {
      JsonObjectConst frame = card["frame"];
      const int16_t x = lroundf((frame["x"] | 0.0F) * 2.4F);
      const int16_t y = lroundf((frame["y"] | 0.0F) * 2.4F);
      const int16_t width = min<int16_t>(240 - x, lroundf((frame["width"] | 50.0F) * 2.4F));
      const int16_t height = min<int16_t>(240 - y, lroundf((frame["height"] | 25.0F) * 2.4F));
      if (!compileCard(page, card, x, y, width, height, page.transparentCards)) return false;
    }
    return true;
  }
  const PageContentLayout layout = pageContentLayout(source);
  const char *pageTitle = source["title"];
  JsonVariantConst titleStyle = source["titleStyle"];
  const uint16_t titleBackground =
      parseColor(titleStyle["background"], page.background);
  const uint16_t titleForeground =
      parseColor(titleStyle["foreground"], TFT_WHITE);
  if (layout.hasTitle) {
    SceneRect titleBounds;
    if (strcmp(layout.titlePosition, "bottom") == 0) {
      titleBounds = {
          0, static_cast<uint8_t>(240 - layout.titleThickness), 240,
          static_cast<uint8_t>(layout.titleThickness)};
    } else if (strcmp(layout.titlePosition, "left") == 0) {
      titleBounds = {0, 0, static_cast<uint8_t>(layout.titleThickness), 240};
    } else if (strcmp(layout.titlePosition, "right") == 0) {
      titleBounds = {
          static_cast<uint8_t>(240 - layout.titleThickness), 0,
          static_cast<uint8_t>(layout.titleThickness), 240};
    } else {
      titleBounds = {0, 0, 240,
                     static_cast<uint8_t>(layout.titleThickness)};
    }
    if (page.fillCount >= kMaxSceneFills) {
      lastSceneCompileFailure = SceneCompileFailure::Title;
      return false;
    }
    if (!page.fills.ensure(page.fillCount + 1)) {
      lastSceneCompileFailure = SceneCompileFailure::Allocation;
      return false;
    }
    const uint8_t fillIndex = page.fillCount++;
    page.fills[fillIndex].color = titleBackground;
    SceneNode titleNode;
    titleNode.id = 0x1000U + fillIndex;
    titleNode.type = SceneNodeType::Fill;
    titleNode.payloadIndex = fillIndex;
    titleNode.zIndex = 10;
    titleNode.bounds = titleBounds;
    titleNode.clip = {0, 0, 240, 240};
    if (!page.graph.add(titleNode)) {
      lastSceneCompileFailure = SceneCompileFailure::Title;
      return false;
    }
  }
  if (layout.hasTitle && strcmp(layout.titlePosition, "top") == 0) {
    if (!compileText(page, String(pageTitle), pageTitleFont(titleStyle), MC_DATUM,
                   120, layout.titleThickness / 2, titleForeground,
                   titleBackground)) {
      if (lastSceneCompileFailure == SceneCompileFailure::None) {
        lastSceneCompileFailure = SceneCompileFailure::Title;
      }
      return false;
    }
  } else if (layout.hasTitle &&
             strcmp(layout.titlePosition, "bottom") == 0) {
    if (!compileText(page, String(pageTitle), pageTitleFont(titleStyle), MC_DATUM,
                   120, 240 - layout.titleThickness / 2, titleForeground,
                   titleBackground)) {
      if (lastSceneCompileFailure == SceneCompileFailure::None) {
        lastSceneCompileFailure = SceneCompileFailure::Title;
      }
      return false;
    }
  }

  uint16_t totalWeight = 0;
  for (JsonObjectConst row : rows) totalWeight += row["weight"] | 1;
  if (totalWeight == 0 || rows.size() == 0) {
    lastSceneCompileFailure = SceneCompileFailure::EmptyRows;
    return false;
  }
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
      JsonVariantConst rowTitleStyle = row["titleStyle"];
      if (rowTitleStyle.isNull()) rowTitleStyle = row["style"];
      const RenderFont rowFont = rowTitleFont(rowTitleStyle);
      const int16_t titleHeight = rowTitleHeight(rowTitleStyle);
      const uint16_t rowForeground =
          parseColor(rowTitleStyle["foreground"], TFT_LIGHTGREY);
      if (!compileText(page, String(rowTitle), rowFont, TL_DATUM, layout.x + 2,
                     rowY, rowForeground, page.background)) {
        return false;
      }
      rowY += titleHeight;
      rowHeight -= titleHeight;
    }
    JsonArrayConst cards = row["cards"].as<JsonArrayConst>();
    if (cards.size() == 0) {
      lastSceneCompileFailure = SceneCompileFailure::EmptyRow;
      return false;
    }
    const int16_t cardWidth =
        (layout.right - layout.x - gap * (cards.size() - 1)) / cards.size();
    int16_t cardX = layout.x;
    for (JsonObjectConst card : cards) {
      if (!compileCard(page, card, cardX, rowY, cardWidth, rowHeight,
                     page.transparentCards)) {
        return false;
      }
      cardX += cardWidth + gap;
    }
    rowY = nextY + gap;
  }
  return true;
}

void invalidateSceneBand(const SceneRect &bounds, uint8_t expansion) {
  const int16_t top = max<int16_t>(
      0, ((bounds.y + pixelShiftY - expansion) / kSceneUpdateBandHeight) *
             kSceneUpdateBandHeight);
  const int16_t bottom = min<int16_t>(
      240, ((bounds.bottom() + pixelShiftY + expansion +
             kSceneUpdateBandHeight - 1) /
            kSceneUpdateBandHeight) * kSceneUpdateBandHeight);
  if (bottom > top) {
    sceneScheduler.invalidate(
        {0, top, 240, static_cast<int16_t>(bottom - top)});
  }
}

bool invalidateChangedSceneSources(const ScenePage &scene,
                                   uint32_t changedValues) {
  bool affected = false;
  for (uint8_t nodeIndex = 0; nodeIndex < scene.graph.size(); ++nodeIndex) {
    const SceneNode &node = scene.graph.node(nodeIndex);
    if ((node.sourceMask & changedValues) == 0) continue;
    affected = true;
    invalidateSceneBand(node.bounds, 2);
  }
  return affected;
}

bool renderPendingScene(const ScenePage &scene) {
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::SceneRender);
  if (!sceneScheduler.pending() && !sceneScheduler.rendering()) return true;
  if (!displayRefresh.ready(millis())) return true;
#if defined(ESP8266)
  if (display.fontLoaded) display.unloadFont();
  displayFontState = FontRenderState{};
  std::unique_ptr<SceneUpdatePainter> painter(
      new (std::nothrow) SceneUpdatePainter(display));
  if (!painter || !painter->begin()) return false;
  MINI_DISPLAY_PROFILE_MEMORY(RuntimeProfilePoint::SceneRender);
  auto &band = painter->band;
  auto &font = painter->font;
  auto &images = painter->images;
  while (sceneScheduler.beginFrame() || sceneScheduler.rendering()) {
    SceneRect tile;
    while (sceneScheduler.nextTile(tile)) {
      if (tile.x != 0 || tile.width != 240 ||
          tile.height != kSceneUpdateBandHeight) {
        band.deleteSprite();
        return false;
      }
      {
        MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::SceneTilePaint);
        band.fillSprite(scene.background);
        paintScenePage(band, scene, pixelShiftX, pixelShiftY - tile.y, 0, 0,
                       240, kSceneUpdateBandHeight, font, &images);
        paintNotification(band, notifications, 0, -tile.y);
      }
      {
        MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::SpiTransfer);
        displayScrollBuffer.pushLogical(
            0, tile.y, 240, kSceneUpdateBandHeight,
            static_cast<uint16_t *>(band.getPointer()));
      }
      yield();
    }
  }
  if (band.fontLoaded) band.unloadFont();
  band.deleteSprite();
  displayRefresh.completed(millis());
  return true;
#else
  paintScenePage(display, scene, pixelShiftX, pixelShiftY, 0, 0, 240, 240,
                 displayFontState);
  paintNotification(display, notifications, 0, 0);
  displayRefresh.completed(millis());
  return true;
#endif
}

void updateNotifications() {
  if ((!notifications.active() && notificationPaintedBounds.empty()) || !displayOn ||
      !displayBrightness || !displayRefresh.ready(millis()) || millis() - notificationFrameAt < 33) return;
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::Notification);
  const bool wasActive = notifications.active();
  bool animate = displayRefresh.intervalMs() < 120;
#if defined(ESP8266)
  // Repainting every animation frame temporarily needs the compositor band,
  // image cache and Wi-Fi SDK heap at the same time. Degrade to one-step
  // presentation before the allocator becomes fragmented or starves Wi-Fi.
  animate = animate && ESP.getFreeHeap() >= 20 * 1024 &&
            ESP.getMaxFreeBlockSize() >= 8 * 1024;
#endif
  notifications.advance(millis(), display.width(), display.height(), animate,
      prepareNotification);
  const SceneRect next = notifications.bounds();
  const bool changed = notifications.revision() != notificationPaintedRevision ||
      next.x != notificationPaintedBounds.x || next.y != notificationPaintedBounds.y ||
      next.width != notificationPaintedBounds.width || next.height != notificationPaintedBounds.height;
  bool painted = true;
  if (changed) {
    SceneRect damage = clipSceneRect(sceneRectUnion(next, notificationPaintedBounds), display.width(), display.height());
    if (!damage.empty()) {
      // Overlay coordinates are physical pixels and never inherit pixel shift.
      const int16_t top =
          (damage.y / kSceneUpdateBandHeight) * kSceneUpdateBandHeight;
      const int16_t bottom = std::min<int16_t>(
          display.height(),
          (damage.bottom() + kSceneUpdateBandHeight - 1) /
              kSceneUpdateBandHeight * kSceneUpdateBandHeight);
      sceneScheduler.invalidate({0, top, static_cast<int16_t>(display.width()), static_cast<int16_t>(bottom - top)});
      if (activeSceneReady && activeScene) {
        painted = renderPendingScene(*activeScene);
      } else {
        // Notifications also work before any dashboard has been configured.
#if defined(ESP8266)
        std::unique_ptr<SceneUpdatePainter> painter(new (std::nothrow) SceneUpdatePainter(display));
        painted = painter && painter->begin();
        if (painted) {
          for (int16_t y = top; y < bottom; y += kSceneUpdateBandHeight) {
            painter->band.fillSprite(TFT_BLACK);
            if (!dashboardPageCount) {
              painter->band.setTextDatum(MC_DATUM);
              painter->band.setTextColor(TFT_WHITE, TFT_BLACK);
              painter->band.drawString("MINI-DISPLAY", 120, 92 - y, 4);
              painter->band.setTextColor(TFT_YELLOW, TFT_BLACK);
              painter->band.drawString("WAITING FOR DASHBOARD", 120, 135 - y, 2);
            }
            paintNotification(painter->band, notifications, 0, -y);
            displayScrollBuffer.pushLogical(
                0, y, 240, kSceneUpdateBandHeight,
                static_cast<uint16_t *>(painter->band.getPointer()));
            yield();
          }
          displayRefresh.completed(millis());
        }
#else
        display.fillRect(0, top, display.width(), bottom - top, TFT_BLACK);
        paintNotification(display, notifications, 0, 0);
        displayRefresh.completed(millis());
#endif
      }
    }
  }
  if (painted) {
    notificationPaintedBounds = next;
    notificationPaintedRevision = notifications.revision();
    notifications.presented(millis());
    if (wasActive && !notifications.active()) {
      if (!activeSceneReady) requestFullRender();
    }
  }
  notificationFrameAt = millis();
}

bool renderDashboardPage() { return renderDashboardPage(nullptr); }

bool loadPageDefinition(uint8_t index) {
  if (pageDefinition.contains(index)) return true;
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::PageLoad);
  File file = LittleFS.open(kDashboardPath, "r");
  if (!file) return false;
  return pageDefinition.load(file, index);
}

bool renderDashboardPage(const uint32_t *changedValues, bool clear) {
  lastRenderFailure = RenderFailure::None;
  if (!filesystemReady || !LittleFS.exists(kDashboardPath) ||
      activePageIndex >= dashboardPageCount) {
    lastRenderFailure = RenderFailure::DashboardUnavailable;
    return false;
  }
  const bool partial = changedValues != nullptr && activeSceneReady &&
                       activeScenePage == activePageIndex;
  const bool preserveMarquees =
      marqueeTitleCount > 0 && (changedValues != nullptr || !clear);
  {
  recordFreeHeap();
  if (!loadPageDefinition(activePageIndex)) {
    lastRenderFailure = RenderFailure::Json;
    return false;
  }
  JsonObjectConst page = pageDefinition.page();
  if (!activeScene) activeScene.reset(new (std::nothrow) ScenePage());
  if (!activeScene) {
    lastRenderFailure = RenderFailure::SceneAllocation;
    return false;
  }
  if (partial) {
    if (!invalidateChangedSceneSources(*activeScene, *changedValues)) {
      return true;
    }
  } else {
    sceneScheduler.invalidate({0, 0, 240, 240});
  }
  if (!compileScenePage(page, *activeScene)) {
    activeSceneReady = false;
    lastRenderFailure = RenderFailure::SceneCompilation;
    return false;
  }
  // New text can grow or move after fitting/mapping. Clear both old and new
  // bounds, not only the bounds compiled for the previous value.
  registerDashboardMarquees(page, *activeScene, preserveMarquees);
  if (partial) invalidateChangedSceneSources(*activeScene, *changedValues);
  }
  if (!renderPendingScene(*activeScene)) {
    activeSceneReady = false;
    lastRenderFailure = RenderFailure::SceneAllocation;
    return false;
  }
  activeSceneReady = true;
  activeScenePage = activePageIndex;
  return true;
}

void registerDashboardMarquees(JsonObjectConst page, ScenePage &scene,
                               bool preserve) {
  struct Position {
    uint32_t nextActionAt;
    uint32_t contentHash;
    uint16_t id;
    int16_t offset;
    MarqueePhase phase;
  };
  uint8_t previousCount = preserve ? marqueeTitleCount : 0;
  std::unique_ptr<Position[]> previous(previousCount ? new (std::nothrow) Position[previousCount] : nullptr);
  if (!previous) previousCount = 0;
  for (uint8_t index = 0; index < previousCount; ++index) {
    const MarqueeTitle &item = marqueeTitles[index];
    previous[index] = {item.nextActionAt, item.contentHash, item.sceneNodeId,
                       item.drawnOffset, item.phase};
  }
  resetMarqueeTitles();
  {
    for (uint16_t index = 0; index < scene.graph.size(); ++index) {
      SceneNode &node = scene.graph.node(index);
      if (node.type != SceneNodeType::Text) continue;
      SceneText &text = scene.texts[node.payloadIndex];
      if (!text.marqueeIntervalMs || marqueeTitleCount >= kMaxMarqueeTitles) continue;
      RenderFont font{text.font, text.userFontSlot, text.userFontSize, text.smoothFont};
      font.coverage = text.coverageFont;
      applyDisplayFont(font);
      MarqueeTitle &item = marqueeTitles[marqueeTitleCount++];
      item = MarqueeTitle{};
      item.sceneNodeId = node.id;
      item.contentHash = marqueeContentHash(scene.textPool.data() + text.valueOffset);
      item.overflow = max<int16_t>(0, display.textWidth(scene.textPool.data() + text.valueOffset) - node.clip.width);
      item.loop = text.marqueeRepeat > 0;
      if (item.loop) item.overflow = text.marqueeRepeat;
      item.nextActionAt = millis() + kMarqueeStartPauseMs;
      item.intervalMs = text.marqueeIntervalMs;
      item.stepPixels = text.marqueeStepPixels;
      item.phase = MarqueePhase::PausedAtStart;
    }
  }
  for (uint8_t index = 0; index < marqueeTitleCount; ++index) {
    MarqueeTitle &item = marqueeTitles[index];
    for (uint8_t old = 0; old < previousCount; ++old) {
      if (previous[old].id != item.sceneNodeId || previous[old].contentHash != item.contentHash) continue;
      item.drawnOffset = constrain(previous[old].offset, 0, item.overflow);
      item.phase = previous[old].phase;
      item.nextActionAt = previous[old].nextActionAt;
      const int16_t node = scene.graph.findById(item.sceneNodeId);
      if (node >= 0)
        scene.texts[scene.graph.node(node).payloadIndex].marqueeOffset = item.drawnOffset;
      break;
    }
  }
}

void showPageWithTransition(uint8_t nextPageIndex) {
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::Transition);
  if (nextPageIndex >= dashboardPageCount || nextPageIndex == activePageIndex) {
    return;
  }
  const auto showWithoutTransition = [&]() {
    activePageIndex = nextPageIndex;
    showCurrentPage();
    // A skipped animation still starts a new, full page dwell interval.
    pageShownAt = millis();
  };
  const PageTransitionConfig &transition =
      dashboardPages[activePageIndex].transition;
  if (transition.type == PageTransitionType::None || notifications.active()) {
    showWithoutTransition();
    return;
  }
  if (!filesystemReady || !LittleFS.exists(kDashboardPath)) {
    showWithoutTransition();
    return;
  }
  if (!activeSceneReady || activeScenePage != activePageIndex) {
    if (!renderDashboardPage()) {
      showWithoutTransition();
      return;
    }
  }
  File file = LittleFS.open(kDashboardPath, "r");
  if (!file) {
    showWithoutTransition();
    return;
  }
  std::unique_ptr<ScenePage> nextPage(new (std::nothrow) ScenePage());
  if (!nextPage) {
    file.close();
    showWithoutTransition();
    return;
  }
  bool compiledNext = false;
  {
    // Each page is parsed separately so transitions never retain the complete
    // dashboard JSON tree in the small ESP8266 heap.
    recordFreeHeap();
    MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::PageLoad);
    if (pageDefinition.load(file, nextPageIndex)) {
      compiledNext = compileScenePage(pageDefinition.page(), *nextPage);
      if (compiledNext) registerDashboardMarquees(pageDefinition.page(), *nextPage);
    }
    MINI_DISPLAY_PROFILE_MEMORY(RuntimeProfilePoint::Transition);
  }
  file.close();
  if (!compiledNext) {
    nextPage.reset();
    showWithoutTransition();
    return;
  }
  std::unique_ptr<PageTransitionRenderer> renderer(
      new (std::nothrow) PageTransitionRenderer(
          display, displayOn, displayBrightness, applyBacklight,
          displayFontState, displayScrollBuffer));
  if (!renderer) {
    nextPage.reset();
    showWithoutTransition();
    return;
  }
  pageTransitionActive = true;
  renderer->render(*activeScene, *nextPage, transition, pixelShiftX,
                  pixelShiftY, displayRefresh.intervalMs());
  displayRefresh.completed(millis());
  strlcpy(lastTransitionType, renderer->lastTypeName(),
          sizeof(lastTransitionType));
  lastTransitionDurationMs = renderer->lastDurationMs();
  renderer.reset();
  pageTransitionActive = false;
  activeScene.swap(nextPage);
  activePageIndex = nextPageIndex;
  activeScenePage = nextPageIndex;
  activeSceneReady = true;
  for (uint8_t index = 0; index < marqueeTitleCount; ++index) {
    marqueeTitles[index].nextActionAt = millis() + kMarqueeStartPauseMs;
  }
  pendingChangedValues |= transitionDeferredValues;
  transitionDeferredValues = 0;
  pageShownAt = millis();
}

struct DashboardLoadFailure {
  const __FlashStringHelper *message = nullptr;
  bool retryable = false;
};

bool loadDashboardMetadata(Stream &stream, DashboardLoadFailure *failure = nullptr) {
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::DashboardValidation);
  if (failure) failure->message = F("Invalid dashboard structure");
  const auto reject = [&](const __FlashStringHelper *message, bool retryable = false) {
    if (failure) { failure->message = message; failure->retryable = retryable; }
    return false;
  };
  StaticJsonDocument<768> filter;
  filter["version"] = true;
  filter["pages"][0]["id"] = true;
  filter["pages"][0]["durationSeconds"] = true;
  filter["pages"][0]["transition"] = true;
  filter["pages"][0]["backgroundImage"] = true;
  filter["pages"][0]["layout"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["type"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["source"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["showSeconds"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["image"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["backgroundImage"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["imageFit"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["frame"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["titleFrame"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["valueFrame"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["graph"] = true;
  filter["pages"][0]["rows"][0]["cards"][0]["weather"] = true;
  filter["defaults"]["pageDurationSeconds"] = true;
  filter["transition"] = true;

  DynamicJsonDocument document(6144);
  recordFreeHeap();
  const auto error = deserializeJson(
      document, stream, DeserializationOption::Filter(filter));
  if (error) {
    if (error == DeserializationError::NoMemory) {
      return document.capacity() == 0
          ? reject(F("Not enough free memory to validate dashboard; retry shortly"), true)
          : reject(F("Dashboard metadata exceeds device memory limit"));
    }
    return reject(F("Malformed dashboard JSON"));
  }
  if (document["version"].as<int>() != 1 ||
      !document["pages"].is<JsonArray>()) {
    return false;
  }

  const uint32_t defaultSeconds =
      document["defaults"]["pageDurationSeconds"] | 10;
  JsonArray pages = document["pages"].as<JsonArray>();
  if (pages.size() == 0 || pages.size() > kMaxPages) return false;
  if (!graphHistory.validate(pages)) return reject(F("Invalid graph settings"));

  PageTransitionConfig legacyTransition;
  if (!PageTransitionRenderer::parse(document["transition"], legacyTransition)) {
    return false;
  }
  uint8_t count = 0;
  for (JsonObject page : pages) {
    if (failure) failure->message = F("Invalid page id, duration, layout, transition or background image");
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
    const char *layout = page["layout"] | "rows";
    if (strcmp(layout, "free") && strcmp(layout, "rows")) return false;
    const bool freeLayout = strcmp(layout, "free") == 0;
    uint8_t cardCount = 0;
    uint16_t textBudget = 1 + rows.size();
    bool hasWeather = false;
    const char *pageImage = page["backgroundImage"] | "";
    if (pageImage[0] &&
        (!validImageAssetId(String(pageImage)) ||
         !LittleFS.exists(imageAssetPath(String(pageImage))))) return false;
    if (rows.size() == 0 || rows.size() > 6) return false;
    for (JsonObject row : rows) {
      JsonArray cards = row["cards"].as<JsonArray>();
      if ((!freeLayout && cards.size() == 0) || cards.size() > (freeLayout ? kMaxSceneCards : 3)) return false;
      cardCount += cards.size();
      if (cardCount > kMaxSceneCards) return false;
      for (JsonObject card : cards) {
        if (failure) failure->message = F("Invalid card settings, placement, count or image");
        if (freeLayout) {
          for (const char *name : {"frame", "titleFrame", "valueFrame"}) {
            if (strcmp(name, "frame") && !card.containsKey(name)) continue;
            if (!validFreeTextFrame(card[name])) return false;
          }
        }
        const char *type = card["type"];
        if (type == nullptr ||
            (strcmp(type, "clock") != 0 && strcmp(type, "number") != 0 &&
             strcmp(type, "status") != 0 && strcmp(type, "text") != 0 &&
             strcmp(type, "image") != 0 && strcmp(type, "chart") != 0 && strcmp(type, "weather") != 0)) {
          return false;
        }
        const bool needsSource = strcmp(type, "number") == 0 ||
                                 strcmp(type, "status") == 0;
        if (needsSource && card["source"].isNull()) return false;
        if (strcmp(type, "weather") == 0) {
          hasWeather = true;
          JsonArray weatherSources = card["weather"]["sources"];
          if (weatherSources.isNull() || weatherSources.size() < 1 || weatherSources.size() > 5) return false;
          for (JsonVariant weatherSource : weatherSources)
            if (!weatherSource.is<const char *>() || strlen(weatherSource.as<const char *>()) > 64) return false;
          JsonArray fields = card["weather"]["fields"];
          if (!card["weather"]["fields"].isNull() && fields.isNull()) return false;
          if (!fields.isNull() && (fields.size() == 0 || fields.size() > 8)) return false;
          for (JsonVariant field : fields) {
            if (!field.is<const char *>()) return false;
            const char *name = field.as<const char *>();
            if (strcmp(name, "icon") && strcmp(name, "condition") &&
                strcmp(name, "temperature") && strcmp(name, "low") &&
                strcmp(name, "label") && strcmp(name, "humidity") &&
                strcmp(name, "precipitation") && strcmp(name, "wind")) return false;
          }
          textBudget += 1 + weatherSources.size() * (fields.isNull() ? 3 : fields.size());
        } else {
          textBudget += 2;
        }
        if (strcmp(type, "image") == 0 && card["image"].isNull()) return false;
        const char *image = strcmp(type, "image") == 0
                                ? card["image"] | ""
                                : strcmp(card["backgroundMode"] | "", "image") == 0 ||
                                          card["backgroundMode"].isNull()
                                      ? card["backgroundImage"] | ""
                                      : "";
        if (image[0] &&
            (!validImageAssetId(String(image)) ||
             !LittleFS.exists(imageAssetPath(String(image))))) return false;
        const char *fit = card["imageFit"] | "cover";
        if (strcmp(fit, "cover") != 0 && strcmp(fit, "contain") != 0 &&
            strcmp(fit, "stretch") != 0) return false;
      }
    }
    if (hasWeather && textBudget > kMaxSceneTexts) return reject(F("Too many weather details on one page"));
    ++count;
  }

  if (!graphHistory.configure(pages)) {
    return reject(F("Not enough free memory for graph history"), true);
  }
  // GraphPaintConfig retains pointers into GraphHistory. A successful
  // reconfiguration replaces that storage, so no compiled scene may be
  // painted again until it has resolved the new series addresses.
  activeSceneReady = false;
  activeScenePage = 0xff;
  pendingPageIndex = -1;
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
  capabilities.add("user-fonts");
  capabilities.add("image-assets");
  if (ScreenCapture::supported()) capabilities.add("screenshot-bmp");
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  capabilities.add("https");
#endif
  String body;
  body.reserve(384);
  serializeJson(document, body);
  server.send(200, "application/json", body);
}

void sendApiCrash() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<512> document;
  writeCrashDiagnostics(document.to<JsonObject>());
  String body;
  serializeJson(document, body);
  server.send(200, "application/json", body);
}

#if MINI_DISPLAY_RUNTIME_PROFILE
void sendApiPerformance() {
  if (!apiAuthenticated()) return;
  runtimeProfiler.sampleMemory();
  const uint32_t cpuMHz = ESP.getCpuFreqMHz();
  char chunk[256];
  server.sendHeader("Cache-Control", "no-store");
  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  const int headerLength = snprintf(
      chunk, sizeof(chunk),
      "{\"cpuMHz\":%u,\"freeHeapBytes\":%lu,\"maximumFreeBlockBytes\":%lu,"
      "\"heapFragmentationPercent\":%u,\"minimumFreeHeapBytes\":%lu,"
      "\"minimumMaximumBlockBytes\":%lu,\"minimumFreeStackBytes\":%lu,"
      "\"metrics\":[",
      cpuMHz, static_cast<unsigned long>(ESP.getFreeHeap()),
      static_cast<unsigned long>(ESP.getMaxFreeBlockSize()),
      ESP.getHeapFragmentation(),
      static_cast<unsigned long>(runtimeProfiler.minimumFreeHeap()),
      static_cast<unsigned long>(runtimeProfiler.minimumLargestBlock()),
      static_cast<unsigned long>(runtimeProfiler.minimumFreeStack()));
  server.send(200, "application/json", "");
  server.sendContent(chunk, headerLength);
  for (uint8_t index = 0;
       index < static_cast<uint8_t>(RuntimeProfilePoint::Count); ++index) {
    const auto point = static_cast<RuntimeProfilePoint>(index);
    const RuntimeProfileMetric &metric = runtimeProfiler.metric(point);
    const uint64_t averageCycles =
        metric.count ? metric.totalCycles / metric.count : 0;
    const int length = snprintf(
        chunk, sizeof(chunk),
        "%s{\"name\":\"%s\",\"count\":%lu,\"lastUs\":%lu,"
        "\"averageUs\":%llu,\"maximumUs\":%lu,",
        index ? "," : "", RuntimeProfiler::name(point),
        static_cast<unsigned long>(metric.count),
        static_cast<unsigned long>(metric.lastCycles / cpuMHz),
        static_cast<unsigned long long>(averageCycles / cpuMHz),
        static_cast<unsigned long>(metric.maximumCycles / cpuMHz));
    server.sendContent(chunk, length);
    const int memoryLength = snprintf(
        chunk, sizeof(chunk),
        "\"minimumFreeHeapBytes\":%lu,\"minimumMaximumBlockBytes\":%lu,"
        "\"minimumFreeStackBytes\":%lu,\"maximumFragmentationPercent\":%u}",
        static_cast<unsigned long>(metric.minimumFreeHeap == UINT32_MAX
                                       ? 0 : metric.minimumFreeHeap),
        static_cast<unsigned long>(metric.minimumLargestBlock == UINT32_MAX
                                       ? 0 : metric.minimumLargestBlock),
        static_cast<unsigned long>(metric.minimumFreeStack == UINT32_MAX
                                       ? 0 : metric.minimumFreeStack),
        metric.maximumFragmentation);
    server.sendContent(chunk, memoryLength);
  }
  server.sendContent("]}");
  server.sendContent("");
}

void resetApiPerformance() {
  if (!apiAuthenticated()) return;
  runtimeProfiler.reset();
  server.send(204);
}
#endif

void sendApiStatus() {
  if (!apiAuthenticated()) return;
  server.sendHeader("Cache-Control", "no-store");
  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.send(200, "application/json", "");
  auto &response = jsonStreamWriter;
  response.begin();
  response.field("connected", WiFi.status() == WL_CONNECTED);
  response.field("ip", WiFi.status() == WL_CONNECTED
                           ? WiFi.localIP().toString()
                           : WiFi.softAPIP().toString());
  response.field("displayOn", displayOn);
  response.field("brightness", displayBrightness);
  response.field("pixelShift", displayPixelShift);
  response.field("refreshRateHz", displayRefresh.rate());
  response.field("notificationPosition",
                 notificationPositionName(notificationPosition));
  response.field("notificationCount", notifications.count());
  response.field("notificationMaxVisible", notifications.maxVisible());
  response.field("notificationAuthEnabled", notificationAuthEnabled);
  response.beginArray("notificationPositions");
  for (uint8_t index = 0;
       index < notificationPositionCount(display.width(), display.height());
       ++index) {
    response.element(
        notificationPositionName(static_cast<NotificationPosition>(index)));
  }
  response.end();
  response.field("timezone", displayTimezone);
  time_t now = time(nullptr);
  if (now > 1000000000) {
    struct tm localTime;
    localtime_r(&now, &localTime);
    char timeBuffer[9];
    char dateBuffer[11];
    strftime(timeBuffer, sizeof(timeBuffer), "%H:%M:%S", &localTime);
    strftime(dateBuffer, sizeof(dateBuffer), "%Y-%m-%d", &localTime);
    response.field("localTime", timeBuffer);
    response.field("localDate", dateBuffer);
  } else {
    response.field("localTime", "--:--:--");
    response.field("localDate", "Not synchronized");
  }
  response.field("ntpServer", currentNtpServer());
  response.field("ntpFromDhcp", networkSettings.ntpFromDhcp);
  response.field("timeSynchronized", now > 1000000000);
  response.field("ssid", config.ssid);
  response.field("hostname", configuredHostname());
  response.field("staticIpEnabled", networkSettings.staticIpEnabled);
  response.field("gateway", WiFi.gatewayIP().toString());
  response.field("dns1", WiFi.dnsIP(0).toString());
  response.field("dns2", WiFi.dnsIP(1).toString());
  response.field("wifiChannel",
                 WiFi.status() == WL_CONNECTED ? WiFi.channel() : 0);
  response.field("bssid",
                 WiFi.status() == WL_CONNECTED ? WiFi.BSSIDstr() : "");
  response.field("mac", WiFi.macAddress());
  response.field("reconnectCount", reconnectCount);
  response.field("lastDisconnectReason", disconnectReason());
  response.field("wifiRetryLimit", config.wifiRetryLimit
                                       ? config.wifiRetryLimit
                                       : kDefaultWifiRetryLimit);
  response.field("recoverySsid", "SDPRO-Setup-" + deviceSuffix());
  response.field("recoveryPasswordSet",
                 networkSettings.recoveryPassword[0] != '\0');
  response.field("apiAuthEnabled", config.apiAuthEnabled != 0);
  response.field("apiPasswordSet", config.apiPassword[0] != '\0');
  response.field("directOtaEnabled", config.directOtaEnabled != 0);
  response.field("otaAuthEnabled", config.otaAuthEnabled != 0);
  response.field("otaPasswordSet", config.otaPassword[0] != '\0');
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  response.field("httpsEnabled", tlsCertificates.enabled());
  response.field("httpsAvailable", tlsCertificates.ready());
  response.field("httpsPort", 443);
  response.field("tlsCertificateSource",
                 tlsCertificates.ready() ? tlsCertificates.source() : "none");
  response.field("tlsCertificateAlgorithm",
                 tlsCertificates.ready() ? "ECDSA P-256" : "none");
  response.field("tlsCertificateFingerprint", tlsCertificates.fingerprint());
#else
  response.field("httpsEnabled", false);
  response.field("httpsAvailable", false);
#endif
  response.field("filesystemReady", filesystemReady);
  uint32_t storageTotalBytes = 0;
  uint32_t storageUsedBytes = 0;
#if defined(ESP8266)
  FSInfo filesystemInfo;
  if (filesystemReady && LittleFS.info(filesystemInfo)) {
    storageTotalBytes = filesystemInfo.totalBytes;
    storageUsedBytes = filesystemInfo.usedBytes;
  }
#else
  if (filesystemReady) {
    storageTotalBytes = LittleFS.totalBytes();
    storageUsedBytes = LittleFS.usedBytes();
  }
#endif
  response.field("storageTotalBytes", storageTotalBytes);
  response.field("storageUsedBytes", storageUsedBytes);
  response.field("storageFreeBytes",
                 storageTotalBytes > storageUsedBytes
                     ? storageTotalBytes - storageUsedBytes
                     : 0);
  response.field("defaultFont", userFonts.activeSlot() < 0
                                    ? "builtin"
                                    : userFonts.activeSlot() == 0 ? "font1"
                                                                  : "font2");
  response.beginArray("fonts");
  for (uint8_t index = 0; index < kUserFontSlots; ++index) {
    const UserFontSlotInfo &info = userFonts.slot(index);
    response.beginObject();
    response.field("id", index == 0 ? "font1" : "font2");
    response.field("installed", info.installed);
    response.field("name", info.name);
    response.end();
  }
  response.end();
  response.field("mdnsReady", mdnsReady);
  response.field("setupMode", accessPointRunning);
  response.field("dashboardPageCount", dashboardPageCount);
  response.field("trackedValueCount", dashboardValueCount);
  response.field("graphHistoryBytes", graphHistory.bytes());
  response.field("graphStorageError", graphHistory.storageError());
  response.field("renderError", renderFailureName());
  response.field("sceneCompileError", sceneCompileFailureName());
  response.field("sceneBytes", activeScene ? activeScene->allocatedBytes() : 0);
  response.field("pageDefinitionBytes", pageDefinition.allocatedBytes());
  response.field("pageDefinitionParses", pageDefinition.parseCount());
  response.field("sceneNodes", activeSceneReady && activeScene
                                   ? activeScene->graph.size()
                                   : 0);
  response.field("lastTransition", lastTransitionType);
  response.field("lastTransitionDurationMs", lastTransitionDurationMs);
  response.field("page", dashboardPageCount
                             ? dashboardPages[activePageIndex].id
                             : "");
  response.field("rotation", pageRotationAuto ? "auto" : "manual");
  response.field("bootId", bootId);
  response.field("uptimeSeconds", millis() / 1000UL);
  response.field("freeHeapBytes", ESP.getFreeHeap());
#if defined(ESP8266)
  response.field("totalHeapBytes", 81920);
  response.field("usedHeapBytes", 81920 - ESP.getFreeHeap());
  response.field("minimumFreeHeapBytes", minimumFreeHeapBytes);
  response.field("maximumFreeBlockBytes", ESP.getMaxFreeBlockSize());
  response.field("heapFragmentationPercent", ESP.getHeapFragmentation());
  response.field("resetReason", lastResetReason);
  response.field("resetInfo", ESP.getResetInfo());
#else
  response.field("totalHeapBytes", ESP.getHeapSize());
  response.field("usedHeapBytes", ESP.getHeapSize() - ESP.getFreeHeap());
#endif
  response.field("wifiRssiDbm",
                 WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -127);
  response.field("lastValueUpdateAgeSeconds",
                 hasValueUpdate
                     ? static_cast<int32_t>((millis() - lastValueUpdateAt) /
                                            1000UL)
                     : -1);
  response.field("firmwareVersion", kFirmwareVersion);
  response.beginArray("pages");
  for (uint8_t index = 0; index < dashboardPageCount; ++index) {
    response.element(dashboardPages[index].id);
  }
  response.end();
  response.finish();
  server.sendContent("");
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
  // Validation and dashboard replacement must not reuse the previous schema.
  // Evict even on rejection; the unchanged on-disk dashboard reloads lazily.
  pageDefinition.clear();
  if (!filesystemReady) {
    sendJsonError(503, F("filesystem_unavailable"), F("LittleFS unavailable"));
    return;
  }
  const String &body = server.arg("plain");
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
#if defined(ESP8266)
  server.releaseRequestBody();
  // Glyph tables are a disposable rendering cache, not framebuffer pixels.
  // Reload lazily on the next render, after request validation has finished.
  if (display.fontLoaded) display.unloadFont();
  displayFontState = FontRenderState{};
#endif
  File validation = LittleFS.open(kDashboardTempPath, "r");
  DashboardLoadFailure failure;
  const bool valid = validation && loadDashboardMetadata(validation, &failure);
  validation.close();
  if (!valid) {
    LittleFS.remove(kDashboardTempPath);
    sendJsonError(failure.retryable ? 503 : 422,
                  failure.retryable ? F("display_busy") : F("invalid_dashboard"),
                  failure.message ? failure.message : F("Could not read uploaded dashboard"));
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
    requestFullRender();
  }
  server.send(204);
}

void receiveApiData() {
  if (!apiAuthenticated()) return;
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::DataRequest);
  const String &body = server.arg("plain");
  if (body.isEmpty() || body.length() > kMaxDataBytes) {
    sendJsonError(413, F("data_too_large"), F("Data update exceeds limit"));
    return;
  }
  StaticJsonDocument<128> filter;
  filter["values"] = true;
  filter["series"] = true;
  filter["render"] = true;
  const size_t documentCapacity = min<size_t>(
      4096, max<size_t>(1024, body.length() + 1024));
  DynamicJsonDocument document(documentCapacity);
  recordFreeHeap();
  const auto error = deserializeJson(document, body,
      DeserializationOption::Filter(filter));
  MINI_DISPLAY_PROFILE_MEMORY(RuntimeProfilePoint::DataRequest);
  if (error || !document["values"].is<JsonObject>()) {
    sendJsonError(422, F("invalid_data"), F("Expected values object"));
    return;
  }
  JsonObject values = document["values"].as<JsonObject>();
  uint32_t changedValueMask = 0;
  if (document.containsKey("series")) {
    if (pageTransitionActive) {
      sendJsonError(503, F("display_busy"), F("Retry history update after transition"));
      return;
    }
    if (!document["series"].is<JsonObjectConst>() ||
        !graphHistory.receiveSnapshot(document["series"])) {
      sendJsonError(422, F("invalid_history"), F("Invalid or unconfigured history series"));
      return;
    }
    changedValueMask = UINT32_MAX;
  }
  for (JsonPair pair : values) {
    DashboardValue *slot = findValue(pair.key().c_str(), true);
    if (slot == nullptr) continue;
    JsonObject value = pair.value().as<JsonObject>();
    const char *state = value["state"] | "unknown";
    const bool available = value["available"] | false;
    if (slot->available == available && strcmp(slot->state, state) == 0) {
      continue;
    }
    strlcpy(slot->state, state, sizeof(slot->state));
    slot->available = available;
    changedValueMask |= 1UL << (slot - dashboardValues);
  }
  if (document["render"] | true) {
    if (pageTransitionActive) {
      transitionDeferredValues |= changedValueMask;
    } else {
      pendingChangedValues |= changedValueMask;
    }
  }
  lastValueUpdateAt = millis();
  hasValueUpdate = true;
  if (diagnosticsCaptureAt != 0 &&
      millis() - diagnosticsCaptureAt <= kDiagnosticsCaptureTimeoutMs) {
    diagnosticsLastData = body;
  }
  server.send(204);
}

void sendApiLatestData() {
  if (!apiAuthenticated()) return;
  const uint32_t now = millis();
  if (diagnosticsCaptureAt == 0 ||
      now - diagnosticsCaptureAt > kDiagnosticsCaptureTimeoutMs) {
    diagnosticsLastData = String();
  }
  diagnosticsCaptureAt = now == 0 ? 1 : now;
  if (diagnosticsLastData.isEmpty()) {
    server.send(204);
    return;
  }
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", diagnosticsLastData);
}

void sendApiData() {
  if (!apiAuthenticated()) return;
  server.sendHeader("Cache-Control", "no-store");
  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.send(200, "application/json", "");
  writeDisplayData(httpChunkSink, dashboardValues, dashboardValueCount,
                   graphHistory);
  server.sendContent("");
}

void sendApiScreenshot() {
  if (!apiAuthenticated()) return;
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::Screenshot);
  if (!ScreenCapture::supported()) {
    sendJsonError(501, F("screenshot_unsupported"),
                  F("Display readback is not supported by this hardware"));
    return;
  }

  if (!activeSceneReady || !activeScene ||
      activeScenePage != activePageIndex) {
    sendJsonError(503, F("capture_unavailable"),
                  F("Current scene is not ready"));
    return;
  }
  // Capture's sprite/cache and RGB row must not share the small ESP8266 stack
  // with image rendering, LittleFS and TCP. Allocate only for this request.
  std::unique_ptr<ScreenCapture> capture(new (std::nothrow) ScreenCapture(display));
  if (!capture || !capture->begin()) {
    sendJsonError(503, F("capture_unavailable"),
                  F("Not enough memory to capture the display"));
    return;
  }

  // Page transitions run synchronously. The web server dispatches this
  // handler only after a transition finishes, then this handler freezes loop-
  // driven marquee and page animations until the complete frame is captured.
  server.sendHeader("Cache-Control", "no-store");
  server.sendHeader("Content-Disposition",
                    "inline; filename=\"mini-display.bmp\"");
  server.setContentLength(ScreenCapture::kBmpSize);
  server.send(200, "image/bmp", "");
  capture->streamBmp(*activeScene, pixelShiftX, pixelShiftY, server.client(), &notifications);
}

void receiveApiNotification() {
  if (!apiAccessAllowed(notificationAuthEnabled)) return;
  if (server.arg("plain").length() > 4096) {
    sendJsonError(413, F("notification_too_large"), F("Notification body exceeds 4096 bytes"));
    return;
  }
  if (!displayOn || !displayBrightness) {
    sendJsonError(409, F("display_off"), F("Turn on the display before sending notifications"));
    return;
  }
  if (notifications.count() == NotificationCenter::kCapacity) {
    server.sendHeader("Retry-After", String(notifications.current()->durationMs / 1000));
    sendJsonError(429, F("notification_queue_full"), F("Notification queue is full"));
    return;
  }
#if defined(ESP8266)
  // Leave room for the compositor and its drawing state.
  constexpr size_t spriteBytes =
      240 * kSceneUpdateBandHeight * sizeof(uint16_t);
  constexpr size_t reserve = sizeof(SceneUpdatePainter) + spriteBytes + 1024;
  if (ESP.getFreeHeap() < reserve + sizeof(DisplayNotification) + 1024 ||
      ESP.getMaxFreeBlockSize() < spriteBytes + 1024) {
    sendJsonError(503, F("notification_unavailable"), F("Not enough rendering memory"));
    return;
  }
#endif
  DynamicJsonDocument document(1024);
  const auto error = deserializeJson(document, server.arg("plain"));
  if (error) {
    sendJsonError(400, F("invalid_json"), F("Invalid or oversized notification JSON"));
    return;
  }
  std::unique_ptr<DisplayNotification> item(new (std::nothrow) DisplayNotification());
  if (!item) {
    sendJsonError(503, F("notification_unavailable"), F("Not enough memory for a notification"));
    return;
  }
  const char *invalid = parseNotificationRequest(document.as<JsonVariantConst>(), *item,
      notificationPosition, display.width(), display.height());
  if (invalid) {
    // All validation runs before the queue or display is modified.
    StaticJsonDocument<256> response;
    response["error"] = "invalid_notification";
    response["message"] = invalid;
    String body;
    serializeJson(response, body);
    server.send(422, "application/json", body);
    return;
  }
  prepareNotification(*item, display.width(), display.height());
  notifications.enqueue(std::move(item));
  server.send(202, "application/json", "{\"accepted\":true}");
}

void dismissApiNotifications() {
  if (!apiAccessAllowed(notificationAuthEnabled)) return;
  notifications.dismissAll();
  server.send(204);
}

void receiveApiDisplay() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<384> document;
  if (deserializeJson(document, server.arg("plain"))) {
    sendJsonError(400, F("invalid_json"), F("Expected JSON object"));
    return;
  }
  bool settingsChanged = false;
  if (document.containsKey("notificationMaxVisible") &&
      (!document["notificationMaxVisible"].is<int>() || document["notificationMaxVisible"].as<int>() < 1 ||
       document["notificationMaxVisible"].as<int>() > NotificationCenter::kCapacity)) {
    sendJsonError(422, F("invalid_notification_limit"), F("Visible notification limit must be 1-3"));
    return;
  }
  if (document.containsKey("notificationAuthEnabled") && !document["notificationAuthEnabled"].is<bool>()) {
    sendJsonError(422, F("invalid_notification_auth"), F("Notification protection must be true or false"));
    return;
  }
  NotificationPosition nextNotificationPosition = notificationPosition;
  if (document.containsKey("notificationPosition") && !parseNotificationPosition(
      document["notificationPosition"].as<const char *>(), nextNotificationPosition, display.width(), display.height())) {
    sendJsonError(422, F("invalid_notification_position"), F("Unsupported notification position"));
    return;
  }
  if (document.containsKey("refreshRateHz")) {
    const float rate = document["refreshRateHz"].as<float>();
    if (!document["refreshRateHz"].is<float>() || !DisplayRefresh::valid(rate)) {
      sendJsonError(422, F("invalid_refresh_rate"), F("Refresh rate must be 0.1-60 Hz"));
      return;
    }
    settingsChanged = displayRefresh.rate() != rate;
    displayRefresh.setRate(rate);
  }
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
    requestFullRender();
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
      requestFullRender();
    }
  }
  settingsChanged = settingsChanged || notificationPosition != nextNotificationPosition;
  notificationPosition = nextNotificationPosition;
  if (document.containsKey("notificationMaxVisible")) {
    const uint8_t value = document["notificationMaxVisible"].as<uint8_t>();
    settingsChanged = settingsChanged || notifications.maxVisible() != value;
    notifications.setMaxVisible(value);
  }
  if (document.containsKey("notificationAuthEnabled")) {
    const bool value = document["notificationAuthEnabled"].as<bool>();
    settingsChanged = settingsChanged || notificationAuthEnabled != value;
    notificationAuthEnabled = value;
  }
  if (settingsChanged) saveDisplaySettings();
  applyBacklight();
  server.send(204);
}

void sendApiFonts() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<640> document;
  document["active"] = userFonts.activeSlot();
  document["maxSlots"] = kUserFontSlots;
  document["maxGlyphs"] = kMaxUserFontGlyphs;
  document["maxPackBytes"] = kMaxUserFontPackBytes;
  JsonArray sizes = document.createNestedArray("sizes");
  sizes.add(18);
  sizes.add(24);
  sizes.add(36);
  sizes.add(48);
  JsonArray slots = document.createNestedArray("slots");
  for (uint8_t index = 0; index < kUserFontSlots; ++index) {
    const UserFontSlotInfo &info = userFonts.slot(index);
    JsonObject value = slots.createNestedObject();
    value["slot"] = index;
    value["installed"] = info.installed;
    value["name"] = info.name;
    value["glyphs"] = info.glyphCount;
    value["bytes"] = info.bytes;
  }
  String body;
  body.reserve(512);
  serializeJson(document, body);
  server.send(200, "application/json", body);
}

void receiveApiFontSelection() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<64> document;
  if (deserializeJson(document, server.arg("plain"))) {
    sendJsonError(400, F("invalid_json"), F("Expected JSON object"));
    return;
  }
  const int active = document["active"] | -2;
  if (!userFonts.setActiveSlot(active)) {
    sendJsonError(422, F("invalid_font"),
                  F("Select an installed font slot or built-in font"));
    return;
  }
  displayFontState = FontRenderState{};
  requestFullRender();
  server.send(204);
}

void receiveApiFontUpload(uint8_t slot, uint8_t size) {
  if (!apiAuthenticated()) return;
  HTTPUpload &upload = server.upload();
  if (upload.status == UPLOAD_FILE_START) {
    userFonts.beginUpload(slot, size);
  } else if (upload.status == UPLOAD_FILE_WRITE) {
    userFonts.writeUpload(upload.buf, upload.currentSize);
  } else if (upload.status == UPLOAD_FILE_END) {
    userFonts.finishUpload();
  } else if (upload.status == UPLOAD_FILE_ABORTED) {
    userFonts.abortUpload();
  }
  yield();
}

void finishApiFontUpload() {
  if (!apiAuthenticated()) return;
  if (!userFonts.uploadSucceeded()) {
    sendJsonError(422, F("invalid_font_file"),
                  F("Font file is invalid or too large"));
    return;
  }
  server.send(204);
}

void receiveApiFontCommit(uint8_t slot) {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<160> document;
  if (deserializeJson(document, server.arg("plain"))) {
    sendJsonError(400, F("invalid_json"), F("Expected JSON object"));
    return;
  }
  const char *name = document["name"] | "";
  const int glyphs = document["glyphs"] | 0;
  const uint32_t bytes = document["bytes"] | 0;
  if (!userFonts.finalize(slot, name, glyphs, bytes)) {
    sendJsonError(422, F("invalid_font_pack"),
                  F("Font pack is incomplete, invalid, or too large"));
    return;
  }
  server.send(204);
}

void receiveApiFontDelete(uint8_t slot) {
  if (!apiAuthenticated()) return;
  if (!userFonts.remove(slot)) {
    sendJsonError(500, F("storage_error"), F("Could not remove font"));
    return;
  }
  displayFontState = FontRenderState{};
  requestFullRender();
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
  if (mode) {
    if (strcmp(mode, "auto") != 0 && strcmp(mode, "manual") != 0) {
      sendJsonError(422, F("invalid_page_mode"), F("Expected auto or manual"));
      return;
    }
    pageRotationAuto = strcmp(mode, "auto") == 0;
    pageShownAt = millis();
    server.send(204);
    return;
  } else if (command && dashboardPageCount) {
    const uint8_t current = pendingPageIndex >= 0
                                ? pendingPageIndex : activePageIndex;
    if (strcmp(command, "next") == 0) {
      pendingPageIndex = (current + 1) % dashboardPageCount;
      server.send(204);
      return;
    } else if (strcmp(command, "previous") == 0) {
      pendingPageIndex =
          (current + dashboardPageCount - 1) % dashboardPageCount;
      server.send(204);
      return;
    } else if (strcmp(command, "reload") != 0) {
      sendJsonError(422, F("invalid_command"), F("Unknown page command"));
      return;
    }
    pendingPageIndex = -1;
  } else if (id && dashboardPageCount) {
    bool found = false;
    for (uint8_t index = 0; index < dashboardPageCount; ++index) {
      if (strcmp(id, dashboardPages[index].id) == 0) {
        pageRotationAuto = false;
        pendingPageIndex = index;
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
  requestFullRender();
  server.send(204);
}

void receiveApiRestart() {
  if (!apiAuthenticated()) return;
  server.send(204);
  delay(100);
  ESP.restart();
}

void receiveApiSetupMode() {
  if (!apiAuthenticated()) return;
  memset(config.ssid, 0, sizeof(config.ssid));
  memset(config.wifiPassword, 0, sizeof(config.wifiPassword));
  saveConfig();
  server.send(204);
  delay(250);
  WiFi.disconnect(true);
  startAccessPoint();
}

void receiveApiFactoryReset() {
  if (!apiAuthenticated()) return;
  if (filesystemReady && !LittleFS.format()) {
    sendJsonError(500, F("storage_error"), F("Could not erase settings"));
    return;
  }
  DeviceConfig erased{};
  EEPROM.put(0, erased);
  if (!EEPROM.commit()) {
    sendJsonError(500, F("storage_error"), F("Could not erase settings"));
    return;
  }
  server.send(204);
  delay(250);
#if defined(ESP8266)
  WiFi.disconnect(true);
#else
  WiFi.disconnect(true, true);
#endif
  ESP.restart();
}

void startAccessPoint() {
  if (accessPointRunning) return;
  if (configValid() && config.resetApiAuthOnRecovery) {
    memset(config.apiPassword, 0, sizeof(config.apiPassword));
    config.apiAuthEnabled = 0;
    saveConfig();
  }
  WiFi.mode(wifiConfigured() ? WIFI_AP_STA : WIFI_AP);
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
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  if (tlsCertificates.enabled() && !server.secureRequest() &&
      !accessPointRunning) {
    server.sendHeader("Location",
                      "https://" + WiFi.localIP().toString() + server.uri());
    server.send(308, "text/plain", "Use HTTPS");
    return;
  }
#endif
  if (!accessPointRunning && configValid() && !webAuthenticated()) return;
  server.sendHeader("Cache-Control", "no-store");
  server.sendHeader("Content-Encoding", "gzip");
  server.sendHeader("Vary", "Accept-Encoding");
  server.send_P(200, PSTR("text/html; charset=utf-8"),
                reinterpret_cast<PGM_P>(kWebAppGzip), kWebAppGzipSize);
}

void sendDashboardSchema() {
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  if (tlsCertificates.enabled() && !server.secureRequest() &&
      !accessPointRunning) {
    server.sendHeader("Location",
                      "https://" + WiFi.localIP().toString() + server.uri());
    server.send(308, "text/plain", "Use HTTPS");
    return;
  }
#endif
  server.sendHeader("Cache-Control", "public, max-age=3600");
  server.sendHeader("Content-Encoding", "gzip");
  server.send_P(200, PSTR("application/schema+json"),
                reinterpret_cast<PGM_P>(kDashboardSchemaGzip),
                kDashboardSchemaGzipSize);
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
  StaticJsonDocument<1280> document;
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
  StaticJsonDocument<1280> document;
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
  StaticJsonDocument<512> document;
  document["apiAuthEnabled"] = config.apiAuthEnabled != 0;
  document["otaAuthEnabled"] = config.otaAuthEnabled != 0;
  document["directOtaEnabled"] = config.directOtaEnabled != 0;
  document["username"] = configuredUsername();
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  document["httpsSupported"] = true;
  document["httpsEnabled"] = tlsCertificates.enabled();
  document["httpsAvailable"] = tlsCertificates.ready();
  document["httpsPort"] = 443;
  document["tlsCertificateSource"] =
      tlsCertificates.ready() ? tlsCertificates.source() : "none";
  document["tlsCertificateAlgorithm"] =
      tlsCertificates.ready() ? "ECDSA P-256" : "none";
  document["tlsCertificateFingerprint"] = tlsCertificates.fingerprint();
#else
  document["httpsSupported"] = false;
  document["httpsEnabled"] = false;
  document["httpsAvailable"] = false;
#endif
  String body;
  body.reserve(448);
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
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  const bool httpsEnabled =
      document["httpsEnabled"] | tlsCertificates.enabled();
  if (httpsEnabled && !tlsCertificates.ready()) {
    sendJsonError(422, F("certificate_required"),
                  F("Generate or upload a certificate first"));
    return;
  }
#endif
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
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  if (!tlsCertificates.setEnabled(httpsEnabled)) {
    sendJsonError(500, F("storage_error"),
                  F("Could not save HTTPS settings"));
    return;
  }
#endif
  server.send(204);
}

#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
bool tlsUploadSucceeded = false;

void receiveApiTlsUpload(bool certificate) {
  if (!apiAuthenticated()) return;
  HTTPUpload &upload = server.upload();
  if (upload.status == UPLOAD_FILE_START) {
    tlsUploadSucceeded = tlsCertificates.beginUpload(certificate);
  } else if (upload.status == UPLOAD_FILE_WRITE) {
    tlsUploadSucceeded =
        tlsUploadSucceeded && tlsCertificates.writeUpload(
                                  certificate, upload.buf, upload.currentSize);
  } else if (upload.status == UPLOAD_FILE_END) {
    tlsUploadSucceeded =
        tlsUploadSucceeded && tlsCertificates.finishUpload(certificate);
  } else if (upload.status == UPLOAD_FILE_ABORTED) {
    tlsCertificates.abortUpload(certificate);
    tlsUploadSucceeded = false;
  }
  yield();
}

void finishApiTlsUpload() {
  if (!apiAuthenticated()) return;
  if (!tlsUploadSucceeded) {
    sendJsonError(422, F("invalid_upload"), F("Certificate upload failed"));
    return;
  }
  server.send(204);
}

void installApiTlsUploads() {
  if (!apiAuthenticated()) return;
  if (!tlsCertificates.installUploads()) {
    sendJsonError(422, F("invalid_certificate"),
                  F("Certificate and private key do not match"));
    return;
  }
  server.send(204);
  delay(300);
  ESP.restart();
}

void generateApiTlsCertificate() {
  if (!apiAuthenticated()) return;
  if (!tlsCertificates.generate(configuredHostname(), WiFi.localIP())) {
    sendJsonError(500, F("certificate_generation_failed"),
                  F("Could not generate certificate"));
    return;
  }
  server.send(204);
  delay(300);
  ESP.restart();
}
#endif

void finishFirmwareUpdate() {
  const bool success = !Update.hasError();
  server.send(success ? 200 : 500, "text/plain",
              success ? "Update complete. Restarting..." : "Update failed");
  if (success) {
    delay(250);
    ESP.restart();
  } else {
    requestFullRender();
  }
}

void showFirmwareUpdateNotice() {
  std::unique_ptr<DisplayNotification> item(
      new (std::nothrow) DisplayNotification());
  if (!item) return;
  strlcpy(item->title, "Firmware update", sizeof(item->title));
  strlcpy(item->message, "Do not power off", sizeof(item->message));
  item->severity = NotificationSeverity::Warning;
  item->icon = NotificationIcon::Power;
  item->position = NotificationPosition::Top;

  NotificationCenter notice;
  notice.setMaxVisible(1);
  if (!notice.enqueue(std::move(item))) return;
  notice.advance(millis(), display.width(), display.height(), false,
                 prepareNotification);

  if (!displayOn || displayBrightness == 0) {
    displayOn = true;
    displayBrightness = max<uint8_t>(displayBrightness, 40);
    applyBacklight();
  }
#if defined(ESP8266)
  std::unique_ptr<SceneUpdatePainter> painter(
      new (std::nothrow) SceneUpdatePainter(display));
  if (!painter || !painter->begin()) return;
  for (int16_t y = 0; y < display.height(); y += kSceneUpdateBandHeight) {
    painter->band.fillSprite(TFT_BLACK);
    paintNotification(painter->band, notice, 0, -y);
    displayScrollBuffer.pushLogical(
        0, y, display.width(), kSceneUpdateBandHeight,
        static_cast<uint16_t *>(painter->band.getPointer()));
    yield();
  }
#else
  display.fillScreen(TFT_BLACK);
  paintNotification(display, notice, 0, 0);
#endif
}

void prepareFirmwareUpdate() {
  pageRotationAuto = false;
  pageTransitionActive = false;
  pendingPageIndex = -1;
  pendingChangedValues = 0;
  transitionDeferredValues = 0;
  resetMarqueeTitles();
  sceneScheduler.reset();
  activeScene.reset();
  activeSceneReady = false;
  activeScenePage = 0xff;
  pageDefinition.clear();
  graphHistory.reset();
  diagnosticsLastData = String();
#if defined(ESP8266)
  if (display.fontLoaded) display.unloadFont();
  displayFontState = FontRenderState{};
#endif
  showFirmwareUpdateNotice();
}

void receiveFirmwareUpdate() {
  HTTPUpload &upload = server.upload();
  if (upload.status == UPLOAD_FILE_START) {
    prepareFirmwareUpdate();
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
#if defined(ESP8266)
  server.prepareDashboardRequests([] {
    // HTTP parsing itself needs room for the incoming body before the handler
    // can stage it on flash. The LCD retains its pixels, so release all
    // reproducible scene state before ESP8266WebServer allocates the body.
    if (display.fontLoaded) display.unloadFont();
    displayFontState = FontRenderState{};
    resetMarqueeTitles();
    sceneScheduler.reset();
    activeScene.reset();
    activeSceneReady = false;
    activeScenePage = 0xff;
    pageDefinition.clear();
    diagnosticsLastData = String();
    requestFullRender();
  });
#endif
  if (routesReady) return;
  server.on("/", HTTP_GET, sendWebApp);
  server.on("/display", HTTP_GET, sendWebApp);
  server.on("/network", HTTP_GET, sendWebApp);
  server.on("/security", HTTP_GET, sendWebApp);
  server.on("/diagnostics", HTTP_GET, sendWebApp);
  server.on("/update", HTTP_GET, sendWebApp);
  server.on("/schema/dashboard.schema.json", HTTP_GET, sendDashboardSchema);
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
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  server.on("/api/v1/tls/certificate", HTTP_POST, finishApiTlsUpload,
            [] { receiveApiTlsUpload(true); });
  server.on("/api/v1/tls/private-key", HTTP_POST, finishApiTlsUpload,
            [] { receiveApiTlsUpload(false); });
  server.on("/api/v1/tls/install", HTTP_POST, installApiTlsUploads);
  server.on("/api/v1/tls/generate", HTTP_POST, generateApiTlsCertificate);
#endif
  server.on("/api/v1/dashboard", HTTP_GET, sendApiDashboard);
  server.on("/api/v1/dashboard", HTTP_PUT, receiveApiDashboard);
  imageAssetApi.begin();
  server.on("/api/v1/data", HTTP_PATCH, receiveApiData);
  server.on("/api/v1/data", HTTP_GET, sendApiData);
  server.on("/api/v1/data/latest", HTTP_GET, sendApiLatestData);
  server.on("/api/v1/screenshot", HTTP_GET, sendApiScreenshot);
  server.on("/api/v1/crash", HTTP_GET, sendApiCrash);
#if MINI_DISPLAY_RUNTIME_PROFILE
  server.on("/api/v1/debug/performance", HTTP_GET, sendApiPerformance);
  server.on("/api/v1/debug/performance", HTTP_DELETE,
            resetApiPerformance);
#endif
  server.on("/api/v1/display", HTTP_PUT, receiveApiDisplay);
  server.on("/api/v1/notifications", HTTP_POST, receiveApiNotification);
  server.on("/api/v1/notifications", HTTP_DELETE, dismissApiNotifications);
  server.on("/api/v1/fonts", HTTP_GET, sendApiFonts);
  server.on("/api/v1/fonts", HTTP_PUT, receiveApiFontSelection);
  server.on("/api/v1/fonts/0", HTTP_PUT,
            [] { receiveApiFontCommit(0); });
  server.on("/api/v1/fonts/0", HTTP_DELETE,
            [] { receiveApiFontDelete(0); });
  server.on("/api/v1/fonts/1", HTTP_PUT,
            [] { receiveApiFontCommit(1); });
  server.on("/api/v1/fonts/1", HTTP_DELETE,
            [] { receiveApiFontDelete(1); });
  server.on("/api/v1/fonts/0/0", HTTP_POST, finishApiFontUpload,
            [] { receiveApiFontUpload(0, 0); });
  server.on("/api/v1/fonts/0/1", HTTP_POST, finishApiFontUpload,
            [] { receiveApiFontUpload(0, 1); });
  server.on("/api/v1/fonts/0/2", HTTP_POST, finishApiFontUpload,
            [] { receiveApiFontUpload(0, 2); });
  server.on("/api/v1/fonts/0/3", HTTP_POST, finishApiFontUpload,
            [] { receiveApiFontUpload(0, 3); });
  server.on("/api/v1/fonts/1/0", HTTP_POST, finishApiFontUpload,
            [] { receiveApiFontUpload(1, 0); });
  server.on("/api/v1/fonts/1/1", HTTP_POST, finishApiFontUpload,
            [] { receiveApiFontUpload(1, 1); });
  server.on("/api/v1/fonts/1/2", HTTP_POST, finishApiFontUpload,
            [] { receiveApiFontUpload(1, 2); });
  server.on("/api/v1/fonts/1/3", HTTP_POST, finishApiFontUpload,
            [] { receiveApiFontUpload(1, 3); });
  server.on("/api/v1/page", HTTP_POST, receiveApiPage);
  server.on("/api/v1/restart", HTTP_POST, receiveApiRestart);
  server.on("/api/v1/setup-mode", HTTP_POST, receiveApiSetupMode);
  server.on("/api/v1/factory-reset", HTTP_POST, receiveApiFactoryReset);
  server.onNotFound([] { server.send(404, "text/plain", "Not found"); });
  server.begin();
  routesReady = true;
}

void connectToWiFi() {
  if (!wifiConfigured()) {
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

void drawCenteredBold(const String &text, int16_t y, uint8_t font,
                      uint16_t color) {
  const uint8_t size = font >= 4 ? 1 : 0;
  applyDisplayFont(
      RenderFont{builtInFontFor("sans-bold", size), -1, size});
  display.setTextColor(color);
  display.drawString(text, 120, y);
}

void showStartupScreen() {
  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, TFT_BACKLIGHT_ON);
  display.init();
  display.setRotation(0);
#if defined(ESP8266)
  display.setTextWrap(false, false);
#endif

  const uint16_t background = display.color565(9, 14, 23);
  const uint16_t panel = display.color565(25, 34, 47);
  const uint16_t muted = display.color565(150, 164, 181);
  const uint16_t accent = display.color565(3, 169, 244);
  display.fillScreen(background);
  display.fillRoundRect(12, 12, 216, 216, 12, panel);
  display.fillRoundRect(12, 12, 216, 6, 3, accent);
  display.setTextDatum(MC_DATUM);
  display.setTextColor(accent, panel);
  display.drawCircle(120, 76, 28, accent);
  display.drawLine(104, 76, 116, 88, accent);
  display.drawLine(116, 88, 139, 63, accent);
  drawCenteredBold("MINI-DISPLAY", 130, 4, TFT_WHITE);
  drawCenteredBold("HOME ASSISTANT", 160, 2, muted);
  drawCenteredBold("Starting...", 198, 2, muted);
}

void showWifiConnectingScreen() {
  if (!wifiConfigured() || WiFi.status() == WL_CONNECTED) return;
  setupScreenUpdatedAt = millis();

  const uint16_t background = display.color565(9, 14, 23);
  const uint16_t panel = display.color565(25, 34, 47);
  const uint16_t muted = display.color565(150, 164, 181);
  const uint16_t accent = display.color565(3, 169, 244);
  const uint16_t warning = display.color565(245, 180, 0);
  const uint8_t retryLimit = config.wifiRetryLimit
                                 ? config.wifiRetryLimit
                                 : kDefaultWifiRetryLimit;
  const uint32_t elapsed = millis() - connectStartedAt;
  const uint32_t remainingSeconds =
      elapsed >= kConnectTimeoutMs
          ? 0
          : (kConnectTimeoutMs - elapsed + 999) / 1000;
  const uint16_t progressWidth =
      min<uint32_t>(180, elapsed * 180 / kConnectTimeoutMs);

  if (!connectionScreenVisible) {
    display.fillScreen(background);
    display.fillRoundRect(12, 12, 216, 216, 12, panel);
    display.fillRoundRect(12, 12, 216, 6, 3, accent);
    display.setTextDatum(MC_DATUM);
    drawCenteredBold("CONNECTING", 38, 4, TFT_WHITE);
    drawCenteredBold("WI-FI NETWORK", 69, 2, muted);
    drawCenteredBold(config.ssid, 90, 2, TFT_WHITE);
    connectionScreenVisible = true;
  }

  display.fillRect(25, 106, 190, 27, panel);
  drawCenteredBold("ATTEMPT " + String(wifiAttemptCount) + " OF " +
                       String(retryLimit),
                   119, 2, warning);
  display.fillRect(28, 138, 184, 16, panel);
  display.drawRoundRect(29, 139, 182, 14, 5, muted);
  if (progressWidth > 0) {
    display.fillRoundRect(30, 140, progressWidth, 12, 4, accent);
  }
  display.fillRect(25, 160, 190, 29, panel);
  drawCenteredBold("Waiting up to " + String(remainingSeconds) + " s", 174,
                   2, muted);

  const wl_status_t status = WiFi.status();
  display.fillRect(25, 190, 190, 25, panel);
  if (status == WL_NO_SSID_AVAIL) {
    drawCenteredBold("Network not found", 202, 2, muted);
  } else if (status == WL_CONNECT_FAILED) {
    drawCenteredBold("Check Wi-Fi password", 202, 2, TFT_RED);
  } else {
    drawCenteredBold("Please wait...", 202, 2, muted);
  }

  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, TFT_BACKLIGHT_ON);
}

void updateWifiConnectedCountdown(uint8_t secondsRemaining) {
  const uint16_t panel = display.color565(25, 34, 47);
  display.fillRect(85, 192, 70, 32, panel);
  drawCenteredBold(String(secondsRemaining), 207, 4, TFT_WHITE);
  startupCountdownShown = secondsRemaining;
  startupScreenUpdatedAt = millis();
}

void showWifiConnectedScreen(uint8_t secondsRemaining) {

  const uint16_t background = display.color565(9, 14, 23);
  const uint16_t panel = display.color565(25, 34, 47);
  const uint16_t muted = display.color565(150, 164, 181);
  const uint16_t success = display.color565(46, 204, 113);
  display.fillScreen(background);
  display.fillRoundRect(12, 12, 216, 216, 12, panel);
  display.fillRoundRect(12, 12, 216, 6, 3, success);

  display.drawCircle(120, 56, 24, success);
  display.drawLine(108, 56, 117, 65, success);
  display.drawLine(117, 65, 133, 47, success);
  display.setTextDatum(MC_DATUM);
  drawCenteredBold("CONNECTED", 94, 4, success);
  drawCenteredBold(config.ssid, 122, 2, muted);
  drawCenteredBold("IP  " + WiFi.localIP().toString(), 148, 2, TFT_WHITE);
  drawCenteredBold("Opening dashboard in", 181, 2, muted);
  updateWifiConnectedCountdown(secondsRemaining);
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
  display.drawString("SETUP MODE", 120, 32, 4);
  const uint8_t retryLimit = config.wifiRetryLimit
                                 ? config.wifiRetryLimit
                                 : kDefaultWifiRetryLimit;
  const bool connectionFailed =
      wifiConfigured() && wifiAttemptCount >= retryLimit;
  if (connectionFailed) {
    display.setTextColor(TFT_RED, panel);
    display.drawString("WI-FI CONNECTION FAILED", 120, 52, 1);
  }
  display.setTextColor(muted, panel);
  display.drawString("CONNECT TO", 120, connectionFailed ? 69 : 60, 2);
  display.setTextColor(TFT_WHITE, panel);
  display.drawString("SDPRO-Setup-" + deviceSuffix(), 120,
                     connectionFailed ? 87 : 78, 2);

  display.setTextColor(muted, panel);
  display.drawString("OPEN IN BROWSER", 120,
                     connectionFailed ? 107 : 100, 2);
  display.setTextColor(accent, panel);
  display.drawString("http://" + WiFi.softAPIP().toString(), 120,
                     connectionFailed ? 125 : 118, 2);

  if (networkSettings.recoveryPassword[0]) {
    display.setTextColor(muted, panel);
    display.drawString("PASSWORD", 120, connectionFailed ? 145 : 140, 2);
    display.setTextColor(TFT_WHITE, panel);
    const String password = networkSettings.recoveryPassword;
    const int16_t passwordY = connectionFailed ? 162 : 158;
    if (password.length() <= 24) {
      display.drawString(password, 120, passwordY, 2);
    } else if (password.length() <= 36) {
      display.drawString(password, 120, passwordY, 1);
    } else {
      const size_t split = (password.length() + 1) / 2;
      display.drawString(password.substring(0, split), 120, passwordY - 5, 1);
      display.drawString(password.substring(split), 120, passwordY + 7, 1);
    }
  }
  display.setTextColor(muted, panel);
  display.drawString("CONNECTED DEVICES", 120,
                     networkSettings.recoveryPassword[0] ? 188 : 151, 2);
  display.setTextColor(accent, panel);
  display.drawString(String(setupStationCount), 120,
                     networkSettings.recoveryPassword[0] ? 211 : 184, 4);

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
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  MDNS.addServiceTxt("mini-display", "tcp", "https",
                     tlsCertificates.enabled() ? "1" : "0");
#endif
  mdnsReady = true;
}

}  // namespace

void setup() {
  loadCrashDiagnostics();
  Serial.begin(115200);
  bootId = ESP.random();
  Serial.println();
  Serial.printf("Home Assistant Mini-Display firmware %s\n", kFirmwareVersion);
#if defined(ESP8266)
  const String resetReason = ESP.getResetReason();
  strlcpy(lastResetReason, resetReason.c_str(), sizeof(lastResetReason));
#endif
  loadConfig();
  filesystemReady = LittleFS.begin();
#if defined(ESP8266) && MINI_DISPLAY_FEATURE_TLS
  tlsCertificates.begin(filesystemReady);
  if (tlsCertificates.ready()) {
    server.configureTls(tlsCertificates.certificate(),
                        tlsCertificates.privateKey());
  }
#endif
  userFonts.begin(filesystemReady);
  loadDisplaySettings();
  loadNetworkSettings();
  configureTimeService();
  loadStoredDashboard();
  showStartupScreen();
  configureRoutes();
  connectToWiFi();
  if (accessPointRunning) {
    showSetupScreen();
  } else if (WiFi.status() != WL_CONNECTED) {
    showWifiConnectingScreen();
  }
  recordFreeHeap();
}

void loop() {
  MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::Loop);
  {
    MINI_DISPLAY_PROFILE_SCOPE(RuntimeProfilePoint::Http);
    server.handleClient();
  }
  if (accessPointRunning) {
    if (wifiConfigured() && WiFi.status() == WL_CONNECTED) {
      WiFi.softAPdisconnect(true);
      accessPointRunning = false;
      wifiWasConnected = true;
      wifiAttemptCount = 0;
      startupSequenceActive = true;
      startupConnectedAt = 0;
    } else if (millis() - setupScreenUpdatedAt >= 1000 &&
               WiFi.softAPgetStationNum() != setupStationCount) {
      showSetupScreen();
    }
    recordFreeHeap();
    delay(2);
    return;
  }

  if (wifiConfigured() && WiFi.status() != WL_CONNECTED) {
    if (wifiWasConnected) {
      wifiWasConnected = false;
      lastDisconnectStatus = WiFi.status();
      ++reconnectCount;
      wifiAttemptCount = 1;
      connectStartedAt = millis();
      WiFi.reconnect();
      showWifiConnectingScreen();
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
        showWifiConnectingScreen();
      }
    } else if (millis() - setupScreenUpdatedAt >= 1000) {
      showWifiConnectingScreen();
    }
    recordFreeHeap();
    delay(2);
    return;
  }

  if (wifiConfigured()) {
    wifiWasConnected = true;
    wifiAttemptCount = 0;
  }
  if (startupSequenceActive) {
    if (startupConnectedAt == 0) {
      startupConnectedAt = millis();
      showWifiConnectedScreen(4);
    }
    const uint32_t connectedFor = millis() - startupConnectedAt;
    if (connectedFor < 4000) {
      const uint8_t secondsRemaining = 4 - connectedFor / 1000;
      if (secondsRemaining != startupCountdownShown) {
        updateWifiConnectedCountdown(secondsRemaining);
      }
      startMdns();
#if defined(ESP8266)
      if (mdnsReady) MDNS.update();
#endif
      recordFreeHeap();
      delay(2);
      return;
    }
    startupSequenceActive = false;
    connectionScreenVisible = false;
    showCurrentPage();
    applyBacklight();
  } else if (connectionScreenVisible) {
    connectionScreenVisible = false;
    showCurrentPage();
    applyBacklight();
  }

  // Rendering here releases the HTTP handler's stack and request buffers
  // first. Never compile a scene or run an animation inside a page request.
  updateNotifications();
  if (pendingPageIndex >= 0 && displayRefresh.ready(millis())) {
    const uint8_t nextPage = pendingPageIndex;
    pendingPageIndex = -1;
    showPageWithTransition(nextPage);
  }
  // Page navigation gets a chance before a continuous stream of sensor updates.
  if (!fullRenderPending && pageRotationAuto && dashboardPageCount > 1 && displayRefresh.ready(millis()) &&
      millis() - pageShownAt >= dashboardPages[activePageIndex].durationMs) {
    showPageWithTransition((activePageIndex + 1) % dashboardPageCount);
  }
  if (fullRenderPending && displayRefresh.ready(millis()) &&
      static_cast<int32_t>(millis() - fullRenderNotBefore) >= 0) {
    fullRenderPending = false;
    pendingChangedValues = 0;
    showCurrentPage();
  } else if (!fullRenderPending && pendingChangedValues != 0 && displayRefresh.ready(millis())) {
    const uint32_t changedValues = pendingChangedValues;
    pendingChangedValues = 0;
    if (!renderDashboardPage(&changedValues)) showCurrentPage();
  }
  startMdns();
#if defined(ESP8266)
  if (mdnsReady) MDNS.update();
#endif
  if (dashboardPageCount && dashboardPages[activePageIndex].hasClock) {
    const time_t now = time(nullptr);
    if (now > 1000000000) {
      const time_t tick = dashboardPages[activePageIndex].clockShowsSeconds
                              ? now
                              : now / 60;
      if (tick != lastClockTick && displayRefresh.ready(millis())) {
        lastClockTick = tick;
        renderDashboardPage(nullptr, false);
      }
    }
  }
  updateMarqueeTitles();
  if (activeSceneReady && activeScene && sceneScheduler.pending() && displayRefresh.ready(millis()))
    if (!renderPendingScene(*activeScene)) requestFullRender();
  if (displayPixelShift > 0 && displayRefresh.ready(millis()) &&
      millis() - pixelShiftAt >= kPixelShiftIntervalMs) {
    updatePixelShift();
    pixelShiftAt = millis();
    showCurrentPage();
  }
  if (diagnosticsCaptureAt != 0 &&
      millis() - diagnosticsCaptureAt > kDiagnosticsCaptureTimeoutMs) {
    diagnosticsCaptureAt = 0;
    diagnosticsLastData = String();
  }
  recordFreeHeap();
#if MINI_DISPLAY_RUNTIME_PROFILE
  static uint16_t memorySampleDivider = 0;
  if ((++memorySampleDivider & 0x07ff) == 0) runtimeProfiler.sampleMemory();
#endif
  delay(2);
}
