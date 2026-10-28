"""Re-dispatch trusted App-authored QA only after its successful CI run."""

import json
import os
from pathlib import Path
import sys

from autonomous_development import Blocked, GitHub, ROOT, positive_int
from gh_aw_policy import QA_DISPATCH_EVENT, repair_ci_provenance, require, settings


def dispatch_repair_qa(api, event, policy):
    require(policy["qa_enabled"] and policy["repair_enabled"], "QA repair dispatch is disabled")
    hint = event.get("workflow_run", {})
    require(isinstance(hint, dict) and positive_int(hint.get("id"))
            and positive_int(hint.get("run_attempt")), "missing CI run identity")
    repair_ci_provenance(api, hint["id"], hint["run_attempt"], policy["repair_bot_id"])
    result = api.request("POST", f"{ROOT}/dispatches", {
        "event_type": QA_DISPATCH_EVENT,
        "client_payload": {"run_id": hint["id"], "run_attempt": hint["run_attempt"]},
    })
    require(result is None, "repository dispatch response is unverified")


def main():
    policy = settings()
    require(os.environ.get("QA_ENABLED") == "true"
            and os.environ.get("REPAIR_ENABLED") == "true", "QA repair dispatch is disabled")
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    api = GitHub(os.environ["GH_TOKEN"], dry_run=False)
    dispatch_repair_qa(api, event, policy)
    print("Dispatched provenance-verified repair QA.")


if __name__ == "__main__":
    try:
        main()
    except (Blocked, KeyError, TypeError, ValueError, OSError) as exc:
        print(f"Blocked: {exc}" if isinstance(exc, Blocked) else "Blocked: malformed or unavailable evidence",
              file=sys.stderr)
        sys.exit(1)
