#include <cassert>
#include <cstddef>
#include <cstdint>
#include <cstdio>

#include "ImageRle.h"

class Bytes {
 public:
  Bytes(const uint8_t *data, size_t size) : data_(data), size_(size) {}

  bool readByte(uint8_t &value) {
    if (offset_ == size_) return false;
    value = data_[offset_++];
    return true;
  }

  bool empty() const { return offset_ == size_; }

 private:
  const uint8_t *data_;
  size_t size_;
  size_t offset_ = 0;
};

int main() {
  const uint8_t encoded[] = {
      0x82, 0x00, 0xf8,
      0x01, 0xe0, 0x07, 0x1f, 0x00,
  };
  const uint16_t expected[] = {0xf800, 0xf800, 0xf800, 0x07e0, 0x001f};
  Bytes bytes(encoded, sizeof(encoded));
  Rgb565RleDecoder decoder;
  for (uint16_t expectedColor : expected) {
    uint16_t color = 0;
    assert(decoder.next(bytes, color));
    assert(color == expectedColor);
  }
  assert(decoder.packetComplete());
  assert(bytes.empty());

  const uint8_t truncated[] = {0x80, 0x00};
  Bytes broken(truncated, sizeof(truncated));
  Rgb565RleDecoder brokenDecoder;
  uint16_t ignored = 0;
  assert(!brokenDecoder.next(broken, ignored));
  puts("image rle: mixed packets and truncation safe");
}
