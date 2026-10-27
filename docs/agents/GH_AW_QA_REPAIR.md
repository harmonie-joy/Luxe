# gh-aw QA / repair pilot

Status: implementation only; both switches remain **false**. The Founder's
2026-10-27 request authorizes an L3 implementation and draft PR, not activation,
credentials, repository settings, acceptance or merge. This is separate from
issue #69's disabled controller and PR #79's unfinished reconciliation changes.

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
not become a permanent verdict. No schedule, assignment API or external service.

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
````
```

The numeric example is synthetic, not an instruction to dispatch issue 90.
The agent reads source by exact SHA through read-only GitHub tools. It has no
PR checkout, shell, dependency install or code execution. Trusted gate scripts
are checked out from the base/default revision, never the PR. Missing approval,
API errors, incomplete pagination/source, stale evidence and forks block before
inference/publication. Uncertain CI can only produce a Blocked advisory report.
An additional live recheck precedes publishing. The native safe output pins the
review to the inspected commit and permits **COMMENT only**, never APPROVE,
REQUEST_CHANGES, dismissal, merge or code writes.

Duplicate bindings (issue digest, head/base, exact allowlist, CI run/attempt/
outcome) are not reviewed again; concurrency serializes QA. At most six
recognized QA reviews per PR prevent an unbounded update loop. Budget exhaustion
requires human QA. Interrupted runs without a published review can be rerun;
the daily inference guardrail remains the cost backstop.

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
