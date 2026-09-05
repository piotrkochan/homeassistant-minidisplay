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

ImageAssetRenderCache::~ImageAssetRenderCache() {
  for (Entry &entry : entries_) {
    if (entry.file) entry.file.close();
  }
}

File *ImageAssetRenderCache::open(const char *assetId, uint16_t *width,
                                  uint16_t *height) {
  if (!assetId || !assetId[0]) return nullptr;
  Entry *available = nullptr;
  Entry *oldest = &entries_[0];
  for (Entry &entry : entries_) {
    if (entry.file && strcmp(entry.id, assetId) == 0) {
      entry.usedAt = ++useCounter_;
      if (width) *width = entry.width;
      if (height) *height = entry.height;
      return &entry.file;
    }
    if (!entry.file && available == nullptr) available = &entry;
    if (entry.usedAt < oldest->usedAt) oldest = &entry;
  }
  Entry &entry = available != nullptr ? *available : *oldest;
  if (entry.file) entry.file.close();
  entry.file = LittleFS.open(imageAssetPath(String(assetId)), "r");
  if (!entry.file ||
      !validImageAsset(entry.file, &entry.width, &entry.height)) {
    if (entry.file) entry.file.close();
    entry.id[0] = '\0';
    return nullptr;
  }
  strlcpy(entry.id, assetId, sizeof(entry.id));
  entry.usedAt = ++useCounter_;
  if (width) *width = entry.width;
  if (height) *height = entry.height;
  return &entry.file;
}
