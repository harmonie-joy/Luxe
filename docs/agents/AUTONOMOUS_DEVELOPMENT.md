# Autonomous Development Controller

Status: disabled implementation for independent QA. Founder authorization on
2026-10-26 permits implementation, tests, documentation and a draft PR only.
It excludes activation, security-setting changes, privileged credential
creation, live Copilot assignment and merging. Base: `039e7833` on `master`.

## Boundary and proposed D-0019

GitHub Issues remain the work queue. A deterministic Actions reconciler can
reserve approved native leaf issues, assign the existing cloud Coding Agent,
request independent Copilot Code Review, and reconcile current CI/QA evidence.
Workspace, frontend, backend, database and product behavior do not change.
No database, LangGraph, external service or self-hosted orchestrator is added.

This is the implementation of the approved planning handoff
`TASK-20261026-001`, with deliberately restricted activation:

- The CLI has no live mode. It always constructs a write-denying transport.
- The Actions workflow runs the CLI with `--dry-run`, has read permissions
  only, checks out `github.workflow_sha`, and never receives a privileged secret.
- Automatic controller/signal jobs are skipped unless the repository variable
  `LUXE_AUTONOMY_ENABLED` is exactly `true`. No variable is created by this PR.
- The checked-in configuration requires `enabled: false`, empty identity
  allowlists, one slot and zero automatic repairs.
- The dormant `execute()` path is covered by mocked tests. Wiring it to a
  protected execution environment is blocked on separately approved activation.
- A native parent is mandatory in this first release. #58 is permanently
  excluded as a container; its future trial must be a separately scoped child.
- No automatic label mutations, issue closure, review approval, merge or
  deployment endpoints exist. Issue comments are the durable state; labels
  summarize human-managed queue routing only in this version.

D-0019 remains a proposed development-workflow extension to D-0002 and
`docs/10_AI_TEAM_OPERATING_MODEL.md`. Do not record operational activation or
independent acceptance in project memory before those events actually occur.
Management finalization remains separate. Existing role profiles and portable
skills remain authoritative; this document grants no additional privileges.

## Files and execution

| File | Responsibility |
| --- | --- |
| `.github/workflows/autonomous-development.yml` | Serialized event reconciliation, read-only CLI |
| `.github/workflows/autonomous-qa-signal.yml` | Unprivileged review-event wake-up; no checkout/artifacts |
| `.github/autonomy.json` | Disabled configuration, identities, capacity and repair bound |
| `.github/scripts/autonomous_development.py` | Eligibility, API reads, planning and dormant write boundary |
| `.github/scripts/test_autonomous_development.py` | Synthetic, mocked controller verification |
| `.github/instructions/autonomous-qa.instructions.md` | Existing QA policy adapted to structured review evidence |
| `docs/qa/AUTONOMOUS_CONTROLLER_HANDOFF.md` | Scope, evidence and independent QA handoff |

The existing frontend/backend/real-e2e CI jobs are preserved. The only CI
addition is a separate Python standard-library controller-test job.

```bash
python -m unittest discover -s .github/scripts -p 'test_autonomous_development.py'
# GH_TOKEN must already be provided by the caller; never print it.
python .github/scripts/autonomous_development.py --dry-run
```

Dry-run logs only issue numbers, action types, scope digests and bounded
rejection reasons. It does not print issue bodies, creator data, credentials
or raw API error bodies. All API requests are GETs; non-GET methods are
rejected before network access. Redirects are refused. A 403/404/429/5xx,
invalid response or incomplete observation blocks the whole plan before writes.
There are no automatic API retries. The command exits nonzero on a blocker.

## Issue contract

Use the existing Management handoff template
`docs/11_AGENT_HANDOFF_TEMPLATE.md` for the prose issue brief. Add exactly one
JSON block identified by `<!-- luxe-autonomy:handoff:v1 -->`:

```json
{
  "risk": "L0",
  "base_branch": "master",
  "parent": 58,
  "dependencies": [],
  "allowed_files": ["docs/qa/PREVIEW_REVIEW_CHECKLIST.md"],
  "forbidden_files": ["frontend/", "backend/", ".github/"],
  "problem": "Private preview review instructions need a bounded checklist.",
  "goal": "A truthful checklist referencing existing verification evidence.",
  "non_goals": "No application changes, credentials, hosting or deployment.",
  "scope": "One documentation file, without completing issue 58.",
  "acceptance_criteria": ["Distinguish functional, design and release approval."],
  "verification": ["Review against existing real-browser verification instructions."]
}
```

Do not create that trial issue under the current authorization. The example is
a proposed future #58 child, not a dispatched task or an approved release gate.

Dispatch additionally requires:

- An open issue with both `ready-for-agent` and `autonomy:enabled`.
- No assignee, native sub-issues (even completed ones), existing reservation,
  human-hold label, or same-repository PR cross-reference, including old PRs.
- The native parent matches the declaration. The native dependency list matches
  exactly; every blocker must be closed as `completed`, not `not_planned`.
- Complete L0/L1 scope and exact file paths. Glob/path traversal, policy,
  workflow, auth, model/migration, provider, dependency and selected deployment
  paths are excluded. L0 files must be documentation. Sensitive scope always
  returns to Management even if its labels say ready.
- An unedited approval comment from a configured human account ID. The comment
  contains `<!-- luxe-autonomy:approval:v1 -->` followed by one fenced JSON
  object with `issue`, `digest`, `risk`, `allowed_files` and `verification`.
  The last three must exactly equal the handoff fields. `digest` is the SHA-256
  returned by `scope_digest()` over the issue number, entire title and body.
  Changes invalidate the approval. Dependency completion does not change the
  declaration. Approval comment removal or editing revokes the approval.

Author IDs are configured only through human-reviewed changes. The controller
identity cannot be an approver or QA reviewer. No identity is inferred from a
display name, association, readiness label or copied comment. Approving L3/L4
scope remains a human decision outside this dispatcher; those issues cannot
dispatch in this version even with a purported approval.

## Reconciliation and capacity

Events are hints. Every run reads live, paginated repository issues, comments,
PRs and relevant native relationships. Closed issues are scanned so removing
labels or closing an issue cannot discard a recorded reservation.

All future write invocations must use the existing repository-wide concurrency
group with cancellation disabled. Pending events may coalesce; a 15-minute
schedule repairs missed delivery. The current workflow only reads.

Issues sort by number, ascending. One slot is the default, two the maximum.
Reservations, coding, CI, QA and uncertain outcomes occupy a slot. Two scopes
cannot concurrently touch the same allowed path. Unknown Copilot assignments,
open PRs or active tasks block new dispatch. A missing session/tasks API
permission is a blocker, not proof of idle capacity.

`reserved` is appended and its authenticated response confirmed before issue
assignment. `qa-reserved` precedes a review request; `repair-reserved` precedes
any repair comment. The controller records scope digest, issue, revision/PR
where relevant, event and caller-supplied Actions run URL. Edited or inconsistent
controller records stop reconciliation. Untrusted users cannot supply records.

An ambiguous assignment or interrupted reservation never gets automatically
replayed. It holds capacity and reports `needs-human`. A missing review after
a QA reservation also requires intervention rather than another blind request.
This favors a manual recovery over duplicate work; it is not exactly-once API
execution. Comments and session/run links are reviewable operational history,
not an immutable archive against repository administrators.

Slots release only after a unique PR is identified, coding tasks are confirmed
completed, scope/files still match, required current CI succeeds and independent
QA accepts the exact head/base. There may be at most two PRs awaiting human
review before dispatch stops. Their dependent issues remain blocked until a
human merges and completes the prerequisite. A closed unmerged PR remains a
human hold. Merging releases its slot/file scope without an autonomous merge.

## CI, QA and repairs

CI evidence must come from `.github/workflows/ci.yml`, the same repository,
the current PR head and current `master` base. The latest matching run must
succeed with all four jobs: frontend, backend, real-e2e and autonomous-controller.
Missing, skipped, failed, stale or misleadingly named checks cannot accept work.

Independent review is requested separately from the coding session. The pinned
reviewer ID must differ from the PR author. Only a COMMENT review for the
current head, submitted after its QA reservation, with the complete structured
protocol in `.github/instructions/autonomous-qa.instructions.md` can count.
The JSON must bind the reservation comment ID, head and base. Every check
needs evidence. Accepted verdicts with failed checks, Blocker or Major findings
do not pass. A later malformed or dismissed review invalidates an older pass.
No review text is interpreted as a GitHub approval.

Default repairs are zero. After separate approval, the dormant planner permits
at most one scoped repair for structured correctness/test findings, with
successful current CI and confirmed coding completion. Security/scope findings,
CI failures, infrastructure errors and missing QA require a human. The repair
reservation survives replays, pushes, label changes and reopenings. The limit
bounds additional requests; Copilot's internal iterations remain subject to
its own session timeout. The existing setup workflow's 59-minute cap is unchanged.

## Threat model and activation checklist

Trust boundary: reviewed default-branch controller code versus untrusted issue,
PR, review and artifact content. The privileged controller must never check out
PR code, run issue text as shell, consume executable artifacts or restore PR
caches. Ordinary CI remains on `pull_request`. Metadata-only
`pull_request_target` reads trusted `github.workflow_sha` and is restricted to
`master`. The review signal has no permissions and executes no PR code.

Activation is blocked until a separate Founder-approved change verifies:

- [ ] Independent QA accepts this implementation; a human merges the PR.
- [ ] Human-only merge/approval controls are enforced on `master`, with no
  automation identity bypass. Planning observed no branch protection and could
  not establish ruleset enforcement due to a plan restriction.
- [ ] All workflows, secret exposure, artifact/cache boundaries and protected
  paths are audited. Read-only defaults alone do not stop a changed workflow
  from requesting greater permissions.
- [ ] A separately approved protected environment restricts controller
  credentials to trusted default-branch execution. No privileged secret is
  stored in this PR or wired into its workflows.
- [ ] Copilot assignment is verified with an appropriate repository-scoped user
  token and reviewed actor identity; GITHUB_TOKEN is not assumed sufficient.
  Native relationship and Agent Tasks read APIs are accessible. Live writes
  also require reading the repository kill-switch variable on every operation.
- [ ] Copilot-authored CI behavior is reviewed. GitHub's human workflow-run
  approval requirement is not disabled by this implementation.
- [ ] Independent reviewer identity and structured output are demonstrated in
  the intended review harness. If it cannot supply the evidence, keep human QA.
- [ ] Founder approves the exact trial child, paths, approval, cost allowance
  and one-shot dispatch boundary. No generic production-enabled CLI is added
  merely by flipping a variable in this implementation.
- [ ] Live wiring, configuration validation, kill-switch behavior and trial
  allowance are independently reviewed in that separate activation change.

The dormant executor rechecks the environment flag and current remote variable
before every POST. Errors or values other than exactly `true` stop writes.
The CLI refuses a live-enabled configuration and has no path to `execute()`.
This deliberate disconnection prevents activation through a variable alone.

## Rollback and recovery

For future activated operation, set the kill-switch variable to false, disable
the controller workflow and revoke its credential as needed. Cancel active
controller runs and stop Copilot sessions separately: a kill switch cannot undo
an accepted request or terminate an already-running cloud agent. Preserve
reservations, PRs and run/session links. Never delete a reservation to retry an
uncertain request. Human reconciliation must establish what happened first;
automatic reservation reset/re-dispatch is intentionally absent.

Restore human workflow-run approval if activation changed it. Revert the
automation PR through a human-reviewed PR if removal is needed. There are no
application migrations or data changes to roll back. Reverting only the added
CI job restores the original three-job CI file.

## Cost expectations and references

This PR schedules no enabled controller jobs by default and starts no cloud
coding/review tasks. Its additional unit-test CI job normally rounds to one
runner minute per CI run. No new hosting, database or dependency cost exists.

For later activation, the planning estimate was 2,880 one-minute reconciliation
runs/month plus event handling, coding, CI and reviews. At the documented
$0.006 standard Linux x64 minute rate, that polling alone is $17.28 before
included allowances; 20 illustrative coding/verification cycles gave about
$30–42/month of Actions usage, plus AI credits and storage. Those durations are
assumptions, not measurements. AI credits are token-based ($0.01/credit); actual
subscription allowances and session usage must be measured in the trial.

Official references checked during planning/implementation:

- [Copilot issue assignment API and token requirements](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api)
- [Native issue dependencies](https://docs.github.com/en/rest/issues/issue-dependencies)
- [Native sub-issues](https://docs.github.com/en/rest/issues/sub-issues)
- [Independent Copilot review requests](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/copilot-code-review)
- [Agent Tasks status APIs](https://docs.github.com/en/rest/agent-tasks/agent-tasks)
- [Copilot workflow-run approval setting](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings)
- [Actions runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing)
- [Copilot billing](https://docs.github.com/en/billing/concepts/product-billing/github-copilot-billing)
