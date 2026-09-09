#pragma once

#include <cstdint>

constexpr uint16_t kMarqueeStartPauseMs = 1000;
constexpr uint16_t kMarqueeEndPauseMs = 700;
constexpr uint16_t kMarqueeStepMs = 100;
constexpr uint8_t kMarqueeStepPixels = 8;

enum class MarqueePhase : uint8_t { PausedAtStart, Forward, PausedAtEnd, Backward };

struct MarqueeTitle {
  uint32_t nextActionAt = 0;
  uint32_t contentHash = 0;
  uint16_t sceneNodeId = 0;
  int16_t overflow = 0;
  int16_t drawnOffset = 0;
  uint16_t intervalMs = kMarqueeStepMs;
  MarqueePhase phase = MarqueePhase::PausedAtStart;
  bool loop = false;
};

inline uint16_t marqueeDelay(const MarqueeTitle &item) {
  return item.phase == MarqueePhase::PausedAtStart ? kMarqueeStartPauseMs
      : item.phase == MarqueePhase::PausedAtEnd ? kMarqueeEndPauseMs : item.intervalMs;
}

// One bounded step, never a catch-up loop after networking or transitions.
inline bool stepMarquee(MarqueeTitle &item, uint32_t now) {
  if (item.overflow <= 0 || int32_t(now - item.nextActionAt) < 0) return false;
  if (item.loop) {
    item.drawnOffset = (item.drawnOffset + kMarqueeStepPixels) % item.overflow;
    item.phase = MarqueePhase::Forward;
  } else if (item.phase == MarqueePhase::PausedAtStart || item.phase == MarqueePhase::Forward) {
    item.drawnOffset += kMarqueeStepPixels;
    if (item.drawnOffset >= item.overflow) {
      item.drawnOffset = item.overflow;
      item.phase = MarqueePhase::PausedAtEnd;
    } else item.phase = MarqueePhase::Forward;
  } else {
    item.drawnOffset -= kMarqueeStepPixels;
    if (item.drawnOffset <= 0) {
      item.drawnOffset = 0;
      item.phase = MarqueePhase::PausedAtStart;
    } else item.phase = MarqueePhase::Backward;
  }
  item.nextActionAt = now + marqueeDelay(item);
  return true;
}

inline uint32_t marqueeContentHash(const char *text) {
  uint32_t hash = 2166136261U;
  for (; *text; ++text) hash = (hash ^ uint8_t(*text)) * 16777619U;
  return hash;
}
