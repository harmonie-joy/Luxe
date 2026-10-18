# Next Actions

Updated 2026-10-18. This is the engineering handoff, not a substitute for GitHub Issues. The approved MVP planning baseline is the confidential `THE_LUXE_MVP_Technical_Feasibility_EU_Ready_Plan_FINAL_POLISHED.docx` (dated 2026-08-10, founder-confirmed 2026-10-16; SHA-256 `771ec02713b6a75a3015db06fd84018ac0181e40e60d98d4be912e1e0a8144ec`). The August 12 Technical Decision Record Revision 1.1 is a technical reference, not a later product approval.

## Current Project State

- IA-1 backend #52 and frontend #53 are merged/Done (PR56/PR61). PR62 documentation finalization merged at c5acdeb. #54 began at c5acdeb in an isolated worktree; upstream documentation advance f5f1205 was incorporated. Original local master/worktrees/references were preserved.
- [PR63](https://github.com/harmonie-joy/Luxe/pull/63) delivers #54: seven real-service browser cases against actual Next.js/Django/PostgreSQL, explicit version-specific voice approval and fresh-session persisted context recovery. The [verification report](qa/IA1_REAL_BROWSER_VERIFICATION.md) independently maps #51 AC1–AC8 and records exact commands/results, QA, CI and known limits. #54/#51 completion follows accepted evidence and merged PR63; neither synthetic tests nor voice activation alone count.
- Actual create/save/refresh/logout/fresh-login/resume, exact checkpoint UUID/full snapshot/pinned accepted voice, later activation invariance, Workspace denials, real409 conflicts, failed writes and genuine list outage have browser/API/ORM evidence. Both seven-case local runs passed. Existing Brand Voice/Draft Studio tests, production build and27 synthetic browser regressions remain separate checks.
- Independent Standards/Spec QA accepted code82c12a7 with notes and no remaining blockers. Standards' database URL override finding was fixed before acceptance;6 database-free guard checks pass. Final repository/CI evidence belongs in the report and PR, not inferred from previous CI runs.
- #49, #58 and Internal Alpha milestone #4 remain open through their own gates. All15 logical Builder pages are not complete. Founder Page9 adaptations and provisional Page10A composition remain pending despite functional acceptance.

## Current Best Next Task

After accepted #54 delivery, implement **#58 PR3: truthful company/public entry and controlled-preview readiness**, using its existing approved scope. Read #58 and the UX baseline before coding; maintain the distinction between public company information and the authenticated creator product. Do not deploy or treat preview readiness as authorization for production authentication, hosting or external integrations.

Founder Page9 typography/card density/mobile drawer acceptance and Page10A final design remain separate governance work. [UX baseline revision1](ux/UX_BASELINE.md) and [screen traceability](ux/SCREEN_TRACEABILITY.md) retain that distinction. No Harmonie design approval is inferred.

## Reproducible Verification

- Exact isolated PostgreSQL/Next/Django setup, run command and cleanup: [real-browser README](../frontend/e2e-real/README.md). Existing Playwright is reused; no new dependency/framework. Test-only database URL/opt-in guards reject unsafe targets before service startup. Real session authentication, CSRF and Workspace authorization are retained.
- Dedicated application ports3154/8154 preserve the running developer stack3000/8000. Synthetic fixture cleanup is namespace-scoped and independently verified; interrupted runs should discard the disposable database/container. Never run destructive fixtures against accounts/databases with real user data.
- `make check TEST_DATABASE_URL=<isolated PostgreSQL URL>`, production build and existing smoke are separate regression gates. `cd frontend && E2E_DATABASE_URL=<isolated PostgreSQL URL> E2E_ALLOW_ISOLATED_DATABASE=1 npm run test:e2e:real` supplies the actual persisted-browser proof. The new real-e2e CI job provisions PostgreSQL16 and runs it automatically.
- Reports use synthetic screenshots/ORM reads and credential-free HTTP method/path/status/failure timelines. Raw traces/storage state are not uploaded. Real desktop/mobile/error captures: [Stage3E](screenshots/stage3e-real/); CI artifacts retain action/expectation diagnostics. No private source documents or real creator content were added by #54.

## Contract and Remaining Risks

- Initial Project/item creation has no idempotency key. Actual identical request replay creates distinct persisted items. Pending UI submissions are guarded and uncertain outcomes demand deliberate saved-work reconciliation; a user who overlooks an existing item can still duplicate it by retrying. This is a documented non-blocking IA-1 limitation, not exactly-once creation or a broader release guarantee. Backend idempotency is separate scope if later required.
- Checkpoint writes use a full snapshot, expected revision and UUID retry key; real stale_revision and idempotency_key_reused409s preserve data/edits. Reload/discard remains deliberate; no automatic conflict merge. Unsaved edits remain component state, not offline/browser-crash recovery.
- New items require explicit human acceptance of an exact active BrandVoice. Saved items pin their version and do not follow later activation. This is neither full Creator DNA nor final post approval. Page10A is provisional; only idea/drafting checkpoints are available.
- No migration, data-model, production authentication/WorkOS, provider, publishing or deployment change is included. Private-source durable archival remains pending under baseline governance. Preserve upstream references and never infer public distribution permission from repository presence.

## Best Next Task for AI

Finish PR63's final evidence/CI/merge gates, then use a separate #58 PR3 assignment. Do not reopen #54 to implement CreatorDNAProposal, communication guides, caption/DraftVersion comparison, Gallery, Media Finalizer, WorkOS migration, LinkedIn publishing, production hosting or another state/agent framework. Keep #49/#58/milestone4 open until their own acceptance.
