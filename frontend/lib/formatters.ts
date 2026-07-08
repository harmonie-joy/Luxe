import type {
  AudienceMaturityLevel,
  BrandAssetSourceType,
  BrandAssetStatus,
} from "@/types/brand-profile";
import type {
  ComplianceCategory,
  ComplianceSeverity,
  ComplianceStatus,
} from "@/types/compliance";
import type { ContentChannel, DraftStatus } from "@/types/content";

export const BRAND_ASSET_SOURCE_LABELS: Record<BrandAssetSourceType, string> = {
  pasted: "Pasted sample",
  uploaded: "Uploaded file",
  crawled: "Crawled from URL",
};

export const BRAND_ASSET_STATUS_LABELS: Record<BrandAssetStatus, string> = {
  ready: "Ready",
  needs_review: "Needs review",
  excluded: "Excluded",
};

export const AUDIENCE_MATURITY_LABELS: Record<AudienceMaturityLevel, string> = {
  unaware: "Unaware",
  problem_aware: "Problem-aware",
  solution_aware: "Solution-aware",
  product_aware: "Product-aware",
  expert: "Expert",
};

export const CONTENT_CHANNEL_LABELS: Record<ContentChannel, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  blog: "Blog",
  newsletter: "Newsletter",
  x: "X",
  short_video: "Short Video",
};

export const DRAFT_STATUS_LABELS: Record<DraftStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  needs_changes: "Needs Changes",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
};

export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  green: "Green",
  yellow: "Yellow",
  red: "Red",
};

export const COMPLIANCE_CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  gdpr: "GDPR",
  consent: "Consent",
  ip: "IP",
  claims: "Claims",
};

export const COMPLIANCE_SEVERITY_LABELS: Record<ComplianceSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

/**
 * Derives a short month and day string from an ISO 8601 timestamp.
 * Used by calendar/schedule display components.
 */
export function formatShortDate(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  return {
    month: d.toLocaleString("en-US", { month: "short" }),
    day: String(d.getDate()),
  };
}

/**
 * Formats an ISO 8601 timestamp as a human-readable date (e.g. "Jun 3, 2026").
 */
export function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
