# THE LUXE Project Brief

> Historical July-era brief. Current approved MVP planning authority is the confidential `THE_LUXE_MVP_Technical_Feasibility_EU_Ready_Plan_FINAL_POLISHED.docx` (2026-08-10; founder confirmation 2026-10-16; SHA-256 `771ec02713b6a75a3015db06fd84018ac0181e40e60d98d4be912e1e0a8144ec`). Do not treat the flow or priorities below as the current backlog. See [Next Actions](04_NEXT_ACTIONS.md) and GitHub issues #49/#51/#53/#54 for the active IA-1 slice.

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

M0 is this rebaseline: update project memory, classify stale issues, record the test baseline, and define implementation boundaries.

The next implementation milestone should be converted into a spec from the boundaries in `docs/04_NEXT_ACTIONS.md`. Do not start product implementation until that spec exists.

## Non-Goals For The Next Implementation Spec

- Do not rebuild the whole app or replace the Django/DRF/PostgreSQL plus Next.js architecture.
- Do not replace Workspace/Membership with a parallel Organization tenant model.
- Do not continue the old generic multi-channel flow as the primary MVP path.
- Do not add direct social posting until LinkedIn-ready export and approval are stable.
- Do not build a CapCut clone; build the bounded short-form Media Finalizer only after its spike passes.
- Do not use production mock fallback. Demo mode must be explicit and separated.
- Do not use founder-local Ollama as a production dependency.
- Do not send creator/client content to AI providers until processor location, retention/training terms, and contracts are approved.
- Do not add public media hosting or public share pages before DSA review.
- Do not modify application source code during documentation rebaseline phases.

## Product Constraints

- Preserve Workspace as the tenant boundary.
- WorkOS AuthKit is the target product authentication layer; Workspace and Membership remain authorization and tenancy.
- AI proposes; humans approve; accepted changes are explicit state transitions.
- Creator DNA, Voice DNA, text, media, and final outputs are non-destructive and versioned.
- BrandAsset is evidence for DNA extraction. MediaAsset is operational creator content.
- EU-resident data plane is the default for production account data, Creator DNA, content, media, render outputs, and approved AI processing.
- Private, expiring review links come before public hosting.
- First-party pilot metrics should measure time, resume friction, correction categories, and planned-content completion without sending creator content to broad analytics.
