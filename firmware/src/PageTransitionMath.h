#pragma once

#include <math.h>
#include <stdint.h>

#include "PageTransitionTypes.h"

struct PageMotionFrame {
  int16_t currentX;
  int16_t currentY;
  int16_t nextX;
  int16_t nextY;
};

inline float boundedTransitionBounce(float progress) {
  constexpr float divisor = 2.75F;
  constexpr float scale = 7.5625F;
  if (progress < 1.0F / divisor) return scale * progress * progress;
  if (progress < 2.0F / divisor) {
    progress -= 1.5F / divisor;
    return scale * progress * progress + 0.75F;
  }
  if (progress < 2.5F / divisor) {
    progress -= 2.25F / divisor;
    return scale * progress * progress + 0.9375F;
  }
  progress -= 2.625F / divisor;
  return scale * progress * progress + 0.984375F;
}

inline float pageMotionProgress(float progress, bool bounce, bool smooth,
                                PageTransitionIntensity intensity) {
  if (bounce) {
    // A snapshot can move forward without repainting either page. Vary its
    // velocity to retain a spring-like feel, but never reverse and require
    // pixels of A that have already left the display.
    const float amplitude =
        intensity == PageTransitionIntensity::Strong ? 0.06F : 0.03F;
    return progress + amplitude * sinf(4.0F * 3.14159265F * progress) *
                          progress * (1.0F - progress);
  }
  return smooth ? progress * progress * (3.0F - 2.0F * progress) : progress;
}

inline PageMotionFrame pageMotionFrame(
    float progress, int16_t displaySize, PageTransitionDirection direction,
    bool bounce, bool smooth, PageTransitionIntensity intensity,
    int16_t contentOffsetX = 0, int16_t contentOffsetY = 0) {
  const float eased =
      pageMotionProgress(progress, bounce, smooth, intensity);
  int16_t movement = static_cast<int16_t>(displaySize * eased);
  if (movement < 0) movement = 0;
  if (movement > displaySize) movement = displaySize;
  PageMotionFrame frame{contentOffsetX, contentOffsetY, contentOffsetX,
                        contentOffsetY};
  if (direction == PageTransitionDirection::Left) {
    frame.currentX -= movement;
    frame.nextX += displaySize - movement;
  } else if (direction == PageTransitionDirection::Right) {
    frame.currentX += movement;
    frame.nextX -= displaySize - movement;
  } else if (direction == PageTransitionDirection::Up) {
    frame.currentY -= movement;
    frame.nextY += displaySize - movement;
  } else {
    frame.currentY += movement;
    frame.nextY -= displaySize - movement;
  }
  return frame;
}

inline uint8_t pageTransitionFrameCount(PageTransitionSpeed speed) {
  if (speed == PageTransitionSpeed::Fast) return 8;
  if (speed == PageTransitionSpeed::Slow) return 18;
  return 12;
}

inline uint16_t pageTransitionDurationMs(PageTransitionSpeed speed) {
  if (speed == PageTransitionSpeed::Fast) return 280;
  if (speed == PageTransitionSpeed::Slow) return 900;
  return 550;
}
