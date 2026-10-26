# Agent Handoff — Autonomous Development Controller

## Task ID
TASK-20261026-001

## Task Title
Disabled GitHub-native autonomous development controller

## Requested By
Founder, implementation-phase authorization dated 2026-10-26.

## Task Type
- [x] AI workflow
- [x] Documentation
- [x] QA

## Context Files Read
- `AGENTS.md`
- `.agents/skills/the-luxe-build/SKILL.md`
- `.agents/skills/the-luxe-qa/SKILL.md`
- `docs/02_DECISIONS.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/10_AI_TEAM_OPERATING_MODEL.md`
- `docs/11_AGENT_HANDOFF_TEMPLATE.md`
- `docs/12_AGENT_HARNESS_PORTABILITY.md`
- `.github/agents/qa-agent.agent.md`
- Existing CI/setup workflows and tracker/label conventions
- Issue #58 and the approved Management handoff in the task conversation

## Problem
Approved issues currently require manual dispatch and lifecycle reconciliation.
Readiness labels alone do not establish current approval or a safe leaf scope.

## Goal
Provide a deterministic, testable controller for future use while keeping all
live autonomous execution disabled in this implementation PR.

## Non-Goals
No activation, repository security-setting changes, privileged credentials,
live Copilot tasks, automatic merge, deployment, product changes or migrations.
No new dependencies or execution platform. No completion of #58.

## Approved Scope
Founder explicitly authorized implementation code, mocked tests, documentation,
a separate branch and a PR for independent QA. Current authorization does not
approve the future operational activation checklist. The CLI and workflow must
remain read-only even if someone sets an environment variable to true.

## Files Likely To Change
- `.github/autonomy.json`
- `.github/scripts/autonomous_development.py`
- `.github/scripts/test_autonomous_development.py`
- `.github/workflows/autonomous-development.yml`
- `.github/workflows/autonomous-qa-signal.yml`
- `.github/workflows/ci.yml` — append one test job only
- `.github/instructions/autonomous-qa.instructions.md`
- `docs/agents/AUTONOMOUS_DEVELOPMENT.md`
- `docs/agents/triage-labels.md`
- This handoff

## Files Not To Touch
Frontend/backend/application files, database/migrations, dependencies/lockfiles,
production configuration, private documents, existing agent policies and
accepted project-memory logs. Activation must be a separate reviewed change.

## Risk Level
- [x] L3 Repository automation/security boundary

## Approval Required?
- [x] Yes — Founder approved this disabled implementation only.

## Acceptance Criteria
- [x] Dispatcher unit tests pass locally.
- [x] Existing three CI jobs remain byte-for-byte intact; an isolated test job is appended.
- [x] Dry-run rejects non-GET requests before network access.
- [x] #58 is rejected as a container, independently of its readiness label.
- [x] Existing unapproved issues produce no action or GitHub write.
- [x] Live execution remains disabled: config false, identity lists empty,
  CLI read-only, no live workflow job or privileged secret.
- [x] QA contract, activation checklist and rollback/recovery are documented.
- [ ] GitHub Actions gates pass on the PR head.
- [ ] Separate independent QA verdict is recorded.

## Verification Commands
```bash
python -m unittest discover -s .github/scripts -p 'test_autonomous_development.py'
git diff --check
python .github/scripts/autonomous_development.py --dry-run
```

Observed during original implementation at `8899623` (not independent acceptance):

- 48 synthetic standard-library unit tests passed. These mock every write and
  cover approvals, sensitive scope, native dependencies/parent, capacity one/two,
  overlapping files, event replay, uncertain reservations/assignment/review
  responses, revoked scope, API failures, kill-switch changes, current CI/QA
  evidence, unstructured review rejection, and bounded repairs.
- All three workflow YAML files parsed with the already installed frontend
  `js-yaml`; no dependency was added.
- Compared CI against `039e7833`: everything before the appended
  `autonomous-controller` job matches byte-for-byte.
- Real repository dry-run: 16 GET requests, zero non-GET requests, no planned
  actions; #58 reported `container issue excluded`. Every other issue was
  rejected as closed or lacking opt-in/readiness. Existing credentials were
  read into process memory without printing them; no credential was created.
- The first sandboxed network attempt failed closed on its first GET with zero
  writes. The same read-only check succeeded with network access.

Application tests/build/browser suites were not rerun locally because no
application behavior changed. Their existing CI jobs remain required. A dry-run
is not proof of live Copilot assignment, CI approval behavior or QA capability.

## Four-finding correction handoff

Founder authorized corrections on PR #68's existing branch after independent
QA returned **Changes Required** for `8899623373d6304cf9420b08adc625b53ca9eaf7`.
This authorization retains the disabled/read-only boundary and excludes scope
expansion, activation, credentials, security settings and product changes.

| QA finding | Implementation | Regression evidence |
| --- | --- | --- |
| QA acceptance without substantive evidence | Acceptance requires applicable, passing scope/correctness/tests/security checks. Placeholder-only evidence is rejected. An allowlisted independent human account must attest the report; bot output is advisory. Text filtering does not prove semantic correctness. | Exact all-N/A/n-a and all-pass/punctuation bypasses; individual mandatory N/A checks; placeholder variants; detailed bot/untyped reports; existing current human-report positive case. |
| Sensitive policies eligible as L0/L1 | Explicit sensitive filename, directory, suffix and governance-contract rules apply at nested depths. Ordinary review/help documentation stays eligible. | Matching approvals for frontend/backend AGENTS and the handoff template; nested CLAUDE/GEMINI/SKILL/override/profile files; legitimate docs positive cases. |
| Uncertain reservation loses file ownership | Missing/ambiguous PRs retain every approved file. Scope reconstruction requires the original digest; uncertain reconstruction blocks new dispatch. | Capacity two, missing and ambiguous PRs, overlapping paths, lost assignment response, changed scope and a nonoverlapping second-slot positive case. |
| Safety failures permit automatic repair | Repair requires passing, evidenced scope and security/privacy checks from the human attestation. Existing issue-wide repair reservation remains authoritative. | Exact failed-security/correctness-finding bypass plus failed scope, missing/N/A/placeholder safety evidence; revised-head/replay exhaustion. |

Verification of the corrections:

- Added regression tests before the fixes: 61 tests ran with 37 failing
  assertions/subtests reproducing the defects and their variants.
- After the fixes and one additional nonoverlap positive case: **62 tests pass**
  with `PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s .github/scripts
  -p 'test_autonomous_development.py'`.
- `git diff --check` passes. No workflows, configuration, dependencies or
  application files change in this correction.
- GitHub CI on the new commit and fresh independent QA must be verified after
  pushing. Prior CI success is not evidence for the corrected head.

Fresh reviewer: invoke `$the-luxe-qa` in a new session against the corrected
PR head, rerun all controller tests, reproduce the four original attacks and
verify all four current CI jobs. Do not infer acceptance from this Coding
summary. Keep PR #68 in draft pending independent acceptance.

Activation blockers remain: actual issue-assigned Task API visibility, archived
task coverage and association with the intended current task/session; reviewer
identity and whether Code Review supplies usable structured/inline evidence.
None is established by synthetic fixtures or the original read-only queue scan.
The controller verifies attesting account identity, not physical human presence
or the truth of every evidence assertion. Substantive confidence requires human
QA; no automated semantic verification capability is claimed.

## Manual Verification
- [x] No UI journey or supporting product API changed; responsive screenshots
  and UX traceability changes are not applicable.
- [x] No creator data, production database, tenant/session or private document
  is used in controller tests or output.
- [x] Only the approved implementation/documentation files changed.
- [ ] Independent reviewer confirms the workflow never checks out PR code in
  its metadata/privileged context and never consumes PR artifacts or secrets.
- [ ] Human confirms existing CI and required review gates on the PR head.

## QA Checklist
Reviewer: **THE LUXE QA Agent in a fresh, separate session**, invoking
`$the-luxe-qa`, or the separately authorized independent review harness.
The implementation session must not supply its own acceptance verdict.

- [ ] Scope matches the implementation authorization, including no activation.
- [ ] Run the controller tests independently and inspect failure assertions.
- [ ] Inspect reservation-before-side-effect ordering and unknown-result holds.
- [ ] Check replay, label removal, closure, changed scope/base/head and API errors.
- [ ] Verify approval identities, exact scope digests and unedited comments.
- [ ] Confirm capacity two allows known work but rejects unknown tasks/PRs.
- [ ] Confirm missing, malformed, stale, dismissed or self-authored QA cannot pass.
- [ ] Confirm mandatory checks cannot be N/A and bot/placeholder evidence cannot
  authorize acceptance or repair; inspect the documented human attestation limit.
- [ ] Confirm CI provenance/revisions and all four required jobs are validated.
- [ ] Confirm zero repair requests by default and at most one when explicitly configured.
- [ ] Confirm uncertain reservations retain their original file ownership at
  capacity two and changed/unrecoverable scope blocks new dispatch.
- [ ] Confirm failed or unverifiable scope/security evidence cannot authorize repair.
- [ ] Confirm GITHUB_TOKEN/write-denying CLI separation and disabled configuration.
- [ ] Read activation prerequisites and manual rollback/reconciliation limits.
- [ ] Record actual GitHub CI status; do not infer it from local unit tests.
- [ ] Return the existing QA profile's verdict, findings table and required fixes.

## Management Agent Final Update
- Progress log update: proposed only after independent acceptance.
- Next actions update: review this disabled implementation; activation remains separate.
- AI work log update: record actual implementation/verification and PR evidence after QA.
- Decision log needed: D-0019 development-workflow extension; preserve its disabled scope
  and do not imply activation/security changes were approved or performed.
- Final acceptance status: **Pending independent QA and human review.** No merge,
  deployment, trial dispatch, live review request or security change performed.
