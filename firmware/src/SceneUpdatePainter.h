#pragma once

#include "ScenePageRenderer.h"

#if defined(ESP8266)
constexpr int16_t kSceneUpdateBandHeight = 4;

// Own bulky drawing state on the heap, not on the 4 KB loop stack.
struct SceneUpdatePainter {
  explicit SceneUpdatePainter(MiniDisplay &display) : band(&display) {}
  ~SceneUpdatePainter() {
    if (band.fontLoaded) band.unloadFont();
    band.deleteSprite();
  }

  bool begin() {
    band.setColorDepth(16);
    band.setTextWrap(false, false);
    return band.createSprite(240, kSceneUpdateBandHeight) != nullptr;
  }

  TFT_eSprite band;
  FontRenderState font;
  ImageAssetRenderCache images;
};
#endif
