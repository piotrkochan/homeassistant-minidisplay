#pragma once

#include <Arduino.h>
#include <ArduinoJson.h>

#include "DisplayCompat.h"

constexpr uint8_t kMaxPageCards = 18;
constexpr uint8_t kMaxPageTexts = 43;

struct PageTransitionConfig {
  char type[10];
  char direction[6];
  char speed[7];
  char intensity[7];
  char tileSize[7];
};

struct CachedCard {
  int16_t x;
  int16_t y;
  int16_t width;
  int16_t height;
  uint16_t background;
};

struct CachedText {
  int16_t x;
  int16_t y;
  int16_t boundsX;
  int16_t boundsY;
  int16_t boundsWidth;
  int16_t boundsHeight;
  uint16_t foreground;
  uint16_t background;
  const GFXfont *font;
  uint8_t datum;
  char value[49];
};

struct CachedProgress {
  int16_t x;
  int16_t y;
  int16_t width;
  int16_t fillWidth;
  uint16_t background;
  uint16_t foreground;
};

struct CachedPage {
  uint16_t background;
  uint8_t cardCount;
  uint8_t textCount;
  uint8_t progressCount;
  CachedCard cards[kMaxPageCards];
  CachedText texts[kMaxPageTexts];
  CachedProgress progress[kMaxPageCards];
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
