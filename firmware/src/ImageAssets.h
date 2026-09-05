#pragma once

#include <Arduino.h>
#include <LittleFS.h>

constexpr size_t kImageAssetIdLength = 16;
constexpr size_t kImageAssetHeaderBytes = 8;
constexpr size_t kMaxImageAssetBytes = 120 * 1024;
constexpr size_t kImageStorageReserveBytes = 256 * 1024;

enum class ImageFit : uint8_t { Cover, Contain, Stretch };

inline ImageFit parseImageFit(const char *value) {
  if (value && strcmp(value, "contain") == 0) return ImageFit::Contain;
  if (value && strcmp(value, "stretch") == 0) return ImageFit::Stretch;
  return ImageFit::Cover;
}

bool validImageAssetId(const String &id);
String imageAssetPath(const String &id);
bool validImageAsset(File &file, uint16_t *width = nullptr,
                     uint16_t *height = nullptr);

template <typename Canvas>
bool drawImageAsset(Canvas &canvas, const char *assetId, int16_t x, int16_t y,
                    int16_t width, int16_t height, ImageFit fit,
                    int16_t clipX = 0, int16_t clipY = 0,
                    int16_t clipWidth = 240, int16_t clipHeight = 240) {
  if (!assetId || !assetId[0] || width <= 0 || height <= 0) return false;
  File file = LittleFS.open(imageAssetPath(String(assetId)), "r");
  uint16_t sourceWidth = 0;
  uint16_t sourceHeight = 0;
  if (!file || !validImageAsset(file, &sourceWidth, &sourceHeight)) {
    if (file) file.close();
    return false;
  }

  int16_t destinationX = x;
  int16_t destinationY = y;
  int16_t destinationWidth = width;
  int16_t destinationHeight = height;
  int16_t sourceX = 0;
  int16_t sourceY = 0;
  int16_t sampledWidth = sourceWidth;
  int16_t sampledHeight = sourceHeight;
  const int32_t sourceRatio = static_cast<int32_t>(sourceWidth) * height;
  const int32_t destinationRatio = static_cast<int32_t>(width) * sourceHeight;
  if (fit == ImageFit::Contain) {
    if (sourceRatio > destinationRatio) {
      destinationHeight = max<int16_t>(1, static_cast<int32_t>(width) * sourceHeight / sourceWidth);
      destinationY += (height - destinationHeight) / 2;
    } else {
      destinationWidth = max<int16_t>(1, static_cast<int32_t>(height) * sourceWidth / sourceHeight);
      destinationX += (width - destinationWidth) / 2;
    }
  } else if (fit == ImageFit::Cover) {
    if (sourceRatio > destinationRatio) {
      sampledWidth = max<int16_t>(1, static_cast<int32_t>(sourceHeight) * width / height);
      sourceX = (sourceWidth - sampledWidth) / 2;
    } else {
      sampledHeight = max<int16_t>(1, static_cast<int32_t>(sourceWidth) * height / width);
      sourceY = (sourceHeight - sampledHeight) / 2;
    }
  }

  const int16_t visibleLeft = max<int16_t>(destinationX, clipX);
  const int16_t visibleTop = max<int16_t>(destinationY, clipY);
  const int16_t visibleRight = min<int16_t>(destinationX + destinationWidth,
                                            clipX + clipWidth);
  const int16_t visibleBottom = min<int16_t>(destinationY + destinationHeight,
                                             clipY + clipHeight);
  if (visibleLeft >= visibleRight || visibleTop >= visibleBottom) {
    file.close();
    return true;
  }

  uint16_t line[240];
  const int16_t outputWidth = visibleRight - visibleLeft;
  for (int16_t destinationRow = visibleTop; destinationRow < visibleBottom;
       ++destinationRow) {
    const int16_t mappedY = sourceY +
        static_cast<int32_t>(destinationRow - destinationY) * sampledHeight /
            destinationHeight;
    if (!file.seek(kImageAssetHeaderBytes +
                   static_cast<uint32_t>(mappedY) * sourceWidth * 2) ||
        file.read(reinterpret_cast<uint8_t *>(line), sourceWidth * 2) !=
            sourceWidth * 2) {
      file.close();
      return false;
    }
    const bool upscale = destinationWidth > sampledWidth;
    if (upscale) {
      for (int16_t output = outputWidth - 1; output >= 0; --output) {
        const int16_t destinationColumn = visibleLeft - destinationX + output;
        const int16_t mappedX = sourceX +
            static_cast<int32_t>(destinationColumn) * sampledWidth /
                destinationWidth;
        const uint16_t color = line[mappedX];
#if defined(ESP8266)
        line[output] = (color << 8) | (color >> 8);
#else
        line[output] = color;
#endif
      }
    } else {
      for (int16_t output = 0; output < outputWidth; ++output) {
        const int16_t destinationColumn = visibleLeft - destinationX + output;
        const int16_t mappedX = sourceX +
            static_cast<int32_t>(destinationColumn) * sampledWidth /
                destinationWidth;
        const uint16_t color = line[mappedX];
#if defined(ESP8266)
        line[output] = (color << 8) | (color >> 8);
#else
        line[output] = color;
#endif
      }
    }
    canvas.pushImage(visibleLeft, destinationRow, outputWidth, 1, line);
    if ((destinationRow & 7) == 0) yield();
  }
  file.close();
  return true;
}
