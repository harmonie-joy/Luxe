import type {
  BrandProfile,
  BrandVoiceTone,
  BrandVocabularyRule,
} from "@/types/brand-profile";

export interface BrandVoicePageCopy {
  eyebrow: string;
  title: string;
  description: string;
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

export interface BrandVoiceSetupData {
  pageHeader: BrandVoicePageCopy;
  profile: BrandProfile;
  toneOptions: readonly BrandToneOption[];
  vocabularyRules: readonly BrandVocabularyRule[];
  bannedPhrases: readonly BannedPhrase[];
  sampleContent: SampleContentConfig;
}

export const mockBrandVoiceSetup = {
  pageHeader: {
    eyebrow: "Brand Voice",
    title: "Define the voice behind every luxury moment.",
    description:
      "Capture tone, audience, language guardrails, and sample references so future content drafts stay unmistakably on-brand.",
  },
  profile: {
    id: "the-luxe-signature",
    name: "THE LUXE Signature Voice",
    region: "North America",
    tones: ["sophisticated", "authoritative", "approachable"],
    audience:
      "Affluent fashion and lifestyle clients seeking curated, high-touch editorial guidance without inflated language.",
  },
  toneOptions: [
    {
      value: "professional",
      label: "Professional",
      description: "Clear, composed, and polished.",
      selected: false,
    },
    {
      value: "authoritative",
      label: "Authoritative",
      description: "Confident guidance with editorial control.",
      selected: true,
    },
    {
      value: "sophisticated",
      label: "Sophisticated",
      description: "Refined language with restraint.",
      selected: true,
    },
    {
      value: "approachable",
      label: "Approachable",
      description: "Warm, human, and easy to understand.",
      selected: true,
    },
    {
      value: "visionary",
      label: "Visionary",
      description: "Forward-looking without exaggeration.",
      selected: false,
    },
  ],
  vocabularyRules: [
    {
      id: "craftsmanship",
      preferredTerm: "craftsmanship",
      restrictedTerms: ["artisan vibes", "handmade-ish"],
      note: "Use when describing production quality or provenance.",
    },
    {
      id: "clientele",
      preferredTerm: "clientele",
      restrictedTerms: ["customers", "buyers"],
      note: "Use for premium audience references.",
    },
    {
      id: "curated-edit",
      preferredTerm: "curated edit",
      restrictedTerms: ["drop", "haul"],
      note: "Use for seasonal selections and editorial collections.",
    },
  ],
  bannedPhrases: [
    {
      id: "cheap-luxury",
      phrase: "affordable luxury",
      reason: "Dilutes premium positioning.",
    },
    {
      id: "viral",
      phrase: "go viral",
      reason: "Too trend-led for the brand voice.",
    },
    {
      id: "disruptive",
      phrase: "disruptive",
      reason: "Feels generic and overused.",
    },
  ],
  sampleContent: {
    pasteDefaultValue:
      "A considered edit of sculptural silhouettes, tactile finishes, and quiet statement pieces designed for clients who value presence over spectacle.",
    uploadHelpText:
      "Add existing campaign copy, product notes, or editorial samples to guide future voice analysis.",
    acceptedFormats: [".txt", ".md", ".docx", ".pdf"],
    samples: [
      {
        id: "editorial-launch-note",
        title: "Editorial launch note",
        source: "Pasted sample",
        format: "Text",
        wordCount: 42,
        status: "Ready",
      },
      {
        id: "atelier-collection-brief",
        title: "Atelier collection brief",
        source: "Uploaded file",
        format: "PDF",
        wordCount: 680,
        status: "Needs review",
      },
    ],
  },
} as const satisfies BrandVoiceSetupData;
