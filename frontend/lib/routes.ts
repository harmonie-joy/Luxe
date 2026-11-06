export const APP_ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  contentItemNew: "/content-items/new",
  contentItems: "/content-items",
  brandVoice: "/brand-voice",
  brandVoiceProfile: "/brand-voice/profile",
  brandVoiceAnalysis: "/brand-voice/analysis",
  brandVoiceSamples: "/brand-voice/samples",
  create: "/create",
  drafts: "/drafts",
  compliance: "/compliance",
  calendar: "/calendar",
  account: "/account",
  pocsWelcome: "/pocs/welcome",
  pocsDiscoverMe: "/pocs/discover-me",
  pocsCreatorDNA: "/pocs/creator-dna",
  pocsBrandKit: "/pocs/brand-kit",
  pocsBrandAssetKit: "/pocs/brand-asset-kit",
  pocsStageOneBrandAssetKit: "/pocs/brand-asset-kit",
  pocsImportWorld: "/pocs/import-world",
  pocsTornadoWorkspace: "/pocs/tornado-workspace",
  pocsContentWorkspace: "/pocs/content-workspace",
  pocsSinglePost: "/pocs/single-post",
  pocsPostsGallery: "/pocs/posts-gallery",
  pocsCalendar: "/pocs/calendar",
  pocsIdeaBox: "/pocs/idea-box",
  pocsHome: "/pocs/home",
  pocsPlan: "/pocs/plan",
  pocsImpact: "/pocs/impact",
  pocsTornado: "/pocs/tornado",
  pocsComponents: "/pocs/components",
  pocsBrandGuide: "/pocs/brand-guide",
  pocsAestheticBoard: "/pocs/aesthetic-board",
  pocsWebPortal: "/pocs/web-portal",
} as const;

export const POC_NAV_ITEMS = [
  { href: APP_ROUTES.pocsHome, label: "Home" },
  { href: APP_ROUTES.pocsPlan, label: "Plan" },
  { href: APP_ROUTES.pocsContentWorkspace, label: "Create" },
  { href: APP_ROUTES.pocsCalendar, label: "Calendar" },
  { href: APP_ROUTES.pocsImpact, label: "Impact" },
  { href: APP_ROUTES.pocsPostsGallery, label: "Library" },
  { href: APP_ROUTES.pocsCreatorDNA, label: "Brand/DNA" },
] as const;

export const POC_STAGE_ROUTES = [
  APP_ROUTES.pocsWelcome,
  APP_ROUTES.pocsDiscoverMe,
  APP_ROUTES.pocsCreatorDNA,
  APP_ROUTES.pocsBrandKit,
  APP_ROUTES.pocsStageOneBrandAssetKit,
  APP_ROUTES.pocsImportWorld,
  APP_ROUTES.pocsTornado,
  APP_ROUTES.pocsHome,
  APP_ROUTES.pocsPlan,
  APP_ROUTES.pocsContentWorkspace,
  APP_ROUTES.pocsSinglePost,
  APP_ROUTES.pocsPostsGallery,
  APP_ROUTES.pocsImpact,
] as const;

/** Dynamic route for a single brand asset sample detail page. */
export function brandVoiceSampleRoute(id: string): string {
  return `${APP_ROUTES.brandVoiceSamples}/${id}`;
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

export type NavigationChildItem = Readonly<{
  href: AppRoutePath;
  label: string;
}>;

export type NavigationItem = Readonly<{
  href: AppRoutePath;
  icon: NavigationIcon;
  label: string;
  exact?: boolean;
  children?: readonly NavigationChildItem[];
}>;

export type TopbarLink = Readonly<{
  href: AppRoutePath;
  label: string;
}>;

export const PRIMARY_NAV_ITEMS: readonly NavigationItem[] = [
  {
    href: APP_ROUTES.dashboard,
    icon: "dashboard",
    label: "Creator Home",
    exact: true,
  },
  {
    href: APP_ROUTES.brandVoice,
    icon: "brandVoice",
    label: "Brand Voice",
    children: [
      { href: APP_ROUTES.brandVoiceProfile, label: "Profile" },
      { href: APP_ROUTES.brandVoiceAnalysis, label: "Analysis" },
      { href: APP_ROUTES.brandVoiceSamples, label: "Samples" },
    ],
  },
  {
    href: APP_ROUTES.drafts,
    icon: "drafts",
    label: "Draft Studio",
  },
] as const;

export const SECONDARY_NAV_ITEMS: readonly NavigationItem[] = [
  {
    href: APP_ROUTES.create,
    icon: "create",
    label: "Create Brief",
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

export const APP_PAGE_LABELS: readonly NavigationChildItem[] = [
  { href: APP_ROUTES.contentItemNew, label: "Create With Me" },
  { href: APP_ROUTES.contentItems, label: "Single-Post Dashboard" },
  ...PRIMARY_NAV_ITEMS.flatMap((item) => [...(item.children ?? []), item]),
  ...SECONDARY_NAV_ITEMS,
  { href: APP_ROUTES.account, label: "Account" },
  { href: APP_ROUTES.onboarding, label: "Onboarding" },
];

export function contentItemRoute(id: string): string {
  return `${APP_ROUTES.contentItems}/${encodeURIComponent(id)}`;
}
