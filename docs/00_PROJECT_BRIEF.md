# THE LUXE Project Brief

## Project Name

THE LUXE

## One-Sentence Description

THE LUXE is an AI-powered brand voice, workflow, and compliance cockpit for planning, drafting, reviewing, approving, and scheduling branded content.

## Problem

Teams need a focused way to turn brand guidance into channel-ready content while preserving brand voice, review accountability, and GDPR/IP/consent-aware compliance checks.

## Target Users

- Creators
- SMEs
- NGOs
- Agencies
- Founders and early-stage teams

## Core Features

- Brand-Voice Engine for tone, audience, vocabulary, banned phrases, and positioning guidance.
- Brand assets or sample content used as source material for voice alignment.
- Structured content brief creation.
- Multi-channel drafting for LinkedIn, Instagram, blog, newsletter, X, and short video.
- Compliance traffic-light review with GDPR, consent, IP, and claims issue categories.
- Approval workflow for draft sign-off.
- Calendar or scheduled content planning after approval.
- Audit trail for important user and system actions.

## MVP Flow

Dashboard -> Brand Voice Setup -> Create Brief -> Draft Studio -> Compliance Review -> Calendar / Approval

## Current Stage

The repo is in an MVP-contract and scaffolding stage.

- Backend: Django and Django REST Framework apps, models, serializers, routes, admin registrations, migrations, and API tests exist for most canonical MVP entities.
- Frontend: Next.js App Router screens cover the intended MVP flow with shared domain types, route helpers, theme tokens, and realistic mock data.
- Integration: Product screens are still mostly mock-driven. API clients exist for several domains, but the persisted Create Brief -> Draft Studio -> Compliance Review flow is not yet fully connected.
- Agent memory: root `AGENTS.md`, backend/frontend agent instructions, Copilot instructions, Cursor rules, and core project memory docs exist.

## Current Priority

Connect one persisted MVP workflow slice: Create Brief -> Draft Studio -> Compliance Review, using existing backend APIs, shared frontend types, workspace scoping, and mock fallback where needed.

## Non-Goals

- Do not add real AI provider integrations yet.
- Do not add publishing integrations yet.
- Do not add authentication unless explicitly requested for a scoped task.
- Do not build a full agent dashboard, vector database, autonomous planner, or multi-agent orchestration system.
- Do not introduce a parallel Organization model; Workspace is the MVP tenant root.
- Do not import production code from `temp/`; treat `temp/` as design reference only.

## Important Constraints

- Bootstrap-first and validation-first.
- Protect proprietary backend logic and compliance heuristics.
- Keep the architecture simple and repo-native until the MVP proves it needs more.
- Never store secrets, API keys, credentials, private user data, or production tokens in docs.
- Treat compliance features as checklist and review support, not legal certification or legal advice.
- Keep backend models, serializers, frontend shared types, mock data, enums, and UI logic aligned in the same task when a product concept changes.

## Existing Source Material

- `AGENTS.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`
- `.github/copilot-instructions.md`
- `README.md`
- `docs/mvp-progress-report.md`
- `docs/prototype-audit.md`
- `docs/the_luxe_data_model_source_of_truth.md`
- `prompts/agent-creation.md`
