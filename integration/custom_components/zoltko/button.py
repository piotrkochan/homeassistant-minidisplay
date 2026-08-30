"""Command buttons for a Zoltko display."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.const import EntityCategory

from .entity import ZoltkoEntity


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    coordinator = hass.data["zoltko"][entry.entry_id]["coordinator"]
    async_add_entities(
        [
            ZoltkoCommandButton(coordinator, "next_page", "Next page", "next"),
            ZoltkoCommandButton(
                coordinator, "previous_page", "Previous page", "previous"
            ),
            ZoltkoCommandButton(coordinator, "reload_dashboard", "Reload dashboard", "reload"),
            ZoltkoRestartButton(coordinator),
        ]
    )


class ZoltkoCommandButton(ZoltkoEntity, ButtonEntity):
    def __init__(self, coordinator, key: str, name: str, command: str) -> None:
        super().__init__(coordinator, key)
        self._attr_name = name
        self._command = command

    async def async_press(self) -> None:
        await self.coordinator.client.async_page_command(self._command)
        await self.coordinator.async_request_refresh()


class ZoltkoRestartButton(ZoltkoEntity, ButtonEntity):
    _attr_name = "Restart"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "restart")

    async def async_press(self) -> None:
        await self.coordinator.client.async_restart()
