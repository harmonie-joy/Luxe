"""Replay, permission and uncertainty regressions for the disabled safe output."""

import base64
import copy
import hashlib
import json
import os
import re
import sys
import unittest
from unittest.mock import patch
import urllib.error

from autonomous_development import Blocked, ROOT, REPO, encode
from gh_aw_policy import ADVISORY_QA_ENVELOPE, CHECKS, QA_PATH, encode_qa, snapshot
from test_gh_aw_policy import API, BASE, FILE, HEAD, POLICY
from gh_aw_repair import (
    ATTEMPT_MARKER, COMMIT, RESERVATION_MARKER, SafeOutputGitHub, apply_repair, main,
    proposal_content, repair_binding, repair_proposal,
)
from test_gh_aw_policy import sanitize_safe_output


class RepairAPI(API):
    def __init__(self):
        super().__init__()
        self.fail_comment = False
        self.persist_failed_comment = True
        self.fail_attempt = False
        self.fail_commit = False
        self.uncertain_commit = False
        self.advance_after_reservation = False
        self.run_history = []
        self.run_jobs = {}
        self.data[f"{ROOT}/git/trees/{HEAD}?recursive=1"] = {
            "truncated": False, "tree": [{"path": FILE, "mode": "100644", "type": "blob",
                                         "sha": "d" * 40, "size": 20}]}
        self.data[f"{ROOT}/git/blobs/" + "d" * 40] = {
            "encoding": "base64", "size": 20,
            "content": base64.b64encode(b"Original help text.\n").decode()}
        data = snapshot(self, 91, HEAD, POLICY)
        from gh_aw_policy import qa_preflight
        binding = qa_preflight(data, POLICY)
        report = {key: binding[key] for key in ("key", "head", "base", "issue", "digest", "ci")}
        report.update({
            "verdict": "Changes Required", "run_id": 300,
            "checks": {key: {"status": "pass", "evidence": "Observed synthetic source and current CI"}
                       for key in CHECKS},
            "findings": [{"severity": "Major", "category": "correctness", "file": FILE,
                          "reason": "The resume instructions omit the saved-work navigation."}],
        })
        report["checks"]["correctness"]["status"] = "fail"
        qa_body = encode_qa(report)
        self.report = report
        self.qa = {"id": 400, "user": {"id": 30, "type": "Bot"}, "state": "COMMENTED",
                   "commit_id": HEAD, "submitted_at": "2026-10-27T01:00:00Z", "body": qa_body}
        self.attestation = {
            "qa_review_id": 400, "qa_sha256": hashlib.sha256(qa_body.encode()).hexdigest(),
            "binding": binding,
            "checks": {key: {"status": "pass", "evidence": "Independently reproduced the scoped defect"}
                       for key in ("scope", "security_privacy", "correctness", "tests")},
        }
        self.human = {
            "id": 401, "user": {"id": 20, "type": "User"}, "state": "COMMENTED",
            "commit_id": HEAD, "submitted_at": "2026-10-27T02:00:00Z",
            "body": encode("gh-aw-repair-attestation", self.attestation),
        }
        self.data[f"{ROOT}/pulls/91/reviews"] = [self.qa, self.human]
        self.data[f"{ROOT}/actions/runs/300"] = {
            "id": 300, "path": QA_PATH, "repository": {"full_name": REPO},
            "event": "pull_request", "status": "completed", "conclusion": "success",
            "head_sha": HEAD,
        }
        self.calls.clear()

    def pages(self, path, key=None):
        if path.startswith(f"{ROOT}/actions/workflows/luxe-bounded-repair.lock.yml/runs"):
            return copy.deepcopy(self.run_history)
        match = re.fullmatch(
            rf"{ROOT}/actions/runs/([1-9][0-9]*)/attempts/([1-9][0-9]*)/jobs\?filter=latest",
            path,
        )
        if match:
            return copy.deepcopy(self.run_jobs.get((int(match.group(1)), int(match.group(2))), []))
        return super().pages(path, key)

    def add_run(self, run_id, *, run_number=None, run_attempt=1, conclusion=None):
        run_number = run_id if run_number is None else run_number
        title = f"THE LUXE Bounded Repair for {self.data[f'{ROOT}/pulls/91']['head']['ref']}"
        record = next((run for run in self.run_history if run.get("id") == run_id), None)
        if record is None:
            record = {"id": run_id}
            self.run_history.append(record)
        record.update({"display_title": title, "path": REPAIR_PATH,
                       "run_number": run_number, "run_attempt": run_attempt})
        self.data[f"{ROOT}/actions/runs/{run_id}"] = {
            "id": run_id, "path": REPAIR_PATH, "event": "workflow_run",
            "display_title": title, "run_number": run_number, "run_attempt": run_attempt,
        }
        self.run_jobs[(run_id, run_attempt)] = [{
            "name": "propose_repair",
            "status": "in_progress" if conclusion is None else "completed",
            "conclusion": conclusion,
        }]

    def request(self, method, path, data=None):
        if method == "GET":
            return super().request(method, path, data)
        self.calls.append((method, path, copy.deepcopy(data)))
        if method == "POST" and path == f"{ROOT}/issues/90/comments":
            is_attempt = ATTEMPT_MARKER in data["body"]
            if self.fail_attempt and is_attempt:
                raise Blocked("uncertain attempt record")
            if self.fail_comment and not is_attempt:
                # The server may have persisted the write before the response was lost.
                if self.persist_failed_comment:
                    self.data[path].append({
                        "id": 500, "user": {"id": 40, "type": "Bot"},
                        "body": data["body"], "created_at": "now", "updated_at": "now"})
                raise Blocked("uncertain reservation")
            record = {"id": 499 if is_attempt else 500, "user": {"id": 40, "type": "Bot"},
                      "body": data["body"], "created_at": "now", "updated_at": "now"}
            self.data[path].append(record)
            self.data[f"{ROOT}/issues/comments/{record['id']}"] = record
            if self.advance_after_reservation and not is_attempt:
                self.data[f"{ROOT}/pulls/91"]["head"]["sha"] = "f" * 40
            return copy.deepcopy(record)
        if method == "POST" and path == "/graphql":
            if self.fail_commit:
                raise Blocked("commit API failed")
            if self.uncertain_commit:
                return {"errors": [{"message": "Synthetic error; must not be printed"}]}
            self.data[f"{ROOT}/pulls/91"]["head"]["sha"] = "e" * 40
            return {"data": {"createCommitOnBranch": {"commit": {"oid": "e" * 40}}}}
        raise AssertionError("Unexpected endpoint")


class RepairTests(unittest.TestCase):
    def setUp(self):
        self.api = RepairAPI()
        self.data = snapshot(self.api, 91, HEAD, POLICY)
        self.api.add_run(600)
        self.binding = repair_binding(self.api, self.data, POLICY, run_id=600)
        self.proposal = {
            "type": "propose_repair", "path": FILE,
            "content_base64": base64.b64encode(b"Corrected synthetic help.\n").decode(),
        }

    def apply(self, run_id=600, run_attempt=1):
        current = next((run for run in self.api.run_history if run.get("id") == run_id), None)
        if current is None or current.get("run_attempt") != run_attempt:
            self.api.add_run(run_id, run_attempt=run_attempt)
        return apply_repair(self.api, self.binding, self.proposal, POLICY, run_id=run_id)

    def test_one_reserved_atomic_commit(self):
        result = self.apply()
        self.assertEqual(result, "e" * 40)
        writes = [c for c in self.api.calls if c[0] != "GET"]
        self.assertEqual(len(writes), 3)
        self.assertIn(ATTEMPT_MARKER, writes[0][2]["body"])
        self.assertTrue(writes[1][1].endswith("/comments"))
        self.assertIn(RESERVATION_MARKER, writes[1][2]["body"])
        variables = writes[2][2]["variables"]["input"]
        self.assertEqual(variables["expectedHeadOid"], HEAD)
        self.assertEqual(variables["branch"], {"repositoryNameWithOwner": REPO, "branchName": "luxe-pilot/90"})
        self.assertEqual(variables["fileChanges"]["additions"][0]["path"], FILE)
        self.assertEqual(
            base64.b64decode(variables["fileChanges"]["additions"][0]["contents"], validate=True),
            b"Corrected synthetic help.\n",
        )
        self.assertNotIn("deletions", variables["fileChanges"])

    def test_stale_head_and_review_edit_block(self):
        for change in ("head", "review", "scope", "ci"):
            with self.subTest(change=change):
                self.setUp()
                if change == "head":
                    self.api.data[f"{ROOT}/pulls/91"]["head"]["sha"] = "f" * 40
                elif change == "review":
                    self.api.qa["body"] += "\nEdited findings"
                elif change == "scope":
                    self.api.data[f"{ROOT}/issues/90"]["title"] += " changed"
                else:
                    self.api.data[f"{ROOT}/actions/runs/200/jobs?filter=latest"][0]["conclusion"] = "failure"
                with self.assertRaises(Blocked):
                    self.apply()
                self.assertFalse(any(c[0] != "GET" for c in self.api.calls))

    def test_issue_wide_budget_survives_new_head_and_malformed_ledger(self):
        for body in (encode("gh-aw-repair", {"attempt": 1, "head": "old"}),
                     "<!-- luxe-autonomy:gh-aw-repair:v1 --> damaged",
                     encode("event", {"event": "repair-reserved", "issue": 90})):
            with self.subTest(body=body):
                self.setUp()
                self.api.data[f"{ROOT}/issues/90/comments"].append(
                    {"user": {"id": 40, "type": "Bot"}, "body": body})
                with self.assertRaises(Blocked):
                    repair_binding(
                        self.api, snapshot(self.api, 91, HEAD, POLICY), POLICY, run_id=600,
                    )

    def test_duplicate_triggers_and_reruns_never_replay(self):
        self.api.fail_commit = True
        with self.assertRaises(Blocked):
            self.apply()
        count = len([c for c in self.api.calls if c[0] != "GET"])
        self.api.fail_commit = False
        with self.assertRaises(Blocked):
            self.apply()
        self.assertEqual(len([c for c in self.api.calls if c[0] != "GET"]), count)

    def test_uncertain_reservation_never_dispatches_or_retries(self):
        self.api.fail_comment = True
        with self.assertRaises(Blocked):
            self.apply(600)
        self.assertFalse(any(c[1] == "/graphql" for c in self.api.calls))
        self.api.run_jobs[(600, 1)][0].update({"status": "completed", "conclusion": "failure"})
        with self.assertRaises(Blocked):
            self.apply(601)
        self.assertEqual(len([c for c in self.api.calls if c[0] == "POST"]), 2)

    def test_uncertain_attempt_record_never_reaches_reservation(self):
        self.api.fail_attempt = True
        with self.assertRaises(Blocked):
            self.apply()
        writes = [call for call in self.api.calls if call[0] == "POST"]
        self.assertEqual(len(writes), 1)
        self.assertIn(ATTEMPT_MARKER, writes[0][2]["body"])
        self.assertFalse(any(call[1] == "/graphql" for call in self.api.calls))

    def test_uncertain_reservation_without_persisted_comment_consumes_attempt(self):
        self.api.fail_comment = True
        self.api.persist_failed_comment = False
        with self.assertRaises(Blocked):
            self.apply(600)
        comments = self.api.data[f"{ROOT}/issues/90/comments"]
        self.assertEqual(len(comments), len(self.data["comments"]) + 1)
        self.assertIn(ATTEMPT_MARKER, comments[-1]["body"])
        self.assertNotIn(RESERVATION_MARKER, comments[-1]["body"])
        self.api.run_jobs[(600, 1)][0].update({"status": "completed", "conclusion": "failure"})
        self.api.run_history = [run for run in self.api.run_history if run["id"] != 600]
        self.api.data.pop(f"{ROOT}/actions/runs/600")
        self.api.run_jobs.pop((600, 1))

        with self.assertRaisesRegex(Blocked, "allowance already consumed"):
            self.apply(601)
        self.assertEqual(len([c for c in self.api.calls if c[0] == "POST"]), 2)

    def test_uncertain_reservation_same_workflow_rerun_consumes_attempt(self):
        self.api.fail_comment = True
        self.api.persist_failed_comment = False
        with self.assertRaises(Blocked):
            self.apply(600, 1)
        self.api.run_jobs[(600, 1)][0].update({"status": "completed", "conclusion": "failure"})

        with self.assertRaisesRegex(Blocked, "previous repair attempt"):
            self.apply(600, 2)
        self.assertEqual(len([c for c in self.api.calls if c[0] == "POST"]), 2)

    def test_skipped_safe_output_job_does_not_consume_attempt(self):
        self.api.add_run(550, conclusion="skipped")
        self.assertEqual(self.apply(), "e" * 40)

    def test_newer_queued_run_does_not_block_current_run(self):
        current = self.api.data[f"{ROOT}/actions/runs/600"]
        current["run_number"] = 12
        current_history = next(run for run in self.api.run_history if run["id"] == 600)
        current_history["run_number"] = 12
        self.api.add_run(700, run_number=11, conclusion="skipped")
        self.api.add_run(550, run_number=13)
        self.assertEqual(self.apply(), "e" * 40)

    def test_incomplete_prior_run_evidence_blocks_before_reservation(self):
        title = f"THE LUXE Bounded Repair for {self.api.data[f'{ROOT}/pulls/91']['head']['ref']}"
        self.api.run_history.append({"id": 550, "display_title": title, "run_attempt": 1})
        with self.assertRaisesRegex(Blocked, "incomplete prior repair run history"):
            repair_binding(self.api, self.data, POLICY, run_id=600)
        self.assertFalse(any(call[0] != "GET" for call in self.api.calls))

    def test_repair_branch_must_encode_the_approved_issue(self):
        self.api.data[f"{ROOT}/pulls/91"]["head"]["ref"] = "luxe-pilot/92"
        with self.assertRaisesRegex(Blocked, "does not identify its issue"):
            repair_binding(self.api, snapshot(self.api, 91, HEAD, POLICY), POLICY, run_id=600)

    def test_uncertain_graphql_response_consumes_attempt(self):
        self.api.uncertain_commit = True
        with self.assertRaises(Blocked):
            self.apply()
        with self.assertRaises(Blocked):
            self.apply()
        self.assertEqual(len([c for c in self.api.calls if c[1] == "/graphql"]), 1)

    def test_head_advances_after_reservation_no_commit(self):
        self.api.advance_after_reservation = True
        with self.assertRaises(Blocked):
            self.apply()
        self.assertEqual(len([c for c in self.api.calls if c[0] == "POST"]), 2)

    def test_scope_and_safe_output_shape_enforced(self):
        for change in (
            {"path": "frontend/features/auth/login.tsx"},
            {"path": "docs/help/other.md"},
            {"path": ".github/workflows/ci.yml"},
            {"content_base64": base64.b64encode(b"x" * 32769).decode()},
            {"content_base64": base64.b64encode(b"bad\x00content").decode()},
            {"content_base64": base64.b64encode(b"\xff").decode()},
            {"content_base64": "not-base64"},
            {"repo": "outside/repo"},
            {"type": "push_to_pull_request_branch"},
        ):
            with self.subTest(change=change):
                self.setUp()
                self.proposal.update(change)
                with self.assertRaises(Blocked):
                    self.apply()
                self.assertFalse(any(c[0] == "POST" for c in self.api.calls))

    def test_collector_to_handler_repair_content_round_trip(self):
        samples = (
            " \nconst Card = () => <Card title=\"{{title}}\">ok</Card>;\r\n ",
            "<!-- preserve this comment -->\nconst visible = true;\n",
            "const template = `value: ${item}: {{replacement}}`;\n",
        )
        for text in samples:
            with self.subTest(text=text):
                self.assertNotEqual(sanitize_safe_output(text), text)
                content = text.encode("utf-8")
                safe_output = json.dumps({"items": [{
                    "type": "propose_repair", "binding": json.dumps(self.binding),
                    "path": FILE, "content_base64": base64.b64encode(content).decode(),
                }]})
                transported = json.loads(sanitize_safe_output(safe_output))
                expected, proposal = repair_proposal(transported)
                self.assertEqual(expected, self.binding)
                result = proposal_content(self.api, self.binding, proposal)
                self.assertEqual(base64.b64decode(result, validate=True), content)

    def test_bot_self_attestation_author_and_latest_malformed_review_rejected(self):
        for change in ("bot", "author", "dismissed", "missing", "later"):
            with self.subTest(change=change):
                self.setUp()
                if change == "bot":
                    self.api.human["user"]["type"] = "Bot"
                elif change == "author":
                    self.api.data[f"{ROOT}/pulls/91"]["user"]["id"] = 20
                elif change == "dismissed":
                    self.api.human["state"] = "DISMISSED"
                elif change == "missing":
                    self.api.data[f"{ROOT}/pulls/91/reviews"].remove(self.api.human)
                else:
                    self.api.data[f"{ROOT}/pulls/91/reviews"].append({**self.api.human, "id": 402, "body": "LGTM"})
                with self.assertRaises(Blocked):
                    repair_binding(
                        self.api, snapshot(self.api, 91, HEAD, POLICY), POLICY, run_id=600,
                    )

    def test_advisory_review_does_not_shadow_controller_qa(self):
        advisory = {
            "protocol": ADVISORY_QA_ENVELOPE,
            "pr": 91,
            "head": HEAD,
            "base": BASE,
            "run_id": 301,
        }
        review = {
            "id": 402, "user": {"id": 30, "type": "Bot"}, "state": "COMMENTED",
            "commit_id": HEAD, "submitted_at": "2026-10-27T03:00:00Z",
            "body": f"Advisory review.\n```json\n{json.dumps(advisory)}\n```",
        }
        self.api.data[f"{ROOT}/pulls/91/reviews"].append(review)
        result = repair_binding(self.api, snapshot(self.api, 91, HEAD, POLICY), POLICY)
        self.assertEqual(result["qa_review_id"], self.api.qa["id"])

        advisory["head"] = "invalid"
        review["body"] = f"Advisory review.\n```json\n{json.dumps(advisory)}\n```"
        with self.assertRaises(Blocked):
            repair_binding(self.api, snapshot(self.api, 91, HEAD, POLICY), POLICY)

    def test_sensitive_or_unverified_qa_not_repairable(self):
        for change in ("security", "missing-safety", "placeholder", "category", "file", "blocked", "run"):
            with self.subTest(change=change):
                self.setUp()
                report = copy.deepcopy(self.api.report)
                if change == "security":
                    report["checks"]["security_privacy"]["status"] = "fail"
                elif change == "missing-safety":
                    del report["checks"]["scope"]
                elif change == "placeholder":
                    report["checks"]["scope"]["evidence"] = "LGTM"
                elif change == "category":
                    del report["findings"][0]["category"]
                elif change == "file":
                    report["findings"][0]["file"] = ".github/workflows/ci.yml"
                elif change == "blocked":
                    report["verdict"] = "Blocked"
                else:
                    self.api.data[f"{ROOT}/actions/runs/300"]["conclusion"] = "failure"
                self.api.qa["body"] = encode("gh-aw-qa", report)
                self.api.attestation["qa_sha256"] = hashlib.sha256(self.api.qa["body"].encode()).hexdigest()
                self.api.human["body"] = encode("gh-aw-repair-attestation", self.api.attestation)
                with self.assertRaises(Blocked):
                    repair_binding(
                        self.api, snapshot(self.api, 91, HEAD, POLICY), POLICY, run_id=600,
                    )

    def test_symlink_tree_truncation_creation_and_noop_block(self):
        for change in ("symlink", "truncated", "missing", "noop"):
            with self.subTest(change=change):
                self.setUp()
                tree = self.api.data[f"{ROOT}/git/trees/{HEAD}?recursive=1"]
                if change == "symlink":
                    tree["tree"][0]["mode"] = "120000"
                elif change == "truncated":
                    tree["truncated"] = True
                elif change == "missing":
                    tree["tree"] = []
                else:
                    self.proposal["content"] = "Original help text.\n"
                with self.assertRaises(Blocked):
                    self.apply()
                self.assertFalse(any(c[0] == "POST" for c in self.api.calls))

    def test_default_disabled_cli_cannot_construct_write_transport(self):
        with patch.object(sys, "argv", ["gh_aw_repair.py", "--apply"]), \
                patch.dict(os.environ, {"REPAIR_ENABLED": "true", "QA_ENABLED": "true"}), \
                patch("gh_aw_repair.SafeOutputGitHub") as transport:
            with self.assertRaisesRegex(Blocked, "disabled"):
                main()
            transport.assert_not_called()


class TransportTests(unittest.TestCase):
    def test_failed_or_uncertain_calls_are_redacted_and_never_retried(self):
        for error in (
            urllib.error.HTTPError("https://api.github.com/graphql", 403, "private response", {}, None),
            urllib.error.URLError("private response"),
            TimeoutError("private response"),
            ValueError("private response"),
        ):
            with self.subTest(error=type(error).__name__):
                api = SafeOutputGitHub("synthetic-token-not-a-credential", dry_run=False)
                with patch.object(api.opener, "open", side_effect=error) as call:
                    with self.assertRaises(Blocked) as caught:
                        api.request("POST", "/graphql", {"query": COMMIT, "variables": {}})
                    self.assertNotIn("private response", str(caught.exception))
                    self.assertEqual(call.call_count, 1)

    def test_only_exact_mutation_and_reservation_endpoint_permitted(self):
        api = SafeOutputGitHub("synthetic-token-not-a-credential", dry_run=False)
        with patch.object(api.opener, "open") as call:
            for method, path, payload in (
                ("POST", "/graphql", {"query": "mutation { mergePullRequest }"}),
                ("POST", f"{ROOT}/pulls/91/reviews", {}),
                ("POST", f"{ROOT}/issues/90/comments/evil/comments", {}),
                ("PUT", f"{ROOT}/issues/90/comments", {}),
                ("GET", "/repos/outside/repository/issues", None),
            ):
                with self.subTest(method=method, path=path), self.assertRaises(Blocked):
                    api.request(method, path, payload)
            call.assert_not_called()


if __name__ == "__main__":
    unittest.main()
