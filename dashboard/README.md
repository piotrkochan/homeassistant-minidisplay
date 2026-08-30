# Dashboard format

`dashboard.schema.json` is the version 1 contract between dashboard authors,
Home Assistant adapters, and device firmware. It deliberately contains no
pixel coordinates or dimensions.

## Layout rules

- A dashboard contains ordered pages.
- Each page is displayed for `durationSeconds`; the default comes from
  `defaults.pageDurationSeconds`.
- A page contains 1-6 rows. Rows share all available height proportionally to
  `weight`, after optional page and row titles are measured.
- A row contains 1-3 cards. Cards receive equal width: 100%, 50%, or one third.
- `showTitle` overrides `defaults.showRowTitle`. A missing row `title` reserves
  no title space regardless of this setting.
- Page `showTitle: false` hides its title and gives that space to rows.
- Renderer chooses fonts, padding, truncation, and exact geometry based on
  available card size. Documents must not contain coordinates or dimensions.
- `fontFamily` selects `sans`, `sans-bold`, `mono`, or `serif`. `fontSize`
  selects a semantic size from `auto` through `xlarge`; it never represents
  pixels. Cards may use `style`, `titleStyle`, and `valueStyle` independently.
- Page rotation skips pages with `enabled: false`.

## Data binding

`source` is a logical key. It may equal a Home Assistant entity ID, but firmware
must not depend on that convention. A transport adapter maps current values to
these keys. Static text cards use `text` instead of `source`.

## Number cards

`minimum` and `maximum` define the progress scale. They are required by the
renderer when `progress` is `bar` or `ring`; JSON Schema cannot conveniently
express every cross-field display rule, so firmware validation must enforce it.

## Resource limits

The schema permits more content than a 240x240 screen can render legibly.
Firmware should reject configurations exceeding its fixed memory budget and
warn when a chosen row/card combination cannot fit its minimum font sizes.
