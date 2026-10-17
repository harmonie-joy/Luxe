# THE LUXE Architecture

> The description below records the July implementation baseline, not the approved product scope. The 2026-08-10 founder-confirmed MVP plan governs delivery; the August 12 Technical Decision Record Revision 1.1 remains a technical reference where compatible. IA-1 backend additions (Project, ContentItem, ExecutionCheckpoint, BrandVoiceApproval) merged in PR #56 on 2026-10-17. See [Next Actions](04_NEXT_ACTIONS.md) for current status.

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
- `brand`: The structured Voice DNA brand engine — BrandProfile (structured positioning, archetypes, Aaker personality sliders, distinctive assets), AudienceSegment, versioned BrandVoice (NN/g tone sliders 0-100, behavioral voice rules, single active version per profile), VoiceExample (annotated do/don't few-shot rows), ChannelStyle (per-channel tone deltas and norms), BrandAsset (extraction evidence with source, channel, language, performance signal, and content date), and VoiceAuditScore (persisted voice-review results).
- `content`: Content briefs, content drafts, scheduled content, and approvals.
- `compliance`: Compliance checks and compliance issues.
- `audit`: Audit logs.
- `llm`: Local-first AI orchestration boundary — pydantic schemas in `schemas.py`, all prompt builders in `prompts.py` (tenant-neutral: prompts reference the workspace's brand name from context, never a hardcoded name), services in `services.py`, mock/Ollama providers, and AIRun tracking. Voice extraction creates new BrandVoice versions; voice review persists VoiceAuditScore rows; draft generation applies effective tone (voice sliders + channel deltas) and channel-matched examples.

### Frontend

- `frontend/app`: App Router pages for dashboard, brand voice, create brief, drafts, compliance, and calendar.
- `frontend/features`: Feature-specific UI and data-loading modules. `features/brand-voice` includes the Voice DNA studio (`voice-dna-studio.tsx`): a read-only, two-panel screen — left drives the workflow (version selection/activation, extraction, tabbed tone/positioning/segments/channel-style/example displays), right summarizes the active voice. Voice data is never hand-edited in the UI (D-0011).
- `frontend/components`: Shared layout and UI building blocks.
- `frontend/types`: Shared domain types and canonical frontend enum unions.
- `frontend/data`: Mock data shaped like future API responses.
- `frontend/lib/api`: API client helpers and endpoint-specific clients.
- `frontend/lib/routes.ts`: Route constants and navigation helpers.

## Data Flow

This is a compact summary of the current implemented MVP shape from `docs/mvp-progress-report.md`. For broader conceptual diagrams and data-model review notes, reference `docs/the_luxe_data_model_source_of_truth.md`; do not duplicate its diagrams here. If the older conceptual source-of-truth language differs from the current MVP implementation, preserve Workspace as the current tenant root per `AGENTS.md` and use `docs/mvp-progress-report.md` for current-state accuracy.

1. A user operates inside one Workspace.
2. The Workspace owns BrandProfiles and ContentBriefs.
3. A BrandProfile owns AudienceSegments, ChannelStyles, BrandAssets (extraction evidence), and versioned BrandVoices; exactly one voice can be active. Voice extraction reads the assets and creates a new BrandVoice version plus VoiceExample rows — it never overwrites the profile.
4. A ContentBrief references one BrandProfile and target channels.
5. ContentDraft records are created per brief and channel. Draft generation applies the active BrandVoice, the effective tone (voice sliders + ChannelStyle deltas), and channel-matched VoiceExamples.
6. BrandVoice and VoiceAuditScore sit between BrandProfile and ContentDraft review: voice reviews score a draft against the active voice version and persist a VoiceAuditScore (dimension scores + violations, linked to the llm.AIRun).
7. ComplianceCheck records evaluate drafts and own ComplianceIssue records.
8. Approval records capture draft sign-off.
9. Approved drafts can become ScheduledContent.
10. Important actions should be represented in AuditLog records.

## API Shape

- Backend responses intentionally expose camelCase fields through serializers where frontend types expect them.
- Write payloads may remain DRF-style snake_case when isolated in frontend API clients.
- Date and datetime values should be ISO 8601 strings.
- Workspace scoping must be preserved on all user-owned reads and writes.

## Current Alignment

- Backend models exist for Workspace, Membership, BrandProfile, AudienceSegment, BrandVoice, VoiceExample, ChannelStyle, BrandAsset, VoiceAuditScore, ContentBrief, ContentDraft, ScheduledContent, Approval, ComplianceCheck, ComplianceIssue, AuditLog, and AIRun.
- Backend DRF serializers and routes exist for brand profiles/assets, brand voices (with activate action), audience segments, channel styles, voice examples, voice audit scores, content briefs/drafts, scheduled content, approvals, compliance checks/issues, audit logs, and health.
- Frontend shared types exist for workspace roles, brand profile/assets, brand voices/segments/channel styles/voice examples/audit scores, content briefs/drafts/scheduled content/approval/audit, and compliance checks/issues.
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
