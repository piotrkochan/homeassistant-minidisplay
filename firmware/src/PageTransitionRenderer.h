#pragma once

#include <Arduino.h>
#include <ArduinoJson.h>

#include "DisplayCompat.h"

struct PageTransitionConfig {
  char type[10];
  char direction[6];
  char speed[7];
  char intensity[7];
  char tileSize[7];
};

class PageTransitionRenderer {
 public:
  using DrawPage = bool (*)(JsonObjectConst, int16_t, int16_t, bool);
  using ApplyBacklight = void (*)();

  PageTransitionRenderer(MiniDisplay &display, bool &displayOn,
                         uint8_t &displayBrightness, DrawPage drawPage,
                         ApplyBacklight applyBacklight);

  static bool parse(JsonVariantConst value, PageTransitionConfig &result);

  void render(JsonObjectConst currentPage, JsonObjectConst nextPage,
              const PageTransitionConfig &transition, int8_t contentOffsetX,
              int8_t contentOffsetY);

 private:
  uint8_t frames(const PageTransitionConfig &transition) const;
  uint16_t frameDelay(const PageTransitionConfig &transition) const;
  void drawRegion(JsonObjectConst page, int16_t x, int16_t y, int16_t width,
                  int16_t height, int8_t contentOffsetX,
                  int8_t contentOffsetY);
  void fade(JsonObjectConst nextPage,
            const PageTransitionConfig &transition, uint8_t frameCount,
            uint16_t waitMs, int8_t contentOffsetX, int8_t contentOffsetY);
  void motion(JsonObjectConst currentPage, JsonObjectConst nextPage,
              const PageTransitionConfig &transition, uint8_t frameCount,
              uint16_t waitMs, bool bounce, bool smooth,
              int8_t contentOffsetX, int8_t contentOffsetY);
  void wipe(JsonObjectConst currentPage, JsonObjectConst nextPage,
            const PageTransitionConfig &transition, uint8_t frameCount,
            uint16_t waitMs, int8_t contentOffsetX, int8_t contentOffsetY);
  void dissolve(JsonObjectConst nextPage,
                const PageTransitionConfig &transition, uint16_t waitMs,
                int8_t contentOffsetX, int8_t contentOffsetY);

  MiniDisplay &display_;
  bool &displayOn_;
  uint8_t &displayBrightness_;
  DrawPage drawPage_;
  ApplyBacklight applyBacklight_;
};
