# Prototype Audit

## Scope

Audited the six visual prototypes in `temp/`:

- `temp/dashboard`
- `temp/brand_voice`
- `temp/brief_creation`
- `temp/draft_studio`
- `temp/compliance_review`
- `temp/calendar`

Also inspected the last commit:

- `2a4d636853286ef093033425071f8379b46615da`
- Message: `Add design assets and HTML structure for "The Luxe" professional workspace`
- Summary: added the six prototype folders with `DESIGN.md`, `code.html`, and `screen.png`; also added `backend/entrypoint.sh`.

No source code was modified during this audit.

## Architecture Note

The current frontend project lives under `frontend`, the requested target architecture is:

- `frontend/app` for routes
- `frontend/components/ui` for generic primitives
- `frontend/components/layout` for shell components
- `frontend/features` for business modules
- `frontend/types` for domain types
- `frontend/data` for mock data

The recommendations below use the requested target architecture.

## Repeated UI Patterns

### Shared Design System

All six prototypes repeat the same visual language:

- Warm off-white workspace background.
- Luxe gold primary accent.
- Fine 1px borders instead of heavy shadows.
- Serif display headings using `Libre Caslon Text`.
- Functional sans UI text using `Inter`.
- Compact uppercase metadata labels.
- Small 4px radius on controls and cards.
- Material Symbols icons with light stroke weights.

This should become shared design tokens and utility styles before productionizing individual screens.

### Workspace Shell

Every prototype uses the same application shell:

- Fixed desktop sidebar around 260px wide.
- `THE LUXE` brand block plus `Enterprise Workspace` subtitle.
- Primary nav items: Dashboard, Brand Voice, Briefs, Studio, Compliance, Calendar.
- Active nav state with gold text, a left border, and subtle tinted background.
- Global `Create New Brief` call to action.
- Footer nav for Profile and Settings.
- Responsive top bar with search, dashboard/analytics links, notifications, settings, and avatar.
- Mobile-specific top or bottom navigation in several prototypes.

This is the strongest candidate for early extraction because duplicating it across routes will make the frontend brittle quickly.

### Page Structure

The primary content areas repeat:

- A route-level page header with serif title and short supporting description.
- Max-width workspace canvas with generous margins.
- Bento or 12-column grid layouts.
- Right-side sticky detail/assistant/preview panels.
- Action bars at the bottom of forms or review workflows.

The repeated shell plus page-header rhythm suggests that routes should stay thin and compose feature modules.

### Generic Controls

The following controls recur across multiple prototypes:

- Primary, secondary, ghost, and icon buttons.
- Search input with leading icon.
- Text input, textarea, and select controls with gold focus states.
- Selectable chips for goals, channels, tone attributes, and status filters.
- Tabs for draft channels.
- Status dots and status pills for compliant, warning, critical, approved, pending, scheduled, and draft states.
- Cards/surfaces with low-contrast borders.
- Avatars and small stacked avatar groups.
- Upload/dropzone card.

These should be generic `ui` primitives where they are not tied to business language.

### Business-Specific Patterns

Several repeated structures are business-domain components rather than generic primitives:

- Compliance risk cards and issue cards.
- Calendar event cards and selected-event details.
- Draft editor, version comparison cards, and AI refinement panel.
- Brand voice trait selector, vocabulary constraints, and profile preview.
- Brief creation goal/channel selectors.
- Dashboard metric cards, upcoming content list, and activity feed.
- Reviewer feedback/comment threads.

These belong in feature folders so they can use domain-specific props and mock data without polluting the generic component layer.

## Recommended Reusable Components

### `frontend/components/ui`

Recommended generic primitives:

- `Button`: supports `primary`, `secondary`, `ghost`, `danger`, and compact variants.
- `IconButton`: circular/square icon-only action used for notifications, settings, calendar arrows, toolbar formatting, and send actions.
- `Card`: bordered surface with configurable padding, variant, and optional accent border.
- `Badge`: pill or label-style status display.
- `StatusDot`: normalized severity/status color mapping.
- `StatusLegend`: row of status dots plus labels used by calendar and compliance contexts.
- `SelectableChip`: radio/checkbox visual chip used for tone, goals, channels, and filters.
- `Tabs`: channel tabs and simple route-local tab bars.
- `TextField`: labeled text input with optional leading/trailing icon.
- `TextAreaField`: shared textarea styling for briefs, brand samples, AI prompts, and editors.
- `SelectField`: styled select with trailing chevron.
- `SearchField`: input with leading search icon.
- `Avatar`: image or icon fallback avatar.
- `AvatarStack`: compact overlapping participant avatars.
- `ProgressMeter`: small horizontal trait meter used in brand voice preview.
- `DropzoneCard`: generic upload affordance.
- `Divider`: consistent border separator.
- `Toolbar`: compact row of icon buttons for editor actions.

### `frontend/components/layout`

Recommended shell components:

- `AppShell`: wraps sidebar, top bar, and route content.
- `SidebarNav`: desktop navigation, brand block, primary CTA, and footer links.
- `SidebarNavItem`: active/inactive nav item with icon and route.
- `TopAppBar`: search, secondary nav links, notifications/settings, avatar.
- `MobileTopBar`: compact mobile brand/action header.
- `MobileBottomNav`: bottom route navigation where needed.
- `PageHeader`: serif title, eyebrow/subtitle, and optional status/action slot.
- `ContentContainer`: max-width page canvas with responsive margins.
- `BentoGrid`: 12-column grid helper for dashboard/form pages.
- `RightRail`: sticky side panel for preview, AI assistant, or event details.
- `ActionBar`: right-aligned form/review actions with responsive stacking.

## Feature Module Recommendations

### `frontend/features/dashboard`

Components:

- `DashboardOverview`
- `MetricCard`
- `UpcomingContentCard`
- `UpcomingContentList`
- `ActivityFeed`
- `ActivityRow`
- `SystemStatusPill`

Data:

- dashboard metrics
- upcoming content
- recent activity

### `frontend/features/brand-voice`

Components:

- `BrandVoiceForm`
- `ToneAttributeSelector`
- `ReferenceMaterialSection`
- `VocabularyConstraints`
- `VoiceProfilePreview`
- `TraitMeterList`
- `GeneratedSampleCard`

Data:

- tone attribute options
- sample voice profile
- preferred/restricted vocabulary mocks

### `frontend/features/briefs`

Components:

- `BriefCreationForm`
- `ObjectiveField`
- `CampaignGoalSelector`
- `ChannelSelector`
- `BrandProfilePicker`

Data:

- campaign goals
- publishing channels
- brand profiles

### `frontend/features/draft-studio`

Components:

- `DraftStudioWorkspace`
- `DraftHeader`
- `ChannelTabs`
- `DraftEditor`
- `EditorToolbar`
- `VersionComparison`
- `DraftVersionCard`
- `AIAssistantPanel`
- `QuickRefinementList`
- `ComplianceSuggestionCard`
- `AIPromptBox`

Data:

- draft metadata
- channel drafts
- version history
- AI quick actions
- AI suggestions

### `frontend/features/compliance`

Components:

- `ComplianceReview`
- `ComplianceSummaryPill`
- `RiskAssessmentList`
- `RiskCategoryCard`
- `ComplianceIssueList`
- `ComplianceIssueCard`
- `QuotedCopyBlock`
- `ReviewActionBar`

Data:

- risk categories
- compliance issues
- suggested fixes

### `frontend/features/calendar`

Components:

- `CalendarWorkspace`
- `CalendarToolbar`
- `CalendarMonthGrid`
- `CalendarDayCell`
- `CalendarEventCard`
- `CalendarDetailsPanel`
- `AssetPreview`
- `PostCopyCard`
- `ReviewerFeedbackList`
- `CommentComposer`
- `AuditTrailPreview`

Data:

- calendar month/day mocks
- calendar events
- selected event details
- comments and reviewers

## Route Recommendations

Use `frontend/app` routes that compose layout and feature modules:

- `frontend/app/page.tsx`: dashboard overview.
- `frontend/app/brand-voice/page.tsx`: brand voice setup.
- `frontend/app/briefs/new/page.tsx`: new brief creation.
- `frontend/app/studio/[draftId]/page.tsx`: draft studio.
- `frontend/app/compliance/[reviewId]/page.tsx`: compliance review.
- `frontend/app/calendar/page.tsx`: content calendar.

Routes should avoid owning repeated markup. They should primarily select mock data, render `AppShell`, and mount the relevant feature component.

## Domain Types

Recommended `frontend/types` files:

- `navigation.ts`: `NavItem`, `NavSection`.
- `status.ts`: `StatusKind`, `ComplianceSeverity`, `ContentStatus`.
- `user.ts`: `User`, `Reviewer`.
- `brand.ts`: `BrandProfile`, `ToneAttribute`, `VoiceProfile`, `TraitScore`, `VocabularyConstraint`.
- `brief.ts`: `Brief`, `CampaignGoal`, `Channel`, `BriefObjective`.
- `draft.ts`: `Draft`, `DraftChannel`, `DraftVersion`, `AIAssistantAction`, `AISuggestion`.
- `compliance.ts`: `RiskCategory`, `ComplianceIssue`, `SuggestedFix`.
- `calendar.ts`: `CalendarEvent`, `CalendarDay`, `ReviewerComment`, `Asset`.
- `dashboard.ts`: `DashboardMetric`, `ActivityItem`, `UpcomingContentItem`.

## Mock Data

Recommended `frontend/data` files:

- `navigation.ts`: primary nav, footer nav, top nav links.
- `brandProfiles.ts`: brand profile options and voice profile preview data.
- `briefOptions.ts`: campaign goals and publishing channels.
- `dashboard.ts`: metrics, upcoming items, activity feed.
- `drafts.ts`: draft metadata, channel copy, version history.
- `aiActions.ts`: quick refinement actions and suggestions.
- `compliance.ts`: risk categories, issues, severity labels.
- `calendar.ts`: calendar events, selected event details, comments.
- `users.ts`: reviewers and workspace users.

Mock data should be typed from `frontend/types` so the eventual backend/API integration is mostly a data-source swap rather than a component rewrite.

## Implementation Order

1. Establish design tokens and shared typography in global styles.
2. Build `ui` primitives: `Button`, `IconButton`, `Card`, `StatusDot`, `Badge`, form fields, chips, tabs, avatar, and progress meter.
3. Build layout shell: `AppShell`, `SidebarNav`, `TopAppBar`, `PageHeader`, `ContentContainer`, and `RightRail`.
4. Add typed mock data and domain types.
5. Implement routes one feature at a time, starting with dashboard because it exercises the shell, cards, status dots, activity rows, and upcoming content patterns.
6. Implement form-heavy routes next: brief creation and brand voice.
7. Implement complex workspaces last: draft studio, compliance review, and calendar.

## Key Boundary Decisions

- Keep `temp/` as reference-only prototype material; do not move prototype HTML or images into production.
- Put visual primitives in `frontend/components/ui` only when they are reusable without business-specific copy.
- Put sidebar/top-bar/page-shell components in `frontend/components/layout`.
- Put domain components in `frontend/features` even when they visually resemble cards or lists.
- Put repeated business objects in `frontend/types` and `frontend/data` before wiring screens, so props stay consistent across modules.

