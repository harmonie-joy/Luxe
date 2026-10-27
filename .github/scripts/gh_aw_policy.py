"""Read-only, fail-closed evidence gates for the separate gh-aw pilot."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys

from autonomous_development import (
    Blocked, CHECKS, GitHub, REPO, ROOT, approved, decode, forbidden,
    handoff, has_review_evidence, positive_int, scope_digest,
)


QA_PATH = ".github/workflows/luxe-independent-qa.lock.yml"
REPAIR_PATH = ".github/workflows/luxe-bounded-repair.lock.yml"
SIGNAL_PATH = ".github/workflows/luxe-repair-signal.yml"
CI_PATH = ".github/workflows/ci.yml"
QA_DISPATCH_EVENT = "luxe-repair-ci-complete"
POLICY = Path(__file__).resolve().parents[1] / "gh-aw-policy.json"
JOBS = {"frontend", "backend", "real-e2e", "autonomous-controller"}
SHA = re.compile(r"[0-9a-f]{40}")
QA_ENVELOPE = "luxe-autonomy-gh-aw-qa-v1"


def require(condition, reason):
    if not condition:
        raise Blocked(reason)


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def settings():
    value = json.loads(POLICY.read_text())
    for key in ("qa_enabled", "repair_enabled"):
        require(type(value.get(key)) is bool, "invalid enable switch")
    for key in ("approver_ids", "qa_reviewer_ids", "qa_bot_ids"):
        require(isinstance(value.get(key), list) and all(positive_int(v) for v in value[key]),
                "invalid identity allowlist")
    require(value.get("repair_bot_id") is None or positive_int(value["repair_bot_id"]),
            "invalid repair identity")
    require(type(value.get("max_qa_reviews_per_pr")) is int
            and 1 <= value["max_qa_reviews_per_pr"] <= 6, "invalid QA circuit breaker")
    return value


def protected(path):
    # The existing controller policy remains unchanged; the pilot is stricter.
    allowed_pair = (
        path.startswith("docs/help/") and path.endswith(".md")
        or path.startswith("frontend/features/") and path.endswith((".ts", ".tsx"))
    )
    return (
        forbidden(path)
        or not re.fullmatch(r"[A-Za-z0-9_./-]+\.(md|ts|tsx)", path)
        or any(part.startswith(".") for part in path.split("/"))
        or not allowed_pair
        or any(word in path.casefold() for word in
               ("auth", "tenan", "security", "privacy", "compliance", "schema",
                "permission", "session", "credential", "secret", "token", "governance", "dependenc"))
    )


def repair_ci_provenance(api, run_id, run_attempt, repair_bot_id):
    require(positive_int(run_id) and positive_int(run_attempt) and positive_int(repair_bot_id),
            "missing repair CI provenance")
    run = api.request("GET", f"{ROOT}/actions/runs/{run_id}")
    require(isinstance(run, dict), "repair App CI provenance is unverified")
    actor = run.get("actor", {})
    links = run.get("pull_requests", [])
    repository = run.get("repository")
    head_repository = run.get("head_repository")
    branch = run.get("head_branch")
    head_sha = run.get("head_sha")
    require(isinstance(actor, dict) and isinstance(links, list)
            and len(links) == 1 and isinstance(links[0], dict)
            and isinstance(repository, dict) and isinstance(head_repository, dict)
            and isinstance(branch, str) and isinstance(head_sha, str),
            "repair App CI provenance is unverified")
    head = links[0].get("head")
    require(isinstance(head, dict), "repair App CI provenance is unverified")
    require(run.get("id") == run_id and run.get("run_attempt") == run_attempt
            and run.get("path") == CI_PATH and run.get("event") == "pull_request"
            and run.get("status") == "completed" and run.get("conclusion") == "success"
            and repository.get("full_name") == REPO
            and head_repository.get("full_name") == REPO
            and re.fullmatch(r"luxe-pilot/[1-9][0-9]*", branch)
            and actor.get("id") == repair_bot_id and actor.get("type") == "Bot"
            and positive_int(links[0].get("number")) and head.get("sha") == head_sha
            and SHA.fullmatch(head_sha),
            "repair App CI provenance is unverified")
    return links[0]["number"], head_sha


def event_pr(api, event, event_name, *, repair=False, repair_bot_id=None):
    if event_name == "pull_request" and not repair:
        require(event.get("action") in {"opened", "reopened", "synchronize"}, "unsupported PR action")
        return event["pull_request"]["number"], event["pull_request"]["head"]["sha"]
    if event_name == "repository_dispatch" and not repair:
        require(event.get("action") == QA_DISPATCH_EVENT, "unsupported repository dispatch")
        hint = event.get("client_payload", {})
        require(isinstance(hint, dict) and set(hint) == {"run_id", "run_attempt"},
                "incomplete repair CI dispatch")
        return repair_ci_provenance(
            api, hint["run_id"], hint["run_attempt"], repair_bot_id,
        )
    require(event_name == "workflow_run", "unsupported event")
    hint = event.get("workflow_run", {})
    require(positive_int(hint.get("id")), "missing source run")
    run = api.request("GET", f"{ROOT}/actions/runs/{hint['id']}")
    paths = {QA_PATH, SIGNAL_PATH, CI_PATH} if repair else {CI_PATH}
    require(run.get("path") in paths and run.get("status") == "completed"
            and run.get("repository", {}).get("full_name") == REPO,
            "unverified source workflow")
    require(run.get("conclusion") == "success", "source workflow did not succeed")
    if run["path"] == QA_PATH:
        # A workflow_run of CI has no PR links on some API versions. Never guess.
        require(run.get("event") in {"pull_request", "workflow_run"}, "invalid QA trigger")
    else:
        expected = "pull_request_review" if run["path"] == SIGNAL_PATH else "pull_request"
        require(run.get("event") == expected, "invalid source trigger")
    links = run.get("pull_requests", [])
    require(len(links) == 1 and positive_int(links[0].get("number")), "source has no unique PR")
    return links[0]["number"], links[0]["head"]["sha"]


def ci_evidence(api, pr):
    runs = api.pages(
        f"{ROOT}/actions/workflows/ci.yml/runs?event=pull_request&head_sha={pr['head']['sha']}",
        "workflow_runs",
    )
    runs = [r for r in runs if r.get("path") == ".github/workflows/ci.yml"
            and r.get("event") == "pull_request" and r.get("head_sha") == pr["head"]["sha"]
            and r.get("head_repository", {}).get("full_name") == REPO
            and any(p.get("number") == pr["number"]
                    and p.get("head", {}).get("sha") == pr["head"]["sha"]
                    and p.get("base", {}).get("sha") == pr["base"]["sha"]
                    for p in r.get("pull_requests", []))]
    if not runs:
        return {"id": None, "attempt": None, "passed": False}
    run = max(runs, key=lambda r: (r["id"], r.get("run_attempt", 1)))
    jobs = api.pages(f"{ROOT}/actions/runs/{run['id']}/jobs?filter=latest", "jobs")
    passed = (run.get("status") == "completed" and run.get("conclusion") == "success"
              and all(sum(j.get("name") == name and j.get("conclusion") == "success"
                          for j in jobs) == 1 for name in JOBS))
    return {"id": run["id"], "attempt": run["run_attempt"], "passed": passed}


def snapshot(api, pr_number, expected_head, policy):
    require(positive_int(pr_number), "invalid PR number")
    pr = api.request("GET", f"{ROOT}/pulls/{pr_number}")
    require(pr.get("state") == "open" and not pr.get("merged"), "PR is not open")
    require(pr["head"]["repo"]["full_name"] == REPO and pr["base"]["repo"]["full_name"] == REPO
            and pr["base"]["ref"] == "master" and pr["head"]["ref"] != "master", "unsafe PR repository/base")
    head, base = pr["head"]["sha"], pr["base"]["sha"]
    require(SHA.fullmatch(head) and SHA.fullmatch(base) and head == expected_head, "stale PR revision")
    require(api.request("GET", f"{ROOT}/branches/master")["commit"]["sha"] == base, "stale master base")
    link = decode(pr.get("body"), "gh-aw-issue")
    require(set(link) == {"issue"} and positive_int(link["issue"]), "missing unique issue binding")
    issue = api.request("GET", f"{ROOT}/issues/{link['issue']}")
    require(issue.get("state") == "open" and "pull_request" not in issue, "issue is not open")
    scope = handoff(issue)
    comments = api.pages(f"{ROOT}/issues/{issue['number']}/comments")
    require(approved(issue, comments, policy), "missing current Founder scope approval")
    parent = api.request("GET", f"{ROOT}/issues/{issue['number']}/parent")
    require(parent.get("number") == scope["parent"]
            and parent.get("repository_url") == "https://api.github.com" + ROOT, "native parent changed")
    dependencies = api.pages(f"{ROOT}/issues/{issue['number']}/dependencies/blocked_by")
    require(sorted(d["number"] for d in dependencies) == sorted(scope["dependencies"])
            and all(d.get("state") == "closed" and d.get("state_reason") == "completed"
                    for d in dependencies), "native dependencies are unverified")
    require(not api.pages(f"{ROOT}/issues/{issue['number']}/sub_issues"), "issue is not a leaf")
    require(not any(l["name"] in {"autonomy:needs-human", "autonomy:awaiting-human"}
                    for l in issue.get("labels", [])), "issue is on human hold")
    timeline = api.pages(f"{ROOT}/issues/{issue['number']}/timeline")
    linked = {e["source"]["issue"]["number"] for e in timeline
              if e.get("event") == "cross-referenced"
              and e.get("source", {}).get("issue", {}).get("pull_request")
              and e["source"]["issue"].get("repository_url") == "https://api.github.com" + ROOT}
    require(pr_number in linked, "issue does not reference this PR")
    for number in linked - {pr_number}:
        require(api.request("GET", f"{ROOT}/pulls/{number}").get("state") == "closed",
                "multiple open PRs for one issue")
    files = api.pages(f"{ROOT}/pulls/{pr_number}/files")
    require(0 < len(files) == pr.get("changed_files") < 3000, "incomplete changed-file evidence")
    paths = {f["filename"] for f in files}
    paths.update(f["previous_filename"] for f in files if "previous_filename" in f)
    require(paths <= set(scope["allowed_files"]), "PR changed files outside original scope")
    reviews = api.pages(f"{ROOT}/pulls/{pr_number}/reviews")
    ci = ci_evidence(api, pr)
    binding = {"pr": pr_number, "issue": issue["number"], "head": head, "base": base,
               "digest": scope_digest(issue), "allowed_files": scope["allowed_files"], "ci": ci}
    return {"binding": binding, "pr": pr, "issue": issue, "scope": scope,
            "comments": comments, "reviews": reviews, "files": files}


def qa_record(review):
    try:
        return decode_qa(review.get("body"))
    except Blocked:
        return None


def encode_qa(report):
    require(isinstance(report, dict) and "protocol" not in report, "invalid QA report")
    return f"```json\n{json.dumps({**report, 'protocol': QA_ENVELOPE}, sort_keys=True)}\n```"


def decode_qa(body):
    matches = re.findall(r"(?m)^```json[ \t]*\r?\n([\s\S]*?)^```[ \t]*$", body or "")
    require(len(matches) == 1, "missing or ambiguous QA report")
    try:
        report = json.loads(matches[0])
    except (ValueError, TypeError) as exc:
        raise Blocked("invalid QA JSON") from exc
    require(isinstance(report, dict) and report.get("protocol") == QA_ENVELOPE,
            "missing or invalid QA protocol")
    return report


def qa_preflight(data, policy):
    require(bool(policy["approver_ids"]) and bool(policy["qa_bot_ids"]), "QA identities not configured")
    binding = data["binding"]
    key = fingerprint(binding)
    records = [r for r in data["reviews"] if r.get("user", {}).get("type") == "Bot"
               and r["user"].get("id") in policy["qa_bot_ids"]]
    require(len(records) < policy["max_qa_reviews_per_pr"], "QA review budget exhausted; require human QA")
    require(all(qa_record(r) is not None for r in records), "malformed previous QA evidence")
    require(not any(qa_record(r).get("key") == key for r in records), "duplicate QA evidence; not replaying")
    return {**binding, "key": key}


def outputs(value):
    path = os.environ.get("GITHUB_OUTPUT")
    require(bool(path), "missing Actions output channel")
    with open(path, "a") as stream:
        for key in ("pr", "issue", "head", "base", "digest", "key"):
            if key in value:
                stream.write(f"{key}={value[key]}\n")
        stream.write("binding=" + json.dumps(value, separators=(",", ":")) + "\n")


def validate_review(output, binding, run_id):
    require(isinstance(output, dict) and isinstance(output.get("items"), list)
            and len(output["items"]) == 1, "exactly one QA COMMENT required")
    item = output["items"][0]
    require(isinstance(item, dict) and item.get("type") == "submit_pull_request_review"
            and item.get("event", "COMMENT") == "COMMENT", "only COMMENT reviews are permitted")
    require(not any(k in item for k in ("repo", "repository", "owner", "commit_id", "comments")),
            "QA output may not override trusted target or add inline effects")
    if "pull_request_number" in item:
        require(item["pull_request_number"] == binding["pr"], "QA output retargeted PR")
    report = decode_qa(item.get("body"))
    require(all(report.get(k) == binding[k] for k in ("key", "head", "base", "issue", "digest", "ci"))
            and report.get("run_id") == run_id, "QA output evidence binding changed")
    require(report.get("verdict") in {"Accepted", "Accepted with Notes", "Changes Required", "Blocked"},
            "invalid QA verdict")
    checks = report.get("checks")
    require(isinstance(checks, dict) and set(checks) == CHECKS, "incomplete QA checks")
    require(all(isinstance(c, dict) and c.get("status") in {"pass", "fail", "not-applicable"}
                and has_review_evidence(c.get("evidence")) for c in checks.values()), "unverified QA evidence")
    findings = report.get("findings")
    require(isinstance(findings, list) and all(
        isinstance(f, dict) and f.get("severity") in {"Blocker", "Major", "Minor", "Note"}
        and isinstance(f.get("file"), str) and f["file"].strip()
        and has_review_evidence(f.get("reason")) for f in findings), "invalid QA findings")
    if not binding["ci"]["passed"]:
        require(report["verdict"] == "Blocked", "unverified CI cannot yield a QA pass")
    if report["verdict"] in {"Accepted", "Accepted with Notes"}:
        require(all(checks[k]["status"] == "pass" for k in
                    ("scope", "correctness", "tests", "security_privacy"))
                and not any(c["status"] == "fail" for c in checks.values())
                and not any(f["severity"] in {"Blocker", "Major"} for f in findings), "QA acceptance contradicted")
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--recheck", action="store_true")
    parser.add_argument("--validate-output", action="store_true")
    args = parser.parse_args()
    policy = settings()
    require(policy["qa_enabled"] and os.environ.get("QA_ENABLED") == "true", "QA pilot disabled")
    api = GitHub(os.environ["GH_TOKEN"])
    if args.recheck or args.validate_output:
        original = json.loads(os.environ["EXPECTED_BINDING"])
        data = snapshot(api, original["pr"], original["head"], policy)
        require(qa_preflight(data, policy) == original, "QA source/evidence changed during review")
        if args.validate_output:
            path = Path(os.environ["GH_AW_AGENT_OUTPUT"])
            require(path.stat().st_size <= 262144, "oversized QA output")
            validate_review(json.loads(path.read_text()), original, int(os.environ["GITHUB_RUN_ID"]))
    else:
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
        pr, head = event_pr(
            api, event, os.environ["GITHUB_EVENT_NAME"], repair_bot_id=policy["repair_bot_id"],
        )
        outputs(qa_preflight(snapshot(api, pr, head, policy), policy))


if __name__ == "__main__":
    try:
        main()
    except (Blocked, KeyError, TypeError, ValueError, OSError) as exc:
        # Never echo event bodies, API responses, proposed content or credentials.
        print(f"Blocked: {exc}" if isinstance(exc, Blocked) else "Blocked: malformed or unavailable evidence",
              file=sys.stderr)
        sys.exit(1)
