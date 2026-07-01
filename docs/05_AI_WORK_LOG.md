# AI Work Log

## Purpose

Track AI-assisted changes so the repo remains auditable across Codex, Copilot, Cursor, ChatGPT, and future tools.

## Work Entries

### 2026-06-05 - Codex - Agent Memory Scaffolding

- Tool: Codex
- Request: Audit the repo and scaffold the Markdown-first project memory and AI orchestration files from `prompts/agent-creation.md`.
- Files created:
  - `docs/00_PROJECT_BRIEF.md`
  - `docs/01_ARCHITECTURE.md`
  - `docs/02_DECISIONS.md`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
  - `prompts/management-agent.md`
  - `.cursor/rules/project-rules.mdc`
- Existing files updated additively:
  - `AGENTS.md`
  - `.github/copilot-instructions.md`
- Source context used:
  - `prompts/agent-creation.md`
  - `README.md`
  - `AGENTS.md`
  - `backend/AGENTS.md`
  - `frontend/AGENTS.md`
  - `.github/copilot-instructions.md`
  - `docs/mvp-progress-report.md`
  - `docs/prototype-audit.md`
  - `docs/the_luxe_data_model_source_of_truth.md`
  - backend and frontend domain files inspected during audit
- Result: Pending human review.
- Verification: Repository inspection, `docs/mvp-progress-report.md` review, and git diff/status review. No app tests were run.

### 2026-06-05 - Codex - Memory Consistency Audit

- Tool: Codex
- Request: Audit the new project memory system for consistency with `docs/mvp-progress-report.md` and make only small additive or corrective edits.
- Files changed:
  - `docs/00_PROJECT_BRIEF.md`
  - `docs/01_ARCHITECTURE.md`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Corrected memory wording from in-progress scaffolding to existing memory docs, added data-model authority guidance, clarified backend API route coverage, made the best next engineering task file-specific, and recorded the audit.
- Human review status: Pending
- Verification: Required files were read, `docs/mvp-progress-report.md` was used as the current-state check, and git status/diff were reviewed. No app tests were run.
- Decision log update needed: No
- Next action: Fix the frontend API base environment mismatch in `frontend/lib/api/http-client.ts`.

### 2026-06-05 - Codex - AI Development Team Workflow

- Tool: Codex
- Task given to AI: Add minimal AI development team workflow with Management Agent, Coding Agent, and QA Agent.
- Output summary: Added repo-native AI team operating model, handoff template, Coding Agent prompt, QA Agent prompt, and additive coordination notes in `AGENTS.md` and `prompts/management-agent.md`.
- Files modified:
  - `AGENTS.md`
  - `prompts/management-agent.md`
  - `prompts/coding-agent.md`
  - `prompts/qa-agent.md`
  - `docs/10_AI_TEAM_OPERATING_MODEL.md`
  - `docs/11_AGENT_HANDOFF_TEMPLATE.md`
- Human review:
  - Accepted: pending final review
  - Rejected: none
  - Needs revision: none currently identified
- Issues introduced: None known.
- Follow-up needed: Run one real coding task through the Management -> Coding -> QA workflow.
- Verification: `git status --short`, `git diff --check`, scoped diffs for modified workflow docs, and new-file diffs for the new agent prompts.
- Decision log update needed: No
- Next action: Test the AI team workflow on one small, scoped coding task.

### 2026-06-05 - Codex - Create Brief API Integration

- Tool: Codex
- Request: Connect the `/create` frontend brief creation form to the existing backend `ContentBrief` API without changing backend contracts, then QA and accept the implementation.
- Files changed:
  - `frontend/features/create/components/create-brief-shell.tsx`
  - `frontend/lib/api/http-client.ts`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Converted the create brief shell into an interactive client-side form backed by mock defaults, submitted `CreateContentBriefPayload` through `createContentBrief`, added client-side validation, workspace-scoped brand profile selection, loading/success/error states, `/drafts` navigation after create, and API base URL fallback support for `NEXT_PUBLIC_API_BASE_URL`.
- Human review status: Accepted
- QA result: Accepted with notes.
- Verification: `cd frontend && npm run typecheck` passed; `cd frontend && npm run lint` passed with the pre-existing calendar `AuditLog` warning; `cd frontend && npm run build` passed with the pre-existing root health dynamic-fetch log.
- Decision log update needed: No
- Next action: Define the minimal authenticated workspace/bootstrap path, then connect Draft Studio reads and saves to content draft APIs.

### 2026-06-05 - Codex - Mock AI Flow Fixtures (Frontend-only)

- Tool: Codex
- Request: Implement the approved first UX-validation task by adding typed frontend-only mock AI flow fixtures without rendering changes.
- Files changed:
  - `frontend/data/mock-ai-flow.ts`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Added typed fixtures for workspace validation states, brief completeness states, AI guidance loading/ready/failure, draft suggestions, mock AI failure cases, compliance scenario and fix suggestion states, and approval/audit preview entries using canonical enums and realistic IDs/timestamps.
- Human review status: Accepted
- QA result: Accepted after remediation.
- QA remediation: Removed out-of-scope `.github/agents` file additions and aligned a red compliance scenario check ID to existing canonical compliance mock IDs.
- Verification: `cd frontend && npm run typecheck` passed.
- Decision log update needed: No
- Next action: Render `mock-ai-flow` fixtures in Draft Studio UI while staying frontend-only and mock-only.

### 2026-06-05 - Codex - T-BOOT-001 Prerequisite Documentation (Management Finalization)

- Tool: Codex
- Request: Document T-BOOT-001 as a formal planning-only prerequisite for authenticated workspace/bootstrap before broader API persistence work.
- Files changed:
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Added formal tracking for T-BOOT-001 in progress and active-task memory, including prerequisite sequence (session bootstrap, active workspace resolution, workspace-scoped draft read contract, fallback behavior, and integration order).
- Human review status: Accepted
- Verification: Scoped documentation diff review and task-status consistency check across updated memory docs.
- Decision log update needed: No
- Next action: Execute the approved Draft Studio mock-render slice and keep T-BOOT-001 as the prerequisite planning track for future API-connected persistence.

### 2026-06-29 - Codex - Homepage and Django Allauth Signup/Login Flow

- Tool: Codex
- Request: Implement the homepage plan with signup, seed command, auth provider, and new package in ponytail/full mode.
- Files changed:
  - `backend/config/settings.py`
  - `backend/config/urls.py`
  - `backend/requirements/base.txt`
  - `backend/tenancy/`
  - `frontend/app/`
  - `frontend/features/auth/`
  - `frontend/features/home/`
  - `frontend/lib/api/`
  - `frontend/lib/routes.ts`
  - `frontend/types/auth.ts`
  - `frontend/styles/theme.css`
  - `docs/02_DECISIONS.md`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Added a dark luxury root homepage, login/signup pages, cookie/CSRF-aware frontend API client, django-allauth headless package/configuration, local auth/session endpoints, workspace bootstrap, and an idempotent demo seed command.
- Human review status: Pending
- Verification: `cd backend && DATABASE_URL=sqlite:////tmp/theluxe-auth-test.sqlite3 .venv/bin/python manage.py test tenancy` passed; `cd frontend && npm run typecheck` passed; `cd frontend && npm run lint` passed with the pre-existing calendar warning; `cd frontend && npm run build` passed outside the sandbox.
- Decision log update needed: Yes, D-0007 added.
- Next action: Rebuild Docker, run `make migrate`, run `make manage cmd="seed_demo"`, and manually verify homepage -> auth -> dashboard.

### 2026-07-01 - Codex - Ponytail Cleanup Pass

- Tool: Codex
- Request: Apply the ponytail audit changes and verify with Docker.
- Files changed:
  - `backend/requirements/base.txt`
  - `infra/docker-compose.yml`
  - `backend/config/settings.py`
  - `backend/llm/`
  - `frontend/`
  - `scripts/`
  - `AGENTS.md`
  - `README.md`
  - `docs/01_ARCHITECTURE.md`
  - `docs/02_DECISIONS.md`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Removed unused queue/storage/data dependencies and services, deleted the empty `llm` scaffold, removed unimplemented Settings navigation, cut UI-only brand asset comments and voice-score surfaces, deleted unused mock wrappers/default SVGs/memory scripts, and cleared the existing frontend lint warning.
- Human review status: Pending
- Verification: `make dev-check` passed; `make dev` rebuilt and started the Docker stack; `make test-be` passed with 79 tests; `docker exec infra-frontend-1 npm run typecheck`, `docker exec infra-frontend-1 npm run lint`, and `docker exec infra-frontend-1 npm run build` passed.
- Decision log update needed: Yes, D-0003 wording updated.
- Next action: Continue with Docker-verified homepage/auth runtime validation and Draft Studio persistence.

## Entry Template

### YYYY-MM-DD - Tool - Task Title

- Tool:
- Request:
- Files changed:
- Summary:
- Human review status: Pending | Accepted | Rejected | Revised
- Verification:
- Decision log update needed: Yes | No
- Next action:

## Review Status Meanings

- Pending: AI output has not been reviewed by a human yet.
- Accepted: Human accepted the change as-is.
- Revised: Human accepted after manual or AI-assisted edits.
- Rejected: Human rejected the change or reverted it.
