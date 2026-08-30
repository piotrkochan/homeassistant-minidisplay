PIO := $(CURDIR)/.venv/bin/pio
export PLATFORMIO_CORE_DIR := $(CURDIR)/.platformio

.PHONY: build clean check size

build:
	cd firmware && $(PIO) run

clean:
	cd firmware && $(PIO) run --target clean

check:
	cd firmware && $(PIO) check

size: build
	$(PIO) run --project-dir firmware --target size
