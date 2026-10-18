# Next Actions

Updated 2026-10-18. This is the engineering handoff, not a substitute for GitHub Issues. The approved MVP planning baseline is the confidential `THE_LUXE_MVP_Technical_Feasibility_EU_Ready_Plan_FINAL_POLISHED.docx` (dated 2026-08-10, founder-confirmed 2026-10-16; SHA-256 `771ec02713b6a75a3015db06fd84018ac0181e40e60d98d4be912e1e0a8144ec`). The August 12 Technical Decision Record Revision 1.1 is a technical reference, not a later product approval.

## Current Project State

- Current fetched `origin/master` remains `c6d3e44`: uploader repair PR55, IA-1 backend PR56 and visual foundation PR59 are merged. PR60, the documentation correction, is still open. Preserve the historical divergent local master; never force-align or push it blindly.
- Backend #52 is closed/Done. Workspace-scoped Project, ContentItem, append-only ExecutionCheckpoint, revision/idempotency and explicit BrandVoiceApproval APIs are available. Activation is not approval; each item pins its exact version.
- [PR61](https://github.com/harmonie-joy/Luxe/pull/61) implements #53 / Stage 3D PR2 on `feat/53-ia1-frontend` in `/tmp/theluxe-ia1-frontend`. Code tip `2521574`; implementation/review commits are in the [review report](ux/PR61_IMPLEMENTATION_REVIEW.md). It is pending PR/founder acceptance, not merged progress.
- Creator Home reads the real active-Workspace queue. Creation selects/creates a Project, reviews/explicitly accepts an exact active voice and persists one item. `/content-items/[id]` restores the pinned context and supports focused snapshot saves, conflicts, retry UUIDs and unsaved-change protection. No IA-1 mock fallback; title and bindings remain fixed after creation; only idea/drafting are available.
- Independent Standards and Spec QA accepted with notes and no remaining findings after fixes. Founder Page10A design acceptance and the broader Page9 density/navigation adaptations remain pending. All 15 logical Builder pages are not complete. Public homepage/PR3 and deployment are unchanged.
- #53 remains open/In Progress for acceptance. #51, #54, #58, #49 and Internal Alpha milestone #4 remain open. Component/synthetic browser tests do not complete #51 AC8 or #54.

## Current Best Next Task

Review PR61 against [UX baseline revision1](ux/UX_BASELINE.md), the [screen matrix](ux/SCREEN_TRACEABILITY.md), its [actual captures/API/QA report](ux/PR61_IMPLEMENTATION_REVIEW.md) and fresh CI. Obtain founder acceptance of the provisional bounded Page10A overview/focused editor. PR59's merge alone did not accept its typography/card density/mobile drawer adaptations. PR60 stays independently reviewable; do not import its old “#53 not begun” handoff over this implementation.

After PR61 acceptance/merge, implement [#54](https://github.com/harmonie-joy/Luxe/issues/54) as a separate real-backend browser verification slice. Use the exact handoff in the report: isolated synthetic data; real UI review/acceptance; Project/item creation; checkpoint edits/save; refresh; logout/login; queue/deep-link restore; pinned voice and revision assertions; second-Workspace isolation and honest outage handling. No mocked IA-1 responses. Keep #51/milestone4 open until their own gates are accepted. Stop this #53 assignment after review delivery; do not start #54, PR3 or deployment automatically.

## Development Environment and Evidence

- The prepared #53 branch started clean at `c6d3e44d2fd5d1df8aa656200c9a672aef5e7c97`. Current master was fetched again before handoff and is unchanged. SSH authentication fails here; use GitHub CLI's HTTPS credential helper for authorized fetch/push.
- Original `/home/mario/the-luxe/theluxe` preserves local history and untracked planning references. Existing backend/uploader/spec/docs/visual worktrees remain unrelated and preserved. The temporary #53 implementer worktree can be removed after its reviewed commits are integrated; retain the user-designated integration worktree.
- Dependencies were reused without package/lock changes. Local checks used the original backend virtualenv via a temporary symlink and a throwaway SQLite database. Local SQLite skips four PostgreSQL-only tests; it does not prove concurrent PostgreSQL behavior. Backend PR56's PostgreSQL CI remains separate evidence.
- Final #53 local commands: `make check TEST_DATABASE_URL=sqlite:////tmp/theluxe-53-check.sqlite3` passed frontend lint/typecheck, 103 frontend tests and 174 backend tests (4 skips); `cd frontend && npm run build` passed; `PLAYWRIGHT_PORT=3110 npm run test:smoke` passed 27 tests against the local production build. Browser API/session responses are synthetic. Independent production history probing also passed. This is not #54 or a public deployment.
- Captures in `docs/screenshots/stage3d-pr2/` use synthetic QA identity/content. Desktop1440×900, mobile390×844, narrow320px and 720px CSS layout equivalent to 200% desktop zoom were checked, along with keyboard, focus, contrast regressions, reduced motion, asset/console errors and overflow. No full assistive-technology audit, Firefox/WebKit matrix or formal performance benchmark was run.
- For real local services, inspect Makefile and `infra/docker-compose.yml`, then use `make dev` / `make ps` where Docker is available. No new hosting or backend test infrastructure was added for #53.

## Contract and Remaining Risks

- New items require an active, human-accepted exact BrandVoice. Voice-list responses lack approval data; creation truthfully shows unverified until deliberate idempotent acceptance. Resume context supplies actual `isApproved`. No broader Creator DNA proposal workflow is implemented.
- Checkpoint retries keep snapshot and UUID; both 409 codes retain input and require explicit reconciliation. An old exact acknowledgment is compared with current context. Initial Project/item creation is not idempotent: block duplicate pending requests, never automatically retry ambiguous outcomes, and reconcile saved lists before another attempt. Exactly-once initial creation across sessions is not promised.
- Unsaved edits live in component state, with link/refresh/history/discard warnings. There is no offline/browser-crash recovery or persistent browser draft storage. The inert root bootstrap tracks only history metadata so Back/Forward cancellation can preserve the correct item.
- Page10A is explicitly unfinished in the private source. Its current night overview/focused editor is a provisional IA-1 composition, not acceptance of the full media/message/review/ready layout. Larger inherited titles, tall creation cards, stacked mobile cards and drawer navigation require founder acceptance. No baseline revision or approval was invented.
- Confidential UX PDF remains the local verified reference at `temp/THE_LUXE_Mario_Spec.pdf.pdf` in the original workspace (physical31 preferred night;33–34 logic;35 unfinished dashboard). Keep it, the DOCX and raw renders out of Git. Durable private archival remains pending under baseline governance.
- Preserve additive backend migrations after user writes; no rollback or migration change occurred here. Full workspace management, automatic audit logging and real AI/publishing orchestration remain separate backend/product concerns.

## Do Not Start Yet

Do not implement #54 within #53, or add WorkOS, CreatorDNAProposal, Gallery, Media Finalizer, caption/version comparison, direct LinkedIn publishing, production hosting or another agent/state framework. Do not claim #58/#49/#51/milestone4 complete. PR3 company visibility/preview readiness remains separate; no deployment is authorized.

## Next Coding Agent Handoff

> Once PR61 is accepted/merged, fetch current remote master into a fresh isolated #54 branch. Read issue54, issue51 AC1–AC8, merged PR56/PR61, UX baseline/matrix and the exact real-browser handoff in `docs/ux/PR61_IMPLEMENTATION_REVIEW.md`. Use a reproducible isolated real backend database and synthetic authorized identities. Drive exact-version human acceptance through the UI, create Project/item, save every IA-1 field, refresh, log out/in, and resume from queue/deep link. Assert persisted values/revision/checkpoint/pinned voice; verify a second Workspace cannot list/read/mutate it and outage never becomes examples. Do not mock IA-1 endpoints or use real founder data. Record browser/backend evidence independently from #53 synthetic tests. Keep #51 and milestone4 open until their own acceptance. No PR3, broader Creator OS or deployment scope.
