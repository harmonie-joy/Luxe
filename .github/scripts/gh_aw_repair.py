"""One existing text-file repair via gh-aw safe output and atomic GitHub CAS."""

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request

from autonomous_development import Blocked, GitHub, REPO, ROOT, decode, encode, positive_int
from gh_aw_policy import (
    CHECKS, QA_PATH, REPAIR_PATH, SHA, advisory_qa_record, event_pr, fingerprint,
    has_review_evidence, protected, qa_record, require, settings, snapshot,
)


COMMIT = """mutation($input: CreateCommitOnBranchInput!) {
  createCommitOnBranch(input: $input) { commit { oid } }
}"""
MAX_BYTES = 32768
ATTEMPT_MARKER = "<!-- luxe-autonomy:gh-aw-repair:v1 -->"


def consumed(comments):
    # Even malformed or foreign repair records cause a human hold, not a reset.
    return any(ATTEMPT_MARKER in (c.get("body") or "")
               or ("<!-- luxe-autonomy:event:v1 -->" in (c.get("body") or "")
                   and "repair-reserved" in c["body"]) for c in comments)


def evidence_checks(checks, required):
    require(isinstance(checks, dict) and set(checks) == set(required), "incomplete QA checks")
    require(all(isinstance(c, dict) and c.get("status") in {"pass", "fail", "not-applicable"}
                and has_review_evidence(c.get("evidence")) for c in checks.values()), "unverified QA checks")


def repair_binding(api, data, policy, *, allow_reservation=None):
    binding, scope, reviews = data["binding"], data["scope"], data["reviews"]
    require(bool(policy["qa_reviewer_ids"]) and bool(policy["qa_bot_ids"])
            and positive_int(policy["repair_bot_id"]), "repair identities not configured")
    require(scope["risk"] in {"L0", "L1"} and len(scope["allowed_files"]) == 1,
            "pilot supports one exact allowed file only")
    path = scope["allowed_files"][0]
    require(not protected(path), "protected repair file")
    require(data["pr"]["head"]["ref"].startswith("luxe-pilot/"), "repair branch is outside pilot")
    require(all(f.get("status") == "modified" and f["filename"] == path
                and "previous_filename" not in f for f in data["files"]), "repair supports existing-file edits only")
    comments = data["comments"]
    if allow_reservation is not None:
        own = [c for c in comments if c.get("id") == allow_reservation]
        require(len(own) == 1 and own[0].get("user", {}).get("id") == policy["repair_bot_id"],
                "reservation disappeared or identity changed")
        comments = [c for c in comments if c.get("id") != allow_reservation]
    require(not consumed(comments), "issue repair allowance already consumed or uncertain")
    require(binding["ci"]["passed"], "current CI is not fully successful")
    bots = [r for r in reviews if r.get("user", {}).get("id") in policy["qa_bot_ids"]
            and r["user"].get("type") == "Bot"]
    bots = [r for r in bots if not advisory_qa_record(r, binding["pr"])]
    require(bool(bots), "missing independent advisory QA")
    qa = max(bots, key=lambda r: r["id"])
    report = qa_record(qa)
    require(isinstance(report, dict) and qa.get("state") == "COMMENTED"
            and qa.get("commit_id") == binding["head"], "stale or malformed advisory QA")
    require(qa["user"]["id"] != data["pr"]["user"]["id"], "QA is not independent of PR author")
    qa_key = fingerprint(binding)
    require(all(report.get(k) == binding[k] for k in ("head", "base", "issue", "digest", "ci"))
            and report.get("key") == qa_key, "QA source/CI binding changed")
    require(report.get("verdict") == "Changes Required", "no explicit repairable QA verdict")
    evidence_checks(report.get("checks"), CHECKS)
    require(all(report["checks"][k]["status"] == "pass" for k in ("scope", "security_privacy")),
            "QA safety evidence did not pass")
    require(not any(c["status"] == "fail" for k, c in report["checks"].items()
                    if k not in {"correctness", "tests"}), "non-correctness QA failure")
    findings = report.get("findings")
    require(isinstance(findings, list) and 0 < len(findings) <= 5, "no bounded explicit findings")
    require(all(isinstance(f, dict) and f.get("category") in {"correctness", "tests"}
                and f.get("severity") in {"Blocker", "Major", "Minor"} and f.get("file") == path
                and has_review_evidence(f.get("reason")) for f in findings), "sensitive or out-of-scope findings")
    require(positive_int(report.get("run_id")), "missing QA workflow provenance")
    run = api.request("GET", f"{ROOT}/actions/runs/{report['run_id']}")
    require(run.get("path") == QA_PATH and run.get("repository", {}).get("full_name") == REPO
            and run.get("status") == "completed" and run.get("conclusion") == "success"
            and run.get("event") in {"pull_request", "workflow_run"}, "QA workflow evidence is unverified")
    if run["event"] == "pull_request":
        require(run.get("head_sha") == binding["head"], "QA run reviewed another head")
    humans = [r for r in reviews if r.get("user", {}).get("id") in policy["qa_reviewer_ids"]]
    require(bool(humans), "independent human attestation required")
    human = max(humans, key=lambda r: r["id"])
    require(human.get("user", {}).get("type") == "User"
            and human["user"]["id"] != data["pr"]["user"]["id"]
            and human.get("state") == "COMMENTED" and human.get("commit_id") == binding["head"]
            and bool(qa.get("submitted_at")) and human.get("submitted_at", "") >= qa["submitted_at"],
            "attestation is not independent/current")
    attestation = decode(human.get("body"), "gh-aw-repair-attestation")
    require(set(attestation) == {"qa_review_id", "qa_sha256", "binding", "checks"},
            "invalid repair attestation fields")
    require(attestation["qa_review_id"] == qa["id"] and attestation["binding"] == {**binding, "key": qa_key}
            and attestation["qa_sha256"] == hashlib.sha256(qa["body"].encode()).hexdigest(),
            "human attestation does not bind exact QA and CI")
    evidence_checks(attestation["checks"], {"scope", "security_privacy", "correctness", "tests"})
    require(all(c["status"] == "pass" for c in attestation["checks"].values()), "human verification failed")
    return {**binding, "key": qa_key, "qa_review_id": qa["id"],
            "qa_sha256": attestation["qa_sha256"], "attestation_id": human["id"],
            "attestation_sha256": hashlib.sha256(human["body"].encode()).hexdigest(),
            "file": path, "branch": data["pr"]["head"]["ref"]}


def proposal_content(api, binding, proposal):
    require(isinstance(proposal, dict) and set(proposal) == {"type", "path", "content_base64"}
            and proposal["type"] == "propose_repair" and proposal["path"] == binding["file"]
            and not protected(proposal["path"]), "unsafe safe-output file or fields")
    content_base64 = proposal["content_base64"]
    require(isinstance(content_base64, str) and 0 < len(content_base64) <= 4 * ((MAX_BYTES + 2) // 3),
            "invalid or oversized encoded repair content")
    try:
        content = base64.b64decode(content_base64, validate=True)
        require(base64.b64encode(content).decode() == content_base64, "non-canonical repair content encoding")
        text = content.decode("utf-8")
    except (ValueError, UnicodeDecodeError) as exc:
        raise Blocked("repair content must be canonical base64-encoded UTF-8") from exc
    require(0 < len(content) <= MAX_BYTES and b"\x00" not in content,
            "invalid or oversized repair content")
    tree = api.request("GET", f"{ROOT}/git/trees/{binding['head']}?recursive=1")
    require(tree.get("truncated") is False and isinstance(tree.get("tree"), list), "incomplete source tree")
    matches = [f for f in tree["tree"] if f.get("path") == binding["file"]]
    require(len(matches) == 1 and matches[0].get("mode") == "100644"
            and matches[0].get("type") == "blob" and 0 < matches[0].get("size", 0) <= MAX_BYTES,
            "only existing regular text files may be repaired")
    blob = api.request("GET", f"{ROOT}/git/blobs/{matches[0]['sha']}")
    require(blob.get("encoding") == "base64", "unverified original content")
    original = base64.b64decode(blob["content"].replace("\n", ""), validate=True)
    require(len(original) <= MAX_BYTES and b"\x00" not in original, "original is not bounded text")
    original.decode("utf-8")
    require(original != content, "repair has no changes")
    return base64.b64encode(text.encode("utf-8")).decode()


def repair_proposal(output):
    require(isinstance(output, dict) and isinstance(output.get("items"), list)
            and len(output["items"]) == 1, "exactly one repair proposal required")
    item = output["items"][0]
    require(isinstance(item, dict)
            and set(item) == {"type", "binding", "path", "content_base64"}
            and item.get("type") == "propose_repair", "invalid repair proposal")
    require(isinstance(item["binding"], str), "invalid repair binding")
    return json.loads(item["binding"]), {key: value for key, value in item.items() if key != "binding"}


def confirmed_reservation(record, expected_body, bot_id):
    require(isinstance(record, dict) and positive_int(record.get("id")) and record.get("body") == expected_body
            and record.get("user", {}).get("id") == bot_id and record["user"].get("type") == "Bot"
            and bool(record.get("created_at")) and record["created_at"] == record.get("updated_at"),
            "repair reservation response is uncertain")


def apply_repair(api, expected, proposal, policy, *, run_id):
    require(positive_int(run_id), "unverified repair run")
    data = snapshot(api, expected["pr"], expected["head"], policy)
    require(repair_binding(api, data, policy) == expected, "repair evidence changed after inference")
    content = proposal_content(api, expected, proposal)
    run_url = f"https://github.com/{REPO}/actions/runs/{run_id}"
    body = encode("gh-aw-repair", {
        "attempt": 1, "binding": expected,
        "content_sha256": hashlib.sha256(base64.b64decode(content, validate=True)).hexdigest(),
        "run_id": run_id,
    }) + f"\n\nReserved by [THE LUXE gh-aw bounded repair]({run_url}). Never retry automatically."
    # Reserve before committing. A lost response consumes the allowance.
    reservation = api.request("POST", f"{ROOT}/issues/{expected['issue']}/comments", {"body": body})
    confirmed_reservation(reservation, body, policy["repair_bot_id"])
    persisted = api.request("GET", f"{ROOT}/issues/comments/{reservation['id']}")
    confirmed_reservation(persisted, body, policy["repair_bot_id"])
    current = snapshot(api, expected["pr"], expected["head"], policy)
    own = [c for c in current["comments"] if c.get("id") == reservation["id"]]
    require(len(own) == 1, "reservation no longer visible")
    confirmed_reservation(own[0], body, policy["repair_bot_id"])
    require(repair_binding(api, current, policy, allow_reservation=reservation["id"]) == expected,
            "source or approvals changed after reservation")
    # GitHub atomically rejects a head change between the last read and this write.
    response = api.request("POST", "/graphql", {"query": COMMIT, "variables": {"input": {
        "branch": {"repositoryNameWithOwner": REPO, "branchName": expected["branch"]},
        "expectedHeadOid": expected["head"],
        "message": {"headline": f"fix: bounded QA repair for issue #{expected['issue']}",
                    "body": f"One reserved gh-aw repair. Evidence: {run_url}\n\n"
                            "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"},
        "fileChanges": {"additions": [{"path": expected["file"], "contents": content}]},
    }}})
    require(isinstance(response, dict) and not response.get("errors"), "commit API outcome uncertain; never retry")
    result = response.get("data")
    require(isinstance(result, dict) and isinstance(result.get("createCommitOnBranch"), dict),
            "commit response unverified; never retry")
    commit = result["createCommitOnBranch"].get("commit")
    require(isinstance(commit, dict), "commit response unverified; never retry")
    oid = commit.get("oid")
    require(isinstance(oid, str) and SHA.fullmatch(oid), "commit response unverified; never retry")
    actual = api.request("GET", f"{ROOT}/pulls/{expected['pr']}")
    require(actual["head"]["sha"] == oid, "commit not confirmed on PR; never retry")
    return oid


class SafeOutputGitHub(GitHub):
    def request(self, method, path, data=None):
        if method == "GET":
            return super().request(method, path, data)
        if path != "/graphql":
            require(method == "POST" and re.fullmatch(re.escape(ROOT) + r"/issues/[1-9][0-9]*/comments", path),
                    "unsafe write endpoint")
            return super().request(method, path, data)
        require(method == "POST" and data.get("query") == COMMIT, "unsupported GraphQL operation")
        request = urllib.request.Request(
            "https://api.github.com/graphql", method="POST", data=json.dumps(data).encode(),
            headers={"Authorization": f"Bearer {self.token}", "Accept": "application/vnd.github+json",
                     "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json"},
        )
        try:
            with self.opener.open(request, timeout=20) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            raise Blocked(f"GitHub commit failed ({getattr(exc, 'code', 'transport')}); never retry") from exc


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    policy = settings()
    require(policy["qa_enabled"] and policy["repair_enabled"]
            and os.environ.get("QA_ENABLED") == "true" and os.environ.get("REPAIR_ENABLED") == "true",
            "repair pilot disabled")
    require(os.environ.get("GITHUB_REF") == "refs/heads/master"
            and os.environ.get("GITHUB_WORKFLOW_REF") == f"{REPO}/{REPAIR_PATH}@refs/heads/master",
            "repair must execute reviewed default-branch workflow")
    if args.apply:
        require(os.environ.get("GH_AW_SAFE_OUTPUTS_STAGED") != "true", "staged output cannot write")
        api = SafeOutputGitHub(os.environ["REPAIR_TOKEN"], dry_run=False)
        output_path = Path(os.environ["GH_AW_AGENT_OUTPUT"])
        require(output_path.stat().st_size <= 262144, "oversized safe output")
        output = json.loads(output_path.read_text())
        expected, proposal = repair_proposal(output)
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
        pr, head = event_pr(api, event, os.environ["GITHUB_EVENT_NAME"], repair=True)
        require(expected["pr"] == pr and expected["head"] == head, "proposal retargeted the triggering PR")
        apply_repair(api, expected, proposal, policy, run_id=int(os.environ["GITHUB_RUN_ID"]))
        print("One reserved repair commit confirmed; fresh CI/independent QA and human merge required.")
    else:
        api = GitHub(os.environ["GH_TOKEN"])
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
        pr, head = event_pr(api, event, os.environ["GITHUB_EVENT_NAME"], repair=True)
        binding = repair_binding(api, snapshot(api, pr, head, policy), policy)
        with open(os.environ["GITHUB_OUTPUT"], "a") as stream:
            stream.write("binding=" + json.dumps(binding, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    try:
        main()
    except (Blocked, KeyError, TypeError, ValueError, OSError) as exc:
        print(f"Blocked: {exc}" if isinstance(exc, Blocked) else "Blocked: malformed or unavailable evidence",
              file=sys.stderr)
        sys.exit(1)
