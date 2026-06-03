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
  tone: BrandVoiceTone[];
  preferredVocabulary: string[];
  bannedPhrases: string[];
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

export interface SampleContentItem {
  id: string;
  title: string;
  source: "Pasted sample" | "Uploaded file";
  format: string;
  wordCount: number;
  status: "Ready" | "Needs review";
}

export interface SampleContentConfig {
  pasteDefaultValue: string;
  uploadHelpText: string;
  acceptedFormats: readonly string[];
  samples: readonly SampleContentItem[];
}
