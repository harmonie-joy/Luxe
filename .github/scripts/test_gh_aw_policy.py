"""Synthetic evidence only; no live dispatch or credentials."""

import copy
import unittest

from autonomous_development import Blocked, ROOT, REPO, encode, scope_digest
from gh_aw_policy import ci_evidence, event_pr, fingerprint, protected, qa_preflight, snapshot


HEAD, BASE = "a" * 40, "b" * 40
FILE = "docs/help/resume.md"
POLICY = {"approver_ids": [10], "qa_reviewer_ids": [20], "qa_bot_ids": [30],
          "repair_bot_id": 40, "max_qa_reviews_per_pr": 6}


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
          "user": {"id": 50}, "head": {"sha": HEAD, "ref": "pilot", "repo": {"full_name": REPO}},
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
        record = {"user": {"id": 30, "type": "Bot"}, "body": encode("gh-aw-qa", {"key": key})}
        data["reviews"] = [record]
        with self.assertRaises(Blocked):
            qa_preflight(data, POLICY)
        data["reviews"] = [{**record, "body": encode("gh-aw-qa", {"key": str(i)})} for i in range(6)]
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

    def test_protected_file_policy(self):
        self.assertFalse(protected(FILE))
        self.assertFalse(protected("frontend/features/drafts/editor.tsx"))
        for path in ("docs/02_DECISIONS.md", "docs/help/AGENTS.md", "docs/help/../x.md",
                     "docs/help/*.md", "docs/help/secret\n.md", "frontend/features/auth/login.tsx",
                     "backend/tenancy/views.py", ".github/workflows/ci.yml", "package.json",
                     "frontend/features/drafts/schema.ts", "docs/help/permissions.md",
                     "docs/help/.agents/rules.md", "docs/help/package-lock.json"):
            with self.subTest(path=path):
                self.assertTrue(protected(path))

    def test_fingerprint_binds_ci_attempt(self):
        binding = self.read()["binding"]
        changed = copy.deepcopy(binding)
        changed["ci"]["attempt"] += 1
        self.assertNotEqual(fingerprint(binding), fingerprint(changed))


if __name__ == "__main__":
    unittest.main()
