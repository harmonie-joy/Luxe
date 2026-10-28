# gh-aw QA / repair pilot

Status: Stage A policy/identity readiness is proposed for review; the repository
variable remains unset/false. Stage B and the dispatcher remain **disabled**.
This draft does not activate workflows, create credentials, change repository
settings, accept work or merge. The 2026-10-28 Founder request explicitly scopes
this L3 activation-readiness PR. This remains separate from issue #69's disabled
controller and PRs #80/#91; neither open branch is overwritten.

## Bounded handoff and review stages

Approved paths: new `.github/workflows/luxe-*`, `.github/scripts/gh_aw_*`,
their tests, `.github/gh-aw-policy.json`, generated gh-aw lock/pin metadata,
and this runbook. Stage A adds independent advisory QA; Stage B adds a disabled,
one-attempt repair safe output. No application, schema, auth, controller,
existing CI, QA instructions/skills or repository-setting edits. No migration
or application API impact; no product UI journey applies.

The existing QA skill/profile supplies the reasoning checklist and report
headings. Its output remains advisory. The dormant controller's
`luxe-autonomy:qa:v1` human-attestation contract is **not** changed or reused
without a genuine reservation. This loop uses separate `gh-aw-*` records.
Management must propose project-memory/decision updates after independent QA
and human acceptance; this implementation is not an accepted D-0019 activation.

## Stage A: independent QA

`luxe-independent-qa.md` compiles to the checked-in `.lock.yml`. PR opened,
reopened and synchronize events start read-only reconciliation. CI completion
also wakes QA for `luxe-pilot/**` branches, so an initial pending-CI review does
not become a permanent verdict. A trusted default-branch relay revalidates
successful CI runs authored by the configured repair App, then sends a
`repository_dispatch`; gh-aw permits its allowlisted `github-actions[bot]` on
that write-required event without treating the App as a collaborator. QA
revalidates the run actor, repository, branch, PR link, head and attempt before
review. The relay has only `contents: write` and `actions: read`. No schedule,
assignment API or external service.

Both `qa_enabled` in reviewed policy and repository variable
`LUXE_GH_AW_QA_ENABLED=true` are required. Identity allowlists are numeric GitHub
IDs, never inferred from names, labels or association. Supported PRs must:

- Be same-repository, open, current-head, current-master L0/L1 work.
- Have the existing structured Management handoff and unedited Founder scope
  approval from an allowlisted User (see `AUTONOMOUS_DEVELOPMENT.md`).
- Link exactly one issue in their body using the record below **and** `Refs #N`
  so GitHub's issue timeline independently exposes the PR reference.
- Stay inside the original exact allowed-file list, including rename sources;
  have no competing open PR for the same issue.

````text
Refs #90
<!-- luxe-autonomy:gh-aw-issue:v1 -->
```json
{"issue": 90}
```
````

The numeric example is synthetic, not an instruction to dispatch issue 90.
The agent reads source by exact SHA through read-only GitHub tools. It has no
PR checkout, shell, dependency install or code execution. Trusted gate scripts
are checked out from the base/default revision, never the PR. Missing approval,
API errors, incomplete pagination/source, stale evidence, forks and current CI
that has not passed all four required jobs block before inference/publication;
pending/failed CI produces no model-generated advisory review.
An additional live recheck precedes publishing. The native safe output pins the
review to the inspected commit and permits **COMMENT only**, never APPROVE,
REQUEST_CHANGES, dismissal, merge or code writes.
The machine report's fenced JSON carries the
`"protocol": "luxe-autonomy-gh-aw-qa-v1"` field inside the sanitized body;
readers require this envelope for duplicate accounting and repair eligibility.
Identity values in the activation policy were checked through GitHub's REST
user API on 2026-10-28: `mario-ah-salamanca` is User ID `57563103`, and
`github-actions[bot]` is Bot ID `41898282`. The review list for PR #80 separately
shows `copilot-pull-request-reviewer[bot]` ID `175728472`; that code-review bot
is distinct from this workflow's `GITHUB_TOKEN` safe-output author and is not
used for Stage A duplicate accounting.

Duplicate bindings (issue digest, head/base, exact allowlist, CI run/attempt/
outcome) are not reviewed again; concurrency serializes QA. At most six
recognized QA reviews per PR prevent an unbounded update loop. Budget exhaustion
requires human QA. Preflight blocks before agent inference unless all four
required CI jobs passed for this exact head/base; trusted `workflow_run` wakes
the pilot on `luxe-pilot/**` after CI completes. Interrupted runs without a
published review can be rerun. Stage A is capped at 30 AI credits per run and
per day, with 10 credits for threat detection; these are pilot ceilings, not
invoice estimates.

## Dependencies and verification

Pinned compiler/runtime: **github/gh-aw v0.93.5**, commit
`32ecafbc061c9af57e9361942099e381102ae304`, latest published release observed
2026-10-27. Linux compiler asset SHA-256:
`a7b06bffaf7c24f713d10ec0a865514b764e62af639b13df953a480d74e8a8de`.
Generated Actions references and container images are SHA/digest pinned.
Copilot inference uses `copilot-requests: write` on the ephemeral Actions token;
no inference PAT is requested or created. Repository/org support and billing
must be verified during the authorized pilot, not assumed from compilation.

Public upstream advisories were inspected. v0.93.5 is newer than the token
exfiltration fix v0.91.13 and MCP flag-injection fixes v0.91.12. The published
heredoc advisory GHSA-796c-cr8h-rr49 has no patched version recorded; this
implementation has no custom MCP configuration or untrusted event interpolation
in shell/heredocs. Recheck upstream advisories before each approved activation.

```bash
PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s .github/scripts -p 'test_gh_aw_*.py'
gh aw compile luxe-independent-qa --strict --action-mode release \
  --action-tag 32ecafbc061c9af57e9361942099e381102ae304 --no-check-update
git diff --check
```

Per agent run: ten minutes, twenty turns, 100 AI Credits; daily guardrail:
300 credits per workflow. Provider billing may differ from estimated credits;
these are proposed pilot ceilings, not authorization to spend. Threat detection
is mandatory before safe outputs (strict mode, 50 credits, ten turns,
three minutes, zero detector retries).

Independent QA must inspect actual generated locks, permission isolation,
current CI and the exact implementation head. Compilation and synthetic tests
are not evidence of live engine authentication, safe-output permissions,
Actions event delivery or successful end-to-end execution.

## Stage B: disabled bounded repair

This uses gh-aw's custom safe-output job, not an orchestration service or
speculative Copilot assignment endpoint. Upstream v0.93.5's native
`push-to-pull-request-branch` was inspected: it supports `allowed-files`,
`protected-files: blocked`, signed commits and same-repository targeting, but
may re-anchor a generated patch after the branch advances. It does not expose
the approved head as an atomic expected-head parameter. That is insufficient
for this pilot's exact-revision contract.

Instead, `propose_repair` accepts **data only**: the evidence binding, one exact
path and canonical base64 replacement content. The trusted safe-output handler
decodes and validates the bounded UTF-8 text:

1. Re-reads the source workflow, PR, issue, unedited scope approval, native
   parent/dependencies/leaf status, changed files, latest QA and current CI.
2. Requires a latest COMMENT attestation from an allowlisted independent
   `type: User` account, not the PR author. It binds the advisory QA's exact
   review ID/body hash, current issue digest, head/base and CI run/attempt.
   The human must actually reproduce/verify the findings, not copy bot JSON.
3. Allows only explicit correctness/test findings with evidenced passing
   scope/security checks. All findings must concern the one allowed file.
   Missing, failed, malformed, dismissed, stale or bot-only attestation blocks.
4. Enforces an exact one-file allowlist plus a separate protected-file deny
   policy (`protected()` layered over the unchanged controller policy).
   The pilot permits only an existing, modified, regular UTF-8 `.md` under
   `docs/help/`, or `.ts`/`.tsx` under `frontend/features/`, at most 32 KiB.
   No auth/tenancy/security/privacy/schema/compliance/dependency/governance
   paths, new/deleted/renamed/symlink/executable files or multi-file scopes.
5. Writes and confirms an issue-bound `gh-aw-repair-attempt` record before the
   `gh-aw-repair` reservation and commit. Either record (including malformed
   records or legacy `repair-reserved` records) consumes the allowance across
   reruns, new heads, changed issue text, closed/reopened or replacement PRs. A
   stable workflow run title binds each attempt to `luxe-pilot/<issue-number>`;
   before inference and before reserving, the handler checks prior matching runs
   and their `propose_repair` job. The current workflow's verified `run_number`
   orders history: newer queued runs are excluded, earlier runs and prior
   attempts of the current run remain checked. A started, failed, or incomplete
   prior job is a human hold. If the reservation write fails without persisting
   its comment, the earlier issue-bound attempt record still consumes the
   allowance even if Actions history is later deleted. Only an explicitly
   skipped proposal job is not an attempt.
6. Revalidates after reserving, then calls `createCommitOnBranch` with
   `expectedHeadOid` equal to the attested head. GitHub atomically rejects
   intervening head changes; no force push, rebasing, retry or fallback PR.
   A failed/lost comment response, GraphQL error, timeout or unconfirmed commit
   never authorizes another attempt. If the reservation comment is absent, the
   Actions run/job evidence still consumes the allowance; incomplete history
   blocks rather than resetting it.

The repair agent has no checkout/shell/tests or privileged token. Only the
default-branch safe-output job mints a short-lived repository-scoped GitHub App
token. Only its apply step receives that token. Its environment key must never
be a repository/organization secret. App-authored commits produce ordinary PR
synchronize/CI events; `GITHUB_TOKEN` pushes would suppress those events, which
is why they are not used. Non-collaborator App events do not bypass gh-aw's
repository-role check. After a successful App-authored CI run, the default-
branch relay emits the constrained `repository_dispatch` used to wake fresh QA.
No empty-commit trigger credential is needed.

Review events run a zero-permission metadata-only signal. Completion of that
signal, QA or CI can wake trusted repair reconciliation. Every source run is
re-read through the API and must expose exactly one PR/head. Missing associations
are a blocker, not permission to guess a branch. `workflow_run` filters limit
the pilot to `luxe-pilot/**`; other branches get initial QA only. App-authored
CI completion is relayed only through the verified `repository_dispatch` QA
path; it does not weaken role checks on ordinary agent triggers. No signal or
completion text is itself an attestation.

CI and fresh independent QA run after the repair. A second defect, failing CI
or exhausted six-review budget requires a human; there is no repair loop or
automatic acceptance. There is deliberately **no bot-only repair acceptance**.
The existing controller's human-attestation trust boundary is preserved.

### Human repair attestation

Submit a COMMENT review on the exact current head after independently verifying
the QA findings. Prepend the normal QA profile headings, findings and evidence.
Append exactly one `<!-- luxe-autonomy:gh-aw-repair-attestation:v1 -->` fenced
JSON object with these fields:

| Field | Required value |
| --- | --- |
| `qa_review_id` | Numeric ID of the latest allowlisted Bot COMMENT QA review |
| `qa_sha256` | SHA-256 of that review's entire current UTF-8 `body`, including footer |
| `binding` | The QA binding: `pr`, `issue`, `head`, `base`, `digest`, `allowed_files`, `ci`, `key`; exact values from preflight/QA |
| `checks` | Exactly `scope`, `security_privacy`, `correctness`, `tests`; each `{"status":"pass","evidence":"actual independent verification details"}` |

`correctness`/`tests` here attest the independent reproduction/verification of
the reported defect and repair eligibility, **not** acceptance of unfixed code.
Placeholder-only statements fail. This is a separate protocol, never a forged
controller reservation. A later malformed/dismissed reviewer entry invalidates
an older attestation; a changed bot body or CI rerun requires fresh verification.

## Controlled pilot: Founder operations only

No commands in this section were executed by the implementation session.

| Step | Automatic after approved setup | Human / Founder gate |
| --- | --- | --- |
| Review and merge implementation | Validation workflow runs synthetic tests and strict compilation | Independent QA of exact head; human merge; not activation |
| Stage A setup | PR open/reopen/push and pilot CI completion reconcile and publish COMMENT QA | Merge the reviewed activation PR; confirm Copilot CLI and organization-billed CLI policies; set repository variable `LUXE_GH_AW_QA_ENABLED=true` and approve the 30-credit run/day ceiling |
| Engine and repository audit | Keyless Copilot inference, read-only GitHub tools, strict detector | Confirm organization `copilot-requests` support/billing, allowed pinned Actions, and workflow approval policies; do not weaken security settings |
| Secrets isolation | Generated read tools/reviews explicitly use ephemeral `GITHUB_TOKEN` | Inventory repo/org/environment secrets manually: this session's secret-name API returned **403**, so isolation is unverified |
| First trial | QA evaluates one synthetic approved L0 leaf PR on `luxe-pilot/issue-N` | Use an appropriate open parent (not an unresolved closed tracker); declare exact existing help file, acceptance/verification and unedited Founder scope approval |
| Stage B setup | Nothing while either switch is off | Separate approved activation PR sets `repair_enabled` and reviewer/App bot IDs; Founder creates/configures the App/environment/key, `LUXE_REPAIR_APP_CLIENT_ID` and exact `LUXE_REPAIR_APP_BOT_LOGIN` only under explicit authorization |
| Branch repair | One reserved, atomic, single-file commit; normal CI and fresh QA | Verify and COMMENT-attest exact findings; authorize one-issue pilot and its cost |
| Final result | Evidence remains visible; no automatic second repair | Independent final QA, review all required CI, Founder manual merge; no deploy |
| Stop / rollback | Subsequent gated jobs stop | Clear both repository variables, revert reviewed policy switches, cancel in-flight runs and revoke App installation/key if needed; never delete reservation history |

`LUXE_REPAIR_APP_BOT_LOGIN` must identify the same installed App as the numeric
`repair_bot_id`. The gh-aw role and bot-installation checks remain enabled, and
the trusted preflight still re-reads the exact PR and source-run provenance.

Environment `luxe-gh-aw-repair` must be restricted to the reviewed master
workflow; verify required reviewers and prevent self-review as appropriate.
Before Stage B, the Founder must explicitly decide whether per-run environment
approval remains required or whether a narrowly authorized one-shot pilot may
run automatically. This PR creates neither the environment nor any secret.
The App needs only Luxe `contents: write`, `issues: write`,
`pull_requests: read`, `actions: read` and implicit metadata read: no
administration, workflows, merge bypass or other repository access.

gh-aw's generated bootstrap/redaction still references ambient
`GH_AW_GITHUB_TOKEN`, `GH_AW_GITHUB_MCP_SERVER_TOKEN` and default OTLP settings,
even with explicit ephemeral tool tokens. **Do not activate if privileged
versions of those secrets are available to PR workflows.** Remove/restrict
them only via a separately authorized settings change, or keep the pilot
blocked. No custom MCP server or credential-bearing prompt is introduced.
Inference and detection jobs do not receive the repair environment or App key.

### Stage A activation and one-shot pilot instructions

Do these steps only after independent QA of the activation PR and a human
merge. Before setting the variable, keep PR #80's older `autonomous-qa` workflow
unmerged or close it as superseded: it uses the same variable and would create a
second AI review path if merged. PR #91 concerns Stage B repair hardening; it is
not needed for this Stage A pilot and remains unchanged.

1. An organization owner visits
   `https://github.com/organizations/harmonie-joy/settings/copilot/policies`
   and confirms **Copilot CLI** and **Allow use of Copilot CLI billed to the
   organization** are enabled ([GitHub billing setup](https://docs.github.com/en/copilot/how-tos/github-agentic-workflows/creating-github-agentic-workflows#using-the-built-in-github_token)). The read-only organization billing API check on
   2026-10-28 returned plan `business`, seat management `unconfigured` and zero
   seats. That does not prove Actions inference is available: configure only
   through the organization owner and confirm the organization usage/billing
   view before a live call. This workflow uses Actions `GITHUB_TOKEN` with
   `copilot-requests: write`; it needs no PAT or new credential. If access or
   billing cannot be confirmed, leave the repository variable false.
2. In the repository, open **Settings → Secrets and variables → Actions →
   Variables → New repository variable** ([GitHub Actions instructions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables#creating-configuration-variables-for-a-repository)). Set **Name** to
   `LUXE_GH_AW_QA_ENABLED` and **Value** to `true`, then save. This is a
   non-secret variable; do not create or alter any secret. The checked-in policy
   must also have `qa_enabled: true` and numeric Founder/bot IDs. Stage B stays
   off because `repair_enabled` remains false and no repair identity or App
   credential is configured.
3. Use one synthetic L0 leaf issue under an open parent, with the structured
   Management handoff and an unedited Founder approval for exactly one existing
   allowed file. Create a same-repository PR to current `master` from
   `luxe-pilot/<issue-number>` and include both the unique issue JSON marker and
   `Refs #<issue-number>`. Do not include private, customer or creator material.
4. Wait for all four ruleset checks (`frontend`, `backend`, `real-e2e`,
   `autonomous-controller`) to pass on that exact PR head and current master
   base. Preflight must block inference before then. On `luxe-pilot/**`, CI
   completion wakes QA. Verify exactly one Stage A workflow run and one
   `COMMENT` review, bound to current head/base, issue digest and CI run/attempt.
   Confirm the review actor is `github-actions[bot]` ID `41898282`; this ID is
   verified through GitHub's user API and follows the workflow's `GITHUB_TOKEN`
   publication path. Live author identity has not yet been observed and must be
   verified in this first pilot. The result is advisory and never approves or
   merges.
5. Record the gh-aw run/credit usage and organization billing evidence. Limits
   are 30 credits per run, 30 per day and 10 for threat detection; credits are
   estimates, not invoice values. After the trial, set the variable back to
   `false`, then inspect the diff, four checks, advisory, run logs and usage. Do
   not repeat the pilot without a separate decision.

To disable Stage A immediately, set `LUXE_GH_AW_QA_ENABLED=false`. This stops
future eligible inference; cancel in-flight runs separately. No repository or
organization settings were changed during this PR preparation.

Pilot evidence must observe real COMMENT commit binding, exact User/App IDs,
source-run PR associations, role authorization, one reservation/one App commit,
fresh CI and QA after that commit, duplicate delivery/rerun rejection, stale
head/approval rejection, usage/cost and emergency stop. Then return both
switches/variables to disabled and record results. Do not treat compilation,
mocked CAS responses, unavailable APIs or a successful review request as proof
that these live operations work.

Reservations are durable issue comments, not tamper-proof against repository
administrators. Never delete them; deletion defeats any comment-based budget.
An issue/base/CI/approval can change after the final check; GitHub CAS makes
the **head** check atomic, not all GitHub resources. Final fresh QA/CI and human
merge remain necessary. Kill switches stop subsequent work, not an already
accepted API write; cancel/revoke to handle in-flight work.

## Verification and QA handoff

The added `luxe-gh-aw-tests.yml` runs all script regressions and downloads the
compiler only after verifying its fixed SHA-256, compiles both workflows and
rejects generated-file drift. Existing CI/controller workflows are unchanged.
Local full command:

```bash
PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s .github/scripts -p 'test_*.py'
gh aw compile luxe-independent-qa luxe-bounded-repair --strict --validate \
  --action-mode release --action-tag 32ecafbc061c9af57e9361942099e381102ae304 \
  --no-check-update
git diff --check
```

Review stages by commit: Stage A (read-only QA), Stage B (disabled repair and
regressions), then any narrowly documented validation corrections. The
implementation session cannot provide independent QA or human attestation.
Required independent review: scope, correctness, contracts, errors, tests,
regressions, privacy/security, docs, decisions and non-product UX applicability.
Management project-memory updates remain proposed until accepted; no activation,
test success on GitHub, human acceptance or production readiness is inferred.

Implementation-session evidence (2026-10-27): all 92 script tests passed,
including the unchanged controller suite; both workflows compiled with strict
schema/action validation, actionlint 1.7.12 (two workflows, no issues) and
shellcheck (113 run resources), zero compiler warnings. `git diff --check`
passed. No live inference, review publication, repair, credential creation,
setting change, merge, deployment or independent human acceptance was exercised.
