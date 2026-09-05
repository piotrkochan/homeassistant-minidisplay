#pragma once

#include <Arduino.h>
#include <LittleFS.h>

constexpr size_t kImageAssetIdLength = 16;
constexpr size_t kImageAssetHeaderBytes = 8;
constexpr size_t kMaxImageAssetBytes = 120 * 1024;
constexpr size_t kImageStorageReserveBytes = 256 * 1024;
constexpr uint8_t kImageRenderCacheEntries = 4;

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

class ImageAssetRenderCache {
 public:
  ~ImageAssetRenderCache();

  File *open(const char *assetId, uint16_t *width, uint16_t *height);

 private:
  struct Entry {
    File file;
    char id[kImageAssetIdLength + 1]{};
    uint16_t width = 0;
    uint16_t height = 0;
    uint32_t usedAt = 0;
  };

  Entry entries_[kImageRenderCacheEntries];
  uint32_t useCounter_ = 0;
};

template <typename Canvas>
bool drawImageAsset(Canvas &canvas, const char *assetId, int16_t x, int16_t y,
                    int16_t width, int16_t height, ImageFit fit,
                    int16_t clipX = 0, int16_t clipY = 0,
                    int16_t clipWidth = 240, int16_t clipHeight = 240,
                    ImageAssetRenderCache *cache = nullptr) {
  if (!assetId || !assetId[0] || width <= 0 || height <= 0) return false;
  File file;
  uint16_t sourceWidth = 0;
  uint16_t sourceHeight = 0;
  const bool retained = cache != nullptr;
  if (retained) {
    File *cached = cache->open(assetId, &sourceWidth, &sourceHeight);
    if (!cached) return false;
    file = *cached;
  } else {
    file = LittleFS.open(imageAssetPath(String(assetId)), "r");
    if (!file || !validImageAsset(file, &sourceWidth, &sourceHeight)) {
      if (file) file.close();
      return false;
    }
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
    if (!retained) file.close();
    return true;
  }

  uint16_t line[240];
  const int16_t outputWidth = visibleRight - visibleLeft;
  const int16_t firstDestinationColumn = visibleLeft - destinationX;
  const int16_t lastDestinationColumn =
      firstDestinationColumn + outputWidth - 1;
  const int16_t firstMappedX =
      sourceX + static_cast<int32_t>(firstDestinationColumn) * sampledWidth /
                    destinationWidth;
  const int16_t lastMappedX =
      sourceX + static_cast<int32_t>(lastDestinationColumn) * sampledWidth /
                    destinationWidth;
  const int16_t sourceSpan = lastMappedX - firstMappedX + 1;
  const bool upscale = destinationWidth > sampledWidth;
  int16_t bufferedY = -1;
  for (int16_t destinationRow = visibleTop; destinationRow < visibleBottom;
       ++destinationRow) {
    const int16_t mappedY = sourceY +
        static_cast<int32_t>(destinationRow - destinationY) * sampledHeight /
            destinationHeight;
    if (mappedY != bufferedY) {
      const uint32_t rowOffset =
          kImageAssetHeaderBytes +
          (static_cast<uint32_t>(mappedY) * sourceWidth + firstMappedX) * 2;
      if ((file.position() != rowOffset && !file.seek(rowOffset)) ||
          file.read(reinterpret_cast<uint8_t *>(line), sourceSpan * 2) !=
              sourceSpan * 2) {
        if (!retained) file.close();
        return false;
      }
      if (upscale) {
        for (int16_t output = outputWidth - 1; output >= 0; --output) {
          const int16_t destinationColumn = firstDestinationColumn + output;
          const int16_t mappedX =
              sourceX + static_cast<int32_t>(destinationColumn) * sampledWidth /
                            destinationWidth -
              firstMappedX;
          const uint16_t color = line[mappedX];
#if defined(ESP8266)
          line[output] = (color << 8) | (color >> 8);
#else
          line[output] = color;
#endif
        }
      } else {
        for (int16_t output = 0; output < outputWidth; ++output) {
          const int16_t destinationColumn = firstDestinationColumn + output;
          const int16_t mappedX =
              sourceX + static_cast<int32_t>(destinationColumn) * sampledWidth /
                            destinationWidth -
              firstMappedX;
          const uint16_t color = line[mappedX];
#if defined(ESP8266)
          line[output] = (color << 8) | (color >> 8);
#else
          line[output] = color;
#endif
        }
      }
      bufferedY = mappedY;
    }
    canvas.pushImage(visibleLeft, destinationRow, outputWidth, 1, line);
#if defined(ESP8266)
    if ((destinationRow & 15) == 0) optimistic_yield(20000);
#endif
  }
  if (!retained) file.close();
  return true;
}
