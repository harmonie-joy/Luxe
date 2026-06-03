# THE LUXE (MVP)

Monorepo:
- backend: Django + DRF
- frontend: Next.js
- infra: docker-compose for local dev (postgres, redis, minio)

## Quickstart (local)
1) make dev
2) backend: http://localhost:8000
3) frontend: http://localhost:3000

## Local Development Commands
- make dev: Validate compose config, build images, and start services in detached mode.
- make logs: Follow service logs.
- make ps: Show container status.
- make dev-down: Stop and remove containers.
- make dev-restart: Restart the development stack.