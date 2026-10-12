# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- `docs/00_PROJECT_BRIEF.md` -- product decisions and project direction.
- `docs/01_ARCHITECTURE.md` -- architecture and service boundaries.
- `docs/02_DECISIONS.md` -- accepted technical decisions.
- `docs/04_NEXT_ACTIONS.md` -- current priorities, issue classification, and spec boundaries.
- `docs/adr/` -- ADRs that touch the area you're about to work in.

Use `temp/THE_LUXE_MVP_Technical_Feasibility_EU_Ready_Plan_FINAL_POLISHED.pdf` only when rebaselining product memory or resolving a conflict that the summarized docs do not settle.

If any ADR files don't exist yet, proceed silently. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill creates ADRs lazily when decisions actually get resolved.

## File structure

Single-context repo:

```text
/
+-- docs/
|   +-- 00_PROJECT_BRIEF.md
|   +-- 01_ARCHITECTURE.md
|   +-- 02_DECISIONS.md
|   +-- 04_NEXT_ACTIONS.md
|   +-- adr/
+-- backend/
+-- frontend/
```

## Use the repo's vocabulary

When your output names a domain concept, use the terms from the project brief, architecture docs, decisions, and relevant ADRs. Don't drift to synonyms the docs explicitly avoid.

If the concept you need isn't documented yet, either reconsider the language or note it for `/domain-modeling`.

## Flag ADR conflicts

If your output contradicts an existing ADR or accepted decision, surface it explicitly rather than silently overriding.
