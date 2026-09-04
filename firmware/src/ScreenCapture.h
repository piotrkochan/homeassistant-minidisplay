#pragma once

#include <Arduino.h>

#include "DisplayCompat.h"
#include "PageTransitionRenderer.h"
#include "UserFonts.h"

class ScreenCapture {
 public:
  static constexpr uint16_t kWidth = 240;
  static constexpr uint16_t kHeight = 240;
  static constexpr size_t kBmpSize =
      54U + static_cast<size_t>(kWidth) * kHeight * 3U;

  explicit ScreenCapture(MiniDisplay &display);
  ~ScreenCapture();

  static bool supported();
  bool begin();
  bool streamBmp(const CachedPage &page, int8_t offsetX, int8_t offsetY,
                 Print &output);

 private:
#if defined(ESP8266)
  static constexpr uint8_t kBandHeight = 8;
  TFT_eSprite frame_;
  FontRenderState fontState_;
#endif
  bool ready_ = false;
};
