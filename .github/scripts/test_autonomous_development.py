"""Synthetic controller tests; no network or Copilot tasks."""

import copy
import contextlib
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlsplit

import autonomous_development as controller


def config():
    return {
        "enabled": False, "capacity": 1, "approver_ids": [11],
        "controller_user_id": 22, "qa_reviewer_ids": [33],
        "excluded_issues": [58],
    }


def issue(number=70):
    handoff = {
        "risk": "L0", "base_branch": "master", "parent": 58,
        "dependencies": [], "allowed_files": [f"docs/qa/trial-{number}.md"],
        "problem": "Missing synthetic review checklist", "goal": "Reviewable checklist",
        "non_goals": "No deployment", "scope": "One documentation file",
        "forbidden_files": ["frontend/", "backend/"],
        "acceptance_criteria": ["Truthful review instructions"],
        "verification": ["Review instructions against repository"],
    }
    return {
        "number": number, "title": "Synthetic child", "state": "open",
        "body": controller.encode("handoff", handoff), "assignees": [],
        "labels": [{"name": "ready-for-agent"}, {"name": "autonomy:enabled"}],
        "sub_issues_summary": {"total": 0},
    }


def comment(kind, payload, author=11, comment_id=1):
    return {
        "id": comment_id, "user": {"id": author, "type": "User"},
        "body": controller.encode(kind, payload),
        "created_at": "2026-10-26T10:00:00Z", "updated_at": "2026-10-26T10:00:00Z",
    }


def approved(item):
    return comment("approval", {
        "issue": item["number"], "digest": controller.scope_digest(item), "risk": "L0",
        "allowed_files": controller.handoff(item)["allowed_files"],
        "verification": controller.handoff(item)["verification"],
    })


class FakeGitHub(controller.GitHub):
    def __init__(self, items=None, *, dry_run=True):
        self.dry_run = dry_run
        self.issues = copy.deepcopy(items if items is not None else [issue()])
        self.comments = {item["number"]: [approved(item)] for item in self.issues}
        for item in self.issues:
            item["comments"] = 1
        self.children, self.dependencies, self.timelines = {}, {}, {}
        self.pulls, self.reviews, self.tasks, self.task_details = [], [], [], {}
        self.files = [{"filename": "docs/qa/trial-70.md"}]
        self.runs = [{"id": 9, "path": ".github/workflows/ci.yml", "head_sha": "h" * 40,
                      "head_repository": {"full_name": controller.REPO}, "event": "pull_request",
                      "status": "completed", "conclusion": "success", "pull_requests": [
                          {"number": 80, "head": {"sha": "h" * 40}, "base": {"sha": "b" * 40}}]}]
        self.jobs = [{"name": name, "conclusion": "success"} for name in controller.REQUIRED_JOBS]
        self.switch = "true"
        self.calls, self.failures = [], {}
        self.after_write = None
        self.next_id = 100

    def request(self, method, path, data=None):
        self.calls.append((method, path, copy.deepcopy(data)))
        parsed = urlsplit(path)
        route, query = parsed.path.removeprefix(controller.ROOT), parse_qs(parsed.query)
        if parsed.path in self.failures:
            raise self.failures[parsed.path]
        if method != "GET":
            if self.dry_run:
                raise controller.Blocked("dry-run write")
            if route.endswith("/comments"):
                number = int(route.split("/")[2])
                value = comment("event", {}, author=22, comment_id=self.next_id)
                value["body"] = data["body"]
                self.next_id += 1
                self.comments.setdefault(number, []).append(value)
                for item in self.issues:
                    if item["number"] == number:
                        item["comments"] = len(self.comments[number])
            elif route.endswith("/assignees"):
                number = int(route.split("/")[2])
                value = {"assignees": [{"login": "copilot-swe-agent[bot]"}]}
                next(item for item in self.issues if item["number"] == number).update(value)
            elif route.endswith("/requested_reviewers"):
                value = {}
            else:
                raise AssertionError(f"unexpected write: {path}")
            if self.after_write:
                self.after_write(route, data)
            return copy.deepcopy(value)
        if route == "/issues":
            value = self.issues
        elif route == "/pulls":
            value = self.pulls
        elif route == "/branches/master":
            value = {"commit": {"sha": "b" * 40}}
        elif route == "/actions/variables/LUXE_AUTONOMY_ENABLED":
            value = {"value": self.switch}
        elif parsed.path == f"/agents/repos/{controller.REPO}/tasks":
            value = {"tasks": self.tasks}
        elif parsed.path.startswith(f"/agents/repos/{controller.REPO}/tasks/"):
            value = self.task_details[route.rsplit("/", 1)[-1]]
        elif route == "/actions/workflows/ci.yml/runs":
            value = {"workflow_runs": self.runs}
        elif route == "/actions/runs/9/jobs":
            value = {"jobs": self.jobs}
        elif route.startswith("/issues/"):
            number = int(route.split("/")[2])
            item = next(item for item in self.issues if item["number"] == number)
            suffix = "/".join(route.split("/")[3:])
            value = {
                "": item, "comments": self.comments.get(number, []),
                "sub_issues": self.children.get(number, []),
                "dependencies/blocked_by": self.dependencies.get(number, []),
                "parent": {"number": 58, "repository_url": "https://api.github.com" + controller.ROOT},
                "timeline": self.timelines.get(number, []),
            }[suffix]
        elif route.startswith("/pulls/"):
            value = (self.reviews if route.endswith("/reviews") else self.files if route.endswith("/files")
                     else next(pr for pr in self.pulls if pr["number"] == int(route.split("/")[2])))
        else:
            raise AssertionError(f"unexpected read: {path}")
        if "page" in query:
            start = (int(query["page"][0]) - 1) * 100
            if isinstance(value, list):
                value = value[start:start + 100]
            elif isinstance(value, dict):
                value = {key: entries[start:start + 100] for key, entries in value.items()}
        return copy.deepcopy(value)

    @property
    def writes(self):
        return [call for call in self.calls if call[0] != "GET"]

    def add_event(self, event, **extra):
        item = self.issues[0]
        record = comment("event", {"event": event, "issue": item["number"],
                         "digest": controller.scope_digest(item), **extra}, author=22, comment_id=self.next_id)
        self.next_id += 1
        self.comments[item["number"]].append(record)
        item["comments"] += 1
        return record

    def with_pr(self):
        self.add_event("reserved")
        self.pulls = [{"number": 80, "state": "open", "merged_at": None, "user": {"id": 44},
                       "head": {"sha": "h" * 40, "ref": "copilot/trial", "repo": {"full_name": controller.REPO}},
                       "base": {"sha": "b" * 40, "ref": "master", "repo": {"full_name": controller.REPO}}}]
        self.timelines[70] = [{"event": "cross-referenced", "source": {"issue": {
            "number": 80, "pull_request": {}, "repository_url": "https://api.github.com" + controller.ROOT}}}]
        self.timelines[70][0]["source"]["issue"]["pull_request"] = {"url": "synthetic"}
        self.tasks = [{"id": "task-1", "state": "completed"}]
        self.task_details = {"task-1": {"state": "completed", "sessions": [{"head_ref": "copilot/trial"}]}}
        return self

    def with_review(self, verdict="Accepted"):
        self.with_pr()
        reservation = self.add_event("qa-reserved", head="h" * 40, base="b" * 40, pr=80)
        report = {"head": "h" * 40, "base": "b" * 40, "reservation_id": reservation["id"],
                  "verdict": verdict, "checks": {key: {"status": "pass", "evidence": "Synthetic evidence"}
                                                 for key in controller.CHECKS}, "findings": []}
        self.reviews = [{"id": 200, "user": {"id": 33}, "commit_id": "h" * 40, "state": "COMMENTED",
                         "submitted_at": "2026-10-26T11:00:00Z", "body": controller.encode("qa", report)}]
        return self


class EligibilityTests(unittest.TestCase):
    def test_approved_leaf(self):
        item = issue()
        self.assertIsNone(controller.ineligible(item, [approved(item)], [], [], config()))

    def test_parent_58_is_always_rejected(self):
        item = issue(58)
        self.assertIsNotNone(controller.ineligible(item, [approved(item)], [], [], config()))

    def test_unapproved_is_rejected(self):
        self.assertIsNotNone(controller.ineligible(issue(), [], [], [], config()))

    def test_scope_change_invalidates_approval(self):
        item = issue()
        approval = approved(item)
        item["title"] = "Expanded scope"
        self.assertIsNotNone(controller.ineligible(item, [approval], [], [], config()))

    def test_edited_or_forged_approval(self):
        item = issue()
        for change in ({"user": {"id": 99}}, {"updated_at": "2026-10-27T10:00:00Z"}):
            approval = approved(item)
            approval.update(change)
            self.assertIsNotNone(controller.ineligible(item, [approval], [], [], config()))

    def test_sensitive_and_incomplete_scopes(self):
        for risk in ("L2", "L3", "L4"):
            item = issue()
            value = controller.handoff(item)
            value["risk"] = risk
            item["body"] = controller.encode("handoff", value)
            self.assertIsNotNone(controller.ineligible(item, [], [], [], config()))
        for path in ("../outside", ".github/workflows/ci.yml", "backend/tenancy/views.py",
                     "backend/brand/migrations/0010.py", "frontend/package.json", "docs/x/../y"):
            self.assertTrue(controller.forbidden(path), path)
        item = issue()
        item["body"] = "Not a handoff"
        self.assertIsNotNone(controller.ineligible(item, [], [], [], config()))

    def test_assigned_closed_parent_or_not_ready(self):
        for change in ({"assignees": [{"login": "human"}]}, {"state": "closed"},
                       {"labels": []}, {"sub_issues_summary": {"total": 1}}):
            item = issue()
            item.update(change)
            self.assertIsNotNone(controller.ineligible(item, [approved(item)], [], [], config()))

    def test_dependency_must_be_declared_and_completed(self):
        item = issue()
        scope = controller.handoff(item)
        scope["dependencies"] = [60]
        item["body"] = controller.encode("handoff", scope)
        for dependency in ({"number": 60, "state": "open"},
                           {"number": 60, "state": "closed", "state_reason": "not_planned"}):
            self.assertIsNotNone(controller.ineligible(item, [approved(item)], [], [dependency], config()))
        self.assertIsNotNone(controller.ineligible(item, [approved(item)], [], [], config()))
        self.assertIsNone(controller.ineligible(item, [approved(item)], [], [
            {"number": 60, "state": "closed", "state_reason": "completed"}], config()))

    def test_empty_allowlist_and_bot_approval_cannot_authorize(self):
        item = issue()
        approval = approved(item)
        self.assertIsNotNone(controller.ineligible(item, [approval], [], [], {**config(), "approver_ids": []}))
        approval["user"]["type"] = "Bot"
        self.assertIsNotNone(controller.ineligible(item, [approval], [], [], config()))

    def test_duplicate_handoff_blocks_are_ambiguous(self):
        item = issue()
        item["body"] += "\n" + item["body"]
        self.assertIsNotNone(controller.ineligible(item, [], [], [], config()))


class ReconciliationTests(unittest.TestCase):
    def test_dry_run_plans_without_writes(self):
        api = FakeGitHub()
        self.assertEqual(controller.reconcile(api, config())["actions"][0]["kind"], "dispatch")
        self.assertEqual(api.writes, [])

    def test_existing_unapproved_issues_are_untouched(self):
        api = FakeGitHub([issue(58), issue(70)])
        api.comments = {}
        plan = controller.reconcile(api, config())
        self.assertEqual(plan["actions"], [])
        self.assertIn("container", plan["reasons"][58])
        self.assertEqual(api.writes, [])

    def test_capacity_one_and_two_and_stable_order(self):
        for capacity in (1, 2):
            settings = {**config(), "capacity": capacity}
            api = FakeGitHub([issue(72), issue(70), issue(71)])
            self.assertEqual([a["issue"] for a in controller.reconcile(api, settings)["actions"]],
                             [70, 71][:capacity])

    def test_overlapping_files_do_not_run_together(self):
        first, second = issue(70), issue(71)
        second["body"] = first["body"]
        api = FakeGitHub([first, second])
        plan = controller.reconcile(api, {**config(), "capacity": 2})
        self.assertEqual(len(plan["actions"]), 1)
        self.assertIn("overlapping", plan["reasons"][71])

    def test_invalid_opted_in_issue_does_not_authorize_or_hide_other_reasons(self):
        api = FakeGitHub([issue(70), issue(71)])
        api.issues[0]["body"] = "missing handoff"
        plan = controller.reconcile(api, config())
        self.assertIn("invalid", plan["reasons"][70])
        self.assertEqual([a["issue"] for a in plan["actions"]], [71])

    def test_any_old_pr_reference_blocks_duplicate(self):
        api = FakeGitHub().with_pr()
        api.comments[70] = [approved(api.issues[0])]
        api.pulls[0].update(state="closed", merged_at="2026-10-26T12:00:00Z")
        self.assertEqual(controller.reconcile(api, config())["actions"], [])

    def test_reservation_without_assignment_or_pr_holds_capacity(self):
        api = FakeGitHub([issue(70), issue(71)])
        api.add_event("reserved")
        for _ in range(2):
            plan = controller.reconcile(api, config())
            self.assertEqual(plan["actions"], [])
            self.assertIn("never redispatch", plan["reasons"][70])

    def test_reservation_survives_removed_labels_and_closed_issue(self):
        api = FakeGitHub([issue(70), issue(71)])
        api.add_event("reserved")
        api.issues[0].update(labels=[], state="closed")
        self.assertEqual(controller.reconcile(api, config())["actions"], [])

    def test_tampered_and_duplicate_ledger_blocks(self):
        for mutate in (lambda api: api.add_event("reserved"),
                       lambda api: api.comments[70][-1].update(updated_at="edited")):
            api = FakeGitHub()
            api.add_event("reserved")
            mutate(api)
            with self.assertRaises(controller.Blocked):
                controller.reconcile(api, config())

    def test_api_failures_cannot_become_dispatch(self):
        for status in (403, 404, 429, 500):
            api = FakeGitHub()
            api.failures[controller.ROOT + "/issues/70/dependencies/blocked_by"] = controller.Blocked(str(status))
            with self.assertRaises(controller.Blocked):
                controller.reconcile(api, config())
            self.assertEqual(api.writes, [])

    def test_native_parent_must_match_approved_parent(self):
        api = FakeGitHub()
        request = api.request
        def changed_parent(method, path, data=None):
            value = request(method, path, data)
            if urlsplit(path).path.endswith("/parent"):
                value["number"] = 99
            return value
        api.request = changed_parent
        with self.assertRaises(controller.Blocked):
            controller.reconcile(api, config())

    def test_unknown_copilot_activity_blocks(self):
        for activity in ("assignment", "task", "pr"):
            api = FakeGitHub()
            if activity == "assignment":
                api.issues[0]["assignees"] = [{"login": "copilot-swe-agent[bot]"}]
            elif activity == "task":
                api.tasks = [{"id": "unknown", "state": "in_progress"}]
                api.task_details["unknown"] = {"sessions": []}
            else:
                api.with_pr()
                api.comments[70] = [approved(api.issues[0])]
                api.timelines = {}
            with self.assertRaises(controller.Blocked):
                controller.reconcile(api, config())

    def test_qa_is_requested_after_coding_completion(self):
        api = FakeGitHub().with_pr()
        self.assertEqual(controller.reconcile(api, config())["actions"][0]["kind"], "request-qa")
        api.task_details["task-1"]["state"] = "in_progress"
        self.assertEqual(controller.reconcile(api, config())["actions"], [])

    def test_missing_or_unstructured_qa_never_accepts(self):
        api = FakeGitHub().with_review()
        for body in ("LGTM", "", controller.encode("qa", {"verdict": "Accepted"})):
            api.reviews[0]["body"] = body
            self.assertEqual(controller.reconcile(api, config())["actions"], [])

    def test_old_self_dismissed_and_forged_reviews_never_accept(self):
        for change in ({"commit_id": "old"}, {"state": "DISMISSED"}, {"user": {"id": 44}},
                       {"user": {"id": 999}}, {"submitted_at": "2020-01-01T00:00:00Z"}):
            api = FakeGitHub().with_review()
            api.reviews[0].update(change)
            self.assertEqual(controller.reconcile(api, config())["actions"], [])

    def test_later_unstructured_review_invalidates_old_acceptance(self):
        api = FakeGitHub().with_review()
        api.reviews.append({**api.reviews[0], "id": 201, "body": "Review incomplete"})
        self.assertEqual(controller.reconcile(api, config())["actions"], [])

    def test_acceptance_with_failed_check_or_blocker_never_passes(self):
        for change in ("fail", "blocker", "missing_evidence", "wrong_base", "wrong_reservation"):
            api = FakeGitHub().with_review()
            report = controller.decode(api.reviews[0]["body"], "qa")
            if change == "fail":
                report["checks"]["security_privacy"]["status"] = "fail"
            elif change == "blocker":
                report["findings"] = [{"severity": "Blocker", "file": "docs/qa/trial-70.md", "reason": "Synthetic"}]
            elif change == "missing_evidence":
                report["checks"]["tests"]["evidence"] = ""
            elif change == "wrong_base":
                report["base"] = "old"
            else:
                report["reservation_id"] = 999
            api.reviews[0]["body"] = controller.encode("qa", report)
            self.assertEqual(controller.reconcile(api, config())["actions"], [])

    def test_current_ci_and_qa_release_slot(self):
        api = FakeGitHub([issue(70), issue(71)]).with_review()
        actions = controller.reconcile(api, config())["actions"]
        self.assertEqual([action["kind"] for action in actions], ["awaiting-human", "dispatch"])
        self.assertEqual(actions[-1]["issue"], 71)

    def test_capacity_two_permits_second_known_coding_task(self):
        api = FakeGitHub([issue(70), issue(71)]).with_pr()
        api.tasks[0]["state"] = "in_progress"
        api.task_details["task-1"]["state"] = "in_progress"
        actions = controller.reconcile(api, {**config(), "capacity": 2})["actions"]
        self.assertEqual([(a["kind"], a["issue"]) for a in actions], [("dispatch", 71)])

    def test_stale_failed_or_incomplete_ci_never_releases_slot(self):
        for change in ({"head_sha": "old"}, {"path": ".github/workflows/fake.yml"},
                       {"conclusion": "failure"}, {"event": "push"}, {"pull_requests": []}):
            api = FakeGitHub().with_review()
            api.runs[0].update(change)
            self.assertEqual(controller.reconcile(api, config())["actions"], [])
        api = FakeGitHub().with_review()
        api.jobs.pop()
        self.assertEqual(controller.reconcile(api, config())["actions"], [])

    def test_changed_base_and_out_of_scope_files_never_release(self):
        for change in ("base", "files", "rename"):
            api = FakeGitHub().with_review()
            if change == "base":
                api.pulls[0]["base"]["sha"] = "old"
            elif change == "files":
                api.files = [{"filename": "backend/tenancy/views.py"}]
            else:
                api.files[0]["previous_filename"] = "backend/tenancy/views.py"
            self.assertEqual(controller.reconcile(api, config())["actions"], [])

    def test_merged_pr_releases_file_and_slot(self):
        api = FakeGitHub([issue(70), issue(71)]).with_pr()
        api.pulls[0]["merged_at"] = "2026-10-26T12:00:00Z"
        api.pulls[0]["state"] = "closed"
        api.issues[1]["body"] = api.issues[0]["body"]
        api.comments[71] = [approved(api.issues[1])]
        actions = controller.reconcile(api, config())["actions"]
        self.assertEqual([a["issue"] for a in actions], [71])

    def test_repair_limit_persists_across_repeated_events(self):
        api = FakeGitHub().with_review("Changes Required")
        report = controller.decode(api.reviews[0]["body"], "qa")
        report["findings"] = [{"severity": "Major", "file": "docs/qa/trial-70.md",
                               "reason": "Synthetic omission", "category": "correctness"}]
        api.reviews[0]["body"] = controller.encode("qa", report)
        settings = {**config(), "max_repairs": 1}
        self.assertEqual(controller.reconcile(api, settings)["actions"][0]["kind"], "repair")
        self.assertEqual(controller.reconcile(api, config())["actions"], [])
        api.add_event("repair-reserved")
        self.assertEqual(controller.reconcile(api, settings)["actions"], [])


class ExecutionTests(unittest.TestCase):
    def execute(self, api):
        with patch.dict(os.environ, {"LUXE_AUTONOMY_ENABLED": "true"}):
            return controller.execute(api, {**config(), "enabled": True}, run_url="synthetic-run")

    def test_default_and_remote_kill_switch(self):
        api = FakeGitHub(dry_run=False)
        with patch.dict(os.environ, {}, clear=True), self.assertRaises(controller.Blocked):
            controller.execute(api, config(), run_url="synthetic-run")
        self.assertEqual(api.writes, [])
        api.switch = "false"
        with self.assertRaises(controller.Blocked):
            self.execute(api)
        self.assertEqual(api.writes, [])

    def test_read_only_transport_refuses_writes_before_network(self):
        api = controller.GitHub("synthetic-token")
        api.opener = Mock()
        for method in ("POST", "PATCH", "PUT", "DELETE"):
            with self.assertRaises(controller.Blocked):
                api.request(method, controller.ROOT + "/issues/70/comments", {})
        api.opener.open.assert_not_called()
        with self.assertRaises(controller.Blocked):
            controller.execute(api, config(), run_url="synthetic-run")

    def test_reservation_precedes_assignment_and_duplicate_event_is_noop(self):
        api = FakeGitHub(dry_run=False)
        self.execute(api)
        self.assertTrue(api.writes[0][1].endswith("/comments"))
        self.assertTrue(api.writes[1][1].endswith("/assignees"))
        writes = len(api.writes)
        self.execute(api)
        self.assertEqual(len(api.writes), writes)

    def test_crash_after_reservation_never_assigns_on_replay(self):
        api = FakeGitHub(dry_run=False)
        def crash(route, data):
            raise controller.Blocked("simulated lost reservation response")
        api.after_write = crash
        with self.assertRaises(controller.Blocked):
            self.execute(api)
        api.after_write = None
        self.execute(api)
        self.assertFalse(any(path.endswith("/assignees") for _, path, _ in api.writes))

    def test_lost_assignment_response_never_reassigns(self):
        api = FakeGitHub(dry_run=False)
        def crash(route, data):
            if route.endswith("/assignees"):
                raise controller.Blocked("simulated lost assignment response")
        api.after_write = crash
        with self.assertRaises(controller.Blocked):
            self.execute(api)
        api.after_write = None
        self.execute(api)
        self.assertEqual(sum(path.endswith("/assignees") for _, path, _ in api.writes), 1)

    def test_kill_switch_rechecked_between_reservation_and_assignment(self):
        api = FakeGitHub(dry_run=False)
        api.after_write = lambda route, data: setattr(api, "switch", "false")
        with self.assertRaises(controller.Blocked):
            self.execute(api)
        self.assertEqual(len(api.writes), 1)

    def test_scope_change_after_reservation_holds_without_assignment(self):
        api = FakeGitHub(dry_run=False)
        def change_scope(route, data):
            api.issues[0]["title"] = "Changed after reservation"
        api.after_write = change_scope
        with self.assertRaises(controller.Blocked):
            self.execute(api)
        self.assertEqual(len(api.writes), 1)
        self.assertTrue(api.writes[0][1].endswith("/comments"))

    def test_unknown_transport_error_fails_closed_without_response_content(self):
        import urllib.error
        api = controller.GitHub("synthetic-token")
        api.opener = Mock()
        api.opener.open.side_effect = urllib.error.URLError("synthetic-secret-must-not-appear")
        with self.assertRaises(controller.Blocked) as raised:
            api.request("GET", controller.ROOT + "/issues")
        self.assertNotIn("synthetic-secret", str(raised.exception))

    def test_qa_request_lost_response_never_repeats(self):
        api = FakeGitHub(dry_run=False).with_pr()
        def crash(route, data):
            if route.endswith("/requested_reviewers"):
                raise controller.Blocked("simulated lost review request response")
        api.after_write = crash
        with self.assertRaises(controller.Blocked):
            self.execute(api)
        api.after_write = None
        self.execute(api)
        self.assertEqual(sum(path.endswith("/requested_reviewers") for _, path, _ in api.writes), 1)

    def test_main_always_dry_run_even_when_environment_enabled(self):
        api = FakeGitHub()
        output = io.StringIO()
        with patch.object(controller, "GitHub", return_value=api), patch.object(
            controller.sys, "argv", ["controller", "--dry-run"]
        ), patch.dict(os.environ, {"LUXE_AUTONOMY_ENABLED": "true"}), contextlib.redirect_stdout(output):
            self.assertEqual(controller.main(), 0)
        self.assertFalse(json.loads(output.getvalue())["live_enabled"])
        self.assertEqual(api.writes, [])

    def test_enabled_config_rejected(self):
        with tempfile.NamedTemporaryFile(mode="w") as stream:
            json.dump({**config(), "enabled": True}, stream)
            stream.flush()
            with self.assertRaises(controller.Blocked):
                controller.load_settings(stream.name)

    def test_pagination_includes_all_pages(self):
        api = FakeGitHub()
        api.comments[70] = [comment("unrelated", {}, comment_id=i) for i in range(201)]
        self.assertEqual(len(api.pages(controller.ROOT + "/issues/70/comments")), 201)

    def test_malformed_paginated_object_blocks(self):
        api = FakeGitHub()
        api.request = lambda *args: []
        with self.assertRaises(controller.Blocked):
            api.pages(f"/agents/repos/{controller.REPO}/tasks", "tasks")

    def test_boolean_capacity_or_repair_limit_is_not_an_integer_setting(self):
        for change in ({"capacity": True}, {"max_repairs": True}):
            with tempfile.NamedTemporaryFile(mode="w") as stream:
                json.dump({**config(), "max_repairs": 0, **change}, stream)
                stream.flush()
                with self.assertRaises(controller.Blocked):
                    controller.load_settings(stream.name)

    def test_committed_config_and_workflow_cannot_execute_live(self):
        settings = controller.load_settings(".github/autonomy.json")
        self.assertFalse(settings["enabled"])
        self.assertEqual(settings["approver_ids"], [])
        workflow = Path(".github/workflows/autonomous-development.yml").read_text()
        self.assertIn("--dry-run", workflow)
        self.assertNotIn("secrets.", workflow)
        self.assertIn("cancel-in-progress: false", workflow)


if __name__ == "__main__":
    unittest.main()
