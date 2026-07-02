import type { BrandVoiceTone } from "@/types/brand-profile";

/**
 * Answers collected by the initial brand onboarding wizard. These are UI-side
 * questionnaire fields; they are mapped onto the existing BrandProfile and
 * BrandAsset API payloads on submit (no dedicated backend model).
 */
export interface OnboardingAnswers {
  brandName: string;
  creatorRole: string;
  projectDescription: string;
  audience: string;
  /** Selected canonical tones (friendly labels map to these values in the UI). */
  toneIntent: readonly BrandVoiceTone[];
  preferredWords: string;
  avoidedPhrases: string;
  personalityNotes: string;
  contentPillars: string;
  formats: string;
  firstGoal: string;
  complianceBoundaries: string;
}
