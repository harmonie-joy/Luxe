export const APP_ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  brandVoice: "/brand-voice",
  create: "/create",
  drafts: "/drafts",
  compliance: "/compliance",
  calendar: "/calendar",
} as const;

/** Dynamic route for a single brand asset sample detail page. */
export function brandVoiceSampleRoute(id: string): string {
  return `/brand-voice/samples/${id}`;
}

/** Dynamic route for reviewing compliance results for a single content draft. */
export function complianceReviewRoute(draftId: string): string {
  return `${APP_ROUTES.compliance}/${draftId}`;
}

/** Draft Studio route, optionally scoped to a selected content brief. */
export function draftStudioRoute(briefId?: string): string {
  if (!briefId) return APP_ROUTES.drafts;
  return `${APP_ROUTES.drafts}?brief=${encodeURIComponent(briefId)}`;
}

export type AppRouteKey = keyof typeof APP_ROUTES;
export type AppRoutePath = (typeof APP_ROUTES)[AppRouteKey];

export type NavigationIcon =
  | "dashboard"
  | "brandVoice"
  | "create"
  | "drafts"
  | "compliance"
  | "calendar";

export type NavigationItem = Readonly<{
  href: AppRoutePath;
  icon: NavigationIcon;
  label: string;
  exact?: boolean;
}>;

export type TopbarLink = Readonly<{
  href: AppRoutePath;
  label: string;
}>;

export const PRIMARY_NAV_ITEMS: readonly NavigationItem[] = [
  {
    href: APP_ROUTES.dashboard,
    icon: "dashboard",
    label: "Dashboard",
    exact: true,
  },
  {
    href: APP_ROUTES.brandVoice,
    icon: "brandVoice",
    label: "Brand Voice",
  },
  {
    href: APP_ROUTES.drafts,
    icon: "drafts",
    label: "Drafts",
  },
  {
    href: APP_ROUTES.compliance,
    icon: "compliance",
    label: "Compliance",
  },
  {
    href: APP_ROUTES.calendar,
    icon: "calendar",
    label: "Calendar",
  },
] as const;

export const TOPBAR_LINKS: readonly TopbarLink[] = [
  {
    href: APP_ROUTES.home,
    label: "Home",
  },
  {
    href: APP_ROUTES.dashboard,
    label: "Dashboard",
  },
] as const;

export const CREATE_BRIEF_ROUTE = APP_ROUTES.create;
