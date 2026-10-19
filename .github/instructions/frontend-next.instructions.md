---
applyTo: "frontend/**"
---

> **Current scope:** Use `frontend/AGENTS.md`, `docs/04_NEXT_ACTIONS.md` and the approved issue when older examples below mention mock-only pages or the July navigation flow. Live creator workflows require real persistence and truthful error states.

## Frontend Theme and UI Rules

- Use the centralized THE LUXE theme tokens.
- Do not hardcode hex colors in components.
- Use semantic status mappings for compliance and workflow states.
- Keep generic UI primitives in `frontend/components/ui/`.
- Keep feature-specific components in `frontend/features/<feature>/components/`.
- Keep route files focused on page composition.
- Use `frontend/lib/routes.ts` instead of repeated hardcoded route paths.
- Do not import from `temp/` or prototype exports.
- Mock data must use realistic IDs and ISO 8601 timestamps.

## Frontend Next.js Guidelines

- Keep shared domain types in `frontend/types/`.
- Avoid duplicating domain interfaces inside feature folders.
- Keep mock data in `frontend/data/mock-*.ts` aligned with backend-like API shapes.
- Components should consume typed props.
- Status values must match the canonical enums.
- Routes should follow the current approved Creator/CEO flow: authenticated Creator Home, accepted BrandVoice context, persisted Project/ContentItem, save/resume and one truthful next action. The historical dashboard/brief/draft/compliance/calendar sequence remains reusable but is not the current priority.
- Frontend-only fields should be clearly marked or avoided.
- Forms should collect all backend-required fields.
- Mock data should look like realistic API responses, including IDs and ISO 8601 timestamps.
- Prefer using `frontend/lib/routes.ts` for shared route constants instead of hardcoding route strings repeatedly.
- When a frontend screen models backend data, shape the UI state so it can later swap from mock data to API data without major refactoring.

---

### Theme and UI Rules

Styling is handled through a layered system: design tokens defined in `frontend/styles/theme.css` as CSS custom properties, a Tailwind v4 `@theme inline` bridge in `globals.css` that exposes select tokens as Tailwind color/font utilities, and a library of `luxe-*` semantic CSS component classes defined in `theme.css` that components apply directly.

- **Design tokens live in `frontend/styles/theme.css`** as CSS custom properties (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--motion-*`, `--font-size-*`). Do not hardcode color values or spacing in component files.
- **Dark mode** is supported via the `.dark` or `[data-theme="dark"]` class on a parent element. Token overrides are declared inside that selector block in `theme.css`. Never implement dark mode with Tailwind's `dark:` prefix on arbitrary values.
- **Use `luxe-*` semantic classes for all visual design decisions** (e.g., `luxe-card`, `luxe-field`, `luxe-eyebrow`, `luxe-primary-action`). Use Tailwind utilities only for layout and structural concerns (flex, grid, spacing, overflow, sizing).
- **Do not mix Tailwind color utilities** (e.g., `bg-amber-700`) with the design token system. Use `luxe-*` classes or the bridged `bg-luxe-*` Tailwind tokens defined via `@theme inline` in `globals.css`.
- **Typography** uses two font variables: `--font-luxe-sans` (Inter) for UI text and `--font-luxe-serif` (Libre Caslon Text) for display headings and numeric values. Apply the serif via the `luxe-serif` class or `font-[var(--font-luxe-serif)]`.
- **Do not introduce a third-party component library** (e.g., shadcn, Radix, MUI). Build new UI from `luxe-*` classes and small focused components in `frontend/components/ui/`.
- **Shared UI primitives** (e.g., `SurfaceCard`, `StatusIndicator`) live in `frontend/components/ui/`. Feature-specific UI belongs inside the relevant `frontend/features/<feature>/components/` folder.
- **Motion** should use `luxe-interactive` or `luxe-transition` classes; do not introduce arbitrary `transition-*` utilities unless they directly reference a `--motion-*` variable.

---

### Mock Data Conventions

Mock data is stored as named TypeScript exports in `frontend/data/mock-*.ts` files. There is no MSW, fixtures directory, or `__mocks__` folder. Pages import mock data directly and pass it as props to feature components, making it straightforward to replace with API calls later.

- **All mock data files must live in `frontend/data/`** and follow the `mock-<feature>.ts` naming convention (e.g., `mock-dashboard.ts`, `mock-brand-profiles.ts`).
- **Import and use types from `frontend/types/`** at the top of every mock file. Never define entity shapes inline inside mock files.
- **Mock files may define additional UI-layer types** (e.g., `DashboardMetricTone`, `BrandVoicePageCopy`) alongside the entity data when the page needs presentation-specific fields not in the domain type. These UI types belong in the mock file, not in `frontend/types/`.
- **Named exports only** — export one or more named constants (e.g., `export const mockDashboard = { ... }`). Do not use default exports for mock data.
- **Entity objects must include `id`, `workspaceId` (where applicable), `createdAt`, and `updatedAt`** as ISO 8601 strings. Do not omit these fields to keep the shape realistic.
- **Enum field values must match the canonical enum strings** defined in the `copilot-instructions.md` (e.g., `status: "in_review"`, `channel: "linkedin"`).
- **Production page components must use real API data when representing saved creator work.** Mock fixtures are allowed in explicit demo/test modes only and must not masquerade as production persistence. The feature component must accept the same shape that a real API response would return, so switching from mock to API requires only changing the data source in the page, not the component.
- **Do not use random or auto-generated placeholder values** (e.g., lorem ipsum, `Math.random()`). Mock data should resemble realistic content for the domain.

---

### Route Conventions

The project uses the **Next.js App Router**. All routes live under `frontend/app/`. The `(app)` route group wraps all authenticated product screens and applies the shared `PageShell` layout (sidebar and topbar). The root layout is intentionally minimal.

- **Use the `(app)` route group** for all product screens that require the sidebar/topbar shell. Add new pages as `frontend/app/(app)/<route>/page.tsx`. The group's `layout.tsx` applies `PageShell` and the product fonts.
- **Root `app/layout.tsx`** is the minimal HTML shell. It must only contain the `<html>` and `<body>` tags with global CSS and base font variables. Do not add product chrome here.
- **Page files must be thin.** A page component should only import mock data (or in future, fetch data) and pass it to the relevant feature component. Business logic, layout, and JSX must not live in `page.tsx` files.
- **All route path strings must be defined in `frontend/lib/routes.ts`** in the `APP_ROUTES` constant. Never hardcode a path string in a component or `<Link>`.
- **Navigation structure** (primary nav items, footer nav items, topbar links) is also defined in `frontend/lib/routes.ts` as typed `readonly` constants. Do not scatter navigation config across layout components.
- **Active route detection** must use the `isActiveRoute` helper pattern (exact match for leaf routes, `startsWith` for parent routes with an `exact` flag).
- **Do not use the Pages Router** (`frontend/pages/`). All new routes use the App Router.
- **Dynamic and nested routes** should follow the App Router conventions: `[param]` for dynamic segments, `(group)` for route groups without URL impact, and nested `layout.tsx` files for scoped shells.
- **MVP route order** is defined by the scoped issue and `docs/04_NEXT_ACTIONS.md`, not by the legacy `/dashboard` → `/brand-voice` → `/create` → `/drafts` → `/compliance` → `/calendar` sequence.

---

### Frontend Type Alignment Rules

All shared domain types are maintained manually in `frontend/types/` as TypeScript `interface` and `type` declarations. There is no schema generation from the backend. Types must stay aligned with the canonical MVP domain model described in `copilot-instructions.md`.

- **All entity and enum types live in `frontend/types/`**, organised by domain concern (e.g., `brand-profile.ts`, `content.ts`, `compliance.ts`, `workspace.ts`). Never define a shared domain interface inside a feature folder.
- **Enum values are declared as TypeScript union string literals** (e.g., `export type DraftStatus = "draft" | "in_review" | ...`), not as TypeScript `enum` objects. Union literals are easier to extend and serialise.
- **Enum values must match the canonical backend strings** defined in `copilot-instructions.md` exactly. Any change must be applied in the backend model, the frontend type, and all mock data in the same task.
- **Entity types must include `id: string`, `workspaceId: string`, `createdAt: string`, and `updatedAt: string`** on top-level entities. Timestamps are always ISO 8601 strings, not `Date` objects.
- **Use `readonly` arrays** for collections on entity types that should not be mutated client-side (e.g., `issues: readonly ComplianceIssue[]`).
- **Mark optional backend fields with `?`** (e.g., `positioningNotes?: string`). Do not add fields that have no backend equivalent.
- **Component prop interfaces are defined locally** in the component file using types imported from `frontend/types/`. Do not re-export prop interfaces from `frontend/types/`.
- **If a type is renamed or superseded**, keep a deprecated alias (e.g., `export type ComplianceFinding = ComplianceIssue`) temporarily to avoid breaking consumers, then clean it up in a follow-up task.
- **UI-only presentation types** (e.g., tone classifications for metric cards) that have no backend equivalent should be defined in the mock data file or the component file, not in `frontend/types/`.
- **Do not generate types from the backend schema** automatically. The types are intentionally hand-maintained to keep the frontend contract explicit during the MVP phase.

