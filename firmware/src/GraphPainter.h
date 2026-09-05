#pragma once

#include "GraphSeries.h"
#include <cstdio>

struct CachedGraph {
  const GraphSeries *series;
  float minimum;
  float maximum;
  uint16_t color;
  uint8_t opacity;
  uint8_t labelEvery;
  uint8_t decimals;
  bool line;
  bool labels;
};

// Ordered coverage preserves the page/image beneath a graph without a second
// framebuffer or LCD readback. The pattern is anchored to content coordinates.
template <typename Canvas>
void paintGraph(Canvas &canvas, const CachedGraph &graph, int16_t x, int16_t y,
                int16_t width, int16_t height, int16_t clipX, int16_t clipY,
                int16_t clipWidth, int16_t clipHeight) {
  if (!graph.series || width < 4 || height < 6 || graph.opacity == 0) return;
  const auto &series = *graph.series;
  float low = INFINITY, high = -INFINITY;
  for (uint8_t i = 0; i < series.capacity; ++i) {
    const float value = series.at(i);
    if (std::isfinite(value)) { if (value < low) low = value; if (value > high) high = value; }
  }
  if (!std::isfinite(low)) return;
  if (std::isfinite(graph.minimum)) low = graph.minimum;
  else if (!graph.line && low > 0) low = 0;
  if (std::isfinite(graph.maximum)) high = graph.maximum;
  if (high <= low) high = low + 1;
  const int16_t plotTop = graph.labels ? 6 : 0;
  const int16_t plotHeight = max<int16_t>(1, height - plotTop - 1);
  const auto ordinate = [&](float value) {
    return plotTop + plotHeight - static_cast<int16_t>(constrain((value - low) / (high - low), 0.0F, 1.0F) * plotHeight);
  };
  const auto pixel = [&](int16_t px, int16_t py, bool label = false) {
    if (px < 0 || py < 0 || px >= width || py >= height ||
        x + px < clipX || y + py < clipY || x + px >= clipX + clipWidth || y + py >= clipY + clipHeight) return;
    static constexpr uint8_t pattern[16] = {0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5};
    if (label || pattern[(py & 3) * 4 + (px & 3)] * 100 < graph.opacity * 16)
      canvas.drawPixel(x + px, y + py, graph.color);
  };
  const auto line = [&](int16_t ax, int16_t ay, int16_t bx, int16_t by) {
    const int16_t dx = abs(bx - ax), sx = ax < bx ? 1 : -1;
    const int16_t dy = -abs(by - ay), sy = ay < by ? 1 : -1;
    int16_t error = dx + dy;
    while (true) {
      pixel(ax, ay);
      if (ax == bx && ay == by) break;
      const int16_t twice = error * 2;
      if (twice >= dy) { error += dy; ax += sx; }
      if (twice <= dx) { error += dx; ay += sy; }
    }
  };
  int16_t previousX = -1, previousY = 0;
  for (uint8_t i = 0; i < series.capacity; ++i) {
    const float value = series.at(i);
    if (!std::isfinite(value)) { previousX = -1; continue; }
    const int16_t left = static_cast<int32_t>(i) * width / series.capacity;
    const int16_t right = static_cast<int32_t>(i + 1) * width / series.capacity;
    const int16_t center = graph.line ? static_cast<int32_t>(i) * (width - 1) / (series.capacity - 1) : (left + right) / 2;
    const int16_t top = ordinate(value);
    if (graph.line) {
      pixel(center, top);
      if (previousX >= 0) line(previousX, previousY, center, top);
    } else {
      const int16_t baseline = ordinate(0);
      for (int16_t px = left; px < max<int16_t>(left + 1, right - 1); ++px)
        for (int16_t py = min(top, baseline); py <= max(top, baseline); ++py) pixel(px, py);
    }
    if (graph.labels && i % graph.labelEvery == 0) {
      char text[20];
      snprintf(text, sizeof(text), "%.*f", graph.decimals, static_cast<double>(value));
      // Tiny fixed 3x5 numerals keep graph labels independent of loaded fonts.
      static constexpr uint16_t digits[] = {0x7B6F,0x2492,0x73E7,0x73CF,0x5BC9,0x79CF,0x79EF,0x7249,0x7BEF,0x7BCF};
      const int16_t origin = max<int16_t>(0, min<int16_t>(center - static_cast<int16_t>(strlen(text)) * 2, width - static_cast<int16_t>(strlen(text)) * 4));
      for (uint8_t c = 0; text[c]; ++c) {
        const uint16_t bits = text[c] >= '0' && text[c] <= '9' ? digits[text[c] - '0'] : text[c] == '-' ? 0x01C0 : text[c] == '.' ? 0x0002 : 0;
        for (uint8_t py = 0; py < 5; ++py) for (uint8_t px = 0; px < 3; ++px)
          if (bits & (1U << (14 - py * 3 - px))) pixel(origin + c * 4 + px, max<int16_t>(0, top - 6) + py, true);
      }
    }
    previousX = center; previousY = top;
  }
}
