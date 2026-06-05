import type { WorkspaceRole } from "@/types/workspace";

export type ContentChannel =
  | "linkedin"
  | "instagram"
  | "blog"
  | "newsletter"
  | "x"
  | "short_video";

export type CampaignGoal =
  | "educate"
  | "announce"
  | "promote"
  | "fundraise"
  | "thought_leadership";

export type DraftStatus =
  | "draft"
  | "in_review"
  | "needs_changes"
  | "approved"
  | "scheduled"
  | "published";

export type ContentLifecycleStatus = DraftStatus;

export interface ContentBrief {
  id: string;
  workspaceId: string;
  brandProfileId: string;
  contentObjective: string;
  campaignGoal: CampaignGoal;
  audience: string;
  angle: string;
  constraints: string;
  targetChannels: readonly ContentChannel[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentDraft {
  id: string;
  workspaceId: string;
  briefId: string;
  title: string;
  content: string;
  channel: ContentChannel;
  status: DraftStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledContent {
  id: string;
  workspaceId: string;
  draftId: string;
  channel: ContentChannel;
  status: DraftStatus;
  scheduledFor: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  workspaceId: string;
  draftId: string;
  userId: string | null;
  role: WorkspaceRole;
  createdAt: string;
}

export interface DraftComment {
  id: string;
  draftId: string;
  authorName: string;
  authorInitials: string;
  body: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  createdAt: string;
}
