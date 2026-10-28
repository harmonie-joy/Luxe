export type WorkflowStage = "idea" | "drafting";
export type ContentItemChannel = "linkedin";

export interface ContentTemplate {
  id: string;
  name: string;
  channel: ContentItemChannel;
  version: number;
  body: string;
}

export type PinnedContentTemplate = Pick<ContentTemplate, "id" | "name" | "channel" | "version">;

export interface Project {
  id: string;
  workspaceId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckpointSnapshot {
  goal: string;
  workflowStage: WorkflowStage;
  nextAction: string;
  decisions: readonly string[];
  openQuestions: readonly string[];
}

export interface ContentItem extends CheckpointSnapshot {
  id: string;
  projectId: string;
  brandProfileId: string;
  brandVoiceId: string;
  channel: ContentItemChannel;
  contentTemplate: PinnedContentTemplate | null;
  title: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItemContext {
  item: ContentItem;
  checkpoint: CheckpointSnapshot & { id: string; revision: number; createdAt: string };
  brandVoice: { id: string; version: number; isApproved: boolean };
}

export interface BrandVoiceApproval {
  id: string;
  workspaceId: string;
  voiceId: string;
  approvedById: string;
  event: "accepted";
  approvedAt: string;
}
