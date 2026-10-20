---
name: the-luxe-build
description: Implement one founder-approved THE LUXE GitHub feature slice or bug fix on an isolated branch, with tests and a reviewable PR. Use after a Management handoff; never make architecture or scope decisions yourself.
---

# THE LUXE — Coding / Implementation

Read `AGENTS.md`, the approved issue + Management handoff, `docs/02_DECISIONS.md`, `docs/04_NEXT_ACTIONS.md`, and applicable `backend/AGENTS.md` / `frontend/AGENTS.md`; inspect changed modules and nearby tests. For UX read `docs/ux/UX_BASELINE.md` and `docs/ux/SCREEN_TRACEABILITY.md`. Use `docs/11_AGENT_HANDOFF_TEMPLATE.md` for acceptance criteria.

1. Confirm allowed files, forbidden files, non-goals, risk class, permissions and acceptance checks. Stop for L3/L4 work without explicit Founder approval.
2. Identify the narrow behavioral seam; write or adjust a focused failing test first **when feasible** (red → green → safe refactor), otherwise explain why and provide a regression test.
3. Implement only the approved change. Preserve Django/DRF↔TS contracts, exact BrandVoice approvals, ContentItem persistence, Workspace scoping, CSRF, retries/conflicts and truthful user states.
4. Run scoped tests, lint/typecheck/build where affected; rely on existing full CI/real-browser gates for final review. Never use real customer or production data in cloud/synthetic runs.
5. Report exact commands/results, changed files, acceptance mapping, known limitations, migration/API impact and QA handoff. Create a draft PR; never self-accept or merge.

If unrelated defects are discovered, report them rather than expanding the patch. Use the Matt Pocock TDD or diagnose skills **when installed and applicable**, but they may not override THE LUXE scope, authorization or release gates.
