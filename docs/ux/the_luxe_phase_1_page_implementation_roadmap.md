# THE LUXE Phase 1 MVP — Page Implementation Roadmap

> **Specification Source:** `THE_LUXE_Mario_Spec.pdf`
>
> **Target Path:** `frontend/app/pocs/`
>
> **Execution Strategy:** Use the `build-luxe-page` agent skill to build each route modularly with Tailwind v4 design tokens and theme-aware UI primitives (`frontend/components/ui/`).

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

  * **Route:** `frontend/app/pocs/brand-guide`

  * **Key Elements:**

    * \[x\] `4a`: Playbook Home (Chapter overview cards: Story, Mission, Tone, Color System, Typography, Photography).

    * \[x\] `4b`: Chapter View ("Tone of Voice" breakdown with Voice Pillars, Words to Use/Avoid, Sample Captions, AI Confidence Meter).

* \[x\] **Candidate 1 — Aesthetic & Inspiration Board**

  * **Spec:** Visual moodboard hub distinct from strict brand kit rules.

  * **Route:** `frontend/app/pocs/aesthetic-board`

  * **Key Elements:** Masonry/grid layout of campaign inspiration images, color swatches, typography samples, and tag filters.

### Stage 2: Workspace Ingestion & Setup

* \[ \] **Page 5 — Brand Asset Kit**

  * **Spec:** Organized library of logos, fonts, media, and template overlays.

  * **Route:** `frontend/app/pocs/brand-assets`

  * **Key Elements:** Storage meter, category filters (Logos, Fonts, Media, Templates, Documents), asset preview drawer, drag-and-drop upload zone.

* \[ \] **Page 6 — Web Content Portal**

  * **Spec:** Live website preview and site-specific content manager.

  * **Route:** `frontend/app/pocs/web-portal`

  * **Key Elements:** Website preview iframe container, page list manager, Brand Assets summary bar, SEO health score widget.

* \[ \] **Page 7 — Import My World (Wizard Flow)**

  * **Spec:** Multi-step ingestion wizard connecting existing drives and platforms.

  * **Route:** `frontend/app/pocs/import-world`

  * **Key Elements:** 5-step status checklist, source connector cards (Google Drive, Dropbox, Notion, Instagram, YouTube), auto-categorization progress animation.

* \[ \] **Page 8 — The Tornado (Creative Workspace Transition)**

  * **Spec:** Visual representation of assets transforming into an organized state ("Chaos to Clarity").

  * **Route:** `frontend/app/pocs/tornado-workspace`

  * **Key Elements:** Transition graphic panel, Torando command center dashboard, metrics summary, Today's Focus checklist.

### Stage 3: Core Content Engine

* \[ \] **Page 9 — Content Workspace / Project Pipeline**

  * **Spec:** The core Phase 1 creation entry hub.

  * **Route:** `frontend/app/pocs/content-workspace`

  * **Key Elements:** 3 main entry path cards ("Create With Me", "Quick Draft", "Bring Something In"), "Continue Where You Left Off" carousel, quick mobile/desktop voice capture bar.

* \[ \] **Page 10 — Single-Post Creation Loop (5 Sub-Layers)**

  * **Spec:** End-to-end single content object lifecycle engine.

  * **Route:** `frontend/app/pocs/single-post`

  * **Sub-View Tabs:**

    * \[ \] `10a (Dashboard)`: Persistent home showing post status timeline ($Idea \rightarrow Assets \rightarrow Message \rightarrow Visual \rightarrow Review \rightarrow Ready$).

    * \[ \] `10b (Caption/Text Editor)`: Side-by-side original vs. AI-suggested text editor with version history (V1, V2, V3) and action buttons (Accept/Reject/Adjust).

    * \[ \] `10c (Visual/Asset Editor)`: Canvas inspector with locked original asset vs. working version, layer list, and template selector.

    * \[ \] `10d (Review/Final Preview)`: Post package validation checklist, platform preview (1:1 / 9:16 carousel), and "Approve & Mark Ready" action.

    * \[ \] `10e (Ready/Schedule)`: Confirmation screen with date/time picker, scheduling options, and calendar router.

### Stage 4: Management & Distribution Hubs

* \[ \] **Page 11 — Posts Gallery / Content Library**

  * **Spec:** Master content library displaying all past and current posts.

  * **Route:** `frontend/app/pocs/posts-gallery`

  * **Key Elements:** Status pill filters (All, Ideas, In Progress, Review, Ready, Scheduled, Published), post card grid with platform badges and "Repurpose" action dropdown.

* \[ \] **Page 12 — Content Calendar / Planning View**

  * **Spec:** Weekly and monthly content scheduling view.

  * **Route:** `frontend/app/pocs/calendar`

  * **Key Elements:** Week/Month view switcher, platform color-coded post blocks, quick popover details drawer on card click.

* \[ \] **Page 13 — Idea Box**

  * **Spec:** Rapid capture inbox and visual sticky-note canvas.

  * **Route:** `frontend/app/pocs/idea-box`

  * **Key Elements:** Quick voice note input, categorized idea cards, drag-to-pipeline triggers.

* \[ \] **Candidate 2 — Content Prep & Organizer**

  * **Spec:** Shoot logistics checklist and reusable resource contact inventory.

  * **Route:** `frontend/app/pocs/content-prep`

  * **Key Elements:** Shoot date organizer, supplies checklist, reusable team/location picker.

* \[ \] **Page 14 — Platform Selection & Publish Routing**

  * **Spec:** Multi-channel formatting and traffic-light post readiness status.

  * **Route:** `frontend/app/pocs/publish-routing`

  * **Key Elements:** Traffic-light readiness badges (Green/Yellow/Red), per-platform format transformers (LinkedIn, Instagram, TikTok, YouTube).

* \[ \] **Page 15 — Creator Dashboard**

  * **Spec:** Central executive command dashboard for the creator.

  * **Route:** `frontend/app/pocs/creator-dashboard`

  * **Key Elements:** Next Best Action banner, Content Pipeline summary counters, Recent Wins feed, weekly momentum charts.

### Stage 5: Final Promotion & Documentation Lock

* \[ \] **Interactive Visual Verification**

  * Test all routes live on `http://localhost:3000/pocs/[route]` using the top Playground nav switcher.

  * Verify every component toggles cleanly between Light mode (`☀️`) and Dark mode (`🌙`).

* \[ \] **Production Route Promotion**

  * Move approved routes from `frontend/app/pocs/` to `frontend/app/(dashboard)/`.

* \[ \] **Documentation Consolidation**

  * Run **Agent Prompt 4** to generate `docs/ux/DESIGN_SYSTEM.md` and clean up obsolete doc files.

### Summary of Next Steps

1. The TODO list is now saved at `docs/ux/PHASE1_PAGES_TODO.md`.

2. You can pick any unchecked page (e.g., **Page 9: Content Workspace** or **Page 10: Single-Post Loop**) and run the corresponding command template with your coding agent.

3. Mark off items as you complete each screen and verify it in your local playground!