"""Active dashboard page selector."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity

from .entity import MiniDisplayEntity


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    async_add_entities([MiniDisplayPageSelect(hass.data["mini_display"][entry.entry_id]["coordinator"])])


class MiniDisplayPageSelect(MiniDisplayEntity, SelectEntity):
    _attr_name = "Active page"

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "active_page")

    @property
    def current_option(self) -> str | None:
        if self.coordinator.data.get("rotation") == "auto":
            return "auto"
        return self.coordinator.data.get("page")

    @property
    def options(self) -> list[str]:
        pages = self.coordinator.data.get("pages", [])
        return ["auto", *(str(page) for page in pages)]

    async def async_select_option(self, option: str) -> None:
        await self.coordinator.client.async_set_page(option)
        await self.coordinator.async_request_refresh()
