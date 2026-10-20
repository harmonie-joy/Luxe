# THE LUXE — GitHub Copilot adapter

Use the root `AGENTS.md` as the **shared project policy** for both GitHub Copilot (cloud and VS Code) and Codex. Do not duplicate a separate product roadmap here. The current approved product baseline, exact acceptance criteria and authorization come from `docs/02_DECISIONS.md`, `docs/04_NEXT_ACTIONS.md` and the scoped GitHub issue; read `docs/ux/UX_BASELINE.md` for UX work.

## Role workflow

- Planning → `.github/agents/management-agent.agent.md` reads `.agents/skills/the-luxe-plan/SKILL.md`.
- Coding → `.github/agents/coding-agent.agent.md` reads `.agents/skills/the-luxe-build/SKILL.md`.
- Independent review → `.github/agents/qa-agent.agent.md` reads `.agents/skills/the-luxe-qa/SKILL.md`.
- Context efficiency → `.agents/skills/the-luxe-lean-context/SKILL.md` when applicable.

Observe `docs/10_AI_TEAM_OPERATING_MODEL.md` and `docs/11_AGENT_HANDOFF_TEMPLATE.md` for risk gating and handoffs. Never self-accept or auto-merge. Founder approval is mandatory for L3/L4 work.

## Copilot Cloud specifics

- Agent runs start from a checked-out branch, not your local VS Code environment. The dependencies setup at `.github/workflows/copilot-setup-steps.yml` is **not** evidence of passing tests.
- Run narrow affected tests and report their actual outcomes; existing frontend/backend/real PostgreSQL browser GitHub Actions checks remain acceptance gates.
- Do not upload secrets, local private founder documents, production data, real creator content, or credential-bearing screenshots into cloud tasks. Use synthetic isolated fixtures.
- Local Matt Pocock plugins/skills and Ponytail hooks are **not automatically installed in Copilot Cloud**. Shared repository skills are portable procedures, not third-party runtime hooks.

For detailed local/cloud usage and third-party installation policy, see `docs/12_AGENT_HARNESS_PORTABILITY.md`.
