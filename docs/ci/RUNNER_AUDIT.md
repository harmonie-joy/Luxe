# Desktop CI audit and preparation — 2026-10-27

Issue [#89](https://github.com/harmonie-joy/Luxe/issues/89), task `TASK-20261027-CI`.
Base: `5562762fcb203201a2216288a06df756b3a17950`, verified remote
`https://github.com/harmonie-joy/Luxe.git`, default branch `master`.
The original worktree/branch is preserved; preparation uses `feat/trusted-local-ci`.

## Outcome and scope

Keep hosted PR checks. Prepare optional trusted local execution, but **do not
register a runner on this desktop or activate the template**. The public repository,
personal WSL account, shared Docker Desktop engine and unverified access boundary
prevent the requested security guarantees. No host privileges, firewall changes,
tokens, registration, repository settings, paid AI, package/lock changes, production
services or application migrations are authorized by this preparation slice.

The Founder explicitly requested safe repository preparation and synthetic local
tests. This is L3 infrastructure/security work, with activation reserved for a
separate explicit decision. Existing product architecture, tenancy and roadmap
remain unchanged. No UI journey or supporting product API changes apply.

## Hardware and tools: confirmed observations

| Component | Current state | Bottleneck | Recommendation | Priority | Expected benefit |
| --- | --- | --- | --- | --- | --- |
| Host | Windows 11 Pro `10.0.26300`; approximately 31.2 GiB physical RAM | Host sleep/reboot stops desktop availability | Keep hosted CI as mandatory merge gate | P0 | Predictable PR feedback |
| Linux | Ubuntu 24.04.3 LTS, WSL2; Ubuntu and Docker Desktop running; Windows Hyper-V feature enabled | Running now does not establish startup persistence or an isolated VM | Separate approved VM for any future runner | P0 | Separate personal files/network |
| CPU | Ryzen 7 7700, 8 cores/16 threads visible | Shared with interactive development | One local job at a time | P1 | Avoid contention |
| Memory/storage | WSL about 15.2 GiB total, 6.9 GiB available initially; 4 GiB swap; about 835 GiB disk free | AI, browsers and existing containers compete for RAM | Bounded test containers; on-demand runs | P1 | Avoid host pressure and stale data |
| GPU | RTX 4060 Ti, 16,380 MiB, driver `610.88`; initially 2,144 MiB used | Shared GPU; VM passthrough not established | GPU label only after inference in chosen isolated environment | P1 | Local model evaluation |
| Container GPU | Limited cached CUDA container successfully ran `nvidia-smi` | This proves current Docker Desktop passthrough only | Re-test in isolated runner VM | P1 | Avoid false GPU readiness claims |
| Docker | Client/server `29.5.3`, Docker Desktop; `nvidia` runtime; personal account in docker/sudo groups | Shared daemon can control unrelated containers and host mounts | Never use this daemon/account for a persistent runner | P0 | Protect personal/developer resources |
| Isolation | `/mnt/c` mounted; Windows executables available; no `/dev/kvm`; WSL systemd enabled | Current distro can reach personal host resources | VM without shared folders, clipboard, host sockets or LAN routes | P0 | Enforce intended trust boundary |
| Ollama | `0.30.10`; loopback `11434`; installed `gemma4:12b` (~7.56 GB) | Structured quality/latency uncalibrated | Synthetic provider evaluation only; never pull models automatically | P1 | Repeatable GPU feedback |
| Tooling | Node `24.11.1`, npm `11.12.1`, Python `3.12.10`, Git `2.43.0`, gh `2.94.0`, FFmpeg `6.1.1` | Hosted CI uses Node20/Python3.12; no standalone psql found | Keep CI versions; PostgreSQL16 disposable container | P1 | Explicit version/DB parity |
| Network | HTTPS to GitHub/API/PyPI/npm succeeded; Ollama loopback; unrelated non-loopback service listeners observed | No verified egress/LAN block; no firewall rules changed | Admin to design VM egress allowlist and deny personal/LAN services | P0 | Prevent lateral access |
| GitHub | CLI user `mario-ah-salamanca` (ID57563103), repo admin; org runner-groups API 403; zero repo runners | Repo access does not grant org runner policy access | Separate org-admin review; no credential-scope expansion now | P0 | No accidental privilege grant |

No personal directories, SSH agents, secrets, model outputs or application content
are exported in the diagnostics. The health tool is a capability report, **not**
an isolation attestation. Windows startup persistence, VM GPU access, host firewall
policy and production-network exclusion remain NOT VERIFIED.

## Repository and CI: confirmed source, not product plans

The active default-branch ruleset `Protect master - Human Reviewed` requires
`frontend`, `backend`, `real-e2e`, `autonomous-controller`, current branch status,
PRs and resolved discussions. It blocks deletion/force-push, has no bypass actors,
and requires **zero** approving human reviews. Human QA and merge remain operating
policy; the ruleset alone does not enforce human approval. The legacy branch
protection endpoint returns 404; the ruleset and branch API confirm protection.

Actions is enabled with all actions allowed, no global SHA requirement, default
token read permissions, and workflow approval of PRs disabled. This slice changes
only `ci.yml`, not account/repository policy or existing AI workflows.

| Workflow / component | Current state | Bottleneck / gap | Recommendation | Priority | Expected benefit |
| --- | --- | --- | --- | --- | --- |
| `ci.yml`: frontend | Hosted lint, tsc, Vitest, build, synthetic Playwright; npm cache | Browser installation and tests dominate; duplicated npm install in real-e2e is separate environment | Keep required job, pin actions, bounded timeout, cancel superseded revision | P1 | Bounded queue and preserved release coverage |
| `ci.yml`: backend | SQLite full Django suite + PostgreSQL concurrency tests; pip cache | SQLite is useful but cannot prove PG-specific behavior; no migration-drift gate | Keep hosted tests; add full PG/migration check to disposable local command | P1 | Catch schema and tenant regressions |
| `ci.yml`: real-e2e | PostgreSQL16 + real sessions/CSRF, exact voice approval, persisted checkpoint/recovery/isolation; one Chromium worker | Two service startups, browser setup; reports retained seven days | Preserve; reuse existing real suite locally; no extra browser framework | P0 | Real persistence evidence |
| `ci.yml`: autonomous-controller | Hosted deterministic controller tests | Should also cover new CI tools | Add narrow stdlib tests and shell syntax check to same job | P1 | Failure/cleanup security regression gate |
| `copilot-setup-steps.yml` | Hosted dependency setup; 59-minute agent session cap | Not a product test suite | Preserve hosted placement | P2 | No new paid agent loop |
| `autonomous-development.yml` | Hosted dry-run controller; 15-minute schedule + issue/PR/workflow events, including pull_request_target | Many skipped/action-required/failed runs; not a local job candidate | Keep trusted metadata-only checkout; separate review before changing schedule | P2 | Avoid executing PR code with privileges |
| `autonomous-qa-signal.yml`, `luxe-repair-signal.yml` | Hosted one-minute metadata signals | Duplicated wake-ups merit separate review | Preserve; no local routing | P2 | Maintain existing controls |
| `luxe-independent-qa.md` + generated lock | Hosted bounded advisory Copilot QA; opt-in gates | Recent failed/skipped/action-required runs; code source defaults disabled | Independent QA remains; do not activate/change budgets here | P0 | No self-approval |
| `luxe-bounded-repair.md` + generated lock | Hosted opt-in one-attempt repair, restricted scope/App write boundary | Not CI acceleration or permission for more repairs | Preserve unchanged; no local runner/credentials | P0 | Bound paid automation and writes |
| `luxe-gh-aw-tests.yml` | Hosted synthetic security regressions and verified compiler drift check; path-aware | Extra generated-file toolchain only when touched | Preserve unchanged | P1 | Existing supply-chain regression checks |
| Historical `autonomous-qa.lock.yml` | Still listed active by Actions API; absent from current master | Registry entry is not proof it still runs on new events | No deletion/disable action; inspect future events separately | P2 | Avoid incorrect live-workflow claims |
| `infra/docker-compose.yml` | Developer backend/frontend + persistent PG volume, fixed public ports, Ollama dev config | Unsafe to reuse for destructive CI; unrelated services share daemon | Dedicated random-loopback disposable PG, no volumes or developer compose changes | P0 | Preserve developer data |
| Backend / providers | Existing tenant/auth/content/brand/compliance/llm tests, migrations, AIRun provenance; mock and Ollama abstractions | No versioned live-model evaluation suite found | Reuse provider/prompt/schema with fixed synthetic cases; no DB writes in evaluation | P1 | Structured-output and failure evidence |
| Media | FFmpeg lists libx264, h264_nvenc and AAC encoders; no application FFmpeg render job/editor regression implementation found | Listing an encoder does not verify rendering; Media Finalizer is planned | Skip media workflow E | P2 | No infrastructure-driven product expansion |
| Security dependencies | No established pip-audit/npm-audit release gate found; backend requirements are version ranges | New vulnerability policy/locked Python dependencies would expand scope | Record gap; separate scoped dependency audit | P2 | Avoid claiming a security scan passed |

All current executable runner assignments were inspected, including generated lock
files: hosted Ubuntu runners. No local job is added under `.github/workflows/`.
Third-party action SHAs in `ci.yml` were resolved through their official repository
tag refs on the audit date; this reduces tag drift, not a full source-code security
audit. Python ranges and `postgres:16` still allow upstream drift. Update through
review; no new dependency/configuration system is introduced.

## Timing and cost baseline

Read-only GitHub API metadata, not log scraping. Snapshot covers 368 workflow runs
from July2–October27; October contains 75 CI runs, 74 completed at collection time.
Fetched jobs for all 74 completed runs. Sum of valid non-skipped job execution:
**467.28 job-minutes**; estimated sum after rounding each job up: **610 minutes**.
This is historical executed time, not the PR wall-clock latency or an invoice.

| CI job | October completed sample count | October median seconds | Latest five median seconds |
| --- | ---: | ---: | ---: |
| frontend | 72 | 137 | 122 |
| backend | 72 | 88 | 82 |
| real-e2e | 50 | 150 | 123 |
| autonomous-controller | 35 | 7 | 6 |

Job introductions and failed pre-job runs explain differing counts. Latest five
successful samples: [40585163809](https://github.com/harmonie-joy/Luxe/actions/runs/40585163809),
40584574645, 40584318632, 40584242533, 40584069677. Latest-five median steps:
frontend npm install12s, lint6s, tsc6s, Vitest19s, build12s, browser install19s,
smoke36s; backend service13s, Python install7s, full tests49s, PG-specific tests4s;
real-e2e service14s, browser install18s, real tests58s. Step medians do not add up
exactly to job median. Queue time is excluded.

Additional workflow observations: gh-aw validation four completed samples median
15.5s; Copilot setup two samples median37.5s. October controller188 runs, QA signal34,
repair signal9, independent QA12, gh-aw validation5. Many signals/controller/QA runs
were skipped, action-required or failed before valid execution. Some job timestamps
are zero/negative in these records; they are **not timing benchmarks**. No successful
AI-agent throughput or savings is inferred.

Organization plan reported `free`. October billing summary: Linux gross610 minutes
at $0.006 ($3.66), discount amount$4.482, net$0; slim8 minutes at$0.002 ($0.016),
net$0; storage gross~$0.00133, net$0. This is organization-level billing, with
discount adjustments, not a repository-only charge. It is not valid to subtract
discount quantities to infer repository consumption.

[GitHub's current billing documentation](https://docs.github.com/en/actions/concepts/billing-and-usage)
states standard hosted execution for public repositories is free. Included private
usage therefore does not constrain the current public workload. Moving the repository
private would require recalculation against the actual remaining account allowance;
do not assume a new recurring charge or a full unused quota.

| Strategy | Cash cost / power | Speed | Security / reliability | Complexity / maintenance | Recommendation |
| --- | --- | --- | --- | --- | --- |
| A hosted, optimize existing | Current net$0; no desktop energy cost | Latest complete PR jobs about2min, excluding queue | Fresh hosted environment; independent of sleep | Lowest | Use now |
| B hosted PR + trusted local heavy jobs | Current cash saving$0; adds desktop energy/maintenance | GPU evaluations available; CPU improvement must be measured | Needs isolated environment plus enforced workflow routing; optional when offline | Moderate | Prepared future option after approvals |
| C fully self-hosted | Cannot save more than current$0; adds power | Interactive load/sleep can delay every PR | Persistent public-PR code violates required threat model | Highest | Reject |

Electricity **scenario**, not measured consumption or tariff: 150W incremental,
10 job-hours/month, €0.35/kWh ⇒ €0.525/month; additional GPU2h at200W ⇒ €0.14.
Keeping the desktop awake solely for CI at50W incremental for720h ⇒ €12.60/month.
Maintenance time and hardware wear are unpriced, not zero. No power meter, actual
tariff or idle-power measurement was available. With net hosted cost$0, monetary
savings are not material; local jobs increase operating expense. No FX assumption
is needed. Concurrency removes obsolete runs when they overlap; monthly time saved
is unmeasured. A local runner accelerates feedback jobs, not Codex's AI inference.

## Implementation and validation evidence

- `.github/workflows/ci.yml`: same four required job names and suites; current
  actions pinned, checkout credentials disabled, contents-read permission,
  superseded-run cancellation, 15-minute product-job timeouts, CI-tool regressions.
- `.github/scripts/runner_health.py`: bounded read-only sanitized host/tool/GPU/
  Docker/Ollama diagnosis; optional `--github` runner metadata query.
- `.github/scripts/run_local_integration.sh`: backend/browser enum, committed
  app snapshot, scrubbed process environment, temp HOME/venv, bounded disposable
  PostgreSQL, synthetic fixtures and owned-resource cleanup. No mocks replace PG.
- `.github/scripts/evaluate_local_ai.py`: installed model only, fixed v1 synthetic
  draft/voice/missing-context cases through existing provider/prompt/schema;
  content-free latency/validity/sampled GPU metrics. Quality thresholds uncalibrated.
- `.github/scripts/test_local_ci.py`: deterministic error/privacy/cleanup checks.
- `.github/runner-templates/trusted-local.yml`: inert template; owner-only manual
  choices, protected current default revision, private-repository preflight,
  organization group, GPU capability label for AI, one job at a time, timeout.
- This audit and [runbook](RUNNER_RUNBOOK.md): scope, setup/removal, exact commands,
  outstanding approvals, and independent QA handoff. Project-memory additions must
  label preparation/QA/activation state honestly; no MVP priority rewrite.

| Verification | Result | Observed evidence |
| --- | --- | --- |
| Script regressions | PASS | 12 deterministic tests; forced nonzero test exit and startup TERM clean the ownership-checked container name/temp tree; inherited netrc blocked |
| Existing automation regressions | PASS | Final 110 tests, including 12 focused local CI tests, via `python3 -m unittest discover -s .github/scripts -p 'test_*.py'` |
| Workflow syntax | PASS | actionlint1.7.12 on changed `ci.yml` and inert template; shell syntax and diff whitespace clean |
| Disposable backend | PASS three times | 180 PostgreSQL tests/no skips; first 39.936s test execution/87.38s total, repeat 36.590s/56.15s; final after cleanup hardening 35.389s/53.71s. Django check, migration drift check and migrate pass |
| Disposable real browser | PASS before cleanup hardening | 7 real-service Chromium tests; 1.1min tests,173.04s total including cold dependency/browser setup |
| Cleanup after local runs | PASS | No `com.theluxe.ci=integration` containers or `/tmp/theluxe-ci.*` trees remained after both backend runs and browser run |
| Initial installed-model draft | PASS | gemma4:12b valid LinkedIn schema/nonempty content;54.877s,1.093 cases/min; sampled aggregate GPU peak11,400MiB |
| Draft after netrc hardening | PASS | Schema valid, LinkedIn/nonempty checks true; 10.768s,5.572 cases/min; sampled aggregate peak11,414MiB |
| Full optional AI fixture set | **FAIL (advisory)** | Draft schema valid7.071s; voice valid25.650s; missing-context invalid JSON (`AIProviderError`)16.930s;3.625 cases/min, aggregate peak11,413MiB; process exit1, no mock success |
| Model GPU residency | PASS in current WSL only | Ollama `/api/ps`: gemma4:12b `size_vram=8064094698`, context4096; does not prove isolated-VM inference |
| Isolated host/access policy, live runner smoke and checks | NOT VERIFIED / BLOCKED | No runner registered; no host/security/repository settings changed; exact prerequisites/commands in runbook |

Local cold backend87.38s versus latest hosted backend82s shows no cold speedup.
Repeat local backend56.15s is about31.5% shorter than that hosted sample median,
but is a warm-network/cache observation on different dependency resolution,
not a controlled performance guarantee. Browser cold173.04s is slower than latest
hosted123s; downloading into a fresh HOME intentionally sacrifices caching for
separation. No hosting migration is justified by these CPU timings.

The missing-context model failure is retained as a measured result, not hidden by
fallback or a production provider change. Investigate fixture/token-budget/model
behavior separately before calibrating quality thresholds. A benchmark detecting a
model failure is distinct from a broken CI script. No CreatorDNA implementation,
application AIRun write or deterministic semantic-quality certification is claimed.
GitHub runner acceptance is independent of successful local subprocess tests.

Independent read-only QA session: **Accepted with Notes for preparation**. Reviewer
ran 12 focused tests, bash syntax/diff checks, pinned actionlint, and a real synthetic
loopback HTTP test confirming no inherited Authorization header. Startup-TERM cleanup
and netrc findings were reproduced and fixed before acceptance. Full backend/browser
measurements above were run by the coordinating implementer, not independently by QA.
Final backend-hardening run left no labeled container or temporary tree. GitHub
required checks and human review/merge remain separate gates. Runner activation is
still Blocked/NOT VERIFIED; this verdict cannot approve it.

## Management → Coding → independent QA handoff

Allowed paths and acceptance checks are in #89. Forbidden: app source/schema,
dependencies/locks, generated gh-aw workflows, host security/settings/credentials,
registration, production or paid-AI operations. Root scopes/configures/documents;
separate Coding session implements scripts; separate QA session reviews final diff,
tests, policy and failure behavior read-only. Human merges after current required CI.

QA must check: inert-template placement; **no** repository runner registration;
public-PR routing bypass documented; group-policy access still unverified; owner
numeric ID/default ref checks; no free-form refs/commands; no personal HOME/.env
leaks; disposable PG/test namespaces; failure/signal cleanup and actual service
removal; optional AI errors do not fabricate success; report content contains only
synthetic metrics; no unsupported quality/provenance/GPU-isolation claims.

Live activation acceptance remains **NOT VERIFIED**: GitHub online registration,
authorized smoke job, real suite on a registered runner, visible failing GitHub
local check, repeatable restart, isolation/egress tests and removal. Runbook lists
commands and prerequisites. Pending questions: approve isolated VM provisioning;
decide whether trusted organization group/private-repo routing is worth its cost;
confirm org access/plan feature support; choose availability/power policy and approve
registration only after independent security review. No approval is inferred.

Next infrastructure task: choose and independently validate an enforceable isolation/
runner-access boundary before any activation PR. Continue existing product backlog
through Management separately; this work does not change its priority.
