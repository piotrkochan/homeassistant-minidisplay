"""MDI2 image codec tests."""

import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    "image_codec",
    Path(__file__).parents[1]
    / "custom_components/mini_display/image_codec.py",
)
codec = importlib.util.module_from_spec(spec)
spec.loader.exec_module(codec)


class ImageCodecTests(unittest.TestCase):
    def test_round_trip_mixed_packets(self):
        pixels = b"\x00\xf8" * 140 + b"\xe0\x07\x1f\x00\xff\xff"
        encoded = codec.encode_rgb565(143, 1, pixels)

        width, height, decoded = codec.decode_rgb565(encoded)

        self.assertEqual(encoded[:4], b"MDI2")
        self.assertEqual((width, height), (143, 1))
        self.assertEqual(decoded, pixels)
        self.assertLess(len(encoded), len(pixels))

    def test_literal_worst_case_stays_bounded(self):
        pixels = b"".join(value.to_bytes(2, "little") for value in range(256))
        encoded = codec.encode_rgb565(16, 16, pixels)

        self.assertLessEqual(len(encoded), 8 + len(pixels) + 16 * 3)
        self.assertEqual(codec.decode_rgb565(encoded)[2], pixels)

    def test_rejects_old_and_malformed_images(self):
        with self.assertRaises(codec.ImageCodecError):
            codec.decode_rgb565(b"MDI1\x01\x00\x01\x00\x80\x00\x00")
        with self.assertRaises(codec.ImageCodecError):
            codec.decode_rgb565(b"MDI2\x01\x00\x01\x00\x81\x00\x00")
        with self.assertRaises(codec.ImageCodecError):
            codec.decode_rgb565(b"MDI2\x01\x00\x01\x00\x00\x00")


if __name__ == "__main__":
    unittest.main()
