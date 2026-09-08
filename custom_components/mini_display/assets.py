"""Persistent display-ready image assets."""

from __future__ import annotations

import base64
import binascii
import logging
import re
import struct
import zlib
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .api import MiniDisplayApiError, MiniDisplayClient

STORE_VERSION = 1
STORE_KEY_PREFIX = "mini_display.assets"
ASSET_ID_PATTERN = re.compile(r"^[a-f0-9]{16}$")
MAX_ASSETS = 24
MAX_ASSET_BYTES = 2 * 1024 * 1024 + 8
PREVIEW_MAX_DIMENSION = 120

_LOGGER = logging.getLogger(__name__)


class AssetValidationError(ValueError):
    """An image asset is invalid."""


class MiniDisplayAssetManager:
    """Store optimized images in HA and synchronize them to one display."""

    def __init__(
        self, hass: HomeAssistant, entry_id: str, client: MiniDisplayClient
    ) -> None:
        self._store: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{STORE_KEY_PREFIX}.{entry_id}"
        )
        self._client = client
        self._assets: dict[str, dict[str, Any]] = {}
        self._import_complete = False

    async def async_load(self) -> None:
        """Load persisted assets."""
        stored = await self._store.async_load()
        stored = stored or {}
        self._import_complete = stored.get("importComplete") is True
        raw_assets = stored.get("assets", [])
        if isinstance(raw_assets, list):
            self._assets = {
                item["id"]: item
                for item in raw_assets
                if isinstance(item, dict)
                and isinstance(item.get("id"), str)
                and ASSET_ID_PATTERN.fullmatch(item["id"])
                and isinstance(item.get("data"), str)
            }
        if not self._import_complete:
            try:
                await self._async_import_from_display()
            except MiniDisplayApiError as err:
                _LOGGER.warning("Could not import images from Mini Display: %s", err)

    def list(self, *, include_data: bool = False) -> list[dict[str, Any]]:
        """Return asset metadata, optionally with previewable binary data."""
        result = []
        for asset in self._assets.values():
            item = {key: value for key, value in asset.items() if key != "data"}
            if include_data:
                item["data"] = asset["data"]
            result.append(item)
        return result

    async def async_put(
        self,
        asset_id: str,
        name: str,
        width: int,
        height: int,
        encoded: str,
        preview: str,
    ) -> dict[str, Any]:
        """Validate and persist one browser-optimized asset."""
        if not ASSET_ID_PATTERN.fullmatch(asset_id):
            raise AssetValidationError("Invalid asset id")
        if not 1 <= width <= 1024 or not 1 <= height <= 1024:
            raise AssetValidationError("Image dimensions must be 1-1024 pixels")
        try:
            content = base64.b64decode(encoded, validate=True)
        except (ValueError, TypeError) as err:
            raise AssetValidationError("Invalid image data") from err
        header_width, header_height = _validate_mdi(content)
        if header_width != width or header_height != height:
            raise AssetValidationError("Image metadata does not match payload")
        if len(self._assets) >= MAX_ASSETS and asset_id not in self._assets:
            raise AssetValidationError(f"A display can keep at most {MAX_ASSETS} images")
        asset = {
            "id": asset_id,
            "name": name.strip()[:80] or "Image",
            "width": width,
            "height": height,
            "bytes": len(content),
            "data": encoded,
            "preview": preview[:100000] if preview.startswith("data:image/") else "",
        }
        self._assets[asset_id] = asset
        await self._async_save()
        return {key: value for key, value in asset.items() if key != "data"}

    async def async_delete(self, asset_id: str) -> None:
        """Delete an asset from HA and the physical display."""
        self._assets.pop(asset_id, None)
        await self._async_save()
        await self._client.async_delete_asset(asset_id)

    async def async_sync(self, asset_ids: set[str]) -> set[str]:
        """Upload missing referenced assets and return remote asset ids."""
        missing = asset_ids - self._assets.keys()
        if missing:
            raise AssetValidationError(
                f"Missing image asset: {sorted(missing)[0]}"
            )
        remote = await self._client.async_get_assets()
        remote_ids = {
            str(item.get("id"))
            for item in remote.get("assets", [])
            if isinstance(item, dict)
            and ASSET_ID_PATTERN.fullmatch(str(item.get("id", "")))
        }
        for asset_id in sorted(asset_ids - remote_ids):
            await self._client.async_put_asset(
                asset_id, base64.b64decode(self._assets[asset_id]["data"])
            )
            remote_ids.add(asset_id)
        return remote_ids

    async def async_prune(self, keep: set[str], remote_ids: set[str]) -> None:
        """Remove images not used by the dashboard currently on the display."""
        for asset_id in sorted(remote_ids - keep):
            try:
                await self._client.async_delete_asset(asset_id)
            except MiniDisplayApiError as err:
                _LOGGER.warning(
                    "Could not remove unused Mini Display image %s: %s",
                    asset_id,
                    err,
                )

    async def _async_import_from_display(self) -> None:
        """Seed a new HA image library from images already on the display."""
        remote = await self._client.async_get_assets()
        complete = True
        for item in remote.get("assets", []):
            if not isinstance(item, dict):
                complete = False
                continue
            asset_id = str(item.get("id", ""))
            if asset_id in self._assets:
                continue
            if (
                not ASSET_ID_PATTERN.fullmatch(asset_id)
                or len(self._assets) >= MAX_ASSETS
            ):
                complete = False
                continue
            try:
                content = await self._client.async_get_asset(asset_id)
                width, height = _validate_mdi(content)
            except (AssetValidationError, MiniDisplayApiError) as err:
                complete = False
                _LOGGER.warning(
                    "Could not import Mini Display image %s: %s", asset_id, err
                )
                continue
            if width != item.get("width") or height != item.get("height"):
                complete = False
                _LOGGER.warning(
                    "Could not import Mini Display image %s: metadata mismatch",
                    asset_id,
                )
                continue
            self._assets[asset_id] = {
                "id": asset_id,
                "name": f"Display image {asset_id[:8]}",
                "width": width,
                "height": height,
                "bytes": len(content),
                "data": base64.b64encode(content).decode(),
                "preview": _mdi_preview(content, width, height),
            }
        self._import_complete = complete
        await self._async_save()

    async def _async_save(self) -> None:
        await self._store.async_save(
            {
                "importComplete": self._import_complete,
                "assets": list(self._assets.values()),
            }
        )


def _validate_mdi(content: bytes) -> tuple[int, int]:
    """Validate display-ready RGB565 data and return its dimensions."""
    if len(content) < 10 or content[:4] != b"MDI1":
        raise AssetValidationError("Unsupported image format")
    width = int.from_bytes(content[4:6], "little")
    height = int.from_bytes(content[6:8], "little")
    if (
        not 1 <= width <= 1024
        or not 1 <= height <= 1024
        or len(content) != 8 + width * height * 2
        or len(content) > MAX_ASSET_BYTES
    ):
        raise AssetValidationError("Invalid image data")
    return width, height


def _png_chunk(kind: bytes, payload: bytes) -> bytes:
    body = kind + payload
    return (
        struct.pack(">I", len(payload))
        + body
        + struct.pack(">I", binascii.crc32(body))
    )


def _mdi_preview(content: bytes, width: int, height: int) -> str:
    """Create a small browser preview without adding an image dependency to HA."""
    step = max(
        1,
        (max(width, height) + PREVIEW_MAX_DIMENSION - 1)
        // PREVIEW_MAX_DIMENSION,
    )
    preview_width = (width + step - 1) // step
    preview_height = (height + step - 1) // step
    rows = bytearray()
    for y in range(0, height, step):
        rows.append(0)
        for x in range(0, width, step):
            offset = 8 + (y * width + x) * 2
            color = content[offset] | (content[offset + 1] << 8)
            rows.extend(
                (
                    ((color >> 11) & 0x1F) * 255 // 31,
                    ((color >> 5) & 0x3F) * 255 // 63,
                    (color & 0x1F) * 255 // 31,
                )
            )
    signature = b"\x89PNG\r\n\x1a\n"
    png = b"".join(
        (
            signature,
            _png_chunk(
                b"IHDR",
                struct.pack(
                    ">IIBBBBB", preview_width, preview_height, 8, 2, 0, 0, 0
                ),
            ),
            _png_chunk(b"IDAT", zlib.compress(bytes(rows), 9)),
            _png_chunk(b"IEND", b""),
        )
    )
    return "data:image/png;base64," + base64.b64encode(png).decode()
