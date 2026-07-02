export type BrandVoiceTone =
  | "professional"
  | "authoritative"
  | "sophisticated"
  | "approachable"
  | "visionary";

export interface BrandProfile {
  id: string;
  workspaceId: string;
  name: string;
  audience: string;
  tone: readonly BrandVoiceTone[];
  preferredVocabulary: readonly BrandVocabularyRule[];
  bannedPhrases: readonly BannedPhrase[];
  positioningNotes?: string;
  sampleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandVocabularyRule {
  id: string;
  preferredTerm: string;
  restrictedTerms: readonly string[];
  note?: string;
}

export interface BrandToneOption {
  value: BrandVoiceTone;
  label: string;
  description: string;
  selected: boolean;
}

export interface BannedPhrase {
  id: string;
  phrase: string;
  reason: string;
}

export interface SampleContentConfig {
  pasteDefaultValue: string;
  uploadHelpText: string;
  acceptedFormats: readonly string[];
  samples: readonly BrandAsset[];
}

// Canonical API-aligned type matching backend BrandAsset model.
export type BrandAssetSourceType = "pasted" | "uploaded";
export type BrandAssetStatus = "ready" | "needs_review";
export type BrandAssetMediaType = "text" | "image" | "audio_transcript";

export interface BrandAsset {
  id: string;
  workspaceId: string;
  brandProfileId: string;
  title: string;
  content: string;
  mediaType: BrandAssetMediaType;
  file: string;
  mimeType: string;
  analysisSummary: string;
  sourceType: BrandAssetSourceType;
  format: string;
  wordCount: number;
  status: BrandAssetStatus;
  createdAt: string;
  updatedAt: string;
}
