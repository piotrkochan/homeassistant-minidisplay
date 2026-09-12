# Mini-Display bootstrap firmware

Small first-stage firmware for JUZIPi SD PRO. It is intended to fit the stock
OTA staging area, then install the larger Mini-Display firmware safely.

## User flow

1. Upload the installer through the stock firmware updater.
2. Join the WPA2 network shown on the display:
   `HA-MiniDisplay-Installer-XXXX`.
3. Open `http://192.168.4.1/`, enter Wi-Fi credentials, and optionally choose
   an interface password by entering it twice.
4. Start installation of v0.2.0.
5. The installer downloads the exact v0.2.0 asset from GitHub, verifies its
   size, MD5 and SHA-256, stages it with the ESP8266 updater, and restarts.

Wi-Fi and device credentials are stored in the configuration format consumed
by Mini-Display v0.2.0 and later. They survive the hand-off to the selected
firmware.

Every installer boot clears any previous Mini-Display device configuration and
starts its own setup access point. It never silently reuses saved home Wi-Fi
credentials. LittleFS is formatted only after the user starts installation.

The installer access-point password uses the eight-character format
`dispNNNN`, where the digits identify the device, and is shown on the display.
If connection to the selected Wi-Fi fails, the installer
keeps its access point and form available so the credentials can be corrected.
Leaving the interface password empty disables interface authentication and
direct OTA in the installed firmware.

This installer accepts only v0.2.0. Its URL, size, MD5 and SHA-256 are compiled
in. A release gets its own installer so an untrusted network cannot choose the
image or alter its verification metadata.

## Build

From the repository root:

```bash
make bootstrap-build
```

Output:

```text
firmware-bootstrap/.pio/build/sdpro_bootstrap/firmware.bin
```

Do not flash this image until its size and metadata have been checked. Hardware
testing must monitor UART at 115200 baud throughout installation and reboot.
