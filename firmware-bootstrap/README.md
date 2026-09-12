# Mini-Display bootstrap firmware

Small first-stage firmware for JUZIPi SD PRO. It is intended to fit the stock
OTA staging area, then install the larger Mini-Display firmware safely.

## User flow

1. Upload the installer through the stock firmware updater.
2. Join the WPA2 network shown on the display:
   `HA-MiniDisplay-Installer-XXXX`.
3. Open `http://192.168.4.1/`, enter Wi-Fi credentials, and optionally choose
   an interface password by entering it twice.
4. Start installation of the version shown on the display.
5. The bootstrap downloads that release from this project's GitHub repository,
   verifies its SHA-256, stages it with the ESP8266 updater, and restarts.

Wi-Fi and device credentials are stored in the configuration format consumed
by the matching Mini-Display release. They survive the hand-off to the selected
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

Each bootstrap accepts exactly one firmware version. The GitHub repository and
asset naming convention are fixed in source; the version and SHA-256 are
required build flags. A release gets its own bootstrap so an untrusted network
cannot choose the image or alter its verification metadata.

## Build

From the repository root:

```bash
make bootstrap-build \
  BOOTSTRAP_VERSION=0.2.0 \
  BOOTSTRAP_SHA256=509e555601b6aecd53decb3c4ea0df3ddf83b65157ef8559494ffc84159e4ca0
```

Output:

```text
firmware-bootstrap/.pio/build/sdpro_bootstrap/firmware.bin
```

`BOOTSTRAP_VERSION` does not include the `v` tag prefix. The firmware URL is
always derived as:

```text
https://github.com/piotrkochan/homeassistant-minidisplay/releases/download/v<VERSION>/home-assistant-mini-display-sdpro-<VERSION>.bin
```

The release workflow builds the full firmware first, calculates its SHA-256,
then builds and publishes the matching
`SDP-home-assistant-mini-display-bootstrap-<VERSION>.bin`. The `SDP` prefix
keeps the file acceptable to the stock updater.

## Backporting existing releases

The same bootstrap source can target an already published release; no source
checkout of that old tag is needed. Download its existing SD PRO binary,
calculate the SHA-256 of those exact published bytes, and build with that
version and hash:

```bash
VERSION=0.1.1
gh release download "v${VERSION}" \
  --pattern "home-assistant-mini-display-sdpro-${VERSION}.bin" \
  --dir ".cache/bootstrap-${VERSION}"
SHA256="$(sha256sum ".cache/bootstrap-${VERSION}/home-assistant-mini-display-sdpro-${VERSION}.bin" | cut -d' ' -f1)"
make bootstrap-build BOOTSTRAP_VERSION="${VERSION}" BOOTSTRAP_SHA256="${SHA256}"
cp firmware-bootstrap/.pio/build/sdpro_bootstrap/firmware.bin \
  "dist/SDP-home-assistant-mini-display-bootstrap-${VERSION}.bin"
```

Test the complete stock OTA, provisioning, download, verification and reboot
flow on hardware before manually attaching the resulting file to the matching
GitHub release. Repeat independently for v0.1.0, v0.1.1 and v0.2.0. Never use
a locally rebuilt historical firmware hash: it must match the binary already
published in that release.

Do not flash this image until its size and metadata have been checked. Hardware
testing must monitor UART at 115200 baud throughout installation and reboot.
