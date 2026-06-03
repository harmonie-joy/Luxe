export type ContentChannel =
  | "linkedin"
  | "instagram"
  | "blog"
  | "newsletter"
  | "x"
  | "short_video";

export type DraftStatus =
  | "draft"
  | "in_review"
  | "needs_changes"
  | "approved"
  | "scheduled"
  | "published";

export type ContentLifecycleStatus = DraftStatus;

export interface ContentDraft {
  id: string;
  workspaceId: string;
  briefId: string;
  title: string;
  content: string;
  channel: ContentChannel;
  status: DraftStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledContent {
  id: string;
  draftId: string;
  scheduledFor: string;
  channel: ContentChannel;
  status: DraftStatus;
  publishedAt?: string;
}
