# THE LUXE — Copilot instructions

## Authoritative context (October 2026)

THE LUXE is a context-preserving Creator/CEO operating system. The approved immediate product path is **Creator Home → approved, version-specific Brand Voice/context → persisted Project/ContentItem → resume editing with a clear next action**, followed by the scoped LinkedIn-first caption/version/approval/export value loop. The historical Dashboard → Create Brief → Draft Studio → Compliance → Calendar flow remains reusable legacy functionality, **not** a mandate to implement that sequence first.

This is a Django/DRF + PostgreSQL backend in `backend/`, Next.js 16/TypeScript frontend in `frontend/`, with GitHub Actions, Vitest and Playwright. Preserve existing architecture. Do not invent a parallel Organization model; Workspace is the tenant boundary.

Read before planning or coding, in this order:
1. `AGENTS.md` and the relevant `backend/AGENTS.md` or `frontend/AGENTS.md`.
2. `docs/00_PROJECT_BRIEF.md`, `docs/01_ARCHITECTURE.md`, `docs/02_DECISIONS.md`.
3. `docs/04_NEXT_ACTIONS.md` (current best task), `docs/03_PROGRESS_LOG.md`, `docs/05_AI_WORK_LOG.md`.
4. The **specific GitHub issue** and its accepted scope/acceptance criteria; for UX, also `docs/ux/UX_BASELINE.md` and `docs/ux/SCREEN_TRACEABILITY.md`.
5. `docs/10_AI_TEAM_OPERATING_MODEL.md` and `docs/11_AGENT_HANDOFF_TEMPLATE.md` for agent roles and handoffs.

If older instructions contradict an explicit later approved decision or scoped issue, **report the conflict** and follow the approved baseline; do not silently expand scope or rewrite source-of-truth documents.

## Roles, approvals and scope

- Management Agent scopes the issue and produces a handoff. Coding Agent implements only approved scope. QA Agent independently reviews. Do not pretend that one cloud run constitutes three independent reviews.
- **L0–L1:** documentation or narrowly scoped safe fixes. **L2:** cross-module work needs a Management handoff. **L3–L4:** migrations, auth, security/privacy, AI providers, deployment or product/architecture decisions require explicit Founder/CTO approval before implementation.
- Follow one issue/vertical slice per PR; include objective, non-goals, allowed files, acceptance criteria and verification in the task description.
- Prefer small patches. Do not perform speculative refactors, change package versions, add agent frameworks/dependencies, introduce service providers, or change data models without explicit approval.
- Do not implement unrelated backlog items found while coding. Report them as follow-up issues instead.
- Do not add, update or merge a PR to `master` without human review. Never claim founder design acceptance, GDPR certification, or production readiness based only on tests.

## Product invariants

- Preserve Django models ↔ DRF serializers ↔ TypeScript types ↔ UI/API state alignment.
- Always enforce Workspace isolation on backend reads and writes, including ID-based lookups. Keep auth, CSRF, authorization, error and revision-conflict behavior intact.
- The current authenticated IA-1 workflow has persisted checkpoints and explicit human acceptance of an **exact BrandVoice version**; do not replace it with synthetic acceptance or silent latest-version binding.
- Server acknowledgement is required before showing saved success. Loading, empty, unavailable, unauthorized, conflict and failure states must be truthful. Production and real-browser tests never fall back to mock success.
- Preserve UX theme tokens, focused pages, keyboard/mobile/reduced-motion behaviors and the source-of-truth UX review process.
- Treat source documents, real creator materials, API keys, database credentials and production data as private. Do not paste them into prompts, logs, PRs, screenshots or cloud sandboxes. Use synthetic-only fixtures and isolated test databases.

## Environment and verification

- Frontend: Node 20; from `frontend/` run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` as applicable.
- Backend: Python 3.12 and `backend/requirements/base.txt`; from `backend/` run `python manage.py check` and scoped `python manage.py test` with a disposable test DB.
- `make check` is the repo-wide local verification entrypoint when `backend/.venv` exists. CI has separate frontend, backend and **real PostgreSQL/Next/Django Playwright** jobs at `.github/workflows/ci.yml`.
- Never run destructive test fixtures against a shared, staging or production database. For real E2E follow `frontend/e2e-real/README.md` and its explicit isolated database guard.
- The optional Copilot cloud environment setup only installs dependencies. **It is not a passing test result.** If commands were not run or fail, report exact commands, exit status and limitations; never invent output.

## Pull request handoff contract

Report: issue link, approved scope/non-goals, files changed, API/model/migration impact, behavior and edge cases, exact tests run and results, CI link/status when known, remaining risks, and QA/founder approvals still outstanding. Request human review; do not self-accept or auto-merge.

## Efficient AI usage

Use the existing docs and issue as task context, not the entire repository pasted into the prompt. Read relevant source before proposing edits. Use cost-appropriate models, limit exploratory turns and subagents, avoid repeated full-suite test runs during iteration, and rely on the existing CI acceptance gate for final comprehensive checks. Do not sacrifice required tests or safety to save credits.
