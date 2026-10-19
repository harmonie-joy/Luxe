---
applyTo: "backend/**"
---

> **Current scope:** Apply `backend/AGENTS.md`, `docs/02_DECISIONS.md`, the accepted issue and `docs/04_NEXT_ACTIONS.md` before older example endpoint lists below. Preserve IA-1 workspace authorization, explicit version-specific voice acceptance, revision conflicts and real data persistence. WorkOS remains a target, not an implicit authorization to migrate authentication.

## Backend Migration Rules

- Explain every migration before creating it.
- Prefer one logical migration per feature slice.
- Do not create migrations for exploratory model changes.
- Run Django checks after model changes.
- Keep workspace-owned models scoped directly or through a clear parent relationship.
- Use `models.TextChoices` for canonical enums.
- Add admin registration when it improves inspection during MVP development.

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

- `/api/creator-context/`, `/api/projects/`, `/api/content-items/` and checkpoint routes (see current `backend/AGENTS.md` for the accepted IA-1 contract)
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


## Local Development Workflow

Use the repository Make targets as the default local workflow for Docker-based development:

- `make dev-check` validates compose configuration before startup.
- `make dev` builds and starts the stack in detached mode with health-aware startup ordering.
- `make ps` shows current service/container status.
- `make logs` tails logs for troubleshooting.
- `make dev-down` stops and removes containers.
- `make dev-restart` restarts the full stack.

Django management commands run inside the backend container via Make. Never run `manage.py` directly against the local filesystem when the stack is running in Docker:

- `make migrate` applies all pending migrations.
- `make makemigrations` generates migrations for all apps.
- `make makemigrations app=tenancy` generates migrations for a single app.
- `make makemigrations app=tenancy name=my_migration` generates a named migration.
- `make manage cmd="createsuperuser"` runs any arbitrary management command.

When working on Python code outside Docker, use the backend virtual environment at `backend/.venv`.