---

agent: agent
description: Build one backend/frontend THE LUXE MVP feature slice safely
-------------------------------------------------------------------------

# Build THE LUXE Feature Slice

You are working in the THE LUXE full-stack repository.

Backend:

* Django
* Located in `backend/`

Frontend:

* Next.js + TypeScript
* Located in `frontend/`

Global project rules are defined in `.github/copilot-instructions.md`. Follow them.

## Feature Input

Feature name: ${input:featureName:Example: Brand Voice, Create Brief, Draft Studio, Compliance Review}

Feature goal: ${input:featureGoal:Describe what the user should be able to do}

Feature scope: ${input:featureScope:Describe the exact MVP scope. Keep it small.}

Primary user flow: ${input:userFlow:Example: User opens Brand Voice page, edits fields, previews profile, saves mock data}

Backend required? ${input:backendRequired:yes/no}

Frontend required? ${input:frontendRequired:yes/no}

Existing related files to inspect: ${input:filesToInspect:List relevant files or folders}

## Required Process

Do not start by editing code.

First inspect the relevant backend and frontend files.

Then produce:

1. Current state summary
2. Affected files
3. Data model impact
4. API impact
5. Frontend component impact
6. Test impact
7. Safe patch plan

Only after the plan, implement the smallest useful feature slice.

## Domain Contract

Use canonical MVP entities:

* Workspace
* Membership
* BrandProfile
* BrandAsset or SampleContent
* ContentBrief
* ContentDraft
* ComplianceCheck
* ComplianceIssue
* Approval
* CalendarItem
* AuditLog

Use canonical enums:

ComplianceStatus:

* green
* yellow
* red

ComplianceSeverity:

* low
* medium
* high

ComplianceCategory:

* gdpr
* consent
* ip
* claims

ContentChannel:

* linkedin
* instagram
* blog
* newsletter
* x
* short_video

DraftStatus:

* draft
* in_review
* needs_changes
* approved
* scheduled
* published

WorkspaceRole:

* owner
* admin
* editor
* reviewer
* viewer

Do not create alternative names or duplicate enum values.

## Backend Rules

If backend changes are required:

* Keep changes inside the correct Django app.
* Use Django `TextChoices` for enum fields.
* Add workspace scoping where applicable.
* Add `created_at` and `updated_at` where applicable.
* Add useful `related_name` values.
* Add `__str__` methods.
* Register useful models in Django admin if appropriate.
* Explain whether migrations are required.
* Do not create migrations until the model diff is clear.
* Do not add real LLM, AI, or publishing integrations unless explicitly requested.

## Frontend Rules

If frontend changes are required:

* Keep route files focused on composition.
* Put business components in `frontend/features/[feature]/components/`.
* Put shared types in `frontend/types/`.
* Put mock data in `frontend/data/`.
* Use existing UI primitives and theme tokens.
* Do not hardcode hex colors.
* Do not import from prototype or temp folders.
* Use typed props.
* Keep mock data backend-like.
* Use ISO 8601 timestamps.
* Derive display labels in formatter utilities or UI mapping objects.

## Expected Deliverables

Depending on scope, deliver only what is necessary.

Possible backend deliverables:

* Django models
* Admin registration
* Serializers
* Viewsets/routes
* Tests
* Migrations explanation

Possible frontend deliverables:

* Route page
* Feature components
* Shared types
* Mock data
* UI mapping utilities
* Basic tests if practical

## Acceptance Criteria

The feature is complete only if:

* It follows the existing project architecture.
* It uses canonical domain names and enum values.
* It does not import prototype/temp files.
* It does not introduce duplicate types.
* It does not introduce hardcoded design colors.
* It keeps backend and frontend data shapes aligned.
* It keeps the patch small enough to review.
* It reports changed files and why each file changed.

## Final Response Format

After implementation, report:

1. Summary
2. Files changed
3. Backend changes
4. Frontend changes
5. Data model changes
6. API changes
7. Tests/verification run
8. Known limitations
9. Recommended next step
