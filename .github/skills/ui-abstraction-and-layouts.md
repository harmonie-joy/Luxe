---
name: ui-abstraction-and-layouts-generalized
description: Scans any consolidated Next.js frontend routes, page directories, or list of feature items (onboarding, workspaces, galleries, dashboards, forms), dynamically identifies repetitive visual/structural patterns, extracts reusable atomic/composite components into frontend/components/ui/, and standardizes layout templates in frontend/components/layouts/ for scalable feature development.
---
# Skill: UI Abstraction & Layout Extraction

## Purpose
Run this skill after building, consolidating, or prototyping any set of frontend screens or routes. It dynamically inspects target page directories or item lists, identifies recurring visual patterns and macro page structures regardless of application domain, extracts clean, theme-aware custom components into `frontend/components/ui/`, and standardizes reusable layout templates in `frontend/components/layouts/`.

## Inputs Required
1. **Target Scope / Routes:** Path to target route directory (e.g. `frontend/app/pocs/`, `frontend/app/(dashboard)/`) OR an explicit list of page/item routes.
2. **Target Component Directory:** `frontend/components/ui/` (default, or custom path)
3. **Target Layout Directory:** `frontend/components/layouts/` (default, or custom path)

---

## Directives & Operating Rules

1. **Dynamic Target Scanning & Categorization:**
   - Do NOT rely on hardcoded page names or fixed domain lists.
   - Automatically discover all page components under the target scope or iterate through provided item lists.
   - Categorize detected pages into standard structural archetypes:
     - **Wizard / Multi-Step Flow** (sequential setup, onboarding, stepped forms)
     - **Dashboard / Command Center Shell** (sidebar navigation, top toolbar, main widget canvas)
     - **Split-Pane / Canvas View** (dual panels, inspector sidebars, master-detail editors)
     - **Gallery / Grid Workspace** (search bar, filter pills, responsive card grids)
2. **Strict Theme Custom Property Compliance:**
   - All extracted components and layouts MUST use CSS theme custom properties / Tailwind utility classes (`bg-bg-app`, `bg-bg-surface`, `border-border-subtle`, `text-text-primary`, `text-text-secondary`, `bg-accent`).
   - Zero hardcoded hex colors allowed.
3. **TypeScript & Prop Interfaces:**
   - Every extracted component and layout wrapper must export a clear TypeScript interface defining its props, variants, and optional `className?: string`.
4. **Non-Destructive Refactoring:**
   - Replace inline JSX in original page files with newly extracted components and layout wrappers to preserve 100% functional parity.
5. **Zero Context Sprawl:**
   - Output clean `.tsx` and `.ts` files directly. Do NOT create extra markdown documentation unless requested.

---

## Step-by-Step Execution Workflow

### Step 1: Dynamic Route Audit & Pattern Discovery
Scan target routes/pages to detect recurring patterns:
- **UI Element Patterns:** Stat/metric counters, filter pill strips, status badges, media/content cards, search toolbars, step progress headers.
- **Layout Structure Patterns:** Page headers, sidebar containers, sticky action footers, split-pane dividers, responsive grid wrappers.

### Step 2: Component Abstraction (`frontend/components/ui/`)
For each recurring UI pattern found across 2+ pages:
1. Create a typed, theme-aware component file in `frontend/components/ui/[component-name].tsx`.
2. Support variants (sizes, states, dark mode).
3. Export from `frontend/components/ui/index.ts`.

### Step 3: Layout Template Extraction (`frontend/components/layouts/`)
For each macro structural layout archetype detected:
1. Create a layout wrapper component in `frontend/components/layouts/[layout-name].tsx`.
2. Make wrappers accept slot props (`children`, `sidebar`, `header`, `footer`, `actions`).

### Step 4: Page Refactoring & Verification
1. Update target page files to consume the new custom components and layout wrappers.
2. Run `tsc --noEmit` or type checks to ensure zero compilation or type errors.
