"""MiniDisplay local display integration."""

from __future__ import annotations

import hashlib
from pathlib import Path

import voluptuous as vol

from homeassistant.components import panel_custom, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.resources import ResourceStorageCollection
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, CONF_PORT
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import MiniDisplayClient
from .const import (
    CONF_API_TOKEN,
    DOMAIN,
    FRONTEND_DIR,
    FRONTEND_URL,
    LEGACY_FRONTEND_URL,
    PANEL_URL_PATH,
    PANEL_WEB_COMPONENT,
    PLATFORMS,
)
from .coordinator import MiniDisplayCoordinator
from .dashboard import DashboardValidationError, MiniDisplayDashboardManager


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Register frontend assets and integration WebSocket commands once."""
    hass.data.setdefault(DOMAIN, {})
    panel_path = FRONTEND_DIR / "mini-display-panel.js"
    if panel_path.exists():
        await hass.http.async_register_static_paths(
            [StaticPathConfig(FRONTEND_URL, str(panel_path), cache_headers=False)]
        )
        await _async_register_frontend_panel(hass, panel_path)
        await _async_remove_legacy_lovelace_card(hass)
    websocket_api.async_register_command(hass, websocket_list_displays)
    websocket_api.async_register_command(hass, websocket_get_dashboard)
    websocket_api.async_register_command(hass, websocket_set_dashboard)
    websocket_api.async_register_command(hass, websocket_show_page)
    return True


async def _async_register_frontend_panel(
    hass: HomeAssistant, panel_path: Path
) -> None:
    """Register the display manager as an administrator-only sidebar panel."""
    panel_bytes = await hass.async_add_executor_job(panel_path.read_bytes)
    content_hash = hashlib.sha256(panel_bytes).hexdigest()[:12]
    resource_url = f"{FRONTEND_URL}?v={content_hash}"
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_WEB_COMPONENT,
        frontend_url_path=PANEL_URL_PATH,
        module_url=resource_url,
        sidebar_title="Mini Displays",
        sidebar_icon="mdi:monitor-dashboard",
        embed_iframe=False,
        require_admin=True,
    )


async def _async_remove_legacy_lovelace_card(hass: HomeAssistant) -> None:
    """Remove the resource created by versions that shipped a Lovelace card."""
    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None)
    if resources is None and isinstance(lovelace, dict):
        resources = lovelace.get("resources")

    if isinstance(resources, ResourceStorageCollection):
        await resources.async_get_info()
        for item in list(resources.async_items()):
            item_url = item.get("url", "")
            if item_url.split("?", 1)[0] == LEGACY_FRONTEND_URL:
                await resources.async_delete_item(item["id"])


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up one configured display."""
    client = MiniDisplayClient(
        async_get_clientsession(hass),
        entry.data[CONF_HOST],
        entry.data[CONF_API_TOKEN],
        entry.data[CONF_PORT],
    )
    coordinator = MiniDisplayCoordinator(hass, entry, client)
    await coordinator.async_config_entry_first_refresh()
    dashboard = MiniDisplayDashboardManager(hass, entry.entry_id, client)
    await dashboard.async_load()
    hass.data[DOMAIN][entry.entry_id] = {
        "coordinator": coordinator,
        "dashboard": dashboard,
    }
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a display."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        runtime = hass.data[DOMAIN].pop(entry.entry_id, None)
        if runtime:
            runtime["dashboard"].close()
    return unloaded


@websocket_api.websocket_command({"type": "mini_display/displays"})
@websocket_api.async_response
async def websocket_list_displays(hass, connection, msg) -> None:
    """Return configured displays for the management panel."""
    displays = []
    for entry in hass.config_entries.async_entries(DOMAIN):
        runtime = hass.data.get(DOMAIN, {}).get(entry.entry_id)
        coordinator = runtime["coordinator"] if runtime else None
        displays.append(
            {
                "config_entry_id": entry.entry_id,
                "title": entry.title,
                "available": bool(coordinator and coordinator.last_update_success),
            }
        )
    connection.send_result(msg["id"], displays)


@websocket_api.websocket_command(
    {"type": "mini_display/dashboard/get", "config_entry_id": str}
)
@websocket_api.async_response
async def websocket_get_dashboard(hass, connection, msg) -> None:
    """Return the canonical dashboard stored for one display."""
    runtime = hass.data.get(DOMAIN, {}).get(msg["config_entry_id"])
    if runtime is None:
        connection.send_error(msg["id"], "not_found", "MiniDisplay display not found")
        return
    connection.send_result(msg["id"], runtime["dashboard"].dashboard)


@websocket_api.websocket_command(
    {
        "type": "mini_display/dashboard/set",
        "config_entry_id": str,
        "dashboard": dict,
        vol.Optional("page_id"): str,
    }
)
@websocket_api.async_response
async def websocket_set_dashboard(hass, connection, msg) -> None:
    """Validate, send, and persist one physical dashboard."""
    runtime = hass.data.get(DOMAIN, {}).get(msg["config_entry_id"])
    if runtime is None:
        connection.send_error(msg["id"], "not_found", "MiniDisplay display not found")
        return
    try:
        await runtime["dashboard"].async_apply(
            msg["dashboard"], msg.get("page_id")
        )
    except DashboardValidationError as err:
        connection.send_error(
            msg["id"], "invalid_dashboard", f"{err.path}: {err}"
        )
        return
    connection.send_result(msg["id"], {"accepted": True})


@websocket_api.websocket_command(
    {"type": "mini_display/page/show", "config_entry_id": str, "page_id": str}
)
@websocket_api.async_response
async def websocket_show_page(hass, connection, msg) -> None:
    """Show a page while it is being edited."""
    runtime = hass.data.get(DOMAIN, {}).get(msg["config_entry_id"])
    if runtime is None:
        connection.send_error(msg["id"], "not_found", "MiniDisplay display not found")
        return
    await runtime["coordinator"].client.async_set_page(msg["page_id"])
    connection.send_result(msg["id"], {"accepted": True})
