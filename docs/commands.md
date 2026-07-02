### Correct workflow (recommended)

For this repo, treat Docker as the source of truth for runtime services:

1. Start Docker stack
make up

2. Run migrations **inside the backend container**
cd infra  
docker compose exec backend python manage.py migrate

3. Create superuser (optional)
docker compose exec backend python manage.py createsuperuser
### Tests and CI checks

One-command test runs (no Docker required):

- `make test-fe` — frontend unit tests (Vitest) + Playwright route smoke.
- `make test-be-local` — backend Django tests against throwaway sqlite (uses `backend/.venv`). Scope with `app=<app>`.
- `make check` — everything CI blocks on: frontend lint, typecheck, unit tests, and backend tests.
- `make test-be app=<app>` — backend tests inside the Docker compose stack.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, frontend tests, build, route smoke, and backend tests on every push to `master` and every pull request.
