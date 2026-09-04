#include "UserFonts.h"

#include <ArduinoJson.h>

namespace {

constexpr char kMetadataPath[] = "/fonts.json";
constexpr char kMetadataTempPath[] = "/fonts.tmp";

const char *const kFontPaths[kUserFontSlots][kUserFontSizes] = {
    {"/font1-0.vlw", "/font1-1.vlw", "/font1-2.vlw", "/font1-3.vlw"},
    {"/font2-0.vlw", "/font2-1.vlw", "/font2-2.vlw", "/font2-3.vlw"},
};

const char *const kFontTempPaths[kUserFontSlots][kUserFontSizes] = {
    {"/font1-0.tmp", "/font1-1.tmp", "/font1-2.tmp", "/font1-3.tmp"},
    {"/font2-0.tmp", "/font2-1.tmp", "/font2-2.tmp", "/font2-3.tmp"},
};

const char *const kFontBaseNames[kUserFontSlots][kUserFontSizes] = {
    {"font1-0", "font1-1", "font1-2", "font1-3"},
    {"font2-0", "font2-1", "font2-2", "font2-3"},
};

uint32_t readBigEndian32(File &file) {
  uint32_t value = 0;
  for (uint8_t index = 0; index < 4; ++index) {
    const int byte = file.read();
    if (byte < 0) return UINT32_MAX;
    value = (value << 8) | static_cast<uint8_t>(byte);
  }
  return value;
}

}  // namespace

UserFontStore userFonts;

void UserFontStore::begin(bool filesystemReady) {
  filesystemReady_ = filesystemReady;
  if (!filesystemReady_ || !load()) {
    activeSlot_ = -1;
    for (UserFontSlotInfo &info : slots_) info = UserFontSlotInfo{};
  }
  for (uint8_t slotIndex = 0; slotIndex < kUserFontSlots; ++slotIndex) {
    if (!slots_[slotIndex].installed) continue;
    for (uint8_t size = 0; size < kUserFontSizes; ++size) {
      if (!LittleFS.exists(fontPath(slotIndex, size, false))) {
        slots_[slotIndex].installed = false;
        if (activeSlot_ == static_cast<int8_t>(slotIndex)) activeSlot_ = -1;
        break;
      }
    }
  }
}

const UserFontSlotInfo &UserFontStore::slot(uint8_t index) const {
  static const UserFontSlotInfo empty{};
  return index < kUserFontSlots ? slots_[index] : empty;
}

bool UserFontStore::setActiveSlot(int8_t slotIndex) {
  if (slotIndex < -1 || slotIndex >= static_cast<int8_t>(kUserFontSlots) ||
      (slotIndex >= 0 && !slots_[slotIndex].installed)) {
    return false;
  }
  activeSlot_ = slotIndex;
  return save();
}

bool UserFontStore::remove(uint8_t slotIndex) {
  if (!filesystemReady_ || slotIndex >= kUserFontSlots) return false;
  for (uint8_t size = 0; size < kUserFontSizes; ++size) {
    LittleFS.remove(fontPath(slotIndex, size, false));
    LittleFS.remove(fontPath(slotIndex, size, true));
  }
  slots_[slotIndex] = UserFontSlotInfo{};
  if (activeSlot_ == static_cast<int8_t>(slotIndex)) activeSlot_ = -1;
  return save();
}

bool UserFontStore::beginUpload(uint8_t slotIndex, uint8_t size) {
  uploadSucceeded_ = false;
  uploadFailed_ = false;
  uploadBytes_ = 0;
  if (!filesystemReady_ || slotIndex >= kUserFontSlots ||
      size >= kUserFontSizes) {
    uploadFailed_ = true;
    return false;
  }
  uploadSlot_ = slotIndex;
  uploadSize_ = size;
  const char *path = fontPath(slotIndex, size, true);
  LittleFS.remove(path);
  uploadFile_ = LittleFS.open(path, "w");
  uploadFailed_ = !uploadFile_;
  return !uploadFailed_;
}

bool UserFontStore::writeUpload(const uint8_t *data, size_t length) {
  if (uploadFailed_ || !uploadFile_ ||
      uploadBytes_ + length > kMaxUserFontFileBytes) {
    uploadFailed_ = true;
    return false;
  }
  if (uploadFile_.write(data, length) != length) {
    uploadFailed_ = true;
    return false;
  }
  uploadBytes_ += length;
  return true;
}

bool UserFontStore::finishUpload() {
  if (uploadFile_) uploadFile_.close();
  uint16_t glyphCount = 0;
  uint32_t bytes = 0;
  const char *path = fontPath(uploadSlot_, uploadSize_, true);
  uploadSucceeded_ =
      !uploadFailed_ && validateVlw(path, &glyphCount, &bytes);
  if (!uploadSucceeded_) LittleFS.remove(path);
  return uploadSucceeded_;
}

void UserFontStore::abortUpload() {
  if (uploadFile_) uploadFile_.close();
  LittleFS.remove(fontPath(uploadSlot_, uploadSize_, true));
  uploadFailed_ = true;
  uploadSucceeded_ = false;
}

bool UserFontStore::finalize(uint8_t slotIndex, const char *name,
                             uint16_t glyphCount, uint32_t expectedBytes) {
  if (!filesystemReady_ || slotIndex >= kUserFontSlots || !name || !name[0] ||
      strlen(name) > 32 || glyphCount == 0 ||
      glyphCount > kMaxUserFontGlyphs) {
    return false;
  }
  uint32_t totalBytes = 0;
  for (uint8_t size = 0; size < kUserFontSizes; ++size) {
    uint16_t fileGlyphCount = 0;
    uint32_t fileBytes = 0;
    if (!validateVlw(fontPath(slotIndex, size, true), &fileGlyphCount,
                     &fileBytes) ||
        fileGlyphCount != glyphCount) {
      return false;
    }
    totalBytes += fileBytes;
  }
  if (totalBytes > kMaxUserFontPackBytes || totalBytes != expectedBytes) {
    return false;
  }
  for (uint8_t size = 0; size < kUserFontSizes; ++size) {
    const char *destination = fontPath(slotIndex, size, false);
    LittleFS.remove(destination);
    if (!LittleFS.rename(fontPath(slotIndex, size, true), destination)) {
      return false;
    }
  }
  UserFontSlotInfo &info = slots_[slotIndex];
  info.installed = true;
  strlcpy(info.name, name, sizeof(info.name));
  info.glyphCount = glyphCount;
  info.bytes = totalBytes;
  return save();
}

bool UserFontStore::available(uint8_t slotIndex, uint8_t size) const {
  return filesystemReady_ && slotIndex < kUserFontSlots &&
         size < kUserFontSizes && slots_[slotIndex].installed;
}

const char *UserFontStore::fontBaseName(uint8_t slotIndex, uint8_t size) const {
  return slotIndex < kUserFontSlots && size < kUserFontSizes
             ? kFontBaseNames[slotIndex][size]
             : "";
}

bool UserFontStore::load() {
  if (!LittleFS.exists(kMetadataPath)) return true;
  File file = LittleFS.open(kMetadataPath, "r");
  if (!file) return false;
  StaticJsonDocument<384> document;
  const auto error = deserializeJson(document, file);
  file.close();
  if (error) return false;
  activeSlot_ = document["active"] | -1;
  JsonArray slots = document["slots"].as<JsonArray>();
  for (uint8_t index = 0; index < kUserFontSlots; ++index) {
    JsonObject value = slots[index];
    slots_[index].installed = value["installed"] | false;
    strlcpy(slots_[index].name, value["name"] | "",
            sizeof(slots_[index].name));
    slots_[index].glyphCount = value["glyphs"] | 0;
    slots_[index].bytes = value["bytes"] | 0;
  }
  if (activeSlot_ < -1 || activeSlot_ >= static_cast<int8_t>(kUserFontSlots)) {
    activeSlot_ = -1;
  }
  return true;
}

bool UserFontStore::save() {
  if (!filesystemReady_) return false;
  File file = LittleFS.open(kMetadataTempPath, "w");
  if (!file) return false;
  StaticJsonDocument<384> document;
  document["active"] = activeSlot_;
  JsonArray slots = document.createNestedArray("slots");
  for (const UserFontSlotInfo &info : slots_) {
    JsonObject value = slots.createNestedObject();
    value["installed"] = info.installed;
    value["name"] = info.name;
    value["glyphs"] = info.glyphCount;
    value["bytes"] = info.bytes;
  }
  const bool written = serializeJson(document, file) != 0;
  file.close();
  if (!written) {
    LittleFS.remove(kMetadataTempPath);
    return false;
  }
  LittleFS.remove(kMetadataPath);
  return LittleFS.rename(kMetadataTempPath, kMetadataPath);
}

bool UserFontStore::validateVlw(const char *path, uint16_t *glyphCount,
                                uint32_t *bytes) const {
  File file = LittleFS.open(path, "r");
  if (!file) return false;
  const uint32_t fileBytes = file.size();
  const uint32_t count = readBigEndian32(file);
  const uint32_t version = readBigEndian32(file);
  const uint32_t fontSize = readBigEndian32(file);
  readBigEndian32(file);
  const uint32_t ascent = readBigEndian32(file);
  const uint32_t descent = readBigEndian32(file);
  if (count == 0 || count > kMaxUserFontGlyphs || version != 11 ||
      fontSize < 8 || fontSize > 48 || ascent > 64 || descent > 32 ||
      fileBytes < 24 + count * 28) {
    file.close();
    return false;
  }
  uint32_t bitmapBytes = 0;
  uint32_t previousCodepoint = 0;
  for (uint16_t index = 0; index < count; ++index) {
    const uint32_t codepoint = readBigEndian32(file);
    const uint32_t height = readBigEndian32(file);
    const uint32_t width = readBigEndian32(file);
    const uint32_t advance = readBigEndian32(file);
    readBigEndian32(file);
    readBigEndian32(file);
    readBigEndian32(file);
    if (codepoint > 0xffff || (index > 0 && codepoint <= previousCodepoint) ||
        height > 64 || width > 64 || advance > 96 ||
        bitmapBytes > UINT32_MAX - width * height) {
      file.close();
      return false;
    }
    previousCodepoint = codepoint;
    bitmapBytes += width * height;
  }
  const bool valid = 24 + count * 28 + bitmapBytes <= fileBytes;
  file.close();
  if (!valid) return false;
  *glyphCount = count;
  *bytes = fileBytes;
  return true;
}

const char *UserFontStore::fontPath(uint8_t slotIndex, uint8_t size,
                                    bool temporary) const {
  if (slotIndex >= kUserFontSlots || size >= kUserFontSizes) return "";
  return temporary ? kFontTempPaths[slotIndex][size]
                   : kFontPaths[slotIndex][size];
}
