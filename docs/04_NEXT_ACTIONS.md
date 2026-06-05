# Next Actions

## Current Sprint Goal

Persist the core Create Brief -> Draft Studio -> Compliance Review workflow while preserving workspace scoping and the existing MVP domain contract.

## Active Tasks

| Priority | Task | Status | Notes |
| --- | --- | --- | --- |
| P0 | Align frontend API base environment variable with Docker Compose. | Ready | `frontend/lib/api/http-client.ts` reads `NEXT_PUBLIC_API_URL`; Compose sets `NEXT_PUBLIC_API_BASE_URL`. |
| P0 | Define the minimal active workspace/bootstrap path for frontend API calls. | Ready | Needed before replacing mocks broadly. |
| P1 | Connect Create Brief form submission to `createContentBrief`. | Ready | Keep mock fallback and navigate toward draft workflow after create. |
| P1 | Connect Draft Studio reads and saves to content draft APIs. | Ready | Fetch drafts by brief and persist edits with existing client helpers. |
| P1 | Connect Compliance Review to compliance check and issue APIs. | Ready | Load checks by draft ID before adding richer issue workflows. |
| P2 | Add frontend verification for the persisted flow. | Pending | Start with typecheck and focused component or integration tests where practical. |

## Blockers

- No frontend-auth-compatible login/session flow.
- No workspace or membership API for user-facing workspace selection.
- Product screens still use mocks by default.

## Best Next Task for AI

Update `frontend/lib/api/http-client.ts` so the API client accepts Docker Compose's `NEXT_PUBLIC_API_BASE_URL` while preserving the existing `NEXT_PUBLIC_API_URL` fallback, then run the narrowest useful frontend verification. After that, connect the Create Brief page to the existing ContentBrief API using the current shared types and mock fallback.

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
