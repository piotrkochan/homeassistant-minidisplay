"""Build flash-only glyph offsets for the existing VLW assets without rerasterizing."""
import re
import struct
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = (root / "src/fonts/InterTightSmooth.h").read_text()
lines = ['// Generated from existing Inter Tight VLW assets under SIL OFL 1.1',
         '#include "StaticSmoothFont.h"']
cases = []
for name, body in re.findall(r'const uint8_t (InterTightSmooth(?:18|24))\[\] PROGMEM = \{(.*?)\};', source, re.S):
    data = bytes(int(value, 16) for value in re.findall(r'0x([0-9A-Fa-f]{2})', body))
    count, _, size, _, ascent, descent = struct.unpack_from('>6I', data)
    position = 24 + 28 * count
    offsets = []
    maximum_descent = descent
    last_code = -1
    for index in range(count):
        code, height, width, advance, dy, dx, _ = struct.unpack_from('>7i', data, 24 + 28 * index)
        assert code > last_code
        last_code = code
        offsets.append(position)
        position += width * height
        assert position <= len(data)
        if (32 < code < 160 and code != 127) or code > 255:
            maximum_descent = max(maximum_descent, height - dy)
    lines.append(f'static const uint32_t offsets{size}[] PROGMEM = {{')
    for start in range(0, count, 12):
        lines.append('  ' + ', '.join(map(str, offsets[start:start + 12])) + ',')
    lines.append('};')
    cases.append(f'  if (size == {size} && count == {count}) return {{data, offsets{size}, {count}, {ascent}, {descent}, {ascent + maximum_descent}, {(ascent + descent) * 2 // 7}}};')
assert len(cases) == 2
lines += ['StaticSmoothFont indexedSmoothFont(const uint8_t *data) {',
          '  if (!data) return {};',
          '  const uint32_t count = smoothWord(data), size = smoothWord(data + 8);',
          *cases, '  return {};', '}', '']
(root / 'src/StaticSmoothFonts.generated.cpp').write_text('\n'.join(lines))
