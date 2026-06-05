# Next Actions

## Current Sprint Goal

Persist the core Create Brief -> Draft Studio -> Compliance Review workflow while preserving workspace scoping and the existing MVP domain contract. The Create Brief submission step is now connected to the existing ContentBrief API; the next integration work is authenticated workspace bootstrap and Draft Studio persistence.

## Active Tasks

| Priority | Task | Status | Notes |
| --- | --- | --- | --- |
| P0 | Align frontend API base environment variable with Docker Compose. | Done | `frontend/lib/api/http-client.ts` now prefers `NEXT_PUBLIC_API_BASE_URL` while preserving `NEXT_PUBLIC_API_URL`. |
| P0 | Define the minimal active workspace/bootstrap path for frontend API calls. | Ready | Needed before replacing mocks broadly. |
| P1 | Connect Create Brief form submission to `createContentBrief`. | Done | Form submits through the existing API client, validates required fields and target channels, filters brand profiles by workspace, and navigates to `/drafts` after create. |
| P1 | Connect Draft Studio reads and saves to content draft APIs. | Ready | Fetch drafts by brief and persist edits with existing client helpers. |
| P1 | Connect Compliance Review to compliance check and issue APIs. | Ready | Load checks by draft ID before adding richer issue workflows. |
| P2 | Add typed mock AI flow fixtures for UX validation. | Done | `frontend/data/mock-ai-flow.ts` added and QA-accepted with scope-control remediation. |
| P2 | Render mock AI guidance and suggestion states in Draft Studio. | Ready | Use `mock-ai-flow` fixtures for loading/ready/failure and suggestion acceptance interactions. |
| P2 | Add frontend verification for the persisted flow. | Pending | Start with typecheck and focused component or integration tests where practical. |

## Blockers

- No frontend-auth-compatible login/session flow.
- No workspace or membership API for user-facing workspace selection.
- Product screens still use mocks by default.

## Best Next Task for AI

Render the new frontend-only `mock-ai-flow` fixtures in Draft Studio (AI guidance panel, suggestion cards, and loading/failure states) as a contained mock-validation slice. In parallel planning, keep the authenticated workspace/bootstrap definition as the prerequisite for broader API-connected persistence work.

## Do Not Touch Yet

- Real AI provider integrations.
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
