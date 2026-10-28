"""Verify the synthetic App-to-QA relay without dispatching to GitHub."""

import copy
import unittest
from unittest.mock import MagicMock, Mock

from autonomous_development import Blocked, GitHub, ROOT, REPO
from gh_aw_policy import QA_DISPATCH_EVENT
from gh_aw_qa_dispatch import dispatch_repair_qa


class DispatchAPI:
    def __init__(self):
        self.run = {
            "id": 202, "run_attempt": 2, "path": ".github/workflows/ci.yml",
            "event": "pull_request", "status": "completed", "conclusion": "success",
            "repository": {"full_name": REPO}, "head_repository": {"full_name": REPO},
            "head_branch": "luxe-pilot/90", "head_sha": "a" * 40,
            "actor": {"id": 40, "type": "Bot", "login": "luxe-repair-app[bot]"},
            "pull_requests": [{"number": 91, "head": {"sha": "a" * 40}}],
        }
        self.calls = []

    def request(self, method, path, data=None):
        self.calls.append((method, path, copy.deepcopy(data)))
        if method == "GET":
            return copy.deepcopy(self.run)
        return None


class RepairDispatchTests(unittest.TestCase):
    def setUp(self):
        self.api = DispatchAPI()
        self.event = {"workflow_run": {"id": 202, "run_attempt": 2}}
        self.policy = {"qa_enabled": True, "repair_enabled": True, "repair_bot_id": 40}

    def test_only_successful_same_repository_app_ci_is_relayed(self):
        dispatch_repair_qa(self.api, self.event, self.policy)
        self.assertEqual(self.api.calls[0][:2], ("GET", f"{ROOT}/actions/runs/202"))
        self.assertEqual(self.api.calls[1], (
            "POST", f"{ROOT}/dispatches", {
                "event_type": QA_DISPATCH_EVENT,
                "client_payload": {"run_id": 202, "run_attempt": 2},
            },
        ))

    def test_untrusted_or_incomplete_ci_never_dispatches(self):
        for change in (
            {"actor": {"id": 41, "type": "Bot"}},
            {"actor": {"id": 40, "type": "User"}},
            {"conclusion": "failure"},
            {"path": ".github/workflows/untrusted.yml"},
            {"repository": {"full_name": "outside/repo"}},
            {"head_repository": {"full_name": "outside/fork"}},
        ):
            with self.subTest(change=change):
                self.setUp()
                self.api.run.update(change)
                with self.assertRaises(Blocked):
                    dispatch_repair_qa(self.api, self.event, self.policy)
                self.assertFalse(any(call[0] == "POST" for call in self.api.calls))

    def test_disabled_pilot_and_stale_attempt_never_dispatch(self):
        self.policy["repair_enabled"] = False
        with self.assertRaises(Blocked):
            dispatch_repair_qa(self.api, self.event, self.policy)
        self.assertFalse(self.api.calls)

        self.setUp()
        self.api.run["run_attempt"] = 1
        with self.assertRaises(Blocked):
            dispatch_repair_qa(self.api, self.event, self.policy)
        self.assertFalse(any(call[0] == "POST" for call in self.api.calls))

    def test_github_no_content_dispatch_response_is_successful(self):
        response = MagicMock()
        response.status = 204
        response.__enter__.return_value = response
        api = GitHub("synthetic-token", dry_run=False)
        api.opener = Mock()
        api.opener.open.return_value = response
        self.assertIsNone(api.request("POST", f"{ROOT}/dispatches", {}))


if __name__ == "__main__":
    unittest.main()
