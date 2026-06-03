/**
 * Content Draft API client.
 *
 * Read responses from the backend arrive in camelCase and map directly to the
 * frontend domain type (ContentDraft). Write payloads stay snake_case for DRF.
 */

import type { ContentChannel, ContentDraft, DraftStatus } from "@/types/content";

import { httpClient } from "./http-client";

export interface CreateContentDraftPayload {
  brief: string;
  title: string;
  content?: string;
  channel: ContentChannel;
  status?: DraftStatus;
}

export type UpdateContentDraftPayload = Partial<CreateContentDraftPayload>;

export function getContentDrafts(briefId?: string): Promise<ContentDraft[]> {
  const query = briefId ? `?brief=${encodeURIComponent(briefId)}` : "";
  return httpClient.get<ContentDraft[]>(`/api/content-drafts/${query}`);
}

export function getContentDraft(id: string): Promise<ContentDraft> {
  return httpClient.get<ContentDraft>(`/api/content-drafts/${id}/`);
}

export function createContentDraft(
  payload: CreateContentDraftPayload,
): Promise<ContentDraft> {
  return httpClient.post<ContentDraft>("/api/content-drafts/", payload);
}

export function updateContentDraft(
  id: string,
  payload: UpdateContentDraftPayload,
): Promise<ContentDraft> {
  return httpClient.patch<ContentDraft>(`/api/content-drafts/${id}/`, payload);
}
