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

bool readImageAssetHeader(File &file, uint16_t *width, uint16_t *height) {
  if (!file || file.size() < kImageAssetHeaderBytes + 3) return false;
  uint8_t header[kImageAssetHeaderBytes];
  if (!file.seek(0) || file.read(header, sizeof(header)) != sizeof(header) ||
      memcmp(header, "MDI2", 4) != 0) return false;
  const uint16_t imageWidth = header[4] | (header[5] << 8);
  const uint16_t imageHeight = header[6] | (header[7] << 8);
  if (imageWidth == 0 || imageHeight == 0 || imageWidth > 240 ||
      imageHeight > 240 || file.size() > kMaxImageAssetBytes) {
    return false;
  }
  if (width) *width = imageWidth;
  if (height) *height = imageHeight;
  return true;
}

bool readImageAssetRowSize(File &file, uint16_t *size) {
  uint8_t bytes[2];
  if (!size || file.read(bytes, sizeof(bytes)) != sizeof(bytes)) return false;
  *size = bytes[0] | (static_cast<uint16_t>(bytes[1]) << 8);
  return true;
}

bool ImageAssetByteReader::begin(size_t offset, size_t length) {
  offset_ = 0;
  size_ = 0;
  remaining_ = length;
  return file_.seek(offset);
}

bool ImageAssetByteReader::readByte(uint8_t &value) {
  if (remaining_ == 0) return false;
  if (offset_ == size_) {
    size_ = file_.read(buffer_, min(sizeof(buffer_), remaining_));
    offset_ = 0;
    if (size_ == 0) return false;
  }
  value = buffer_[offset_++];
  --remaining_;
  return true;
}

bool validImageAsset(File &file, uint16_t *width, uint16_t *height) {
  uint16_t imageWidth = 0;
  uint16_t imageHeight = 0;
  if (!readImageAssetHeader(file, &imageWidth, &imageHeight)) return false;
  ImageAssetByteReader reader(file);
  if (!file.seek(kImageAssetHeaderBytes)) return false;
  uint16_t color = 0;
  for (uint16_t row = 0; row < imageHeight; ++row) {
    uint16_t rowBytes = 0;
    if (!readImageAssetRowSize(file, &rowBytes) || rowBytes == 0 ||
        file.position() + rowBytes > file.size() ||
        !reader.begin(file.position(), rowBytes)) {
      return false;
    }
    Rgb565RleDecoder decoder;
    for (uint16_t column = 0; column < imageWidth; ++column) {
      if (!decoder.next(reader, color)) return false;
    }
    if (!decoder.packetComplete() || reader.remaining() != 0) return false;
#if defined(ESP8266)
    if ((row & 7) == 7) optimistic_yield(10000);
#endif
  }
  if (file.position() != file.size()) return false;
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
      !readImageAssetHeader(entry.file, &entry.width, &entry.height)) {
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
