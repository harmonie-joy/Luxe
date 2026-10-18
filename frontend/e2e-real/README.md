# Real IA-1 browser verification (#54)

`npm run test:e2e:real` uses the installed Playwright Chromium against actual Next.js,
Django, session cookies/CSRF and PostgreSQL. It is separate from `e2e/` and the
backend-off `test:smoke` suite. There are no intercepted routes or mock responses.

Prepare Python 3.12 with `backend/requirements/base.txt`, Node 20 with `npm ci` in
`frontend/`, and `npx playwright install --with-deps chromium`. By default the suite
uses `backend/.venv/bin/python`; set `E2E_PYTHON=python` for an activated environment.

Create a **disposable, synthetic-only** PostgreSQL 16 database and role. For example,
from the repository root (the container is removed when stopped; its data is tmpfs):

```sh
docker run --rm -d --name theluxe-e2e-postgres \
  -e POSTGRES_DB=theluxe_e2e_local -e POSTGRES_USER=theluxe_e2e \
  -e POSTGRES_PASSWORD=synthetic-e2e-only \
  -p 127.0.0.1:55454:5432 --tmpfs /var/lib/postgresql/data postgres:16
docker exec theluxe-e2e-postgres pg_isready -U theluxe_e2e -d theluxe_e2e_local
```

Wait for `pg_isready` to succeed, then run from `frontend/`:

```sh
E2E_DATABASE_URL=postgres://theluxe_e2e:synthetic-e2e-only@127.0.0.1:55454/theluxe_e2e_local \
E2E_ALLOW_ISOLATED_DATABASE=1 npm run test:e2e:real
```

The explicit test settings reject SQLite, non-loopback hosts, missing opt-in and
database names outside `theluxe_e2e_*`. Do not reuse a developer, production or
staging database. The backend applies existing migrations; no new migration is
introduced. The suite starts/owns dedicated services at `localhost:8154` and
`localhost:3154`, refuses existing listeners, and stops its services at completion.
The normal local stack on ports 8000/3000 is unaffected. Test-only settings adjust
CORS/CSRF trusted origin to port3154; authentication, authorization and CSRF
middleware remain enabled. Regular application settings do not import this module.
Query strings and fragments are rejected so connection parameters cannot override
the guarded database target. The shared guard runs before either web server starts. Its six refusal cases
have a database-free self-check: `backend/.venv/bin/python backend/config/test_e2e_guard.py`
from the repository root; CI runs that check before the browser suite.

Each test gets two separate synthetic users/workspaces, profiles and **unapproved**
active version2 voices; version3 is available to test later activation. A unique
namespace avoids account dependence/collisions while content/expectations remain
fixed. Approval, Project, ContentItem and checkpoint writes use real UI/HTTP. Separate
Python processes read committed ORM state, checkpoints and approval actor/version.
Cleanup runs on test failure as well as success and deletes only that namespace's
items, projects, workspaces, users and sessions; it never flushes the database.
If the runner is killed forcibly, destroy the disposable container rather than
trying to reuse its database. Stop it with `docker stop theluxe-e2e-postgres`.

The seven cases cover:

1. Exact-version human acceptance, Project/item creation, all-field checkpoint save,
   refresh, logout denial, fresh browser-context login/resume, exact checkpoint ID,
   pinned version after another activation, mobile layout/navigation and next action.
2. Cross-workspace list/read/context/checkpoint/voice-acceptance denial in real HTTP,
   guessed item URL denial in UI and unchanged independently read protected state.
3. Two independent authenticated sessions, real `stale_revision`409, visible conflict,
   retained edits, deliberate reconciliation and `idempotency_key_reused`409.
4. Chromium's actual offline networking during save: retained edits, no false success,
   unchanged database, successful real retry after reconnect.
5. Repeated same-tick form submissions produce one real create request; an offline
   creation preserves input and blocks retry until deliberate saved-work reconciliation.
6. Chromium's browser network block on the real saved-post endpoint leaves Next.js
   and session authentication reachable. Creator Home shows unavailable saved posts,
   no fabricated queue, and the real saved row returns after unblock/retry. No HTTP
   response is substituted; the browser emits an actual failed network request.
7. A replay of an actual initial-create payload characterizes the existing non-idempotent
   API: two `201` responses create distinct items with identical content. This is a
   known limitation, not an exactly-once success claim. The normal UI blocks pending
   submissions and requires reconciliation; a deliberate reattempt after overlooking a
   successful saved item can still duplicate it. Backend idempotency is outside #54.

The real-e2e CI job provisions its own PostgreSQL16 service and runs this command.
CI uploads the HTML report, safe HTTP timelines, synthetic ORM evidence, screenshots
and failure contexts for seven days. Raw Playwright traces are deliberately off:
their network headers/cookies and login-fill steps can expose credentials. Password
entry uses the real UI's input event without putting the value in an action title.
The timeline records only method, pathname, status and connection error; no request
bodies, headers, query strings, password, session or CSRF token is attached. Use the
HTML action/expectation steps plus the timeline/screenshots to diagnose a failure.
Do not enable raw trace collection or attach browser storage state.

For regressions, run `make check` independently (with an isolated PostgreSQL
`TEST_DATABASE_URL` when PostgreSQL concurrency is required). Existing Brand Voice
and Draft Studio tests remain separate evidence. Screenshots prove functional
desktop/mobile state only; Page10A composition still awaits founder design acceptance.
