# AI Team Operating Model

## Purpose

THE LUXE uses a small AI development team to coordinate product development safely.

The repo is the source of truth. Agents must use project memory files before making implementation decisions.

This is a lightweight documentation and prompt workflow only. It does not introduce an autonomous agent platform, runtime orchestration, new dependencies, or application architecture changes.

## Core Agents

| Agent | Main Responsibility |
|---|---|
| Management Agent | Coordinates tasks, checks project memory, creates task briefs, manages approvals, updates logs. |
| Coding Agent | Implements approved coding tasks only. |
| QA Agent | Reviews implementation quality, tests, regression risk, documentation, and scope control. |

## Agent Roles

- Management Agent scopes tasks, reads memory, assigns risk, prepares handoff, coordinates approvals, gives QA instructions, and updates docs.
- Coding Agent implements approved scoped tasks only, with no unrelated rewrites, dependency changes, or architecture changes.
- QA Agent reviews the diff, tests, risks, scope control, security/privacy impact, and documentation before acceptance.

## Source of Truth

Agents must read:

- `AGENTS.md`
- `prompts/management-agent.md`
- `docs/00_PROJECT_BRIEF.md`
- `docs/01_ARCHITECTURE.md`
- `docs/02_DECISIONS.md`
- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`
- `docs/mvp-progress-report.md`
- `docs/prototype-audit.md`
- `docs/the_luxe_data_model_source_of_truth.md`

Task-specific agents should also read the relevant backend/frontend `AGENTS.md`, app files, shared types, mock data, API clients, tests, or docs before proposing or changing anything in that area.

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

Use `docs/11_AGENT_HANDOFF_TEMPLATE.md` for Management Agent handoff from scoping to Coding Agent implementation and QA Agent review.

## Risk Levels

| Level | Meaning | Approval |
|---|---|---|
| L0 | Documentation-only change | No founder approval required |
| L1 | Localized code change | No approval required if scope is clear |
| L2 | Cross-module feature or integration | Management review required |
| L3 | Database, auth, security, compliance, AI provider, or deployment change | Founder approval required |
| L4 | Product positioning, architecture pivot, funding/IP/legal decision | Founder approval required |

## Approval Rules

- L3 and L4 tasks require explicit Founder/CTO approval.
- Approval must name the accepted scope, files or areas likely to change, risk level, and required verification.
- Absence of rejection is not approval for L3 or L4 work.
- If a task grows beyond its approved scope, pause and return to the Management Agent for re-scoping.
- Architecture, data model, auth, security, compliance, deployment, AI provider, funding, IP, or legal-positioning changes must not be smuggled into lower-risk tasks.

## Coding Rules

- Do not rewrite unrelated code.
- Do not create duplicate systems.
- Do not add dependencies unless justified.
- Do not change the data model without checking `docs/the_luxe_data_model_source_of_truth.md`.
- Do not change architecture without updating `docs/02_DECISIONS.md`.
- Do not store secrets in the repository.
- Do not claim legal compliance certification.
- Coding Agent must not implement outside approved scope.
- Do not modify application code during documentation-only tasks.
- Do not add dependencies unless explicitly approved.
- Do not change package files or lock files unless explicitly approved.
- Do not add real AI, publishing, authentication, billing, or deployment integrations unless explicitly approved.

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

QA Agent must review before acceptance.

## Founder Control

The Founder/CTO remains the final authority for:

- Architecture pivots
- Database schema changes
- Auth/security changes
- Compliance logic
- AI provider changes
- Funding/IP/product positioning decisions

## Founder/CTO Control Rules

The Founder/CTO also controls:

- Product positioning and MVP scope.
- Database schema changes and migrations.
- Auth, roles, security, and privacy changes.
- Compliance logic and legal-positioning language.
- AI provider strategy and real AI integrations.
- Deployment strategy and production operations.
- Funding, IP, pricing, or legal-positioning decisions.

## Documentation Updates

After accepted work, the Management Agent updates or proposes updates to:

- `docs/03_PROGRESS_LOG.md`
- `docs/04_NEXT_ACTIONS.md`
- `docs/05_AI_WORK_LOG.md`
- `docs/02_DECISIONS.md` if the task changed architecture, data model, scope, auth, AI, compliance, integration strategy, deployment, product positioning, funding, IP, or legal posture.
