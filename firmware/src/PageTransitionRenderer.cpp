#include "PageTransitionRenderer.h"

#include <cstring>

#include "ProgressRenderer.h"
#include "UserFonts.h"

namespace {

constexpr int16_t kDisplaySize = 240;
#if defined(ESP8266)
constexpr int16_t kFrameBandHeight = 24;
#endif

bool parseType(const char *value, PageTransitionType &result) {
  if (strcmp(value, "none") == 0) result = PageTransitionType::None;
  else if (strcmp(value, "random") == 0) result = PageTransitionType::Random;
  else if (strcmp(value, "slide") == 0) result = PageTransitionType::Slide;
  else if (strcmp(value, "bounce") == 0) result = PageTransitionType::Bounce;
  else if (strcmp(value, "fade") == 0) result = PageTransitionType::Fade;
  else if (strcmp(value, "wipe") == 0) result = PageTransitionType::Wipe;
  else if (strcmp(value, "dissolve") == 0) result = PageTransitionType::Dissolve;
  else if (strcmp(value, "curtain") == 0) result = PageTransitionType::Curtain;
  else if (strcmp(value, "blinds") == 0) result = PageTransitionType::Blinds;
  else if (strcmp(value, "mosaic") == 0) result = PageTransitionType::Mosaic;
  else if (strcmp(value, "doors") == 0) result = PageTransitionType::Doors;
  else if (strcmp(value, "spiral") == 0) result = PageTransitionType::Spiral;
  else return false;
  return true;
}

bool parseDirection(const char *value, PageTransitionDirection &result) {
  if (strcmp(value, "left") == 0) result = PageTransitionDirection::Left;
  else if (strcmp(value, "right") == 0) result = PageTransitionDirection::Right;
  else if (strcmp(value, "up") == 0) result = PageTransitionDirection::Up;
  else if (strcmp(value, "down") == 0) result = PageTransitionDirection::Down;
  else return false;
  return true;
}

bool parseSpeed(const char *value, PageTransitionSpeed &result) {
  if (strcmp(value, "slow") == 0) result = PageTransitionSpeed::Slow;
  else if (strcmp(value, "normal") == 0) result = PageTransitionSpeed::Normal;
  else if (strcmp(value, "fast") == 0) result = PageTransitionSpeed::Fast;
  else return false;
  return true;
}

bool parseIntensity(const char *value, PageTransitionIntensity &result) {
  if (strcmp(value, "subtle") == 0) result = PageTransitionIntensity::Subtle;
  else if (strcmp(value, "strong") == 0) result = PageTransitionIntensity::Strong;
  else return false;
  return true;
}

bool parseTileSize(const char *value, PageTransitionTileSize &result) {
  if (strcmp(value, "small") == 0) result = PageTransitionTileSize::Small;
  else if (strcmp(value, "medium") == 0) result = PageTransitionTileSize::Medium;
  else if (strcmp(value, "large") == 0) result = PageTransitionTileSize::Large;
  else return false;
  return true;
}

float boundedBounce(float progress) {
  constexpr float divisor = 2.75F;
  constexpr float scale = 7.5625F;
  if (progress < 1.0F / divisor) return scale * progress * progress;
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

void finishFrame(uint32_t startedAt, uint16_t frameDurationMs) {
  const uint32_t elapsed = millis() - startedAt;
  if (elapsed < frameDurationMs) {
    delay(frameDurationMs - elapsed);
  } else {
    yield();
  }
}

template <typename Canvas>
void paintPage(Canvas &canvas, const CachedPage &page, int16_t offsetX,
               int16_t offsetY, int16_t clipX, int16_t clipY,
               int16_t clipWidth, int16_t clipHeight) {
  FontRenderState fontState;
  const int16_t clipRight = clipX + clipWidth;
  const int16_t clipBottom = clipY + clipHeight;
  canvas.fillRect(offsetX, offsetY, kDisplaySize, kDisplaySize,
                  page.background);
  if (page.hasTitleArea) {
    const CachedArea &area = page.titleArea;
    const int16_t x = area.x + offsetX;
    const int16_t y = area.y + offsetY;
    if (x < clipRight && x + area.width > clipX && y < clipBottom &&
        y + area.height > clipY) {
      canvas.fillRect(x, y, area.width, area.height, area.color);
    }
  }
  for (uint8_t index = 0; index < page.cardCount; ++index) {
    const CachedCard &card = page.cards[index];
    const int16_t x = card.x + offsetX;
    const int16_t y = card.y + offsetY;
    if (x >= clipRight || x + card.width <= clipX || y >= clipBottom ||
        y + card.height <= clipY) {
      continue;
    }
    canvas.fillRoundRect(x, y, card.width, card.height, 5, card.background);
  }
  for (uint8_t index = 0; index < page.textCount; ++index) {
    const CachedText &text = page.texts[index];
    const int16_t boundsX = text.boundsX + offsetX;
    const int16_t boundsY = text.boundsY + offsetY;
    if (boundsX >= clipRight || boundsX + text.boundsWidth <= clipX ||
        boundsY >= clipBottom || boundsY + text.boundsHeight <= clipY) {
      continue;
    }
    canvas.setTextDatum(text.datum);
    canvas.setTextColor(text.foreground, text.background);
    applyRenderFont(
        canvas,
        RenderFont{text.font, text.userFontSlot, text.userFontSize},
        fontState);
#if defined(ESP8266)
    canvas.drawString(page.textPool + text.valueOffset, text.x + offsetX,
                      text.y + offsetY);
#else
    canvas.drawString(String(page.textPool + text.valueOffset),
                      text.x + offsetX, text.y + offsetY);
#endif
  }
  for (uint8_t index = 0; index < page.progressCount; ++index) {
    const CachedProgress &progress = page.progress[index];
    const int16_t x = progress.x + offsetX;
    const int16_t y = progress.y + offsetY;
    const int16_t height = progress.ring ? progress.width : 4;
    if (x >= clipRight || x + progress.width <= clipX || y >= clipBottom ||
        y + height <= clipY) {
      continue;
    }
    if (progress.ring) {
      drawProgressRing(canvas, x, y, progress.width,
                       progress.fillWidth / 1000.0F, progress.background,
                       progress.foreground, progress.center);
    } else {
      canvas.fillRoundRect(x, y, progress.width, 4, 2, progress.background);
      if (progress.fillWidth > 0) {
      canvas.fillRoundRect(x, y, progress.fillWidth, 4, 2,
                           progress.foreground);
      }
    }
  }
}

}  // namespace

PageTransitionRenderer::PageTransitionRenderer(
    MiniDisplay &display, bool &displayOn, uint8_t &displayBrightness,
    ApplyBacklight applyBacklight)
    : display_(display),
      displayOn_(displayOn),
      displayBrightness_(displayBrightness),
      applyBacklight_(applyBacklight) {}

bool PageTransitionRenderer::parse(JsonVariantConst value,
                                   PageTransitionConfig &result) {
  result = PageTransitionConfig{};
  if (value.isNull()) return true;
  if (!value.is<JsonObjectConst>()) return false;

  JsonObjectConst transition = value.as<JsonObjectConst>();
  const char *type = transition["type"] | "none";
  const char *direction = transition["direction"] | "left";
  const char *speed = transition["speed"] | "normal";
  const char *intensity = transition["intensity"] | "subtle";
  const char *tileSize = transition["tileSize"] | "medium";
  if (!parseType(type, result.type) ||
      !parseDirection(direction, result.direction) ||
      !parseSpeed(speed, result.speed) ||
      !parseIntensity(intensity, result.intensity) ||
      !parseTileSize(tileSize, result.tileSize)) {
    return false;
  }
  return true;
}

uint8_t PageTransitionRenderer::frames(
    const PageTransitionConfig &transition) const {
  if (transition.speed == PageTransitionSpeed::Fast) return 8;
  if (transition.speed == PageTransitionSpeed::Slow) return 18;
  return 12;
}

uint16_t PageTransitionRenderer::duration(
    const PageTransitionConfig &transition) const {
  if (transition.speed == PageTransitionSpeed::Fast) return 280;
  if (transition.speed == PageTransitionSpeed::Slow) return 900;
  return 550;
}

void PageTransitionRenderer::drawPage(const CachedPage &page, int16_t offsetX,
                                      int16_t offsetY) {
  paintPage(display_, page, offsetX, offsetY, 0, 0, kDisplaySize,
            kDisplaySize);
}

void PageTransitionRenderer::drawRegion(
    const CachedPage &page, int16_t x, int16_t y, int16_t width,
    int16_t height, int16_t contentOffsetX, int16_t contentOffsetY) {
  if (width <= 0 || height <= 0) return;
#if defined(ESP8266)
  display_.setViewport(x, y, width, height, false);
  paintPage(display_, page, contentOffsetX, contentOffsetY, x, y, width,
            height);
  display_.resetViewport();
#else
  if (x == 0 && y == 0 && width == kDisplaySize && height == kDisplaySize) {
    drawPage(page, contentOffsetX, contentOffsetY);
  }
#endif
}

void PageTransitionRenderer::fade(const CachedPage &nextPage,
                                  const PageTransitionConfig &transition,
                                  uint8_t frameCount, uint16_t durationMs,
                                  int8_t contentOffsetX,
                                  int8_t contentOffsetY) {
  if (!displayOn_ || displayBrightness_ == 0) {
    drawPage(nextPage, contentOffsetX, contentOffsetY);
    return;
  }
  const uint8_t originalBrightness = displayBrightness_;
  const uint8_t minimumBrightness = transition.intensity == PageTransitionIntensity::Strong
                                        ? 0
                                        : max<uint8_t>(1, originalBrightness / 4);
  const uint16_t frameDurationMs =
      max<uint16_t>(1, durationMs / (frameCount * 2));
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const uint32_t startedAt = millis();
    displayBrightness_ = originalBrightness -
                         (originalBrightness - minimumBrightness) * step /
                             frameCount;
    applyBacklight_();
    finishFrame(startedAt, frameDurationMs);
  }
  drawPage(nextPage, contentOffsetX, contentOffsetY);
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const uint32_t startedAt = millis();
    displayBrightness_ = minimumBrightness +
                         (originalBrightness - minimumBrightness) * step /
                             frameCount;
    applyBacklight_();
    finishFrame(startedAt, frameDurationMs);
  }
  displayBrightness_ = originalBrightness;
  applyBacklight_();
}

void PageTransitionRenderer::motion(
    const CachedPage &currentPage, const CachedPage &nextPage,
    const PageTransitionConfig &transition, uint8_t frameCount,
    uint16_t durationMs, bool bounce, bool smooth, int8_t contentOffsetX,
    int8_t contentOffsetY) {
#if defined(ESP8266)
  TFT_eSprite frame(&display_);
  frame.setColorDepth(16);
  if (frame.createSprite(kDisplaySize, kFrameBandHeight) == nullptr) {
    drawPage(nextPage, contentOffsetX, contentOffsetY);
    return;
  }
#endif
  const uint16_t frameDurationMs =
      max<uint16_t>(1, durationMs / frameCount);
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const uint32_t startedAt = millis();
    const float progress = static_cast<float>(step) / frameCount;
    const float bounceProgress = boundedBounce(progress);
    const float eased =
        bounce ? transition.intensity == PageTransitionIntensity::Strong
                     ? bounceProgress
                     : progress * 0.65F + bounceProgress * 0.35F
               : smooth ? progress * progress * (3.0F - 2.0F * progress)
                        : progress;
    const int16_t movement = constrain(
        static_cast<int16_t>(kDisplaySize * eased), 0, kDisplaySize);

#if defined(ESP8266)
    for (int16_t bandY = 0; bandY < kDisplaySize;
         bandY += kFrameBandHeight) {
      frame.fillSprite(TFT_BLACK);
      if (transition.direction == PageTransitionDirection::Left) {
        paintPage(frame, currentPage, contentOffsetX - movement,
                  contentOffsetY - bandY, 0, 0, kDisplaySize,
                  kFrameBandHeight);
        paintPage(frame, nextPage,
                  contentOffsetX + kDisplaySize - movement,
                  contentOffsetY - bandY, 0, 0, kDisplaySize,
                  kFrameBandHeight);
      } else if (transition.direction == PageTransitionDirection::Right) {
        paintPage(frame, currentPage, contentOffsetX + movement,
                  contentOffsetY - bandY, 0, 0, kDisplaySize,
                  kFrameBandHeight);
        paintPage(frame, nextPage,
                  contentOffsetX - kDisplaySize + movement,
                  contentOffsetY - bandY, 0, 0, kDisplaySize,
                  kFrameBandHeight);
      } else if (transition.direction == PageTransitionDirection::Up) {
        paintPage(frame, currentPage, contentOffsetX,
                  contentOffsetY - movement - bandY, 0, 0, kDisplaySize,
                  kFrameBandHeight);
        paintPage(frame, nextPage, contentOffsetX,
                  contentOffsetY + kDisplaySize - movement - bandY,
                  0, 0, kDisplaySize, kFrameBandHeight);
      } else {
        paintPage(frame, currentPage, contentOffsetX,
                  contentOffsetY + movement - bandY, 0, 0, kDisplaySize,
                  kFrameBandHeight);
        paintPage(frame, nextPage, contentOffsetX,
                  contentOffsetY - kDisplaySize + movement - bandY,
                  0, 0, kDisplaySize, kFrameBandHeight);
      }
      frame.pushSprite(0, bandY);
    }
#else
    if (transition.direction == PageTransitionDirection::Left) {
      drawPage(currentPage, contentOffsetX - movement, contentOffsetY);
      drawPage(nextPage, contentOffsetX + kDisplaySize - movement,
               contentOffsetY);
    } else if (transition.direction == PageTransitionDirection::Right) {
      drawPage(currentPage, contentOffsetX + movement, contentOffsetY);
      drawPage(nextPage, contentOffsetX - kDisplaySize + movement,
               contentOffsetY);
    } else if (transition.direction == PageTransitionDirection::Up) {
      drawPage(currentPage, contentOffsetX, contentOffsetY - movement);
      drawPage(nextPage, contentOffsetX,
               contentOffsetY + kDisplaySize - movement);
    } else {
      drawPage(currentPage, contentOffsetX, contentOffsetY + movement);
      drawPage(nextPage, contentOffsetX,
               contentOffsetY - kDisplaySize + movement);
    }
#endif
    finishFrame(startedAt, frameDurationMs);
  }
#if defined(ESP8266)
  frame.deleteSprite();
#endif
}

void PageTransitionRenderer::wipe(const CachedPage &nextPage,
                                  const PageTransitionConfig &transition,
                                  uint8_t frameCount, uint16_t durationMs,
                                  int8_t contentOffsetX,
                                  int8_t contentOffsetY) {
  int16_t previous = 0;
  const uint16_t frameDurationMs =
      max<uint16_t>(1, durationMs / frameCount);
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const uint32_t startedAt = millis();
    const int16_t revealed = kDisplaySize * step / frameCount;
    const int16_t extent = revealed - previous;
    if (transition.direction == PageTransitionDirection::Left) {
      drawRegion(nextPage, kDisplaySize - revealed, 0, extent, kDisplaySize,
                 contentOffsetX, contentOffsetY);
    } else if (transition.direction == PageTransitionDirection::Right) {
      drawRegion(nextPage, previous, 0, extent, kDisplaySize, contentOffsetX,
                 contentOffsetY);
    } else if (transition.direction == PageTransitionDirection::Up) {
      drawRegion(nextPage, 0, kDisplaySize - revealed, kDisplaySize, extent,
                 contentOffsetX, contentOffsetY);
    } else {
      drawRegion(nextPage, 0, previous, kDisplaySize, extent, contentOffsetX,
                 contentOffsetY);
    }
    previous = revealed;
    finishFrame(startedAt, frameDurationMs);
  }
}

void PageTransitionRenderer::dissolve(
    const CachedPage &nextPage, const PageTransitionConfig &transition,
    uint16_t durationMs, int8_t contentOffsetX, int8_t contentOffsetY) {
  const uint8_t tile = transition.tileSize == PageTransitionTileSize::Small
                           ? 8
                           : transition.tileSize == PageTransitionTileSize::Large ? 24 : 16;
  const uint8_t bands = (kDisplaySize + tile - 1) / tile;
  const uint16_t frameDurationMs = max<uint16_t>(1, durationMs / bands);
  for (uint8_t step = 0; step < bands; ++step) {
    const uint32_t startedAt = millis();
    const uint8_t band = (step * 7) % bands;
    const int16_t y = band * tile;
    drawRegion(nextPage, 0, y, kDisplaySize,
               min<int16_t>(tile, kDisplaySize - y), contentOffsetX,
               contentOffsetY);
    finishFrame(startedAt, frameDurationMs);
  }
}

void PageTransitionRenderer::curtain(
    const CachedPage &nextPage, const PageTransitionConfig &transition,
    uint8_t frameCount, uint16_t durationMs, int8_t contentOffsetX,
    int8_t contentOffsetY) {
  int16_t previous = 0;
  const uint16_t frameDurationMs =
      max<uint16_t>(1, durationMs / frameCount);
  const bool horizontal = transition.direction == PageTransitionDirection::Left ||
                          transition.direction == PageTransitionDirection::Right;
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const uint32_t startedAt = millis();
    const int16_t revealed = (kDisplaySize / 2) * step / frameCount;
    const int16_t extent = revealed - previous;
    if (horizontal) {
      drawRegion(nextPage, kDisplaySize / 2 - revealed, 0, extent,
                 kDisplaySize, contentOffsetX, contentOffsetY);
      drawRegion(nextPage, kDisplaySize / 2 + previous, 0, extent,
                 kDisplaySize, contentOffsetX, contentOffsetY);
    } else {
      drawRegion(nextPage, 0, kDisplaySize / 2 - revealed, kDisplaySize,
                 extent, contentOffsetX, contentOffsetY);
      drawRegion(nextPage, 0, kDisplaySize / 2 + previous, kDisplaySize,
                 extent, contentOffsetX, contentOffsetY);
    }
    previous = revealed;
    finishFrame(startedAt, frameDurationMs);
  }
}

void PageTransitionRenderer::blinds(
    const CachedPage &nextPage, const PageTransitionConfig &transition,
    uint8_t frameCount, uint16_t durationMs, int8_t contentOffsetX,
    int8_t contentOffsetY) {
  constexpr uint8_t kBlinds = 6;
  constexpr int16_t kBlindSize = kDisplaySize / kBlinds;
  int16_t previous = 0;
  const uint16_t frameDurationMs =
      max<uint16_t>(1, durationMs / frameCount);
  const bool horizontal = transition.direction == PageTransitionDirection::Left ||
                          transition.direction == PageTransitionDirection::Right;
  const bool reverse = transition.direction == PageTransitionDirection::Right ||
                       transition.direction == PageTransitionDirection::Down;
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const uint32_t startedAt = millis();
    const int16_t revealed = kDisplaySize * step / frameCount;
    const int16_t extent = revealed - previous;
    for (uint8_t blind = 0; blind < kBlinds; ++blind) {
      const bool fromEnd = (blind % 2 == 0) == reverse;
      if (horizontal) {
        const int16_t x = fromEnd ? kDisplaySize - revealed : previous;
        drawRegion(nextPage, x, blind * kBlindSize, extent, kBlindSize,
                   contentOffsetX, contentOffsetY);
      } else {
        const int16_t y = fromEnd ? kDisplaySize - revealed : previous;
        drawRegion(nextPage, blind * kBlindSize, y, kBlindSize, extent,
                   contentOffsetX, contentOffsetY);
      }
    }
    previous = revealed;
    finishFrame(startedAt, frameDurationMs);
  }
}

void PageTransitionRenderer::mosaic(
    const CachedPage &nextPage, const PageTransitionConfig &transition,
    uint8_t frameCount, uint16_t durationMs, int8_t contentOffsetX,
    int8_t contentOffsetY) {
  const uint8_t columns = transition.tileSize == PageTransitionTileSize::Small
                              ? 8
                              : transition.tileSize == PageTransitionTileSize::Large ? 4 : 6;
  const uint8_t total = columns * columns;
  const uint8_t multiplier = columns == 8 ? 17 : columns == 6 ? 13 : 5;
  const uint8_t offset = nextRandomValue() % total;
  const int16_t tileSize = (kDisplaySize + columns - 1) / columns;
  uint8_t previous = 0;
  const uint16_t frameDurationMs =
      max<uint16_t>(1, durationMs / frameCount);
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const uint32_t startedAt = millis();
    const uint8_t revealed = total * step / frameCount;
    for (uint8_t item = previous; item < revealed; ++item) {
      const uint8_t tile = (item * multiplier + offset) % total;
      const int16_t x = (tile % columns) * tileSize;
      const int16_t y = (tile / columns) * tileSize;
      drawRegion(nextPage, x, y,
                 min<int16_t>(tileSize, kDisplaySize - x),
                 min<int16_t>(tileSize, kDisplaySize - y), contentOffsetX,
                 contentOffsetY);
    }
    previous = revealed;
    finishFrame(startedAt, frameDurationMs);
  }
}

void PageTransitionRenderer::doors(
    const CachedPage &currentPage, const CachedPage &nextPage,
    const PageTransitionConfig &transition, uint8_t frameCount,
    uint16_t durationMs, int8_t contentOffsetX, int8_t contentOffsetY) {
#if defined(ESP8266)
  TFT_eSprite frame(&display_);
  frame.setColorDepth(16);
  if (frame.createSprite(kDisplaySize, kFrameBandHeight) == nullptr) {
    drawPage(nextPage, contentOffsetX, contentOffsetY);
    return;
  }
  const uint16_t frameDurationMs =
      max<uint16_t>(1, durationMs / frameCount);
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const uint32_t startedAt = millis();
    const float progress = static_cast<float>(step) / frameCount;
    const float eased = progress * progress * (3.0F - 2.0F * progress);
    const int16_t movement = (kDisplaySize / 2) * eased;
    const int16_t visibleHalf = kDisplaySize / 2 - movement;
    for (int16_t bandY = 0; bandY < kDisplaySize;
         bandY += kFrameBandHeight) {
      frame.fillSprite(nextPage.background);
      paintPage(frame, nextPage, contentOffsetX, contentOffsetY - bandY,
                0, 0, kDisplaySize, kFrameBandHeight);
      if (visibleHalf > 0) {
        frame.setViewport(0, 0, visibleHalf, kFrameBandHeight, false);
        paintPage(frame, currentPage, contentOffsetX - movement,
                  contentOffsetY - bandY, 0, 0, visibleHalf,
                  kFrameBandHeight);
        frame.setViewport(kDisplaySize / 2 + movement, 0, visibleHalf,
                          kFrameBandHeight, false);
        paintPage(frame, currentPage, contentOffsetX + movement,
                  contentOffsetY - bandY, kDisplaySize / 2 + movement, 0,
                  visibleHalf, kFrameBandHeight);
        frame.resetViewport();
      }
      frame.pushSprite(0, bandY);
    }
    finishFrame(startedAt, frameDurationMs);
  }
  frame.deleteSprite();
#else
  curtain(nextPage, transition, frameCount, durationMs, contentOffsetX,
          contentOffsetY);
#endif
}

void PageTransitionRenderer::spiral(
    const CachedPage &nextPage, const PageTransitionConfig &transition,
    uint8_t frameCount, uint16_t durationMs, int8_t contentOffsetX,
    int8_t contentOffsetY) {
  const uint8_t columns = transition.tileSize == PageTransitionTileSize::Small
                              ? 8
                              : transition.tileSize == PageTransitionTileSize::Large ? 4 : 6;
  const uint8_t total = columns * columns;
  uint8_t order[64]{};
  uint8_t orderSize = 0;
  int8_t top = 0;
  int8_t bottom = columns - 1;
  int8_t left = 0;
  int8_t right = columns - 1;
  while (top <= bottom && left <= right) {
    for (int8_t column = left; column <= right; ++column) {
      order[orderSize++] = top * columns + column;
    }
    ++top;
    for (int8_t row = top; row <= bottom; ++row) {
      order[orderSize++] = row * columns + right;
    }
    --right;
    if (top <= bottom) {
      for (int8_t column = right; column >= left; --column) {
        order[orderSize++] = bottom * columns + column;
      }
      --bottom;
    }
    if (left <= right) {
      for (int8_t row = bottom; row >= top; --row) {
        order[orderSize++] = row * columns + left;
      }
      ++left;
    }
  }

  const int16_t tileSize = (kDisplaySize + columns - 1) / columns;
  uint8_t previous = 0;
  const uint16_t frameDurationMs =
      max<uint16_t>(1, durationMs / frameCount);
  for (uint8_t step = 1; step <= frameCount; ++step) {
    const uint32_t startedAt = millis();
    const uint8_t revealed = total * step / frameCount;
    for (uint8_t item = previous; item < revealed; ++item) {
      const uint8_t tile = order[item];
      const int16_t x = (tile % columns) * tileSize;
      const int16_t y = (tile / columns) * tileSize;
      drawRegion(nextPage, x, y,
                 min<int16_t>(tileSize, kDisplaySize - x),
                 min<int16_t>(tileSize, kDisplaySize - y), contentOffsetX,
                 contentOffsetY);
    }
    previous = revealed;
    finishFrame(startedAt, frameDurationMs);
  }
}

void PageTransitionRenderer::render(
    const CachedPage &currentPage, const CachedPage &nextPage,
    const PageTransitionConfig &transition, int8_t contentOffsetX,
    int8_t contentOffsetY) {
  PageTransitionConfig selected = transition;
  if (selected.type == PageTransitionType::Random) {
    static uint8_t previousType = 0xFF;
    static constexpr PageTransitionType kTypes[] = {
        PageTransitionType::Slide, PageTransitionType::Bounce,
        PageTransitionType::Wipe, PageTransitionType::Dissolve,
        PageTransitionType::Curtain, PageTransitionType::Blinds,
        PageTransitionType::Mosaic, PageTransitionType::Doors,
        PageTransitionType::Spiral};
    static constexpr PageTransitionTileSize kTileSizes[] = {
        PageTransitionTileSize::Small, PageTransitionTileSize::Medium,
        PageTransitionTileSize::Large};
    const uint32_t entropy = nextRandomValue();
    uint8_t type = entropy % 9;
    if (type == previousType) type = (type + 1 + ((entropy >> 8) % 8)) % 9;
    previousType = type;
    selected.type = kTypes[type];
    selected.direction = static_cast<PageTransitionDirection>((entropy / 5) % 4);
    selected.intensity = static_cast<PageTransitionIntensity>((entropy / 20) % 2);
    selected.tileSize = kTileSizes[(entropy / 40) % 3];
  }

  const uint8_t frameCount = frames(selected);
  const uint16_t durationMs = duration(selected);
  if (selected.type == PageTransitionType::Fade) {
    fade(nextPage, selected, frameCount, durationMs, contentOffsetX,
         contentOffsetY);
  } else if (selected.type == PageTransitionType::Slide) {
    motion(currentPage, nextPage, selected, frameCount, durationMs, false, true,
           contentOffsetX, contentOffsetY);
  } else if (selected.type == PageTransitionType::Bounce) {
    motion(currentPage, nextPage, selected, frameCount, durationMs, true, true,
           contentOffsetX, contentOffsetY);
  } else if (selected.type == PageTransitionType::Wipe) {
    wipe(nextPage, selected, frameCount, durationMs, contentOffsetX,
         contentOffsetY);
  } else if (selected.type == PageTransitionType::Dissolve) {
    dissolve(nextPage, selected, durationMs, contentOffsetX, contentOffsetY);
  } else if (selected.type == PageTransitionType::Curtain) {
    curtain(nextPage, selected, frameCount, durationMs, contentOffsetX,
            contentOffsetY);
  } else if (selected.type == PageTransitionType::Blinds) {
    blinds(nextPage, selected, frameCount, durationMs, contentOffsetX,
           contentOffsetY);
  } else if (selected.type == PageTransitionType::Mosaic) {
    mosaic(nextPage, selected, frameCount, durationMs, contentOffsetX,
           contentOffsetY);
  } else if (selected.type == PageTransitionType::Doors) {
    doors(currentPage, nextPage, selected, frameCount, durationMs,
          contentOffsetX, contentOffsetY);
  } else if (selected.type == PageTransitionType::Spiral) {
    spiral(nextPage, selected, frameCount, durationMs, contentOffsetX,
           contentOffsetY);
  } else {
    drawPage(nextPage, contentOffsetX, contentOffsetY);
  }
}
