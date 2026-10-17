# Next Actions

Updated 2026-10-17. This is the engineering handoff, not a substitute for GitHub Issues. The approved MVP planning baseline is the confidential `THE_LUXE_MVP_Technical_Feasibility_EU_Ready_Plan_FINAL_POLISHED.docx` (dated 2026-08-10, founder-confirmed 2026-10-16; SHA-256 `771ec02713b6a75a3015db06fd84018ac0181e40e60d98d4be912e1e0a8144ec`). The August 12 Technical Decision Record Revision 1.1 is a technical reference, not a later product approval.

## Current Project State

- `origin/master` includes uploader repair [PR #55](https://github.com/harmonie-joy/Luxe/pull/55) (`7a292d5`) and IA-1 backend [PR #56](https://github.com/harmonie-joy/Luxe/pull/56) (`3313c3b`). The original local `master` retains historical documentation commit `a7e62f2` and must not be force-aligned or pushed blindly.
- Backend [issue #52](https://github.com/harmonie-joy/Luxe/issues/52) is closed/Done with CI evidence. The implementation branch `ia1/52-backend` in `/tmp/theluxe-ia1` remains preserved; it is not the next feature branch.
- #49, #51, #53, #54, #38 and Internal Alpha milestone #4 remain open. No frontend IA-1 work or persisted browser test has been completed.
- Backend implements workspace-scoped Project, ContentItem, append-only ExecutionCheckpoint, revision and idempotency handling, restore API, and explicit version-specific BrandVoiceApproval. Activation alone is not acceptance; a ContentItem pins a version.

## Current Best Next Task

Implement [#53 — IA-1 frontend create/resume](https://github.com/harmonie-joy/Luxe/issues/53) as a separate vertical slice on a new branch from current `origin/master`. Use the merged Project/ContentItem/context/checkpoint APIs and BrandVoice approval endpoint. Show explicit human review/acceptance, create and list/empty states, save/saving/saved/error states, stale-revision reconciliation without discarding unsaved input, and pinned voice identity on resume. Follow #53's own acceptance criteria and existing design. #54 is next for a real backend-connected refresh/logout/re-login browser flow; neither #51 nor milestone #4 is complete until those gates pass.

## Development Environment

- Start #53 from a fresh branch/worktree at current `origin/master`, not the historical local `master`. `/tmp/theluxe-ia1` and `/tmp/theluxe-spec0` preserve the reviewed backend and repair branches; `/home/mario/the-luxe/theluxe` preserves the original local history and three untracked planning artifacts. Do not stage the confidential DOCX/PDF files.
- For local services, use `make dev` and `make ps`; inspect `Makefile` and `infra/docker-compose.yml` before starting containers. The WSL environment previously lacked a usable local PostgreSQL server and Docker socket, so SQLite results do not establish concurrent PostgreSQL behavior.
- Verify #53 with focused frontend tests, typecheck, lint, and `make check`; #54 must run a real backend-connected browser flow. CI run `39068049872` passed backend tests (including real PostgreSQL concurrency) and frontend lint/typecheck/unit/build/smoke for PR #56. The isolated backend worktree lacks `.venv` and `node_modules`; prepare dependencies for a new worktree before using Make targets.
- GitHub CLI authentication has `repo`, `project`, and `workflow` scopes. GitHub HTTPS operations require its credential helper because SSH authentication fails in this environment.

## Unresolved Decisions and Risks

- Backend PostgreSQL concurrency and two-axis review are complete; the activation race was fixed in `bf441c8`. #53 still needs an explicit human review/acceptance interaction. Historical active voices remain unapproved until an authorized user accepts the exact version.
- Do not reverse additive migrations after user writes without a backup and forward-fix plan. No global CreatorContext-versus-multi-brand identity decision was made.
- Review note: `BrandVoiceApproval` follows its voice on intentional deletion; no public voice-delete endpoint exists. Preserve audit evidence for retained voices, while allowing deliberate workspace erasure under the eventual data-deletion policy.

## Do Not Start Yet

Do not implement #54 until its separate verification slice, or add WorkOS, CreatorDNAProposal, Gallery, Media Finalizer, direct LinkedIn publishing, production hosting, or a new agent framework to #53. Do not promote mock data as persisted production state.

## Next Coding Agent Handoff

> In `harmonie-joy/Luxe`, create a fresh worktree/branch from current `origin/master` for issue #53. Read its acceptance criteria and merged backend PR #56. Implement the smallest creator-facing Project/ContentItem create, explicit BrandVoice review/approval, save, list, and resume UI with honest loading/error/conflict states and focused tests. Run frontend lint, typecheck, unit tests, and `make check`; prepare a reviewable PR. Leave #51/#54/milestone #4 open and do not implement unrelated features. Preserve the original local `master` and confidential untracked files.
