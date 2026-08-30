"""State coordinator for a Zoltko display."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import ZoltkoApiError, ZoltkoClient
from .const import DEFAULT_SCAN_INTERVAL_SECONDS, DOMAIN


class ZoltkoCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Poll status while commands are sent directly through the same client."""

    def __init__(
        self, hass: HomeAssistant, entry: ConfigEntry, client: ZoltkoClient
    ) -> None:
        super().__init__(
            hass,
            logger=__import__("logging").getLogger(__name__),
            name=f"{DOMAIN}-{entry.entry_id}",
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL_SECONDS),
        )
        self.entry = entry
        self.client = client
        self.device_info = None

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            if self.device_info is None:
                self.device_info = await self.client.async_get_info()
            return await self.client.async_get_status()
        except ZoltkoApiError as err:
            raise UpdateFailed(str(err)) from err

