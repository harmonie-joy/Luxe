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
  tone: string[];
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
