export type ContentChannel =
  | "linkedin"
  | "instagram"
  | "blog"
  | "newsletter"
  | "pressRelease";

export type ContentLifecycleStatus =
  | "draft"
  | "inReview"
  | "approved"
  | "scheduled"
  | "published";

export interface ContentDraft {
  id: string;
  title: string;
  channel: ContentChannel;
  status: ContentLifecycleStatus;
  ownerId: string;
  updatedAt: string;
}

export interface ScheduledContent {
  id: string;
  draftId: string;
  publishAt: string;
  channel: ContentChannel;
  status: ContentLifecycleStatus;
}
