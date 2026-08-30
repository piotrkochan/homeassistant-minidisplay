"""Constants for the Zoltko integration."""

from __future__ import annotations

from pathlib import Path

DOMAIN = "zoltko"
PLATFORMS = ["binary_sensor", "button", "light", "select", "sensor"]

CONF_API_TOKEN = "api_token"
CONF_DEVICE_ID = "device_id"

API_VERSION = 1
DEFAULT_NAME = "Zoltko"
DEFAULT_PORT = 80
DEFAULT_SCAN_INTERVAL_SECONDS = 30
REQUEST_TIMEOUT_SECONDS = 5

FRONTEND_DIR = Path(__file__).parent / "frontend"
FRONTEND_URL = "/zoltko/frontend/zoltko-dashboard-card.js"

