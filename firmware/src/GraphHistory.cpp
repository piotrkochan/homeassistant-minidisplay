#include "GraphHistory.h"

#include <LittleFS.h>
#include <ctime>
#include "ImageAssets.h"

GraphHistory graphHistory;
namespace {
constexpr uint32_t kCheckpointMs = 15UL * 60 * 1000;
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
uint32_t checksum(const GraphSeries &series) {
  uint32_t result = 2166136261UL;
  const auto *data = reinterpret_cast<const uint8_t *>(&series);
  for (size_t i = 0; i < sizeof(series); ++i) result = (result ^ data[i]) * 16777619UL;
  return result;
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
void restore(GraphSeries &series) {
  for (const char *path : {kPath, kBackup}) {
    File file = LittleFS.open(path, "r");
    if (!file) continue;
    uint32_t magic = 0;
    uint8_t count = 0;
    file.read(reinterpret_cast<uint8_t *>(&magic), sizeof(magic));
    file.read(&count, 1);
    if (magic != 0x47524831 || count > kMaxGraphSeries) { file.close(); continue; }
    GraphSeries candidate;
    for (uint8_t i = 0; i < count; ++i) {
      uint32_t crc = 0;
      if (file.read(reinterpret_cast<uint8_t *>(&candidate), sizeof(candidate)) != sizeof(candidate) ||
          file.read(reinterpret_cast<uint8_t *>(&crc), sizeof(crc)) != sizeof(crc)) break;
      if (crc != checksum(candidate) || candidate.source[64] != '\0' ||
          candidate.capacity < 2 || candidate.capacity > 120 || candidate.head >= candidate.capacity) continue;
      if (same(keyFor(series), keyFor(candidate))) {
        series = candidate;
        series.latest = NAN; // Never resume sampling stale pre-reboot values.
        series.lastReceived = 0;
        file.close();
        return;
      }
    }
    file.close();
  }
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
    restore(*next[i]);
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
void GraphHistory::receive(const char *source, const char *state, bool available) {
  char *end = nullptr;
  const float value = strtof(state, &end);
  for (auto &series : series_) if (series && strcmp(series->source, source) == 0) {
    series->latest = available && end != state && *end == '\0' && std::isfinite(value) ? value : NAN;
    series->lastReceived = time(nullptr);
  }
}
bool GraphHistory::tick() {
  if (millis() - sampledAt_ < 15000) return false;
  sampledAt_ = millis();
  bool changed = false;
  for (auto &series : series_) if (series) changed |= series->sample(time(nullptr));
  dirty_ |= changed;
  checkpoint();
  return changed;
}
size_t GraphHistory::bytes() const {
  size_t result = 0;
  for (const auto &series : series_) if (series) result += sizeof(GraphSeries);
  return result;
}
bool GraphHistory::checkpoint(bool force) {
  if (!dirty_ || (!force && millis() - savedAt_ < kCheckpointMs)) return true;
  savedAt_ = millis();
  FSInfo info;
  if (!LittleFS.info(info) || info.totalBytes - info.usedBytes < kImageStorageReserveBytes) {
    storageError_ = true; return false;
  }
  File file = LittleFS.open(kTemporary, "w");
  uint32_t magic = 0x47524831;
  uint8_t count = bytes() / sizeof(GraphSeries);
  bool ok = file && file.write(reinterpret_cast<uint8_t *>(&magic), sizeof(magic)) == sizeof(magic) && file.write(&count, 1) == 1;
  for (const auto &series : series_) if (ok && series) {
    uint32_t crc = checksum(*series);
    ok = file.write(reinterpret_cast<const uint8_t *>(series.get()), sizeof(GraphSeries)) == sizeof(GraphSeries) &&
         file.write(reinterpret_cast<uint8_t *>(&crc), sizeof(crc)) == sizeof(crc);
  }
  file.close();
  if (ok) {
    LittleFS.remove(kBackup);
    if (LittleFS.exists(kPath)) ok = LittleFS.rename(kPath, kBackup);
    if (ok) ok = LittleFS.rename(kTemporary, kPath);
  }
  storageError_ = !ok;
  if (ok) dirty_ = false;
  return ok;
}
void GraphHistory::reset() {
  for (auto &series : series_) series.reset();
  for (const char *path : {kPath, kTemporary, kBackup}) LittleFS.remove(path);
  dirty_ = false;
}
