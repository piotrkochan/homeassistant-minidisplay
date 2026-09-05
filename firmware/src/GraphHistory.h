#pragma once

#include <ArduinoJson.h>
#include <memory>
#include "GraphSeries.h"

class GraphHistory {
 public:
  // Validation is read-only. Configure runs only after dashboard validation.
  bool validate(JsonArrayConst pages) const;
  bool configure(JsonArrayConst pages);
  void receive(const char *source, const char *value, bool available);
  bool tick();
  bool checkpoint(bool force = false);
  void reset();
  const GraphSeries *find(JsonObjectConst card) const;
  size_t bytes() const;
  bool storageError() const { return storageError_; }
  const GraphSeries *series(uint8_t index) const { return index < kMaxGraphSeries ? series_[index].get() : nullptr; }

 private:
  std::unique_ptr<GraphSeries> series_[kMaxGraphSeries];
  uint32_t sampledAt_ = 0;
  uint32_t savedAt_ = 0;
  bool dirty_ = false;
  bool storageError_ = false;
};

extern GraphHistory graphHistory;
