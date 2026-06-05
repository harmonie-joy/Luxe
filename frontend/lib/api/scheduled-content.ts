/**
 * Scheduled Content API client.
 *
 * Read responses arrive in camelCase and match the frontend ScheduledContent
 * type. Write payloads stay snake_case for the DRF serializer.
 */

import type { ContentChannel, DraftStatus, ScheduledContent } from "@/types/content";

import { httpClient } from "./http-client";

export interface CreateScheduledContentPayload {
  workspace: string;
  draft: string;
  channel: ContentChannel;
  status?: DraftStatus;
  scheduled_for: string;
  published_at?: string | null;
}

export type UpdateScheduledContentPayload =
  Partial<CreateScheduledContentPayload>;

export interface ScheduledContentFilters {
  workspaceId?: string;
  draftId?: string;
}

function buildScheduledContentQuery(filters: ScheduledContentFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.workspaceId) params.set("workspace", filters.workspaceId);
  if (filters.draftId) params.set("draft", filters.draftId);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getScheduledContent(
  filters?: ScheduledContentFilters,
): Promise<ScheduledContent[]> {
  return httpClient.get<ScheduledContent[]>(
    `/api/scheduled-content/${buildScheduledContentQuery(filters)}`,
  );
}

export function getScheduledContentItem(id: string): Promise<ScheduledContent> {
  return httpClient.get<ScheduledContent>(`/api/scheduled-content/${id}/`);
}

export function createScheduledContent(
  payload: CreateScheduledContentPayload,
): Promise<ScheduledContent> {
  return httpClient.post<ScheduledContent>("/api/scheduled-content/", payload);
}

export function updateScheduledContent(
  id: string,
  payload: UpdateScheduledContentPayload,
): Promise<ScheduledContent> {
  return httpClient.patch<ScheduledContent>(
    `/api/scheduled-content/${id}/`,
    payload,
  );
}
