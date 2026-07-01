# Progress Log

## Current Snapshot

THE LUXE has a strong MVP contract across backend and frontend. The root homepage now presents a prototype landing experience, and signup/login can create a Django session, bootstrap a workspace, and enter the dashboard. The Create Brief screen is API-connected; Draft Studio and Compliance Review still need broader runtime integration.

## Progress Entries

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
- `docker exec infra-frontend-1 npm run typecheck` passed.
- `docker exec infra-frontend-1 npm run lint` passed.
- `docker exec infra-frontend-1 npm run build` passed.

Decision Log Update Needed:
- Yes. D-0003 wording was updated to reflect that no AI runtime app exists.

Next Step:
- Continue with Docker-verified homepage/auth runtime validation and Draft Studio persistence.

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
