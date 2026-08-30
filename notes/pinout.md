# SD PRO pinout

Status: confirmed on hardware with display test firmware `0.2.1`.

## Confirmed

| Function | Value |
|---|---|
| MCU | ESP8266 |
| Flash | 4 MB, DIO, 40 MHz |
| Display resolution | 240 x 240 |

## Confirmed display wiring

| Function | Candidate GPIO |
|---|---:|
| SPI MOSI | 13 |
| SPI SCLK | 14 |
| Display CS | Not connected; panel selected permanently |
| Display DC | 0 |
| Display reset | 2 |
| Backlight PWM | 5, active LOW |
| SPI mode | 3 |
| Pixel order | BGR |
| Color inversion | Enabled |
| Button | 4, not yet tested |

Test 1 firmware: `0.2.0`. Result: black screen. Test used incorrect active-HIGH
backlight and unnecessary GPIO15 CS.

Test 2 firmware: `0.2.1`. Backlight changed to active LOW and CS disabled.
Expected screen: red/green/blue blocks, white
center strip with `SD PRO`, black bottom strip with yellow `OTA + WIFI OK`.

Result: success. Hardware displayed red, green, blue, and horizontal strips.
Display bus and control pin mapping confirmed.

## Recovery

Stock firmware supports HTTP OTA at `/update_ota`. Uploaded filename must start
with `SDP`. Once replaced, custom firmware must provide its own web OTA and a
failsafe access point.
