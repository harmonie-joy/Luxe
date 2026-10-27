# Autonomous Development Controller

## PR-triggered independent QA (issue #69 draft)

`.github/workflows/autonomous-qa.md` is a separate gh-aw v0.93.5 source;
`autonomous-qa.lock.yml` is the compiled Actions workflow. It listens only to
PR `opened`, `reopened`, `ready_for_review` and `synchronize` events targeting
`master` from branches in `harmonie-joy/Luxe`. Fork PRs need human QA because
the read-only PR token cannot publish the review. Per-PR cancellation limits duplicate review
runs. The explicit `on.bots` allowlist admits the GitHub Copilot Coding Agent
on PR open and push. It uses read-only GitHub tools, no PR checkout or code execution, and a
separate safe-output job that can submit **COMMENT** reviews only. The review
waits up to five minutes for the current-head CI run to complete before review;
missing or incomplete CI after that wait yields Blocked. The review
names the exact head/base, linked approved issue, scope, current CI evidence,
findings, verdict and human next action. A post-agent live revision check fails
the agent job and suppresses safe outputs if the PR changed; gh-aw also pins
the submitted review to the event head commit. The separate safe-output job
rechecks the live head/base/open state just before publication. These checks
are not atomic with GitHub's final write; the existing controller still rejects
stale bot evidence. Any older review is stale after
a push. Missing evidence yields Blocked, never acceptance. A failed engine or
safe-output job is visible in Actions and requires human intervention.

This QA review is advisory. The existing controller still requires a separate
allowlisted human QA attestation and remains disabled; no bot review silently
becomes a `luxe-autonomy:qa:v1` acceptance record. The current `master` ruleset
requires the four CI jobs and has automatic Copilot code review enabled for
drafts and new pushes, but requires zero formal approving reviews. Founder-only
merge remains an operating rule and must be checked by the Founder.

The workflow requires both `LUXE_GH_AW_QA_ENABLED=true` and
`.github/gh-aw-policy.json`'s `qa_enabled: true` before inference and again
before publishing. Its `autonomous-qa-advisory-v1` producer marker keeps these
reviews separate from controller evidence; malformed controller reviews still
block replay checks.

**Activation prerequisite:** the organization must allow GitHub Actions to use
Copilot inference with `copilot-requests: write` and billing. On 2026-10-27,
the read-only billing API reported `cli: unconfigured` and zero Copilot seats;
a live gh-aw inference/review has not been demonstrated. Also,
`.github/autonomy.json` has `approver_ids: []`. The Founder must separately
approve the numeric GitHub identity configuration before any issue can satisfy
the current approval contract. Until both gates are met, the workflow can only
publish Blocked reviews; it cannot claim Accepted. Do not add a token as a
workaround. Configure the organization entitlement and Founder identity first,
then run one synthetic L0 PR pilot. Public-repository content is visible to the agent; keep
NDA-restricted designs, creator data and secrets out of issues and PRs.

The first run on the workflow's own draft PR (#80) failed safely in gh-aw
activation because its source Markdown is absent from the current `master` base
commit. gh-aw intentionally loads PR workflow configuration from the base,
so the new workflow can be exercised on a later PR only after the Founder
reviews and merges this draft. Do not change activation to load untrusted PR
head files. [Run 40578956565](https://github.com/harmonie-joy/Luxe/actions/runs/40578956565)
records the exact bootstrap failure; no agent or safe-output job ran.

**Repair remains disabled:** `.github/autonomy.json` has `enabled: false` and
`max_repairs: 0`. The existing planner tests exact scope, current human QA,
current CI, safety checks, one repair reservation and replay persistence. Its
old unverified `@copilot` comment dispatch is now a hard block before any write.
gh-aw documents `push-to-pull-request-branch`, but an exact per-issue dynamic
file allowlist, credential-isolated dispatch to the original branch and task
completion semantics have not been demonstrated here. Its default
`GITHUB_TOKEN` push does not trigger CI, so a separate narrow credential or
verified CI trigger is also required for the re-review loop. Activation needs
a separate Founder-approved PR proving these boundaries and independent
security QA. No automatic repair is attempted by this draft.

**L0 pilot:** after human merge and Copilot inference setup, create one public,
synthetic documentation-only leaf issue with the exact handoff/approval contract
below, a current approval by the configured Founder account, and an allowed open
parent other than #58. Open a draft PR linked to it. Observe the gh-aw Actions run and a COMMENT
review for that exact head/base; verify Blocked on missing CI and a fresh review
after one new commit. Have an independent human check the diff and CI before
Founder merge. For a controlled repair exercise, use mocked controller tests;
a live repair requires the separately approved activation gate above.

**Rollback:** disable `.github/workflows/autonomous-qa.lock.yml` in repository
Actions settings or revert the source and lock workflow in a reviewed PR. This
does not affect CI or the dormant controller. Leave `LUXE_AUTONOMY_ENABLED`
unset and `max_repairs: 0`.

Status: disabled implementation for independent QA. Founder authorization on
2026-10-26 permits implementation, tests, documentation and a draft PR only.
It excludes activation, security-setting changes, privileged credential
creation, live Copilot assignment and merging. Base: `039e7833` on `master`.

## Boundary and proposed D-0019

GitHub Issues remain the work queue. A deterministic Actions reconciler can
reserve approved native leaf issues, assign the existing cloud Coding Agent,
request independent Copilot Code Review, and reconcile current CI/QA evidence.
Bot review is advisory; a trusted independent human account must attest the
substantive evidence before acceptance or repair eligibility can be established.
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

The explicit sensitive rules are `SENSITIVE_NAMES`, `SENSITIVE_DIRS`, and
`SENSITIVE_PATHS` in the controller, plus instruction/profile suffixes and the
UX-governance prefix. They protect AGENTS/CLAUDE/GEMINI/REVIEW/SKILL files at
any depth, agent overrides, `.agent.md`/`.instructions.md`/`.prompt.md` files,
agent/skill/prompt/instruction/policy directories, the numbered project-memory
and governance contracts, the controller handoff and `docs/ux/`. In particular,
`frontend/AGENTS.md`, `backend/AGENTS.md` and
`docs/11_AGENT_HANDOFF_TEMPLATE.md` cannot dispatch as ordinary L0/L1 work.
Ordinary documentation such as `docs/qa/PREVIEW_REVIEW_CHECKLIST.md` and
`docs/help/resume.md` remains eligible when the rest of the contract is met.

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

The historical scan includes closed issues and their controller reservation
records. A Copilot assignment without a controller reservation is exempted
only when its issue has exactly one same-repository PR cross-reference and
exactly one Agent Task session with the PR's exact head ref; both the task-list
and task-detail states must be `completed`. The linked PR is then treated as
completion evidence only; an open Copilot PR still independently blocks
dispatch unless tracked by the controller. Missing, active, mismatched,
duplicate, or otherwise unverifiable task/session/PR evidence blocks
reconciliation. This check never removes assignments or changes task records.

Missing or ambiguous PR links retain the entire reserved file scope, including
at capacity two and after a lost assignment response. Reconstruction requires
the current issue's full scope digest to match its original reservation. A
changed/damaged scope blocks new dispatch globally; the controller never guesses
which original files are free. A reconstructable, nonoverlapping reservation
still leaves the second slot available when no other blocker exists.

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

Independent Copilot review is requested separately from the coding session and
provides advisory feedback. Only a COMMENT review from an allowlisted human
account (`type: User`) can attest substantive QA. Its ID must differ from the PR
author; it must review the current head, follow its QA reservation and use the
complete protocol in `.github/instructions/autonomous-qa.instructions.md`.
The JSON must bind the reservation comment ID, head and base. Every check
needs evidence. Acceptance requires applicable, passing scope, correctness,
verification/tests and security/privacy checks; other checks may be N/A with
an explanation. Empty, punctuation-only or known placeholder-only evidence
cannot pass. Accepted verdicts with failed checks, Blocker or Major findings do
not pass. A later malformed or dismissed review invalidates an older pass.
No review text is interpreted as a GitHub approval.

These are structural and placeholder checks, not automated semantic verification.
Long or well-formatted text is not proof of sufficient review. Confidence rests
on the independent human account's explicit attestation; bot-only or uncertain
evidence stays `needs-human`. This does not prove physical human presence behind
an account or verify every evidence assertion. Reviewer identity/provenance and
the usable human-review process must be verified before activation.

Default repairs are zero. After separate approval, the dormant planner permits
at most one scoped repair for structured correctness/test findings, with
successful current CI and confirmed coding completion. Security/scope findings,
CI failures, infrastructure errors and missing QA require a human. The repair
also requires passing, evidenced scope and security/privacy checks from the
human report. Failed, missing, N/A or unverifiable safety checks cannot be
overridden by categorizing findings as correctness/tests. The repair
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
- [ ] Independent human reviewer identity, evidence attestation and the advisory
  Code Review response are demonstrated. Review-request success does not prove
  rubric execution, structured output or reconciliation with inline findings.
  Automated acceptance based only on bot text is unsupported.
- [ ] Founder approves the exact trial child, paths, approval, cost allowance
  and one-shot dispatch boundary. No generic production-enabled CLI is added
  merely by flipping a variable in this implementation.
- [ ] Live wiring, configuration validation, kill-switch behavior and trial
  allowance are independently reviewed in that separate activation change.

The documented Task API field names match the implementation, but issue-assigned
task visibility through the chosen user token, archived/default task coverage
and branch-name-only matching to the intended current task/session remain
activation blockers. No mocked response or previous read-only queue scan proves
those live capabilities. No credential or live-task change is included here.
In the current read-only reconciliation attempt, the historical issue scan
reached a lingering Copilot assignment, while direct access to the Agent Tasks
list returned HTTP 403. Therefore task/session visibility could not be verified
with this session's token; that response is not evidence that no task exists.

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
