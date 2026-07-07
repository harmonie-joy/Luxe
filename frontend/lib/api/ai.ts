import { httpClient } from "./http-client";
import type { BrandAsset } from "@/types/brand-profile";
import type { ContentChannel, DraftStatus } from "@/types/content";

export interface BrandVoiceExtractionRequest {
  workspace: string;
  brand_profile: string;
  asset_ids: readonly string[];
}

// Extraction suggestions mirror the backend BrandVoiceExtractionResult
// pydantic schema verbatim (snake_case model_dump).

export interface ToneDimensionsSuggestion {
  funny: number;
  casual: number;
  irreverent: number;
  enthusiastic: number;
  justification: string;
}

export interface VocabularyRuleSuggestion {
  term: string;
  instead_of: string | null;
  note: string;
}

export interface BannedPhraseSuggestion {
  phrase: string;
  reason: string;
  severity: "hard" | "soft";
}

export interface ClaimBoundarySuggestion {
  rule: string;
  reason: string;
}

export interface VoiceExampleSuggestion {
  kind: "do" | "dont";
  text: string;
  annotation: string;
  channel: string;
}

export interface AudienceSegmentSuggestion {
  name: string;
  buyer_type: string;
  maturity_level:
    | "unaware"
    | "problem_aware"
    | "solution_aware"
    | "product_aware"
    | "expert";
  pains: readonly string[];
  desired_outcomes: readonly string[];
  jargon_tolerance: number;
}

export interface PositioningSuggestion {
  category: string;
  key_benefit: string;
  differentiators: readonly string[];
  reasons_to_believe: readonly string[];
  known_for: string;
}

export interface BrandVoiceExtractionSuggestions {
  voice_summary: string;
  tone: ToneDimensionsSuggestion;
  tone_tags: readonly string[];
  point_of_view: string;
  sentence_style: string;
  pacing: string;
  proof_style: string;
  claim_boundaries: readonly ClaimBoundarySuggestion[];
  preferred_vocabulary: readonly VocabularyRuleSuggestion[];
  banned_phrases: readonly BannedPhraseSuggestion[];
  examples: readonly VoiceExampleSuggestion[];
  audience_segments: readonly AudienceSegmentSuggestion[];
  positioning: PositioningSuggestion;
  confidence: number;
  extraction_notes: string;
}

export interface ExtractedVoiceRef {
  id: string;
  version: number;
  isActive: boolean;
}

export interface BrandVoiceExtractionResponse {
  aiRunId: string;
  /** The persisted BrandVoice version this extraction created. */
  voice: ExtractedVoiceRef;
  suggestions: BrandVoiceExtractionSuggestions;
}

export interface BrandAssetAnalysisResponse {
  aiRunIds: readonly string[];
  assets: readonly BrandAsset[];
  warnings: readonly { assetId: string; message: string }[];
}

export function analyzeBrandAssets(
  payload: BrandVoiceExtractionRequest,
): Promise<BrandAssetAnalysisResponse> {
  return httpClient.post<BrandAssetAnalysisResponse>(
    "/api/ai/brand/analyze-assets/",
    payload,
  );
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
