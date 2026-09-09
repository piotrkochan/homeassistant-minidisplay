# Scene renderer

## Goal

Use one retained-mode renderer for every dashboard layout and animation. Rows
and free layout only calculate geometry. They must not select different drawing
paths.

The visual output, dashboard schema, transitions, timing controls and Home
Assistant UI remain compatible. The change is internal: less parsing, fewer
screen writes, bounded memory use and no renderer competing with another one.

## Hardware constraints

The tested display is 240 x 240 RGB565 on an ESP8266. A complete framebuffer
requires 115,200 bytes and two transition frames require 230,400 bytes. Neither
fits safely in RAM. ST7789 GRAM stores the visible pixels, but reliable readback
has not been established on the no-CS SD PRO and must not be assumed.

Rendering therefore uses:

- a retained logical scene
- bounded dirty rectangles
- one reusable RGB565 tile buffer
- windowed SPI updates
- no GRAM readback on the SD PRO

Conceptually the complete frame is composed before display. Physically it is
composed and flushed in small tiles.

## Pipeline

```text
dashboard JSON
    |
    v
layout compiler (rows or free)
    |
    v
Scene with sorted RenderNode objects
    |
    +-- entity and history updates
    +-- clock ticks
    +-- marquee and other animations
    +-- visibility changes
    |
    v
dirty rectangle collection and merging
    |
    v
tile compositor
    |
    v
windowed RGB565 SPI flush
```

## Scene model

Each visible primitive becomes a node. Initial node types:

- page and card backgrounds
- text
- image
- rectangle and rounded rectangle
- line
- circle and arc
- progress bar and ring
- graph
- weather glyph

Each node owns or references:

- stable identifier
- type and payload
- current bounds
- clipping rectangle
- z-index
- opacity and visibility
- entity dependencies
- visual revision

Nodes are stored in bounded arrays. Strings, styles and payloads use bounded
pools. Rendering must not allocate memory.

Rows compile their weights and gaps into absolute coordinates. Free layout
compiles percentage frames into absolute coordinates. Both produce the same
node types.

## Entity dependencies

The compiler builds a dependency index from each of the maximum 32 data sources
to the nodes that use it. An entity update invalidates only dependent nodes.

Changing a node invalidates the union of its previous and current bounds. The
area is expanded for outlines, shadows and antialiasing coverage.

## Dirty rectangles

The dirty set is bounded. New rectangles are clipped to display bounds and
merged when they overlap, touch, or when one combined SPI update is cheaper
than two separate updates.

If the set overflows or covers most of the display, it collapses into one larger
rectangle. A configuration or page replacement invalidates the full display.

For every dirty tile the compositor:

1. paints the page background
2. selects nodes intersecting the tile
3. draws them in z-index order
4. blends text, images and effects against already composed lower layers
5. flushes the finished RGB565 tile to the ST7789

Transparent nodes never read pixels from the physical display. Lower layers
are recreated from the scene.

## Scheduling

HTTP handlers only mutate state and enqueue invalidation. They never draw.

The main loop owns one frame scheduler. It coalesces changes and renders at most
one frame at a time. Missed animation deadlines are not replayed as bursts.
After a frame completes, the following deadline is calculated from completion
time.

Network and watchdog servicing happens between completed tiles, never halfway
through drawing one primitive into a tile.

## Animations

Target: every page transition is a pixel exchange between immutable snapshots A and B.
It must never parse JSON, measure fonts, decode the same image region or paint
the same scene region again for every animation frame.

Current implementation retains two immutable scenes, not two complete raster
snapshots. Reveal effects paint only the newly exposed area. Slide and bounce
translate both scenes; doors translates two halves of the outgoing scene.
Non-overlapping source rectangles cover every destination pixel exactly once.
Each output tile is completely composed before transfer to the LCD.
Cropped tiles compact their existing RGB565 buffer in-place before transfer,
so a narrow crop opens one LCD window rather than one window per scanline.

All effects use TransitionPlan for changed source rectangles, one
SceneAnimationTimeline and the same four-row traversal. The plan freezes
geometry once per frame, including easing. Effects do not draw or delay.
The tile buffer has 960 RGB565 pixels (1920 bytes). No transition reads GRAM,
owns a full framebuffer or writes temporary snapshots to flash. Glyphs and graph
fills skip invisible pixels before rasterization; image seeks reuse their latest
row position. An optional cache of four raw decoded image rows (at most 2 KiB)
reuses overlapping crops within a band. It requires 8 KiB of remaining heap
reserve and is released with the transition renderer. This is not a frame cache.
Both compiled scene descriptions remain alive until the transition finishes;
individual hidden nodes are not freed during a transition.
Full-frame motion still rerenders scene content, so constant frame
rate is not guaranteed on ESP8266. A bounded pixel-snapshot cache remains future
work rather than a claimed completed optimization.

Built-in 18/24px VLW text now uses a generated flash-only glyph offset index.
Scene rendering reads the original 8-bit alpha pixels directly, preserving VLW
metrics and RGB565 blending without TFT_eSPI loadFont/unloadFont cycles for
each band. Previously each reload allocated seven metric tables and yielded
once for every one of the 218 glyphs. User-uploaded fonts retain the library
path. Startup screens are unchanged. Regenerate the index with
`python3 firmware/scripts/index_smooth_fonts.py` after changing the VLW assets
(also run by `make build`).

Marquee updates a text node offset by one configured step, invalidates its clip
rectangle and schedules the next step after the current frame completes.
Both its scheduler and its drawing entry point refuse updates while a page
transition is active. The incoming page starts its marquee pause after completion.

Page transitions retain current and next scenes. Existing transition equations,
directions, speeds and seeded random order remain unchanged where they are
compatible with monotonic pixel replacement. Missed deadlines skip directly to
the newest position and never replay old frames.

Updates received during a transition are accepted and coalesced. They are
applied after the transition without replaying intermediate frames.

## Images and transparency

Image assets remain compressed in LittleFS. The image decoder renders only the
requested tile rows. Opaque RGB565 RLE remains the fast path. Transparent assets
will use a bounded mask or alpha representation and blend in the tile buffer.

No decoded full-screen image is retained in RAM.

## Memory budget

Initial targets:

- scene nodes and dependency index: at most 3 KB per active scene
- shared text and payload pools: at most 2 KB per active scene
- RGB565 tile buffer: 240 x 8 x 2 = 3,840 bytes
- dirty regions and scheduler state: below 512 bytes
- no heap allocation in repeated render and animation paths

Transitions may retain two compact scenes. Their combined size must remain
bounded and validated at compile time.

## Migration

- [x] Add bounded geometry, scene, dependency and dirty-region types
- [x] Add native tests for invalidation, merging and scheduler deadlines
- [x] Share geometry calculations between rows, free layout and transitions
- [x] Add the bounded RGB565 tile compositor and dirty/full equivalence tests
- [x] Extract and test the existing motion transition math
- [x] Compile every current card primitive into the scene representation
- [ ] Compare complete legacy and scene frames pixel by pixel
- [x] Retain the active scene for updates, screenshots and transitions
- [ ] Update retained payloads without parsing dashboard JSON
- [ ] Move marquee, clocks and graphs onto scene invalidation
- [x] Move every page transition onto the shared scene painter
- [x] Remove direct drawing and old layout-specific render paths
- [ ] Move every transition to validated pixel snapshots

SD PRO correction: the GRAM readback path was removed from the renderer. Its
no-CS SDA read path reinitializes SPI and loses the write configuration. Motion
now composites retained scenes and is no longer silently replaced with wipe.

Each migration step must build independently. Firmware is flashed only after
native tests, firmware build, pixel comparison and memory inspection pass.

## Implementation status

- complete: bounded scene graph, dependency index and mutation API
- complete: shared rows and free-layout geometry primitives
- complete: dirty-region scheduler and 240 x 8 RGB565 tile compositor
- complete: randomized dirty-render versus full-render comparison
- complete: transition timing and motion math extracted from the legacy renderer
- complete: every dashboard card compiles to retained scene nodes
- complete: active scene is retained across data updates and transitions
- complete: runtime drawing, screenshots and transitions use one scene painter
- complete: image rendering uses bounded sparse row indexes
- complete: marquee mutates retained text offsets and uses scene tiles
- complete: active page definition is parsed once and retained in a right-sized arena
- complete: changed values and clock ticks reuse the parsed definition
- pending: update value payloads without rebuilding scene geometry

## Page definition cache

The complete dashboard remains in LittleFS and HTTP streams that file unchanged.
Only the current page's parsed ArduinoJson object tree is cached. It contains
layout settings and rules, not live values. The initial 8 KiB arena is shrunk to
actual usage after parsing and is freed before loading another page. Dashboard
uploads invalidate it, including rejected uploads, so the old file can reload
without holding the cache during validation. `pageDefinitionBytes` and
`pageDefinitionParses` expose the actual cost and parse count in status.

This removes repeated file reads and JSON parsing during live updates. Value
updates still rebuild compact scene payloads from the parsed definition; full
typed bindings are a separate remaining optimization.

## Verification

- compare legacy and scene output pixel by pixel for saved dashboards
- compare every transition at representative progress values
- test dirty rendering against a full rerender after randomized mutations
- fuzz rectangle clipping and merging
- verify no allocation occurs during steady-state frames
- measure render and SPI time separately
- monitor free heap, largest free block, fragmentation, watchdog resets and boot ID
- verify entity updates, page rotation and network requests during animations

## References

- [LVGL partial rendering](https://docs.lvgl.io/9.0/porting/display.html)
- [TFT_eSPI sprites and memory](https://github.com/Bodmer/TFT_eSPI/blob/master/examples/Sprite/Sprite_scroll/Sprite_scroll.ino)
- [TFT_eSPI capabilities](https://github.com/Bodmer/TFT_eSPI/blob/master/README.md)
- [ESP8266 crash and heap diagnostics](https://arduino-esp8266.readthedocs.io/en/stable/faq/a02-my-esp-crashes.html)
