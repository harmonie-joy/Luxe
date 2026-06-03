# Verify Data Model Alignment

You are working in THE LUXE full-stack repository.

Backend:

* Django
* Located in `backend/`

Frontend:

* Next.js + TypeScript
* Located in `frontend/`

Instruction files:

* Follow repo-level `AGENTS.md`
* Follow `backend/AGENTS.md` when inspecting backend files
* Follow `frontend/AGENTS.md` when inspecting frontend files

## Goal

Verify that the backend Django data model, serializers/API shape, frontend TypeScript types, mock data, and UI expectations are aligned before implementing or extending a feature.

Do not start by editing code.

First inspect the relevant files and produce a verification report. Only propose code changes after the report.

## Feature Input

Feature name: `<FEATURE_NAME>`

Feature scope: `<FEATURE_SCOPE>`

Relevant backend files/folders:

* `backend/tenancy/`
* `backend/brand/`
* `backend/content/`
* `backend/compliance/`
* `backend/audit/`
* `backend/config/urls.py`
* `backend/config/settings.py`

Relevant frontend files/folders:

* `frontend/types/`
* `frontend/data/`
* `frontend/lib/api/`
* `frontend/features/`
* `frontend/app/(app)/`

## Canonical MVP Entities

Use these entities as the canonical domain vocabulary:

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
* Template, later only

Do not invent duplicate names for the same concept.

## Canonical Enums

Use these values consistently across Django models, serializers, TypeScript types, mock data, and UI logic.

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

UI presentation values such as `success`, `warning`, `danger`, and `info` must not be used as domain enum values. They belong in UI mapping utilities only.

## Verification Tasks

### 1. Inspect Backend

Check:

* Django models
* migrations
* admin registration
* serializers
* viewsets/views
* urls
* tests
* workspace scoping
* enum definitions
* timestamp fields
* ID conventions
* indexes and constraints
* `related_name` values
* `on_delete` behavior

### 2. Inspect Frontend

Check:

* shared types in `frontend/types/`
* mock data in `frontend/data/`
* API clients in `frontend/lib/api/`
* feature components in `frontend/features/`
* route pages in `frontend/app/(app)/`
* formatter/mapping utilities
* status display logic

### 3. Compare Backend and Frontend

For each relevant entity, verify:

* backend model exists
* serializer/API shape exists or is intentionally planned
* frontend shared type exists
* mock data matches the frontend type
* API client return type matches frontend type
* required/optional fields match
* enum values match
* relationship fields match
* timestamps are represented consistently
* workspace ownership is preserved
* frontend does not invent backend-impossible fields
* backend does not expose fields the frontend should not receive

### 4. Verify Workspace Scoping

For workspace-owned entities, check:

* entity has direct or indirect relationship to `Workspace`
* querysets are scoped to the request user's workspace
* create/update operations prevent cross-workspace writes
* retrieve/update/delete operations do not allow bare-ID cross-workspace access
* tests cover cross-workspace isolation

### 5. Verify API Shape

Check whether API responses use:

* stable field names
* ISO 8601 datetime strings
* safe fields only
* intentional nested or flat shapes
* frontend-compatible IDs
* frontend-compatible enum values

If backend uses `snake_case` and frontend uses `camelCase`, verify that the mapping is isolated in `frontend/lib/api/` and does not leak into UI components.

### 6. Verify Mock Data

Mock data must:

* match shared TypeScript types
* resemble future API responses
* use realistic IDs
* use ISO 8601 timestamps
* avoid display-only date strings such as `"2 hours ago"`
* avoid UI-only enum values
* avoid duplicate local interfaces when shared types exist

## Required Report Format

Return the report in this exact structure:

# Data Model Verification Report: `<FEATURE_NAME>`

## Summary

* Overall alignment score: `1-10`
* Biggest risk:
* Most urgent fix:
* Can implementation continue? `yes/no`

## Entity Map

| Entity | Backend Model | Serializer/API | Frontend Type | Mock Data | Status | Notes |
| ------ | ------------- | -------------- | ------------- | --------- | ------ | ----- |

Status values:

* `aligned`
* `partial`
* `missing`
* `conflicting`
* `not_required_yet`

## Critical Mismatches

List only issues that would break MVP implementation or cause backend/frontend drift.

For each issue include:

* file or area
* current behavior
* expected behavior
* recommended fix
* migration required? `yes/no`

## Canonical Model Recommendation

Describe the correct model shape for this feature.

Include:

* entities
* relationships
* ownership/workspace scoping
* required fields
* optional fields
* enum fields
* timestamps

## Backend Findings

Include:

* model issues
* serializer issues
* view/viewset issues
* URL routing issues
* admin issues
* migration risks
* test gaps

## Frontend Findings

Include:

* type issues
* mock data issues
* API client issues
* component data-shape issues
* route/page issues
* formatter/mapping issues

## API Contract Recommendation

List the recommended endpoints for this feature.

For each endpoint include:

* method
* path
* purpose
* request shape if relevant
* response shape summary
* workspace scoping rule

## Migration Risk

Explain:

* whether migrations are required
* whether data migration is needed
* whether existing data may be affected
* safest migration order

## Test Recommendations

List required tests.

Backend tests should cover:

* list
* retrieve
* create
* update if relevant
* delete if relevant
* unauthenticated access
* cross-workspace isolation

Frontend checks should cover:

* TypeScript compile
* mock data compatibility
* API client typing
* page render safety

## Safe Patch Plan

Give a small ordered plan.

Example:

1. Normalize shared frontend types
2. Align mock data
3. Adjust backend model or serializer
4. Add/update tests
5. Run verification commands

Do not propose broad rewrites.

## Do Not Do

Do not:

* rewrite the whole backend
* rewrite the whole frontend
* add authentication unless explicitly requested
* add real AI provider integrations
* add publishing integrations
* create migrations without explaining why
* rename major entities without justification
* import from `temp/`
* add UI-only enum values to domain types
* ignore workspace scoping

## Verification Commands

Recommend the exact commands to run.

Backend examples:

```bash
python manage.py check
python manage.py test <app>
```

or, if using Docker Make targets:

```bash
make manage cmd="check"
make manage cmd="test <app>"
```

Frontend examples:

```bash
npm run typecheck
npm run build
```

## Final Output Requirement

End with:

* recommended next safest implementation step
* files likely to change
* whether backend should be patched first or frontend should be patched first
