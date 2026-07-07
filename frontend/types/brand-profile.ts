import type { ContentChannel } from "@/types/content";

export type BrandVoiceTone =
  | "professional"
  | "authoritative"
  | "sophisticated"
  | "approachable"
  | "visionary";

export type BrandArchetype =
  | "innocent"
  | "sage"
  | "explorer"
  | "outlaw"
  | "magician"
  | "hero"
  | "lover"
  | "jester"
  | "everyperson"
  | "caregiver"
  | "ruler"
  | "creator";

export type BrandMaturityStage = "idea" | "new" | "growing" | "established";

export interface BrandDifferentiator {
  claim: string;
  vs: string;
}

export interface BrandCompetitor {
  name: string;
  url: string;
  notes: string;
}

/** Recognition assets stored as raw JSON; keys stay snake_case in the API. */
export interface DistinctiveAssets {
  colors?: readonly string[];
  fonts?: readonly string[];
  taglines?: readonly string[];
  recurring_motifs?: readonly string[];
  emoji_signature?: readonly string[];
}

export interface BrandProfile {
  id: string;
  workspaceId: string;
  name: string;
  maturityStage: BrandMaturityStage;
  primaryLanguage: string;
  industry: string;
  // Positioning statement, decomposed.
  category: string;
  keyBenefit: string;
  differentiators: readonly BrandDifferentiator[];
  reasonsToBelieve: readonly string[];
  competitors: readonly BrandCompetitor[];
  knownFor: string;
  mission: string;
  values: readonly string[];
  tagline: string;
  // Personality (archetype + Aaker dimension scores, 0-100).
  archetype: BrandArchetype | "";
  secondaryArchetype: BrandArchetype | "";
  personalitySincerity: number;
  personalityExcitement: number;
  personalityCompetence: number;
  personalitySophistication: number;
  personalityRuggedness: number;
  distinctiveAssets: DistinctiveAssets;
  activeVoiceId: string | null;
  // Deprecated flat voice fields — replaced by BrandVoice/AudienceSegment;
  // kept while existing screens still read them.
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
export type BrandAssetSourceType = "pasted" | "uploaded" | "crawled";
export type BrandAssetStatus = "ready" | "needs_review" | "excluded";
export type BrandAssetMediaType = "text" | "image" | "audio_transcript";
export type BrandAssetPerformanceSignal = "unknown" | "top" | "average" | "poor";

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
  sourceUrl: string;
  channel: ContentChannel | "";
  language: string;
  performanceSignal: BrandAssetPerformanceSignal;
  contentDate: string | null;
  format: string;
  wordCount: number;
  status: BrandAssetStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Voice DNA (versioned BrandVoice + related entities)
// JSON payload entries keep their backend snake_case keys — DRF only
// camelCases top-level fields.
// ---------------------------------------------------------------------------

export interface BrandVoiceToneSliders {
  funny: number;
  casual: number;
  irreverent: number;
  enthusiastic: number;
}

export interface VoiceVocabularyRule {
  term: string;
  instead_of: string | null;
  note: string;
}

export type VoiceRuleSeverity = "hard" | "soft";

export interface VoiceBannedPhrase {
  phrase: string;
  reason: string;
  severity: VoiceRuleSeverity;
}

export interface VoiceClaimBoundary {
  rule: string;
  reason: string;
}

export interface BrandVoice {
  id: string;
  brandProfileId: string;
  version: number;
  isActive: boolean;
  /** BrandAsset ids this version was extracted from (provenance). */
  extractedFrom: readonly string[];
  voiceSummary: string;
  /** NN/g tone-of-voice dimensions, each 0-100. */
  tone: BrandVoiceToneSliders;
  toneTags: readonly string[];
  pointOfView: string;
  sentenceStyle: string;
  pacing: string;
  proofStyle: string;
  claimBoundaries: readonly VoiceClaimBoundary[];
  preferredVocabulary: readonly VoiceVocabularyRule[];
  bannedPhrases: readonly VoiceBannedPhrase[];
  extractionConfidence: number;
  extractionNotes: string;
  createdAt: string;
}

export type VoiceExampleKind = "do" | "dont";

export interface VoiceExample {
  id: string;
  voiceId: string;
  kind: VoiceExampleKind;
  text: string;
  annotation: string;
  channel: ContentChannel | "";
  sourceAssetId: string | null;
  createdAt: string;
}

export type AudienceMaturityLevel =
  | "unaware"
  | "problem_aware"
  | "solution_aware"
  | "product_aware"
  | "expert";

export interface AudienceSegment {
  id: string;
  brandProfileId: string;
  name: string;
  isPrimary: boolean;
  buyerType: string;
  maturityLevel: AudienceMaturityLevel;
  pains: readonly string[];
  desiredOutcomes: readonly string[];
  jargonTolerance: number;
  objections: readonly string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelStyle {
  id: string;
  brandProfileId: string;
  channel: ContentChannel;
  /** Deltas (-50..+50) applied to the active voice's tone sliders. */
  toneFunnyDelta: number;
  toneCasualDelta: number;
  toneIrreverentDelta: number;
  toneEnthusiasticDelta: number;
  targetLength: string;
  structureNorms: string;
  emojiPolicy: string;
  hashtagPolicy: string;
  ctaStyle: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceViolation {
  span: string;
  issue: string;
  severity: VoiceRuleSeverity;
  suggested_fix: string;
}

export interface VoiceAuditDimensionScores {
  tone_alignment: number;
  vocabulary: number;
  sentence_style: number;
  claims: number;
  channel_fit: number;
}

export interface VoiceAuditScore {
  id: string;
  voiceId: string;
  channel: ContentChannel | "";
  draftExcerpt: string;
  overallScore: number;
  dimensionScores: VoiceAuditDimensionScores;
  violations: readonly VoiceViolation[];
  aiRunId: string | null;
  createdAt: string;
}
