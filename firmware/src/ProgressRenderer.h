#pragma once

#include <Arduino.h>

template <typename Canvas>
void drawProgressRing(Canvas &canvas, int16_t x, int16_t y, int16_t diameter,
                      float ratio, uint16_t track, uint16_t fill,
                      uint16_t center) {
  if (diameter < 8) return;
  const int16_t radius = diameter / 2;
  const int16_t thickness = max(static_cast<int16_t>(2),
                                min(static_cast<int16_t>(5),
                                    static_cast<int16_t>(diameter / 8)));
  const int16_t centerX = x + radius;
  const int16_t centerY = y + radius;
  canvas.fillCircle(centerX, centerY, radius, track);
  canvas.fillCircle(centerX, centerY, radius - thickness, center);

  const int16_t strokeRadius = radius - thickness / 2;
  const int16_t dotRadius =
      max(static_cast<int16_t>(1), static_cast<int16_t>(thickness / 2));
  const int16_t endDegree = static_cast<int16_t>(constrain(ratio, 0.0F, 1.0F) * 360.0F);
  for (int16_t degree = 0; degree <= endDegree; degree += 3) {
    const float radians = (degree - 90) * DEG_TO_RAD;
    canvas.fillCircle(centerX + static_cast<int16_t>(cosf(radians) * strokeRadius),
                      centerY + static_cast<int16_t>(sinf(radians) * strokeRadius),
                      dotRadius, fill);
  }
}
