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

bool ImageAssetByteReader::skipBytes(size_t length) {
  if (length > remaining_) return false;
  const size_t buffered = size_ - offset_;
  if (length <= buffered) {
    offset_ += length;
  } else {
    // file position is at the end of the read-ahead buffer.
    if (!file_.seek(file_.position() + length - buffered)) return false;
    offset_ = size_ = 0;
  }
  remaining_ -= length;
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

void ImageAssetRenderCache::enableRowCache() {
#if defined(ESP8266)
  // Optional acceleration only. Keep networking/allocator reserve intact.
  if (ESP.getFreeHeap() < sizeof(DecodedImageRows) + 8192 ||
      ESP.getMaxFreeBlockSize() < sizeof(DecodedImageRows) + 512) return;
#endif
  decodedRows_.reset(new (std::nothrow) DecodedImageRows());
}

bool ImageAssetRenderCache::readRow(const char *assetId, uint16_t row,
                                   uint16_t width, uint16_t *out) {
  if (!assetId || !out || !width || width > 240) return false;
  if (decodedRows_ && decodedRows_->copy(assetId, row, width, out)) return true;
  if (!readRowWindow(assetId, row, width, 0, width, out)) return false;
  if (decodedRows_) decodedRows_->store(assetId, row, width, out);
  return true;
}

bool ImageAssetRenderCache::readRowWindow(
    const char *assetId, uint16_t row, uint16_t width, uint16_t first,
    uint16_t end, uint16_t *out) {
  if (!assetId || !out || !width || width > 240 || first >= end ||
      end > width) return false;
  if (first == 0 && end == width && decodedRows_ &&
      decodedRows_->copy(assetId, row, width, out)) return true;
  uint16_t actualWidth, height;
  File *file = open(assetId, &actualWidth, &height);
  if (!file || actualWidth != width || row >= height || !seekRow(assetId, row)) return false;
  uint16_t bytes;
  if (!readImageAssetRowSize(*file, &bytes) || !bytes ||
      bytes > sizeof(encodedRow_) || bytes > file->size() - file->position() ||
      file->read(encodedRow_, bytes) != bytes) return false;
  ImageAssetMemoryReader reader;
  if (!reader.begin(encodedRow_, bytes) ||
      !decodeRgb565Window(reader, width, first, end, out) || reader.remaining())
    return false;
  if (first == 0 && end == width && decodedRows_)
    decodedRows_->store(assetId, row, width, out);
  return true;
}

bool ImageAssetRenderCache::buildRowIndex(Entry &entry) {
  memset(entry.rowOffsets, 0, sizeof(entry.rowOffsets));
  entry.lastRow = 0;
  entry.lastRowOffset = kImageAssetHeaderBytes;
  if (!entry.file.seek(kImageAssetHeaderBytes)) return false;
  for (uint16_t row = 0; row < entry.height; ++row) {
    if (row % kImageRowIndexStride == 0) {
      entry.rowOffsets[row / kImageRowIndexStride] = entry.file.position();
    }
    uint16_t rowBytes = 0;
    if (!readImageAssetRowSize(entry.file, &rowBytes) || rowBytes == 0 ||
        entry.file.position() + rowBytes > entry.file.size() ||
        !entry.file.seek(entry.file.position() + rowBytes)) {
      return false;
    }
#if defined(ESP8266)
    if ((row & 7) == 7) optimistic_yield(10000);
#endif
  }
  return entry.file.seek(kImageAssetHeaderBytes);
}

bool ImageAssetRenderCache::seekRow(const char *assetId, uint16_t row) {
  if (!assetId || row >= 240) return false;
  for (Entry &entry : entries_) {
    if (!entry.file || strcmp(entry.id, assetId) != 0 || row >= entry.height) {
      continue;
    }
    const uint16_t checkpoint = row / kImageRowIndexStride;
    if (checkpoint >= kImageRowIndexEntries) return false;
    uint16_t indexedRow = checkpoint * kImageRowIndexStride;
    uint32_t offset = entry.rowOffsets[checkpoint];
    if (entry.lastRow <= row && entry.lastRow >= indexedRow) {
      indexedRow = entry.lastRow;
      offset = entry.lastRowOffset;
    }
    if (!entry.file.seek(offset)) return false;
    for (uint16_t current = indexedRow; current < row; ++current) {
      uint16_t rowBytes = 0;
      if (!readImageAssetRowSize(entry.file, &rowBytes) || rowBytes == 0 ||
          entry.file.position() + rowBytes > entry.file.size() ||
          !entry.file.seek(entry.file.position() + rowBytes)) {
        return false;
      }
    }
    entry.lastRow = row;
    entry.lastRowOffset = entry.file.position();
    return true;
  }
  return false;
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
  if (!buildRowIndex(entry)) {
    entry.file.close();
    entry.id[0] = '\0';
    return nullptr;
  }
  strlcpy(entry.id, assetId, sizeof(entry.id));
  entry.usedAt = ++useCounter_;
  if (width) *width = entry.width;
  if (height) *height = entry.height;
  return &entry.file;
}
