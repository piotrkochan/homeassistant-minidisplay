"""Dashboard persistence and Home Assistant state forwarding."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime
from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Event, HomeAssistant, State, callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event
from homeassistant.helpers.storage import Store

from .api import MiniDisplayClient

STORE_VERSION = 1
STORE_KEY_PREFIX = "mini_display.dashboard"
DATA_BATCH_DELAY_SECONDS = 0.25


class DashboardValidationError(ValueError):
    """A dashboard violates the version 1 structural contract."""

    def __init__(self, message: str, path: str = "/") -> None:
        super().__init__(message)
        self.path = path


def validate_dashboard(document: Any) -> dict[str, Any]:
    """Validate bounded structure before firmware performs final validation."""
    if not isinstance(document, dict):
        raise DashboardValidationError("Dashboard must be an object")
    if document.get("version") != 1:
        raise DashboardValidationError("Only schema version 1 is supported", "/version")
    pages = document.get("pages")
    if not isinstance(pages, list) or not 1 <= len(pages) <= 16:
        raise DashboardValidationError("Dashboard requires 1-16 pages", "/pages")
    seen_pages: set[str] = set()
    for page_index, page in enumerate(pages):
        page_path = f"/pages/{page_index}"
        if not isinstance(page, dict):
            raise DashboardValidationError("Page must be an object", page_path)
        page_id = page.get("id")
        if not isinstance(page_id, str) or not page_id or len(page_id) > 32:
            raise DashboardValidationError("Page id must contain 1-32 characters", f"{page_path}/id")
        if page_id in seen_pages:
            raise DashboardValidationError("Page id must be unique", f"{page_path}/id")
        seen_pages.add(page_id)
        duration = page.get("durationSeconds")
        if duration is not None and (not isinstance(duration, int) or not 1 <= duration <= 86400):
            raise DashboardValidationError("durationSeconds must be 1-86400", f"{page_path}/durationSeconds")
        rows = page.get("rows")
        if not isinstance(rows, list) or not 1 <= len(rows) <= 6:
            raise DashboardValidationError("Page requires 1-6 rows", f"{page_path}/rows")
        for row_index, row in enumerate(rows):
            row_path = f"{page_path}/rows/{row_index}"
            if not isinstance(row, dict):
                raise DashboardValidationError("Row must be an object", row_path)
            cards = row.get("cards")
            if not isinstance(cards, list) or not 1 <= len(cards) <= 3:
                raise DashboardValidationError("Row requires 1-3 cards", f"{row_path}/cards")
            for card_index, card in enumerate(cards):
                card_path = f"{row_path}/cards/{card_index}"
                if not isinstance(card, dict):
                    raise DashboardValidationError("Card must be an object", card_path)
                if card.get("type") not in {"clock", "number", "status", "text"}:
                    raise DashboardValidationError("Unsupported card type", f"{card_path}/type")
                source = card.get("source")
                if source is not None and (not isinstance(source, str) or len(source) > 64):
                    raise DashboardValidationError("Invalid source", f"{card_path}/source")
                if card.get("type") in {"number", "status"} and not source:
                    raise DashboardValidationError("Card type requires source", f"{card_path}/source")
                if card.get("type") == "text" and not source and "text" not in card:
                    raise DashboardValidationError("Text card requires source or text", card_path)
                if card.get("type") == "number" and card.get("progress", "none") != "none":
                    if "minimum" not in card or "maximum" not in card:
                        raise DashboardValidationError(
                            "Progress requires minimum and maximum", card_path
                        )
    return document


def extract_sources(document: dict[str, Any]) -> set[str]:
    """Return all unique Home Assistant entity IDs referenced by cards."""
    return {
        card["source"]
        for page in document["pages"]
        for row in page["rows"]
        for card in row["cards"]
        if isinstance(card.get("source"), str) and card["source"]
    }


def serialize_state(state: State | None) -> dict[str, Any]:
    """Serialize state without exposing arbitrary large attributes."""
    if state is None:
        return {"state": "unknown", "available": False, "lastChanged": None}
    return {
        "state": state.state,
        "available": state.state not in (STATE_UNKNOWN, STATE_UNAVAILABLE),
        "lastChanged": state.last_changed.isoformat(),
    }


class MiniDisplayDashboardManager:
    """Own one display dashboard and its entity subscriptions."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry_id: str,
        client: MiniDisplayClient,
    ) -> None:
        self.hass = hass
        self.entry_id = entry_id
        self.client = client
        self.dashboard: dict[str, Any] | None = None
        self.sources: set[str] = set()
        self._store: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{STORE_KEY_PREFIX}.{entry_id}"
        )
        self._unsubscribe_states: Callable[[], None] | None = None
        self._cancel_batch: Callable[[], None] | None = None
        self._pending_sources: set[str] = set()

    async def async_load(self) -> None:
        stored = await self._store.async_load()
        if stored is None:
            return
        self.dashboard = validate_dashboard(stored)
        self._replace_subscriptions()

    async def async_apply(self, document: dict[str, Any]) -> None:
        validated = validate_dashboard(document)
        await self.client.async_put_dashboard(validated)
        self.dashboard = validated
        await self._store.async_save(validated)
        self._replace_subscriptions()
        await self.async_send_snapshot()

    async def async_send_snapshot(self) -> None:
        if not self.sources:
            return
        values = {
            entity_id: serialize_state(self.hass.states.get(entity_id))
            for entity_id in self.sources
        }
        await self.client.async_patch_values(values)

    def _replace_subscriptions(self) -> None:
        if self._unsubscribe_states is not None:
            self._unsubscribe_states()
            self._unsubscribe_states = None
        self.sources = extract_sources(self.dashboard) if self.dashboard else set()
        if self.sources:
            self._unsubscribe_states = async_track_state_change_event(
                self.hass, self.sources, self._state_changed
            )

    @callback
    def _state_changed(self, event: Event) -> None:
        entity_id = event.data["entity_id"]
        self._pending_sources.add(entity_id)
        if self._cancel_batch is None:
            self._cancel_batch = async_call_later(
                self.hass, DATA_BATCH_DELAY_SECONDS, self._flush_pending
            )

    async def _flush_pending(self, _now: datetime) -> None:
        self._cancel_batch = None
        pending, self._pending_sources = self._pending_sources, set()
        values = {
            entity_id: serialize_state(self.hass.states.get(entity_id))
            for entity_id in pending
        }
        if values:
            await self.client.async_patch_values(values)

    def close(self) -> None:
        if self._unsubscribe_states is not None:
            self._unsubscribe_states()
        if self._cancel_batch is not None:
            self._cancel_batch()

