#include <algorithm>
#include <cassert>
#include <cstdlib>
using std::min;
using std::max;
template <typename T> T constrain(T value, T low, T high) { return max(low, min(high, value)); }
#include "GraphPainter.h"

struct Canvas {
  uint16_t pixels[40 * 20]{};
  void drawPixel(int x, int y, uint16_t color) {
    assert(x >= 0 && x < 40 && y >= 0 && y < 20);
    pixels[y * 40 + x] = color;
  }
};
int main() {
  float low = 23.9F, high = 24.1F;
  fitGraphScale(low, high, true, NAN, NAN);
  assert(low < 23.9F && low > 23.8F && high > 24.1F && high < 24.2F);
  low = high = 24;
  fitGraphScale(low, high, true, NAN, NAN);
  assert(low < 24 && high > 24);
  assert(blendGraphColor(0xffff, 0, 0) == 0);
  assert(blendGraphColor(0xffff, 0, 100) == 0xffff);
  GraphSeries series;
  series.capacity = 4;
  series.head = 3;
  for (int i = 0; i < 4; ++i) series.values[i] = 24;
  CachedGraph graph{&series, NAN, NAN, 0xffff, 13, 6, 1, false, false, false};
  Canvas canvas;
  paintGraph(canvas, graph, 0, 0, 40, 20, 0, 0, 40, 20,
             [&](int x, int y) { return canvas.pixels[y * 40 + x]; });
  const auto expected = blendGraphColor(0xffff, 0, 13);
  for (int y = 0; y < 20; ++y)
    for (int x = 0; x < 40; ++x)
      assert(canvas.pixels[y * 40 + x] == (x % 10 == 9 ? 0 : expected));
}
