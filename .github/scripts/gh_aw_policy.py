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
POLICY = Path(__file__).resolve().parents[1] / "gh-aw-policy.json"
JOBS = {"frontend", "backend", "real-e2e", "autonomous-controller"}
SHA = re.compile(r"[0-9a-f]{40}")


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
    return (
        forbidden(path)
        or not re.fullmatch(r"[A-Za-z0-9_/-]+\.(md|ts|tsx)", path)
        or not path.startswith(("docs/help/", "frontend/features/"))
        or any(word in path.casefold() for word in
               ("auth", "tenan", "security", "privacy", "compliance", "schema",
                "permission", "session", "credential", "governance", "dependenc"))
    )


def event_pr(api, event, event_name, *, repair=False):
    if event_name == "pull_request" and not repair:
        require(event.get("action") in {"opened", "reopened", "synchronize"}, "unsupported PR action")
        return event["pull_request"]["number"], event["pull_request"]["head"]["sha"]
    require(event_name == "workflow_run", "unsupported event")
    hint = event.get("workflow_run", {})
    require(positive_int(hint.get("id")), "missing source run")
    run = api.request("GET", f"{ROOT}/actions/runs/{hint['id']}")
    paths = {QA_PATH, SIGNAL_PATH, ".github/workflows/ci.yml"} if repair else {".github/workflows/ci.yml"}
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
        return decode(review.get("body"), "gh-aw-qa")
    except Blocked:
        return None


def qa_preflight(data, policy):
    require(bool(policy["approver_ids"]) and bool(policy["qa_bot_ids"]), "QA identities not configured")
    binding = data["binding"]
    key = fingerprint(binding)
    records = [r for r in data["reviews"] if r.get("user", {}).get("type") == "Bot"
               and r["user"].get("id") in policy["qa_bot_ids"]
               and "<!-- luxe-autonomy:gh-aw-qa:v1 -->" in (r.get("body") or "")]
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--recheck", action="store_true")
    args = parser.parse_args()
    policy = settings()
    require(policy["qa_enabled"] and os.environ.get("QA_ENABLED") == "true", "QA pilot disabled")
    api = GitHub(os.environ["GH_TOKEN"])
    if args.recheck:
        original = json.loads(os.environ["EXPECTED_BINDING"])
        data = snapshot(api, original["pr"], original["head"], policy)
        require(qa_preflight(data, policy) == original, "QA source/evidence changed during review")
    else:
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
        pr, head = event_pr(api, event, os.environ["GITHUB_EVENT_NAME"])
        outputs(qa_preflight(snapshot(api, pr, head, policy), policy))


if __name__ == "__main__":
    try:
        main()
    except (Blocked, KeyError, TypeError, ValueError, OSError) as exc:
        # Never echo event bodies, API responses, proposed content or credentials.
        print(f"Blocked: {exc}" if isinstance(exc, Blocked) else "Blocked: malformed or unavailable evidence",
              file=sys.stderr)
        sys.exit(1)
