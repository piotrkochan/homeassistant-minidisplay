"""Persistent display-ready image assets."""

from __future__ import annotations

import base64
import re
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .api import MiniDisplayClient

STORE_VERSION = 1
STORE_KEY_PREFIX = "mini_display.assets"
ASSET_ID_PATTERN = re.compile(r"^[a-f0-9]{16}$")
MAX_ASSETS = 24
MAX_ASSET_BYTES = 2 * 1024 * 1024 + 8


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

    async def async_load(self) -> None:
        """Load persisted assets."""
        stored = await self._store.async_load() or {}
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
        if not 10 <= len(content) <= MAX_ASSET_BYTES:
            raise AssetValidationError("Optimized image is too large")
        if content[:4] != b"MDI1":
            raise AssetValidationError("Unsupported image format")
        header_width = int.from_bytes(content[4:6], "little")
        header_height = int.from_bytes(content[6:8], "little")
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

    async def async_sync(self, asset_ids: set[str]) -> None:
        """Ensure every referenced asset exists on the physical display."""
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
        }
        for asset_id in sorted(asset_ids - remote_ids):
            await self._client.async_put_asset(
                asset_id, base64.b64decode(self._assets[asset_id]["data"])
            )

    async def _async_save(self) -> None:
        await self._store.async_save({"assets": list(self._assets.values())})
