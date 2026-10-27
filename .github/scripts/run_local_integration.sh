#!/usr/bin/env bash
# Trusted committed code only; never run this against a PR on a persistent runner.
set -euo pipefail
suite=${1:-}
if [[ $# != 1 || "$suite" != backend && "$suite" != browser ]]; then
  echo 'Usage: bash .github/scripts/run_local_integration.sh backend|browser' >&2
  exit 2
fi
repo=$(git rev-parse --show-toplevel)
if git -C "$repo" ls-tree -r --name-only HEAD backend frontend | grep -E '(^|/)\.env($|\.)' >/dev/null; then
  echo 'Refusing snapshot with tracked environment files.' >&2
  exit 1
fi
python=$(command -v python3)
# Start the test process without developer credentials, proxies or database URLs.
exec env -i PATH="$PATH" bash -s -- "$suite" "$repo" "$python" <<'CLEAN_ENV'
set -euo pipefail
suite=$1 repo=$2 python=$3
task_dir=$(mktemp -d /tmp/theluxe-ci.XXXXXXXX)
container_name="theluxe-ci-${task_dir##*.}"
cleanup() {
  result=$?
  trap - EXIT INT TERM
  # The name exists before allocation; TERM can arrive before docker returns its ID.
  owner=$(docker inspect --format '{{ index .Config.Labels "com.theluxe.ci.owner" }}' "$container_name" 2>/dev/null || true)
  if [[ "$owner" == "$container_name" ]]; then
    if ! docker rm -f "$container_name" >/dev/null && [[ "$result" == 0 ]]; then result=1; fi
  fi
  rm -rf -- "$task_dir"
  exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
git -C "$repo" archive HEAD backend frontend | tar -x -C "$task_dir"
mkdir "$task_dir/home"
export HOME="$task_dir/home" TMPDIR="$task_dir" CI=1
export AI_PROVIDER=mock DEBUG=0 SECRET_KEY=synthetic-ci-only
docker run -d --rm --name "$container_name" --label "com.theluxe.ci.owner=$container_name" \
  --label com.theluxe.ci=integration --user 999:999 \
  --memory 768m --cpus 2 --pids-limit 128 --cap-drop ALL \
  --security-opt no-new-privileges \
  --tmpfs /var/lib/postgresql/data:rw,size=512m,uid=999,gid=999,mode=0700 \
  -p 127.0.0.1::5432 \
  -e POSTGRES_USER=theluxe_e2e -e POSTGRES_PASSWORD=synthetic-ci-only \
  -e POSTGRES_DB=theluxe_e2e_ci postgres:16 >/dev/null
ready=0
for _ in {1..30}; do
  if docker exec "$container_name" pg_isready -U theluxe_e2e -d theluxe_e2e_ci >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then echo 'Disposable PostgreSQL did not become ready.' >&2; exit 1; fi
port=$(docker port "$container_name" 5432/tcp | sed -n 's/^127\.0\.0\.1://p')
[[ "$port" =~ ^[0-9]+$ ]] || { echo 'Expected a single loopback PostgreSQL port.' >&2; exit 1; }
export DATABASE_URL="postgres://theluxe_e2e:synthetic-ci-only@127.0.0.1:$port/theluxe_e2e_ci"
"$python" -m venv "$task_dir/venv"
python="$task_dir/venv/bin/python"
"$python" -m pip install --disable-pip-version-check -q -r "$task_dir/backend/requirements/base.txt"
printf 'Testing committed revision %s (%s)\n' "$(git -C "$repo" rev-parse --short HEAD)" "$suite"
if [[ "$suite" == backend ]]; then
  cd "$task_dir/backend"
  "$python" manage.py check
  "$python" manage.py makemigrations --check --dry-run
  "$python" manage.py migrate --noinput
  "$python" manage.py test --noinput
else
  cd "$task_dir/frontend"
  export E2E_DATABASE_URL="$DATABASE_URL" E2E_ALLOW_ISOLATED_DATABASE=1 E2E_PYTHON="$python"
  "$python" ../backend/config/test_e2e_guard.py
  npm ci --no-audit --no-fund
  npx --no-install playwright install chromium
  npm run test:e2e:real
fi
CLEAN_ENV
