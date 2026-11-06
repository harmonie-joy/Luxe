# THE LUXE Phase 1 MVP — Page Implementation Roadmap

> **Specification Source:** `THE_LUXE_Mario_Spec.pdf`
> Local Draft 1 reconciliation: 2026-11-06, `pocs/archive/THE_LUXE_Mario_Spec.pdf`, SHA-256 `b091f24777a5856c74e3a73ca01c4c6c71f0e08555ac742c9a1d565ec5cff569`.
>
> **Target Path:** `frontend/app/pocs/`
>
> **Execution Strategy:** Use the `build-luxe-page` agent skill to build each route modularly with Tailwind v4 design tokens and theme-aware UI primitives (`frontend/components/ui/`).

This roadmap tracks browser-local synthetic prototypes, not production feature
completion, API persistence, design acceptance, or publishing integrations. The
owner explicitly approved this consolidation on 2026-11-06. The historical UX
baseline and production backlog remain unchanged.

Canonical sidebar: **Home, Plan, Create, Calendar, Impact, Library, Brand/DNA**.
Settings controls the sandbox theme; Quick Create remains accessible. `/pocs`
opens `/pocs/home`. Onboarding remains available through the screen switcher.

Canonical walkthrough:
`welcome -> discover-me -> creator-dna -> brand-kit -> brand-asset-kit -> import-world -> tornado -> home -> plan -> content-workspace -> single-post -> posts-gallery -> impact`.
Calendar and Web Portal are contextual destinations, not forced creation stages.

## Agent Prompt Command Template

To execute any task below with your coding agent, copy and run this prompt format:

```
Run skill build-luxe-page for [Page Number & Title] from THE LUXE Mario Spec.
Create target route: frontend/app/pocs/[route-name]/page.tsx
Use mock dataset in: frontend/lib/mock-data/pocs-data.ts
Ensure full Light & Dark mode support and zero hardcoded hex colors.

```

## 📋 Sprint Checklist

### Stage 1: Onboarding & Brand Foundation

* \[x\] **Page 1 — Welcome / Home**

  * **Spec:** Entry point setting the tone for the workspace.

  * **Route:** `frontend/app/pocs/welcome`

  * **Key Elements:** Hero text, "Get Started" / "Explore the Space" CTAs, 4 feature cards (AI Intelligence, Organized, Built for Creators, Data Private).

* \[x\] **Page 2 — Discover Me (3 Screens)**

  * **Spec:** Creator DNA capture flow.

  * **Route:** `frontend/app/pocs/discover-me`

  * **Key Elements:**

    * \[x\] `2a`: Choice screen (Chat Experience vs. Consultation Call).

    * \[x\] `2b`: Interactive Chat Experience with voice preview wave.

    * \[x\] `2c`: Live Brand Consultation video room view with transcript agenda.

* \[x\] **Page 3 — Creator DNA (Profile)**

  * **Spec:** Reusable identity profile reading from Discover Me.

  * **Route:** `frontend/app/pocs/creator-dna`

  * **Key Elements:** "My North Star" hero block, grid of core cards (Core Values, Communication Style, Voice & Tone, Visual Identity, Workflow), DNA Health Check bar.

* \[x\] **Page 4 — Brand Kit Guide (2 Views)**

  * **Spec:** Referenceable playbook for brand rules.

  * **Route:** `frontend/app/pocs/brand-kit`; `/pocs/brand-guide` retains the same playbook as a compatibility destination.

  * **Key Elements:**

    * \[x\] `4a`: Playbook Home (Chapter overview cards: Story, Mission, Tone, Color System, Typography, Photography).

    * \[x\] `4b`: Chapter View ("Tone of Voice" breakdown with Voice Pillars, Words to Use/Avoid, Sample Captions, AI Confidence Meter).

* \[x\] **Candidate 1 — Aesthetic & Inspiration Board**

  * **Spec:** Visual moodboard hub distinct from strict brand kit rules.

  * **Route:** `frontend/app/pocs/aesthetic-board`

  * **Key Elements:** Masonry/grid layout of campaign inspiration images, color swatches, typography samples, and tag filters.

### Stage 2: Workspace Ingestion & Setup

* \[x \] **Page 5 — Brand Asset Kit**

  * **Spec:** Organized library of logos, fonts, media, and template overlays.

  * **Route:** `frontend/app/pocs/brand-asset-kit`; `/pocs/brand-assets` remains a compatibility destination.

  * **Key Elements:** Storage meter, category filters (Logos, Fonts, Media, Templates, Documents), asset preview drawer, drag-and-drop upload zone.

* \[x \] **Page 6 — Web Content Portal**

  * **Spec:** Synthetic website preview and site-specific content manager; no live site writes.

  * **Route:** `frontend/app/pocs/web-portal`

  * **Key Elements:** Website preview iframe container, page list manager, Brand Assets summary bar, SEO health score widget.

* \[ x\] **Page 7 — Import My World (Wizard Flow)**

  * **Spec:** Multi-step ingestion wizard connecting existing drives and platforms.

  * **Route:** `frontend/app/pocs/import-world`

  * **Key Elements:** 5-step status checklist, source connector cards (Google Drive, Dropbox, Notion, Instagram, YouTube), auto-categorization progress animation.

* \[ x\] **Page 8 — The Tornado (Creative Workspace Transition)**

  * **Spec:** Visual representation of assets transforming into an organized state ("Chaos to Clarity").

  * **Route:** `frontend/app/pocs/tornado`; `/pocs/tornado-workspace` remains compatible.

  * **Key Elements:** Transition graphic panel, Torando command center dashboard, metrics summary, Today's Focus checklist.

### Stage 3: Core Content Engine

* \[x\] **Page 9 — Content Workspace / Project Pipeline**

  * **Spec:** The core Phase 1 creation entry hub.

  * **Route:** `frontend/app/pocs/content-workspace`

  * **Key Elements:** 3 main entry path cards ("Create With Me", "Quick Draft", "Bring Something In"), "Continue Where You Left Off" carousel, quick mobile/desktop voice capture bar.

* \[x\] **Page 10 — Single-Post Hub and Four Focused Layers**

  * **Spec:** End-to-end single content object lifecycle engine.

  * **Route:** `frontend/app/pocs/single-post`

  * **State-driven overlays, not tabs or separate page routes:**

    * \[x\] `10a (Dashboard)`: Persistent Original/Working comparison, post status timeline, one next action, copy/share/source utilities, dates, and truthful browser-save status.

    * \[x\] `10b (TextEditorDrawer)`: Original vs. sample suggestion, caption versions, Accept/Reject/Adjust, Save & Return.

    * \[x\] `10c (VisualEditorDrawer)`: Preserved source assets, working headline/template/layers, explicit visual acceptance. This is a visual recipe preview, not professional media rendering.

    * \[x\] `10d (ReviewModal)`: Exact caption/visual package, version selection, 1:1 / 9:16 preview, prerequisite checklist, explicit local approval. Edits invalidate approval and scheduling.

    * \[x\] `10e (ScheduleModal)`: Timezone-aware future slot validation, browser-local Ready/Scheduled state, Calendar routing, and local JSON package handoff. No publishing provider is connected.

### Stage 4: Management & Distribution Hubs

* \[x\] **Page 11 — Posts Gallery / Content Library**

  * **Spec:** Master content library displaying all past and current posts.

  * **Route:** `frontend/app/pocs/posts-gallery`

  * **Key Elements:** Status/search/sort filters, saved post package and resume, platform badges, synthetic fixture gallery, non-destructive local Repurpose. Saved and illustrative entries are distinguished.

* \[x\] **Page 12 — Content Calendar / Planning View**

  * **Spec:** Weekly and monthly content scheduling view.

  * **Route:** `frontend/app/pocs/calendar`

  * **Key Elements:** Week/Month switcher, date traversal, platform filters, details drawer, saved schedule/Ready queue, timezone-aware labels, and same-post resume.

* \[x\] **Page 13 — Plan & Capture**

  * **Spec:** Optional lightweight planning that turns messy inputs into one executable Game Plan. Quick Create can bypass planning.

  * **Route:** `frontend/app/pocs/plan`. The separate `/pocs/idea-box` remains a legacy exploratory canvas, not the canonical shared inbox.

  * **Key Elements:** Shared IdeaCaptureWidget, raw text/link/file-metadata capture, active Ideas Inbox, select/archive actions, four guided decisions, saved-plan recovery, and Create routing. Voice is a non-recording preview.

* \[ \] **Candidate 2 — Content Prep & Organizer**

  * **Spec:** Shoot logistics checklist and reusable resource contact inventory.

  * **Route:** `frontend/app/pocs/content-prep`

  * **Key Elements:** Shoot date organizer, supplies checklist, reusable team/location picker.

* \[x\] **Page 14 — Impact & Learn**

  * **Spec:** Goal -> What Happened -> Was It Worth It? -> What We Learned -> Next Best Move. Distinguish Observed, Creator-Confirmed, and Inferred.

  * **Route:** `frontend/app/pocs/impact`

  * **Key Elements:** Labeled synthetic performance signals, goal progress, editable browser-saved feedback, and rule-based Plan/Create recommendations. No causal, automated attribution, revenue, or live-platform claim. Platform routing remains contextual to Ready/Schedule/Calendar.

* \[x\] **Page 15 — Creator Home**

  * **Spec:** Central executive command dashboard for the creator.

  * **Route:** `frontend/app/pocs/home`

  * **Key Elements:** Only four high-value bands: Next Best Action, Your Content, This Week, Your Momentum. Counters and next actions derive from saved POC state; sample planning entries remain labeled.

### Stage 5: Prototype Verification & Shared UI

* \[x\] **Interactive Visual Verification**

  * Test all 15 logical pages using `frontend/e2e/poc-consolidation.spec.ts`, the canonical sidebar, and Screens switcher.

  * Verify every component toggles cleanly between Light mode (`☀️`) and Dark mode (`🌙`).

* \[x\] **Shared UI and Layout Extraction**

  * Shared UI: `IdeaCaptureWidget`, `StatCounterCard`, `StatusPillFilter`, `MediaPreviewCard`, `StepProgressHeader`.

  * Layouts: `WizardLayout`, `DashboardShellLayout`, `SplitPaneLayout`, `GalleryGridLayout`. Each has real consumers and typed props; existing theme tokens remain the source of colors.

* **Production promotion and broad documentation cleanup are out of scope.** Do not move these routes into the authenticated app or alter production acceptance records.

### Summary of Next Steps

1. Run focused POC Vitest, Playwright, lint, `npm run typecheck`, and `npm run build` from `frontend/`.

2. Independent QA reviews the current Draft 1 prototype mapping and observed evidence; do not infer production or design acceptance from local checks.

3. Remaining boundaries: synthetic metrics/import/consultation/voice, browser-only storage, source assets plus visual recipes rather than rendered exports, and optional candidate-page placement. Content Prep remains deferred, outside the 15-page consolidation.

## Local Verification - 2026-11-06

- `npm run test`: 51 files, 282 tests passed.
- `npx playwright test e2e/poc-consolidation.spec.ts --workers=1 --reporter=line`: eight cases passed, covering 15 logical pages in four desktop/mobile light/dark combinations and four complete saved-state journeys. Image waits are bounded; Home keyboard focus remains above the sticky footer.
- Scoped ESLint, `npm run typecheck`, and `npm run build` passed. The repository script is `typecheck`, not `type-check`.
- Component/POC CSS and JSX use centralized theme tokens; scoped hex-color scanning passed. Existing central token definitions are not replaced or duplicated.
- Independent QA: **Accepted with Notes** for the local prototype. Storage-read failures do not overwrite saved work; stale-tab saves are rejected with explicit reload/discard recovery. Browser-local read/compare/write is optimistic, not atomic simultaneous-tab serialization.
- No production routes, backend, authentication, dependencies, deployment, or historical production acceptance records were changed. These checks do not establish production or PDF pixel-fidelity acceptance.