# THE LUXE MVP Progress Report

## 1. Executive Summary

THE LUXE is in a solid MVP-contract stage. The backend now implements most canonical MVP entities, DRF serializers, membership-scoped viewsets, routes, admin registrations, migrations, and API tests. The frontend has complete MVP route coverage and polished mock-driven product screens for the full intended flow.

Current MVP maturity level: `api_ready` for most backend-backed domains, `mock_only` to `partial` for the actual user-facing workflow.

Biggest achievement: the canonical data model is largely represented end to end across Django models, DRF response shapes, TypeScript domain types, and realistic mock data.

Biggest technical gap: product screens are not meaningfully API-connected yet. Most frontend data sources still return mocks, save buttons do not persist, auth headers are a stub, and there is no workspace/session selection path for the API clients.

Recommended next focus: connect the Create Brief -> Draft Studio -> Compliance Review path to the existing APIs using one minimal authenticated workspace path, then add frontend integration tests around that flow.

## 2. Feature Progress Matrix

| Feature | Frontend UI | Backend Model | API | Mock Data | API Client | Tests | Status | Notes |
| ------- | ----------- | ------------- | --- | --------- | ---------- | ----- | ------ | ----- |
| Dashboard | Yes: `/dashboard`, dashboard components | Underlying workspace/content/compliance/scheduled models exist | No dashboard aggregate endpoint | Yes: `mock-dashboard.ts` | No dashboard client | No frontend tests; backend underlying domains tested | `mock_only` | Useful overview UI, but data is UI-specific and not API-backed. |
| Brand Voice | Yes: `/brand-voice`, sample detail route, profile/sample components | Yes: `BrandProfile`, `BrandAsset` | Yes: `/api/brand-profiles/`, `/api/brand-assets/` | Yes: brand profile and sample asset mocks | Yes: `brand-voice.ts`; conditional data source | Backend API tests pass | `api_ready` | UI defaults to mock mode; API mode falls back to mocks because auth is not wired. |
| New Brief / Create Brief | Yes: `/create`, structured form shell | Yes: `ContentBrief` | Yes: `/api/content-briefs/` | Yes: `mock-create-brief.ts` | Yes: `content-briefs.ts` | Backend API tests pass | `api_ready` | Form matches backend-required fields but does not submit. |
| Draft Studio / Drafts | Yes: `/drafts`, channel draft editor | Yes: `ContentDraft` | Yes: `/api/content-drafts/` | Yes: `mock-drafts.ts` | Yes: `content-drafts.ts` | Backend API tests pass | `api_ready` | Edits are local React state only; save does not call API. |
| Compliance Review | Yes: `/compliance` redirect and `/compliance/[draftId]` | Yes: `ComplianceCheck`, `ComplianceIssue` | Yes: `/api/compliance-checks/`, `/api/compliance-issues/` | Yes: `mock-compliance.ts` | Yes: `compliance.ts` | Backend API tests pass | `api_ready` | Review UI is mock-driven; no live check creation or issue updates. |
| Calendar / Scheduled Content / Approval | Yes: `/calendar` | Yes: `ScheduledContent`, `Approval`, `AuditLog` | Yes for scheduled content, approvals, audit logs | Yes: `mock-calendar.ts` | Scheduled content only | Backend API tests pass | `partial` | Calendar is rich but mock-only. Approval and audit APIs exist without frontend clients. |

## 3. MVP Flow Readiness

1. Dashboard

What works now: `/dashboard` renders a complete workspace overview with metrics, review queue, and scheduled preview.

What is missing: no backend aggregate endpoint, no API client, no live workspace/user context, and no real links into the current queue items.

What must be done next: define a small dashboard summary API or compose from existing endpoints after auth/workspace context exists.

2. Brand Voice

What works now: `/brand-voice` renders profile setup, tone options, vocabulary, banned phrases, and sample content. `/brand-voice/samples/[id]` renders sample detail with comments and score.

What is missing: write actions are not connected; sample detail always uses mock data; auth prevents API mode from working in a real session.

What must be done next: wire profile and asset reads/writes through the existing API client, then move comments/voice score into either explicit later models or keep them clearly UI-only.

3. Create Brief

What works now: `/create` collects canonical fields: workspace, brand profile, objective, campaign goal, audience, angle, constraints, and target channels.

What is missing: form state is not submitted to `/api/content-briefs/`, workspace/profile options are mock data, and there is no post-create navigation to Draft Studio.

What must be done next: connect create submission, validate workspace/profile pairing in the UI, and route to drafts for the created brief.

4. Draft Studio

What works now: `/drafts` shows one draft per target channel, editable title/content, status metadata, and a compliance review link.

What is missing: no API fetch, no API patch on save, no brief-specific route, and no real generated draft creation.

What must be done next: fetch drafts by `brief`, persist edits through `/api/content-drafts/`, and preserve the existing one-draft-per-brief-channel constraint.

5. Compliance Review

What works now: `/compliance` redirects to a reviewable mock draft, and `/compliance/[draftId]` shows traffic-light status, issue categories, severity, explanations, and suggested fixes.

What is missing: checks/issues are not fetched from `/api/compliance-checks/?draft=...`, no issue resolution/editing, and no status transition back to draft approval.

What must be done next: load checks by draft ID, support creating/updating checks and issues, and define how review outcomes change draft status.

6. Calendar / Approval

What works now: `/calendar` renders scheduled content, associated drafts, compliance snapshots, comments, and audit history.

What is missing: scheduled content is not fetched from API, approval records are not shown as first-class API-backed entities, comments have no backend entity, and posting a comment is local-only state.

What must be done next: connect scheduled content reads first, add an approval client, and defer comments unless comments are promoted to the canonical MVP model.

## 4. Backend Summary

Models implemented: `Workspace`, `Membership`, `BrandProfile`, `BrandAsset`, `ContentBrief`, `ContentDraft`, `ScheduledContent`, `Approval`, `ComplianceCheck`, `ComplianceIssue`, and `AuditLog`. `User` is represented by Django's configured auth user model. `llm` remains scaffold-only, which matches the instruction not to add AI integrations yet.

Serializers implemented: brand profiles/assets, content briefs/drafts/scheduled content/approvals, compliance checks/issues, and audit logs. Read responses intentionally return camelCase fields matching frontend types. Write payloads remain snake_case DRF payloads.

Viewsets/routes implemented: `/api/brand-profiles/`, `/api/brand-assets/`, `/api/content-briefs/`, `/api/content-drafts/`, `/api/scheduled-content/`, `/api/approvals/`, `/api/compliance-checks/`, `/api/compliance-issues/`, `/api/audit-logs/`, plus `/api/health`.

Migrations state: migrations exist for tenancy, brand, content, compliance, and audit. `make manage cmd="migrate --check"` exited successfully, indicating no unapplied migrations in the running Docker backend.

Admin coverage: admin registrations exist for all implemented MVP models except the scaffold-only `llm` app. Admin list displays, filters, search fields, readonly timestamps, and inlines are generally useful for MVP inspection.

Tests passing/missing: `make test-be` ran 76 backend tests successfully. Brand, content, compliance, scheduled content, approval, and audit APIs have useful workspace isolation and response-shape tests. Tenancy and `llm` tests remain placeholder-only.

Workspace scoping risks: most API viewsets filter querysets through `workspace__memberships__user` or parent relationships and use `IsAuthenticated`. The approach is duplicated across viewsets rather than centralized in a permission/helper layer. Creation payloads use broad related-field querysets followed by explicit permission checks; this is acceptable for MVP but should be reviewed before production hardening.

Backend gaps: no tenancy/workspace API; no membership management API; no automatic audit log creation from domain actions; no frontend-auth-compatible authentication flow; no dashboard aggregate endpoint; no comments model; no API for AI orchestration; no publishing/calendar integrations, appropriately.

## 5. Frontend Summary

Routes implemented: `/dashboard`, `/brand-voice`, `/brand-voice/samples/[id]`, `/create`, `/drafts`, `/compliance`, `/compliance/[draftId]`, and `/calendar` exist under the `(app)` shell. `/` remains a backend health/status page rather than a product entry route.

Components implemented: shared shell/topbar/sidebar, `SurfaceCard`, `StatusIndicator`, dashboard cards/queues, brand profile/sample components, create brief shell, draft studio shell, compliance review shell, and calendar shell.

Shared types status: canonical frontend types exist for brand profile/assets, content briefs/drafts/scheduled content/approval/audit, compliance checks/issues, and workspace roles. Enum values match the canonical values. Some UI-only types, such as comments, voice score, and workspace users, live in shared type files even though no backend model/API exists yet.

Mock data status: realistic mock data exists for every MVP screen and uses IDs plus ISO 8601 timestamps. The strongest API-shaped mocks are brand, content, compliance, and scheduled content. Dashboard data is intentionally more presentation-shaped and less directly replaceable with current APIs.

API clients status: clients exist for brand profiles/assets, content briefs, content drafts, compliance checks/issues, and scheduled content. Clients are missing for workspaces/memberships, approvals, audit logs, and dashboard aggregates. Most page data-source modules still return mocks.

Theme/design system status: a centralized token system exists in `frontend/styles/theme.css`, bridged in `globals.css`, and most product components use `luxe-*` semantic classes. The design is cohesive and consistent across product screens.

UI consistency risks: `frontend/app/page.tsx` still uses starter-style hardcoded Tailwind colors and health-check copy. `frontend/features/calendar/components/calendar-shell.tsx` hardcodes compliance hex colors despite equivalent status tokens existing. The calendar file is large and has local calendar assumptions for June 2026.

Frontend gaps: no frontend tests, no API-connected mutation flow, no auth/session integration, no route for a specific brief/draft resource, no approval UI as a first-class workflow, and no stable workspace selector backed by the backend.

## 6. Data Model Alignment

| Entity | Backend | Frontend Type | Mock Data | API | Alignment | Notes |
| ------ | ------- | ------------- | --------- | --- | --------- | ----- |
| User | Django auth user | Partial via user IDs and `WorkspaceUser` | Mock author/user IDs | No explicit user API | `partial` | Auth user is implicit; frontend has display-oriented users only. |
| Workspace | `Workspace` | `Workspace` | Create brief workspace options | No workspace API | `partial` | Tenant model exists, but API/client/workspace selection are missing. |
| Membership | `Membership` | `WorkspaceRole` only | Role references in approvals/users | No membership API | `partial` | Role enum aligns; membership entity is not typed as an API resource. |
| BrandProfile | `BrandProfile` | `BrandProfile` | Yes | Yes | `aligned` | Read response shape matches frontend type. |
| BrandAsset / SampleContent | `BrandAsset` | `BrandAsset` | Yes | Yes | `aligned` | Comments and voice scores are frontend-only extensions. |
| ContentBrief | `ContentBrief` | `ContentBrief` | Yes | Yes | `aligned` | Write snake_case/read camelCase mapping is isolated in API client. |
| ContentDraft | `ContentDraft` | `ContentDraft` | Yes | Yes | `aligned` | Backend enforces one draft per brief/channel. |
| ComplianceCheck | `ComplianceCheck` | `ComplianceCheck` | Yes | Yes | `aligned` | Includes nested issues in check responses. |
| ComplianceIssue | `ComplianceIssue` | `ComplianceIssue` | Yes | Yes | `aligned` | Categories and severities match. |
| Approval | `Approval` | `Approval` | Not first-class mock list | Yes | `partial` | Backend/API/type exist; no frontend client or visible approval workflow. |
| CalendarItem / ScheduledContent | `ScheduledContent` | `ScheduledContent` | Yes | Yes | `aligned` | UI consumes scheduled content but does not fetch it yet. |
| AuditLog | `AuditLog` | `AuditLog` | Calendar audit logs | Yes | `partial` | API exists, but no client and no automatic domain-event logging. |
| Template | Not implemented | Not implemented | No | No | `not_required_yet` | Later/optional per canonical model. |

## 7. API Integration Status

| API Area | Backend Endpoint | Frontend Client | UI Connected? | Notes |
| -------- | ---------------- | --------------- | ------------- | ----- |
| Health | `/api/health` | Inline root fetch | Yes, root page only | Root page fetches backend health; not part of MVP product shell. |
| Brand profiles | `/api/brand-profiles/` | `frontend/lib/api/brand-voice.ts` | Conditional only | `/brand-voice` can use API when `NEXT_PUBLIC_USE_MOCK_BRAND_VOICE=false`, but auth is not wired. |
| Brand assets | `/api/brand-assets/` | `frontend/lib/api/brand-voice.ts` | Conditional only | Sample detail route still always uses mock data. |
| Content briefs | `/api/content-briefs/` | `frontend/lib/api/content-briefs.ts` | No | Create Brief form is mock/default-data only. |
| Content drafts | `/api/content-drafts/` | `frontend/lib/api/content-drafts.ts` | No | Draft save is local state only. |
| Scheduled content | `/api/scheduled-content/` | `frontend/lib/api/scheduled-content.ts` | No | Calendar is mock-only. |
| Approvals | `/api/approvals/` | Missing | No | Backend and type exist; frontend integration absent. |
| Compliance checks | `/api/compliance-checks/` | `frontend/lib/api/compliance.ts` | No | Compliance pages read mock data by draft ID. |
| Compliance issues | `/api/compliance-issues/` | `frontend/lib/api/compliance.ts` | No | Issue creation/update clients exist but are unused. |
| Audit logs | `/api/audit-logs/` | Missing | No | Backend API exists; calendar uses mock audit logs. |
| Workspaces/memberships | Missing | Missing | No | Key missing integration piece for authenticated API use. |
| Dashboard summary | Missing | Missing | No | Dashboard would need an aggregate endpoint or composition strategy. |

Important integration note: `frontend/lib/api/http-client.ts` reads `NEXT_PUBLIC_API_URL`, while `infra/docker-compose.yml` sets `NEXT_PUBLIC_API_BASE_URL`. Unless corrected or overridden, API clients will ignore the Compose-provided public API URL and fall back to `http://localhost:8000`.

## 8. Quality and Verification

Backend:

- `python manage.py check`: direct local run was blocked because Django is not installed in the local Python environment and no `backend/.venv` was present. The Docker backend test run did execute Django's system check and reported no issues.
- Backend tests: `make test-be` passed. Result: 76 tests, OK.
- Migrations: `make manage cmd="migrate --check"` exited successfully.
- Workspace isolation tests: present for brand profiles/assets, content briefs/drafts, scheduled content, approvals, compliance checks/issues, and audit logs. Missing for tenancy-specific behavior.

Frontend:

- `npm run typecheck`: passed.
- `npm run build`: initially failed under restricted network because Next.js could not fetch Google Fonts. Re-run with network access passed. Build output listed `/dashboard`, `/brand-voice`, `/create`, `/drafts`, `/compliance`, and `/calendar`.
- Lint: `npm run lint` passed with one warning: `AuditLog` is imported but unused in `frontend/features/calendar/components/calendar-shell.tsx`.
- Route rendering: production build completed. `/` logs a dynamic server usage message due to the no-store health fetch, but the build still exited successfully.
- No prototype/temp imports: scan found no production imports from `temp/` or prototype folders.

## 9. Risks and Technical Debt

1. Data model drift: frontend comments, voice score, dashboard rows, and some workspace user concepts are not backend-backed. They should stay clearly UI-only or be promoted intentionally.
2. Workspace scoping/security: membership filtering is implemented in viewsets, but repeated manually. A shared scoped queryset/permission pattern would reduce regression risk.
3. Mock/API mismatch: read shapes align well, but write paths are not exercised by UI. The app can look complete while remaining disconnected.
4. Missing tests: no frontend tests; tenancy tests are placeholders; no end-to-end test covers the MVP flow.
5. UI inconsistency: root page and calendar hardcoded colors bypass the luxe theme conventions.
6. Overbuilt or duplicated components: calendar shell is large and mixes calendar generation, comments, audit log filtering, and detail rendering in one component.
7. Unclear next feature boundary: approval, comments, audit automation, and calendar scheduling could each become larger features. Approval should be prioritized before comments/publishing.

## 10. Recommended Next Roadmap

### Immediate Stabilization

1. Fix the frontend API base environment mismatch: align `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_BASE_URL`.
2. Add a minimal workspace API or bootstrap endpoint so frontend API clients know the active workspace.
3. Replace the root health page metadata/copy with an intentional product or redirect behavior.
4. Move calendar hardcoded compliance colors to theme/status tokens and remove the unused `AuditLog` import.

### Next Feature Work

1. Connect `/create` to `createContentBrief`, then navigate into a brief-specific draft workflow.
2. Connect `/drafts` to `getContentDrafts(briefId)` and `updateContentDraft`.
3. Connect `/compliance/[draftId]` to `getComplianceChecks(draftId)` and issue APIs.
4. Add an approvals API client and expose approval actions in the review/calendar workflow.

### Later

1. Add dashboard aggregate API or a composition layer over existing endpoints.
2. Decide whether comments and voice scores are MVP entities or purely UI demo affordances.
3. Add automatic `AuditLog` creation from important domain actions.
4. Add real AI orchestration only after the brief/draft/compliance workflow is persisted.
5. Defer publishing integrations and Google Calendar sync until scheduled content and approvals are stable.

## 11. Files That Need Attention

- `frontend/lib/api/http-client.ts`: environment variable mismatch with Docker Compose.
- `infra/docker-compose.yml`: sets `NEXT_PUBLIC_API_BASE_URL`, while the client reads a different variable.
- `frontend/app/page.tsx`: starter-style health page with hardcoded colors and dynamic fetch behavior.
- `frontend/app/layout.tsx`: metadata still says "Create Next App"; root fonts differ from the product shell fonts.
- `frontend/features/calendar/components/calendar-shell.tsx`: large component, hardcoded hex colors, unused import, static June 2026 calendar assumptions.
- `frontend/features/*/data/*.ts`: most data sources still return mocks; promote one flow at a time to API.
- `frontend/lib/api/`: add missing clients for approvals, audit logs, and workspace/bootstrap data.
- `backend/tenancy/`: add serializers/viewsets/tests if the frontend needs workspace and membership context.
- `backend/audit/`: decide whether audit logs are manually posted or automatically created by domain actions.
- `frontend/types/brand-profile.ts` and `frontend/types/content.ts`: review UI-only comment/score/user-ish types before treating them as API contracts.

## 12. Final Recommendation

Build next: a persisted Create Brief -> Draft Studio API-connected slice, scoped to the active workspace and using the existing content brief/draft APIs.

Do not build yet: real AI generation, publishing integrations, Google Calendar sync, or a broad dashboard analytics layer.

Backend or frontend priority: prioritize integration glue across both, with a slight frontend/API-client emphasis because the backend contracts and tests are already strong for the core flow.

Safest next prompt to run: "Connect the Create Brief page to the existing ContentBrief API using the current shared types and mock fallback. Keep the patch small, preserve workspace scoping, and add focused tests or type checks."
