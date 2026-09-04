#pragma once

#include <Arduino.h>
#include <ArduinoJson.h>

#include "DisplayCompat.h"

constexpr uint8_t kMaxPageCards = 18;
constexpr uint8_t kMaxPageTexts = 43;
constexpr uint16_t kMaxPageTextBytes = 1024;

enum class PageTransitionType : uint8_t {
  None,
  Random,
  Slide,
  Bounce,
  Fade,
  Wipe,
  Dissolve,
  Curtain,
  Blinds,
  Mosaic,
  Doors,
  Spiral,
};

enum class PageTransitionDirection : uint8_t { Left, Right, Up, Down };
enum class PageTransitionSpeed : uint8_t { Normal, Slow, Fast };
enum class PageTransitionIntensity : uint8_t { Subtle, Strong };
enum class PageTransitionTileSize : uint8_t { Medium, Small, Large };

struct PageTransitionConfig {
  PageTransitionType type;
  PageTransitionDirection direction;
  PageTransitionSpeed speed;
  PageTransitionIntensity intensity;
  PageTransitionTileSize tileSize;
};

static_assert(sizeof(PageTransitionConfig) == 5,
              "Transition config must stay compact");
static_assert(static_cast<uint8_t>(PageTransitionSpeed::Normal) == 0 &&
                  static_cast<uint8_t>(PageTransitionTileSize::Medium) == 0,
              "Zero-initialized transition config must use defaults");

struct CachedCard {
  uint16_t background;
  uint8_t x;
  uint8_t y;
  uint8_t width;
  uint8_t height;
};

struct CachedText {
  const GFXfont *font;
  int16_t boundsX;
  int16_t boundsY;
  int16_t boundsWidth;
  int16_t boundsHeight;
  uint16_t foreground;
  uint16_t background;
  uint16_t valueOffset;
  uint8_t x;
  uint8_t y;
  int8_t userFontSlot;
  uint8_t userFontSize;
  uint8_t datum;
};

struct CachedProgress {
  uint16_t fillWidth;
  uint16_t background;
  uint16_t foreground;
  uint16_t center;
  uint8_t x;
  uint8_t y;
  uint8_t width;
  bool ring;
};

struct CachedArea {
  uint8_t x;
  uint8_t y;
  uint8_t width;
  uint8_t height;
  uint16_t color;
};

struct CachedPage {
  uint16_t background;
  bool hasTitleArea;
  CachedArea titleArea;
  uint8_t cardCount;
  uint8_t textCount;
  uint8_t progressCount;
  uint16_t textBytes;
  CachedCard cards[kMaxPageCards];
  CachedText texts[kMaxPageTexts];
  CachedProgress progress[kMaxPageCards];
  char textPool[kMaxPageTextBytes];
};

static_assert(sizeof(CachedPage) <= 4096,
              "A cached page must fit in bounded ESP8266 RAM");

class PageTransitionRenderer {
 public:
  using ApplyBacklight = void (*)();

  PageTransitionRenderer(MiniDisplay &display, bool &displayOn,
                         uint8_t &displayBrightness,
                         ApplyBacklight applyBacklight);

  static bool parse(JsonVariantConst value, PageTransitionConfig &result);

  void render(const CachedPage &currentPage, const CachedPage &nextPage,
              const PageTransitionConfig &transition, int8_t contentOffsetX,
              int8_t contentOffsetY);

 private:
  uint8_t frames(const PageTransitionConfig &transition) const;
  uint16_t duration(const PageTransitionConfig &transition) const;
  void drawPage(const CachedPage &page, int16_t offsetX, int16_t offsetY);
  void drawRegion(const CachedPage &page, int16_t x, int16_t y, int16_t width,
                  int16_t height, int16_t contentOffsetX,
                  int16_t contentOffsetY);
  void fade(const CachedPage &nextPage,
            const PageTransitionConfig &transition, uint8_t frameCount,
            uint16_t durationMs, int8_t contentOffsetX, int8_t contentOffsetY);
  void motion(const CachedPage &currentPage, const CachedPage &nextPage,
              const PageTransitionConfig &transition, uint8_t frameCount,
              uint16_t durationMs, bool bounce, bool smooth,
              int8_t contentOffsetX, int8_t contentOffsetY);
  void wipe(const CachedPage &nextPage,
            const PageTransitionConfig &transition, uint8_t frameCount,
            uint16_t durationMs, int8_t contentOffsetX,
            int8_t contentOffsetY);
  void dissolve(const CachedPage &nextPage,
                const PageTransitionConfig &transition, uint16_t waitMs,
                int8_t contentOffsetX, int8_t contentOffsetY);
  void curtain(const CachedPage &nextPage,
               const PageTransitionConfig &transition, uint8_t frameCount,
               uint16_t durationMs, int8_t contentOffsetX,
               int8_t contentOffsetY);
  void blinds(const CachedPage &nextPage,
              const PageTransitionConfig &transition, uint8_t frameCount,
              uint16_t durationMs, int8_t contentOffsetX,
              int8_t contentOffsetY);
  void mosaic(const CachedPage &nextPage,
              const PageTransitionConfig &transition, uint8_t frameCount,
              uint16_t durationMs, int8_t contentOffsetX,
              int8_t contentOffsetY);
  void doors(const CachedPage &currentPage, const CachedPage &nextPage,
             const PageTransitionConfig &transition, uint8_t frameCount,
             uint16_t durationMs, int8_t contentOffsetX,
             int8_t contentOffsetY);
  void spiral(const CachedPage &nextPage,
              const PageTransitionConfig &transition, uint8_t frameCount,
              uint16_t durationMs, int8_t contentOffsetX,
              int8_t contentOffsetY);

  MiniDisplay &display_;
  bool &displayOn_;
  uint8_t &displayBrightness_;
  ApplyBacklight applyBacklight_;
};
