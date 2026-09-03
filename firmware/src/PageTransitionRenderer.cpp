#include "PageTransitionRenderer.h"

#include <cstring>

namespace {

constexpr int16_t kDisplaySize = 240;

bool equals(const char *left, const char *right) {
  return strcmp(left, right) == 0;
}

float boundedBounce(float progress) {
  constexpr float divisor = 2.75F;
  constexpr float scale = 7.5625F;
  if (progress < 1.0F / divisor) {
    return scale * progress * progress;
  }
  if (progress < 2.0F / divisor) {
    progress -= 1.5F / divisor;
    return scale * progress * progress + 0.75F;
  }
  if (progress < 2.5F / divisor) {
    progress -= 2.25F / divisor;
    return scale * progress * progress + 0.9375F;
  }
  progress -= 2.625F / divisor;
  return scale * progress * progress + 0.984375F;
}

uint32_t nextRandomValue() {
  static uint32_t state = 0;
  if (state == 0) state = micros() ^ 0x9E3779B9UL;
  state ^= state << 13;
  state ^= state >> 17;
  state ^= state << 5;
  return state;
}

}  // namespace

PageTransitionRenderer::PageTransitionRenderer(
    MiniDisplay &display, bool &displayOn, uint8_t &displayBrightness,
    DrawPage drawPage, ApplyBacklight applyBacklight)
    : display_(display),
      displayOn_(displayOn),
      displayBrightness_(displayBrightness),
      drawPage_(drawPage),
      applyBacklight_(applyBacklight) {}

bool PageTransitionRenderer::parse(JsonVariantConst value,
                                   PageTransitionConfig &result) {
  memset(&result, 0, sizeof(result));
  strlcpy(result.type, "none", sizeof(result.type));
  strlcpy(result.direction, "left", sizeof(result.direction));
  strlcpy(result.speed, "normal", sizeof(result.speed));
  strlcpy(result.intensity, "subtle", sizeof(result.intensity));
  strlcpy(result.tileSize, "medium", sizeof(result.tileSize));
  if (value.isNull()) return true;
  if (!value.is<JsonObjectConst>()) return false;

  JsonObjectConst transition = value.as<JsonObjectConst>();
  const char *type = transition["type"] | "none";
  const char *direction = transition["direction"] | "left";
  const char *speed = transition["speed"] | "normal";
  const char *intensity = transition["intensity"] | "subtle";
  const char *tileSize = transition["tileSize"] | "medium";
  const bool validType = equals(type, "none") || equals(type, "random") ||
                         equals(type, "slide") ||
                         equals(type, "bounce") || equals(type, "fade") ||
                         equals(type, "wipe") || equals(type, "dissolve");
  const bool validDirection = equals(direction, "left") ||
                              equals(direction, "right") ||
                              equals(direction, "up") ||
                              equals(direction, "down");
  const bool validSpeed = equals(speed, "slow") || equals(speed, "normal") ||
                          equals(speed, "fast");
  const bool validIntensity =
      equals(intensity, "subtle") || equals(intensity, "strong");
  const bool validTileSize = equals(tileSize, "small") ||
                             equals(tileSize, "medium") ||
                             equals(tileSize, "large");
  if (!validType || !validDirection || !validSpeed || !validIntensity ||
      !validTileSize) {
    return false;
  }

  strlcpy(result.type, type, sizeof(result.type));
  strlcpy(result.direction, direction, sizeof(result.direction));
  strlcpy(result.speed, speed, sizeof(result.speed));
  strlcpy(result.intensity, intensity, sizeof(result.intensity));
  strlcpy(result.tileSize, tileSize, sizeof(result.tileSize));
  return true;
}

uint8_t PageTransitionRenderer::frames(
    const PageTransitionConfig &transition) const {
  if (equals(transition.speed, "fast")) return 7;
  if (equals(transition.speed, "slow")) return 15;
  return 10;
}

uint16_t PageTransitionRenderer::frameDelay(
    const PageTransitionConfig &transition) const {
  if (equals(transition.speed, "fast")) return 2;
  if (equals(transition.speed, "slow")) return 8;
  return 4;
}

void PageTransitionRenderer::drawRegion(
    JsonObjectConst page, int16_t x, int16_t y, int16_t width,
    int16_t height, int8_t contentOffsetX, int8_t contentOffsetY) {
  if (width <= 0 || height <= 0) return;
#if defined(ESP8266)
  display_.setViewport(x, y, width, height, false);
  drawPage_(page, contentOffsetX, contentOffsetY, true);
  display_.resetViewport();
#else
  // Arduino_GFX profiles do not expose clipping yet. They retain a safe
  // single-frame fallback rather than drawing pages outside the screen.
  if (x == 0 && y == 0 && width == kDisplaySize && height == kDisplaySize) {
    drawPage_(page, contentOffsetX, contentOffsetY, true);
  }
#endif
}

void PageTransitionRenderer::fade(JsonObjectConst nextPage,
                                  const PageTransitionConfig &transition,
                                  uint8_t frameCount, uint16_t waitMs,
                                  int8_t contentOffsetX,
                                  int8_t contentOffsetY) {
  if (!displayOn_ || displayBrightness_ == 0) {
    drawPage_(nextPage, contentOffsetX, contentOffsetY, true);
    return;
  }
  const uint8_t originalBrightness = displayBrightness_;
  const uint8_t minimumBrightness = equals(transition.intensity, "strong")
                                        ? 0
                                        : max<uint8_t>(1, originalBrightness / 4);
  for (uint8_t step = 1; step <= frameCount; ++step) {
    displayBrightness_ = originalBrightness -
                         (originalBrightness - minimumBrightness) * step /
                             frameCount;
    applyBacklight_();
    delay(waitMs);
  }
  drawPage_(nextPage, contentOffsetX, contentOffsetY, true);
  for (uint8_t step = 1; step <= frameCount; ++step) {
    displayBrightness_ = minimumBrightness +
                         (originalBrightness - minimumBrightness) * step /
                             frameCount;
    applyBacklight_();
    delay(waitMs);
  }
  displayBrightness_ = originalBrightness;
  applyBacklight_();
}

void PageTransitionRenderer::motion(
    JsonObjectConst currentPage, JsonObjectConst nextPage,
    const PageTransitionConfig &transition, uint8_t frameCount,
    uint16_t waitMs, bool bounce, bool smooth, int8_t contentOffsetX,
    int8_t contentOffsetY) {
  int16_t previousReveal = 0;
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const float progress = static_cast<float>(step) / frameCount;
    const float bounceProgress = boundedBounce(progress);
    const float movement =
        bounce ? equals(transition.intensity, "strong")
                     ? bounceProgress
                     : progress * 0.65F + bounceProgress * 0.35F
               : smooth ? progress * progress * (3.0F - 2.0F * progress)
                        : progress;
    const int16_t revealed = constrain(
        static_cast<int16_t>(kDisplaySize * movement), 1, kDisplaySize);
    const bool expanding = revealed >= previousReveal;
    const int16_t start = min(revealed, previousReveal);
    const int16_t extent = abs(revealed - previousReveal);
    JsonObjectConst page = expanding ? nextPage : currentPage;
    if (equals(transition.direction, "left")) {
      drawRegion(page, kDisplaySize - max(revealed, previousReveal), 0,
                 extent, kDisplaySize, contentOffsetX, contentOffsetY);
    } else if (equals(transition.direction, "right")) {
      drawRegion(page, start, 0, extent, kDisplaySize, contentOffsetX,
                 contentOffsetY);
    } else if (equals(transition.direction, "up")) {
      drawRegion(page, 0, kDisplaySize - max(revealed, previousReveal),
                 kDisplaySize, extent, contentOffsetX, contentOffsetY);
    } else {
      drawRegion(page, 0, start, kDisplaySize, extent, contentOffsetX,
                 contentOffsetY);
    }
    previousReveal = revealed;
    delay(waitMs);
  }
#if !defined(ESP8266)
  drawPage_(nextPage, contentOffsetX, contentOffsetY, true);
#endif
}

void PageTransitionRenderer::wipe(JsonObjectConst currentPage,
                                  JsonObjectConst nextPage,
                                  const PageTransitionConfig &transition,
                                  uint8_t frameCount, uint16_t waitMs,
                                  int8_t contentOffsetX,
                                  int8_t contentOffsetY) {
  motion(currentPage, nextPage, transition, frameCount, waitMs, false, false,
         contentOffsetX, contentOffsetY);
}

void PageTransitionRenderer::dissolve(
    JsonObjectConst nextPage, const PageTransitionConfig &transition,
    uint16_t waitMs, int8_t contentOffsetX, int8_t contentOffsetY) {
  const uint8_t tile = equals(transition.tileSize, "small")
                           ? 8
                           : equals(transition.tileSize, "large") ? 24 : 16;
  const uint8_t bands = (kDisplaySize + tile - 1) / tile;
  for (uint8_t step = 0; step < bands; ++step) {
    const uint8_t band = (step * 7) % bands;
    const int16_t y = band * tile;
    drawRegion(nextPage, 0, y, kDisplaySize,
               min<int16_t>(tile, kDisplaySize - y), contentOffsetX,
               contentOffsetY);
    delay(waitMs);
  }
#if !defined(ESP8266)
  drawPage_(nextPage, contentOffsetX, contentOffsetY, true);
#endif
}

void PageTransitionRenderer::render(
    JsonObjectConst currentPage, JsonObjectConst nextPage,
    const PageTransitionConfig &transition, int8_t contentOffsetX,
    int8_t contentOffsetY) {
  PageTransitionConfig selected = transition;
  if (equals(selected.type, "random")) {
    static uint8_t previousType = 0xFF;
    static constexpr const char *kTypes[] = {
        "slide", "bounce", "fade", "wipe", "dissolve"};
    static constexpr const char *kDirections[] = {
        "left", "right", "up", "down"};
    static constexpr const char *kIntensities[] = {"subtle", "strong"};
    static constexpr const char *kTileSizes[] = {"small", "medium", "large"};
    const uint32_t entropy = nextRandomValue();
    uint8_t type = entropy % 5;
    if (type == previousType) type = (type + 1 + ((entropy >> 8) % 4)) % 5;
    previousType = type;
    strlcpy(selected.type, kTypes[type], sizeof(selected.type));
    strlcpy(selected.direction, kDirections[(entropy / 5) % 4],
            sizeof(selected.direction));
    strlcpy(selected.intensity, kIntensities[(entropy / 20) % 2],
            sizeof(selected.intensity));
    strlcpy(selected.tileSize, kTileSizes[(entropy / 40) % 3],
            sizeof(selected.tileSize));
  }

  const uint8_t frameCount = frames(selected);
  const uint16_t waitMs = frameDelay(selected);
  if (equals(selected.type, "fade")) {
    fade(nextPage, selected, frameCount, waitMs, contentOffsetX,
         contentOffsetY);
  } else if (equals(selected.type, "slide")) {
    motion(currentPage, nextPage, selected, frameCount, waitMs, false, true,
           contentOffsetX, contentOffsetY);
  } else if (equals(selected.type, "bounce")) {
    motion(currentPage, nextPage, selected, frameCount, waitMs, true, true,
           contentOffsetX, contentOffsetY);
  } else if (equals(selected.type, "wipe")) {
    wipe(currentPage, nextPage, selected, frameCount, waitMs, contentOffsetX,
         contentOffsetY);
  } else if (equals(selected.type, "dissolve")) {
    dissolve(nextPage, selected, waitMs, contentOffsetX, contentOffsetY);
  } else {
    drawPage_(nextPage, contentOffsetX, contentOffsetY, true);
  }
}
