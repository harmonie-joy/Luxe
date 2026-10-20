# THE LUXE — Shared Agent Policy (Codex + Copilot)

> This `AGENTS.md` is the **same repository-wide entry point** for local Codex, Copilot in VS Code, and GitHub Copilot Cloud. Product details below are historical vocabulary and engineering rules, **not authorization to prioritize the old Dashboard/Brief/Calendar flow**. The current approved requirements, decisions and scoped issue govern implementation.

## Current Product Baseline — October 2026

THE LUXE is a context-preserving Creator/CEO operating system. Prioritize the **Creator Home → explicitly accepted BrandVoice version → persisted Project/ContentItem → saved decisions/checkpoint/resume → next action** workflow, then the approved **Sandra LinkedIn-first caption/version/approval/export** loop. Historic Brand Voice/Brief/Draft/Compliance/Calendar modules remain reusable, but old mock-driven screens do not define the current MVP.

- Backend: Django/DRF/PostgreSQL; frontend: Next.js/TypeScript; Workspace is the tenant/authorization boundary.
- Persisted IA-1 create/save/refresh/fresh-login/resume and version-specific human acceptance are verified foundations, not proof that full Creator DNA, media finalization or production release are implemented.
- No production success may be faked by mock fallback. Preserve CSRF, tenant checks, revisions/conflicts, explicit approvals, truthful errors and reviewable version history.
- Do not expose confidential product documents, real creator data, secrets or session credentials to cloud agents, screenshots, logs or PRs. Use synthetic-only test fixtures.
- WorkOS authentication is an approved **target**, not permission for an auth migration. Production hosting, providers, privacy posture, DB schema/migrations and other L3/L4 changes require explicit Founder/CTO scope approval.

## Single Cross-Harness Workflow

1. Read `docs/02_DECISIONS.md` and `docs/04_NEXT_ACTIONS.md`; inspect the **specific approved GitHub issue**. Consult `docs/00_PROJECT_BRIEF.md`, `docs/01_ARCHITECTURE.md`, `docs/03_PROGRESS_LOG.md` and `docs/05_AI_WORK_LOG.md` only to the depth needed for the task.
2. Review relevant `backend/AGENTS.md` or `frontend/AGENTS.md`, implementation files and tests. For UX, also read `docs/ux/UX_BASELINE.md` and `docs/ux/SCREEN_TRACEABILITY.md`.
3. Follow `docs/10_AI_TEAM_OPERATING_MODEL.md` and the handoff format in `docs/11_AGENT_HANDOFF_TEMPLATE.md`: **Management scopes → Founder approves L3/L4 → Coding implements a single vertical slice → independent QA reviews → human merges → Management updates project memory**.
4. The shared skill entry points live in `.agents/skills/`: `the-luxe-plan`, `the-luxe-build`, `the-luxe-qa`, and `the-luxe-lean-context`. Codex can invoke them explicitly as `$the-luxe-plan`, etc.; Copilot uses the corresponding cloud profiles in `.github/agents/` or detects the skills by description.
5. Only implement approved scope, with explicit non-goals and acceptance tests. No implicit migrations, new architecture/agents, auth, AI-provider, deployment or publishing integration. If requirements conflict, stop and report the discrepancy.
6. Prefer narrow tests while coding; require applicable GitHub Actions gates and independent verification before merge. Never claim a test ran when it did not. Keep PRs reviewable; **no agent merges into `master`**.

## Product and Documentation Precedence

Current founder-approved source/spec and explicit issue acceptance criteria → current recorded decisions / UX baseline → these shared safeguards and domain invariants → older feature guides, prompts and mock examples. Report any conflicting requirements rather than silently overwriting one. Do not treat old examples in `docs/06_FEATURE_SLICE_GUIDE.md` or `.github/prompts/` as new feature authorization.

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
- `llm/` for local-first AI orchestration boundaries

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
- Do not add cloud AI integrations, publishing integrations, or authentication unless explicitly requested.
- Do not import from `temp/`, prototype exports, or other experimental folders unless explicitly instructed.
- Treat `temp/` as design reference material only, not as production code.
- If the frontend and backend disagree on a product concept, prefer clarifying the canonical domain model first and then patch the smallest number of files needed.

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

## AI Team Workflow

- Management Agent creates the task brief, assigns risk level, and defines approved scope.
- Coding Agent implements only the approved scope.
- QA Agent reviews implementation before acceptance.
- Management Agent updates project memory after accepted work.
- L3/L4 changes require explicit Founder/CTO approval.

## Things Not To Do

All agents must not:

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

## UX review

For PRs changing user-facing interaction or a supporting API contract, read `docs/ux/UX_BASELINE.md`, apply its cross-layer review checklist, and update `docs/ux/SCREEN_TRACEABILITY.md` for meaningful merged changes. Identify the affected page/journey, documented deviations, truthful states/contracts, responsive behavior, tests/screenshots and pending founder design acceptance. For internal-only backend work, explain when no UI journey applies.
