PIO := $(CURDIR)/.venv/bin/pio
export PLATFORMIO_CORE_DIR := $(CURDIR)/.platformio

.PHONY: build build-all package clean check size card-build card-check

build:
	cd firmware && $(PIO) run

build-all: package

package:
	mkdir -p dist
	cd firmware && $(PIO) run -e sdpro -e geekmagic_smalltv_nocs -e geekmagic_smalltv_cs15
	cp firmware/.pio/build/sdpro/firmware.bin dist/home-assistant-mini-display-sdpro.bin
	cp firmware/.pio/build/geekmagic_smalltv_nocs/firmware.bin dist/home-assistant-mini-display-geekmagic-smalltv-nocs.bin
	cp firmware/.pio/build/geekmagic_smalltv_cs15/firmware.bin dist/home-assistant-mini-display-geekmagic-smalltv-cs15.bin
	cd firmware && $(PIO) run -e geekmagic_smalltv_esp32c2
	cp firmware/.pio/build/geekmagic_smalltv_esp32c2/firmware.bin dist/home-assistant-mini-display-geekmagic-smalltv-esp32c2-ota.bin
	cp firmware/.pio/build/geekmagic_smalltv_esp32c2/firmware.factory.bin dist/home-assistant-mini-display-geekmagic-smalltv-esp32c2-factory.bin
	cd firmware && $(PIO) run -e geekmagic_smalltv_pro
	cp firmware/.pio/build/geekmagic_smalltv_pro/firmware.bin dist/home-assistant-mini-display-geekmagic-smalltv-pro-ota.bin
	cp firmware/.pio/build/geekmagic_smalltv_pro/firmware.factory.bin dist/home-assistant-mini-display-geekmagic-smalltv-pro-factory.bin

clean:
	cd firmware && $(PIO) run --target clean

check:
	cd firmware && $(PIO) check

size: build
	$(PIO) run --project-dir firmware --target size

card-build:
	npm --prefix integration/card run build

card-check:
	npm --prefix integration/card run check
