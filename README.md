# THE LUXE (MVP)

Monorepo:
- backend: Django + DRF
- frontend: Next.js
- infra: docker-compose for local dev (postgres)

## Quickstart (local)
Run these from the repository root.

```bash
make dev
make migrate
make manage cmd="seed_demo"
```

Open:
- frontend app: http://localhost:3000
- backend health: http://localhost:8000/api/health
- Django admin: http://localhost:8000/admin

## Local Development Commands
- make dev: Validate compose config, build images, and start services in detached mode.
- make logs: Follow service logs.
- make ps: Show container status.
- make dev-down: Stop and remove containers.
- make dev-restart: Restart the development stack.

## Test The App

Run in this order after `make dev`:

```bash
make ps
make migrate
make test-be
cd frontend
npm run typecheck
npm run lint
npm run build
```

For scoped backend tests:

```bash
make test-be app=llm
make test-be app=brand
make test-be app=content
```

For local backend tests without Docker:

```bash
cd backend
DATABASE_URL=sqlite:////tmp/theluxe-test.sqlite3 .venv/bin/python manage.py test llm brand content
```

## How The App Works Locally

1. Start the stack:

```bash
make dev
```

2. Apply migrations and seed demo data:

```bash
make migrate
make manage cmd="seed_demo"
```

3. Open http://localhost:3000.

4. Use the product flow:

```text
Homepage -> Signup/Login -> Dashboard -> Brand Voice -> Create Brief -> Draft Studio
```

5. For live API-backed Brand Voice data, `infra/docker-compose.yml` sets this under `frontend.environment`:

```bash
NEXT_PUBLIC_USE_MOCK_BRAND_VOICE=false
```

## Local Ollama Setup

Run Ollama on the host machine, then confirm the exact installed model name:

```bash
ollama list
```

When the backend runs in Docker and Ollama runs on the host, add these values under the `backend.environment` block in `infra/docker-compose.yml`:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=<exact model name from ollama list>
```

Then restart the backend stack:

```bash
make dev-restart
```

## Ollama Logs And Checks

Check that Ollama is reachable:

```bash
curl http://localhost:11434/api/tags
ollama ps
ollama list
```

Show Ollama logs on Linux systemd installs:

```bash
journalctl -u ollama -f
```

If Ollama was started manually, watch the terminal where `ollama serve` is running:

```bash
ollama serve
```

## Debugging Commands

Follow all app logs:

```bash
make logs
```

Follow one service:

```bash
cd infra
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

Run Django checks and inspect AI run records:

```bash
make manage cmd="check"
make manage cmd="shell"
```

Inside the Django shell:

```python
from llm.models import AIRun
AIRun.objects.order_by("-started_at").values("task_type", "provider", "model", "status", "error")[:5]
```

Reset the local stack:

```bash
make dev-down
make dev
make migrate
```
