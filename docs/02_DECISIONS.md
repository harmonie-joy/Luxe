# Technical Decisions

## Decision Log

| ID | Date | Status | Decision | Rationale | Source |
| --- | --- | --- | --- | --- | --- |
| D-0001 | 2026-06-05 | Accepted | Use Workspace as the MVP tenant root. | Existing root instructions explicitly say not to introduce a parallel Organization model unless requested. | `AGENTS.md` |
| D-0002 | 2026-06-05 | Accepted | Use a Markdown-first repo memory system for the management agent. | The blueprint recommends repo-native memory first and defers dashboards, vector DBs, and autonomous orchestration. | `prompts/agent-creation.md` |
| D-0003 | 2026-06-05 | Accepted | Keep real AI provider integrations out of the MVP implementation until explicitly requested. | The current repo keeps `llm` scaffold-only and protects proprietary AI/compliance logic during validation. | `AGENTS.md`, `docs/mvp-progress-report.md` |
| D-0004 | 2026-06-05 | Accepted | Keep publishing integrations out of scope until scheduled content and approvals are stable. | Calendar and approval workflow need to be persisted before external publishing creates more operational risk. | `AGENTS.md`, `docs/mvp-progress-report.md` |
| D-0005 | 2026-06-05 | Accepted | Use shared frontend domain types in `frontend/types/` and backend `TextChoices` enum strings as the canonical contract. | The repo already aligns most enum values across Django models, serializers, TypeScript types, and mock data. | `AGENTS.md`, `frontend/types/`, `backend/*/models.py` |
| D-0006 | 2026-06-05 | Accepted | Keep authenticated workspace/bootstrap definition as a prerequisite planning track before broader API-connected Draft Studio persistence. | Persistence work depends on deterministic active workspace resolution, workspace-scoped reads, and clear fallback behavior; sequencing this first reduces integration churn and scope risk. | `docs/04_NEXT_ACTIONS.md`, `docs/03_PROGRESS_LOG.md` |

## Decision Entry Template

### D-0000: Decision Title

- Date:
- Status: Proposed | Accepted | Superseded
- Context:
- Decision:
- Consequences:
- Related files:
- Follow-up actions:

## Decision Triggers

Update this file when a task changes:

- tech stack
- tenant model
- data model
- auth model
- deployment strategy
- AI provider strategy
- compliance approach
- pricing or product packaging
- MVP scope
- integration strategy
