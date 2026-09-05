# Home Assistant Mini-Display

Firmware and Home Assistant integration for small 240x240 Wi-Fi displays.

## Supported firmware profiles

| Firmware file | Device | Status |
| --- | --- | --- |
| `home-assistant-mini-display-sdpro.bin` | JUZIPi SD PRO | Tested |
| `home-assistant-mini-display-geekmagic-smalltv-nocs.bin` | GeekMagic SmallTV, no-CS profile | Build supported; not tested - testers needed |
| `home-assistant-mini-display-geekmagic-smalltv-cs15.bin` | GeekMagic SmallTV / Ultra, CS15 profile | Build supported; not tested - testers needed |
| `home-assistant-mini-display-geekmagic-smalltv-esp32c2-ota.bin` | GeekMagic SmallTV ESP32-C2 / ESP8684 | Build supported; not tested - testers needed |
| `home-assistant-mini-display-geekmagic-smalltv-pro-ota.bin` | GeekMagic SmallTV Pro ESP32, 8 MB | Build supported; not tested - testers needed |

ESP32 releases also contain `factory.bin` images for the first serial/USB flash.
Use `ota.bin` only through an existing compatible OTA updater.

## Planned devices

These devices do not have a firmware build yet:

| Device | MCU | Status |
| --- | --- | --- |
| Generic ESP12F + ST7789 240x240 clock | ESP8266 | Pinout must be identified - testers needed |
| NM-TV-154 | ESP32 | Not supported yet - testers needed |

Do not flash based only on enclosure or product name. Confirm MCU, pinout and
flash layout first.

## Pinouts

- [JUZIPi SD PRO](notes/pinout-sdpro.md)
- [GeekMagic SmallTV no-CS](notes/pinout-geekmagic-smalltv-nocs.md)
- [GeekMagic SmallTV / Ultra CS15](notes/pinout-geekmagic-smalltv-cs15.md)
- [GeekMagic SmallTV ESP32-C2](notes/pinout-geekmagic-smalltv-esp32c2.md)
- [GeekMagic SmallTV Pro](notes/pinout-geekmagic-smalltv-pro.md)

## Builds

```bash
npm ci --prefix firmware/web
make build-all
```

`make build` and `make build-all` type-check and bundle the device web UI,
minify it, then embed one gzip-compressed asset in flash. Source lives in
`firmware/web/`; generated files stay untracked.

The local device UI provides separate Overview, Display, Network, Security and
Firmware pages. Panel/API and firmware-update passwords are independent and
either can be disabled for trusted networks. One configurable username is used
for panel login and direct OTA. Changing the panel/API password starts Home
Assistant's reauthentication flow without requiring the integration to be
removed.

Missing Wi-Fi configuration and repeated connection failures use the same setup
mode. Its temporary access point exposes only setup and firmware updates;
dashboard API endpoints stay unavailable. Setup mode keeps existing OTA
protection. The device screen shows the setup network and connected client count.

Network settings support DHCP or static IPv4, setup Wi-Fi protection, and
validation before restart. Setup credentials are never returned by the API;
the password is shown on the physical display only while setup mode is
active. The Network page also reports signal quality, gateway, DNS, channel,
BSSID, MAC address, reconnect count, and last disconnect reason.
NTP can use a custom server or DHCP option 42 when IP assignment also uses
DHCP.

Display settings include a persistent time zone used by clock cards. Common
zones are available as presets, with a custom POSIX rule for other locations.
Home Assistant exposes the presets as a per-display select entity and reports
the active time zone and NTP server as diagnostic sensors.
Periodic entity-state forwarding can be paused per display with a configuration
switch without disabling dashboard or device controls.
Diagnostic entities report network addressing, DHCP/static mode, DNS, Wi-Fi,
NTP, memory health, reconnects, reset reason, dashboard size, and whether each
local protection mechanism is configured. Password values are never exposed.

## Display data API

`GET /api/v1/data` returns all entity values currently retained by the device
and its chart history. It uses the same panel/API authentication as other
dashboard endpoints. It does not return configuration, passwords, font files,
or image files. A request is read-only: it neither requests fresh values from
Home Assistant nor clears existing data.

- `values`: entity IDs mapped to their stored `state` and `available` flag.
  This includes values from earlier updates, not only the latest PATCH.
- `series`: histories with `source`, `intervalSeconds`, `points`,
  `aggregation` (`mean`, `min`, `max`, `last`), `bucket` and `values`.
  Values run from oldest to newest; the last value is the current, incomplete
  bucket. Its UTC start time is `bucket * intervalSeconds` (Unix seconds).
  Missing samples are `null`, not zero. A zero bucket means no synchronized
  clock sample has been collected yet.

The response is streamed in bounded chunks rather than buffered in full.
`PATCH /api/v1/data` continues to accept entity updates.
`GET /api/v1/data/latest` remains the diagnostic capture of the last update
payload; it is not the full retained state. Current entity values live in RAM;
after reboot they need a new update from Home Assistant. Chart history is
reloaded from Home Assistant Recorder. The display keeps only the latest bounded
series in RAM; it neither samples entity values nor checkpoints history to flash.

Home Assistant refreshes graph history every minute and after dashboard upload
or display resynchronization. Each graph uses `points` epoch-aligned buckets of
`intervalSeconds`, including the current partial bucket. `mean` is time-weighted;
`min`, `max`, and `last` use the recorded states. Unavailable periods remain gaps.
History depends on Recorder retention and entity exclusions; deleted history
cannot be reconstructed. Graph settings and styling are unchanged.

`PATCH /api/v1/data` accepts one optional `series` object alongside `values`:
`{"values":{},"series":{"source":"sensor.power","points":3,"intervalSeconds":300,"aggregation":"mean","bucket":6000000,"values":[12,null,24]},"render":true}`.
The series must match a configured graph. Values are oldest first, with `null`
for gaps. Invalid snapshots return 422 without replacing the previous history.
Updates during animations return 503 for retry. Requests use normal API authentication.

Run `make test-native` for data serialization, weather decoding and history aggregation tests
without flashing a device.

Dashboard uploads are staged on flash before validation. ESP8266 releases the
received body and disposable font tables before allocating the validation
document. The build applies an idempotent ownership-transfer patch to the pinned
ESP8266 HTTP parser, avoiding a second full request-body allocation. The patch
fails explicitly if the upstream parser changes and needs review; ESP32 builds
are unaffected. Invalid dashboards do not replace the saved dashboard.

## Weather cards

Choose **Weather** in the Mini-Display card editor and select a Home Assistant
`weather.*` entity. Current conditions use that entity's attributes; forecasts
use Home Assistant's `weather.get_forecasts` action. Available forecast types
and details depend on the weather provider.

- Current weather, daily, hourly or day/night forecasts.
- Daily offset `0` means today, `1` tomorrow. Hourly offsets and steps use hours;
  hourly offset `0` starts with the first available current/upcoming hour;
  day/night offsets count forecast periods. Show up to five forecasts per card.
- Independently enable the icon, description, temperature, low, time/date,
  humidity, rain probability and wind speed. Icon-only and text-only presets
  are included.
- Place icons above or beside text, or use the compact layout. Choose weather
  colors or the configured text color, with English or Polish descriptions.
- Existing card backgrounds, title/value appearance and free positioning also
  apply to weather cards.

Forecasts are cached in Home Assistant for 15 minutes, shared across displays.
Failed requests back off for a minute. The display receives compact values,
not full provider responses, and unavailable measurements stay unavailable
rather than becoming zero. Page validation enforces the bounded text cache.

- `sdpro` — no CS, BGR, inverted
- `geekmagic_smalltv_nocs` — no CS, BGR, inverted
- `geekmagic_smalltv_cs15` — CS GPIO15, RGB, not inverted
- `geekmagic_smalltv_esp32c2` - ESP32-C2, no CS, RGB
- `geekmagic_smalltv_pro` - ESP32, 8 MB, no CS, RGB

## Directories

- `dashboard/` — JSON Schema
- `firmware/` — PlatformIO firmware
- `custom_components/mini_display/` - Home Assistant integration and frontend
- `integration/` - integration requirements and development notes
- `notes/` — hardware and development notes

## Related projects

- https://github.com/JUZIPi-tech/SD_PRO
- https://github.com/adrienbrault/geekmagic-hacs
- https://github.com/bvweerd/geekmagic-tv-esp8266
- https://github.com/giovi321/smalltv-mod
