# THE LUXE — Data Model Review & Source-of-Truth Diagrams

## Executive Summary

THE LUXE should be modeled as a multi-tenant AI workflow and compliance cockpit, not as a simple content generator. The data model must preserve five core product truths: organizations/clients own workspaces; brands own voice profiles and assets; briefs generate content drafts and versions; compliance checks gate approvals and publishing; every material decision is audit logged. For the MVP, the schema should stay compact but structurally future-proof: one organization can have many brands, one brand can have many campaigns/briefs, one brief can produce many content items, each content item can have many versions, each version can be reviewed for compliance, and approved versions can be scheduled for publication.

## Canonical Bounded Contexts

| Context | Purpose | MVP? |
|---|---|---|
| Identity & Tenancy | Users, organizations, memberships, roles | Yes |
| Brand Intelligence | Brand profiles, voice profiles, guidelines, sample posts | Yes |
| Asset & Knowledge Base | Uploaded files, consent docs, factual knowledge items | Yes, light |
| Content Workflow | Briefs, generated drafts, content items, versions | Yes |
| Compliance | GDPR/IP/consent/trademark checks, traffic-light results | Yes, light |
| Approval & Audit | Approval decisions, comments, immutable audit trail | Yes |
| Publishing Calendar | Scheduled content, publishing status | Yes, manual-first |
| Integrations | LinkedIn/Meta/etc. connectors | Later |
| Billing | Plans, subscriptions, usage limits | Later unless needed for pilots |
| Analytics | Time saved, performance metrics, template KPIs | Later |

## Diagram 1 — Product/Data Context Map

```mermaid
flowchart LR
    User[User] --> Membership[Organization Membership]
    Organization[Organization / Workspace] --> Brand[Brand]
    Membership --> Organization

    Brand --> VoiceProfile[Brand Voice Profile]
    Brand --> BrandAsset[Brand Assets]
    Brand --> KnowledgeBase[Knowledge Base]

    User --> Brief[Content Brief]
    Brand --> Brief
    Brief --> ContentItem[Content Item]
    ContentItem --> ContentVersion[Content Version]

    ContentVersion --> ComplianceCheck[Compliance Check]
    ComplianceCheck --> ComplianceFinding[Compliance Finding]
    ContentVersion --> Approval[Approval Decision]
    Approval --> PublishingSlot[Publishing Schedule]

    User --> AuditLog[Audit Log]
    Organization --> AuditLog
    Brand --> AuditLog
    ContentVersion --> AuditLog
```

## Diagram 2 — MVP Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ ORGANIZATION_MEMBERSHIP : has
    ORGANIZATION ||--o{ ORGANIZATION_MEMBERSHIP : includes
    ORGANIZATION ||--o{ BRAND : owns
    ORGANIZATION ||--o{ AUDIT_LOG : records

    BRAND ||--o{ BRAND_VOICE_PROFILE : defines
    BRAND ||--o{ BRAND_ASSET : stores
    BRAND ||--o{ KNOWLEDGE_ITEM : contains
    BRAND ||--o{ CAMPAIGN : groups
    BRAND ||--o{ CONTENT_BRIEF : receives

    CAMPAIGN ||--o{ CONTENT_BRIEF : contains
    CONTENT_BRIEF ||--o{ CONTENT_ITEM : generates
    CONTENT_ITEM ||--o{ CONTENT_VERSION : versions
    CONTENT_VERSION ||--o{ COMPLIANCE_CHECK : checked_by
    COMPLIANCE_CHECK ||--o{ COMPLIANCE_FINDING : produces
    CONTENT_VERSION ||--o{ APPROVAL_DECISION : reviewed_by
    CONTENT_VERSION ||--o| PUBLISHING_SCHEDULE : scheduled_as

    USER {
        uuid id PK
        string email UK
        string full_name
        string auth_provider
        datetime created_at
        datetime updated_at
    }

    ORGANIZATION {
        uuid id PK
        string name
        string type
        string billing_status
        datetime created_at
        datetime updated_at
    }

    ORGANIZATION_MEMBERSHIP {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        string role
        string status
        datetime created_at
    }

    BRAND {
        uuid id PK
        uuid organization_id FK
        string name
        string description
        string primary_language
        json visual_identity
        datetime created_at
        datetime updated_at
    }

    BRAND_VOICE_PROFILE {
        uuid id PK
        uuid brand_id FK
        string name
        string status
        json tone_attributes
        json vocabulary_rules
        json banned_terms
        json style_examples
        int version
        datetime created_at
        datetime updated_at
    }

    BRAND_ASSET {
        uuid id PK
        uuid brand_id FK
        uuid uploaded_by_id FK
        string asset_type
        string file_url
        string source_filename
        string processing_status
        json metadata
        datetime created_at
    }

    KNOWLEDGE_ITEM {
        uuid id PK
        uuid brand_id FK
        string title
        text content
        string source_type
        string verification_status
        datetime created_at
        datetime updated_at
    }

    CAMPAIGN {
        uuid id PK
        uuid brand_id FK
        string name
        string objective
        date start_date
        date end_date
        string status
    }

    CONTENT_BRIEF {
        uuid id PK
        uuid brand_id FK
        uuid campaign_id FK
        uuid created_by_id FK
        string title
        text brief_text
        json target_channels
        string status
        datetime created_at
        datetime updated_at
    }

    CONTENT_ITEM {
        uuid id PK
        uuid brief_id FK
        string channel
        string format
        string status
        datetime created_at
        datetime updated_at
    }

    CONTENT_VERSION {
        uuid id PK
        uuid content_item_id FK
        uuid created_by_id FK
        int version_number
        text body
        json ai_generation_metadata
        string status
        datetime created_at
    }

    COMPLIANCE_CHECK {
        uuid id PK
        uuid content_version_id FK
        uuid checked_by_id FK
        string overall_status
        string risk_level
        json rule_snapshot
        datetime created_at
    }

    COMPLIANCE_FINDING {
        uuid id PK
        uuid compliance_check_id FK
        string category
        string severity
        text message
        text recommendation
        string resolution_status
    }

    APPROVAL_DECISION {
        uuid id PK
        uuid content_version_id FK
        uuid reviewer_id FK
        string decision
        text comment
        datetime created_at
    }

    PUBLISHING_SCHEDULE {
        uuid id PK
        uuid content_version_id FK
        string channel
        datetime scheduled_for
        string publish_status
        string external_post_id
        datetime created_at
        datetime updated_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid organization_id FK
        uuid actor_id FK
        string action
        string entity_type
        uuid entity_id
        json before_state
        json after_state
        datetime created_at
    }
```

## Diagram 3 — Content Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> BriefCreated
    BriefCreated --> DraftGenerated: AI draft generated
    BriefCreated --> DraftManual: user writes manually
    DraftGenerated --> InRevision: user edits
    DraftManual --> InRevision: user edits
    InRevision --> CompliancePending: submit for check
    CompliancePending --> CompliancePassed: green / low risk
    CompliancePending --> ComplianceWarning: yellow / medium risk
    CompliancePending --> ComplianceBlocked: red / high risk
    ComplianceWarning --> InRevision: fix warnings
    ComplianceBlocked --> InRevision: required changes
    CompliancePassed --> ApprovalPending: submit for approval
    ApprovalPending --> Approved: reviewer approves
    ApprovalPending --> Rejected: reviewer rejects
    Rejected --> InRevision: revise
    Approved --> Scheduled: scheduled manually
    Scheduled --> Published: marked as published / integration later
    Published --> Archived
```

## Diagram 4 — Compliance Traffic-Light Flow

```mermaid
flowchart TD
    A[Content Version Submitted] --> B[Load Brand Voice Profile]
    B --> C[Load Knowledge Items & Consent Docs]
    C --> D[Run Rule-Based Compliance Checks]
    D --> E{Findings?}
    E -->|No material issues| F[GREEN: Safe to approve]
    E -->|Warnings only| G[YELLOW: Review required]
    E -->|Critical issue| H[RED: Block publishing]

    G --> I[User revises or reviewer accepts risk]
    H --> J[User must revise]
    I --> K[Approval Decision]
    F --> K
    J --> A
    K --> L[Audit Log Entry]
```

## Diagram 5 — Multi-Tenant Access Model

```mermaid
flowchart TD
    User[User Account] --> Membership[Membership]
    Membership --> Org[Organization / Workspace]
    Membership --> Role{Role}

    Role --> Owner[Owner]
    Role --> Admin[Admin]
    Role --> Editor[Editor]
    Role --> Reviewer[Reviewer]
    Role --> Viewer[Viewer]

    Org --> BrandA[Brand A]
    Org --> BrandB[Brand B]
    BrandA --> DataA[Briefs / Assets / Voice / Content]
    BrandB --> DataB[Briefs / Assets / Voice / Content]

    Owner --> FullAccess[Full Access]
    Admin --> ManageWorkspace[Manage Users + Brand Settings]
    Editor --> CreateEdit[Create Briefs + Drafts]
    Reviewer --> ApproveReject[Compliance + Approval Decisions]
    Viewer --> ReadOnly[Read-only]
```

## Recommended Django Apps

```text
backend/
  apps/
    accounts/       # User proxy, organizations, memberships, RBAC
    brands/         # Brand, brand voice profiles, guidelines
    assets/         # Uploads, source materials, consent files
    knowledge/      # Brand/product facts and RAG-ready content
    content/        # Briefs, content items, versions
    compliance/     # Checks, findings, rule snapshots
    workflow/       # Approvals, comments, status transitions
    publishing/     # Calendar and scheduled posts
    audit/          # Immutable audit trail
    ai/             # Provider calls, generation runs, prompt logs
    billing/        # Later: plans, subscriptions, quotas
```

## MVP Schema Priority

### Must Build First

1. User
2. Organization
3. OrganizationMembership
4. Brand
5. BrandVoiceProfile
6. BrandAsset
7. KnowledgeItem
8. ContentBrief
9. ContentItem
10. ContentVersion
11. ComplianceCheck
12. ComplianceFinding
13. ApprovalDecision
14. PublishingSchedule
15. AuditLog

### Defer Until V1/V2

- Billing subscriptions
- Advanced usage metering
- Social platform OAuth tokens
- External publishing API payload logs
- Analytics events
- Template performance metrics
- Vector embedding tables, unless RAG is implemented immediately
- Multi-brand agency permission overrides

## Review Findings

### Correct Direction

- The model should be multi-tenant from day one.
- BrandVoiceProfile should be a first-class model, not just a JSON field on Brand.
- ContentVersion is essential because THE LUXE promises version transparency, warnings, and approvals.
- Compliance checks must attach to a specific ContentVersion, not only to ContentItem.
- AuditLog must be broad enough to record workflow events, approval changes, compliance checks, and publishing transitions.

### Common Mistakes to Avoid

- Do not put all content text directly on ContentBrief.
- Do not make one Content model without versions.
- Do not attach compliance status only to the brief.
- Do not build publishing integrations before manual scheduling works.
- Do not hardcode one user equals one brand; agencies require many brands per organization.
- Do not store proprietary compliance heuristics in frontend-visible structures.
- Do not expose prompt internals or rule snapshots to unauthorized frontend users.

## Backend/Frontend Source-of-Truth Contract

The backend owns:

- Entity definitions
- Status transition rules
- RBAC enforcement
- Compliance scoring
- Audit logging
- AI prompt orchestration
- File processing state

The frontend owns:

- Form state
- UI rendering
- Dashboard cards
- Calendar display
- Review queue display
- Optimistic UI only when backend supports rollback

The frontend must not duplicate:

- Compliance scoring logic
- Approval state machine logic
- Role authorization logic
- Brand voice extraction logic

## API Surface Sketch

```text
/api/orgs/
/api/orgs/{org_id}/memberships/
/api/brands/
/api/brands/{brand_id}/voice-profiles/
/api/brands/{brand_id}/assets/
/api/brands/{brand_id}/knowledge-items/
/api/briefs/
/api/briefs/{brief_id}/generate/
/api/content-items/
/api/content-items/{id}/versions/
/api/content-versions/{id}/compliance-checks/
/api/content-versions/{id}/approval-decisions/
/api/publishing-schedules/
/api/audit-logs/
```

## Next Implementation Order

1. Create Django apps and base UUID/timestamp mixins.
2. Implement accounts, organizations, memberships, and roles.
3. Implement Brand and BrandVoiceProfile.
4. Implement ContentBrief, ContentItem, and ContentVersion.
5. Implement ComplianceCheck and ComplianceFinding with rule snapshots.
6. Implement ApprovalDecision and PublishingSchedule.
7. Add AuditLog and signals/service-layer audit recording.
8. Expose DRF serializers/viewsets.
9. Generate OpenAPI schema and consume types in Next.js.
10. Align frontend dashboard mock data with real API response shapes.

