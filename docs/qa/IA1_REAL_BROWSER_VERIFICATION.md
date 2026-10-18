# Stage 3E — IA-1 real-service verification (#54)

2026-10-18. Scope: #54, parent #51, epic #49, UX #58, Internal Alpha milestone #4. No deployment or additional Creator OS features. Functional verification is separate from founder acceptance of Page 9 adaptations and the provisional Page 10A composition.

## Verified baseline and scope

- Fetched `origin/master` at `c5acdebc9dabd03b3ec1f99cb01a47614020e91e`. PR #61 merged at `bfff8ac`; PR #62 is merged at `c5acdeb` (2026-10-18). No pending branch was imported.
- Remote advanced during execution to `f5f1205d467c8f31a064f30afa1bfdf3d1308d9a` (documentation/agent instructions/reference additions; no application code changes). The integration branch incorporated it before implementation integration; upstream files were preserved.
- Integration branch `test/54-real-fullstack`, isolated worktree `/tmp/theluxe-54`; separate implementation worktree. Original local master `a86f002`, other worktrees, local commits and confidential untracked references preserved.
- L2 verification infrastructure only: existing Playwright, real Next.js/Django HTTP/session/CSRF boundaries, isolated PostgreSQL, synthetic fixtures and CI. No production auth bypass, application UI, domain/schema/migration, provider, publishing or deployment changes.

## Environment and safety

- Local runtime: Python **3.12.10**, Django **5.2.11**, Node **24.11.1**, Next.js **16.1.6**, Playwright **1.61.1**, Chromium/Chrome for Testing **149.0.7827.55**. CI uses Node 20 and Python 3.12.
- Local PostgreSQL **16.12** (`postgres:16`, Debian), dedicated ephemeral `theluxe-54-postgres` container on loopback port 55454, tmpfs storage. Database `theluxe_e2e_54`; this is separate from the running developer stack. Test application ports 3154/8154 preserve developer ports 3000/8000.
- Tests require explicit isolated database opt-in; normal development settings remain unchanged. Real Django session authentication, authorization and CSRF protections are retained. Only test-origin CORS/CSRF origins change in test settings.
- Fixtures use synthetic users/workspaces/brand profiles and unapproved active voices. The browser performs exact-version acceptance. Independent ORM reads use a separate process/connection. Cleanup targets only fixtures belonging to that run.
- Raw Playwright tracing is disabled because it captures passwords/cookies. Credential-free HTTP method/path/status/failure timelines, screenshots, step/error reports and synthetic persisted-state evidence provide diagnostics without request bodies or headers. No private source documents are attached.

## Test architecture

`frontend/playwright.real.config.ts` selects `e2e-real/`, preflights the database guard, and owns Django/Next processes without reusing listeners. `backend/config/e2e_settings.py` imports normal middleware/authentication and narrows only the test origin. `e2e-real/db.py` seeds, independently reads and cleans namespace-owned records; Playwright drives production components and real HTTP endpoints. The existing `e2e/` synthetic suite is unchanged.

Exact setup/run/cleanup commands: [real-browser README](../../frontend/e2e-real/README.md).

## Execution record

| Command | Environment | Result |
| --- | --- | --- |
| `make check TEST_DATABASE_URL=<isolated PostgreSQL URL>` | Final resolved code82c12a7; Node24.11.1; PostgreSQL16.12 | **Passed** lint/typecheck, **103 frontend tests**, **180 backend tests**, **0 skips**, including PostgreSQL concurrency and6 guard checks |
| `backend/.venv/bin/python backend/config/test_e2e_guard.py` | No database connection | **6 passed**, 0 failures/skips; missing opt-in, non-PostgreSQL, foreign host, wrong database name, query override and fragment rejection |
| `cd frontend && npm run build -- --webpack` | Isolated worktree with reused dependency symlink | Production build passed |
| `PLAYWRIGHT_PORT=3153 npm run test:smoke` against `npm run start -- --hostname 127.0.0.1 --port 3153` | Production build; existing synthetic suite | **27 passed**, 0 failed/skipped; separate regression evidence, not #54 persistence proof |

| `cd frontend && E2E_DATABASE_URL=<isolated PostgreSQL URL> E2E_ALLOW_ISOLATED_DATABASE=1 npm run test:e2e:real` | Real Next.js/Django, PostgreSQL16.12, Chromium149 | Implementer run **7 passed** (1.1m), independent integration repeat **7 passed** (1.3m), 0 failed/skipped |

Local default Turbopack build rejected the worktree's external `node_modules` symlink. Webpack completed successfully without tracked configuration changes. CI uses `npm ci` with a normal dependency directory.


The independent repeat used a fresh server lifecycle and fresh fixtures. A separate `psql` query after completion returned **0 users, 0 workspaces, 0 ContentItems, 0 ExecutionCheckpoints, 0 sessions**. Runtime processes exited. This is committed server state, not browser local storage.

## Journeys and independent IA-1 acceptance

| #51 criterion | Evidence | Assessment |
| --- | --- | --- |
| AC1 Creation | Browser creates actual Project/item in authenticated Workspace; ORM verifies ownership. Existing execution API tests reject foreign Project/profile/voice references and read-only roles. | Verified |
| AC2 Persistence | All goal/stage/decision/question/next-action edits acknowledged by real checkpoint201; separate ORM reads verify full current snapshot, immutable revision1 and exact revision2 checkpoint UUID. UI unsaved/saved/failed states tested; existing transaction tests cover rollback. | Verified |
| AC3 Restoration | Refresh, actual Account logout, unauthenticated403, fresh browser-context login and Creator Home queue resume restore all fields and latest checkpoint ID. No storage state imported. | Verified |
| AC4 Voice context | Starts with unapproved active version2; actual review/accept action creates exact voice/user/Workspace approval. Later actual version3 activation leaves existing item pinned to approved version2 across restore. | Verified; activation alone is never counted as approval |
| AC5 Isolation | User B's separate Workspace sees empty list; A item detail/context/checkpoint and voice acceptance return404; UI guessed UUID shows unavailable, no protected title/editor. Independent state unchanged; existing backend tests cover foreign-key matrix. | Verified |
| AC6 Honest failures | Two authenticated browser contexts produce real stale_revision409 with B edits retained and A committed state intact; same-key/different-payload yields idempotency_key_reused409. Actual offline saves keep input and retry successfully. Browser network firewall disconnects only the real item-list path for honest unavailable/retry Home state; no route handlers or fabricated responses. Existing identifier/role tests supplement. | Verified within documented contract |
| AC7 Regression | All existing frontend/backend tests, Brand Voice/Draft Studio coverage, production build and27 existing synthetic browser checks retained. Final check/CI recorded below. | Verified locally; final CI is a merge gate |
| AC8 Real flow | Seven focused cases use real browser/UI/HTTP/Django/PostgreSQL; primary covers create/save/refresh/logout/login/fresh-context resume. | Verified independently from synthetic tests |

## Known creation limit and release assessment

An actual initial-create payload replay returns a second201 with a different ID; the independent read finds two persisted items with identical content. This characterizes a caller retry after an acknowledgment is lost/discarded; no lost response was fabricated. Rapid same-tick UI submissions produce one create request. Offline creation preserves the form, disables another create and requires explicit saved-work reconciliation before retry.

A user who overlooks a successful saved item and deliberately retries can still create a duplicate. This existing endpoint limitation is **non-blocking for IA-1's documented acceptance**, which explicitly excludes guaranteed exactly-once initial creation, but remains a product risk. No backend idempotency feature was added. This does not complete the wider Internal Alpha milestone or authorize a release/deployment.

## UX evidence and remaining design gates

Actual application captures with synthetic persisted data: [desktop Home](../screenshots/stage3e-real/creator-home-desktop.png), [desktop resume](../screenshots/stage3e-real/resume-desktop.png), [desktop Page10A](../screenshots/stage3e-real/post-dashboard-desktop.png), [mobile Home](../screenshots/stage3e-real/creator-home-mobile.png), [mobile resume](../screenshots/stage3e-real/resume-mobile.png), [mobile Page10A](../screenshots/stage3e-real/post-dashboard-mobile.png), [foreign URL denial](../screenshots/stage3e-real/foreign-post-unavailable.png), [conflict](../screenshots/stage3e-real/conflict-edits-retained.png), [offline save](../screenshots/stage3e-real/disconnected-save-retained.png), [uncertain create](../screenshots/stage3e-real/uncertain-creation-reconciliation.png), [Home outage](../screenshots/stage3e-real/creator-home-connection-outage.png).

Desktop1440×900 and fresh-session mobile390×844 show real resume identity, stage and next action; mobile checks cover no horizontal overflow and navigation open/Escape. Existing synthetic suite separately checks320px, keyboard/focus and zoom-equivalent layout. Browser assertions cover full restored editor values even below the captured viewport. Page9 night/card/type/navigation adaptations still await founder acceptance; Page10A remains provisional/undesigned under baseline revision1. Test success does not grant Harmonie's design approval. No baseline source/revision changed.

## Standards QA

Initial verdict Changes Required: a URL query could override the guarded PostgreSQL database name. Reproduced without opening a connection; fixed by rejecting query parameters and fragments before importing base settings, with failing-then-passing guard regressions. No database outside the isolated fixture target was accessed. Password-fill HTML action titles were also corrected before artifact publication; inspection found no password-fill values or session/CSRF header values in the resulting report. Final code re-review **Accepted with Notes** at82c12a7, **6/6 guard checks passed**. No remaining code findings.

## Spec QA

Independent verdict **Accepted with Notes** on implementation1555a35: no blocking spec gaps, wrong implementation or unrequested scope. Parent AC1–AC8 map independently to new browser evidence and existing regression tests. Notes preserve duplicate-create limit and pending founder approval. Reviewers inspected implementation/assertions; root and implementer performed execution.

## Delivery and final gates

[PR #63](https://github.com/harmonie-joy/Luxe/pull/63), implementation `1555a35`, guard fix `9f5f63f`, final resolved tree `82c12a7`. Independent Standards and Spec code QA accepted with notes and zero remaining blocking findings. Final corrected-code CI evidence is pending update; final make check passes103 frontend/180 PostgreSQL backend tests with no skips. Both independent QA axes have zero remaining blocking code findings. #54/#51 close only after their own evidence, accepted QA and merged delivery. #49/#58/milestone4 remain open. No decision-log update: no architecture, model, product contract or auth-provider decision changed.

Exact next implementation task after accepted merge: **#58 PR3**, the already-scoped truthful company/public entry and controlled-preview readiness work; separate from deployment. Founder Page9/Page10A acceptance and private-reference archival remain separate outstanding governance work. Do not begin CreatorDNAProposal, caption versions, Gallery, media, WorkOS migration or publishing under #54.

