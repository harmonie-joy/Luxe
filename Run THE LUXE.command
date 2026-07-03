#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if command -v docker >/dev/null 2>&1; then
  DOCKER="$(command -v docker)"
else
  DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
fi

if [ ! -x "$DOCKER" ]; then
  echo "Docker Desktop is not installed or its command line tools are missing."
  echo "Install Docker Desktop for Mac with Apple silicon, then run this file again:"
  echo "https://www.docker.com/products/docker-desktop/"
  open "https://www.docker.com/products/docker-desktop/" >/dev/null 2>&1 || true
  read -r -p "Press Return to close this window."
  exit 1
fi

open -a Docker >/dev/null 2>&1 || true

echo "Waiting for Docker Desktop..."
for attempt in {1..60}; do
  if "$DOCKER" info >/dev/null 2>&1; then
    break
  fi

  if [ "$attempt" -eq 60 ]; then
    echo "Docker Desktop did not become ready."
    echo "Open Docker Desktop, wait until it says it is running, then run this file again."
    read -r -p "Press Return to close this window."
    exit 1
  fi

  sleep 2
done

if ! "$DOCKER" compose version >/dev/null 2>&1; then
  echo "Docker Compose is not available. Update Docker Desktop, then run this file again."
  read -r -p "Press Return to close this window."
  exit 1
fi

echo "Starting THE LUXE. First run can take a few minutes..."
cd "$ROOT/infra"
"$DOCKER" compose up -d --build --remove-orphans
"$DOCKER" compose exec -T backend python manage.py migrate
"$DOCKER" compose exec -T backend python manage.py seed_demo --reset-password
"$DOCKER" compose ps

echo
echo "THE LUXE is ready."
echo "Opening http://localhost:3000"
echo
echo "Demo login:"
echo "  Email:    demo@theluxe.local"
echo "  Password: theluxe-demo"
echo
echo "To stop the app later, run:"
echo "  cd \"$ROOT/infra\""
echo "  \"$DOCKER\" compose down"

open "http://localhost:3000" >/dev/null 2>&1 || true
read -r -p "Press Return to close this window. The app will keep running."
