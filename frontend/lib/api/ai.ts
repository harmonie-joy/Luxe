import { httpClient } from "./http-client";

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
