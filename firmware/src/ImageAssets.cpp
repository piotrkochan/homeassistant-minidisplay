#include "ImageAssets.h"

bool validImageAssetId(const String &id) {
  if (id.length() != kImageAssetIdLength) return false;
  for (size_t index = 0; index < id.length(); ++index) {
    const char value = id[index];
    if (!((value >= '0' && value <= '9') ||
          (value >= 'a' && value <= 'f'))) return false;
  }
  return true;
}

String imageAssetPath(const String &id) { return "/img_" + id + ".mdi"; }

bool validImageAsset(File &file, uint16_t *width, uint16_t *height) {
  if (!file || file.size() < kImageAssetHeaderBytes) return false;
  uint8_t header[kImageAssetHeaderBytes];
  if (!file.seek(0) || file.read(header, sizeof(header)) != sizeof(header) ||
      memcmp(header, "MDI1", 4) != 0) return false;
  const uint16_t imageWidth = header[4] | (header[5] << 8);
  const uint16_t imageHeight = header[6] | (header[7] << 8);
  if (imageWidth == 0 || imageHeight == 0 || imageWidth > 240 ||
      imageHeight > 240 ||
      file.size() != kImageAssetHeaderBytes +
                         static_cast<size_t>(imageWidth) * imageHeight * 2) {
    return false;
  }
  if (width) *width = imageWidth;
  if (height) *height = imageHeight;
  return true;
}
