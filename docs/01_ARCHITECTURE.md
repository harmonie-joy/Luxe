# THE LUXE Architecture

> The description below records the July implementation baseline, not the approved product scope. The 2026-08-10 founder-confirmed MVP plan governs delivery; the August 12 Technical Decision Record Revision 1.1 remains a technical reference where compatible. IA-1 backend additions (Project, ContentItem, ExecutionCheckpoint, BrandVoiceApproval) merged in PR #56 on 2026-10-17. See [Next Actions](04_NEXT_ACTIONS.md) for current status.

## Tech Stack

- Monorepo with `backend/`, `frontend/`, `infra/`, `docs/`, and `prompts/`.
- Backend: Django, Django REST Framework, PostgreSQL, local Docker, and explicit service boundaries.
- Frontend: Next.js App Router, TypeScript, Tailwind v4 token bridge, and CSS custom properties in `frontend/styles/theme.css`.
- AI: repo-native `llm` app with AIRun provenance, pydantic schemas, mock provider, optional local Ollama for development, and future approved EU production provider.
- Auth target: WorkOS AuthKit for product authentication.
- Tenancy target: Workspace and Membership remain THE LUXE authorization and tenant boundary.
- Media target: EU object storage for original/rendered assets, non-destructive edit recipes, and server-side FFmpeg canonical render jobs.

## Current Implemented Foundation

The repo already contains reusable implementation assets:

- `tenancy`: Workspace and Membership.
- `brand`: BrandProfile, AudienceSegment, versioned BrandVoice, VoiceExample, ChannelStyle, BrandAsset evidence, and VoiceAuditScore.
- `content`: ContentBrief, ContentDraft, ScheduledContent, and Approval.
- `compliance`: ComplianceCheck and ComplianceIssue.
- `audit`: AuditLog.
- `llm`: AIRun, provider abstraction, prompt/service boundaries, mock provider, optional local Ollama provider, draft generation, brand voice extraction, voice review, and compliance review plumbing.
- `frontend`: App shell, product routes, shared domain types, API clients, mock/live state patterns, theme tokens, and focused component tests.

Known baseline as of 2026-10-12:

- Backend tests pass: 147 tests.
- `make check` fails in frontend tests because `sample-content-uploader.test.tsx` expects a `Save Image` button while the rendered UI exposes `Save File`.
- There is an existing uncommitted application-source change in `frontend/features/brand-voice/components/sample-content-uploader.tsx`; documentation rebaseline must not touch it.

## Target Domain Layers

### Authentication And Tenancy

- WorkOS AuthKit authenticates the person.
- Django stores or maps the authenticated user needed for ownership, audit, and workspace membership.
- Workspace remains the tenant root for all user-owned data.
- Membership remains the authorization model for workspace roles.
- Existing django-allauth signup/login implementation is superseded by the WorkOS target and should be replaced only in a scoped auth migration spec.

### Creator Intelligence

- CreatorContext is the approved, creator-level execution context.
- CreatorContext may reference an active BrandProfile and BrandVoice, but it does not replace them.
- CreatorDNAProposal records suggested context changes from interviews, assets, or observed corrections.
- Proposed context changes require explicit accept/reject; background AI may not silently update approved CreatorContext.
- Communication guide output is generated from approved CreatorContext plus current Brand/Voice DNA.

### Content Execution

- Project is a campaign or bounded body of work.
- ContentItem is the main workflow unit for the first release.
- ContentTemplate stores reusable LinkedIn/content-type structures and defaults.
- DraftVersion records caption/text versions, AI suggestions, accepted alternatives, and restore points.
- ExecutionCheckpoint stores the resumable state: summary, last decision, open questions, workflow stage, and next action.
- ContentBrief and ContentDraft remain reusable lower-level assets, but the user-facing MVP flow should move to Project/ContentItem and versioned captions.

### Media And Gallery

- BrandAsset remains evidence for Brand/Voice DNA extraction.
- MediaAsset represents operational creator media: original uploads, rendered outputs, and gallery items.
- Original media is immutable.
- MediaEdit stores non-destructive edit recipes.
- MediaRenderJob produces canonical output through a server-side renderer in an EU environment.
- Gallery starts private, organized, and review-link oriented. Public hosting is out of scope until DSA review.

### AI And Provenance

- AIRun remains the provenance record for AI tasks.
- AI-generated suggestions must record provider/model, source inputs, AI run ID, human review, and approved version.
- Development can keep mock/Ollama flows.
- Production cannot fall back to mocks and cannot depend on founder-local Ollama.
- Production AI must run in an approved EU-controlled environment or through an approved processor configuration.

## Target Data Flow

1. A WorkOS-authenticated user enters a Workspace through Membership.
2. The user completes or resumes Discover Me.
3. THE LUXE presents CreatorContext and communication guide proposals for explicit approval.
4. The user creates or resumes a Project and ContentItem.
5. The system assembles execution context from approved CreatorContext, active BrandProfile/BrandVoice, the template, assets, current DraftVersion, previous decisions, open questions, and next action.
6. The user edits or accepts versioned caption suggestions.
7. If media is needed, MediaAssets are selected and finalized through a bounded Media Finalizer.
8. Human approval marks the content item release-ready.
9. LinkedIn-ready output/export is produced before direct publishing integrations.
10. ExecutionCheckpoint, provenance, and pilot metrics are updated for future resume and learning.

## Target API Surface

The TDR sketches these API areas. Implement them only through scoped specs:

- `GET /api/creator-context/`
- `GET /api/creator-context/proposals/`
- `POST /api/creator-context/proposals/{id}/accept/`
- `POST /api/creator-context/proposals/{id}/reject/`
- `POST /api/projects/`
- `POST /api/content-items/`
- `GET /api/content-items/{id}/context/`
- `POST /api/content-items/{id}/checkpoint/`
- `PATCH /api/content-items/{id}/stage/`
- `GET /api/content-templates/`
- `POST /api/media-assets/upload-url/`
- `POST /api/media-assets/{id}/complete/`
- `POST /api/media-edits/`
- `PATCH /api/media-edits/{id}/`
- `POST /api/media-edits/{id}/render/`
- `GET /api/media-render-jobs/{id}/`
- `GET /api/drafts/{id}/versions/`
- `POST /api/drafts/{id}/versions/`
- `POST /api/drafts/{id}/suggest-edit/`
- `POST /api/drafts/{id}/finalize/`
- `POST /api/share-links/`
- `DELETE /api/share-links/{id}/`

## Media Release Envelope

First release support should stay narrow:

- Desktop Chrome/Edge.
- LinkedIn-first output.
- Final video up to 30 seconds.
- Up to 5 source clips.
- 1080p maximum output.
- H.264/AAC MP4 for video.
- Explicit size, type, codec, and compatibility validation before editing.

Capabilities a-f are the core pilot media scope: trim, crop/resize, captions, logo/watermark, text overlays, and basic color/filter controls.

Capabilities g-j are gated: combine clips, audio/music, transitions, and timeline editing should stay feature-flagged or use a maintained SDK fallback until the spike and render regression suite prove reliability.

## Production And EU Baseline

- EU-resident application/database/storage is the default.
- Uploads require signed/private access, size/type validation, checksum, failed-upload cleanup, and later malware scanning before production release.
- Render jobs require persisted state, idempotency, retry limits, explicit failure codes, and output validation.
- Monitoring must not log creator content.
- User deletion/export must cover database rows, object storage, rendered outputs, share links, and downstream processors where applicable.
- Only strictly necessary cookies/storage are enabled by default before consent/legal review.
- Private expiring share links come before any public creator hosting.

## Current Gaps To Close Through Specs

- Red frontend test baseline.
- WorkOS AuthKit migration from django-allauth signup/login.
- CreatorContext and CreatorDNAProposal model/API.
- Project, ContentItem, ContentTemplate, DraftVersion, and ExecutionCheckpoint model/API.
- LinkedIn-first content workflow and context restore UI.
- MediaAsset/Gallery upload and metadata foundation.
- Server render worker and Media Finalizer spike.
- EU data inventory, retention/delete/export, processor register, production no-mock policy, monitoring, backups, and rollback runbook.

## Design Rules

- Preserve Workspace isolation on every user-owned read/write.
- Prefer vertical slices.
- Keep backend models, serializers, frontend types, mock data, and tests aligned within each scoped implementation task.
- Do not weaken security, accessibility, data-loss protection, or privacy safeguards.
- Do not add broad abstractions before the first linked workflow needs them.
- Update `docs/02_DECISIONS.md` when architecture, auth, data model, AI provider, EU posture, or MVP scope changes.
