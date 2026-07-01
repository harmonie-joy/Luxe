# THE LUXE Architecture

## Tech Stack

- Monorepo with `backend/`, `frontend/`, `infra/`, `docs/`, and `prompts/`.
- Backend: Django, Django REST Framework, PostgreSQL in local Docker, local-first AI orchestration with mock and optional Ollama providers.
- Frontend: Next.js App Router, TypeScript, Tailwind v4 token bridge, CSS custom properties in `frontend/styles/theme.css`.
- Local workflow: Make targets and Docker Compose under `infra/docker-compose.yml`.
- Project memory: Markdown-first docs in `docs/`, root `AGENTS.md`, tool-specific instruction files, and reusable prompts.

## Repository Layout

- `backend/`: Django project, app modules, models, serializers, routes, migrations, admin, and tests.
- `frontend/`: Next.js app routes, feature components, shared UI, shared domain types, mock data, API clients, and route helpers.
- `infra/`: local Docker Compose runtime services.
- `docs/`: canonical project memory, progress, diagrams, audits, and technical source-of-truth documents.
- `prompts/`: reusable AI prompts and task workflows.
- `temp/`: design reference material only; do not import from it in production code.

## Main Modules

### Backend

- `tenancy`: Workspace and membership concepts.
- `brand`: Brand profiles and brand assets.
- `content`: Content briefs, content drafts, scheduled content, and approvals.
- `compliance`: Compliance checks and compliance issues.
- `audit`: Audit logs.
- `llm`: Local-first AI orchestration boundary, structured schemas, providers, and AI run tracking.

### Frontend

- `frontend/app`: App Router pages for dashboard, brand voice, create brief, drafts, compliance, and calendar.
- `frontend/features`: Feature-specific UI and data-loading modules.
- `frontend/components`: Shared layout and UI building blocks.
- `frontend/types`: Shared domain types and canonical frontend enum unions.
- `frontend/data`: Mock data shaped like future API responses.
- `frontend/lib/api`: API client helpers and endpoint-specific clients.
- `frontend/lib/routes.ts`: Route constants and navigation helpers.

## Data Flow

This is a compact summary of the current implemented MVP shape from `docs/mvp-progress-report.md`. For broader conceptual diagrams and data-model review notes, reference `docs/the_luxe_data_model_source_of_truth.md`; do not duplicate its diagrams here. If the older conceptual source-of-truth language differs from the current MVP implementation, preserve Workspace as the current tenant root per `AGENTS.md` and use `docs/mvp-progress-report.md` for current-state accuracy.

1. A user operates inside one Workspace.
2. The Workspace owns BrandProfiles and ContentBriefs.
3. A ContentBrief references one BrandProfile and target channels.
4. ContentDraft records are created per brief and channel.
5. ComplianceCheck records evaluate drafts and own ComplianceIssue records.
6. Approval records capture draft sign-off.
7. Approved drafts can become ScheduledContent.
8. Important actions should be represented in AuditLog records.

## API Shape

- Backend responses intentionally expose camelCase fields through serializers where frontend types expect them.
- Write payloads may remain DRF-style snake_case when isolated in frontend API clients.
- Date and datetime values should be ISO 8601 strings.
- Workspace scoping must be preserved on all user-owned reads and writes.

## Current Alignment

- Backend models exist for Workspace, Membership, BrandProfile, BrandAsset, ContentBrief, ContentDraft, ScheduledContent, Approval, ComplianceCheck, ComplianceIssue, and AuditLog.
- Backend DRF serializers and routes exist for brand profiles/assets, content briefs/drafts, scheduled content, approvals, compliance checks/issues, audit logs, and health.
- Frontend shared types exist for workspace roles, brand profile/assets, content briefs/drafts/scheduled content/approval/audit, and compliance checks/issues.
- Mock data exists for every MVP screen and generally resembles future API responses.
- The main gap is runtime integration: most product screens still consume mocks and do not persist create/edit/review actions.

## Important Design Rules

- Prefer small, reversible feature slices.
- Keep backend models, serializers, frontend types, mock data, and UI logic aligned.
- Do not add cloud AI, publishing, or authentication integrations unless explicitly requested.
- Do not duplicate domain types inside feature folders.
- Do not create migrations without explaining why.
- Do not introduce new architecture without updating `docs/02_DECISIONS.md`.
- Use theme tokens and `luxe-*` semantic classes on the frontend; avoid hardcoded colors in components.
- Treat `temp/` as design reference only.

## Known Gaps

- No full workspace switcher or membership management UI yet.
- No dashboard aggregate API.
- Create Brief, Draft Studio, Compliance Review, Calendar, approvals, and audit surfaces are not fully API-connected in the UI.
- No frontend tests yet.
- No automatic audit logging from domain actions yet.

## Verification Commands

- `make dev-check`
- `make dev`
- `make logs`
- `make ps`
- `make dev-down`
- `make test-be`
- `make migrate`
- `cd frontend && npm run typecheck`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
