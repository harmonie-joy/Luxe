# THE LUXE MVP Progress Audit

You are working in THE LUXE full-stack repository.

Backend:

* Django
* Located in `backend/`

Frontend:

* Next.js + TypeScript
* Located in `frontend/`

Instruction files:

* Read repo-level `AGENTS.md` first.
* When inspecting backend files, also follow `backend/AGENTS.md`.
* When inspecting frontend files, also follow `frontend/AGENTS.md`.

## Goal

Audit the current development state of THE LUXE MVP and produce a clear progress summary.

Do not start by editing code.

First inspect the current implementation and report what has been achieved, what is partially done, what is missing, and what should be prioritized next.

## Current MVP Areas to Review

Review these product areas:

1. Dashboard
2. Brand Voice
3. New Brief / Create Brief
4. Draft Studio / Drafts
5. Compliance Review
6. Calendar / Scheduled Content

## Files and Folders to Inspect

### Global

* `AGENTS.md`
* `.github/copilot-instructions.md` if present
* `prompts/` if present
* `README.md` if present
* package/config files relevant to development commands

### Backend

Inspect:

* `backend/tenancy/`
* `backend/brand/`
* `backend/content/`
* `backend/compliance/`
* `backend/audit/`
* `backend/llm/`
* `backend/config/settings.py`
* `backend/config/urls.py`
* backend migrations
* backend tests
* backend serializers, views, urls, admin files

### Frontend

Inspect:

* `frontend/app/(app)/`
* `frontend/features/`
* `frontend/components/`
* `frontend/types/`
* `frontend/data/`
* `frontend/lib/`
* `frontend/lib/api/`
* `frontend/styles/`
* `frontend/app/globals.css`
* `frontend/lib/routes.ts`

## Canonical MVP Flow

Use this as the expected product flow:

Dashboard → Brand Voice Setup → Create Brief → Draft Studio → Compliance Review → Calendar / Approval

## Canonical MVP Entities

Check whether these entities exist and are aligned:

* User
* Workspace
* Membership
* BrandProfile
* BrandAsset or SampleContent
* ContentBrief
* ContentDraft
* ComplianceCheck
* ComplianceIssue
* Approval
* CalendarItem or ScheduledContent
* AuditLog

## Canonical Enums

Check whether these enum values are used consistently:

### ComplianceStatus

* `green`
* `yellow`
* `red`

### ComplianceSeverity

* `low`
* `medium`
* `high`

### ComplianceCategory

* `gdpr`
* `consent`
* `ip`
* `claims`

### Channel

* `linkedin`
* `instagram`
* `blog`
* `newsletter`
* `x`
* `short_video`

### CampaignGoal

* `educate`
* `announce`
* `promote`
* `fundraise`
* `thought_leadership`

### DraftStatus

* `draft`
* `in_review`
* `needs_changes`
* `approved`
* `scheduled`
* `published`

### WorkspaceRole

* `owner`
* `admin`
* `editor`
* `reviewer`
* `viewer`

## Audit Tasks

### 1. Feature Status Audit

For each MVP area, determine:

* frontend route exists?
* frontend components exist?
* typed mock data exists?
* API client exists?
* backend model exists?
* serializer exists?
* view/viewset exists?
* urls/routes exist?
* admin registration exists?
* migrations exist?
* tests exist?
* feature is mock-only, API-ready, or API-connected?

### 2. Backend Audit

Check:

* model completeness
* workspace scoping
* migration state
* serializer/API readiness
* viewset/queryset safety
* admin usability
* tests
* authentication assumptions
* cross-workspace isolation
* timestamp consistency
* enum consistency

### 3. Frontend Audit

Check:

* route coverage
* feature folder organization
* shared domain types
* mock data realism
* API client coverage
* UI consistency
* theme token usage
* hardcoded route strings
* hardcoded colors
* direct prototype/temp imports
* page files doing too much
* backend/frontend type drift

### 4. Integration Audit

Check:

* which screens are mock-driven
* which screens are connected to API clients
* which backend APIs are ready
* whether frontend API clients match backend response shapes
* whether snake_case/camelCase mapping is isolated
* whether data can flow through the MVP sequence

### 5. Development Process Audit

Check:

* instruction hierarchy exists and is being used
* prompts exist for feature development
* tests or checks are available
* build/typecheck commands are known
* development workflow is documented
* risky areas are tracked

## Required Report Format

Return the report in this exact structure:

# THE LUXE MVP Progress Report

## 1. Executive Summary

Give a short summary of the current project state.

Include:

* current MVP maturity level
* biggest achievement
* biggest technical gap
* recommended next focus

## 2. Feature Progress Matrix

Use this table:

| Feature | Frontend UI | Backend Model | API | Mock Data | API Client | Tests | Status | Notes |
| ------- | ----------- | ------------- | --- | --------- | ---------- | ----- | ------ | ----- |

Status values:

* `done`
* `partial`
* `mock_only`
* `api_ready`
* `api_connected`
* `missing`
* `blocked`

## 3. MVP Flow Readiness

For each step, summarize whether it works:

1. Dashboard
2. Brand Voice
3. Create Brief
4. Draft Studio
5. Compliance Review
6. Calendar / Approval

For each step include:

* what works now
* what is missing
* what must be done next

## 4. Backend Summary

Include:

* models implemented
* serializers implemented
* viewsets/routes implemented
* migrations state
* admin coverage
* tests passing/missing
* workspace scoping risks
* backend gaps

## 5. Frontend Summary

Include:

* routes implemented
* components implemented
* shared types status
* mock data status
* API clients status
* theme/design system status
* UI consistency risks
* frontend gaps

## 6. Data Model Alignment

Use this table:

| Entity | Backend | Frontend Type | Mock Data | API | Alignment | Notes |
| ------ | ------- | ------------- | --------- | --- | --------- | ----- |

Alignment values:

* `aligned`
* `partial`
* `missing`
* `conflicting`
* `not_required_yet`

## 7. API Integration Status

List existing API endpoints and whether the frontend uses them.

Use this table:

| API Area | Backend Endpoint | Frontend Client | UI Connected? | Notes |
| -------- | ---------------- | --------------- | ------------- | ----- |

## 8. Quality and Verification

Report whether these are available or passing:

Backend:

* `python manage.py check`
* backend tests
* migrations
* workspace isolation tests

Frontend:

* `npm run typecheck`
* `npm run build`
* lint
* route rendering
* no prototype/temp imports

If commands were not run, say so clearly.

## 9. Risks and Technical Debt

List the most important risks.

Prioritize:

1. data model drift
2. workspace scoping/security
3. mock/API mismatch
4. missing tests
5. UI inconsistency
6. overbuilt or duplicated components
7. unclear next feature boundary

## 10. Recommended Next Roadmap

Give a short ordered roadmap.

Use this format:

### Immediate Stabilization

1. ...
2. ...

### Next Feature Work

1. ...
2. ...

### Later

1. ...
2. ...

## 11. Files That Need Attention

List files or folders that should be reviewed or refactored soon.

## 12. Final Recommendation

End with:

* what should be built next
* what should not be built yet
* whether backend or frontend should be prioritized next
* the safest next prompt to run

## Rules

Do not:

* modify code
* create migrations
* add new features
* rewrite architecture
* add AI integrations
* add Google Calendar sync
* add publishing integrations
* import from prototype/temp folders

This task is audit-only.
