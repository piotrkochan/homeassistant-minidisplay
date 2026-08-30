"""Display brightness control."""

from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.const import PERCENTAGE

from .const import DOMAIN
from .entity import MiniDisplayEntity


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    """Set up the display brightness slider."""
    coordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    async_add_entities([MiniDisplayBrightnessNumber(coordinator)])


class MiniDisplayBrightnessNumber(MiniDisplayEntity, NumberEntity):
    """Control display brightness as a percentage."""

    _attr_name = "Brightness"
    _attr_icon = "mdi:brightness-6"
    _attr_native_min_value = 0
    _attr_native_max_value = 100
    _attr_native_step = 1
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_mode = NumberMode.SLIDER

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "brightness")

    @property
    def native_value(self) -> float | None:
        """Return current brightness percentage."""
        value = self.coordinator.data.get("brightness")
        return float(value) if value is not None else None

    async def async_set_native_value(self, value: float) -> None:
        """Set brightness and turn the display on."""
        await self.coordinator.client.async_set_display(
            on=True, brightness=round(value)
        )
        await self.coordinator.async_request_refresh()
