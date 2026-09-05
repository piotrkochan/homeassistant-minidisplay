#include "ScreenCapture.h"

#include "CachedPagePainter.h"

namespace {

constexpr size_t kBmpHeaderSize = 54;
constexpr size_t kRowBytes = ScreenCapture::kWidth * 3U;

void writeLe16(uint8_t *target, uint16_t value) {
  target[0] = value & 0xFFU;
  target[1] = value >> 8U;
}

void writeLe32(uint8_t *target, uint32_t value) {
  target[0] = value & 0xFFU;
  target[1] = (value >> 8U) & 0xFFU;
  target[2] = (value >> 16U) & 0xFFU;
  target[3] = value >> 24U;
}

bool writeAll(Print &output, const uint8_t *data, size_t length) {
  uint32_t lastProgressAt = millis();
  while (length > 0) {
    const size_t written = output.write(data, length);
    if (written > 0) {
      data += written;
      length -= written;
      lastProgressAt = millis();
    } else if (millis() - lastProgressAt >= 2000) {
      return false;
    }
    yield();
  }
  return true;
}

}  // namespace

ScreenCapture::ScreenCapture(MiniDisplay &display)
#if defined(ESP8266)
    : frame_(&display)
#endif
{
  (void)display;
}

ScreenCapture::~ScreenCapture() {
#if defined(ESP8266)
  if (frame_.fontLoaded) frame_.unloadFont();
  frame_.deleteSprite();
#endif
}

bool ScreenCapture::supported() {
#if defined(ESP8266)
  return true;
#else
  return false;
#endif
}

bool ScreenCapture::begin() {
#if defined(ESP8266)
  frame_.setColorDepth(16);
  frame_.setTextWrap(false, false);
  ready_ = frame_.createSprite(kWidth, kBandHeight) != nullptr;
  return ready_;
#else
  return false;
#endif
}

bool ScreenCapture::streamBmp(const CachedPage &page, int8_t offsetX,
                              int8_t offsetY, Print &output) {
#if defined(ESP8266)
  if (!ready_) return false;
  uint8_t header[kBmpHeaderSize]{};
  header[0] = 'B';
  header[1] = 'M';
  writeLe32(header + 2, kBmpSize);
  writeLe32(header + 10, kBmpHeaderSize);
  writeLe32(header + 14, 40);
  writeLe32(header + 18, kWidth);
  writeLe32(header + 22, kHeight);
  writeLe16(header + 26, 1);
  writeLe16(header + 28, 24);
  writeLe32(header + 34, kBmpSize - kBmpHeaderSize);
  writeLe32(header + 38, 2835);
  writeLe32(header + 42, 2835);
  if (!writeAll(output, header, sizeof(header))) return false;

  uint8_t row[kRowBytes];
  for (int16_t bandY = kHeight - kBandHeight; bandY >= 0;
       bandY -= kBandHeight) {
    frame_.fillSprite(page.background);
    paintCachedPage(frame_, page, offsetX, offsetY - bandY, 0, 0, kWidth,
                    kBandHeight, fontState_, &imageCache_);
    for (int8_t localY = kBandHeight - 1; localY >= 0; --localY) {
      size_t outputOffset = 0;
      for (uint16_t x = 0; x < kWidth; ++x) {
        const uint16_t color = frame_.readPixel(x, localY);
        const uint8_t red5 = color >> 11U;
        const uint8_t green6 = (color >> 5U) & 0x3FU;
        const uint8_t blue5 = color & 0x1FU;
        row[outputOffset++] = (blue5 << 3U) | (blue5 >> 2U);
        row[outputOffset++] = (green6 << 2U) | (green6 >> 4U);
        row[outputOffset++] = (red5 << 3U) | (red5 >> 2U);
      }
      if (!writeAll(output, row, sizeof(row))) return false;
    }
    yield();
  }
  return true;
#else
  (void)page;
  (void)offsetX;
  (void)offsetY;
  (void)output;
  return false;
#endif
}
