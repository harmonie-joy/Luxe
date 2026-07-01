# Next Actions

## Current Sprint Goal

Persist the core Homepage -> Signup/Login -> Dashboard -> Create Brief -> Draft Studio -> Compliance Review workflow while preserving workspace scoping, local-first AI orchestration, and the existing MVP domain contract. Homepage and auth session bootstrap now exist, Create Brief is API-connected, and backend local AI endpoints exist for brand voice extraction and draft generation; the next integration work is Draft Studio UI wiring and Compliance Review persistence.

## Active Tasks

| Priority | Task | Status | Notes |
| --- | --- | --- | --- |
| P0 | Align frontend API base environment variable with Docker Compose. | Done | `frontend/lib/api/http-client.ts` now prefers `NEXT_PUBLIC_API_BASE_URL` while preserving `NEXT_PUBLIC_API_URL`. |
| P0 | Define the minimal active workspace/bootstrap path for frontend API calls. | Done | `/api/auth/me/` and `/api/auth/bootstrap-workspace/` now return session workspace data. |
| P0 | T-BOOT-001: Define authenticated workspace/bootstrap prerequisite path. | Done | Implemented as a minimal session/bootstrap API, not a full workspace selector. |
| P0 | Run auth provider migrations and seed the demo workspace in Docker. | Ready | Run `make migrate`, then `make manage cmd="seed_demo"` after rebuilding with `django-allauth[headless]`. |
| P0 | Add local-first backend AI orchestration foundation. | Done | GitHub issue #8. Backend-only: `AIRun`, mock provider, optional Ollama provider, schemas, services, and tests passed in Docker. |
| P0 | T-AI-002: Add Brand Voice Extraction API contract. | Done | GitHub issue #9. `POST /api/ai/brand/extract/` validates workspace/profile/assets, calls the mock-backed local AI service, returns `aiRunId` and schema-valid suggestions, and does not mutate `BrandProfile`. |
| P0 | T-AI-004: Add AI Draft Generation API. | Done | GitHub issue #12. `POST /api/ai/drafts/generate/` validates workspace/brief/channel access, calls local draft generation, upserts `ContentDraft` records, and returns draft records plus `AIRun` IDs. |
| P1 | Connect Create Brief form submission to `createContentBrief`. | Done | Form submits through the existing API client, validates required fields and target channels, filters brand profiles by workspace, and navigates to `/drafts` after create. |
| P1 | T-AI-003: Connect Brand Voice Setup to extraction endpoint. | Done | GitHub issue #10. The page can analyze selected samples, render suggestions, preserve mock fallback, and accept suggestions through the existing profile update API in API mode. |
| P1 | Connect Brand Voice Setup to extraction endpoint. | Ready | Call `POST /api/ai/brand/extract/`, show suggestions for review, and save profile changes only after explicit user confirmation. |
| P1 | Connect Draft Studio to AI draft generation endpoint. | Ready | Call `POST /api/ai/drafts/generate/` for selected brief channels, then render returned drafts. |
| P1 | Connect Draft Studio reads and saves to content draft APIs. | Ready | Fetch drafts by brief and persist edits with existing client helpers. |
| P1 | Connect Compliance Review to compliance check and issue APIs. | Ready | Load checks by draft ID before adding richer issue workflows. |
| P2 | Add typed mock AI flow fixtures for UX validation. | Done | `frontend/data/mock-ai-flow.ts` added and QA-accepted with scope-control remediation. |
| P2 | Render mock AI guidance and suggestion states in Draft Studio. | Ready | Use `mock-ai-flow` fixtures for loading/ready/failure and suggestion acceptance interactions. |
| P2 | Add frontend verification for the persisted flow. | Pending | Start with typecheck and focused component or integration tests where practical. |

## Blockers

- No full workspace switcher or membership management UI.
- Product screens still use mocks by default.

## Best Next Task for AI

Run `make test-be` in a Docker-enabled shell to complete T-AI-004 verification, then connect Draft Studio to `POST /api/ai/drafts/generate/` and the existing content draft read/save APIs.

## Do Not Touch Yet

- Cloud AI provider integrations.
- Publishing integrations or social network posting.
- Broad dashboard analytics.
- Full comments model.
- Billing or subscription logic.
- Vector database or autonomous agent dashboard.
- Parallel Organization tenant model.

## Completion Checklist

After each meaningful task:

- Update `docs/03_PROGRESS_LOG.md`.
- Update `docs/05_AI_WORK_LOG.md`.
- Update this file if priorities, blockers, or the best next task changed.
- Update `docs/02_DECISIONS.md` if architecture, data model, scope, auth, AI, compliance, or integration strategy changed.
