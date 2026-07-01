import { httpClient } from "./http-client";
import type { ContentChannel, DraftStatus } from "@/types/content";

export interface BrandVoiceExtractionRequest {
  workspace: string;
  brand_profile: string;
  asset_ids: readonly string[];
}

export interface BrandVoiceVocabularySuggestion {
  preferred_term: string;
  restricted_terms: readonly string[];
  note: string;
}

export interface BrandVoiceBannedPhraseSuggestion {
  phrase: string;
  reason: string;
}

export interface BrandVoiceExtractionSuggestions {
  audience: string;
  tone: readonly string[];
  preferred_vocabulary: readonly BrandVoiceVocabularySuggestion[];
  banned_phrases: readonly BrandVoiceBannedPhraseSuggestion[];
  positioning_notes: string;
}

export interface BrandVoiceExtractionResponse {
  aiRunId: string;
  suggestions: BrandVoiceExtractionSuggestions;
}

export function extractBrandVoice(
  payload: BrandVoiceExtractionRequest,
): Promise<BrandVoiceExtractionResponse> {
  return httpClient.post<BrandVoiceExtractionResponse>(
    "/api/ai/brand/extract/",
    payload,
  );
}

export interface DraftGenerationRequest {
  workspace: string;
  brief: string;
  channels: readonly ContentChannel[];
}

export interface GeneratedDraft {
  id: string;
  brief: string;
  channel: ContentChannel;
  title: string;
  content: string;
  status: DraftStatus;
}

export interface DraftGenerationResponse {
  aiRunIds: readonly string[];
  drafts: readonly GeneratedDraft[];
}

export function generateDrafts(
  payload: DraftGenerationRequest,
): Promise<DraftGenerationResponse> {
  return httpClient.post<DraftGenerationResponse>(
    "/api/ai/drafts/generate/",
    payload,
  );
}
