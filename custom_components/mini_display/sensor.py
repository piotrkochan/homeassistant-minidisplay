"""Diagnostic and dashboard status sensors."""

from __future__ import annotations

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.const import EntityCategory, PERCENTAGE, UnitOfInformation

from .entity import MiniDisplayEntity

SENSORS = (
    ("current_page", "Current page", "page", None, None),
    ("wifi_signal", "Wi-Fi signal", "wifiRssiDbm", SensorDeviceClass.SIGNAL_STRENGTH, "dBm"),
    ("uptime", "Uptime", "uptimeSeconds", SensorDeviceClass.DURATION, "s"),
    ("free_heap", "Free heap", "freeHeapBytes", SensorDeviceClass.DATA_SIZE, UnitOfInformation.BYTES),
    ("firmware_version", "Firmware version", "firmwareVersion", None, None),
    ("last_sync", "Last synchronization", "lastSync", SensorDeviceClass.TIMESTAMP, None),
)


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    coordinator = hass.data["mini_display"][entry.entry_id]["coordinator"]
    async_add_entities(MiniDisplaySensor(coordinator, *definition) for definition in SENSORS)


class MiniDisplaySensor(MiniDisplayEntity, SensorEntity):
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator, key, name, status_key, device_class, unit) -> None:
        super().__init__(coordinator, key)
        self._attr_name = name
        self._status_key = status_key
        self._attr_device_class = device_class
        self._attr_native_unit_of_measurement = unit

    @property
    def native_value(self):
        if self._status_key == "firmwareVersion":
            info = self.coordinator.device_info
            return info.firmware_version if info else None
        return self.coordinator.data.get(self._status_key)
