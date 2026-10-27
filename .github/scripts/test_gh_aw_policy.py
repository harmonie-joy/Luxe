"""Synthetic evidence only; no live dispatch or credentials."""

import copy
import json
import re
import unittest

from autonomous_development import Blocked, ROOT, REPO, encode, scope_digest
from gh_aw_policy import (
    CHECKS, QA_DISPATCH_EVENT, QA_ENVELOPE, ci_evidence, decode_qa, encode_qa, event_pr,
    fingerprint, protected, qa_preflight, snapshot, validate_review,
)


HEAD, BASE = "a" * 40, "b" * 40
FILE = "docs/help/resume.md"
POLICY = {"approver_ids": [10], "qa_reviewer_ids": [20], "qa_bot_ids": [30],
          "repair_bot_id": 40, "max_qa_reviews_per_pr": 6}


def sanitize_safe_output(text):
    text = re.sub(r"<!--[\s\S]*?-->", "", text)
    text = re.sub(r"</?[A-Za-z][^>]*>", "", text)
    return re.sub(r"\{\{[\s\S]*?\}\}", "", text).strip()


def fixture():
    scope = {
        "risk": "L0", "base_branch": "master", "parent": 69, "dependencies": [],
        "allowed_files": [FILE], "forbidden_files": ["backend/", ".github/"],
        "problem": "Synthetic documentation defect", "goal": "Accurate instructions",
        "non_goals": "No product changes", "scope": "One documentation file",
        "acceptance_criteria": ["Instructions match observed behavior"],
        "verification": ["Inspect existing behavior and documentation"],
    }
    issue = {"number": 90, "title": "Synthetic task", "body": encode("handoff", scope),
             "state": "open", "labels": []}
    approval = {"id": 100, "user": {"id": 10, "type": "User"},
                "created_at": "2026-10-27T00:00:00Z", "updated_at": "2026-10-27T00:00:00Z",
                "body": encode("approval", {"issue": 90, "digest": scope_digest(issue),
                                          "risk": "L0", "allowed_files": [FILE],
                                          "verification": scope["verification"]})}
    pr = {"number": 91, "state": "open", "merged": False, "changed_files": 1,
          "body": "Refs #90\n" + encode("gh-aw-issue", {"issue": 90}),
          "user": {"id": 50}, "head": {"sha": HEAD, "ref": "luxe-pilot/90", "repo": {"full_name": REPO}},
          "base": {"sha": BASE, "ref": "master", "repo": {"full_name": REPO}}}
    link = {"number": 91, "head": {"sha": HEAD}, "base": {"sha": BASE}}
    run = {"id": 200, "run_attempt": 1, "path": ".github/workflows/ci.yml",
           "event": "pull_request", "status": "completed", "conclusion": "success",
           "head_sha": HEAD, "head_repository": {"full_name": REPO}, "pull_requests": [link]}
    return {
        f"{ROOT}/pulls/91": pr,
        f"{ROOT}/branches/master": {"commit": {"sha": BASE}},
        f"{ROOT}/issues/90": issue,
        f"{ROOT}/issues/90/comments": [approval],
        f"{ROOT}/issues/90/parent": {"number": 69, "repository_url": "https://api.github.com" + ROOT},
        f"{ROOT}/issues/90/dependencies/blocked_by": [],
        f"{ROOT}/issues/90/sub_issues": [],
        f"{ROOT}/issues/90/timeline": [{"event": "cross-referenced", "source": {"issue": {
            "number": 91, "pull_request": {"url": "synthetic"}, "repository_url": "https://api.github.com" + ROOT}}}],
        f"{ROOT}/pulls/91/files": [{"filename": FILE, "status": "modified"}],
        f"{ROOT}/pulls/91/reviews": [],
        f"{ROOT}/actions/workflows/ci.yml/runs?event=pull_request&head_sha={HEAD}": [run],
        f"{ROOT}/actions/runs/200/jobs?filter=latest": [
            {"name": name, "conclusion": "success"}
            for name in ("frontend", "backend", "real-e2e", "autonomous-controller")],
    }


class API:
    def __init__(self):
        self.data = fixture()
        self.calls = []

    def request(self, method, path, data=None):
        self.calls.append((method, path, data))
        if method != "GET":
            raise AssertionError("Unexpected write")
        return copy.deepcopy(self.data[path])

    def pages(self, path, key=None):
        return self.request("GET", path)


class PolicyTests(unittest.TestCase):
    def setUp(self):
        self.api = API()

    def read(self):
        return snapshot(self.api, 91, HEAD, POLICY)

    def test_exact_snapshot_and_zero_writes(self):
        data = self.read()
        self.assertTrue(data["binding"]["ci"]["passed"])
        self.assertEqual(qa_preflight(data, POLICY)["head"], HEAD)
        self.assertTrue(all(call[0] == "GET" for call in self.api.calls))

    def test_stale_head_base_and_changed_issue(self):
        for mutate in ("head", "base", "issue"):
            with self.subTest(mutate=mutate):
                self.api = API()
                if mutate == "head":
                    self.api.data[f"{ROOT}/pulls/91"]["head"]["sha"] = "c" * 40
                elif mutate == "base":
                    self.api.data[f"{ROOT}/branches/master"]["commit"]["sha"] = "c" * 40
                else:
                    self.api.data[f"{ROOT}/issues/90"]["title"] += " changed"
                with self.assertRaises(Blocked):
                    self.read()

    def test_changed_files_rename_and_truncated_listing(self):
        for change in (
            [{"filename": ".github/workflows/evil.yml"}],
            [{"filename": FILE, "previous_filename": "AGENTS.md"}],
            [],
        ):
            with self.subTest(change=change):
                self.api.data[f"{ROOT}/pulls/91/files"] = change
                with self.assertRaises(Blocked):
                    self.read()

    def test_forks_and_multiple_prs_block(self):
        self.api.data[f"{ROOT}/pulls/91"]["head"]["repo"]["full_name"] = "outside/fork"
        with self.assertRaises(Blocked):
            self.read()
        self.api = API()
        timeline = self.api.data[f"{ROOT}/issues/90/timeline"]
        second = copy.deepcopy(timeline[0])
        second["source"]["issue"]["number"] = 92
        timeline.append(second)
        self.api.data[f"{ROOT}/pulls/92"] = {"state": "open"}
        with self.assertRaises(Blocked):
            self.read()

    def test_duplicate_triggers_and_qa_circuit_breaker(self):
        data = self.read()
        key = qa_preflight(data, POLICY)["key"]
        record = {"user": {"id": 30, "type": "Bot"}, "body": encode_qa({"key": key})}
        data["reviews"] = [record]
        with self.assertRaises(Blocked):
            qa_preflight(data, POLICY)
        data["reviews"] = [{**record, "body": encode_qa({"key": str(i)})} for i in range(6)]
        with self.assertRaises(Blocked):
            qa_preflight(data, POLICY)
        data["reviews"] = [{**record, "body": "A sanitized legacy QA review without its marker."}]
        with self.assertRaises(Blocked):
            qa_preflight(data, POLICY)

    def test_latest_failed_ci_not_old_success(self):
        path = f"{ROOT}/actions/workflows/ci.yml/runs?event=pull_request&head_sha={HEAD}"
        failed = {**self.api.data[path][0], "run_attempt": 2, "conclusion": "failure"}
        self.api.data[path].append(failed)
        self.assertFalse(ci_evidence(self.api, self.api.data[f"{ROOT}/pulls/91"])["passed"])

    def test_missing_ci_and_missing_job_are_not_success(self):
        self.api.data[f"{ROOT}/actions/runs/200/jobs?filter=latest"].pop()
        self.assertFalse(self.read()["binding"]["ci"]["passed"])
        self.api.data[f"{ROOT}/actions/workflows/ci.yml/runs?event=pull_request&head_sha={HEAD}"] = []
        self.assertFalse(self.read()["binding"]["ci"]["passed"])

    def test_source_run_is_reread_and_ambiguous_source_blocks(self):
        run = {"id": 200, "path": ".github/workflows/ci.yml", "repository": {"full_name": REPO},
               "status": "completed", "conclusion": "success", "event": "pull_request",
               "pull_requests": [{"number": 91, "head": {"sha": HEAD}}]}
        self.api.data[f"{ROOT}/actions/runs/200"] = run
        event = {"workflow_run": {"id": 200, "conclusion": "spoofed"}}
        self.assertEqual(event_pr(self.api, event, "workflow_run"), (91, HEAD))
        run["pull_requests"] = []
        with self.assertRaises(Blocked):
            event_pr(self.api, event, "workflow_run")
        run["pull_requests"] = [{"number": 91, "head": {"sha": HEAD}}]
        run["conclusion"] = "failure"
        with self.assertRaises(Blocked):
            event_pr(self.api, event, "workflow_run")

    def test_app_synchronization_and_ci_completion_keep_exact_pr_provenance(self):
        app_sync = {
            "action": "synchronize",
            "sender": {"id": 40, "type": "Bot", "login": "luxe-repair-app[bot]"},
            "pull_request": {"number": 91, "head": {"sha": HEAD}},
        }
        self.assertEqual(event_pr(self.api, app_sync, "pull_request"), (91, HEAD))

        run = {"id": 200, "path": ".github/workflows/ci.yml", "repository": {"full_name": REPO},
               "status": "completed", "conclusion": "success", "event": "pull_request",
               "head_branch": "luxe-pilot/90",
               "pull_requests": [{"number": 91, "head": {"sha": HEAD}}]}
        self.api.data[f"{ROOT}/actions/runs/200"] = run
        self.assertEqual(
            event_pr(self.api, {"workflow_run": {"id": 200}}, "workflow_run"),
            (91, HEAD),
        )

    def test_noncollaborator_app_dispatch_is_bound_to_successful_ci(self):
        run = {
            "id": 202, "run_attempt": 2, "path": ".github/workflows/ci.yml",
            "event": "pull_request", "status": "completed", "conclusion": "success",
            "repository": {"full_name": REPO}, "head_repository": {"full_name": REPO},
            "head_branch": "luxe-pilot/90", "head_sha": HEAD,
            "actor": {"id": 40, "type": "Bot", "login": "luxe-repair-app[bot]"},
            "pull_requests": [{"number": 91, "head": {"sha": HEAD}}],
        }
        self.api.data[f"{ROOT}/actions/runs/202"] = run
        event = {
            "action": QA_DISPATCH_EVENT,
            "client_payload": {"run_id": 202, "run_attempt": 2},
        }
        self.assertEqual(
            event_pr(self.api, event, "repository_dispatch", repair_bot_id=40),
            (91, HEAD),
        )
        self.assertEqual(
            self.api.calls,
            [("GET", f"{ROOT}/actions/runs/202", None)],
        )

        for change in (
            {"actor": {"id": 41, "type": "Bot"}},
            {"actor": {"id": 40, "type": "User"}},
            {"status": "in_progress"},
            {"conclusion": "failure"},
            {"head_repository": {"full_name": "outside/fork"}},
            {"run_attempt": 1},
            {"head_branch": "feature/90"},
        ):
            with self.subTest(change=change):
                self.api = API()
                self.api.data[f"{ROOT}/actions/runs/202"] = {**run, **change}
                with self.assertRaises(Blocked):
                    event_pr(self.api, event, "repository_dispatch", repair_bot_id=40)
        with self.assertRaises(Blocked):
            event_pr(self.api, event, "repository_dispatch", repair_bot_id=41)

    def test_protected_file_policy(self):
        self.assertFalse(protected(FILE))
        self.assertFalse(protected("frontend/features/drafts/editor.tsx"))
        self.assertFalse(protected("frontend/features/drafts/editor.test.tsx"))
        for path in ("docs/02_DECISIONS.md", "docs/help/script.ts", "docs/help/card.tsx",
                     "frontend/features/drafts/notes.md", "docs/help/AGENTS.md", "docs/help/../x.md",
                     "docs/help/*.md", "docs/help/secret\n.md", "frontend/features/auth/login.tsx",
                     "backend/tenancy/views.py", ".github/workflows/ci.yml", "package.json",
                     "frontend/features/drafts/schema.ts", "docs/help/permissions.md",
                     "docs/help/.agents/rules.md", "docs/help/package-lock.json", "docs/help/.hidden.md",
                     "frontend/features/drafts/tokens.test.ts"):
            with self.subTest(path=path):
                self.assertTrue(protected(path))

    def test_fingerprint_binds_ci_attempt(self):
        binding = self.read()["binding"]
        changed = copy.deepcopy(binding)
        changed["ci"]["attempt"] += 1
        self.assertNotEqual(fingerprint(binding), fingerprint(changed))

    def test_native_parent_leaf_and_dependencies_are_verified(self):
        for path, value in (
            (f"{ROOT}/issues/90/parent", {"number": 99}),
            (f"{ROOT}/issues/90/sub_issues", [{"number": 99}]),
            (f"{ROOT}/issues/90/dependencies/blocked_by", [{"number": 99, "state": "open"}]),
        ):
            with self.subTest(path=path):
                self.api = API()
                self.api.data[path] = value
                with self.assertRaises(Blocked):
                    self.read()

    def test_qa_publication_rejects_fabricated_pass_and_approval(self):
        binding = qa_preflight(self.read(), POLICY)
        report = {key: binding[key] for key in ("key", "head", "base", "issue", "digest", "ci")}
        report.update({"run_id": 300, "verdict": "Accepted", "findings": [],
                       "checks": {key: {"status": "pass", "evidence": "Observed current synthetic CI and source"}
                                  for key in CHECKS}})
        output = {"items": [{"type": "submit_pull_request_review", "event": "COMMENT",
                             "body": encode_qa(report)}]}
        self.assertEqual(validate_review(output, binding, 300)["verdict"], "Accepted")
        for change in ("approval", "stale", "ci", "safety", "placeholder", "duplicate", "retarget"):
            with self.subTest(change=change):
                altered = copy.deepcopy(output)
                changed_report = copy.deepcopy(report)
                changed_binding = copy.deepcopy(binding)
                if change == "approval":
                    altered["items"][0]["event"] = "APPROVE"
                elif change == "stale":
                    changed_report["head"] = "f" * 40
                elif change == "ci":
                    changed_binding["ci"]["passed"] = False
                    changed_report["ci"]["passed"] = False
                elif change == "safety":
                    changed_report["checks"]["security_privacy"]["status"] = "not-applicable"
                elif change == "placeholder":
                    changed_report["checks"]["scope"]["evidence"] = "LGTM"
                elif change == "duplicate":
                    altered["items"].append(altered["items"][0])
                else:
                    altered["items"][0]["pull_request_number"] = 92
                altered["items"][0]["body"] = encode_qa(changed_report)
                with self.assertRaises(Blocked):
                    validate_review(altered, changed_binding, 300)

    def test_sanitized_collected_and_published_qa_keeps_protocol_for_replay_gate(self):
        binding = qa_preflight(self.read(), POLICY)
        report = {key: binding[key] for key in ("key", "head", "base", "issue", "digest", "ci")}
        report.update({"run_id": 300, "verdict": "Changes Required", "findings": [],
                       "checks": {key: {"status": "pass", "evidence": "Observed current synthetic CI and source"}
                                  for key in CHECKS}})
        output = {"items": [{"type": "submit_pull_request_review", "event": "COMMENT",
                             "body": encode_qa(report)}]}
        collected = sanitize_safe_output(json.dumps(output))
        collected_output = json.loads(collected)
        self.assertIn(QA_ENVELOPE, collected_output["items"][0]["body"])
        self.assertEqual(validate_review(collected_output, binding, 300)["protocol"], QA_ENVELOPE)

        published_body = sanitize_safe_output(collected_output["items"][0]["body"])
        published = {"user": {"id": 30, "type": "Bot"}, "body": published_body}
        self.assertEqual(decode_qa(published_body)["key"], binding["key"])
        data = self.read()
        data["reviews"] = [published]
        with self.assertRaises(Blocked):
            qa_preflight(data, POLICY)
        legacy = sanitize_safe_output("Review summary.\n" + encode("gh-aw-qa", report))
        with self.assertRaises(Blocked):
            decode_qa(legacy)


if __name__ == "__main__":
    unittest.main()
