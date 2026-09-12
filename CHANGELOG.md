# Changelog

## v0.2.0

Changes since v0.1.1.

### Features

- support animated gif images
- add temporary notification overlays with titles, messages, icons, severity
  levels, configurable placement, stacking and independent timeouts
- send and dismiss notifications through Home Assistant or the local API, with
  configurable API protection
- transform numeric values
- show firmware update warning
- configure marquee step size
- replace doors with cascade
- apply transitions to all pages
- limit full page scrolling to vertical directions
- pace data with display refresh
- configure display refresh rate
- configure marquee effects and timing
- control automatic page rotation
- compress image assets
- synchronize display images
- align free layout text
- add conditional page visibility
- add chart appearance controls
- choose background chart style

### Fixes

- stage image assets transactionally and restore evicted assets when dashboard activation fails
- reclaim obsolete display images when storage is too low for a dashboard update
- compact dashboard payloads from schema
- reduce gif artifacts
- speed up image uploads and animated frame updates
- persist value transformers
- hide free layout coordinates
- stack schema on mobile
- preserve page title bounds
- smooth fast marquee intervals
- batch display value updates
- grow page json memory adaptively
- accelerate push transitions
- preserve disabled marquee settings
- compact dashboard transfers
- protect wifi memory during notifications
- size scrolling text by height
- scroll values in both layouts
- block marquee during transitions
- advance curtain edges together
- preserve rotation during navigation
- align animation tiles and timing
- preserve cropped image pixels
- refresh old and new text bounds
- preserve display spi configuration
- defer navigation rendering
- apply mapped text color to titles
- smooth marquee updates
- restore device panel reactivity
- add preview schema tabs
- remove disabled chart containers
- preserve unit spacing
- hide graph entity selection for card data

### Refactoring

- replace the legacy immediate renderer with one retained scene graph shared by
  row and free layouts, screenshots, live updates and page transitions
- compile cards into bounded render nodes with source dependency indexes, then
  redraw only merged dirty regions instead of rebuilding the complete page
- compose scenes through a reusable RGB565 tile buffer and windowed SPI writes,
  without a full framebuffer or display memory readback
- move page transitions, marquee text and animated images onto one frame
  scheduler and animation timeline
- retain both scenes during motion transitions and transfer complete cropped
  strips, keeping moving layers correctly composed
- cache the active page definition in a right-sized JSON arena and stream page
  discovery instead of repeatedly parsing the complete dashboard
- rework image rendering around sparse RLE row indexes, visible-region decoding
  and reusable decoded rows
- index bundled smooth-font glyphs in flash and render them directly, avoiding
  repeated font allocations between animation bands
- move reusable rendering buffers off the stack and keep repeated drawing paths
  bounded and allocation-free
- split the monolithic firmware entry point into focused modules for scene and
  text compilation, values, settings, fonts, startup screens and diagnostics
- centralize the dashboard schema, generate the integration copy and compact
  device payloads from schema metadata
- extract Home Assistant data pacing, value batching, numeric transforms and
  asset synchronization into dedicated components

### Diagnostics and testing

- capture ESP8266 crash details in RTC memory without storing raw stack data
- add optional cycle, frame, heap, stack and fragmentation profiling for the
  rendering and API paths
- add sanitizer-backed native coverage for scene composition, dirty regions,
  transitions, marquee, fonts, notifications and image decoding
- build the device web panel and run animated-image and notification browser
  regressions in CI
- verify that the canonical dashboard schema and generated integration schema
  remain synchronized
