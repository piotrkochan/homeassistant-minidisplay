#pragma once

#include <Arduino.h>
#include <LittleFS.h>

#include "DisplayCompat.h"

constexpr uint8_t kUserFontSlots = 2;
constexpr uint8_t kUserFontSizes = 4;
constexpr uint16_t kMaxUserFontGlyphs = 384;
constexpr uint32_t kMaxUserFontFileBytes = 180000;
constexpr uint32_t kMaxUserFontPackBytes = 540000;

struct UserFontSlotInfo {
  bool installed = false;
  char name[33]{};
  uint16_t glyphCount = 0;
  uint32_t bytes = 0;
};

struct RenderFont {
  const GFXfont *builtin = nullptr;
  int8_t userSlot = -1;
  uint8_t size = 0;
};

struct FontRenderState {
  int8_t userSlot = -1;
  int8_t size = -1;
};

class UserFontStore {
 public:
  void begin(bool filesystemReady);
  const UserFontSlotInfo &slot(uint8_t index) const;
  int8_t activeSlot() const { return activeSlot_; }
  bool setActiveSlot(int8_t slot);
  bool remove(uint8_t slot);

  bool beginUpload(uint8_t slot, uint8_t size);
  bool writeUpload(const uint8_t *data, size_t length);
  bool finishUpload();
  void abortUpload();
  bool uploadSucceeded() const { return uploadSucceeded_; }
  bool finalize(uint8_t slot, const char *name, uint16_t glyphCount,
                uint32_t expectedBytes);

  bool available(uint8_t slot, uint8_t size) const;
  const char *fontBaseName(uint8_t slot, uint8_t size) const;

 private:
  bool load();
  bool save();
  bool validateVlw(const char *path, uint16_t *glyphCount,
                   uint32_t *bytes) const;
  const char *fontPath(uint8_t slot, uint8_t size, bool temporary) const;

  bool filesystemReady_ = false;
  int8_t activeSlot_ = -1;
  UserFontSlotInfo slots_[kUserFontSlots]{};
  File uploadFile_;
  uint8_t uploadSlot_ = 0;
  uint8_t uploadSize_ = 0;
  uint32_t uploadBytes_ = 0;
  bool uploadFailed_ = false;
  bool uploadSucceeded_ = false;
};

extern UserFontStore userFonts;

template <typename Canvas>
void applyRenderFont(Canvas &canvas, const RenderFont &font,
                     FontRenderState &state) {
#if defined(ESP8266)
  if (font.userSlot >= 0 &&
      userFonts.available(font.userSlot, font.size)) {
    if (state.userSlot != font.userSlot || state.size != font.size) {
      if (state.userSlot >= 0) canvas.unloadFont();
      canvas.loadFont(userFonts.fontBaseName(font.userSlot, font.size),
                      LittleFS);
      if (canvas.fontLoaded) {
        state.userSlot = font.userSlot;
        state.size = font.size;
        return;
      }
    } else if (canvas.fontLoaded) {
      return;
    }
  }
  if (canvas.fontLoaded) canvas.unloadFont();
#endif
  state.userSlot = -1;
  state.size = -1;
  canvas.setFreeFont(font.builtin);
}
