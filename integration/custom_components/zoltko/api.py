"""Async local HTTP client for Zoltko displays."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from aiohttp import ClientError, ClientResponseError, ClientSession, ClientTimeout

from .const import API_VERSION, REQUEST_TIMEOUT_SECONDS


class ZoltkoApiError(Exception):
    """Base error raised by the Zoltko API client."""


class ZoltkoAuthError(ZoltkoApiError):
    """Authentication failed."""


class ZoltkoConnectionError(ZoltkoApiError):
    """The display could not be reached."""


class ZoltkoInvalidResponseError(ZoltkoApiError):
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


class ZoltkoClient:
    """Bounded asynchronous client for API version 1."""

    def __init__(
        self,
        session: ClientSession,
        host: str,
        api_token: str,
        port: int = 80,
    ) -> None:
        self._session = session
        self._base_url = f"http://{host}:{port}/api/v1"
        self._headers = {"Authorization": f"Bearer {api_token}"}
        self._timeout = ClientTimeout(total=REQUEST_TIMEOUT_SECONDS)

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        expect_json: bool = True,
    ) -> dict[str, Any]:
        try:
            async with self._session.request(
                method,
                f"{self._base_url}{path}",
                headers=self._headers,
                json=json,
                timeout=self._timeout,
            ) as response:
                if response.status in (401, 403):
                    raise ZoltkoAuthError("Display rejected API credentials")
                response.raise_for_status()
                if not expect_json or response.status == 204:
                    return {}
                payload = await response.json(content_type=None)
                if not isinstance(payload, dict):
                    raise ZoltkoInvalidResponseError("Expected a JSON object")
                return payload
        except ZoltkoApiError:
            raise
        except (ClientError, TimeoutError) as err:
            raise ZoltkoConnectionError(str(err)) from err

    async def async_get_info(self) -> DeviceInfo:
        payload = await self._request("GET", "/info")
        try:
            info = DeviceInfo(
                device_id=str(payload["deviceId"]),
                name=str(payload.get("name", "Zoltko")),
                model=str(payload["model"]),
                firmware_version=str(payload["firmwareVersion"]),
                api_version=int(payload["apiVersion"]),
                width=int(payload["width"]),
                height=int(payload["height"]),
                capabilities=tuple(str(item) for item in payload.get("capabilities", [])),
            )
        except (KeyError, TypeError, ValueError) as err:
            raise ZoltkoInvalidResponseError("Invalid /info response") from err
        if info.api_version != API_VERSION:
            raise ZoltkoInvalidResponseError(
                f"Unsupported API version {info.api_version}; expected {API_VERSION}"
            )
        return info

    async def async_get_status(self) -> dict[str, Any]:
        return await self._request("GET", "/status")

    async def async_set_display(
        self, *, on: bool | None = None, brightness: int | None = None
    ) -> None:
        body: dict[str, Any] = {}
        if on is not None:
            body["on"] = on
        if brightness is not None:
            body["brightness"] = max(0, min(100, brightness))
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

    async def async_put_dashboard(self, dashboard: dict[str, Any]) -> None:
        await self._request(
            "PUT", "/dashboard", json=dashboard, expect_json=False
        )

    async def async_patch_values(self, values: dict[str, Any]) -> None:
        await self._request(
            "PATCH", "/data", json={"values": values}, expect_json=False
        )

