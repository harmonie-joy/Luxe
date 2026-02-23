up:
	cd infra && docker compose up --build

down:
	cd infra && docker compose down

logs:
	cd infra && docker compose logs -f --tail=200

ps:
	cd infra && docker compose ps