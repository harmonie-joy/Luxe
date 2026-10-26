"""GitHub-native reconciliation. CLI/Actions are read-only; activation is separate."""

import argparse
import hashlib
import json
import os
from pathlib import PurePosixPath
import re
import sys
import urllib.error
import urllib.request


REPO = "harmonie-joy/Luxe"
ROOT = f"/repos/{REPO}"
CHECKS = {"scope", "correctness", "contracts", "errors", "tests", "regressions",
          "security_privacy", "documentation", "decisions", "ux"}
SAFETY_CHECKS = {"scope", "security_privacy"}
MANDATORY_QA_CHECKS = SAFETY_CHECKS | {"correctness", "tests"}
SENSITIVE_NAMES = {"agents.md", "agents.override.md", "claude.md", "gemini.md", "review.md", "skill.md",
                   "codeowners", "copilot-instructions.md"}
SENSITIVE_DIRS = {".github", ".agents", ".codex", "agents", "skills", "prompts",
                  "instructions", "policies", "governance"}
SENSITIVE_PATHS = {
    "docs/00_project_brief.md", "docs/01_architecture.md", "docs/02_decisions.md",
    "docs/03_progress_log.md", "docs/04_next_actions.md", "docs/05_ai_work_log.md",
    "docs/10_ai_team_operating_model.md", "docs/11_agent_handoff_template.md",
    "docs/12_agent_harness_portability.md", "docs/the_luxe_data_model_source_of_truth.md",
    "docs/qa/autonomous_controller_handoff.md",
}
REQUIRED_JOBS = {"frontend", "backend", "real-e2e", "autonomous-controller"}
EVENTS = {"reserved", "dispatched", "qa-reserved", "qa-requested",
          "repair-reserved", "repair-requested", "awaiting-human"}


class Blocked(Exception):
    """An uncertain observation must never become permission to dispatch."""


def encode(kind, value):
    return f"<!-- luxe-autonomy:{kind}:v1 -->\n```json\n{json.dumps(value, sort_keys=True)}\n```"


def decode(body, kind):
    pattern = rf"<!-- luxe-autonomy:{kind}:v1 -->\s*```json\s*([\s\S]*?)\s*```"
    matches = re.findall(pattern, body or "")
    if len(matches) != 1:
        raise Blocked(f"missing or ambiguous {kind} record")
    try:
        value = json.loads(matches[0])
    except (ValueError, TypeError) as exc:
        raise Blocked(f"invalid {kind} JSON") from exc
    if not isinstance(value, dict):
        raise Blocked(f"invalid {kind} object")
    return value


def positive_int(value):
    return type(value) is int and value > 0


def forbidden(path):
    parts = PurePosixPath(path).parts
    return (
        not parts or path != str(PurePosixPath(path)) or path.startswith(("/", "."))
        or ".." in parts or "\\" in path or any(c in path for c in "*?[]\n\r")
        or parts[-1].casefold() in SENSITIVE_NAMES
        or parts[-1].casefold().endswith((".agent.md", ".instructions.md", ".prompt.md"))
        or any(part.casefold() in SENSITIVE_DIRS for part in parts[:-1])
        or path.casefold() in SENSITIVE_PATHS or path.casefold().startswith("docs/ux/")
        or any(part in {"migrations", "temp", "node_modules"} for part in parts)
        or path.startswith(("backend/config/", "backend/tenancy/", "backend/llm/",
                            "backend/compliance/", "backend/requirements/", "frontend/features/auth/",
                            "frontend/app/login/", "frontend/app/signup/", "frontend/lib/api/auth"))
        or parts[-1] in {"models.py", "package.json", "package-lock.json", "pnpm-lock.yaml",
                         "requirements.txt", "yarn.lock", "Dockerfile", "compose.yml"}
    )


def handoff(item):
    value = decode(item.get("body"), "handoff")
    if value.get("risk") not in {"L0", "L1"} or value.get("base_branch") != "master":
        raise Blocked("only L0/L1 work based on master is eligible")
    for key in ("problem", "goal", "non_goals", "scope"):
        if not isinstance(value.get(key), str) or not value[key].strip():
            raise Blocked(f"missing handoff {key}")
    for key in ("allowed_files", "forbidden_files", "acceptance_criteria", "verification"):
        if not isinstance(value.get(key), list) or not value[key] or not all(
            isinstance(entry, str) and entry.strip() for entry in value[key]
        ):
            raise Blocked(f"missing handoff {key}")
    files = value["allowed_files"]
    if len(set(files)) != len(files) or any(forbidden(path) for path in files):
        raise Blocked("unsafe or duplicate allowed file")
    if value["risk"] == "L0" and any(not path.startswith("docs/") for path in files):
        raise Blocked("L0 scope must contain documentation only")
    if any(path == denied or path.startswith(denied.rstrip("/") + "/")
           for path in files for denied in value["forbidden_files"]):
        raise Blocked("allowed and forbidden files overlap")
    if not positive_int(value.get("parent")):
        raise Blocked("a native parent is required for the initial release")
    deps = value.get("dependencies")
    if not isinstance(deps, list) or not all(positive_int(dep) for dep in deps):
        raise Blocked("explicit dependency list required")
    if len(set(deps)) != len(deps) or item["number"] in deps:
        raise Blocked("invalid dependencies")
    return value


def scope_digest(item):
    payload = json.dumps({"number": item["number"], "title": item["title"],
                          "body": item.get("body")}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()


def unedited(comment):
    return bool(comment.get("created_at")) and comment["created_at"] == comment.get("updated_at")


def approved(item, comments, settings):
    scope = handoff(item)
    for comment in comments:
        if (comment.get("user", {}).get("id") not in settings["approver_ids"]
                or comment.get("user", {}).get("type") != "User" or not unedited(comment)):
            continue
        try:
            value = decode(comment.get("body"), "approval")
        except Blocked:
            continue
        if value == {"issue": item["number"], "digest": scope_digest(item),
                     "risk": scope["risk"], "allowed_files": scope["allowed_files"],
                     "verification": scope["verification"]}:
            return True
    return False


def ineligible(item, comments, children, dependencies, settings):
    if item["number"] == 58 or item["number"] in settings.get("excluded_issues", []):
        return "container issue excluded"
    if item.get("state") != "open" or "pull_request" in item:
        return "not an open work issue"
    labels = {label["name"] for label in item.get("labels", [])}
    if not {"ready-for-agent", "autonomy:enabled"} <= labels:
        return "not opted in and ready"
    if labels & {"autonomy:active", "autonomy:needs-human", "autonomy:awaiting-human"}:
        return "existing work or human intervention"
    if item.get("assignees"):
        return "already assigned"
    if children or item.get("sub_issues_summary", {}).get("total", 0):
        return "not a leaf issue"
    try:
        scope = handoff(item)
        if sorted(scope["dependencies"]) != sorted(dep["number"] for dep in dependencies):
            return "native dependencies disagree with handoff"
        if any(dep.get("state") != "closed" or dep.get("state_reason") != "completed"
               for dep in dependencies):
            return "dependency not completed"
        if not approved(item, comments, settings):
            return "no current human scope approval"
    except (Blocked, KeyError, TypeError):
        return "invalid or sensitive handoff"
    return None


def ledger(item, comments, settings):
    events = []
    for comment in comments:
        if (comment.get("user", {}).get("id") != settings["controller_user_id"]
                or "<!-- luxe-autonomy:event:v1 -->" not in (comment.get("body") or "")):
            continue
        value = decode(comment["body"], "event")
        if (not unedited(comment) or value.get("issue") != item["number"]
                or value.get("event") not in EVENTS
                or not re.fullmatch(r"[a-f0-9]{64}", value.get("digest", ""))
                or not positive_int(comment.get("id"))):
            raise Blocked("damaged reservation history; human reconciliation required")
        events.append({**value, "id": comment["id"], "created_at": comment["created_at"]})
    events.sort(key=lambda event: event["id"])
    if events and (events[0]["event"] != "reserved"
                   or sum(event["event"] == "reserved" for event in events) != 1
                   or len({event["digest"] for event in events}) != 1):
        raise Blocked("inconsistent reservation history")
    return events


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise Blocked("API redirect refused")


class GitHub:
    def __init__(self, token, *, dry_run=True):
        self.token = token
        self.dry_run = dry_run
        self.opener = urllib.request.build_opener(NoRedirect)

    def request(self, method, path, data=None):
        if not (path.startswith(ROOT + "/") or path.startswith(f"/agents/repos/{REPO}/tasks")):
            raise Blocked("API path outside repository")
        if method != "GET" and self.dry_run:
            raise Blocked("dry-run transport refuses every GitHub write")
        request = urllib.request.Request(
            "https://api.github.com" + path, method=method,
            data=None if data is None else json.dumps(data).encode(),
            headers={"Authorization": f"Bearer {self.token}",
                     "Accept": "application/vnd.github+json",
                     "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "theluxe-controller"},
        )
        try:
            with self.opener.open(request, timeout=20) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            # API bodies may contain private content; report only a status/category.
            raise Blocked(f"GitHub {method} failed ({getattr(exc, 'code', 'transport')})") from exc

    def pages(self, path, key=None):
        values = []
        for page in range(1, 1001):
            batch = self.request("GET", f"{path}{'&' if '?' in path else '?'}per_page=100&page={page}")
            if key:
                if not isinstance(batch, dict):
                    raise Blocked("unexpected paginated API object")
                batch = batch.get(key)
            if not isinstance(batch, list):
                raise Blocked("unexpected paginated API response")
            values.extend(batch)
            if len(batch) < 100:
                return values
        raise Blocked("API pagination exceeded safe limit")


def collect(api, settings):
    issues = [item for item in api.pages(ROOT + "/issues?state=all") if "pull_request" not in item]
    pulls = api.pages(ROOT + "/pulls?state=all")
    facts = {"issues": issues, "pulls": pulls, "items": {},
             "master": api.request("GET", ROOT + "/branches/master")["commit"]["sha"]}
    for item in issues:
        number = item["number"]
        # Scan closed issues too: removing labels or closing an issue must not erase a claim.
        comments = api.pages(f"{ROOT}/issues/{number}/comments") if item.get("comments", 0) else []
        events = ledger(item, comments, settings)
        opted = "autonomy:enabled" in {label["name"] for label in item.get("labels", [])}
        detail = {"comments": comments, "events": events, "children": [], "dependencies": [], "links": []}
        if opted or events:
            try:
                scope = handoff(item)
            except (Blocked, TypeError, KeyError):
                if events:
                    raise Blocked("reserved handoff is damaged; human reconciliation required")
                facts["items"][number] = detail
                continue
            detail["children"] = api.pages(f"{ROOT}/issues/{number}/sub_issues")
            detail["dependencies"] = api.pages(f"{ROOT}/issues/{number}/dependencies/blocked_by")
            parent = api.request("GET", f"{ROOT}/issues/{number}/parent")
            if parent.get("number") != scope["parent"] or parent.get("repository_url") != "https://api.github.com" + ROOT:
                raise Blocked("native parent disagrees with handoff")
            timeline = api.pages(f"{ROOT}/issues/{number}/timeline")
            detail["links"] = sorted({entry["source"]["issue"]["number"] for entry in timeline
                if entry.get("event") == "cross-referenced"
                and entry.get("source", {}).get("issue", {}).get("pull_request")
                and entry["source"]["issue"].get("repository_url") == "https://api.github.com" + ROOT})
        facts["items"][number] = detail
    return facts


def has_review_evidence(value):
    if not isinstance(value, str):
        return False
    normalized = re.sub(r"[\W_]+", " ", value.casefold())
    remaining = re.sub(
        r"\b(?:not applicable|not checked|not verified|not available|no evidence|synthetic evidence|"
        r"not assessed|not reviewed|not tested|not run|unverified|unverifiable|unchecked|unavailable|"
        r"skipped|uncertain|n a|na|none|null|nil|tbd|todo|pending|unknown|lgtm|ok|pass|passed|yes|true|false|and|or)\b",
        "", normalized,
    )
    return any(character.isalpha() for character in remaining)


def report_for(review, pr, reservation, settings):
    if (review.get("user", {}).get("id") not in settings["qa_reviewer_ids"]
            # Text checks reject placeholders; a trusted human attests substantive review.
            or review.get("user", {}).get("type") != "User"
            or review.get("user", {}).get("id") == pr["user"]["id"]
            or review.get("state") != "COMMENTED" or review.get("commit_id") != pr["head"]["sha"]
            or not review.get("submitted_at") or review["submitted_at"] < reservation["created_at"]):
        return None
    try:
        value = decode(review.get("body"), "qa")
        if (value.get("head") != pr["head"]["sha"] or value.get("base") != pr["base"]["sha"]
                or value.get("reservation_id") != reservation["id"]
                or value.get("verdict") not in {"Accepted", "Accepted with Notes", "Changes Required", "Blocked"}
                or not isinstance(value.get("checks"), dict)
                or set(value["checks"]) != CHECKS or not isinstance(value.get("findings"), list)):
            return None
        if any(not isinstance(check, dict) or check.get("status") not in {"pass", "fail", "not-applicable"}
               or not has_review_evidence(check.get("evidence"))
               for check in value["checks"].values()):
            return None
        if any(not isinstance(finding, dict) or finding.get("severity") not in {"Blocker", "Major", "Minor", "Note"}
               or not isinstance(finding.get("file"), str)
               or not isinstance(finding.get("reason"), str) or not finding["reason"].strip()
               for finding in value["findings"]):
            return None
        return value
    except (Blocked, TypeError):
        return None


def ci_passed(api, pr):
    runs = api.pages(f"{ROOT}/actions/workflows/ci.yml/runs?event=pull_request&head_sha={pr['head']['sha']}", "workflow_runs")
    matches = [run for run in runs if run.get("path") == ".github/workflows/ci.yml"
               and run.get("head_repository", {}).get("full_name") == REPO
               and run.get("head_sha") == pr["head"]["sha"] and run.get("event") == "pull_request"
               and any(link.get("number") == pr["number"]
                       and link.get("head", {}).get("sha") == pr["head"]["sha"]
                       and link.get("base", {}).get("sha") == pr["base"]["sha"]
                       for link in run.get("pull_requests", []))]
    if not matches:
        return False
    run = max(matches, key=lambda entry: (entry["id"], entry.get("run_attempt", 1)))
    if run.get("status") != "completed" or run.get("conclusion") != "success":
        return False
    jobs = api.pages(f"{ROOT}/actions/runs/{run['id']}/jobs?filter=latest", "jobs")
    return REQUIRED_JOBS <= {job["name"] for job in jobs if job.get("conclusion") == "success"}


def coding_finished(api, pr):
    tasks = api.pages(f"/agents/repos/{REPO}/tasks", "tasks")
    matched = []
    for task in tasks:
        detail = api.request("GET", f"/agents/repos/{REPO}/tasks/{task['id']}")
        sessions = detail.get("sessions", [])
        if any(session.get("head_ref") == pr["head"]["ref"] for session in sessions):
            matched.append(detail)
    return bool(matched) and all(task.get("state") == "completed" for task in matched)


def reconcile(api, settings):
    facts = collect(api, settings)
    actions, reasons, occupied_files = [], {}, set()
    occupied, backlog, known_pulls = 0, 0, set()
    by_number = {item["number"]: item for item in facts["issues"]}
    for number, detail in facts["items"].items():
        item, events = by_number[number], detail["events"]
        if not events:
            continue
        occupied += 1
        scope = handoff(item)
        links = [pr for pr in facts["pulls"] if pr["number"] in detail["links"]]
        known_pulls.update(pr["number"] for pr in links)
        if len(links) != 1:
            if events[0]["digest"] != scope_digest(item):
                raise Blocked("cannot reconstruct reserved file scope; hold new dispatch")
            occupied_files.update(scope["allowed_files"])
            reasons[number] = "needs-human: reservation has no unique PR; never redispatch"
            continue
        pr = api.request("GET", f"{ROOT}/pulls/{links[0]['number']}")
        if (pr["base"]["ref"] != "master" or pr["head"]["repo"]["full_name"] != REPO
                or pr["base"]["repo"]["full_name"] != REPO):
            raise Blocked("reserved PR has unsafe repository/base")
        if pr.get("merged_at"):
            occupied -= 1
            continue
        if events[0]["digest"] != scope_digest(item):
            raise Blocked("cannot reconstruct reserved file scope; hold new dispatch")
        occupied_files.update(scope["allowed_files"])
        if pr["state"] != "open" or not approved(item, detail["comments"], settings):
            reasons[number] = "needs-human: closed PR or changed/revoked scope"
            continue
        files = api.pages(f"{ROOT}/pulls/{pr['number']}/files")
        paths = {entry["filename"] for entry in files}
        paths.update(entry["previous_filename"] for entry in files if "previous_filename" in entry)
        if not paths or not paths <= set(scope["allowed_files"]):
            reasons[number] = "needs-human: PR files outside approved scope"
            continue
        head, base = pr["head"]["sha"], pr["base"]["sha"]
        if base != facts["master"] or not coding_finished(api, pr):
            reasons[number] = "waiting: current base and confirmed coding completion required"
            continue
        requests = [event for event in events if event["event"] == "qa-reserved"
                    and event.get("head") == head and event.get("base") == base]
        common = {"issue": number, "digest": events[0]["digest"], "pr": pr["number"], "head": head, "base": base}
        if not requests:
            actions.append({**common, "kind": "request-qa"})
            continue
        reviews = api.pages(f"{ROOT}/pulls/{pr['number']}/reviews")
        # A later unstructured/dismissed review cannot silently revive an older pass.
        reviews = [review for review in reviews if review.get("user", {}).get("id") in settings["qa_reviewer_ids"]]
        latest = max(reviews, key=lambda review: review["id"]) if reviews else {}
        report = report_for(latest, pr, requests[-1], settings)
        if report is None:
            reasons[number] = "needs-human: missing, stale or unstructured independent QA"
            continue
        if not ci_passed(api, pr):
            reasons[number] = "waiting: required current-revision CI not successful"
            continue
        if report["verdict"] in {"Accepted", "Accepted with Notes"} and not any(
            finding["severity"] in {"Blocker", "Major"} for finding in report["findings"]
        ) and all(check["status"] != "fail" for check in report["checks"].values()) and all(
            report["checks"][key]["status"] == "pass" for key in MANDATORY_QA_CHECKS
        ):
            occupied -= 1
            backlog += 1
            if not any(event["event"] == "awaiting-human" and event.get("head") == head
                       and event.get("base") == base for event in events):
                actions.append({**common, "kind": "awaiting-human"})
        elif (report["verdict"] == "Changes Required" and settings.get("max_repairs", 0) == 1
              and all(report["checks"][key]["status"] == "pass" for key in SAFETY_CHECKS)
              and not any(event["event"] == "repair-reserved" for event in events)
              and report["findings"] and all(
                  finding["severity"] in {"Major", "Minor"}
                  and finding["file"] in scope["allowed_files"]
                  and finding.get("category") in {"correctness", "tests"}
                  for finding in report["findings"])):
            actions.append({**common, "kind": "repair", "review_id": latest["id"]})
        else:
            reasons[number] = "needs-human: QA failure or automatic repair allowance exhausted"
    # Unknown Copilot activity prevents claiming that a slot is free.
    for item in facts["issues"]:
        if any("copilot" in actor.get("login", "").lower() for actor in item.get("assignees", [])):
            if not facts["items"][item["number"]]["events"]:
                raise Blocked("untracked Copilot assignment")
    if any(pr["state"] == "open" and (pr["head"]["ref"].startswith("copilot/")
           or "copilot" in pr.get("user", {}).get("login", "").lower())
           and pr["number"] not in known_pulls for pr in facts["pulls"]):
        raise Blocked("untracked Copilot PR")
    for item in sorted(facts["issues"], key=lambda entry: entry["number"]):
        number, detail = item["number"], facts["items"][item["number"]]
        if detail["events"]:
            continue
        reason = ineligible(item, detail["comments"], detail["children"], detail["dependencies"], settings)
        if not reason and detail["links"]:
            reason = "existing PR reference; human reconciliation required"
        if not reason:
            files = set(handoff(item)["allowed_files"])
            if occupied >= settings["capacity"] or backlog >= 2:
                reason = "capacity or human-review backlog full"
            elif files & occupied_files:
                reason = "overlapping approved files"
            else:
                # Agent tasks can exist before either an assignment or a PR is visible.
                tasks = api.pages(f"/agents/repos/{REPO}/tasks", "tasks")
                known_refs = {pr["head"]["ref"] for pr in facts["pulls"] if pr["number"] in known_pulls}
                for task in tasks:
                    if task.get("state") in {"completed", "failed", "timed_out", "cancelled"}:
                        continue
                    sessions = api.request("GET", f"/agents/repos/{REPO}/tasks/{task['id']}").get("sessions", [])
                    if not sessions or any(session.get("head_ref") not in known_refs for session in sessions):
                        raise Blocked("active or uncertain Copilot task; hold new dispatch")
                actions.append({"kind": "dispatch", "issue": number, "digest": scope_digest(item)})
                occupied += 1
                occupied_files.update(files)
        if reason:
            reasons[number] = reason
    return {"actions": actions, "reasons": reasons}


def execute(api, settings, *, run_url):
    """Dormant write path, exercised only with mocked APIs in this implementation."""
    if api.dry_run:
        raise Blocked("dry-run cannot execute a plan")

    def write(path, payload):
        if settings.get("enabled") is not True or os.environ.get("LUXE_AUTONOMY_ENABLED") != "true":
            raise Blocked("kill switch disabled")
        switch = api.request("GET", ROOT + "/actions/variables/LUXE_AUTONOMY_ENABLED")
        if switch.get("value") != "true":
            raise Blocked("remote kill switch disabled")
        return api.request("POST", path, payload)

    def record(action, event):
        value = {key: val for key, val in action.items() if key != "kind"}
        value.update(event=event, run_url=run_url)
        result = write(f"{ROOT}/issues/{action['issue']}/comments", {"body": encode("event", value)})
        if (result.get("user", {}).get("id") != settings["controller_user_id"]
                or not positive_int(result.get("id")) or not unedited(result)):
            raise Blocked("reservation response not confirmed; never retry automatically")

    # One side-effect group per invocation; a fresh reconciliation chooses the next one.
    plan = reconcile(api, settings)
    if not plan["actions"]:
        return plan
    action = plan["actions"][0]
    number = action["issue"]

    def recheck_issue():
        fresh = api.request("GET", f"{ROOT}/issues/{number}")
        if scope_digest(fresh) != action["digest"]:
            raise Blocked("scope changed before reservation")
        reason = ineligible(fresh, api.pages(f"{ROOT}/issues/{number}/comments"),
                            api.pages(f"{ROOT}/issues/{number}/sub_issues"),
                            api.pages(f"{ROOT}/issues/{number}/dependencies/blocked_by"), settings)
        if reason:
            raise Blocked("eligibility changed before reservation")
        parent = api.request("GET", f"{ROOT}/issues/{number}/parent")
        if parent.get("number") != handoff(fresh)["parent"]:
            raise Blocked("parent changed before assignment")

    def recheck_revision():
        fresh = api.request("GET", f"{ROOT}/pulls/{action['pr']}")
        if (fresh["head"]["sha"] != action["head"] or fresh["base"]["sha"] != action["base"]
                or fresh["state"] != "open"):
            raise Blocked("PR changed before side effect")

    if action["kind"] == "dispatch":
        recheck_issue()
        record(action, "reserved")
        recheck_issue()
        # A durable intent precedes the non-idempotent assignment. Lost responses hold the slot.
        write(f"{ROOT}/issues/{number}/assignees", {
            "assignees": ["copilot-swe-agent[bot]"],
            "agent_assignment": {"target_repo": REPO, "base_branch": "master", "custom_agent": "coding-agent",
                "custom_instructions": f"Implement only approved issue #{number}, scope {action['digest']}. "
                "Read .agents/skills/the-luxe-build/SKILL.md and the Management handoff. "
                f"Open one draft PR referencing Closes #{number}. Never approve, merge or deploy."},
        })
        record(action, "dispatched")
    elif action["kind"] == "request-qa":
        record(action, "qa-reserved")
        recheck_revision()
        write(f"{ROOT}/pulls/{action['pr']}/requested_reviewers", {"reviewers": ["copilot-pull-request-reviewer[bot]"]})
        record(action, "qa-requested")
    elif action["kind"] == "repair":
        record(action, "repair-reserved")
        recheck_revision()
        write(f"{ROOT}/issues/{action['pr']}/comments", {"body":
            f"@copilot Address independent review {action['review_id']} within approved issue #{number} "
            f"scope {action['digest']}. This is the only automatic repair. Never approve, merge or deploy."})
        record(action, "repair-requested")
    else:
        record(action, "awaiting-human")
    return plan


def load_settings(path):
    with open(path, encoding="utf-8") as stream:
        settings = json.load(stream)
    if (settings.get("enabled") is not False or type(settings.get("capacity")) is not int
            or settings["capacity"] not in {1, 2} or type(settings.get("max_repairs")) is not int
            or settings["max_repairs"] not in {0, 1}
            or not all(isinstance(settings.get(key), list) and all(positive_int(i) for i in settings[key])
                       for key in ("approver_ids", "qa_reviewer_ids", "excluded_issues"))
            or type(settings.get("controller_user_id")) is not int or settings["controller_user_id"] < 0
            or settings["controller_user_id"] in settings["approver_ids"]
            or settings["controller_user_id"] in settings["qa_reviewer_ids"]):
        raise Blocked("invalid or live-enabled configuration; activation requires a separate reviewed change")
    return settings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=".github/autonomy.json")
    parser.add_argument("--dry-run", action="store_true", help="Explicit read-only mode (also the default)")
    args = parser.parse_args()
    try:
        settings = load_settings(args.config)
        api = GitHub(os.environ.get("GH_TOKEN", ""), dry_run=True)
        result = reconcile(api, settings)
        result.update(mode="dry-run", live_enabled=False)
        print(json.dumps(result, sort_keys=True))
        return 0
    except Blocked as exc:
        print(json.dumps({"mode": "dry-run", "live_enabled": False, "blocked": str(exc)}))
        return 1
    except (KeyError, TypeError, ValueError, OSError):
        print(json.dumps({"mode": "dry-run", "live_enabled": False,
                          "blocked": "incomplete or unsafe observation; no GitHub writes attempted"}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
