PIO := $(CURDIR)/.venv/bin/pio
export PLATFORMIO_CORE_DIR := $(CURDIR)/.platformio

.PHONY: build build-all package clean check size elf-report card-build card-check web-build web-check test-native

build: web-build
	cd firmware && $(PIO) run

build-all: package

package: web-build
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

web-build: web-check
	npm --prefix firmware/web run build
	python3 firmware/scripts/embed_web.py

web-check:
	npm --prefix firmware/web run format:check
	npm --prefix firmware/web run check

size: build
	$(PIO) run --project-dir firmware --target size

elf-report:
	@test -f firmware/.pio/build/sdpro/firmware.elf || { echo "build firmware first"; exit 1; }
	python3 firmware/scripts/elf_memory_report.py \
		firmware/.pio/build/sdpro/firmware.elf \
		--toolchain $(PLATFORMIO_CORE_DIR)/packages/toolchain-xtensa/bin

card-build:
	python3 firmware/scripts/export_preview_fonts.py
	npm --prefix integration/card run build

card-check:
	npm --prefix integration/card run check

test-native:
	@test -d firmware/.pio/libdeps/sdpro/ArduinoJson/src || { echo "run make build first to install ArduinoJson"; exit 1; }
	@mkdir -p .cache/tests
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/src firmware/tests/graph_painter_test.cpp -o .cache/tests/graph-painter
	.cache/tests/graph-painter
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/src -I firmware/.pio/libdeps/sdpro/ArduinoJson/src \
		firmware/tests/graph_snapshot_test.cpp -o .cache/tests/graph-snapshot
	.cache/tests/graph-snapshot
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/tests/graph_stubs -I firmware/src -I firmware/.pio/libdeps/sdpro/ArduinoJson/src \
		firmware/tests/graph_history_test.cpp firmware/src/GraphHistory.cpp -o .cache/tests/graph-history
	.cache/tests/graph-history
	python3 tests/test_graph_validation.py
	python3 tests/test_page_timing.py
	python3 tests/test_history_aggregation.py
	python3 tests/test_history_data.py
	python3 tests/test_image_codec.py
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/src -I firmware/.pio/libdeps/sdpro/ArduinoJson/src \
		firmware/tests/display_data_test.cpp -o .cache/tests/display-data
	.cache/tests/display-data
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/src firmware/tests/graph_series_test.cpp -o .cache/tests/graph-series
	.cache/tests/graph-series
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/src firmware/tests/weather_value_test.cpp -o .cache/tests/weather-values
	.cache/tests/weather-values
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/src firmware/tests/text_flow_test.cpp -o .cache/tests/text-flow
	.cache/tests/text-flow
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/src firmware/tests/image_rle_test.cpp -o .cache/tests/image-rle
	.cache/tests/image-rle
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/src firmware/tests/request_body_test.cpp -o .cache/tests/request-body
	.cache/tests/request-body
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-I firmware/src -I firmware/.pio/libdeps/sdpro/ArduinoJson/src \
		firmware/tests/free_text_frame_test.cpp -o .cache/tests/free-text-frame
	.cache/tests/free-text-frame
	$(CXX) -std=c++17 -Wall -Wextra -Werror -fsanitize=address,undefined -g \
		-DCOVERAGE_TEST -DPROGMEM= -I firmware/src firmware/tests/coverage_font_test.cpp \
		firmware/src/CoverageFonts.generated.cpp -o .cache/tests/coverage-font
	.cache/tests/coverage-font
