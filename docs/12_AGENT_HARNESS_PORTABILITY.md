# Shared Coding-Agent Workflow — Codex and GitHub Copilot

Status: developer workflow guidance only. This is **not** an approved change to THE LUXE product architecture, auth, hosting, models or deployment.

## One repository, one knowledge base

- Always-on policies: `AGENTS.md` (root) plus scoped `backend/AGENTS.md` or `frontend/AGENTS.md`.
- Product authority: `docs/02_DECISIONS.md`, `docs/04_NEXT_ACTIONS.md`, the approved GitHub issue and current UX/source baselines. `docs/03_PROGRESS_LOG.md` and `docs/05_AI_WORK_LOG.md` preserve accepted state and evidence.
- Handoff contract: `docs/10_AI_TEAM_OPERATING_MODEL.md` and `docs/11_AGENT_HANDOFF_TEMPLATE.md`.
- Portable skills: `.agents/skills/the-luxe-plan`, `the-luxe-build`, `the-luxe-qa`, `the-luxe-lean-context` (each with `SKILL.md`). These describe procedures; they do not grant extra tools/permissions.

## Harness adapters

| Task | Codex in VS Code / CLI | Copilot in VS Code / Cloud |
| --- | --- | --- |
| Plan a GitHub issue | Invoke `$the-luxe-plan` and provide issue URL | Select THE LUXE Management Agent, or request shared skill |
| Implement approved handoff | Invoke `$the-luxe-build` | Select THE LUXE Coding Agent (cloud-compatible aliases read/search/edit/execute) |
| Independent QA | New, **separate** session with `$the-luxe-qa` | THE LUXE QA Agent, or independent Copilot Code Review |
| Save durable context | GitHub issue/PR + accepted project memory docs | The **same** GitHub issue/PR + docs |
| Reduce context use | `$the-luxe-lean-context` + local trusted Ponytail plugin, if installed | Shared lean-context skill; local Ponytail plugin hooks are **not** cloud-runner capabilities |

Copilot profiles: `.github/agents/*.agent.md`. Codex does not automatically execute those profiles as Codex-native agents; invoke the shared skills instead. Neither harness shares chat history or private local filesystem state with the other. Only committed, accessible repository content and explicit handoffs are shared.

## Recommended single-task lifecycle

1. Management scopes approved issue/AC/non-goals/risks, checks current code and identifies exact tests. For L3/L4 require explicit founder approval.
2. Founder approves the handoff if required; a GitHub issue/PR comment records scope. A session transcript alone is not the decision record.
3. Coding Agent starts an isolated branch from up-to-date `master`; implements **one** approved slice with targeted tests and truthful reporting.
4. CI runs the already-established backend/frontend/real-PostgreSQL browser gates as applicable; fix reported errors without masking them.
5. QA runs independently with the issue, handoff, diff and actual results. The coding session cannot independently accept itself.
6. Founder reviews material UX, product and sensitive changes. Human merges accepted PR. Management updates project memory.
7. Next agent session receives the GitHub issue + PR links and current docs, not copied prior chat history.

## External skill/tool integration policy

### Matt Pocock skills

Official upstream: https://github.com/mattpocock/skills

Use the installed local skills for interviews/planning, TDD, diagnosis and handoffs where relevant, **after** THE LUXE scope/decision checks. Avoid replacing existing product authority with generated PRDs/ADRs. Record what was useful in GitHub issues, decisions or docs.

Personal VS Code/Codex/CLI plugin installations **do not mean Copilot Cloud has them**. For cloud parity, select individual upstream skills, review their instructions/scripts/license, pin an upstream revision, and copy or install them as repository project skills under `.agents/skills/<name>/SKILL.md` in a separate reviewed PR. Do not install the complete external bundle or auto-update arbitrary scripts in cloud CI without approval. Respect name uniqueness; no duplicates under `.github/skills/`.

Suggested candidates to vet first: `tdd`, `diagnose`, `grill-with-docs`, `handoff`. Not automatically committed or present in this PR.

### Ponytail

Official upstream: https://github.com/DietrichGebert/ponytail

The local plugin can provide lifecycle hooks and modes. Its editor and cloud compatibility varies. The repository's `the-luxe-lean-context` skill adopts **portable context minimization behavior**, but is **not** the Ponytail plugin and does not reproduce its hooks, command palette or runtime mechanisms.

If you want exact third-party hooks on both harnesses, separately verify supported plugin/hooks in each execution environment, audit the scripts, and confirm security/cost implications before enabling them. Cloud agents do not inherit your local VS Code plugin configuration.

## Smoke-test the shared workflow

1. Start new Codex session in the cloned repo; invoke `$the-luxe-plan` and ask: 'Read #58 and return the next approved slice, no file edits.'
2. Start GitHub Copilot Management Agent on the same issue, also read-only.
3. Compare: priority, current state, L0–L4 risk, tenant invariants, acceptance and non-goals; reconcile discrepancies to docs/issues, not by copying chats.
4. On an already-approved L1 task, run the Coding Agent in **one** harness. Run QA via a genuinely separate session/harness and verify the diff and CI.
5. Do not merge until independent QA and founder decisions are recorded. If a skill is not discovered, start a new session and confirm the repository branch contains `.agents/skills/`.

## Optimization boundaries

- Prefer concise issue-scoped prompts, precise source files, small PRs, single-owner file changes and focused tests during coding.
- Never claim test success without logs, weaken Workspace/CSRF/version boundaries, use production data in cloud sandboxes, or skip mandatory acceptance gates to save tokens.
- Keep personal API subscriptions, extension settings, credentials and plugin caches **outside Git**.
