#include <Arduino.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#if defined(ESP8266)
#include <ESP8266mDNS.h>
#include <ESP8266WebServer.h>
#include <ESP8266WiFi.h>
#include <Updater.h>
#else
#include <ESPmDNS.h>
#include <WebServer.h>
#include <WiFi.h>
#include <Update.h>
#endif
#include <LittleFS.h>
#include <WiFiUdp.h>
#include "DisplayCompat.h"
#include "PageTransitionRenderer.h"

namespace {

constexpr uint32_t kConfigMagic = 0x53445031;
constexpr size_t kEepromSize = 512;
constexpr uint32_t kConnectTimeoutMs = 20000;
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
constexpr size_t kMaxDashboardBytes = 12 * 1024;
constexpr size_t kMaxDataBytes = 8 * 1024;
constexpr uint8_t kMaxPages = 16;
constexpr uint8_t kMaxValues = 32;
constexpr uint8_t kMaxPixelShift = 10;
constexpr uint32_t kPixelShiftIntervalMs = 60000;
constexpr uint8_t kExtendLeft = 1U << 0;
constexpr uint8_t kExtendRight = 1U << 1;
constexpr uint8_t kExtendTop = 1U << 2;
constexpr uint8_t kExtendBottom = 1U << 3;

struct DeviceConfig {
  uint32_t magic;
  char ssid[33];
  char wifiPassword[65];
  char otaPassword[33];
  uint32_t checksum;
};

DeviceConfig config{};
#if defined(ESP8266)
ESP8266WebServer server(80);
#else
WebServer server(80);
#endif
MiniDisplay display;
uint32_t connectStartedAt = 0;
bool accessPointRunning = false;
bool routesReady = false;
bool filesystemReady = false;
bool mdnsReady = false;
bool displayOn = true;
uint8_t displayBrightness = 100;
uint8_t displayPixelShift = 0;
int8_t pixelShiftX = 0;
int8_t pixelShiftY = 0;
uint32_t pixelShiftAt = 0;
bool pageRotationAuto = true;
uint8_t activePageIndex = 0;
uint32_t pageShownAt = 0;

struct DashboardPage {
  char id[33];
  uint32_t durationMs;
  PageTransitionConfig transition;
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
uint32_t minimumFreeHeapBytes = UINT32_MAX;
#if defined(ESP8266)
char lastResetReason[48]{};
#endif

bool renderDashboardPage();
bool renderDashboardPage(const uint32_t *changedValues,
                         bool clear = true);
void showPageWithTransition(uint8_t nextPageIndex);

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
  StaticJsonDocument<96> document;
  const auto error = deserializeJson(document, file);
  file.close();
  if (error) return;
  const int brightness = document["brightness"] | 100;
  const int pixelShift = document["pixelShift"] | 0;
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
  StaticJsonDocument<96> document;
  document["brightness"] = displayBrightness;
  document["pixelShift"] = displayPixelShift;
  if (serializeJson(document, file) == 0) {
    file.close();
    LittleFS.remove(kDisplaySettingsTempPath);
    return;
  }
  file.close();
  LittleFS.remove(kDisplaySettingsPath);
  LittleFS.rename(kDisplaySettingsTempPath, kDisplaySettingsPath);
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

bool configValid() {
  return config.magic == kConfigMagic && config.checksum == checksum(config) &&
         config.ssid[0] != '\0' && strlen(config.otaPassword) >= 8;
}

void loadConfig() {
  EEPROM.begin(kEepromSize);
  EEPROM.get(0, config);
  if (!configValid()) memset(&config, 0, sizeof(config));
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

String htmlEscape(const String &input) {
  String output;
  output.reserve(input.length() + 16);
  for (const char character : input) {
    switch (character) {
      case '&': output += F("&amp;"); break;
      case '<': output += F("&lt;"); break;
      case '>': output += F("&gt;"); break;
      case '"': output += F("&quot;"); break;
      default: output += character; break;
    }
  }
  return output;
}

bool otaAuthenticated() {
  if (!configValid()) {
    server.send(403, "text/plain", "Configure device first");
    return false;
  }
  if (server.authenticate("admin", config.otaPassword)) return true;
  server.requestAuthentication();
  return false;
}

bool apiAuthenticated() {
  if (!configValid()) {
    server.send(403, "application/json", "{\"error\":\"not_configured\"}");
    return false;
  }
  char expected[sizeof(config.otaPassword) + 8];
  snprintf(expected, sizeof(expected), "Bearer %s", config.otaPassword);
  if (server.header("Authorization") == expected) return true;
  server.sendHeader("WWW-Authenticate", "Bearer");
  server.send(401, "application/json", "{\"error\":\"invalid_auth\"}");
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
                       uint16_t foreground, uint16_t background) {
  const char *horizontal = style["horizontalAlign"] | "center";
  const char *vertical = style["verticalAlign"] | "middle";
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
  selectBestFont(text, style, width, height);
  String clipped = text;
  while (clipped.length() > 1 && display.textWidth(clipped) > width - 8) {
    clipped.remove(clipped.length() - 1);
  }
  const int16_t textX = left ? x + 4 : right ? x + width - 4 : x + width / 2;
  const int16_t textY = top ? y + 3 : bottom ? y + height - 3 : y + height / 2;
  display.drawString(clipped, textX, textY);
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
              int16_t height, uint8_t edgeExtensions = 0) {
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
  fillCardEdgeBackground(x, y, width, height, background, edgeExtensions);
  display.fillRoundRect(x, y, width, height, 5, background);

  const char *title = card["title"];
  int16_t contentY = y;
  int16_t contentHeight = height;
  if (title && title[0] && height >= 28) {
    display.setTextDatum(TL_DATUM);
    display.setTextColor(TFT_LIGHTGREY, background);
    String clipped(title);
    JsonVariantConst titleStyle = card["titleStyle"];
    if (titleStyle.isNull()) titleStyle = card["style"];
    selectBestFont(clipped, titleStyle, width, 18);
    while (clipped.length() > 1 && display.textWidth(clipped) > width - 8) {
      clipped.remove(clipped.length() - 1);
    }
    display.drawString(clipped, x + 4, y + 2);
    contentY += 21;
    contentHeight -= 21;
  }

  const char *progressType = card["progress"] | "none";
  const bool progress = strcmp(progressType, "none") != 0;
  if (progress && contentHeight >= 20) contentHeight -= 9;
  JsonVariantConst valueStyle = card["valueStyle"];
  if (valueStyle.isNull()) valueStyle = card["style"];
  drawPositionedFit(cardValue(card), valueStyle, x, contentY, width,
                    contentHeight, foreground, background);

  if (progress) {
    const char *source = card["source"];
    DashboardValue *value = findValue(source, false);
    const float minimum = card["minimum"] | 0.0F;
    const float maximum = card["maximum"] | 100.0F;
    const float current = value ? atof(value->state) : minimum;
    const float ratio = maximum > minimum
                            ? constrain((current - minimum) / (maximum - minimum), 0.0F, 1.0F)
                            : 0.0F;
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
                         uint16_t background) {
  const char *horizontal = style["horizontalAlign"] | "center";
  const char *vertical = style["verticalAlign"] | "middle";
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
  const GFXfont *font = selectBestFont(value, style, width, height);
  while (value.length() > 1 && display.textWidth(value) > width - 8) {
    value.remove(value.length() - 1);
  }
  const int16_t textX = left ? x + 4 : right ? x + width - 4 : x + width / 2;
  const int16_t textY = top ? y + 3 : bottom ? y + height - 3 : y + height / 2;
  return cacheText(page, value, font, datum, textX, textY, foreground,
                   background);
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
  int16_t contentY = y;
  int16_t contentHeight = height;
  if (title && title[0] && height >= 28) {
    String clipped(title);
    JsonVariantConst titleStyle = card["titleStyle"];
    if (titleStyle.isNull()) titleStyle = card["style"];
    const GFXfont *font = selectBestFont(clipped, titleStyle, width, 18);
    while (clipped.length() > 1 && display.textWidth(clipped) > width - 8) {
      clipped.remove(clipped.length() - 1);
    }
    if (!cacheText(page, clipped, font, TL_DATUM, x + 4, y + 2,
                   TFT_LIGHTGREY, background)) {
      return false;
    }
    contentY += 21;
    contentHeight -= 21;
  }

  const char *progressType = card["progress"] | "none";
  const bool hasProgress = strcmp(progressType, "none") != 0;
  if (hasProgress && contentHeight >= 20) contentHeight -= 9;
  JsonVariantConst valueStyle = card["valueStyle"];
  if (valueStyle.isNull()) valueStyle = card["style"];
  if (!cachePositionedText(page, cardValue(card), valueStyle, x, contentY,
                           width, contentHeight, foreground, background)) {
    return false;
  }

  if (hasProgress) {
    const float minimum = card["minimum"] | 0.0F;
    const float maximum = card["maximum"] | 100.0F;
    const float current = sourceValue ? atof(sourceValue->state) : minimum;
    const float ratio = maximum > minimum
                            ? constrain((current - minimum) /
                                            (maximum - minimum),
                                        0.0F, 1.0F)
                            : 0.0F;
    CachedProgress &progress = page.progress[page.progressCount++];
    progress.x = x + 5;
    progress.y = y + height - 8;
    progress.width = width - 10;
    progress.fillWidth = static_cast<int16_t>(progress.width * ratio);
    progress.background = TFT_DARKGREY;
    progress.foreground = parseColor(card["style"]["accent"], TFT_CYAN);
  }
  return true;
}

bool cacheDashboardPage(JsonObjectConst source, CachedPage &page) {
  memset(&page, 0, sizeof(page));
  page.background = parseColor(source["style"]["background"], TFT_BLACK);
  JsonArrayConst rows = source["rows"].as<JsonArrayConst>();
  int16_t top = 1;
  const char *pageTitle = source["title"];
  const bool showPageTitle = source["showTitle"] | true;
  if (showPageTitle && pageTitle && pageTitle[0]) {
    if (!cacheText(page, String(pageTitle), &FreeSansBold9pt7b, TC_DATUM, 120,
                   top, TFT_WHITE, page.background)) {
      return false;
    }
    top += 21;
  }

  uint16_t totalWeight = 0;
  for (JsonObjectConst row : rows) totalWeight += row["weight"] | 1;
  if (totalWeight == 0 || rows.size() == 0) return false;
  const int16_t gap = 4;
  const int16_t availableHeight = 236 - top - gap * (rows.size() - 1);
  int16_t rowY = top;
  uint16_t consumedWeight = 0;
  for (size_t rowIndex = 0; rowIndex < rows.size(); ++rowIndex) {
    JsonObjectConst row = rows[rowIndex];
    const uint16_t weight = row["weight"] | 1;
    consumedWeight += weight;
    const int16_t nextY = rowIndex + 1 == rows.size()
                              ? 236
                              : top + availableHeight * consumedWeight /
                                          totalWeight +
                                    gap * rowIndex;
    int16_t rowHeight = nextY - rowY;
    const char *rowTitle = row["title"];
    const bool showTitle = row["showTitle"] | true;
    if (showTitle && rowTitle && rowTitle[0] && rowHeight >= 24) {
      if (!cacheText(page, String(rowTitle), &FreeSans9pt7b, TL_DATUM, 4,
                     rowY, TFT_LIGHTGREY, page.background)) {
        return false;
      }
      rowY += 17;
      rowHeight -= 17;
    }
    JsonArrayConst cards = row["cards"].as<JsonArrayConst>();
    if (cards.size() == 0) return false;
    const int16_t cardWidth = (236 - gap * (cards.size() - 1)) / cards.size();
    int16_t cardX = 2;
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
  int16_t top = 1;
  const char *pageTitle = page["title"];
  const bool showPageTitle = page["showTitle"] | true;
  if (showPageTitle && pageTitle && pageTitle[0]) {
    if (!partial) {
      display.setTextDatum(TC_DATUM);
      display.setTextColor(TFT_WHITE, pageBackground);
      display.setFreeFont(&FreeSansBold9pt7b);
      display.drawString(pageTitle, 120 + offsetX, top + offsetY);
    }
    top += 21;
  }

  uint16_t totalWeight = 0;
  for (JsonObjectConst row : rows) totalWeight += row["weight"] | 1;
  const int16_t gap = 4;
  const int16_t availableHeight = 236 - top - gap * (rows.size() - 1);
  int16_t rowY = top;
  uint16_t consumedWeight = 0;
  for (size_t rowIndex = 0; rowIndex < rows.size(); ++rowIndex) {
    JsonObjectConst row = rows[rowIndex];
    const uint16_t weight = row["weight"] | 1;
    consumedWeight += weight;
    const int16_t nextY = rowIndex + 1 == rows.size()
                              ? 236
                              : top + availableHeight * consumedWeight / totalWeight +
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
        display.drawString(rowTitle, 4 + offsetX, rowY + offsetY);
      }
      rowY += 17;
      rowHeight -= 17;
    }
    JsonArrayConst cards = row["cards"].as<JsonArrayConst>();
    const int16_t cardWidth = (236 - gap * (cards.size() - 1)) / cards.size();
    int16_t cardX = 2 + offsetX;
    size_t cardIndex = 0;
    for (JsonObjectConst card : cards) {
      const char *source = card["source"];
      DashboardValue *sourceValue = findValue(source, false);
      const bool sourceChanged =
          partial && sourceValue != nullptr &&
          (*changedValues & (1UL << (sourceValue - dashboardValues))) != 0;
      if (!partial || sourceChanged) {
        uint8_t edgeExtensions = 0;
        if (cardIndex == 0) edgeExtensions |= kExtendLeft;
        if (cardIndex + 1 == cards.size()) edgeExtensions |= kExtendRight;
        if (rowIndex == 0 && top <= 1 && !rowTitleShown) {
          edgeExtensions |= kExtendTop;
        }
        if (rowIndex + 1 == rows.size()) edgeExtensions |= kExtendBottom;
        drawCard(card, cardX, rowY + offsetY, cardWidth, rowHeight,
                 edgeExtensions);
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
  StaticJsonDocument<1024> document;
  document["connected"] = WiFi.status() == WL_CONNECTED;
  document["displayOn"] = displayOn;
  document["brightness"] = displayBrightness;
  document["pixelShift"] = displayPixelShift;
  document["page"] = dashboardPageCount ? dashboardPages[activePageIndex].id : "";
  document["rotation"] = pageRotationAuto ? "auto" : "manual";
  document["uptimeSeconds"] = millis() / 1000UL;
  document["freeHeapBytes"] = ESP.getFreeHeap();
#if defined(ESP8266)
  document["minimumFreeHeapBytes"] = minimumFreeHeapBytes;
  document["maximumFreeBlockBytes"] = ESP.getMaxFreeBlockSize();
  document["heapFragmentationPercent"] = ESP.getHeapFragmentation();
  document["resetReason"] = lastResetReason;
#endif
  document["wifiRssiDbm"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -127;
  document["firmwareVersion"] = kFirmwareVersion;
  JsonArray pages = document.createNestedArray("pages");
  for (uint8_t index = 0; index < dashboardPageCount; ++index) {
    pages.add(dashboardPages[index].id);
  }
  String body;
  body.reserve(640);
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
  server.send(204);
}

void receiveApiDisplay() {
  if (!apiAuthenticated()) return;
  StaticJsonDocument<192> document;
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
  WiFi.mode(configValid() ? WIFI_AP_STA : WIFI_AP);
  const String ssid = "SDPRO-Setup-" + deviceSuffix();
  WiFi.softAP(ssid.c_str());
  accessPointRunning = true;
  Serial.printf("Setup AP: %s, http://%s/\n", ssid.c_str(),
                WiFi.softAPIP().toString().c_str());
}

void sendHome() {
  const bool connected = WiFi.status() == WL_CONNECTED;
  String page = F(
      "<!doctype html><html><head><meta charset=utf-8>"
      "<meta name=viewport content='width=device-width,initial-scale=1'>"
      "<title>SD PRO Recovery</title><style>body{font:16px sans-serif;"
      "max-width:34rem;margin:2rem auto;padding:0 1rem}input,button{display:block;"
      "box-sizing:border-box;width:100%;padding:.7rem;margin:.5rem 0}</style>"
      "</head><body><h1>SD PRO Recovery</h1>");
  page += connected ? F("<p>Wi-Fi connected. IP: ") : F("<p>Wi-Fi not connected.");
  if (connected) page += htmlEscape(WiFi.localIP().toString());
  page += F("</p><form method=post action=/save><label>Wi-Fi SSID</label>"
            "<input name=ssid maxlength=32 required value=\"");
  if (configValid()) page += htmlEscape(config.ssid);
  page += F("\"><label>Wi-Fi password</label><input name=wifi type=password "
            "maxlength=64><label>OTA password (minimum 8 characters)</label>"
            "<input name=ota type=password minlength=8 maxlength=32 required>"
            "<button type=submit>Save and restart</button></form>");
  if (configValid()) page += F("<p><a href=/update>Firmware update</a></p>");
  page += F("</body></html>");
  server.send(200, "text/html; charset=utf-8", page);
}

void saveFromForm() {
  const String ssid = server.arg("ssid");
  const String wifiPassword = server.arg("wifi");
  const String otaPassword = server.arg("ota");
  if (ssid.isEmpty() || ssid.length() > 32 || wifiPassword.length() > 64 ||
      otaPassword.length() < 8 || otaPassword.length() > 32) {
    server.send(400, "text/plain", "Invalid configuration");
    return;
  }
  memset(&config, 0, sizeof(config));
  strlcpy(config.ssid, ssid.c_str(), sizeof(config.ssid));
  strlcpy(config.wifiPassword, wifiPassword.c_str(), sizeof(config.wifiPassword));
  strlcpy(config.otaPassword, otaPassword.c_str(), sizeof(config.otaPassword));
  saveConfig();
  server.send(200, "text/html", "Saved. Restarting...");
  delay(250);
  ESP.restart();
}

void sendUpdatePage() {
  if (!otaAuthenticated()) return;
  server.send(200, "text/html; charset=utf-8",
              "<!doctype html><meta name=viewport content='width=device-width'>"
              "<h1>SD PRO OTA</h1><form method=post enctype=multipart/form-data>"
              "<input type=file name=firmware accept=.bin required>"
              "<button type=submit>Update</button></form>");
}

void finishUpdate() {
  if (!otaAuthenticated()) return;
  const bool success = !Update.hasError();
  server.send(success ? 200 : 500, "text/plain",
              success ? "Update complete. Restarting..." : "Update failed");
  if (success) {
    delay(250);
    ESP.restart();
  }
}

void receiveUpdate() {
  if (!server.authenticate("admin", config.otaPassword)) return;
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

void configureRoutes() {
  if (routesReady) return;
  server.on("/", HTTP_GET, sendHome);
  server.on("/save", HTTP_POST, saveFromForm);
  server.on("/update", HTTP_GET, sendUpdatePage);
  server.on("/update", HTTP_POST, finishUpdate, receiveUpdate);
  server.on("/api/v1/info", HTTP_GET, sendApiInfo);
  server.on("/api/v1/status", HTTP_GET, sendApiStatus);
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
#if defined(ESP8266)
  WiFi.hostname(("sdpro-" + deviceSuffix()).c_str());
#else
  WiFi.setHostname(("mini-display-" + deviceSuffix()).c_str());
#endif
  WiFi.begin(config.ssid, config.wifiPassword);
  connectStartedAt = millis();
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

void startMdns() {
  if (mdnsReady || WiFi.status() != WL_CONNECTED) return;
  const String host = "mini-display-" + deviceSuffix();
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
  configTime(0, 0, "pool.ntp.org", "time.cloudflare.com");
  setenv("TZ", "CET-1CEST,M3.5.0,M10.5.0/3", 1);
  tzset();
  loadStoredDashboard();
  configureRoutes();
  connectToWiFi();
  showDisplayTest();
  if (dashboardPageCount) showCurrentPage();
  applyBacklight();
  recordFreeHeap();
}

void loop() {
  server.handleClient();
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
  if (displayPixelShift > 0 &&
      millis() - pixelShiftAt >= kPixelShiftIntervalMs) {
    updatePixelShift();
    pixelShiftAt = millis();
    showCurrentPage();
  }
  if (configValid() && WiFi.status() != WL_CONNECTED && !accessPointRunning &&
      millis() - connectStartedAt >= kConnectTimeoutMs) {
    startAccessPoint();
  }
  recordFreeHeap();
  delay(2);
}
