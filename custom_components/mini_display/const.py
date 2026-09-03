"""Constants for the MiniDisplay integration."""

from __future__ import annotations

from pathlib import Path

DOMAIN = "mini_display"
PLATFORMS = ["binary_sensor", "button", "light", "number", "select", "sensor"]

CONF_API_TOKEN = "api_token"
CONF_DEVICE_ID = "device_id"

API_VERSION = 1
DEFAULT_NAME = "Home Assistant Mini-Display"
DEFAULT_PORT = 80
DEFAULT_SCAN_INTERVAL_SECONDS = 30
REQUEST_TIMEOUT_SECONDS = 5

FRONTEND_DIR = Path(__file__).parent / "frontend"
FRONTEND_URL = "/mini_display/frontend/mini-display-panel.js"
LEGACY_FRONTEND_URL = "/mini_display/frontend/mini-display-dashboard-card.js"
PANEL_URL_PATH = "mini-display"
PANEL_WEB_COMPONENT = "mini-display-panel"
SIGNAL_SCENES_UPDATED = f"{DOMAIN}_scenes_updated"
