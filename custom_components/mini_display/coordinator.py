"""State coordinator for a MiniDisplay display."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigEntryAuthFailed
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import MiniDisplayApiError, MiniDisplayAuthError, MiniDisplayClient
from .const import DEFAULT_SCAN_INTERVAL_SECONDS, DOMAIN


class MiniDisplayCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Poll status while commands are sent directly through the same client."""

    def __init__(
        self, hass: HomeAssistant, entry: ConfigEntry, client: MiniDisplayClient
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
            status = await self.client.async_get_status()
            status["lastSync"] = datetime.now(UTC)
            return status
        except MiniDisplayAuthError as err:
            raise ConfigEntryAuthFailed("Device password was rejected") from err
        except MiniDisplayApiError as err:
            raise UpdateFailed(str(err)) from err
