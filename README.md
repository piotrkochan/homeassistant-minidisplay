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
either can be disabled for trusted networks. Changing the panel/API password
starts Home Assistant's reauthentication flow without requiring the integration
to be removed.

Missing Wi-Fi configuration and repeated connection failures use the same setup
mode. Its temporary access point exposes only setup and firmware recovery;
dashboard API endpoints stay unavailable. Recovery keeps existing OTA
protection. The device screen shows the setup network and connected client count.

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
