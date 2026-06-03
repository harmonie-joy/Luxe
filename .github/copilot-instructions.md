# THE LUXE Copilot Instructions

## Project Overview

THE LUXE is an AI-powered brand voice, workflow, and compliance cockpit for planning, drafting, reviewing, approving, and scheduling branded content.

The intended MVP flow is:

Dashboard -> Brand Voice Setup -> Create Brief -> Draft Studio -> Compliance Review -> Calendar / Approval

This repository is a monorepo with:

- `backend/`: Django application code, data model evolution, admin, and API surfaces.
- `frontend/`: Next.js application code for the product UI, route flow, typed domain objects, and mock-driven MVP screens.

Current repo state matters:

- Django REST Framework is installed in the backend, but the API surface is still minimal.
- The frontend already contains shared types, route helpers, and mock data that should be treated as early contract signals.
- Several backend apps are scaffolded but not fully modeled yet, so future changes should extend the canonical model below rather than invent parallel structures.
- Workspace is the current tenant root for MVP (do not introduce a parallel Organization model unless explicitly requested).

## Repository Structure

Use the repository layout as the default source of truth.

### Backend

`backend/` contains the Django project and app modules.

Expected placement:

- models: `backend/<app>/models.py`
- migrations: `backend/<app>/migrations/`
- admin registrations: `backend/<app>/admin.py`
- views: `backend/<app>/views.py`
- tests: `backend/<app>/tests.py`
- app wiring: `backend/config/settings.py`, `backend/config/urls.py`

When the project grows, serializers and app-level URL modules should stay inside the owning Django app.

Current backend apps include:

- `tenancy/` for workspace and membership concepts
- `audit/` for audit history
- `brand/` for brand profile and brand input entities
- `content/` for briefs, drafts, channel outputs, and scheduling
- `compliance/` for checks and issues
- `llm/` for AI orchestration boundaries only when explicitly requested

### Frontend

`frontend/` contains the Next.js app router code and shared UI/domain modules.

Expected placement:

- app routes: `frontend/app/`
- feature-specific UI and logic: `frontend/features/`
- shared layout and UI building blocks: `frontend/components/`
- shared domain types: `frontend/types/`
- mock data shaped like future API responses: `frontend/data/`
- route constants and navigation helpers: `frontend/lib/routes.ts`
- app-wide styling: `frontend/app/globals.css`, `frontend/styles/`

Do not create duplicate domain types inside feature folders when a shared type belongs in `frontend/types/`.

## Development Principles

- Inspect relevant files before editing.
- Prefer small, safe patches over broad rewrites.
- Do not rewrite large parts of the backend or frontend unless explicitly asked.
- Keep backend models, API serializers, frontend shared types, and mock data aligned.
- Preserve existing naming conventions unless there is a clear reason to change them.
- Explain migrations before creating them.
- Do not add real AI integrations, publishing integrations, or authentication unless explicitly requested.
- Do not import from `temp/`, prototype exports, or other experimental folders unless explicitly instructed.
- Treat `temp/` as design reference material only, not as production code.
- If the frontend and backend disagree on a product concept, prefer clarifying the canonical domain model first and then patch the smallest number of files needed.

## Local Development Workflow

Use the repository Make targets as the default local workflow for Docker-based development:

- `make dev-check` validates compose configuration before startup.
- `make dev` builds and starts the stack in detached mode with health-aware startup ordering.
- `make ps` shows current service/container status.
- `make logs` tails logs for troubleshooting.
- `make dev-down` stops and removes containers.
- `make dev-restart` restarts the full stack.

When working on Python code outside Docker, use the backend virtual environment at `backend/.venv`.

## Canonical MVP Domain Model

Use the following entities as the canonical MVP vocabulary for future work.

### User

Represents an authenticated person operating the product. MVP-required.

### Workspace

Tenant boundary for brand, drafting, compliance, calendar, and audit data. MVP-required.

### BrandProfile

Stores brand voice configuration such as audience, tone, vocabulary, and positioning guidance for content generation and review. MVP-required.

### BrandAsset or SampleContent

Stores uploaded source material, reference content, or curated examples used to shape brand voice and validate content style. MVP-required in at least one form.

### ContentBrief

Structured content request describing objective, channel, audience, angle, constraints, and campaign intent. MVP-required.

### ContentDraft

Generated or manually edited draft content tied to a brief and a channel. MVP-required.

### ChannelOutput

Optional separate entity for channel-specific renderings or transformations when a single draft produces distinct outputs per channel. Later or optional unless the implementation needs it.

### ComplianceCheck

Represents a compliance evaluation run for a draft, including status, timing, and summary outcome. MVP-required.

### ComplianceIssue

Represents a specific issue found during a compliance check, such as claims, consent, IP, or GDPR concerns. MVP-required.

### Approval

Represents a review or sign-off action on a draft by a user or role. MVP-required for approval workflow.

### CalendarItem or ScheduledContent

Represents an approved draft scheduled for publication or internal planning. MVP-required.

### AuditLog

Tracks important user and system actions for traceability across workspace activity. MVP-required.

### Template

Reusable brief, prompt, or workflow template. Later or optional.

## Expected Entity Relationships

Treat these relationships as the default source of truth unless a task explicitly redefines them.

- User belongs to or owns one or more Workspaces.
- Workspace has many BrandProfiles.
- BrandProfile can have many BrandAssets or SampleContents.
- Workspace has many ContentBriefs.
- ContentBrief uses one BrandProfile.
- ContentBrief generates many ContentDrafts.
- ContentDraft belongs to one channel.
- ContentDraft has one or more ComplianceChecks.
- ComplianceCheck has many ComplianceIssues.
- ContentDraft can have Approval records.
- Approved ContentDraft can become a CalendarItem or ScheduledContent.
- Important user actions should create AuditLog records.

## Canonical Enums and Status Values

These values are canonical across Django models, serializers, TypeScript types, mock data, and UI logic.

### ComplianceStatus

- `green`
- `yellow`
- `red`

### DraftStatus

- `draft`
- `in_review`
- `needs_changes`
- `approved`
- `scheduled`
- `published`

### Channel

- `linkedin`
- `instagram`
- `blog`
- `newsletter`
- `x`
- `short_video`

### CampaignGoal

- `educate`
- `announce`
- `promote`
- `fundraise`
- `thought_leadership`

### ComplianceCategory

- `gdpr`
- `consent`
- `ip`
- `claims`

### ComplianceSeverity

- `low`
- `medium`
- `high`

### WorkspaceRole

- `owner`
- `admin`
- `editor`
- `reviewer`
- `viewer`

Rule: any new enum value must be added consistently in backend models, serializers, frontend shared types, mock data, and UI logic in the same task.

## Backend Django Guidelines

- Use clear model names that match the canonical domain model.
- Prefer UUID primary keys for new user-owned MVP entities unless the project explicitly standardizes on integer IDs for that area.
- Add `created_at` and `updated_at` where lifecycle tracking matters.
- Use `models.TextChoices` for enums.
- Use `TextField` for long generated content, briefs, instructions, rationale, and compliance explanations.
- Use sensible `related_name` values.
- Add `__str__` methods for admin readability.
- Add `Meta.ordering` where useful for default recency or workflow ordering.
- Add indexes for common workspace, status, owner, and timestamp queries.
- Use uniqueness constraints where the business rules require them.
- Be deliberate with `null=True` and `blank=True`; do not make fields optional unless the workflow truly allows it.
- Choose `on_delete` behavior deliberately based on tenant safety and audit retention.
- Keep migrations consistent with model changes.
- Never expose sensitive user or workspace data unnecessarily through serializers.
- If an entity is workspace-owned, model that ownership directly or through a clear parent relationship.
- The current backend defaults to `BigAutoField`; if introducing UUIDs for new entities, keep the API and frontend type conventions consistent.

## Frontend Next.js Guidelines

- Keep shared domain types in `frontend/types/`.
- Avoid duplicating domain interfaces inside feature folders.
- Keep mock data in `frontend/data/mock-*.ts` aligned with backend-like API shapes.
- Components should consume typed props.
- Status values must match the canonical enums.
- Routes should match the MVP flow: dashboard, brand voice, brief creation, drafting, compliance review, and calendar or approval.
- Frontend-only fields should be clearly marked or avoided.
- Forms should collect all backend-required fields.
- Mock data should look like realistic API responses, including IDs and ISO 8601 timestamps.
- Prefer using `frontend/lib/routes.ts` for shared route constants instead of hardcoding route strings repeatedly.
- When a frontend screen models backend data, shape the UI state so it can later swap from mock data to API data without major refactoring.

## API Contract Guidelines

Django REST Framework is installed, so future API work should keep serializers aligned with frontend shared types.

Rules:

- API responses should use stable field names.
- Date and datetime values should be ISO 8601 strings.
- Do not expose sensitive fields.
- Use intentional nested or flat response shapes.
- Make it possible to replace frontend mock data with real API responses without major refactoring.

If a requested task needs new endpoints and serializers do not yet exist, propose the minimal contract first and implement only what the task requires.

Recommended endpoint style:

- `/api/workspaces/`
- `/api/brand-profiles/`
- `/api/brand-assets/` or `/api/sample-content/`
- `/api/content-briefs/`
- `/api/content-drafts/`
- `/api/compliance-checks/`
- `/api/compliance-issues/`
- `/api/approvals/`
- `/api/calendar-items/` or `/api/scheduled-content/`
- `/api/audit-logs/`

If DRF is not used for a specific task, Copilot may propose a minimal API contract but should not implement it unless explicitly asked.

## Workspace Scoping and Multi-Tenant Safety

- Every user-owned entity should have a direct or indirect relationship to Workspace.
- Queries should be scoped to the current user's workspace.
- Avoid cross-workspace data leaks.
- Use `created_by`, `owner`, or equivalent fields where user attribution matters.
- Audit important user actions.
- Deletion behavior should protect important historical and audit data.
- Do not fetch or mutate records by bare ID alone when workspace scoping is required.
- Treat workspace boundaries as a product invariant, not as optional filtering.

## ID and Timestamp Conventions

- Use consistent ID types between backend and frontend.
- Prefer UUID strings in frontend types if the backend uses UUIDs.
- Use `created_at` and `updated_at` consistently in backend models and API payloads.
- Use lifecycle timestamps where relevant:
	- `scheduled_for`
	- `checked_at`
	- `approved_at`
	- `published_at`
- Frontend mock data should use ISO 8601 date strings.
- Frontend camelCase fields are acceptable only when there is an intentional mapping layer; otherwise keep API and type field names aligned.

## Data Model Alignment Checklist

Before adding or changing product features, check:

- Backend model exists.
- Serializer or API shape exists or is intentionally planned.
- Frontend shared type exists.
- Mock data matches the type.
- Required and optional fields match.
- Enum values match.
- Relationships match.
- Workspace scoping is preserved.
- Timestamps are represented consistently.
- Admin registration and tests are considered where relevant.

## Safe Patch Workflow

When asked to modify code, follow this order:

1. Inspect relevant backend and frontend files.
2. Summarize the current alignment or mismatch.
3. Propose a small patch plan.
4. Update shared types and enums first when needed.
5. Update backend models or serializers only when necessary.
6. Explain whether migrations are required.
7. Update frontend mock data and consuming components.
8. Add or update tests where practical.
9. Avoid unrelated refactors.

## Things Not To Do

Copilot must not:

- Rewrite the whole backend.
- Rewrite the whole frontend.
- Add authentication unless required by the requested task.
- Add real AI provider integrations unless explicitly requested.
- Add publishing integrations unless explicitly requested.
- Create migrations without explaining why.
- Rename major entities without a clear reason.
- Invent frontend fields that cannot exist in the backend.
- Ignore workspace scoping.
- Use random UI-only mock data that does not resemble future API responses.
- Import production code from `temp/` or other prototype-only folders.

## Acceptance Criteria for Future Changes

A change is acceptable only when:

- The canonical model remains clear.
- Backend and frontend types remain aligned.
- Mock data can realistically be replaced by API data.
- Workspace ownership and privacy are preserved.
- Required fields, enums, IDs, and timestamps are consistent.
- Any migration risk is explained.
- The patch is small, focused, and relevant to the requested task.
