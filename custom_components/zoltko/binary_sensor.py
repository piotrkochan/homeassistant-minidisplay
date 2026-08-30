"""Connectivity sensor."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.const import EntityCategory

from .entity import ZoltkoEntity


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    async_add_entities([ZoltkoConnectivity(hass.data["zoltko"][entry.entry_id]["coordinator"])])


class ZoltkoConnectivity(ZoltkoEntity, BinarySensorEntity):
    _attr_name = "Connectivity"
    _attr_device_class = BinarySensorDeviceClass.CONNECTIVITY
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "connectivity")

    @property
    def is_on(self) -> bool:
        return self.coordinator.last_update_success
