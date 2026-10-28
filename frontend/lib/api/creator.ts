import { httpClient } from "./http-client";
import type { BrandVoiceApproval, ContentItem, ContentItemChannel, ContentItemContext, ContentTemplate, Project, WorkflowStage } from "@/types/creator";

export interface SnapshotPayload {
  goal: string;
  workflow_stage: WorkflowStage;
  next_action: string;
  decisions: readonly string[];
  open_questions: readonly string[];
}
export interface CreateContentItemPayload extends SnapshotPayload {
  project: string;
  brand_profile: string;
  brand_voice: string;
  title: string;
  channel: ContentItemChannel;
  content_template: string;
}
export interface CheckpointPayload extends SnapshotPayload {
  expected_revision: number;
  client_request_id: string;
}
export const getProjects = (workspace: string) => httpClient.get<Project[]>(`/api/projects/?workspace=${encodeURIComponent(workspace)}`);
export const getContentTemplates = (workspace: string) => httpClient.get<ContentTemplate[]>(`/api/content-templates/?workspace=${encodeURIComponent(workspace)}`);
export const createProject = (workspace: string, name: string) => httpClient.post<Project>("/api/projects/", { workspace, name });
export const getContentItems = (workspace: string) => httpClient.get<ContentItem[]>(`/api/content-items/?workspace=${encodeURIComponent(workspace)}`);
export const createContentItem = (payload: CreateContentItemPayload) => httpClient.post<ContentItemContext>("/api/content-items/", payload);
export const getContentItemContext = (id: string) => httpClient.get<ContentItemContext>(`/api/content-items/${encodeURIComponent(id)}/context/`);
export const saveCheckpoint = (id: string, payload: CheckpointPayload) => httpClient.post<ContentItemContext>(`/api/content-items/${encodeURIComponent(id)}/checkpoint/`, payload);
export const approveBrandVoice = (id: string) => httpClient.post<BrandVoiceApproval>(`/api/brand-voices/${encodeURIComponent(id)}/approve/`, {});
