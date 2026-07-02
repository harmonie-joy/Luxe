import type {
  BrandAsset,
  BrandProfile,
  BrandToneOption,
  SampleContentConfig,
} from "@/types/brand-profile";

export interface BrandVoicePageCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface BrandVoiceSetupData {
  pageHeader: BrandVoicePageCopy;
  profile: BrandProfile;
  toneOptions: readonly BrandToneOption[];
  sampleContent: SampleContentConfig;
  source: "api" | "mock";
  loadError?: string;
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
    workspaceId: "workspace-the-luxe",
    name: "THE LUXE Signature Voice",
    audience:
      "Affluent fashion and lifestyle clients seeking curated, high-touch editorial guidance without inflated language.",
    tone: ["sophisticated", "authoritative", "approachable"],
    preferredVocabulary: [
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
    positioningNotes:
      "THE LUXE occupies the quiet luxury tier — editorial authority without aspirational overreach. Content should feel considered, never promotional. Avoid urgency-led language and trend-chasing framing.",
    sampleCount: 2,
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-02T15:30:00.000Z",
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
  sampleContent: {
    pasteDefaultValue:
      "A considered edit of sculptural silhouettes, tactile finishes, and quiet statement pieces designed for clients who value presence over spectacle.",
    uploadHelpText:
      "Add existing campaign copy, product notes, or editorial samples to guide future voice analysis.",
    acceptedFormats: [".txt", ".md", ".docx", ".pdf", ".png", ".jpg", ".jpeg", ".webp"],
    samples: [
      {
        id: "editorial-launch-note",
        workspaceId: "workspace-the-luxe",
        brandProfileId: "the-luxe-signature",
        title: "Editorial launch note",
        content: "",
        mediaType: "text",
        file: "",
        mimeType: "",
        analysisSummary:
          "Calm editorial copy with premium audience cues and restrained vocabulary.",
        sourceType: "pasted",
        format: "Text",
        wordCount: 42,
        status: "ready",
        createdAt: "2026-06-01T09:00:00.000Z",
        updatedAt: "2026-06-02T10:00:00.000Z",
      },
      {
        id: "atelier-collection-brief",
        workspaceId: "workspace-the-luxe",
        brandProfileId: "the-luxe-signature",
        title: "Atelier collection brief",
        content: "",
        mediaType: "text",
        file: "",
        mimeType: "application/pdf",
        analysisSummary:
          "Collection guidance favors quiet authority, craftsmanship language, and no urgency-led claims.",
        sourceType: "uploaded",
        format: "PDF",
        wordCount: 680,
        status: "needs_review",
        createdAt: "2026-06-01T10:15:00.000Z",
        updatedAt: "2026-06-01T14:00:00.000Z",
      },
    ] satisfies BrandAsset[],
  },
  source: "mock",
} satisfies BrandVoiceSetupData;
