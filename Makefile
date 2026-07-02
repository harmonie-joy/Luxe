.PHONY: up down logs ps dev dev-down dev-restart dev-check migrate makemigrations manage test-be test-fe test-be-local check

COMPOSE = cd infra && docker compose

up:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f --tail=200

ps:
	$(COMPOSE) ps

dev-check:
	$(COMPOSE) config -q

dev: dev-check
	$(COMPOSE) up -d --build --remove-orphans
	$(COMPOSE) ps
	@echo "Development stack is starting."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8000/api/health"
	@echo "Run 'make logs' to follow logs."

dev-down:
	$(COMPOSE) down --remove-orphans

dev-restart: dev-down dev

# Django management — runs inside the backend container.
# Usage:
#   make migrate
#   make makemigrations app=tenancy name=my_migration
#   make manage cmd="createsuperuser"
#   make test app=content test=test_create_scheduled_content_with_foreign_workspace_is_denied

migrate:
	$(COMPOSE) exec backend python manage.py migrate

makemigrations:
	$(COMPOSE) exec backend python manage.py makemigrations $(if $(app),$(app),) $(if $(name),--name $(name),)

manage:
	$(COMPOSE) exec backend python manage.py $(cmd)

test-be:
	$(COMPOSE) exec backend python manage.py test $(if $(app),$(app),) $(if $(test),$(test),)

# Local (non-Docker) test commands — same commands CI runs.
# Backend uses backend/.venv and a throwaway sqlite DB; frontend needs node_modules.

TEST_DATABASE_URL ?= sqlite:////tmp/theluxe-test.sqlite3

test-be-local:
	cd backend && DATABASE_URL=$(TEST_DATABASE_URL) .venv/bin/python manage.py test $(if $(app),$(app),) $(if $(test),$(test),)

test-fe:
	cd frontend && npm run test:frontend

# Everything CI blocks on: frontend lint + typecheck + unit tests + backend tests.
check:
	cd frontend && npm run lint && npm run typecheck && npm run test
	$(MAKE) test-be-local