---
name: harmonize-stage-flow
description: Audits UI consistency, enforces theme tokens, standardizes UI primitives, builds a shared state context, and connects isolated prototype mockups into a continuous, stateful, and clickable multi-screen application flow.
---

# Skill: Harmonize Stage Flow (v2)

## Purpose
Transforms isolated prototype screens into a unified, stateful application flow. Audits visual design tokens, refactors raw HTML elements into shared UI primitives, creates state continuity between screens, and implements sequential navigation bridges so users can walk through the entire experience using in-page actions.

## Core Directives for Executing Agents

### 1. Autonomous Navigation & Flow Inference
- **Eliminate Dead-End Actions:** Scan all buttons (e.g., "Get Started", "Start Chat", "End Call", "Save Profile", "Explore Asset Kit"). Ensure EVERY primary action button performs a state update or navigates to the logical next route rather than serving as a static mock trigger.
- **Sub-View Resolution:** For multi-step pages (e.g., `Discover Me` path choice -> chat -> live call), ensure completion of the sub-views automatically advances the user to the next parent route (`Creator DNA`).
- **Inject Persistent Flow Footer:** Create and include a standardized `<StageFlowFooter>` component at the bottom of target pages:
  - `← Previous Step` button (routing to N-1).
  - Step counter breadcrumb (e.g., `Step 2 of 5`).
  - `Next Step →` primary CTA button (routing to N+1).

### 2. Stateful Data Continuity
- **Shared Stage Context:** Build or update a shared React state/context (`frontend/lib/state/use-stage-store.ts` or React Context) so user inputs in early screens (e.g., chat choices in `Discover Me`) dynamically populate data fields in downstream screens (`Creator DNA`, `Brand Kit`).

### 3. Strict Design Token & Component Standardization
- **Zero Hex Codes:** Enforce theme utility classes ONLY (`bg-bg-app`, `bg-bg-surface`, `text-text-primary`, `text-text-secondary`, `border-border-subtle`, `bg-accent`).
- **Primitive Enforcement:** Replace raw `<button>`, `<input>`, `<card>`, and `<div>` containers with UI primitives from `frontend/components/ui/` (`Button`, `Card`, `Badge`, `Input`, `Tabs`).
- **Typography & Grid Hierarchy:** Standardize title sizes (`text-2xl font-bold tracking-tight text-text-primary`), body copy (`text-sm text-text-secondary`), card padding (`p-6`), and grid gaps (`gap-6`).
- **Dark Mode Synchronization:** Ensure all backgrounds, panels, and borders respond dynamically to `.dark` class toggles.

---

## Step-by-Step Execution Protocol

### Step 1: Shared Flow State & Footer Setup
1. Create `frontend/components/pocs/stage-flow-footer.tsx`:
   - Accepts `prevRoute`, `nextRoute`, `currentStep`, `totalSteps`, `nextLabel`.
   - Renders a fixed/sticky bottom action bar styled with theme tokens.
2. Create `frontend/lib/state/stage-context.tsx`:
   - Stores user selections across screens (e.g., brand voice, onboarding choices, target goals).

### Step 2: In-Page Route & Action Wiring
1. Scan target `.tsx` files in `frontend/app/pocs/`.
2. Wire all primary hero buttons (e.g., "Get Started" in `welcome/page.tsx`) to push the router to the next page.
3. Attach `<StageFlowFooter>` to the bottom of each page component inside the stage scope.

### Step 3: Visual & Token Refactoring
1. Sweep all target `.tsx` files to remove hardcoded color codes (`#ffffff`, `#1e293b`, etc.).
2. Standardize cards, headers, borders, and input fields to use `frontend/components/ui/` primitives.

### Step 4: Compilation Verification
1. Run `npm run type-check` or `tsc --noEmit`.
2. Confirm zero lint or TypeScript errors across modified files.