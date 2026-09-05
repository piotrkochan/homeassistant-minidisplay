#pragma once

#include <ArduinoJson.h>
#include <memory>
#include "GraphSeries.h"

class GraphHistory {
 public:
  // Validation is read-only. Configure runs only after dashboard validation.
  bool validate(JsonArrayConst pages) const;
  bool configure(JsonArrayConst pages);
  bool receiveSnapshot(JsonObjectConst snapshot);
  void reset();
  const GraphSeries *find(JsonObjectConst card) const;
  size_t bytes() const;
  bool storageError() const { return false; }
  const GraphSeries *series(uint8_t index) const { return index < kMaxGraphSeries ? series_[index].get() : nullptr; }

 private:
  std::unique_ptr<GraphSeries> series_[kMaxGraphSeries];
};

extern GraphHistory graphHistory;
