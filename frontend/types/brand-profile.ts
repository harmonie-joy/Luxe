export type BrandVoiceTone =
  | "professional"
  | "authoritative"
  | "sophisticated"
  | "approachable"
  | "visionary";

export interface BrandProfile {
  id: string;
  name: string;
  region: string;
  tones: readonly BrandVoiceTone[];
  audience: string;
}

export interface BrandVocabularyRule {
  id: string;
  preferredTerm: string;
  restrictedTerms: readonly string[];
  note?: string;
}
