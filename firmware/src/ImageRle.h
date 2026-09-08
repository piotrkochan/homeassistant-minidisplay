#pragma once

#include <cstdint>

class Rgb565RleDecoder {
 public:
  template <typename Reader>
  bool next(Reader &reader, uint16_t &color) {
    if (remaining_ == 0) {
      uint8_t control = 0;
      if (!reader.readByte(control)) return false;
      repeat_ = (control & 0x80) != 0;
      remaining_ = (control & 0x7f) + 1;
      if (repeat_ && !readColor(reader, repeatedColor_)) return false;
    }
    if (repeat_) {
      color = repeatedColor_;
    } else if (!readColor(reader, color)) {
      return false;
    }
    --remaining_;
    return true;
  }

  bool packetComplete() const { return remaining_ == 0; }

 private:
  template <typename Reader>
  static bool readColor(Reader &reader, uint16_t &color) {
    uint8_t low = 0;
    uint8_t high = 0;
    if (!reader.readByte(low) || !reader.readByte(high)) return false;
    color = low | (static_cast<uint16_t>(high) << 8);
    return true;
  }

  uint8_t remaining_ = 0;
  bool repeat_ = false;
  uint16_t repeatedColor_ = 0;
};
