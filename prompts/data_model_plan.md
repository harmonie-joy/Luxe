## Plan: Solid THE LUXE Data Models

Use [docs/the_luxe_data_model_source_of_truth.md](docs/the_luxe_data_model_source_of_truth.md) as canonical source.
Implement in this order with small safe patches only:

1. Canonicalize enums and statuses across backend/frontend before adding models.
2. Harden tenancy (Workspace root, Membership roles owner/admin/editor/reviewer/viewer, UUIDs for new entities, created_at/updated_at, ownership fields, indexes).
3. Build brand models (Brand, BrandVoiceProfile, BrandAsset, KnowledgeItem, Campaign).
4. Build content models (ContentBrief, ContentItem, ContentVersion, ScheduledContent or PublishingSchedule).
5. Build compliance models (ComplianceCheck, ComplianceIssue or ComplianceFinding, ApprovalDecision).
6. Build immutable AuditLog.
7. Add serializers + viewsets + scoped routes.
8. Align frontend shared types and mock data to backend API shapes.
9. Validate with migrations, scoping tests, and frontend type/build checks.

Guardrails:
1. Do not rewrite whole backend/frontend.
2. Do not use temp prototype code.
3. Do not add auth redesign, real AI providers, or publishing integrations.
4. Explain every migration before creating it.
5. Preserve workspace isolation in every query/mutation.
