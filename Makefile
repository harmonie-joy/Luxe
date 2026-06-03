.PHONY: up down logs ps dev dev-down dev-restart dev-check

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