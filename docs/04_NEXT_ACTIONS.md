# Next Actions

Updated 2026-10-17. This is the engineering handoff, not a substitute for GitHub Issues. The approved MVP planning baseline is the confidential `THE_LUXE_MVP_Technical_Feasibility_EU_Ready_Plan_FINAL_POLISHED.docx` (dated 2026-08-10, founder-confirmed 2026-10-16; SHA-256 `771ec02713b6a75a3015db06fd84018ac0181e40e60d98d4be912e1e0a8144ec`). The August 12 Technical Decision Record Revision 1.1 is a technical reference, not a later product approval.

## Current Project State

- `origin/master` includes uploader repair [PR #55](https://github.com/harmonie-joy/Luxe/pull/55) (`7a292d5`) and IA-1 backend [PR #56](https://github.com/harmonie-joy/Luxe/pull/56) (`3313c3b`). The original local `master` retains historical documentation commit `a7e62f2` and must not be force-aligned or pushed blindly.
- Backend [issue #52](https://github.com/harmonie-joy/Luxe/issues/52) is closed/Done with CI evidence. The implementation branch `ia1/52-backend` in `/tmp/theluxe-ia1` remains preserved; it is not the next feature branch.
- #49, #51, #53, #54, #38 and Internal Alpha milestone #4 remain open. Stage 3D [#58](https://github.com/harmonie-joy/Luxe/issues/58) is In Progress; visual foundation [draft PR #59](https://github.com/harmonie-joy/Luxe/pull/59) is implemented and independently reviewed, awaiting founder design acceptance and merge. Functional frontend IA-1 and persisted browser verification have not begun.
- Backend implements workspace-scoped Project, ContentItem, append-only ExecutionCheckpoint, revision and idempotency handling, restore API, and explicit version-specific BrandVoiceApproval. Activation alone is not acceptance; a ContentItem pins a version.

## Current Best Next Task

Review [PR #59](https://github.com/harmonie-joy/Luxe/pull/59) for founder design acceptance, then merge only after the review gates pass. It implements PR 1 of the approved [Stage 3D spec #58](https://github.com/harmonie-joy/Luxe/issues/58): preferred night tokens, real-session shell/identity, compact mobile navigation, responsive Creator Home, three honest unavailable creation cards and a resume section that explicitly does not display saved posts. Brand Voice/Draft Studio routes remain; static Calendar/Compliance examples are labeled. All 15 logical Builder pages are not complete.

After PR 1 lands, implement [#53 — IA-1 frontend create/resume](https://github.com/harmonie-joy/Luxe/issues/53) as PR 2 on current remote master. Create the ContentItem new/detail routes and helpers together; their unused URLs were deliberately deferred from PR 1. Use the merged Project/ContentItem/context/checkpoint and BrandVoice approval APIs for explicit version-specific acceptance, real list/create/resume, save status, conflicts and retained local edits. Title is read-only after create; stage is idea/drafting. Checkpoint retries use the same UUID and snapshot; initial create is not idempotent and must not be automatically retried after an uncertain response. #54 remains independent real-backend refresh/logout/re-login/isolation verification; neither #51 nor milestone #4 is complete. PR 3 public homepage/preview readiness remains separate; no deployment is authorized by PR 1.

## Development Environment

- Start #53 from a fresh branch/worktree at current `origin/master`, not the historical local `master`. `/tmp/theluxe-ia1` and `/tmp/theluxe-spec0` preserve the reviewed backend and repair branches; `/home/mario/the-luxe/theluxe` preserves the original local history and three untracked planning artifacts. Do not stage the confidential DOCX/PDF files.
- For local services, use `make dev` and `make ps`; inspect `Makefile` and `infra/docker-compose.yml` before starting containers. The WSL environment previously lacked a usable local PostgreSQL server and Docker socket, so SQLite results do not establish concurrent PostgreSQL behavior.
- Verify #53 with focused frontend tests, typecheck, lint, and `make check`; #54 must run a real backend-connected browser flow. CI run `39068049872` passed backend tests (including real PostgreSQL concurrency) and frontend lint/typecheck/unit/build/smoke for PR #56. The isolated backend worktree lacks `.venv` and `node_modules`; prepare dependencies for a new worktree before using Make targets.
- GitHub CLI authentication has `repo`, `project`, and `workflow` scopes. GitHub HTTPS operations require its credential helper because SSH authentication fails in this environment.
- PR 1 worktree: `/tmp/theluxe-visual-foundation`, branch `feat/stage3d-visual-foundation`, base `64ea445`, implementation `ab2b8ce`, review fixes `d5acbc8`. The existing frontend dependencies were copied without lockfile changes; backend checks reused the original virtualenv. Port 3100 was used for isolated browser QA because another local frontend occupied 3000; it is not a new deployment target.
- Pending docs commit `92285a2` is preserved separately in `/tmp/theluxe-stage3d` on `spec/stage-3d-creator-preview`; it is not merged or included in PR 1. Its approved spec facts are reflected here; reconcile its planning-only status before any later integration.
- Confidential UX reference is in the original workspace at `temp/THE_LUXE_Mario_Spec.pdf.pdf`. Logical Page 9 preferred night desktop/mobile is physical page 31; Page 10 logic is physical pages 33–34; Page 10A dashboard is physical page 35 and marked unfinished. Read locally; never stage the source or raw images. Committed application screenshots contain only synthetic QA identity/data.
- PR 1 local checks: `make check` passed 78 frontend and 174 backend tests (4 PostgreSQL-only skips), production build passed, 17 Playwright checks passed against the production build. Browser coverage is synthetic navigation/visual QA, not #54; no benchmark or full assistive-technology audit was performed. Screenshot links and the independent two-axis review outcome are in PR #59 and the progress log.

## Unresolved Decisions and Risks

- Backend PostgreSQL concurrency and two-axis review are complete; the activation race was fixed in `bf441c8`. #53 still needs an explicit human review/acceptance interaction. Historical active voices remain unapproved until an authorized user accepts the exact version.
- Do not reverse additive migrations after user writes without a backup and forward-fix plan. No global CreatorContext-versus-multi-brand identity decision was made.
- Review note: `BrandVoiceApproval` follows its voice on intentional deletion; no public voice-delete endpoint exists. Preserve audit evidence for retained voices, while allowing deliberate workspace erasure under the eventual data-deletion policy.

## Do Not Start Yet

Do not implement #54 until its separate verification slice, or add WorkOS, CreatorDNAProposal, Gallery, Media Finalizer, direct LinkedIn publishing, production hosting, or a new agent framework to #53. Do not promote mock data as persisted production state.

## Next Coding Agent Handoff

> After visual-foundation PR #59 is accepted and merged, fetch current remote master and create a fresh isolated branch for #53, PR 2 of #58. Read the approved spec, merged backend PR #56 and the Mario PDF's logical Pages 10/10A. Reuse the new shell/tokens and implement only the real Project/ContentItem create/list/context/checkpoint UI, stable item routes, explicit human acceptance of the selected active BrandVoice version, focused Single-Post Dashboard, accurate save status, safe snapshot/UUID retries, 409 handling and retention of local input. Respect backend field/stage/permission limits and never substitute mock items. Use the already confirmed HTTP-boundary component/API tests, run lint/typecheck/unit/build/smoke and `make check`, capture responsive screens and prepare a separate reviewable PR. Keep #51/#54/milestone #4 open; #54 independently proves real persistence and tenant isolation. Do not begin PR 3 or deploy publicly. Preserve original local history, all other worktrees and confidential documents.
