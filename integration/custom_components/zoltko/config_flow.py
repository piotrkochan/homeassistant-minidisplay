"""Config flow for local Zoltko displays."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import CONF_HOST, CONF_PORT
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import (
    ZoltkoAuthError,
    ZoltkoClient,
    ZoltkoConnectionError,
    ZoltkoInvalidResponseError,
)
from .const import CONF_API_TOKEN, CONF_DEVICE_ID, DEFAULT_PORT, DOMAIN


class ZoltkoConfigFlow(ConfigFlow, domain=DOMAIN):
    """Set up one display from UI or Zeroconf discovery."""

    VERSION = 1

    def __init__(self) -> None:
        self._discovered_host: str | None = None
        self._discovered_port = DEFAULT_PORT

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            result = await self._async_validate(user_input)
            if isinstance(result, dict):
                errors = result
            else:
                info, data = result
                await self.async_set_unique_id(info.device_id)
                self._abort_if_unique_id_configured(updates={CONF_HOST: data[CONF_HOST]})
                return self.async_create_entry(title=info.name, data=data)

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_HOST, default=self._discovered_host or "zoltko.local"
                ): str,
                vol.Required(CONF_PORT, default=self._discovered_port): int,
                vol.Required(CONF_API_TOKEN): str,
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    async def async_step_zeroconf(self, discovery_info) -> ConfigFlowResult:
        properties = discovery_info.properties
        device_id = properties.get("id")
        if not device_id:
            return self.async_abort(reason="invalid_discovery_info")
        await self.async_set_unique_id(device_id)
        self._abort_if_unique_id_configured(
            updates={CONF_HOST: discovery_info.host, CONF_PORT: discovery_info.port}
        )
        self._discovered_host = discovery_info.host
        self._discovered_port = discovery_info.port
        self.context["title_placeholders"] = {"name": discovery_info.name}
        return await self.async_step_user()

    async def _async_validate(self, user_input: dict[str, Any]):
        client = ZoltkoClient(
            async_get_clientsession(self.hass),
            user_input[CONF_HOST],
            user_input[CONF_API_TOKEN],
            user_input[CONF_PORT],
        )
        try:
            info = await client.async_get_info()
        except ZoltkoAuthError:
            return {"base": "invalid_auth"}
        except ZoltkoConnectionError:
            return {"base": "cannot_connect"}
        except ZoltkoInvalidResponseError:
            return {"base": "unsupported_device"}
        data = {
            CONF_HOST: user_input[CONF_HOST],
            CONF_PORT: user_input[CONF_PORT],
            CONF_API_TOKEN: user_input[CONF_API_TOKEN],
            CONF_DEVICE_ID: info.device_id,
        }
        return info, data

