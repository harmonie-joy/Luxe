---
name: build-luxe-page
description: Recreates a specific page from THE LUXE Mario Spec PDF into an interactive Next.js route inside frontend/app/pocs/ using design tokens and atomic UI primitives.
---

# Skill: Build LUXE Spec Page

## Execution Context
- Input Reference: `pocs/.UIUX/` and `pocs/archive/THE_LUXE_Mario_Spec.pdf`
- Target Code Directory: `frontend/app/pocs/[page-route]/`
- Design Tokens: `frontend/styles/theme.css`
- Core UI Primitives: `frontend/components/ui/`

## Strict Operating Rules
1. Zero Hex Codes: Use ONLY theme variables (`bg-bg-app`, `bg-bg-surface`, `border-border-subtle`, `text-text-primary`, `text-text-secondary`, `bg-accent`).
2. Dual Theme Compatibility: Ensure every component renders correctly in both Light and Dark mode (`.dark` parent container).
3. Component Reuse: Always import and reuse atomic primitives from `frontend/components/ui/` (Button, Card, Badge, Input, Table, Tabs).
4. No Doc Sprawl: Do NOT write markdown logs, update docs/ files, or create GitHub issues during visual component construction.
5. Interactive Prototype: Include local React state (`useState`) for tabs, dropdowns, modal triggers, and status filters so the UI can be tested physically in the browser.

## Workflow Steps

### Step 1: Extract Page Spec Context
Identify the target Page Number (e.g., Page 9, Page 10a, Page 2b).
- Read the corresponding spec details (WHAT, HOW, WHY, WORKS IF) and mockup image from the PDF/PNG.
- Determine the sub-components and datasets required.

### Step 2: Define Mock Data Schema
Create or update `frontend/lib/mock-data/pocs-data.ts` to add typed TypeScript mock data specific to this page (e.g., `mockPostLoop`, `mockCreatorDNA`, `mockBrandKit`).

### Step 3: Implement Next.js Page Component
Create `frontend/app/pocs/[page-route]/page.tsx`:
- Add `"use client"` at the top.
- Build the page layout structure using Tailwind CSS v4 flex/grid utilities.
- Wire up interactive toggles (e.g., switching between "Original Input" and "Working Version" in Page 10).

### Step 4: Add Navigation Link
Add the new route link to the top header in `frontend/app/pocs/layout.tsx` so it appears in the Design System Playground switcher.