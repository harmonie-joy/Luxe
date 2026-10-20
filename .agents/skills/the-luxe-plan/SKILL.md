---
name: the-luxe-plan
description: Plan or triage a THE LUXE GitHub issue, classify approval risk, produce a bounded Management-to-Coding handoff. Use before implementing features or when requirements conflict. Do not write application code.
---

# THE LUXE — Management / Scoping

Read the repository `AGENTS.md` first, then the approved issue, `docs/02_DECISIONS.md`, `docs/04_NEXT_ACTIONS.md`, `docs/10_AI_TEAM_OPERATING_MODEL.md`, and `docs/11_AGENT_HANDOFF_TEMPLATE.md`. Consult `docs/01_ARCHITECTURE.md` or UX baseline only where relevant.

1. State the existing implementation and the specific missing user behavior using source evidence; distinguish approved work from proposed ideas.
2. Identify one small vertical slice, exact non-goals, relevant files, acceptance criteria, failure cases and the narrowest tests.
3. Classify L0–L4. Obtain an explicit Founder/CTO decision for L3/L4; do not treat silence as approval. For unresolved scope, ask a focused question.
4. Prepare the handoff in `docs/11_AGENT_HANDOFF_TEMPLATE.md` format and name a separate QA reviewer. If the issue is too large, propose child issues; do not implement them.
5. Respect accepted UX and tenant/privacy invariants, and preserve existing approved design and API contracts.

**Output:** task understanding, scope, current state, decision/risk and approval status, implementation handoff, QA checklist and recommended next action. Planning mode never edits files. Documentation finalization is a separate explicit approval mode in the existing Management Agent profile.
