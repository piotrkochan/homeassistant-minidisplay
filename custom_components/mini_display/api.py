"""Async local HTTP client for MiniDisplay displays."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

from aiohttp import ClientError, ClientSession, ClientTimeout

from .const import (
    API_VERSION,
    DEFAULT_HTTPS_PORT,
    DEFAULT_PORT,
    FEATURE_TLS,
    REQUEST_TIMEOUT_SECONDS,
)


class MiniDisplayApiError(Exception):
    """Base error raised by the MiniDisplay API client."""


class MiniDisplayAuthError(MiniDisplayApiError):
    """Authentication failed."""


class MiniDisplayConnectionError(MiniDisplayApiError):
    """The display could not be reached."""


class MiniDisplayInvalidResponseError(MiniDisplayApiError):
    """The display returned an incompatible response."""


@dataclass(frozen=True, slots=True)
class DeviceInfo:
    """Stable identity and capabilities returned by a display."""

    device_id: str
    name: str
    model: str
    firmware_version: str
    api_version: int
    width: int
    height: int
    capabilities: tuple[str, ...]


class MiniDisplayClient:
    """Bounded asynchronous client for API version 1."""

    def __init__(
        self,
        session: ClientSession,
        host: str,
        api_token: str,
        port: int = 80,
        *,
        use_ssl: bool = False,
        verify_ssl: bool = True,
    ) -> None:
        self._session = session
        self._host = host
        self._port = port
        self._use_ssl = use_ssl if FEATURE_TLS else False
        self._verify_ssl = verify_ssl
        self._active_transport: tuple[bool, int] | None = None
        self._headers = (
            {"Authorization": f"Bearer {api_token}"} if api_token else {}
        )
        self._timeout = ClientTimeout(total=REQUEST_TIMEOUT_SECONDS)
        self._request_lock = asyncio.Lock()

    @property
    def configured_use_ssl(self) -> bool:
        """Return the transport selected in the config entry."""
        return self._use_ssl

    @property
    def active_use_ssl(self) -> bool | None:
        """Return the transport used by the most recent successful request."""
        return self._active_transport[0] if self._active_transport else None

    def _transports(self) -> tuple[tuple[bool, int], ...]:
        if not FEATURE_TLS:
            return ((False, self._port),)
        configured = (self._use_ssl, self._port)
        fallback = (
            (False, DEFAULT_PORT)
            if self._use_ssl
            else (True, DEFAULT_HTTPS_PORT)
        )
        ordered = [self._active_transport, configured, fallback]
        result: list[tuple[bool, int]] = []
        for transport in ordered:
            if transport is not None and transport not in result:
                result.append(transport)
        return tuple(result)

    async def _request_transport(
        self,
        method: str,
        path: str,
        transport: tuple[bool, int],
        *,
        json: dict[str, Any] | None,
        expect_json: bool,
    ) -> dict[str, Any]:
        use_ssl, port = transport
        scheme = "https" if use_ssl else "http"
        ssl = self._verify_ssl if use_ssl else None
        async with self._session.request(
            method,
            f"{scheme}://{self._host}:{port}/api/v1{path}",
            headers=self._headers,
            json=json,
            timeout=self._timeout,
            ssl=ssl,
            allow_redirects=False,
        ) as response:
            if response.status in (401, 403):
                raise MiniDisplayAuthError("Display rejected API credentials")
            response.raise_for_status()
            self._active_transport = transport
            if not expect_json or response.status == 204:
                return {}
            payload = await response.json(content_type=None)
            if not isinstance(payload, dict):
                raise MiniDisplayInvalidResponseError("Expected a JSON object")
            return payload

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        expect_json: bool = True,
    ) -> dict[str, Any]:
        async with self._request_lock:
            last_error: ClientError | TimeoutError | None = None
            for transport in self._transports():
                try:
                    return await self._request_transport(
                        method,
                        path,
                        transport,
                        json=json,
                        expect_json=expect_json,
                    )
                except MiniDisplayApiError:
                    raise
                except (ClientError, TimeoutError) as err:
                    last_error = err
            raise MiniDisplayConnectionError(str(last_error)) from last_error

    async def async_get_info(self) -> DeviceInfo:
        payload = await self._request("GET", "/info")
        try:
            info = DeviceInfo(
                device_id=str(payload["deviceId"]),
                name=str(payload.get("name", "Home Assistant Mini-Display")),
                model=str(payload["model"]),
                firmware_version=str(payload["firmwareVersion"]),
                api_version=int(payload["apiVersion"]),
                width=int(payload["width"]),
                height=int(payload["height"]),
                capabilities=tuple(str(item) for item in payload.get("capabilities", [])),
            )
        except (KeyError, TypeError, ValueError) as err:
            raise MiniDisplayInvalidResponseError("Invalid /info response") from err
        if info.api_version != API_VERSION:
            raise MiniDisplayInvalidResponseError(
                f"Unsupported API version {info.api_version}; expected {API_VERSION}"
            )
        return info

    async def async_get_status(self) -> dict[str, Any]:
        return await self._request("GET", "/status")

    async def async_set_display(
        self,
        *,
        on: bool | None = None,
        brightness: int | None = None,
        pixel_shift: int | None = None,
        timezone: str | None = None,
    ) -> None:
        body: dict[str, Any] = {}
        if on is not None:
            body["on"] = on
        if brightness is not None:
            body["brightness"] = max(0, min(100, brightness))
        if pixel_shift is not None:
            body["pixelShift"] = max(0, min(10, pixel_shift))
        if timezone is not None:
            body["timezone"] = timezone
        await self._request("PUT", "/display", json=body, expect_json=False)

    async def async_set_page(self, page_id: str) -> None:
        body = {"mode": "auto"} if page_id == "auto" else {"id": page_id}
        await self._request("POST", "/page", json=body, expect_json=False)

    async def async_page_command(self, command: str) -> None:
        await self._request(
            "POST", "/page", json={"command": command}, expect_json=False
        )

    async def async_restart(self) -> None:
        await self._request("POST", "/restart", json={}, expect_json=False)

    async def async_put_dashboard(
        self, dashboard: dict[str, Any], *, render: bool = True
    ) -> None:
        await self._request(
            "PUT",
            f"/dashboard?render={'true' if render else 'false'}",
            json=dashboard,
            expect_json=False,
        )

    async def async_patch_values(
        self, values: dict[str, Any], *, render: bool = True
    ) -> None:
        await self._request(
            "PATCH",
            "/data",
            json={"values": values, "render": render},
            expect_json=False,
        )
