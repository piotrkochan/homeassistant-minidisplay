"""Preview ownership/lifecycle tests; run in a Home Assistant environment."""

import asyncio
from copy import deepcopy
import sys
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock, Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from custom_components.mini_display import dashboard as module


class PreviewTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.manager = module.MiniDisplayDashboardManager.__new__(module.MiniDisplayDashboardManager)
        manager = self.manager
        manager.hass = Mock()
        manager._preview_lock = asyncio.Lock()
        manager._cancel_preview = None
        manager.preview_scene_id = None
        manager.preview_owner = None
        manager.active_scene_id = "default"
        self.saved = {"version": 1, "pages": [{"id": "page", "rows": [{"cards": [{"type": "text", "text": "Saved"}]}]}]}
        manager.scenes = {"default": {"dashboard": deepcopy(self.saved)}}
        manager._async_send_dashboard = AsyncMock()
        manager._async_save = AsyncMock()
        manager._replace_subscriptions = Mock()
        self.timer = patch.object(module, "async_call_later", return_value=Mock())
        self.timer.start()
        self.addCleanup(self.timer.stop)
        self.owner = object()

    async def test_draft_update_never_changes_saved_scene(self):
        draft = deepcopy(self.saved)
        draft["pages"][0]["rows"][0]["cards"][0]["text"] = "Draft"
        await self.manager.async_start_preview("default", "page", draft, self.owner)
        draft["pages"][0]["rows"][0]["cards"][0]["text"] = "Latest"
        await self.manager.async_start_preview("default", "page", draft, self.owner, update=True)
        self.assertEqual(self.manager.scenes["default"]["dashboard"], self.saved)
        self.assertEqual(self.manager.preview_dashboard["pages"][0]["rows"][0]["cards"][0]["text"], "Latest")
        await self.manager.async_stop_preview(self.owner)
        self.assertIsNone(self.manager.preview_scene_id)
        self.manager._async_send_dashboard.assert_awaited_with(self.saved)
        with self.assertRaises(module.DashboardValidationError):
            await self.manager.async_start_preview("default", "page", draft, self.owner, update=True)

    async def test_other_connection_cannot_update_preview(self):
        await self.manager.async_start_preview("default", owner=self.owner)
        with self.assertRaises(module.DashboardValidationError):
            await self.manager.async_start_preview("default", owner=object(), update=True)

    async def test_page_preview_does_not_send_other_pages(self):
        draft = deepcopy(self.saved)
        draft["pages"].append({"id":"other", "rows":[{"cards":[{"type":"text", "text":"Other"}]}]})
        await self.manager.async_start_preview("default", "page", draft, self.owner)
        sent = self.manager._async_send_dashboard.await_args.args
        self.assertEqual(len(sent), 1)
        self.assertEqual([page["id"] for page in sent[0]["pages"]], ["page"])
        self.assertEqual(len(draft["pages"]), 2)

    async def test_save_preserves_preview_but_stores_all_pages(self):
        draft = deepcopy(self.saved)
        draft["pages"].append({"id": "second", "rows": [{"cards": [{"type": "text", "text": "Second"}]}]})
        await self.manager.async_start_preview("default", "second", draft, self.owner)
        await self.manager.async_apply(draft, scene_id="default")
        self.assertIs(self.manager.preview_owner, self.owner)
        self.assertEqual(self.manager.preview_page_id, "second")
        self.assertEqual([page["id"] for page in self.manager._async_send_dashboard.await_args.args[0]["pages"]], ["second"])
        self.assertEqual(len(self.manager.scenes["default"]["dashboard"]["pages"]), 2)
        await self.manager.async_stop_preview(self.owner)
        self.assertEqual(len(self.manager._async_send_dashboard.await_args.args[0]["pages"]), 2)

    async def test_save_after_preview_page_removed_selects_existing_page(self):
        draft = deepcopy(self.saved)
        draft["pages"].append({"id": "second", "rows": [{"cards": [{"type": "text", "text": "Second"}]}]})
        await self.manager.async_start_preview("default", "second", draft, self.owner)
        await self.manager.async_apply(self.saved, scene_id="default")
        self.assertEqual(self.manager.preview_page_id, "page")
        self.assertIs(self.manager.preview_owner, self.owner)

    async def test_stop_waits_for_inflight_update(self):
        await self.manager.async_start_preview("default", owner=self.owner)
        entered, release = asyncio.Event(), asyncio.Event()
        async def send(*args):
            entered.set()
            await release.wait()
        self.manager._async_send_dashboard.side_effect = send
        update = asyncio.create_task(self.manager.async_start_preview("default", owner=self.owner, update=True))
        await entered.wait()
        stop = asyncio.create_task(self.manager.async_stop_preview(self.owner))
        await asyncio.sleep(0)
        self.assertFalse(stop.done())
        release.set()
        await asyncio.gather(update, stop)
        self.assertIsNone(self.manager.preview_scene_id)

    def test_page_visibility_uses_entity_conditions(self):
        visibility = {
            "rules": [{
                "id": "rule_a",
                "source": "entity",
                "entity": "binary_sensor.show_page",
                "operator": "equals",
                "match": "on",
            }],
            "expression": {
                "type": "group",
                "operator": "and",
                "children": [{"type": "rule", "ruleId": "rule_a"}],
            },
        }
        dashboard = deepcopy(self.saved)
        dashboard["pages"][0]["visibility"] = visibility
        dashboard["pages"].append({
            "id": "always",
            "rows": [{"cards": [{"type": "text", "text": "Always"}]}],
        })
        validated = module.validate_dashboard(dashboard)
        hass = SimpleNamespace(states={
            "binary_sensor.show_page": SimpleNamespace(state="off")
        })

        rendered = module.render_dashboard(validated, hass)

        self.assertEqual([page["id"] for page in rendered["pages"]], ["always"])
        self.assertEqual(
            module.extract_visibility_sources(validated),
            {"binary_sensor.show_page"},
        )
        self.assertIn("binary_sensor.show_page", module.extract_sources(validated))

    def test_page_visibility_rejects_card_value(self):
        dashboard = deepcopy(self.saved)
        dashboard["pages"][0]["visibility"] = {
            "rules": [{
                "id": "rule_a",
                "source": "card",
                "operator": "available",
            }],
            "expression": {
                "type": "group",
                "operator": "and",
                "children": [{"type": "rule", "ruleId": "rule_a"}],
            },
        }

        with self.assertRaises(module.DashboardValidationError):
            module.validate_dashboard(dashboard)

    def test_hidden_pages_have_safe_fallback(self):
        dashboard = deepcopy(self.saved)
        dashboard["pages"][0]["visibility"] = {
            "rules": [{
                "id": "rule_a",
                "source": "entity",
                "entity": "binary_sensor.show_page",
                "operator": "available",
            }],
            "expression": {
                "type": "group",
                "operator": "and",
                "children": [{"type": "rule", "ruleId": "rule_a"}],
            },
        }
        hass = SimpleNamespace(states={})

        rendered = module.render_dashboard(
            module.validate_dashboard(dashboard), hass
        )

        self.assertEqual(rendered["pages"][0]["id"], "no_visible_pages")


if __name__ == "__main__":
    unittest.main()
