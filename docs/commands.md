### Correct workflow (recommended)

For this repo, treat Docker as the source of truth for runtime services:

1. Start Docker stack
make up

2. Run migrations **inside the backend container**
cd infra  
docker compose exec backend python manage.py migrate

3. Create superuser (optional)
docker compose exec backend python manage.py createsuperuser