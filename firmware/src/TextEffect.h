#pragma once

#include <Arduino.h>

enum class TextEffectType : uint8_t { None, Shadow, Outline };

struct TextEffect {
  TextEffectType type;
  uint16_t color;
  int8_t offsetX;
  int8_t offsetY;
  uint8_t thickness;
};

inline int16_t textEffectExtent(const TextEffect &effect) {
  if (effect.type == TextEffectType::None) return 0;
  const int16_t offset =
      effect.type == TextEffectType::Shadow
          ? max<int16_t>(abs(effect.offsetX), abs(effect.offsetY))
          : 0;
  return offset + effect.thickness;
}

template <typename Canvas, typename Text>
void drawTextWithEffect(Canvas &canvas, const Text &text, int16_t x, int16_t y,
                        uint16_t foreground, uint16_t background,
                        const TextEffect &effect) {
  (void)background;
  canvas.startWrite();
  if (effect.type == TextEffectType::Shadow) {
    canvas.setTextColor(effect.color);
    const int8_t spread = effect.thickness - 1;
    canvas.drawString(text, x + effect.offsetX, y + effect.offsetY);
    if (spread > 0) {
      canvas.drawString(text, x + effect.offsetX - spread,
                        y + effect.offsetY);
      canvas.drawString(text, x + effect.offsetX + spread,
                        y + effect.offsetY);
      canvas.drawString(text, x + effect.offsetX,
                        y + effect.offsetY - spread);
      canvas.drawString(text, x + effect.offsetX,
                        y + effect.offsetY + spread);
      canvas.drawString(text, x + effect.offsetX - spread,
                        y + effect.offsetY - spread);
      canvas.drawString(text, x + effect.offsetX + spread,
                        y + effect.offsetY - spread);
      canvas.drawString(text, x + effect.offsetX - spread,
                        y + effect.offsetY + spread);
      canvas.drawString(text, x + effect.offsetX + spread,
                        y + effect.offsetY + spread);
    }
  } else if (effect.type == TextEffectType::Outline) {
    canvas.setTextColor(effect.color);
    const int8_t radius = effect.thickness;
    const int8_t diagonal = max<int8_t>(1, radius * 181 / 256);
    canvas.drawString(text, x - radius, y);
    canvas.drawString(text, x + radius, y);
    canvas.drawString(text, x, y - radius);
    canvas.drawString(text, x, y + radius);
    canvas.drawString(text, x - diagonal, y - diagonal);
    canvas.drawString(text, x + diagonal, y - diagonal);
    canvas.drawString(text, x - diagonal, y + diagonal);
    canvas.drawString(text, x + diagonal, y + diagonal);
  }
  canvas.setTextColor(foreground);
  canvas.drawString(text, x, y);
  canvas.endWrite();
}
