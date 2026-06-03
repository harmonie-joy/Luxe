.PHONY: up down logs ps dev dev-down dev-restart dev-check migrate makemigrations manage

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
migrate:
	$(COMPOSE) exec backend python manage.py migrate

makemigrations:
	$(COMPOSE) exec backend python manage.py makemigrations $(if $(app),$(app),) $(if $(name),--name $(name),)

manage:
	$(COMPOSE) exec backend python manage.py $(cmd)