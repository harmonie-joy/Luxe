---
name: harmonize-stage-flow
description: Audits UI consistency, enforces theme tokens, standardizes UI primitives, and wires up sequential navigation routes to build a unified, clickable prototype flow across targeted screens or combined stages.
---

# Skill: Harmonize Stage Flow

## Purpose
Takes a set of generated prototype screens, audits them for visual consistency against the theme system, standardizes UI primitive usage, and wires up primary CTAs to create a seamless, clickable multi-screen flow.

## Inputs Required
1. **Target Stage Scope:** (e.g., `Stage 1`, `Stage 2`, or `Combined Stage 1 + 2`)
2. **Page List:** List of target `.tsx` files in `frontend/app/pocs/`
3. **Sequential Flow Order:** Ordered list of route transitions (e.g., `/pocs/route-a` → `/pocs/route-b` → `/pocs/route-c`)

---

## Execution Guardrails & Rules

1. **Theme Tokens Only:** 
   - Mandatory check for hardcoded hex values (e.g., `#ffffff`, `#1e293b`). Replace ALL hardcoded colors with Tailwind theme utility classes (`bg-bg-app`, `bg-bg-surface`, `text-text-primary`, `text-text-secondary`, `border-border-subtle`, `bg-accent`).
2. **Primitive Component Enforcement:**
   - Standardize all inline buttons to `<Button>` components from `frontend/components/ui/button.tsx`.
   - Wrap major structural containers in standard `<Card>` components or `bg-bg-surface border border-border-subtle rounded-[var(--radius-card)] p-6`.
3. **Dark Mode Verification:**
   - Ensure every text label, panel background, input border, and badge updates dynamically when `.dark` mode is active on the root layout.
4. **Navigation Wiring:**
   - Wire up primary "Continue / Next Step" buttons on each page to push to the next sequential route using `next/link` or Next.js `useRouter`.
   - Add a subtle step progress header across pages in the sequence (e.g., `[Stage Name] - Step X of Y`).
5. **Zero Context Sprawl:**
   - Do NOT create markdown logs, doc updates, or GitHub issues during code execution. Output ONLY refactored `.tsx` code.

---

## Step-by-Step Execution Workflow

### Step 1: Scan & Audit Target Pages
Read all target page components in `frontend/app/pocs/`. Identify:
- Inconsistent heading sizes (standardize to `text-2xl font-semibold tracking-tight text-text-primary`).
- Non-standard card padding or missing borders.
- Broken or missing CTA routing links.

### Step 2: Apply Theme & Primitive Standardizations
Refactor JSX styling across all target files:
- Replace raw `<button>` elements with `<Button variant="...">`.
- Unify input fields, drop-down menus, and badges using `frontend/components/ui/`.
- Ensure flex containers and grid gaps match standard spacing tokens (`gap-4` or `gap-6`).

### Step 3: Wire Sequential Route Connections
Using the provided **Sequential Flow Order**:
- On Page N, set the primary CTA click handler or `<Link>` `href` to point directly to Page N+1.
- On Page N+1, include a "← Back" button pointing to Page N.
- Add/update the step breadcrumb header at the top of each page content area.

### Step 4: Verification
- Execute TypeScript check (`npm run type-check` or `tsc --noEmit`).
- Verify clean compilation with zero linting errors.