#include "GraphHistory.h"

#include <LittleFS.h>
#include "GraphSnapshot.h"

GraphHistory graphHistory;
namespace {
constexpr const char *kPath = "/graph-history.bin";
constexpr const char *kTemporary = "/graph-history.tmp";
constexpr const char *kBackup = "/graph-history.bak";
struct Key {
  const char *source;
  uint32_t interval;
  uint8_t points;
  GraphAggregation aggregation;
};
Key keyFor(JsonObjectConst card) {
  JsonObjectConst graph = card["graph"];
  const char *aggregation = graph["aggregation"] | "mean";
  return {graph["source"] | (card["source"] | ""), graph["intervalSeconds"] | 300UL,
          graph["points"] | uint8_t(48),
          strcmp(aggregation, "min") == 0 ? GraphAggregation::Minimum :
          strcmp(aggregation, "max") == 0 ? GraphAggregation::Maximum :
          strcmp(aggregation, "last") == 0 ? GraphAggregation::Last : GraphAggregation::Mean};
}
bool same(const Key &a, const Key &b) {
  return strcmp(a.source, b.source) == 0 && a.interval == b.interval &&
         a.points == b.points && a.aggregation == b.aggregation;
}
Key keyFor(const GraphSeries &series) {
  return {series.source, series.interval, series.capacity, series.aggregation};
}
bool collect(JsonArrayConst pages, Key *keys, uint8_t &count) {
  count = 0;
  for (JsonObjectConst page : pages) for (JsonObjectConst row : page["rows"].as<JsonArrayConst>())
    for (JsonObjectConst card : row["cards"].as<JsonArrayConst>()) {
      if (card["graph"].isNull()) {
        if (strcmp(card["type"] | "", "chart") == 0) return false;
        continue;
      }
      if (!card["graph"].is<JsonObjectConst>()) return false;
      JsonObjectConst graph = card["graph"];
      Key key = keyFor(card);
      if (!key.source[0] || strlen(key.source) > 64 || key.interval < 30 ||
          key.interval > 86400 || key.points < 2 || key.points > kMaxGraphPoints) return false;
      const char *type = graph["type"] | "bar";
      const char *aggregation = graph["aggregation"] | "mean";
      if ((strcmp(type, "bar") && strcmp(type, "line")) ||
          (strcmp(aggregation, "mean") && strcmp(aggregation, "min") &&
           strcmp(aggregation, "max") && strcmp(aggregation, "last"))) return false;
      const int opacity = graph["opacity"] | 50;
      const int labels = graph["labelEvery"] | 6;
      const int decimals = graph["decimals"] | 1;
      if (opacity < 0 || opacity > 100 || labels < 1 || labels > 120 || decimals < 0 || decimals > 3) return false;
      for (const char *name : {"minimum", "maximum"})
        if (!graph[name].isNull() && (!graph[name].is<float>() || !std::isfinite(graph[name].as<float>()))) return false;
      if (!graph["minimum"].isNull() && !graph["maximum"].isNull() &&
          graph["minimum"].as<float>() >= graph["maximum"].as<float>()) return false;
      bool found = false;
      for (uint8_t i = 0; i < count; ++i) found |= same(keys[i], key);
      if (!found) {
        if (count == kMaxGraphSeries) return false;
        keys[count++] = key;
      }
    }
  return true;
}
} // namespace

bool GraphHistory::validate(JsonArrayConst pages) const {
  Key keys[kMaxGraphSeries]; uint8_t count;
  return collect(pages, keys, count);
}
bool GraphHistory::configure(JsonArrayConst pages) {
  Key keys[kMaxGraphSeries]; uint8_t count;
  if (!collect(pages, keys, count)) return false;
  std::unique_ptr<GraphSeries> next[kMaxGraphSeries];
  int8_t retained[kMaxGraphSeries] = {-1, -1, -1, -1};
  for (uint8_t i = 0; i < count; ++i) {
    for (uint8_t j = 0; j < kMaxGraphSeries; ++j)
      if (series_[j] && same(keys[i], keyFor(*series_[j]))) retained[i] = j;
    if (retained[i] >= 0) continue;
    next[i].reset(new (std::nothrow) GraphSeries());
    if (!next[i]) return false;
    strlcpy(next[i]->source, keys[i].source, sizeof(next[i]->source));
    next[i]->capacity = keys[i].points;
    next[i]->interval = keys[i].interval;
    next[i]->aggregation = keys[i].aggregation;
  }
  for (uint8_t i = 0; i < count; ++i)
    if (retained[i] >= 0) next[i] = std::move(series_[retained[i]]);
  for (uint8_t i = 0; i < kMaxGraphSeries; ++i) series_[i] = std::move(next[i]);
  return true;
}
const GraphSeries *GraphHistory::find(JsonObjectConst card) const {
  if (card["graph"].isNull()) return nullptr;
  const Key key = keyFor(card);
  for (const auto &series : series_) if (series && same(key, keyFor(*series))) return series.get();
  return nullptr;
}
bool GraphHistory::receiveSnapshot(JsonObjectConst snapshot) {
  if (!snapshot["points"].is<uint8_t>() || !snapshot["intervalSeconds"].is<uint32_t>()) return false;
  const char *source = snapshot["source"] | "";
  const char *aggregation = snapshot["aggregation"] | "";
  const uint32_t interval = snapshot["intervalSeconds"] | 0UL;
  const uint8_t points = snapshot["points"] | uint8_t(0);
  for (auto &series : series_) if (series && strcmp(series->source, source) == 0 &&
      series->interval == interval && series->capacity == points) {
    const char *name = series->aggregation == GraphAggregation::Minimum ? "min" :
        series->aggregation == GraphAggregation::Maximum ? "max" :
        series->aggregation == GraphAggregation::Last ? "last" : "mean";
    if (strcmp(name, aggregation) == 0) return applyGraphSnapshot(*series, snapshot);
  }
  return false;
}
size_t GraphHistory::bytes() const {
  size_t result = 0;
  for (const auto &series : series_) if (series) result += sizeof(GraphSeries);
  return result;
}
void GraphHistory::reset() {
  for (auto &series : series_) series.reset();
  for (const char *path : {kPath, kTemporary, kBackup}) LittleFS.remove(path);
}
