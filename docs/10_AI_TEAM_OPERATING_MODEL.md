# AI Team Operating Model

## Purpose

THE LUXE uses a small AI development team to coordinate product development safely.

The repo is the source of truth. Agents must use project memory files before making implementation decisions.

## Core Agents

| Agent | Main Responsibility |
|---|---|
| Management Agent | Coordinates tasks, checks project memory, creates task briefs, manages approvals, updates logs. |
| Coding Agent | Implements approved coding tasks only. |
| QA Agent | Reviews implementation quality, tests, regression risk, documentation, and scope control. |

## Source of Truth

Agents must read:

- `AGENTS.md`
- `docs/00_PROJECT_BRIEF.md`
- `docs/01_ARCHITECTURE.md`
- `docs/02_DECISIONS.md`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`
- `docs/mvp-progress-report.md`
- `docs/prototype-audit.md`
- `docs/the_luxe_data_model_source_of_truth.md`

## Task Lifecycle

1. Founder gives a task.
2. Management Agent reads project memory.
3. Management Agent creates a task brief.
4. Management Agent assigns risk level.
5. Founder approves if risk level requires approval.
6. Coding Agent implements only approved scope.
7. QA Agent reviews the implementation.
8. Coding Agent fixes QA findings if needed.
9. Management Agent updates:
   - `docs/03_PROGRESS_LOG.md`
   - `docs/04_NEXT_ACTIONS.md`
   - `docs/05_AI_WORK_LOG.md`
   - `docs/02_DECISIONS.md` if needed

## Risk Levels

| Level | Meaning | Approval |
|---|---|---|
| L0 | Documentation-only change | No founder approval required |
| L1 | Localized code change | No approval required if scope is clear |
| L2 | Cross-module feature or integration | Management review required |
| L3 | Database, auth, security, compliance, AI provider, or deployment change | Founder approval required |
| L4 | Product positioning, architecture pivot, funding/IP/legal decision | Founder approval required |

## Coding Rules

- Do not rewrite unrelated code.
- Do not create duplicate systems.
- Do not add dependencies unless justified.
- Do not change the data model without checking `docs/the_luxe_data_model_source_of_truth.md`.
- Do not change architecture without updating `docs/02_DECISIONS.md`.
- Do not store secrets in the repository.
- Do not claim legal compliance certification.

## QA Rules

QA must check:

- Scope control
- Type safety
- Error handling
- Loading, empty, and failure states
- Test or manual verification steps
- Regression risk
- Security/privacy risk
- Documentation updates
- Decision-log requirements

## Founder Control

The Founder/CTO remains the final authority for:

- Architecture pivots
- Database schema changes
- Auth/security changes
- Compliance logic
- AI provider changes
- Funding/IP/product positioning decisions