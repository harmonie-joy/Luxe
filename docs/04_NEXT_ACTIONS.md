# Next Actions

## Current Sprint Goal

Persist the core Homepage -> Signup/Login -> Dashboard -> Create Brief -> Draft Studio -> Compliance Review workflow while preserving workspace scoping, local-first AI orchestration, and the existing MVP domain contract. Homepage and auth session bootstrap now exist, Create Brief is API-connected, backend local AI endpoints exist for brand asset analysis, brand voice extraction, and draft generation, Brand Voice extraction now produces richer Voice DNA context, Draft Studio can generate, save, switch, and delete brief-scoped persisted drafts, and local Ollama Brand Voice analysis/extraction has passed a manual smoke test; the next validation step is draft generation using the improved BrandProfile guidance.

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
| P0 | T-AI-005: Connect Draft Studio to AI draft generation. | Done | GitHub issue #14. Draft Studio loads persisted brief/draft data, generates drafts for target channels, renders returned drafts, and saves title/content edits through the existing draft API. |
| P0 | T-AI-006: Real Local Ollama Draft Generation with Brand Voice. | Done | GitHub issue #20. Draft generation now sends ContentBrief plus linked BrandProfile context to the provider, requires `OLLAMA_MODEL` for Ollama, and keeps the existing endpoint contract stable. |
| P0 | T-AI-006: Improve Brand Voice Extraction Quality. | Done | GitHub issue #23. Brand Voice extraction now passes selected asset title, format, and content to the provider and asks for richer Voice DNA guidance in existing BrandProfile fields. |
| P0 | T-AI-007: Brand Voice Analysis Engine MVP. | Done | GitHub issue #25 smoke passed with local `gemma4:12b`: saved text and image BrandAssets, ran analysis/extraction, and accepted suggestions into BrandProfile. |
| P0 | T-UX-001: Clarify Brief and Draft workflow. | Done | GitHub issue #16. Create Brief routes to `/drafts?brief=<id>`, Draft Studio shows the selected brief, supports brief switching, and clarifies brief versus draft concepts. |
| P0 | T-UX-002: Add Delete Brief destructive action. | Done | GitHub issue #18. Draft Studio deletes the current brief through `DELETE /api/content-briefs/{id}/`, warns about cascade deletion, clears local drafts, switches to another brief, or routes to `/create`. |
| P1 | Connect Create Brief form submission to `createContentBrief`. | Done | Form submits through the existing API client, validates required fields and target channels, filters brand profiles by workspace, and navigates to `/drafts` after create. |
| P1 | T-AI-003: Connect Brand Voice Setup to extraction endpoint. | Done | GitHub issue #10. The page can analyze selected samples, render suggestions, preserve mock fallback, and accept suggestions through the existing profile update API in API mode. |
| P1 | Connect Compliance Review to compliance check and issue APIs. | Ready | Load checks by draft ID before adding richer issue workflows. |
| P2 | Add typed mock AI flow fixtures for UX validation. | Done | `frontend/data/mock-ai-flow.ts` added and QA-accepted with scope-control remediation. |
| P2 | Add frontend verification for the persisted flow. | Pending | Start with typecheck and focused component or integration tests where practical. |

## Blockers

- No full workspace switcher or membership management UI.
- Product screens still use mocks by default.

## Best Next Task for AI

Validate local Ollama draft generation using the improved BrandProfile guidance from the Brand Voice smoke test. After that, connect Compliance Review to persisted compliance checks and issues.

## Local Ollama AI Setup

- Run `ollama list` on the host machine.
- Confirm the exact model name available locally.
- Set `AI_PROVIDER=ollama`.
- Set `OLLAMA_MODEL=<model-name>`.
- Optional: set `OLLAMA_NUM_PREDICT=<token budget>` when a local model truncates structured JSON responses.
- If the backend runs in Docker and Ollama runs on the host, set `OLLAMA_BASE_URL=http://host.docker.internal:11434`.

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
