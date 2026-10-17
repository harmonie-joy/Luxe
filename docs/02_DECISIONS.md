# Technical Decisions

## Decision Log

| ID | Date | Status | Decision | Rationale | Source |
| --- | --- | --- | --- | --- | --- |
| D-0001 | 2026-06-05 | Accepted | Use Workspace as the MVP tenant root. | Existing root instructions explicitly say not to introduce a parallel Organization model unless requested. | `AGENTS.md` |
| D-0002 | 2026-06-05 | Accepted | Use a Markdown-first repo memory system for the management agent. | The blueprint recommends repo-native memory first and defers dashboards, vector DBs, and autonomous orchestration. | `prompts/agent-creation.md` |
| D-0003 | 2026-06-05 | Superseded | Keep AI runtime integrations out of the MVP implementation until explicitly requested. | Superseded by D-0008 after the founder explicitly scoped local-first AI orchestration. | `AGENTS.md`, `docs/mvp-progress-report.md` |
| D-0004 | 2026-06-05 | Accepted | Keep publishing integrations out of scope until scheduled content and approvals are stable. | Calendar and approval workflow need to be persisted before external publishing creates more operational risk. | `AGENTS.md`, `docs/mvp-progress-report.md` |
| D-0005 | 2026-06-05 | Accepted | Use shared frontend domain types in `frontend/types/` and backend `TextChoices` enum strings as the canonical contract. | The repo already aligns most enum values across Django models, serializers, TypeScript types, and mock data. | `AGENTS.md`, `frontend/types/`, `backend/*/models.py` |
| D-0006 | 2026-06-05 | Accepted | Keep authenticated workspace/bootstrap definition as a prerequisite planning track before broader API-connected Draft Studio persistence. | Persistence work depends on deterministic active workspace resolution, workspace-scoped reads, and clear fallback behavior; sequencing this first reduces integration churn and scope risk. | `docs/04_NEXT_ACTIONS.md`, `docs/03_PROGRESS_LOG.md` |
| D-0007 | 2026-06-29 | Accepted | Use django-allauth headless plus Django sessions for MVP signup/login. | The founder requested signup, seed data, an auth provider, and a new package; allauth keeps auth repo-native without adding hosted-provider setup or JWT complexity. | `backend/config/settings.py`, `backend/requirements/base.txt`, `frontend/lib/api/auth.ts` |
| D-0008 | 2026-07-01 | Accepted | Make local-first AI orchestration part of MVP scope. | The founder requested local AI functionality now; the backend supports mock execution and optional Ollama without cloud SDKs or API keys. | `backend/llm/`, `backend/config/settings.py`, `backend/requirements/base.txt` |
| D-0009 | 2026-07-01 | Accepted | Extend BrandAsset with minimal media metadata for text, image, and audio transcript inputs. | The Brand Voice analysis engine needs saved text, uploaded images, and transcript-labeled text without adding a separate asset model, vector store, or document parsing pipeline. | `backend/brand/models.py`, `backend/brand/migrations/0003_brandasset_media_fields.py`, `frontend/types/brand-profile.ts` |
| D-0010 | 2026-07-07 | Accepted | Structured Voice DNA architecture. | See detailed entry below. | `backend/brand/models.py`, `backend/llm/{schemas,prompts,services}.py`, `docs/reference/brand-engine/` |
| D-0011 | 2026-07-08 | Accepted | The Brand Voice Profile screen is a read-only Voice DNA studio; voice fields are never hand-edited in the UI. | See detailed entry below. | `frontend/features/brand-voice/components/voice-dna-studio.tsx` |
| D-0012 | 2026-10-17 | Accepted | An active BrandVoice is not approved context; IA-1 requires explicit version-specific human acceptance before binding a ContentItem. | Activation, AI extraction, and historical seeding do not prove creator intent. | Merged PR #56, issues #52 and #38 |

### D-0012: Version-specific BrandVoice acceptance

- Status: Accepted for IA-1 backend in merged PR #56; the wider Creator/CEO approval workflow remains open in #38.
- Decision: Record the workspace, exact BrandVoice version, authenticated approving user, acceptance event, and timestamp. Approval is separate from `is_active`; existing active versions receive no synthetic approval. A ContentItem pins the selected approved version and does not follow later activation. Historical records without acceptance remain unverified.
- Consequences: #53 must provide a human review action. No Creator DNA proposal or multi-brand identity model is decided here. Approval evidence follows its voice on intentional deletion; there is no public voice-delete endpoint, and workspace erasure remains a separate data-governance concern.

### D-0010: Structured Voice DNA architecture

- Date: 2026-07-07
- Status: Accepted
- Context: The flat brand model (one tone adjective list, a free-text `audience`
  field, and a template stuffed into `positioning_notes`) could not drive
  reliable generation or enforcement: adjectives are not machine-operable,
  extraction silently overwrote a working profile, and review results were
  thrown away. Reference implementations in `docs/reference/brand-engine/`
  defined the target design, adapted to this repo's app layout and canonical
  enums.
- Decision:
  1. `BrandProfile` holds slow-changing strategy: decomposed positioning
     (category, key benefit, differentiators, reasons to believe, competitors,
     known-for, mission, values, tagline — classic positioning-statement
     structure instead of a free-text blob), archetype + secondary archetype,
     five Aaker personality sliders (0-100), distinctive assets, maturity
     stage, primary language, and industry.
  2. `AudienceSegment` replaces the `audience` TextField with structured,
     individually targetable segments.
  3. `BrandVoice` is a versioned linguistic execution profile: tone as the
     four NN/g dimensions (funny, casual, irreverent, enthusiastic — integer
     sliders instead of adjectives, so tone is diff-able and
     channel-adjustable), behavioral rules (point of view, sentence style,
     pacing, proof style, claim boundaries), vocabulary and banned phrases
     with severity, extraction confidence/notes, and asset provenance.
     Exactly one voice is active per profile; extraction creates version N+1
     instead of overwriting, making voice drift visible and reversible.
  4. `VoiceExample` stores annotated do/don't examples as first-class,
     channel-taggable rows — few-shot data injected at generation time.
  5. `ChannelStyle` stores per-channel tone deltas (-50..+50) plus length,
     structure, emoji/hashtag/CTA norms; effective tone = clamp(voice slider
     + delta).
  6. `BrandAsset` carries evidence metadata (source URL, channel, language,
     performance signal, content date, crawled source type, excluded status)
     so extraction can weight current, high-performing content.
  7. `VoiceAuditScore` persists every voice review (overall + five dimension
     scores, violations, FK to `llm.AIRun`), turning enforcement into a time
     series.
  8. `llm` schemas mirror these shapes; all prompts moved to `llm/prompts.py`;
     `_run_ai_task` always returns `(result, run)`.
  9. Prompts are tenant-neutral: they reference the workspace's
     `brand_profile.name` from context. THE LUXE is the platform, never the
     customer's brand, and its name may not appear in `backend/llm/`.
- Consequences: Old flat fields (`audience`, `tone`, `preferred_vocabulary`,
  `banned_phrases`, `positioning_notes`) stay through a deprecation window
  and were migrated into BrandVoice v1 / AudienceSegment rows
  (`brand/migrations/0005`); they will be dropped once serializers and the
  frontend stop reading them. The brand app reuses the canonical six-channel
  enum rather than the reference's twelve channels, and compliance schema
  values stay on the canonical `gdpr/consent/ip/claims` + `low/medium/high`
  enums.
- Related files: `backend/brand/models.py`,
  `backend/brand/migrations/0004_voice_dna_models.py`,
  `backend/brand/migrations/0005_seed_voice_from_flat_fields.py`,
  `backend/llm/schemas.py`, `backend/llm/prompts.py`,
  `backend/llm/services.py`, `backend/brand/serializers.py`,
  `backend/brand/views.py`, `frontend/types/brand-profile.ts`,
  `frontend/lib/api/ai.ts`, `docs/reference/brand-engine/`.
- Follow-up actions: drop deprecated columns after the frontend stops reading
  them; build the positioning-audit task type, brand-from-idea flow, and
  crawling for `crawled` assets only when explicitly scoped.

### D-0011: Brand Voice Profile screen is read-only over extracted voice data

- Date: 2026-07-08
- Status: Accepted
- Context: The old `/brand-voice/profile` screen was a flat editable form
  (name, audience textarea, tone chips, vocabulary/banned-phrase textareas)
  writing the deprecated flat BrandProfile fields. Under D-0010, voice data is
  extracted evidence with versioning, confidence, and asset provenance —
  hand-editing individual fields would silently detach a voice from what the
  samples support.
- Decision: The redesigned screen surfaces the Voice DNA read-only. The only
  mutations are (a) selecting samples and extracting a new voice version and
  (b) activating a version. Tone renders as `role="meter"` bars, not inputs;
  positioning, segments, channel styles, and examples are display-only.
  Correcting a voice means re-extracting from better samples, not typing over
  fields. The flat profile form and its tests were deleted; editing
  positioning/segments/channel styles belongs to future dedicated screens if
  ever scoped.
- Consequences: The frontend stopped writing the deprecated flat fields from
  this screen (one less consumer blocking the D-0010 column drop). Read-only
  UI uses native `select`/`details` elements instead of new interactive
  slider/tab/dropdown components. Version compare is a stubbed button.
- Related files: `frontend/features/brand-voice/components/voice-dna-studio.tsx`,
  `voice-dna-sections.tsx`, `voice-summary-panel.tsx`, `tone-meter.tsx`,
  `frontend/lib/api/brand-voice.ts`, `frontend/data/mock-brand-profiles.ts`.
- Follow-up actions: version compare/diff UI; drop the remaining flat-field
  reads (`brand-profile-preview.tsx`, overview cards) so D-0010's deprecated
  columns can be removed.

## Decision Entry Template

### D-0000: Decision Title

- Date:
- Status: Proposed | Accepted | Superseded
- Context:
- Decision:
- Consequences:
- Related files:
- Follow-up actions:

## Decision Triggers

Update this file when a task changes:

- tech stack
- tenant model
- data model
- auth model
- deployment strategy
- AI provider strategy
- compliance approach
- pricing or product packaging
- MVP scope
- integration strategy
