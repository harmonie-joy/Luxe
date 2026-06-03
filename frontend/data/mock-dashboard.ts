import type { ContentChannel } from "@/types/content";

export type DashboardMetricTone = "primary" | "neutral" | "critical" | "success";
export type DashboardStatusTone =
  | "primary"
  | "neutral"
  | "critical"
  | "warning"
  | "success"
  | "info";

export interface DashboardCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface DashboardSectionCopy {
  eyebrow: string;
  title: string;
}

export interface DashboardStatus {
  label: string;
  tone: DashboardStatusTone;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  detail: string;
  tone: DashboardMetricTone;
}

export interface ReviewQueueItem {
  id: string;
  title: string;
  owner: string;
  submittedAt: string;
  status: DashboardStatus;
}

export interface ScheduledContentItem {
  id: string;
  title: string;
  channel: ContentChannel;
  scheduledFor: string;
  status: DashboardStatus;
}

export interface DashboardData {
  pageHeader: DashboardCopy;
  systemStatus: DashboardStatus;
  reviewQueueSection: DashboardSectionCopy;
  scheduledContentSection: DashboardSectionCopy;
  metrics: readonly DashboardMetric[];
  reviewQueue: readonly ReviewQueueItem[];
  scheduledContent: readonly ScheduledContentItem[];
}

export const mockDashboard = {
  pageHeader: {
    eyebrow: "Workspace",
    title: "Workspace Overview",
    description:
      "Manage your brand narrative, review posture, and upcoming content from a single operating view.",
  },
  systemStatus: {
    label: "System Optimal",
    tone: "success",
  },
  reviewQueueSection: {
    eyebrow: "Review Queue",
    title: "Drafts Awaiting Attention",
  },
  scheduledContentSection: {
    eyebrow: "Schedule",
    title: "Upcoming Content",
  },
  metrics: [
    {
      id: "active-campaigns",
      label: "Active Campaigns",
      value: 4,
      detail: "+1 this week",
      tone: "primary",
    },
    {
      id: "drafts-in-review",
      label: "Drafts in Review",
      value: 12,
      detail: "Pending review",
      tone: "neutral",
    },
    {
      id: "compliance-warnings",
      label: "Compliance Warnings",
      value: 3,
      detail: "Action required",
      tone: "critical",
    },
    {
      id: "scheduled-posts",
      label: "Scheduled Posts",
      value: 8,
      detail: "This week",
      tone: "success",
    },
  ],
  reviewQueue: [
    {
      id: "review-q4-brand-manifesto",
      title: "Q4 Brand Manifesto Video",
      owner: "Legal Review",
      submittedAt: "2026-06-03T07:00:00.000Z",
      status: {
        label: "In Review",
        tone: "warning",
      },
    },
    {
      id: "review-spring-collection",
      title: "Spring Collection Brief",
      owner: "Legal Dept.",
      submittedAt: "2026-06-03T04:00:00.000Z",
      status: {
        label: "Approved",
        tone: "success",
      },
    },
    {
      id: "review-social-promo",
      title: "Social Promo A",
      owner: "Brand Voice Check",
      submittedAt: "2026-06-02T14:00:00.000Z",
      status: {
        label: "Flagged",
        tone: "critical",
      },
    },
  ],
  scheduledContent: [
    {
      id: "scheduled-product-teaser",
      title: "Product Teaser Video",
      channel: "linkedin",
      scheduledFor: "2026-10-08T09:00:00.000Z",
      status: {
        label: "Scheduled",
        tone: "primary",
      },
    },
    {
      id: "scheduled-executive-series",
      title: "Executive Interview Series",
      channel: "blog",
      scheduledFor: "2026-10-15T09:00:00.000Z",
      status: {
        label: "On Track",
        tone: "success",
      },
    },
    {
      id: "scheduled-partner-announcement",
      title: "Partner Announcement",
      channel: "newsletter",
      scheduledFor: "2026-10-18T09:00:00.000Z",
      status: {
        label: "Pending Compliance",
        tone: "warning",
      },
    },
  ],
} as const satisfies DashboardData;
