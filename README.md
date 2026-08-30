# Zoltko / JUZIPi SD PRO

Custom firmware project for the yellow JUZIPi SD PRO smart weather clock.

## Confirmed hardware

- MCU: ESP8266
- Flash: 4 MB, DIO, 40 MHz
- Display: 240 x 240 color TFT (controller and GPIO mapping under verification)
- Stock web UI: `http://10.0.13.2/`
- Stock OTA endpoint: `POST /update_ota`
- Stock OTA filename must start with `SDP`

## Safety

Do not upload a custom image until display pins, boot pins, flash layout, Wi-Fi
recovery, and OTA recovery have been verified. Stock firmware is retained in
`stock/` for rollback.

## Directories

- `firmware/` - custom PlatformIO firmware
- `notes/` - hardware and reverse-engineering notes
- `stock/` - original vendor firmware and checksums

