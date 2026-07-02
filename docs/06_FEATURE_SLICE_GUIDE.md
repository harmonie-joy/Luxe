# Feature Vertical Slice Guide

How to add one MVP feature to THE LUXE as a complete, tested vertical slice:
backend model → API → frontend type → API client → feature component → page → tests → CI.

The canonical MVP scope is: Brand Voice, Drafting, Compliance Light, Workflow
Cockpit, Audit Trail. A slice that does not serve one of these needs explicit
Management approval first.

**Reference slice to copy:** ContentBrief. It touches every layer:
`backend/content/models.py` → `backend/content/serializers.py` →
`backend/content/views.py` → `backend/content/urls.py` →
`frontend/types/content.ts` → `frontend/lib/api/content-briefs.ts` →
`frontend/data/mock-create-brief.ts` →
`frontend/features/create/components/create-brief-shell.tsx` →
`frontend/app/(app)/create/page.tsx`.

## Order of work

Follow the Safe Patch Workflow in `AGENTS.md`. For a new slice that means:

### 1. Contract first

- Confirm the entity exists in the Canonical MVP Domain Model (`AGENTS.md`).
  If not, stop and clarify before writing code.
- Define or extend the shared type in `frontend/types/<domain>.ts`:
  `id: string`, `workspaceId: string` (direct or via parent), `createdAt` /
  `updatedAt` as ISO 8601 strings, enums as union string literals matching the
  canonical values exactly.

### 2. Backend (Django app that owns the domain)

| Step | File | Rules |
| --- | --- | --- |
| Model | `backend/<app>/models.py` | Workspace-scoped (direct FK or clear parent), `models.TextChoices` for enums, `created_at`/`updated_at`, deliberate `on_delete`, indexes for workspace/status queries |
| Migration | `backend/<app>/migrations/` | Explain the migration in the task/PR before creating it; one logical migration per slice |
| Admin | `backend/<app>/admin.py` | Register for MVP inspection |
| Serializer | `backend/<app>/serializers.py` | camelCase read fields (matching the frontend type), snake_case write fields; never expose sensitive fields |
| ViewSet + routes | `backend/<app>/views.py`, `backend/<app>/urls.py` | Queryset filtered to the requesting user's workspaces — never fetch by bare ID |
| Tests | `backend/<app>/tests.py` | Must include a cross-workspace denial test (copy the pattern from `content/tests.py`) and CRUD happy path |

App wiring already includes each app's `urls.py` under `/api/` in
`backend/config/urls.py`.

### 3. Frontend

| Step | File | Rules |
| --- | --- | --- |
| API client | `frontend/lib/api/<feature>.ts` | Use `httpClient` from `lib/api/http-client.ts`; reads return camelCase domain types, write payload interfaces stay snake_case and live in the client file |
| Mock data | `frontend/data/mock-<feature>.ts` | Named exports, typed with `satisfies`, realistic IDs and ISO timestamps, canonical enum values |
| Feature UI | `frontend/features/<feature>/components/<feature>-shell.tsx` | Accepts the same shape a real API response returns; `luxe-*` classes for visuals |
| Page | `frontend/app/(app)/<route>/page.tsx` | Thin: import data, pass to the feature component |
| Route | `frontend/lib/routes.ts` | Add to `APP_ROUTES`; never hardcode path strings |

### 4. Mock data must never be silent

If a screen is expected to persist, the user must be able to see whether they
are on live data or the demo fallback:

- Follow the Draft Studio pattern: load live data in an effect, and render a
  visible **Live / Demo** source badge (`DATA_SOURCE_LABELS` in
  `frontend/features/drafts/components/draft-studio-shell.tsx`).
- Write actions in demo/mock mode must either be blocked with an explicit
  message ("Sign in and load a persisted brief before generating drafts.") or
  clearly labeled as local-only ("Mock mode only. No backend save was made.").
- A silent fallback is only acceptable for read-only selector/display data,
  and the subsequent write must still go to the real API and surface
  `ApiError` failures.

### 5. Tests (required per slice)

- **Backend:** CRUD + workspace-scoping tests in `backend/<app>/tests.py`.
- **Frontend component:** `<feature>-shell.test.tsx` beside the component.
  Mock the API modules with `vi.mock`, reuse `mockSession` and `router` from
  `frontend/test/setup.ts`, drive the real user flow (render → interact →
  assert payloads and navigation). Copy any existing `features/**/​*.test.tsx`.
- **API client contract:** add the new client's paths/payloads to
  `frontend/lib/api/api-clients.test.ts`.
- **Smoke:** add the new route to `ROUTES` in `frontend/e2e/smoke.spec.ts`.

### 6. Verify before handing to QA

```bash
make check          # frontend lint + typecheck + unit tests, backend tests (sqlite, no Docker)
make test-fe        # frontend unit tests + Playwright route smoke
make test-be-local  # backend tests only (add app=<app> to scope)
```

Docker equivalents: `make test-be app=<app>` runs inside the compose stack.
CI (`.github/workflows/ci.yml`) runs the same commands on every push to
`master` and every pull request, and blocks on failure.

## Definition of done

- [ ] Backend model, serializer, routes, and admin exist and are workspace-scoped.
- [ ] Migration created and explained.
- [ ] Frontend shared type, API client, mock data, feature component, page, and route entry exist and agree on fields/enums.
- [ ] Live vs mock data source is visible to the user wherever persistence is expected.
- [ ] Backend tests (incl. cross-workspace denial), component test, client contract entries, and smoke route added.
- [ ] `make check` and `make test-fe` pass locally; CI is green.
- [ ] No unrelated refactors; memory docs updated only after QA acceptance (Management Agent).

## Known gaps (QA notes, 2026-07-02)

- Dashboard, Calendar, and Compliance screens still render mock data by
  default (documented blocker in `docs/04_NEXT_ACTIONS.md`); Compliance is not
  yet connected to the persisted check/issue APIs.
- `CreateBriefShell` silently falls back to mock workspace/profile options
  when the session API is unreachable; the save itself still hits the real API
  and surfaces errors, but the selector fallback has no visible badge yet.
- Playwright smoke runs with the backend intentionally off and filters
  network-noise console errors; it validates rendering, not persistence.
- No persisted end-to-end auth→brief→draft browser test yet; it needs backend
  session seeding in CI before it can be reliable.
- `make test-be-local` requires `backend/.venv`; CI installs from
  `backend/requirements/base.txt` instead.
