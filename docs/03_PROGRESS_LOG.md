# Progress Log

### 2026-10-20 - #58 PR3 public-homepage slice

- Implemented only the authorized public homepage portion: Creator/CEO audience, context preservation and finishing the current piece of work; the Internal Alpha is explicitly limited to accepting the exact BrandVoice version and saving/resuming post checkpoint state in idea/drafting. Build → Scale → Automate is framed as vision, with Scale and Automate marked future/planned.
- Public calls to action route only to the existing `/login`; removed dead Stories/Pricing navigation and both remote illustrative images. Homepage title/description are updated; root metadata defaults to `noindex,nofollow`, with the public homepage explicitly `index,follow`.
- Focused homepage tests passed 5/5; full frontend tests passed 108/108; `npm run lint` and `npm run typecheck` passed. `npm run build` was attempted and failed because Next.js could not fetch existing Google-hosted fonts in `app/layout.tsx`; no font, architecture or dependency changes were made.
- This is a partial #58 PR3 slice for independent review, not a full PR3 or release. Login demo-credential cleanup, broader deployment/review instructions, environment/release gates and screenshots remain required PR3 work. No public deployment, #58 completion, founder design acceptance or broader release gate is claimed.

### 2026-10-18 - Stage 3E / #54 real full-stack verification

- [PR #63](https://github.com/harmonie-joy/Luxe/pull/63) delivers seven Playwright cases against actual Next.js, Django session/CSRF authorization and PostgreSQL 16.12. The primary creator journey explicitly accepts version 2, creates Project/ContentItem, commits every checkpoint field, refreshes, logs out, logs in with a fresh browser context and resumes the exact checkpoint/pinned version even after version 3 activation. Separate ORM reads prove persisted state.
- Actual API/UI Workspace denial, two-session stale 409, conflicting retry 409, offline failed-save recovery, genuine list connection failure and duplicate-submit/retry checks pass. Known initial-create replay produces two IDs; pending UI guard/reconciliation pass, while exactly-once initial creation remains outside the documented IA-1 contract. No backend feature fix was added.
- Implementer and independent integration runs each passed 7/7 (Chromium 149.0.7827.55), no failures/skips. Independent post-run database inspection found zero synthetic users/workspaces/items/checkpoints/sessions. Existing production webpack build and 27 synthetic browser regressions passed separately; those are not counted as real persistence proof. Final `make check` passed 103 frontend/180 PostgreSQL backend tests without skips; corrected-code [CI39155394906](https://github.com/harmonie-joy/Luxe/actions/runs/39155394906) passed frontend/backend/real-e2e. Full commands/artifacts are recorded in the [verification report](qa/IA1_REAL_BROWSER_VERIFICATION.md).
- Baseline c5acdeb includes merged PR62; upstream advanced to documentation-only f5f1205 and was incorporated. Implementation `1555a35`; QA guard fix `9f5f63f`; final resolved code `82c12a7`. Standards identified a URL-query database-name override; regression tests first failed, then 6/6 passed after query/fragment rejection. Both independent QA axes accepted with notes and no remaining blocking code findings. Artifacts use safe HTTP timelines/screenshots/ORM evidence; password-fill HTML leakage was fixed before publication.
- #51 AC1–AC8 independently verified within the documented contract; #54/#51 completion requires accepted final evidence and merged PR63. #49/#58/milestone 4 remain open. Page9/Page10A functional evidence and eleven real-service desktop/mobile/error captures update traceability; founder design acceptance stays pending. No product UI, migration, dependency, production auth, AI, publishing or deployment changes; no decision-log change required.
- Next implementation after delivery: separately scoped #58 PR3 truthful public entry/controlled-preview readiness; no deployment or broader Creator OS work.

### 2026-10-18 - #53 post-merge finalization

- Verified PR60 merged at `a16f9da` and PR61 merged at `bfff8ac5096752714b5f78da3b01ec858a210853`. PR61 final head `5e7c57f` has the same application code as reviewed `27cf74c`; reconciliation brought only PR60 documentation/evidence changes. [CI39125265707](https://github.com/harmonie-joy/Luxe/actions/runs/39125265707) passed frontend and backend, including PostgreSQL concurrency checks.
- Closed #53 as completed/Done after merged implementation, independent QA and green CI. #51/#54/#58/#49 and milestone4 remain open. Merge does not establish founder Page9/Page10A design acceptance; those notes and the separate #54 real-backend browser gate remain.
- Reconciled current next actions, screen traceability and PR61 review with merged status. Finalization is documentation/tracker only; no application, baseline-governance, deployment or #54 changes. Local `bead1e1` TDR documentation commit and confidential artifacts were preserved separately from remote master. Earlier temporary directories are absent in this environment; unrelated Git worktree records were not pruned.

### 2026-10-18 - Stage 3D PR 2 / #53 functional Creator workspace

- [PR #61](https://github.com/harmonie-joy/Luxe/pull/61) implements the persisted Page 9 / bounded Page 10A workflow on `feat/53-ia1-frontend`, starting from verified remote master `c6d3e44d2fd5d1df8aa656200c9a672aef5e7c97`. PR #59 is merged; documentation correction #60 remains open. Historical local master and confidential planning artifacts were preserved.
- Creator Home now lists actual active-Workspace ContentItems with title, goal, stage, checkpoint revision/time, next action and Resume. `/content-items/new` selects or creates a minimal Project, reviews an active exact BrandVoice, explicitly accepts it, and creates the item. `/content-items/[id]` restores its pinned version, checkpoint and decisions/questions; focused editing saves the supported snapshot and returns to the same dashboard. No IA-1 mock fallback. Saved title/bindings remain read-only; only idea/drafting exist.
- Save failures retain edits; retries preserve snapshot/UUID, newer local input stays dirty, old acknowledgments are reconciled, and both 409 codes require deliberate reload. Initial creation blocks duplicate pending requests and requires reconciliation after ambiguous outcomes. Session/Workspace changes clear old data; role limits remain server enforced. Navigation protection covers links, refresh, repeated save/edit Back/Forward and native-hash multi-entry traversal. An inert root bootstrap initializes history metadata before router hydration; no creator content is stored in it.
- Coding/QA: implementation `e7f2905`, review fixes `238a962`, responsive rows `eecaa26`, native-hash fix `2521574`. Standards found two navigation defects across review rounds; Spec found retry selection reset. All were fixed and independently re-reviewed with zero remaining findings (Accepted with Notes). Visual QA also fixed 21px controls using existing padded/48px patterns and stacked new mobile resume rows. Founder design acceptance remains pending.
- Final local evidence at code tip `2521574`: `make check TEST_DATABASE_URL=sqlite:////tmp/theluxe-53-check.sqlite3` passed lint/typecheck, 103 frontend tests and 174 backend tests (4 PostgreSQL-only skips); `npm run build` passed; `PLAYWRIGHT_PORT=3110 npm run test:smoke` passed 27 production-build checks. Browser responses/session are synthetic; no #54 real-backend claim. Desktop/mobile screenshots, API summary, review and exact #54 handoff: [implementation review](ux/PR61_IMPLEMENTATION_REVIEW.md).
- Page 9 retains the night foundation; Page 10A overview/focused editor is provisional because physical35 remains undesigned. The [matrix](ux/SCREEN_TRACEABILITY.md) separates visuals, integration, automated evidence and founder acceptance. No migration, backend/schema, dependency, auth-provider, AI/publishing, public marketing or deployment change. All 15 logical pages are not complete.
- #53 remains open/In Progress for PR acceptance; #51/#54/#58/#49 and milestone #4 remain open. Next: review PR #61 and obtain founder design acceptance, then separately implement #54's real create/save/refresh/logout/login/restore/isolation verification. No #54 or PR3 implementation is included.
### 2026-10-18 - PR #59 post-merge finalization

- Verified PR59 merged at `c6d3e44`; final-head CI39120549810 frontend/backend passed. No explicit design acceptance found in PR/#58 comments or reviews; typography/card height/mobile navigation acceptance remains pending. #58 stays open.
- Removed misleading duplicate resume screenshot, preserving its historical audit link; remaining named viewport captures have matching dimensions. Updated UX status and exact #53 backend-connected Single-Post Dashboard handoff. Prepared clean `/tmp/theluxe-ia1-frontend` on `feat/53-ia1-frontend` at fetched master `c6d3e44`; no implementation/deployment. Documentation-only follow-up branch `docs/pr59-merged-handoff`.

### 2026-10-18 - UX baseline and PR #59 design review

- Documentation-only follow-up to draft PR #59: [UX baseline](ux/UX_BASELINE.md), [all Phase 1 screens/candidates](ux/SCREEN_TRACEABILITY.md), [design comparison](ux/PR59_DESIGN_REVIEW.md), and a compact root AGENTS review pointer. No existing PR template was present; no separate framework or skill change added.
- Verified exact confidential PDF hash `2c3da43ba956fb8994614117a38f7120295af427515af8f4638789b30ce65743`. Only local temp copy established; approved durable private archive remains a blocker to archival completion. Source/raw renders remain untracked.
- Directly inspected preferred night physical31 and actual desktop/tablet/mobile/menu captures. Corrected evidence claim: named resume capture duplicates desktop; tablet shows full unavailable message. Typography/card density, stacked mobile layout and drawer differ from reference and await founder acceptance. No new blocking implementation defect established; no design acceptance granted. Independent review attempts hit usage limits; no new full independent pass claimed.
- Branch `feat/stage3d-visual-foundation`, documentation follow-up to `3ae9d99`, PR https://github.com/harmonie-joy/Luxe/pull/59. Review records existing CI/test evidence separately from this documentation verification. #58 remains In Progress/open; #53/#51/#54 and milestone4 stay open.
- Next: confirm durable source archive and obtain PR59 design acceptance; after merge, #53 implements the bounded real Single-Post Dashboard using the matrix/contracts. Physical35 is explicitly unfinished design. #54 remains independent persistence/isolation verification. No feature, merge or deployment work performed.

## 2026-10-17 - Stage 3D PR 1 visual foundation

- Implemented [draft PR #59](https://github.com/harmonie-joy/Luxe/pull/59), refs [#58](https://github.com/harmonie-joy/Luxe/issues/58), on `feat/stage3d-visual-foundation` from verified remote master `64ea445`. Implementation `ab2b8ce`; review fixes `d5acbc8`. No historical local commits were carried in. Pending documentation commit `92285a2` remains separately preserved on `spec/stage-3d-creator-preview`; do not cherry-pick its obsolete planning status over this handoff.
- Implemented the Mario Builder Spec logical Page 9 preferred night direction (physical PDF page 31): tokenized neutral/violet/blue surfaces, focused creation cards, responsive sidebar/topbar, native mobile navigation with focus wrapping/Escape, and a Creator Home replacing synthetic dashboard metrics. The August 10 plan still governs functional scope. The confidential PDF/DOCX and raw mockup images were not staged.
- Shared PageShell now checks the existing session before displaying product content and rechecks on navigation; it shows loading/sign-in/outage states, real Workspace/account identity, account access and existing logout. A confirmed Account name change refreshes the shell's session read without losing the mounted form's success feedback. No auth provider, backend API, role or tenant model changed.
- `/dashboard` now composes CreatorHome. Shared Sidebar/Topbar, route/page-label configuration, theme tokens and design reference were updated; Account emits a session-refresh event after a successful name save. Legacy routes remain reachable; Calendar/Compliance show a synthetic-demonstration notice. Create With Me, Quick Draft and Bring Something In are visibly unavailable. The resume section explicitly states that no saved posts are displayed; no ContentItem API integration or fake empty-account claim was added.
- Review captures from the local production build use an explicitly synthetic QA session: [desktop](screenshots/stage3d-pr1/creator-home-desktop.png), [tablet](screenshots/stage3d-pr1/creator-home-tablet.png), [mobile](screenshots/stage3d-pr1/creator-home-mobile.png), [mobile navigation](screenshots/stage3d-pr1/creator-home-mobile-navigation.png), [resume section](screenshots/stage3d-pr1/creator-home-resume.png), [before dashboard](screenshots/stage3d-pr1/before-dashboard-desktop.png). These are application screenshots, not copies of the confidential reference.
- Verification: `make check` passed lint/typecheck, 78 frontend tests and 174 backend tests (4 PostgreSQL-only skips locally); `npm run build` passed. `PLAYWRIGHT_PORT=3100 npm run test:smoke` against the served production build passed 17 tests: backend-off smoke, 1440/768/390/320px overflow, availability, focus/Escape, skip link, account/logout and authenticated legacy route rendering. New workspace QA rejects console/page/asset/API failures except cancelled speculative Next prefetches. No formal before/after performance benchmark or exhaustive assistive-technology audit was run.
- Independent Standards and Spec reviews found danger-button contrast and stale account identity; fixes were verified and both re-reviews report no blockers. Browser checks require destructive text contrast at least 4.5:1 and input boundaries at least 3:1. Founder design acceptance and merge approval remain pending; PR #59 is deliberately a draft.
- Deferred: ContentItem new/detail route helpers and pages move together into #53; all create/save/resume writes, formal voice acceptance UI, Single-Post Dashboard, public marketing updates and deployment readiness work remain later slices. The public website is unchanged, and no external preview/public deployment occurred. #58 stays In Progress; #53/#51/#54 and milestone #4 stay open. The real persisted browser/isolation gate is #54, not these synthetic navigation tests.
- Exact next task: review/merge PR 1 after design acceptance, then implement #53 as PR 2 in the redesigned Single-Post Dashboard using the merged explicit voice approval and Project/ContentItem/context/checkpoint contracts. Preserve revisions, retry UUIDs and unsaved edits; title remains read-only after create. Do not start PR 3 or deploy as part of that slice.

## 2026-10-17 - IA-1 backend acceptance

- Product authority: the confidential 2026-08-10 MVP plan, founder-confirmed 2026-10-16. The August 12 Revision 1.1 technical record does not supersede this product approval.
- Independent uploader baseline repair merged as [PR #55](https://github.com/harmonie-joy/Luxe/pull/55), master merge commit `7a292d5`, after local `make check` and GitHub backend/frontend checks passed.
- #52 backend merged in [PR #56](https://github.com/harmonie-joy/Luxe/pull/56), merge commit `3313c3b`: `ab507fe` adds Project, ContentItem, ExecutionCheckpoint, workspace-scoped APIs, revision/idempotency behavior and migrations; `6c3691e` adds explicit, version-specific BrandVoiceApproval and migration; `1487134` adds a PostgreSQL CI service and concurrent-connection test step; `c343f68` fixes its DRF client fixture; `bf441c8` serializes voice activation with item creation and adds a PostgreSQL regression test.
- Earlier local `make check` passed. Fresh SQLite verification used the original workspace virtualenv because the isolated worktree lacks `.venv`: 56 content and 173 total backend tests passed, with 3 PostgreSQL-only skips. CI run `39068049872` passed the backend suite and four real PostgreSQL concurrency/rollback/idempotency/activation tests; frontend lint, typecheck, unit tests, build, and smoke passed. Two-axis review found an activation race, fixed in `bf441c8` and verified in PostgreSQL CI. The historical active-only approval assumption was superseded by the later Stage 3C requirement; no unresolved backend blocker remained.
- No frontend #53, persisted browser #54, production deployment, or product-scope expansion. #52 is closed/Done with evidence; #51, #49, #38, #53, #54 and milestone #4 remain open.
- Original local `master` and three untracked planning files, including confidential DOCX/PDF copies, were preserved. No confidential product document was staged or committed.

The older snapshot and entries below are historical; current priorities are in [Next Actions](04_NEXT_ACTIONS.md).

## Current Snapshot

THE LUXE is rebaselined to the approved August 12, 2026 MVP Technical Decision Record Revision 1.1. The current product target is a context-preserving Creator/CEO execution system: approved CreatorContext, communication guide, Project/ContentItem workflow, versioned LinkedIn-first captions, ExecutionCheckpoint resume state, MediaAsset/Gallery, bounded Media Finalizer, explicit human approval, EU production baseline, and no production mock fallback. The existing Django/DRF/PostgreSQL plus Next.js architecture remains the foundation. Workspace/Membership remain tenancy and authorization. WorkOS AuthKit is the target product authentication layer. The July Create Brief -> Draft Studio -> Compliance -> Calendar flow is reusable implementation history, not the next primary milestone.

Current verification baseline: `make check` fails because two frontend tests expect `Save Image` while the rendered uploader button is `Save File`; frontend lint/typecheck pass through `make check`; backend local tests pass with 147 tests.

## Progress Entries

### 2026-10-12 - TDR Revision 1.1 Rebaseline And Issue Audit

Worked On:
- Rebaselined project memory against the August 12, 2026 MVP Technical Decision Record Revision 1.1 and Harmonie's latest Creator/CEO Builder Spec.

Completed:
- Updated `docs/00_PROJECT_BRIEF.md`, `docs/01_ARCHITECTURE.md`, `docs/02_DECISIONS.md`, and `docs/04_NEXT_ACTIONS.md`.
- Updated root/backend/frontend agent instructions and `docs/agents/*` to point at the current org repo, TDR-era domain boundaries, and scoped spec workflow.
- Marked django-allauth/signup-login and old Draft Studio bootstrap decisions as superseded where the WorkOS/CreatorContext TDR changes the direction.
- Classified GitHub issues as implemented, still valid with re-scope, deferred, or superseded in `docs/04_NEXT_ACTIONS.md`.
- Recorded recommended implementation spec boundaries.

Problems Found:
- The repo is red before new product work: `sample-content-uploader.test.tsx` expects `Save Image`; the UI renders `Save File`.
- The private repo has moved to `harmonie-joy/Luxe`; issue tracker docs now use that org repo.
- An application-source file is already modified in the worktree: `frontend/features/brand-voice/components/sample-content-uploader.tsx`. This documentation task did not touch it.

Verification:
- `make check` failed after frontend unit tests: 64 passed, 2 failed.
- `make test-be-local` passed with 147 tests.

Decision Log Update Needed:
- Completed. Added D-0012 through D-0018 and marked D-0006/D-0007 superseded.

Next Step:
- Convert Spec 0 or Spec 1 from `docs/04_NEXT_ACTIONS.md` into a concrete implementation spec before touching application code.

### 2026-06-05 - Project Memory Scaffolding

- Added canonical Markdown memory docs for project brief, architecture, decisions, progress, next actions, and AI work tracking.
- Added a reusable management-agent prompt.
- Added Cursor project rules.
- Preserved existing `AGENTS.md` and `.github/copilot-instructions.md` instead of overwriting them.
- Source context used: `prompts/agent-creation.md`, root/frontend/backend agent instructions, `README.md`, `docs/mvp-progress-report.md`, `docs/prototype-audit.md`, and current backend/frontend files.

### 2026-06-05 - Memory Consistency Audit

- Checked the new project memory system against `docs/mvp-progress-report.md`.
- Confirmed the memory docs reflect that backend APIs cover most canonical MVP domains and that frontend mock/API integration is the main current gap.
- Added a data-model authority note to `docs/01_ARCHITECTURE.md` so current implementation summaries reference, rather than replace, `docs/the_luxe_data_model_source_of_truth.md`.
- Tightened `docs/04_NEXT_ACTIONS.md` so the best next engineering task names the specific API base URL file and expected fallback behavior.

### 2026-06-05 - AI Development Team Workflow

Worked On:
- Added minimal AI development team workflow documentation and prompts.

Completed:
- Added or completed Management Agent, Coding Agent, and QA Agent coordination workflow.
- Created `prompts/coding-agent.md`.
- Created `prompts/qa-agent.md`.
- Updated `AGENTS.md` with AI team workflow rules.
- Updated `prompts/management-agent.md` with coordination, handoff, approval, and QA responsibilities.
- Completed or updated `docs/10_AI_TEAM_OPERATING_MODEL.md`.
- Completed or updated `docs/11_AGENT_HANDOFF_TEMPLATE.md`.

Problems Found:
- `docs/10_AI_TEAM_OPERATING_MODEL.md` and `docs/11_AGENT_HANDOFF_TEMPLATE.md` already existed, so they were updated instead of recreated.

Decisions Made:
- Use a three-agent development workflow: Management Agent, Coding Agent, and QA Agent.
- Use risk levels L0-L4 to control approval requirements.
- Require Founder/CTO approval for L3 and L4 changes.

Files Changed:
- `AGENTS.md`
- `prompts/management-agent.md`
- `prompts/coding-agent.md`
- `prompts/qa-agent.md`
- `docs/10_AI_TEAM_OPERATING_MODEL.md`
- `docs/11_AGENT_HANDOFF_TEMPLATE.md`

Next Step:
- Test the AI team workflow on one small, scoped coding task.

### 2026-06-05 - Create Brief API Integration Accepted

Worked On:
- Connected the `/create` frontend brief form to the existing backend `ContentBrief` API.

Completed:
- Converted the create brief shell into a client-side interactive form.
- Preserved mock data as the initial form state.
- Submitted a backend write payload through `createContentBrief` using snake_case fields.
- Added client-side validation for workspace, brand profile, content objective, campaign goal, audience, and at least one target channel.
- Kept brand profile selection scoped to the selected workspace.
- Added loading, disabled, validation, success, and API error states.
- Navigated to the existing Draft Studio route after successful create.
- Updated the frontend HTTP client to prefer `NEXT_PUBLIC_API_BASE_URL` while preserving `NEXT_PUBLIC_API_URL`.

Problems Found:
- Real API submission still depends on the known auth/session and workspace bootstrap blockers.
- Lint still reports the pre-existing unused `AuditLog` import in `frontend/features/calendar/components/calendar-shell.tsx`.
- Production build still logs the pre-existing root health-page dynamic fetch message, but exits successfully.

Files Changed:
- `frontend/features/create/components/create-brief-shell.tsx`
- `frontend/lib/api/http-client.ts`

QA Status:
- Accepted with notes.

Verification:
- `cd frontend && npm run typecheck` passed.
- `cd frontend && npm run lint` passed with one pre-existing warning.
- `cd frontend && npm run build` passed.

Decision Log Update Needed:
- No. No architecture, backend contract, data model, enum, auth, AI, compliance, or publishing decision changed.

Next Step:
- Define the minimal authenticated workspace/bootstrap path, then connect Draft Studio reads and saves to the existing content draft APIs.

### 2026-06-05 - Mock AI Flow Fixtures Accepted (Frontend-only)

Worked On:
- Added a frontend-only typed fixture contract for AI-assisted UX validation in Draft Studio and Compliance Review without rendering or backend changes.

Completed:
- Added `frontend/data/mock-ai-flow.ts` with typed fixtures for:
	- workspace validation states,
	- brief input states,
	- AI guidance states (loading, ready, failure),
	- draft suggestion sets,
	- AI failure scenarios,
	- compliance scenario states,
	- compliance fix suggestion states,
	- approval and audit-event preview entries.
- Kept canonical enums aligned via shared frontend type imports.
- Reused existing workspace, brief, draft, compliance check, and issue IDs from current mock datasets.
- Kept all fixture timestamps in ISO 8601 string format.

Problems Found:
- Initial implementation included out-of-scope `.github/agents` file additions and one non-reused compliance check ID variant.

QA Outcome:
- QA first pass: Changes Required.
- QA remediation completed: out-of-scope files removed and compliance check ID aligned to existing mock IDs.
- QA re-review: Accepted.

Files Changed:
- `frontend/data/mock-ai-flow.ts`

Verification:
- `cd frontend && npm run typecheck` passed.

Decision Log Update Needed:
- No. No architecture, data-model, auth, compliance posture, or integration-strategy decision changed.

Next Step:
- Render the new mock fixture states in Draft Studio UI (AI guidance panel, suggestion cards, and failure/loading states) while remaining frontend-only and mock-only.

### 2026-06-05 - T-BOOT-001 Authenticated Workspace Bootstrap Prerequisite Documented (Planning-only)

Worked On:
- Documented T-BOOT-001 as the planning prerequisite path for future API-connected Draft Studio persistence.

Completed:
- Defined a minimal prerequisite sequence for persistence work:
	- session bootstrap contract for active user context,
	- active workspace resolution contract,
	- workspace-scoped Draft Studio read contract,
	- fallback behavior when bootstrap data is unavailable,
	- integration order from bootstrap to draft read/save persistence.
- Confirmed this is planning-only and does not include backend or frontend implementation changes.

Problems Found:
- No new blockers introduced. Existing workspace/bootstrap API availability remains the known dependency.

Files Changed:
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Decision Log Update Needed:
- No. No architecture, data-model, auth, AI provider, or deployment decision changed.

Next Step:
- Execute the approved frontend mock-render slice in Draft Studio while keeping T-BOOT-001 as a prerequisite planning track for later API persistence.

### 2026-06-29 - Homepage and Auth Provider Flow

Worked On:
- Built the root homepage prototype and connected signup/login to a backend session flow.

Completed:
- Replaced the root backend-health placeholder with a dark luxury homepage based on the supplied prototype.
- Added `/login` and `/signup` frontend routes with form handling, CSRF preparation, workspace bootstrap, and dashboard redirect.
- Added `django-allauth[headless]` as the backend auth provider package and configured allauth headless/session support.
- Added backend auth endpoints for CSRF, signup, login, logout, current session, and workspace bootstrap.
- Added an idempotent `seed_demo` management command for local demo credentials and workspace data.
- Removed `next/font` runtime build dependency so frontend builds do not require Google Fonts network access.

Problems Found:
- Local backend tests could not use the default Postgres connection because the service was not running; targeted auth tests passed with a temporary SQLite database.
- Frontend lint still reports the pre-existing unused `AuditLog` import in `frontend/features/calendar/components/calendar-shell.tsx`.

Files Changed:
- `backend/config/settings.py`
- `backend/config/urls.py`
- `backend/requirements/base.txt`
- `backend/tenancy/`
- `frontend/app/`
- `frontend/features/auth/`
- `frontend/features/home/`
- `frontend/lib/api/`
- `frontend/lib/routes.ts`
- `frontend/types/auth.ts`
- `frontend/styles/theme.css`

Verification:
- `cd backend && DATABASE_URL=sqlite:////tmp/theluxe-auth-test.sqlite3 .venv/bin/python manage.py test tenancy` passed.
- `cd frontend && npm run typecheck` passed.
- `cd frontend && npm run lint` passed with the pre-existing calendar warning.
- `cd frontend && npm run build` passed outside the sandbox after Turbopack hit a sandbox port-binding restriction.

Decision Log Update Needed:
- Yes. Added D-0007 for django-allauth headless plus Django sessions.

Next Step:
- Run `make migrate`, then `make manage cmd="seed_demo"` in the Docker stack and manually verify homepage -> signup/login -> dashboard against the running backend.

### 2026-07-01 - Ponytail Cleanup Pass

Worked On:
- Removed over-scaffolded and unused MVP code surfaces.

Completed:
- Removed unused backend queue/storage/data dependencies and Docker Redis/MinIO services.
- Removed the empty `llm` Django app scaffold while keeping real AI integrations out of scope.
- Removed the unimplemented Settings navigation target.
- Removed frontend-only brand asset comments and voice-score UI/types that had no backend contract.
- Removed two mock-only page data wrappers, unused default public SVGs, and unused memory helper scripts.
- Cleaned the pre-existing unused `AuditLog` frontend import warning.

Verification:
- `make dev-check` passed.
- `make dev` rebuilt and started Docker services.
- `make test-be` passed with 79 backend tests.

### 2026-07-01 - Local-First AI Orchestration Foundation

Worked On:
- Added the backend foundation for local-first AI task execution.

Completed:
- Reintroduced the backend `llm` app as an MVP orchestration boundary.
- Added `AIRun` tracking for workspace-scoped AI task status, provider, model, inputs, outputs, errors, and timings.
- Added Pydantic result schemas for brand voice extraction, draft generation, voice review, and compliance review.
- Added a provider abstraction with deterministic `MockProvider` support and optional `OllamaProvider` support through `requests`.
- Added service functions that record successful and failed runs while returning schema-valid structured results.
- Added environment-backed settings for `AI_PROVIDER`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL`.
- Created GitHub issue #8 for the local-first backend AI orchestration task.

Problems Found:
- Initial manual migration index names did not match Django's autodetector and were corrected before acceptance.

Files Changed:
- `AGENTS.md`
- `backend/config/settings.py`
- `backend/requirements/base.txt`
- `backend/llm/`
- `docs/00_PROJECT_BRIEF.md`
- `docs/01_ARCHITECTURE.md`
- `docs/02_DECISIONS.md`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `docker exec infra-backend-1 python manage.py check` passed.
- `docker exec infra-backend-1 python manage.py makemigrations --check --dry-run` passed.
- `make test-be` passed with 82 backend tests.

Decision Log Update Needed:
- Yes. Added D-0008 for local-first AI orchestration as MVP scope.

Next Step:
- Wire the local AI services into backend API workflows only after the exact endpoint contract is approved.

- `docker exec infra-frontend-1 npm run typecheck` passed.
- `docker exec infra-frontend-1 npm run lint` passed.
- `docker exec infra-frontend-1 npm run build` passed.

Decision Log Update Needed:
- Yes. D-0003 wording was updated to reflect that no AI runtime app exists.

Next Step:
- Continue with Docker-verified homepage/auth runtime validation and Draft Studio persistence.

### 2026-07-01 - Local-First AI Orchestration Foundation

Worked On:
- Added backend-only local AI orchestration foundation for MVP drafting and review workflows.

Completed:
- Recreated `backend/llm` as the AI orchestration boundary.
- Added `AIRun` tracking for successful and failed AI runs.
- Added `MockProvider` and optional `OllamaProvider` using `requests`.
- Added Pydantic schemas for brand voice extraction, draft generation, voice review, and compliance review.
- Added service functions that run through the mock provider in tests.
- Added `AI_PROVIDER`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL` settings.
- Created GitHub issue #8 to track the AI orchestration slice.

Verification:
- Pending.

Decision Log Update Needed:
- Yes. D-0008 added and D-0003 superseded.

Next Step:
- Run Docker migrations/checks/tests after rebuilding backend dependencies.

### 2026-07-01 - T-AI-002 Brand Voice Extraction API Contract

Worked On:
- Added the first authenticated backend API contract on top of the local-first AI orchestration foundation.

Completed:
- Created GitHub issue #9 for T-AI-002.
- Added `POST /api/ai/brand/extract/`.
- Added request validation for workspace membership, brand profile ownership, and selected brand asset ownership.
- Concatenated selected `BrandAsset.content` values as sample input for `extract_brand_voice`.
- Returned `aiRunId` and schema-valid `BrandVoiceExtractionResult` suggestions without mutating `BrandProfile`.
- Added backend tests for authenticated success, unauthenticated rejection, foreign workspace rejection, foreign asset rejection, missing asset validation, `AIRun` creation, and no profile mutation.

Files Changed:
- `backend/config/urls.py`
- `backend/llm/serializers.py`
- `backend/llm/services.py`
- `backend/llm/tests.py`
- `backend/llm/urls.py`
- `backend/llm/views.py`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `make test-be` passed with 88 backend tests.

### 2026-07-01 - T-UX-002 Delete Brief Destructive Action

Worked On:
- Added a destructive Delete Brief action to Draft Studio.

Completed:
- Created GitHub issue #18 for T-UX-002.
- Added `deleteContentBrief(id)` using `DELETE /api/content-briefs/{id}/`.
- Added a Current Brief delete button and confirmation dialog.
- Warned that deleting a brief permanently deletes the brief, generated drafts, saved edits, compliance checks and issues, approvals, and scheduled content.
- Preserved demo fallback by deleting local brief state without an API call.
- On success, clears current drafts, switches to another brief when one exists, or routes to `/create` when none remain.
- Preserved existing draft generation and save behavior.

Files Changed:
- `frontend/lib/api/content-briefs.ts`
- `frontend/features/drafts/components/draft-studio-shell.tsx`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `cd frontend && npm run typecheck` passed.
- `cd frontend && npm run lint` passed.
- `cd frontend && npm run build` passed.

Decision Log Update Needed:
- No. Existing backend delete/cascade behavior is reused without model or architecture changes.

Next Step:
- Connect Compliance Review to persisted compliance checks and issues.

Decision Log Update Needed:
- No. This implements D-0008 and does not change the AI provider strategy.

Next Step:
- Connect Brand Voice Setup UI to the new extraction endpoint, keeping suggestions review-only until the user explicitly saves changes.

### 2026-07-01 - T-AI-003 Brand Voice AI Suggestions Panel

Worked On:
- Connected the Brand Voice Setup frontend to the brand voice extraction workflow.

Completed:
- Created GitHub issue #10 for T-AI-003.
- Added a typed frontend AI API helper for `POST /api/ai/brand/extract/`.
- Added an AI suggestions panel to `/brand-voice`.
- Let users select current sample assets, run analysis, review loading/success/error states, and inspect suggested audience, tones, vocabulary, banned phrases, and positioning notes.
- Preserved mock fallback with deterministic local suggestions when `/brand-voice` is using mock data.
- Added `Accept Suggestions`, replacing BrandProfile voice fields through the existing update API in API mode and confirming locally in mock mode.

Files Changed:
- `frontend/app/(app)/brand-voice/page.tsx`
- `frontend/data/mock-brand-profiles.ts`
- `frontend/features/brand-voice/components/brand-voice-ai-panel.tsx`
- `frontend/features/brand-voice/data/get-brand-voice-setup.ts`
- `frontend/lib/api/ai.ts`
### 2026-07-01 - T-AI-004 AI Draft Generation API

Worked On:
- Added the backend-only AI draft generation endpoint.

Completed:
- Created GitHub issue #12 for T-AI-004.
- Added `POST /api/ai/drafts/generate/`.
- Validated authentication, workspace membership, brief workspace ownership, canonical channels, and brief-selected channels.
- Reused `llm.services.generate_draft` through a run-returning wrapper.
- Persisted generated output as `ContentDraft` records, with regeneration updating existing brief/channel drafts instead of violating uniqueness.
- Returned generated draft records and related `AIRun` IDs.
- Kept the task backend-only with no frontend, cloud AI, queue, vector DB, or publishing changes.

Problems Found:
- `make test-be` could not run in the sandbox because Docker socket access was denied and escalation was unavailable.

Files Changed:
- `backend/llm/serializers.py`
- `backend/llm/services.py`
- `backend/llm/tests.py`
- `backend/llm/urls.py`
- `backend/llm/views.py`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `DATABASE_URL=sqlite:////tmp/theluxe-ai-draft-test.sqlite3 .venv/bin/python manage.py test llm content` passed with 52 tests.
- `make test-be` attempted but blocked by Docker API permissions.

Decision Log Update Needed:
- No. This implements the accepted local-first AI strategy in D-0008 without changing provider strategy, data model strategy, or MVP scope.

Next Step:
- Connect Draft Studio to the new draft generation endpoint, then persist draft edits through the existing content draft APIs.

### 2026-07-01 - T-AI-005 Draft Studio AI Generation UI

Worked On:
- Connected Draft Studio to persisted draft generation and save flows.

Completed:
- Created GitHub issue #14 for T-AI-005.
- Added `generateDrafts()` for `POST /api/ai/drafts/generate/`.
- Replaced the Draft Studio simulated AI controls with a live Generate Drafts action.
- Loaded the current authenticated workspace brief and existing drafts in the browser, with mock data fallback when the API is unavailable.
- Used the selected brief target channels as generation channels.
- Rendered generated persisted drafts and refreshed canonical draft records after generation.
- Saved title/content edits through the existing content draft PATCH helper.
- Kept the task frontend-only with no backend, compliance, calendar, publishing, queue, vector DB, or cloud AI changes.

Files Changed:
- `frontend/features/drafts/components/draft-studio-shell.tsx`
- `frontend/features/drafts/data/get-draft-studio-page.ts`
- `frontend/lib/api/ai.ts`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `cd frontend && npm run typecheck` passed.
- `cd frontend && npm run lint` passed.
- `cd frontend && npm run build` passed outside the sandbox after the known Turbopack port-binding sandbox failure.

Decision Log Update Needed:
- No. This implements the accepted local-first AI strategy in D-0008 without changing provider strategy, data model strategy, or MVP scope.

Next Step:
- Connect Compliance Review to persisted compliance checks and issues.

### 2026-07-01 - T-UX-001 Clarify Brief and Draft Workflow

Worked On:
- Polished the Brief -> Draft Studio workflow copy, routing, and selection behavior.

Completed:
- Created GitHub issue #16 for T-UX-001.
- Updated Create Brief success routing to open `/drafts?brief=<createdBriefId>`.
- Added a shared Draft Studio route helper for optional brief scoping.
- Updated the Draft Studio page to read the `brief` query parameter.
- Added an explicit Current Brief section explaining that briefs define intent and drafts are editable channel outputs.
- Added a brief selector for multiple persisted briefs and reloaded the draft list when switching briefs.
- Renamed Draft Studio sections to clarify Current Brief, Generate Channel Drafts, Drafts from this Brief, Active Draft, and Review this Draft.
- Added an empty state for selected briefs with no drafts and a regeneration warning when drafts already exist.
- Preserved persisted generation, edit/save behavior, and mock fallback.

Files Changed:
- `frontend/app/(app)/drafts/page.tsx`
- `frontend/features/create/components/create-brief-shell.tsx`
- `frontend/features/drafts/components/draft-studio-shell.tsx`
- `frontend/lib/routes.ts`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `cd frontend && npm run typecheck` passed.
- `cd frontend && npm run lint` passed.
- `cd frontend && npm run build` passed outside the sandbox after the known Turbopack port-binding sandbox failure.

Decision Log Update Needed:
- No. This clarifies frontend workflow UX without changing data model, AI provider strategy, or MVP scope.

Next Step:
- Connect Compliance Review to persisted compliance checks and issues.

### 2026-07-01 - T-AI-006 Real Local Ollama Draft Generation with Brand Voice

Worked On:
- Made AI draft generation use the linked ContentBrief and BrandProfile context when calling the provider.

Completed:
- Created GitHub issue #20 for T-AI-006.
- Updated draft generation to pass structured brief context into `AIRun.input_data`, including content objective, campaign goal, audience, angle, constraints, target channels, and selected channel.
- Added linked BrandProfile context to generation input and prompt instructions, including audience, tone, preferred vocabulary, banned phrases, and positioning notes.
- Tightened the prompt so providers are asked for valid JSON matching `DraftGenerationResult`.
- Removed the hardcoded Ollama model default; `OLLAMA_MODEL` must be supplied when `AI_PROVIDER=ollama`.
- Kept `MockProvider` as the default provider for tests and local automated verification.
- Preserved the existing `POST /api/ai/drafts/generate/` frontend contract and persisted `ContentDraft` behavior.

Files Changed:
- `backend/config/settings.py`
- `backend/llm/providers.py`
- `backend/llm/services.py`
- `backend/llm/tests.py`
- `backend/llm/views.py`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `DATABASE_URL=sqlite:////tmp/theluxe-ai-006-test.sqlite3 .venv/bin/python manage.py test llm content` passed with 54 tests.
- `make test-be` passed with 98 backend tests.

Decision Log Update Needed:
- No. This implements the accepted local-first AI strategy in D-0008 without changing provider strategy.

Local Ollama Setup:
- Run `ollama list` on the host machine and copy the exact model name.
- Set `AI_PROVIDER=ollama`.
- Set `OLLAMA_MODEL=<model-name>`.
- If the backend runs in Docker and Ollama runs on the host, set `OLLAMA_BASE_URL=http://host.docker.internal:11434`.

Next Step:
- Connect Compliance Review to persisted compliance checks and issues.

### 2026-07-01 - T-AI-006 Improve Brand Voice Extraction Quality

Worked On:
- Improved the backend Brand Voice extraction prompt so selected samples produce a richer reusable Voice DNA profile.

Completed:
- Created GitHub issue #23 for the Brand Voice extraction quality task.
- Updated Brand Voice extraction to pass selected `BrandAsset` title, format, and content into provider context and `AIRun.input_data`.
- Replaced the basic extraction prompt with Voice DNA instructions covering audience clarity, positioning, sentence style, pacing, formality, proof style, claim boundaries, sound-like guidance, avoid guidance, and practical do/don't examples.
- Kept `POST /api/ai/brand/extract/` request and response shape stable.
- Kept output compatible with existing `BrandProfile` fields: audience, tone, preferred vocabulary, banned phrases, and positioning notes.
- Tightened schema handling so provider tone values are constrained to the canonical tone set and simple string vocabulary/phrase arrays can be normalized into the existing frontend-compatible object shape.
- Updated deterministic `MockProvider` Brand Voice output to include one canonical tone and richer Voice DNA positioning notes.
- Did not change draft generation logic, frontend UI, backend models, or migrations.

Files Changed:
- `backend/llm/providers.py`
- `backend/llm/schemas.py`
- `backend/llm/services.py`
- `backend/llm/tests.py`
- `backend/llm/views.py`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `DATABASE_URL=sqlite:////tmp/theluxe-brand-voice-quality.sqlite3 .venv/bin/python manage.py test llm brand` passed with 39 tests.
- `make test-be` passed with 99 backend tests after Docker socket approval.

Decision Log Update Needed:
- No. This improves prompt quality inside the accepted local-first AI strategy without changing provider strategy, data model, or MVP scope.

Local Ollama Setup:
- Run `ollama list` on the host machine and copy the exact model name.
- Set `AI_PROVIDER=ollama`.
- Set `OLLAMA_MODEL=<model-name>`.
- If the backend runs in Docker and Ollama runs on the host, set `OLLAMA_BASE_URL=http://host.docker.internal:11434`.

Next Step:
- Run a manual local Ollama Brand Voice extraction smoke test, then resume draft generation validation using the improved BrandProfile guidance.

### 2026-07-01 - T-AI-007 Brand Voice Analysis Engine MVP

Worked On:
- Added a basic Brand Voice asset analysis layer before extraction.

Completed:
- Extended `BrandAsset` with minimal `media_type`, optional uploaded file, `mime_type`, and `analysis_summary` fields.
- Added `POST /api/ai/brand/analyze-assets/` using the existing workspace/profile/asset validation path.
- Added sequential asset analysis with `AIRun` tracking, persisted summaries, text/transcript prompts, and basic image analysis support.
- Extended `OllamaProvider` to pass base64 image data through `/api/generate` `images` when provided.
- Kept `POST /api/ai/brand/extract/` response shape stable while adding current BrandProfile fields and asset summaries to extraction context.
- Connected Brand Voice setup in API mode so pasted text saves as a BrandAsset, uploaded images save via multipart, asset analysis runs before extraction, and mock mode remains unchanged.

Problems Found:
- No GitHub issue was found for `T-AI-007` in `mario-ah-salamanca/theluxe`.
- `make test-be` could not run in this sandbox because Docker socket escalation was rejected by the environment approval layer.

Files Changed:
- `backend/brand/`
- `backend/config/settings.py`
- `backend/config/urls.py`
- `backend/llm/`
- `frontend/app/(app)/brand-voice/page.tsx`
- `frontend/features/brand-voice/`
- `frontend/lib/api/`
- `frontend/types/brand-profile.ts`
- `docs/02_DECISIONS.md`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `DATABASE_URL=sqlite:////tmp/theluxe-ai-brand-test.sqlite3 .venv/bin/python manage.py makemigrations --check --dry-run` passed.
- `DATABASE_URL=sqlite:////tmp/theluxe-ai-brand-test.sqlite3 .venv/bin/python manage.py test llm brand` passed with 44 tests.
- `cd frontend && npm run typecheck` passed.
- `cd frontend && npm run lint` passed.
- `cd frontend && npm run build` passed.

Decision Log Update Needed:
- Yes. Added D-0009 for minimal BrandAsset media support.

Next Step:
- Run the manual local Ollama smoke test with a multimodal model if image analysis is required, then accept generated Voice DNA suggestions into the BrandProfile.

### 2026-07-02 - T-AI-007 Manual Local Ollama Brand Voice Smoke Test

Worked On:
- Ran GitHub issue #25 manual local Ollama smoke test for Brand Voice analysis/extraction.

Completed:
- Confirmed host Ollama is reachable and has `gemma4:12b` available with vision capability.
- Found and fixed a blocking Ollama provider issue where real local responses could truncate structured JSON or include extra text.
- Kept the endpoint contracts unchanged: `POST /api/ai/brand/analyze-assets/` still returns `aiRunIds`, `assets`, and `warnings`; `POST /api/ai/brand/extract/` still returns `aiRunId` and `suggestions`.
- Verified the existing API flow on a throwaway SQLite database: seeded demo workspace, created one text BrandAsset and one image BrandAsset through the BrandAsset API, ran analysis, ran extraction, and accepted suggestions into the BrandProfile through `PATCH /api/brand-profiles/{id}/`.

Problems Found:
- Docker commands could not run in this WSL distro because `docker` is not installed, so `make dev-check`, `make dev`, and `make ps` were skipped after failure.
- First local Ollama attempt failed because the provider used generic JSON mode without a generation budget; Ollama returned truncated JSON.
- Second attempt showed Ollama could return the JSON schema rather than an instance; provider now uses Ollama structured output with the Pydantic schema.
- A later retry showed extra text after a valid JSON object; provider now parses the first JSON object before Pydantic validation.

Files Changed:
- `backend/config/settings.py`
- `backend/llm/providers.py`
- `backend/llm/tests.py`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `ollama list` passed; model used: `gemma4:12b`.
- `curl -sS http://localhost:11434/api/tags` passed and reported `gemma4:12b`.
- `DATABASE_URL=sqlite:////tmp/theluxe-ollama-smoke-final.sqlite3 AI_PROVIDER=ollama OLLAMA_MODEL=gemma4:12b OLLAMA_BASE_URL=http://localhost:11434 .venv/bin/python manage.py migrate --noinput` passed.
- `DATABASE_URL=sqlite:////tmp/theluxe-ollama-smoke-final.sqlite3 AI_PROVIDER=ollama OLLAMA_MODEL=gemma4:12b OLLAMA_BASE_URL=http://localhost:11434 .venv/bin/python manage.py seed_demo` passed.
- `DATABASE_URL=sqlite:////tmp/theluxe-ollama-smoke-final.sqlite3 AI_PROVIDER=ollama OLLAMA_MODEL=gemma4:12b OLLAMA_BASE_URL=http://localhost:11434 .venv/bin/python /tmp/theluxe_ollama_brand_voice_smoke.py` passed: two `brand_asset_analysis` runs and one `brand_voice_extraction` run succeeded with provider `ollama`, model `gemma4:12b`, no warnings, and accepted profile fields matched suggestions.
- `DATABASE_URL=sqlite:////tmp/theluxe-llm-test.sqlite3 .venv/bin/python manage.py test llm` passed with 26 tests.
- `cd frontend && npm run typecheck` passed.

Decision Log Update Needed:
- No. This keeps the local-first Ollama provider strategy and endpoint contracts stable.

Next Step:
- Validate local Ollama draft generation using the improved BrandProfile guidance from the smoke test.

### 2026-07-02 - Brand Voice Profile Persistence Verified and Parser Fix

Worked On:
- Finished the Brand Voice manual profile persistence slice: audited the existing implementation against the task requirements, fixed one parser bug, and verified the full flow.

Completed:
- Confirmed `BrandProfileForm` is already a client component with controlled state initialized from the passed `BrandProfile`, a `source: "api" | "mock"` prop, validation for name and audience, loading/success/error states, a disabled save button while saving, and canonical-tone filtering.
- Confirmed the save flow calls `updateBrandProfile(profile.id, payload)` with snake_case fields and `router.refresh()` on success, and that mock mode skips the API with a clear local-only message.
- Confirmed `BrandVoiceShell` passes the runtime `source` from `getBrandVoiceSetup()` into the form, the AI suggestions panel, and the sample uploader.
- Fixed a round-trip data-loss bug in the form parsers: `line.split(/\s+-\s+/, 2)` dropped everything after a second ` - `, so a vocabulary note or banned-phrase reason containing ` - ` was silently truncated on save. Both parsers now split on the first separator only via a shared `splitOnFirstDash` helper.

Problems Found:
- The task brief assumed the form was still mock-only; the persistence work was already implemented and committed before this session. Only the parser bug and the documentation trail were outstanding.
- The frontend has no test runner, so the parser fix was verified with a standalone node assertion script instead of a committed test.

Files Changed:
- `frontend/features/brand-voice/components/brand-profile-form.tsx`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `cd frontend && npm run typecheck` passed.
- `cd frontend && npm run lint` passed with no warnings.
- `cd frontend && npm run build` passed.
- `make test-be` passed with 106 backend tests.
- Standalone node assertions confirmed `splitOnFirstDash` preserves multi-dash notes and handles avoid/plain lines.

Decision Log Update Needed:
- No. No architecture, data model, enum, auth, or AI provider change.

Next Step:
- Validate local Ollama draft generation using the improved BrandProfile guidance, then connect Compliance Review to persisted compliance checks and issues.

### 2026-07-02 - Account Page and Display Name Update

Worked On:
- Added a minimal authenticated `/account` page and a display-name update path on the existing session endpoint.

Completed:
- Added `APP_ROUTES.account` and turned the topbar profile icon into a link to `/account` with the label "Open account page"; the notification control stays a button and the sidebar is unchanged.
- Added `frontend/app/(app)/account/page.tsx` as a thin route rendering `AccountShell` from `frontend/features/account/components/`.
- The account shell loads the session through the existing `getSession()` and shows four `SurfaceCard` cards: signed-in user (editable display name, read-only email/username, user ID), active workspace (name, ID, role, workspace count), MVP runtime context (API base, Brand Voice mode from `NEXT_PUBLIC_USE_MOCK_BRAND_VOICE`, Django session auth, session bootstrap), and quick actions (Dashboard, Onboarding, Brand Voice, Create Brief) plus logout that routes to `/login`.
- Added `updateCurrentUser(payload)` with `UpdateCurrentUserPayload` in `frontend/lib/api/auth.ts` calling `PATCH /api/auth/me/`.
- Extended `/api/auth/me/` to accept `PATCH` with a new `AuthProfileUpdateSerializer` (`display_name`, required, max 150, trimmed, blank rejected); the view splits the display name into `first_name`/`last_name` exactly like signup, saves only those fields, and returns `serialize_session`. No new model, no migration; email, username, password, workspace, and role stay read-only.
- Added four backend tests: unauthenticated PATCH rejected, authenticated PATCH updates and returns `displayName`, blank display name rejected, and email/username ignored by the endpoint.

Problems Found:
- None blocking. The demo account display name was temporarily changed during the live API smoke and restored to "THE LUXE Demo" afterwards.

Files Changed:
- `backend/tenancy/serializers.py`
- `backend/tenancy/views.py`
- `backend/tenancy/tests.py`
- `frontend/lib/routes.ts`
- `frontend/lib/api/auth.ts`
- `frontend/components/layout/app-topbar.tsx`
- `frontend/app/(app)/account/page.tsx`
- `frontend/features/account/components/account-shell.tsx`
- `docs/03_PROGRESS_LOG.md`
- `docs/05_AI_WORK_LOG.md`

Verification:
- `DATABASE_URL=sqlite:////tmp/theluxe-account-test.sqlite3 .venv/bin/python manage.py test tenancy` passed with 7 tests.
- `make test-be` passed with 110 backend tests.
- `cd frontend && npm run typecheck` passed.
- `cd frontend && npm run lint` passed.
- `cd frontend && npm run build` passed and lists `/account`.
- Live smoke against the running Docker stack: demo login, `GET /api/auth/me/`, `PATCH` display name, fresh `GET` confirming persistence, blank payload rejected with 400, unauthenticated PATCH rejected with 403, logout 204, `/account` served with 200, and the topbar link renders `href="/account"`.

Decision Log Update Needed:
- No. This extends an existing session endpoint without new models, migrations, or auth-strategy changes.

Next Step:
- Validate local Ollama draft generation using the improved BrandProfile guidance, then connect Compliance Review to persisted compliance checks and issues.

### 2026-07-06 - Brand Voice Hardening Slice Accepted (Management Finalization)

Worked On:
- Finalized QA acceptance of the Brand Voice hardening slice in project memory (GitHub issue #31).

Completed:
- Recorded the accepted Brand Voice behavior:
	- `/brand-voice` exposes Live/Demo/Error data-source state to the user.
	- Demo mode does not fake asset writes or AI analysis; `handleAccept()` returns unless `source === "api"`, removing the unreachable mock success path.
	- Saved live assets update the UI immediately.
	- Brand voice analysis remains backend-only.
	- `BrandVoiceAiPanel` reconciles selected asset IDs from the current samples list only: stale IDs are dropped after live hydration, surviving selections are preserved, and newly seen samples are auto-selected.
	- Regression tests cover the mock-to-live hydration path at both component and shell level.
- The slice landed with the new frontend test infrastructure (Vitest unit tests, API client contract tests, Playwright route smoke, and CI via `.github/workflows/ci.yml` and `make check`).

Files Changed (implementation, commit 279b4ee):
- `frontend/features/brand-voice/components/brand-voice-ai-panel.tsx`
- `frontend/features/brand-voice/components/brand-voice-ai-panel.test.tsx`
- `frontend/features/brand-voice/components/brand-voice-shell.tsx`
- `frontend/features/brand-voice/components/brand-voice-shell.test.tsx`
- `frontend/features/brand-voice/components/brand-voice-shell.hydration.test.tsx`
- `frontend/features/brand-voice/components/sample-content-uploader.tsx`
- `frontend/features/brand-voice/components/sample-content-uploader.test.tsx`
- `frontend/features/brand-voice/data/get-brand-voice-setup.ts`
- `frontend/data/mock-brand-profiles.ts`
- `backend/llm/tests.py`

QA Status:
- Accepted with notes (see Known Gaps in `docs/06_FEATURE_SLICE_GUIDE.md`, QA notes 2026-07-02).

Verification:
- Implementation was verified before acceptance through the new `make check` pipeline (frontend lint + typecheck + unit tests, backend tests).
- This finalization is docs-only; `git diff --check` passed.

Decision Log Update Needed:
- No. The hardening reused existing endpoint and data contracts; no architecture, data model, auth, AI provider, or scope decision changed.

Next Step:
- Start the Draft Studio Core Value Loop (epic #34): persist Draft Studio output through the existing backend path (#35), then validate draft generation from the accepted Voice DNA BrandProfile (#26).

### 2026-07-06 - Brand Voice Nested Navigation Refactor

Worked On:
- Split `/brand-voice` into a nested route workspace: `/brand-voice` (overview cards), `/brand-voice/profile`, `/brand-voice/analysis`, `/brand-voice/samples`. Frontend-only; no backend changes.

Completed:
- `APP_ROUTES` gained `brandVoiceProfile`, `brandVoiceAnalysis`, `brandVoiceSamples`; `brandVoiceSampleRoute(id)` now builds from `brandVoiceSamples`.
- Navigation items support optional `children`; Brand Voice renders Profile/Analysis/Samples child links in `AppSidebar`. Parent stays visually active for `/brand-voice/**`; `aria-current="page"` only on the exact current link.
- The monolithic `BrandVoiceShell` became one shared data-loading shell with four thin view exports (`BrandVoiceOverviewShell`, `BrandVoiceProfileShell`, `BrandVoiceAnalysisShell`, `BrandVoiceSamplesShell`). Live/mock hydration, profile save propagation, and asset save propagation are unchanged and shared across views.
- Sample detail back-link returns to `/brand-voice/samples`.
- Tests: new `app-sidebar.test.tsx` (nested rendering, active parent/child, aria-current); shell tests retargeted per view (overview source states and card links, profile save propagation, samples paste save, analysis live hydration and live-only asset IDs).

Verification:
- `npm run test` (73 tests), `npm run typecheck`, `npm run lint`, and `make check` (frontend suite + 111 backend tests) all passed.

Decision Log Update Needed:
- No. Routing/component decomposition only; no architecture, data model, AI provider, or scope decision changed.

Next Step:
- Unchanged: Draft Studio Core Value Loop (epic #34), starting with #35.

### 2026-07-07 - Structured Voice DNA Architecture

Worked On:
- Replaced the flat brand model with the research-based Voice DNA architecture across six slices (one commit each), adapted from `docs/reference/brand-engine/`.

Completed:
- Slice 1: BrandProfile gained structured positioning, archetypes, Aaker personality sliders, and distinctive assets; new AudienceSegment, versioned BrandVoice (NN/g tone sliders, single-active constraint), VoiceExample, ChannelStyle, and VoiceAuditScore models; BrandAsset evidence fields (`source_url`, `channel`, `language`, `performance_signal`, `content_date`, `crawled`, `excluded`). Data migration seeds BrandVoice v1 + a primary AudienceSegment from the deprecated flat fields without data loss.
- Slice 2: `llm/schemas.py` replaced with structured extraction/review shapes; all prompts moved to `llm/prompts.py`; prompts are tenant-neutral (no platform name; brand name comes from context); mock provider fixtures updated.
- Slice 3: `llm/services.py` refactored — `_run_ai_task` always returns `(result, run)`, extraction creates voice version N+1 with examples and provenance, voice review persists VoiceAuditScore, draft generation applies effective tone (voice sliders + clamped ChannelStyle deltas) and channel-matched examples.
- Slice 4: workspace-scoped DRF endpoints `/api/brand-voices/` (+activate), `/api/audience-segments/`, `/api/channel-styles/`, `/api/voice-examples/`, `/api/voice-audit-scores/`; extended BrandProfile/BrandAsset serializers (camelCase reads).
- Slice 5: frontend types, API clients, and mocks mirror the new shapes; the Brand Voice AI panel displays the new suggestion shape and activates the extracted voice version; onboarding stopped writing extraction results back onto the profile.
- Slice 6: D-0010 in `docs/02_DECISIONS.md`, module/data-flow updates in `docs/01_ARCHITECTURE.md`, Known Gaps in `docs/mvp-progress-report.md`.

Verification:
- Backend: 147 tests OK locally (same suite as `make test-be`); fresh-DB migrate clean; old-shape seeded DB migrates with correct voice/segment rows; `grep -rn "THE LUXE" backend/llm/` returns nothing.
- Frontend: `npm run typecheck`, `npm run lint`, `npm run test` (68 tests), `npm run build` all passed. `make dev-check` passed.

Decision Log Update Needed:
- Yes — recorded as D-0010 (Structured Voice DNA architecture).

Next Step:
- Unchanged: Draft Studio Core Value Loop (epic #34); voice-version/segment/channel-style UI is deliberately deferred (see Known Gaps).

### 2026-07-08 - Brand Voice Studio UI

Worked On:
- Redesigned `/brand-voice/profile` into the Voice DNA studio: the frontend surface for the D-0010 architecture, replacing the flat editable form.

Completed:
- Left panel: version selector (native select) with detail card (summary, confidence, extracted-from asset titles, expandable extraction notes), Activate action, and a stubbed Compare button; six tabs — Extraction (reuses `BrandVoiceAiPanel`), Tone, Positioning, Segments, Channels, Examples.
- Right panel: active-voice summary — version badge, ready-to-draft status, confidence/provenance stats, compact tone meters, tone tags, positioning and primary-segment snapshots, do/don't counts, vocabulary/banned previews, Create-content CTA.
- New components: `tone-meter.tsx` (read-only `role="meter"` bar with channel-delta display, e.g. "20 + 10 → 30"), `voice-dna-sections.tsx`, `voice-dna-studio.tsx`, `voice-summary-panel.tsx`. Expandables use native `<details>`.
- API client: `getAudienceSegments`, `getChannelStyles`, `getVoiceExamples` added to `frontend/lib/api/brand-voice.ts`; `mockVoiceExamples` added; `AUDIENCE_MATURITY_LABELS` added to formatters.
- `BrandVoiceAiPanel` gained an optional `onVoiceChanged` callback so the studio refreshes its version list after extraction/activation; the analysis route is unchanged.
- Demo mode activates versions locally and logs the would-be API call; live mode POSTs `/api/brand-voices/{id}/activate/` and refetches profile + versions.
- Deleted `brand-profile-form.tsx` and its test (this screen no longer writes the deprecated flat fields); replaced the profile-shell test with version-listing and demo-activation tests.

Problems Found:
- `frontend/styles/theme.css` is pinned 1:1 to `docs/reference/Design.md` and external tooling reverts additions; the tone meter uses canonical `luxe-*` Tailwind utilities instead of new theme classes. A red→blue tone accent needs Design.md tokens first.
- `.next/dev` is root-owned from a Docker run, so local `next dev` fails with a lockfile permission error; visual verification used `next start` on the production build (`sudo chown -R mario:mario frontend/.next` would fix dev).

Verification:
- `npm run typecheck`, `npm run lint`, `npm run test` (66 tests), and `npm run build` all passed.
- Playwright drove the served build through all six tabs and a demo activation (v1 became active; the summary panel re-rendered) with no unexpected console errors.

Decision Log Update Needed:
- Yes — recorded as D-0011 (Brand Voice Profile screen is read-only over extracted voice data).

Next Step:
- Unchanged: Draft Studio Core Value Loop (epic #34). Deferred from this slice: version compare/diff UI, segment/channel-style editing screens, per-version example browsing.

### Existing MVP Implementation Snapshot

- Backend models exist for Workspace, Membership, BrandProfile, BrandAsset, ContentBrief, ContentDraft, ScheduledContent, Approval, ComplianceCheck, ComplianceIssue, and AuditLog.
- Backend serializers, API routes, admin registrations, migrations, and tests exist for most MVP domains.
- Frontend routes exist for dashboard, brand voice, create brief, draft studio, compliance review, and calendar.
- Frontend shared types and mock data cover the intended MVP flow.
- API clients exist for brand voice, content briefs, content drafts, scheduled content, and compliance.
- Auth clients and backend session endpoints now exist for signup, login, logout, workspace bootstrap, and current-user session reads.

### Existing Prototype Audit Snapshot

- Six visual prototypes exist under `temp/`: dashboard, brand voice, brief creation, draft studio, compliance review, and calendar.
- The production frontend has already translated much of the prototype language into shared routes, components, feature folders, and theme tokens.
- `temp/` remains design reference material only.

## Verification History

- `make test-be` previously passed with 76 backend tests according to `docs/mvp-progress-report.md`.
- `npm run typecheck`, `npm run lint`, and `npm run build` previously passed according to `docs/mvp-progress-report.md`, with a noted lint warning about an unused `AuditLog` import.
- 2026-06-05 Create Brief API integration verification passed: `cd frontend && npm run typecheck`, `cd frontend && npm run lint`, and `cd frontend && npm run build`. Lint retained the pre-existing calendar `AuditLog` warning, and build retained the pre-existing root health dynamic-fetch log.
- 2026-06-29 homepage/auth verification passed: targeted tenancy auth tests with temporary SQLite, frontend typecheck, frontend lint with the pre-existing calendar warning, and frontend production build outside the sandbox.
- No app verification commands were run as part of the memory scaffolding or consistency audit. Verification was limited to repository inspection, `docs/mvp-progress-report.md` review, and git diff/status review.

## Open Progress Questions

- Should comments and voice scores stay UI-only or become canonical MVP entities?
- Should dashboard data be backed by a dedicated aggregate endpoint or composed from existing APIs?
