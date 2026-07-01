/**
 * Content Brief API client.
 *
 * Read responses from the backend arrive in camelCase and map directly to the
 * frontend domain type (ContentBrief).
 *
 * Write payloads must use snake_case to match the DRF serializer field names.
 * That mapping stays inside this module so UI code can remain API-shape agnostic.
 */

import type {
  CampaignGoal,
  ContentBrief,
  ContentChannel,
} from "@/types/content";

import { httpClient } from "./http-client";

export interface CreateContentBriefPayload {
  workspace: string;
  brand_profile: string;
  content_objective: string;
  campaign_goal: CampaignGoal;
  audience: string;
  angle?: string;
  constraints?: string;
  target_channels: readonly ContentChannel[];
}

export type UpdateContentBriefPayload = Partial<
  Omit<CreateContentBriefPayload, "workspace" | "brand_profile">
> & {
  workspace?: string;
  brand_profile?: string;
};

export function getContentBriefs(): Promise<ContentBrief[]> {
  return httpClient.get<ContentBrief[]>("/api/content-briefs/");
}

export function getContentBrief(id: string): Promise<ContentBrief> {
  return httpClient.get<ContentBrief>(`/api/content-briefs/${id}/`);
}

export function createContentBrief(
  payload: CreateContentBriefPayload,
): Promise<ContentBrief> {
  return httpClient.post<ContentBrief>("/api/content-briefs/", payload);
}

export function updateContentBrief(
  id: string,
  payload: UpdateContentBriefPayload,
): Promise<ContentBrief> {
  return httpClient.patch<ContentBrief>(`/api/content-briefs/${id}/`, payload);
}

export function deleteContentBrief(id: string): Promise<void> {
  return httpClient.delete<void>(`/api/content-briefs/${id}/`);
}
