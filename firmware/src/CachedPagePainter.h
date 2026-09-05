#pragma once

#include "PageTransitionRenderer.h"
#include "ProgressRenderer.h"
#include "UserFonts.h"

inline bool sameCachedFont(const CachedText &left, const CachedText &right) {
  return left.font == right.font && left.smoothFont == right.smoothFont &&
         left.userFontSlot == right.userFontSlot &&
         left.userFontSize == right.userFontSize;
}

template <typename Canvas>
void paintCachedPageTexts(Canvas &canvas, const CachedPage &page,
                          int16_t offsetX, int16_t offsetY, int16_t clipX,
                          int16_t clipY, int16_t clipWidth,
                          int16_t clipHeight, FontRenderState &fontState) {
  const int16_t clipRight = clipX + clipWidth;
  const int16_t clipBottom = clipY + clipHeight;
  uint64_t paintedTexts = 0;
  while (true) {
    int8_t first = -1;
    for (uint8_t index = 0; index < page.textCount; ++index) {
      if ((paintedTexts & (1ULL << index)) != 0) continue;
      const CachedText &text = page.texts[index];
      const int16_t boundsX = text.boundsX + offsetX;
      const int16_t boundsY = text.boundsY + offsetY;
      if (boundsX >= clipRight || boundsX + text.boundsWidth <= clipX ||
          boundsY >= clipBottom || boundsY + text.boundsHeight <= clipY) {
        paintedTexts |= 1ULL << index;
        continue;
      }
      first = index;
      break;
    }
    if (first < 0) break;
    const CachedText &fontText = page.texts[first];
    applyRenderFont(
        canvas,
        RenderFont{fontText.font, fontText.userFontSlot, fontText.userFontSize,
                   fontText.smoothFont},
        fontState);
    for (uint8_t index = first; index < page.textCount; ++index) {
      if ((paintedTexts & (1ULL << index)) != 0) continue;
      const CachedText &text = page.texts[index];
      if (!sameCachedFont(fontText, text)) continue;
      const int16_t boundsX = text.boundsX + offsetX;
      const int16_t boundsY = text.boundsY + offsetY;
      if (boundsX >= clipRight || boundsX + text.boundsWidth <= clipX ||
          boundsY >= clipBottom || boundsY + text.boundsHeight <= clipY) {
        paintedTexts |= 1ULL << index;
        continue;
      }
      paintedTexts |= 1ULL << index;
      canvas.setTextDatum(text.datum);
#if defined(ESP8266)
      drawTextWithEffect(canvas, page.textPool + text.valueOffset,
                         text.x + offsetX, text.y + offsetY, text.foreground,
                         text.background, text.effect);
#else
      drawTextWithEffect(canvas, String(page.textPool + text.valueOffset),
                         text.x + offsetX, text.y + offsetY, text.foreground,
                         text.background, text.effect);
#endif
    }
  }
}

template <typename Canvas>
void paintCachedPage(Canvas &canvas, const CachedPage &page, int16_t offsetX,
                     int16_t offsetY, int16_t clipX, int16_t clipY,
                     int16_t clipWidth, int16_t clipHeight,
                     FontRenderState &fontState,
                     ImageAssetRenderCache *imageCache = nullptr,
                     bool paintTexts = true) {
  const int16_t clipRight = clipX + clipWidth;
  const int16_t clipBottom = clipY + clipHeight;
  canvas.fillRect(offsetX, offsetY, 240, 240, page.background);
  drawImageAsset(canvas, page.backgroundImage, offsetX, offsetY, 240, 240,
                 ImageFit::Cover, clipX, clipY, clipWidth, clipHeight,
                 imageCache);
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
    if ((card.flags & 1U) == 0) {
      canvas.fillRoundRect(x, y, card.width, card.height, 5, card.background);
    }
    drawImageAsset(canvas, card.image, x, y, card.width, card.height,
                   card.imageFit, clipX, clipY, clipWidth, clipHeight,
                   imageCache);
  }
  if (paintTexts) {
    paintCachedPageTexts(canvas, page, offsetX, offsetY, clipX, clipY,
                         clipWidth, clipHeight, fontState);
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
