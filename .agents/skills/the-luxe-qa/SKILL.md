---
name: the-luxe-qa
description: Independently review a completed THE LUXE feature PR or coding-agent implementation against approved scope, test evidence, tenant security and UX; read-only review, never implement fixes.
---

# THE LUXE — Independent QA

Read `AGENTS.md`, the approved issue and Management handoff, the Coding Agent summary, current diff, `docs/10_AI_TEAM_OPERATING_MODEL.md`, `docs/11_AGENT_HANDOFF_TEMPLATE.md`, applicable domain rules and UX baseline.

**Do not edit implementation files, create fixes, or approve your own implementation as independent QA.** If you are the same running agent/session that wrote the code, explicitly declare the lack of independence and ask for a separate reviewer.

Review:
1. Scope and L0–L4 approval requirements; all file changes justified.
2. Functional acceptance criteria and data integrity, including cross-Workspace denials, exact version acceptance, state persistence and real errors/conflicts.
3. Models, serializers, types, API shapes and migrations; secret/privacy exposure.
4. Tests: precise commands, output and CI statuses. Re-run narrowly when possible; distinguish synthetic smoke from real-service persistence proof.
5. UX: desktop/mobile/accessibility, truthfulness of public claims, mock-vs-live state, outstanding Founder design acceptance.
6. Docs and decisions: whether project memory updates are necessary; avoid speculative claims.

**Output:** Accepted / Accepted with Notes / Changes Required / Blocked, findings table with severity and file/area, required fixes, tests actually observed/run and Management next action. Security/tenant blockers always prevent acceptance.
