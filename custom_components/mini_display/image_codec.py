"""Mini Display RLE image codec."""

from __future__ import annotations

MAGIC = b"MDI2"
HEADER_BYTES = 8
MAX_DIMENSION = 1024
MAX_PIXELS = MAX_DIMENSION * MAX_DIMENSION
MAX_ENCODED_BYTES = (
    HEADER_BYTES
    + MAX_PIXELS * 2
    + MAX_DIMENSION * (2 + (MAX_DIMENSION + 127) // 128)
)


class ImageCodecError(ValueError):
    """An MDI2 image is malformed."""


def encode_rgb565(width: int, height: int, pixels: bytes) -> bytes:
    """Encode little-endian RGB565 pixels using packet RLE."""
    if (
        not 1 <= width <= MAX_DIMENSION
        or not 1 <= height <= MAX_DIMENSION
        or len(pixels) != width * height * 2
    ):
        raise ImageCodecError("Invalid image dimensions or pixel data")
    output = bytearray(MAGIC)
    output.extend(width.to_bytes(2, "little"))
    output.extend(height.to_bytes(2, "little"))
    def equal(left: int, right: int) -> bool:
        left *= 2
        right *= 2
        return pixels[left : left + 2] == pixels[right : right + 2]

    for row in range(height):
        row_end = (row + 1) * width
        source = row * width
        encoded_row = bytearray()
        while source < row_end:
            run = 1
            while (
                run < 128
                and source + run < row_end
                and equal(source, source + run)
            ):
                run += 1
            if run >= 2:
                encoded_row.append(0x80 | (run - 1))
                encoded_row.extend(pixels[source * 2 : source * 2 + 2])
                source += run
                continue
            literal_start = source
            source += 1
            while source - literal_start < 128 and source < row_end:
                run = 1
                while (
                    run < 2
                    and source + run < row_end
                    and equal(source, source + run)
                ):
                    run += 1
                if run >= 2:
                    break
                source += 1
            encoded_row.append(source - literal_start - 1)
            encoded_row.extend(pixels[literal_start * 2 : source * 2])
        output.extend(len(encoded_row).to_bytes(2, "little"))
        output.extend(encoded_row)
    return bytes(output)


def decode_rgb565(content: bytes) -> tuple[int, int, bytes]:
    """Validate and decode an MDI2 image."""
    if len(content) < HEADER_BYTES + 3 or content[:4] != MAGIC:
        raise ImageCodecError("Unsupported image format")
    width = int.from_bytes(content[4:6], "little")
    height = int.from_bytes(content[6:8], "little")
    if not 1 <= width <= MAX_DIMENSION or not 1 <= height <= MAX_DIMENSION:
        raise ImageCodecError("Invalid image dimensions")
    expected = width * height * 2
    pixels = bytearray()
    offset = HEADER_BYTES
    for _ in range(height):
        if offset + 2 > len(content):
            raise ImageCodecError("Missing image row")
        row_bytes = int.from_bytes(content[offset : offset + 2], "little")
        offset += 2
        row_end = offset + row_bytes
        if row_bytes == 0 or row_end > len(content):
            raise ImageCodecError("Invalid image row size")
        row_pixels = 0
        while offset < row_end and row_pixels < width:
            control = content[offset]
            offset += 1
            count = (control & 0x7F) + 1
            byte_count = count * 2
            if control & 0x80:
                if offset + 2 > row_end:
                    raise ImageCodecError("Truncated image run")
                pixels.extend(content[offset : offset + 2] * count)
                offset += 2
            else:
                if offset + byte_count > row_end:
                    raise ImageCodecError("Truncated image literals")
                pixels.extend(content[offset : offset + byte_count])
                offset += byte_count
            row_pixels += count
            if row_pixels > width:
                raise ImageCodecError("Image row contains too many pixels")
        if offset != row_end or row_pixels != width:
            raise ImageCodecError("Image row width does not match its dimensions")
    if offset != len(content) or len(pixels) != expected:
        raise ImageCodecError("Image pixel count does not match its dimensions")
    return width, height, bytes(pixels)
