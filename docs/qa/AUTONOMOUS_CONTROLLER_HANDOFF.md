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

Observed during implementation:

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
- [ ] Confirm CI provenance/revisions and all four required jobs are validated.
- [ ] Confirm zero repair requests by default and at most one when explicitly configured.
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
