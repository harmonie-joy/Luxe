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

### 2026-07-01 - Codex - Local-First AI Orchestration Foundation

- Tool: Codex
- Request: Add the backend AI orchestration foundation using the existing `llm` app, local-first provider settings, MockProvider tests, optional Ollama support, and GitHub task tracking.
- Files changed:
  - `AGENTS.md`
  - `backend/config/settings.py`
  - `backend/requirements/base.txt`
  - `backend/llm/`
  - `docs/00_PROJECT_BRIEF.md`
  - `docs/01_ARCHITECTURE.md`
  - `docs/02_DECISIONS.md`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Added `AIRun` tracking, Pydantic result schemas, deterministic mock AI provider support, optional Ollama HTTP provider support through `requests`, service functions for four MVP AI tasks, settings for `AI_PROVIDER`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL`, and backend tests that prove success and failure runs are recorded without calling a real provider.
- Human review status: Pending
- Verification: GitHub issue #8 created; `docker exec infra-backend-1 python manage.py check` passed; `docker exec infra-backend-1 python manage.py makemigrations --check --dry-run` passed; `make test-be` passed with 82 tests.
- Decision log update needed: Yes, D-0008 added.
- Next action: Approve the backend API contract before wiring these AI services into user-facing workflows.

### 2026-07-01 - Codex - T-AI-002 Brand Voice Extraction API Contract

- Tool: Codex
- Request: Implement the backend-only `POST /api/ai/brand/extract/` contract using the existing local-first AI foundation and create/update the GitHub task first.
- Files changed:
  - `backend/config/urls.py`
  - `backend/llm/serializers.py`
  - `backend/llm/services.py`
  - `backend/llm/tests.py`
  - `backend/llm/urls.py`
  - `backend/llm/views.py`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Created GitHub issue #9, added an authenticated brand voice extraction endpoint, validated workspace/profile/asset ownership, reused the mock-backed local AI service, returned `aiRunId` plus schema-valid suggestions, and kept `BrandProfile` unchanged until an explicit save flow exists.
- Human review status: Pending
- Verification: `make test-be` passed with 88 backend tests.
- Decision log update needed: No. This implements D-0008 without changing AI provider strategy.
- Next action: Connect Brand Voice Setup UI to the extraction endpoint with confirmation-gated profile updates.

### 2026-07-01 - Codex - T-AI-003 Brand Voice AI Suggestions Panel

- Tool: Codex
- Request: Add a frontend Brand Voice AI suggestions panel on `/brand-voice`, backed by the T-AI-002 endpoint in API mode and deterministic local suggestions in mock mode.
- Files changed:
  - `frontend/app/(app)/brand-voice/page.tsx`
  - `frontend/data/mock-brand-profiles.ts`
  - `frontend/features/brand-voice/components/brand-voice-ai-panel.tsx`
  - `frontend/features/brand-voice/data/get-brand-voice-setup.ts`
  - `frontend/lib/api/ai.ts`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Created GitHub issue #10, added a typed AI API helper, added sample selection and analysis UI, rendered brand voice suggestions, preserved mock fallback behavior, and added confirmation-gated profile updates through the existing BrandProfile update API.
- Human review status: Pending
- Verification: `cd frontend && npm run typecheck` passed; `cd frontend && npm run lint` passed; `cd frontend && npm run build` passed outside the sandbox after the known Turbopack internal port-binding restriction.
- Decision log update needed: No. This implements D-0008 without changing AI provider strategy.
- Next action: Connect Draft Studio reads/saves to the existing content draft APIs.
### 2026-07-01 - Codex - T-AI-004 AI Draft Generation API

- Tool: Codex
- Request: Implement backend-only `POST /api/ai/drafts/generate/` using the local-first AI service layer and create the GitHub task first.
- Files changed:
  - `backend/llm/serializers.py`
  - `backend/llm/services.py`
  - `backend/llm/tests.py`
  - `backend/llm/urls.py`
  - `backend/llm/views.py`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Created GitHub issue #12, added an authenticated AI draft generation endpoint, validated workspace membership and brief/channel scope, used the mock-backed local draft generation service, upserted one `ContentDraft` per requested channel, preserved existing draft creator attribution on regeneration, and returned generated draft records with `AIRun` IDs.
- Human review status: Pending
- Verification: `DATABASE_URL=sqlite:////tmp/theluxe-ai-draft-test.sqlite3 .venv/bin/python manage.py test llm content` passed with 52 tests. `make test-be` was attempted but blocked by Docker API permissions in the sandbox.
- Decision log update needed: No. This implements D-0008 without changing AI provider strategy, data model strategy, or MVP scope.
- Next action: Run `make test-be` in a Docker-enabled shell, then connect Draft Studio to the draft generation endpoint and existing content draft read/save APIs.

### 2026-07-01 - Codex - T-AI-005 Draft Studio AI Generation UI

- Tool: Codex
- Request: Connect Draft Studio to the backend AI Draft Generation API so users can generate persisted drafts, review returned drafts, and save edits through existing content draft APIs.
- Files changed:
  - `frontend/features/drafts/components/draft-studio-shell.tsx`
  - `frontend/features/drafts/data/get-draft-studio-page.ts`
  - `frontend/lib/api/ai.ts`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Created GitHub issue #14, added a typed `generateDrafts()` helper, connected Draft Studio to live session/brief/draft loading in the browser, added Generate Drafts for the current brief target channels, refreshed persisted draft records after generation, saved title/content edits through `updateContentDraft`, preserved mock fallback for unavailable API data, and removed the stale duplicate Brand Voice Ready row from Next Actions.
- Human review status: Pending
- Verification: `cd frontend && npm run typecheck` passed; `cd frontend && npm run lint` passed; `cd frontend && npm run build` passed outside the sandbox after the known Turbopack port-binding sandbox failure.
- Decision log update needed: No. This implements D-0008 without changing AI provider strategy, data model strategy, or MVP scope.
- Next action: Connect Compliance Review to persisted compliance checks and issues.

### 2026-07-01 - Codex - T-UX-001 Clarify Brief and Draft Workflow

- Tool: Codex
- Request: Clarify Brief -> Draft workflow UX before continuing to Compliance Review.
- Files changed:
  - `frontend/app/(app)/drafts/page.tsx`
  - `frontend/features/create/components/create-brief-shell.tsx`
  - `frontend/features/drafts/components/draft-studio-shell.tsx`
  - `frontend/lib/routes.ts`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Created GitHub issue #16, routed newly created briefs to `/drafts?brief=<id>`, read the `brief` query parameter in Draft Studio, added a Current Brief section and brief selector, clarified Brief versus Draft copy, renamed the main workflow sections, added no-draft and regeneration states, and preserved generation/save/mock fallback behavior.
- Human review status: Pending
- Verification: `cd frontend && npm run typecheck` passed; `cd frontend && npm run lint` passed; `cd frontend && npm run build` passed outside the sandbox after the known Turbopack port-binding sandbox failure.
- Decision log update needed: No. This is frontend UX clarification only.
- Next action: Connect Compliance Review to persisted compliance checks and issues.

### 2026-07-01 - Codex - T-UX-002 Delete Brief Destructive Action

- Tool: Codex with GitHub connector and ponytail workflow
- Request: Add a safe destructive Delete Brief action to Draft Studio and create the GitHub issue before implementation.
- Files changed:
  - `frontend/lib/api/content-briefs.ts`
  - `frontend/features/drafts/components/draft-studio-shell.tsx`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Created GitHub issue #18, added `deleteContentBrief(id)`, added a destructive Current Brief delete button and confirmation dialog with cascade warning copy, called backend DELETE in API mode, preserved demo fallback, cleared deleted-brief drafts, switched to another brief when available, and routed to `/create` when no briefs remain.
- Human review status: Pending
- Verification: `cd frontend && npm run typecheck` passed; `cd frontend && npm run lint` passed; `cd frontend && npm run build` passed.
- Decision log update needed: No. Existing backend delete and cascade contracts were reused without model or architecture changes.
### 2026-07-01 - Codex - T-AI-006 Real Local Ollama Draft Generation with Brand Voice

- Tool: Codex
- Request: Make AI draft generation use real local Ollama calls with ContentBrief and linked BrandProfile context while preserving the existing Draft Studio generation contract.
- Files changed:
  - `backend/config/settings.py`
  - `backend/llm/providers.py`
  - `backend/llm/services.py`
  - `backend/llm/tests.py`
  - `backend/llm/views.py`
  - `docs/03_PROGRESS_LOG.md`
  - `docs/04_NEXT_ACTIONS.md`
  - `docs/05_AI_WORK_LOG.md`
- Summary: Created GitHub issue #20, changed draft generation to pass the full ContentBrief and linked BrandProfile voice context into provider prompts and `AIRun.input_data`, required `OLLAMA_MODEL` when `AI_PROVIDER=ollama`, kept `MockProvider` as the automated-test default, and preserved the `POST /api/ai/drafts/generate/` response contract.
- Local Ollama setup: run `ollama list`, copy the exact model name, set `AI_PROVIDER=ollama`, set `OLLAMA_MODEL=<model-name>`, and use `OLLAMA_BASE_URL=http://host.docker.internal:11434` when the backend runs in Docker while Ollama runs on the host.
- Human review status: Pending
- Verification: `DATABASE_URL=sqlite:////tmp/theluxe-ai-006-test.sqlite3 .venv/bin/python manage.py test llm content` passed with 54 tests; `make test-be` passed with 98 backend tests.
- Decision log update needed: No. This implements D-0008 without changing AI provider strategy.
- Next action: Connect Compliance Review to persisted compliance checks and issues.

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
