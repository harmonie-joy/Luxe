import type {
  AudienceSegment,
  BrandAsset,
  BrandProfile,
  BrandToneOption,
  BrandVoice,
  ChannelStyle,
  SampleContentConfig,
  VoiceAuditScore,
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

/**
 * Neutral defaults for the structured Voice DNA fields added to BrandProfile.
 * Spread into fixtures that predate the structured architecture.
 */
export const baseVoiceDnaProfileFields = {
  maturityStage: "established",
  primaryLanguage: "en",
  industry: "",
  category: "",
  keyBenefit: "",
  differentiators: [],
  reasonsToBelieve: [],
  competitors: [],
  knownFor: "",
  mission: "",
  values: [],
  tagline: "",
  archetype: "",
  secondaryArchetype: "",
  personalitySincerity: 50,
  personalityExcitement: 50,
  personalityCompetence: 50,
  personalitySophistication: 50,
  personalityRuggedness: 50,
  distinctiveAssets: {},
  activeVoiceId: null,
} satisfies Partial<BrandProfile>;

/** Neutral defaults for the evidence fields added to BrandAsset. */
export const baseAssetEvidenceFields = {
  sourceUrl: "",
  channel: "",
  language: "en",
  performanceSignal: "unknown",
  contentDate: null,
} satisfies Partial<BrandAsset>;

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
    maturityStage: "established",
    primaryLanguage: "en",
    industry: "Luxury fashion and lifestyle",
    category: "private editorial styling service",
    keyBenefit: "keeps every client touchpoint unmistakably on-brand",
    differentiators: [
      {
        claim: "Voice rules a writer can execute, not adjectives",
        vs: "generic tone-of-voice decks",
      },
    ],
    reasonsToBelieve: [
      "Voice versions extracted from real client-facing samples",
      "Persisted voice audits on every reviewed draft",
    ],
    competitors: [],
    knownFor: "Quiet-luxury editorial guidance without aspirational overreach.",
    mission: "Considered content for clients who value presence over spectacle.",
    values: ["restraint", "craftsmanship", "discretion"],
    tagline: "Presence over spectacle.",
    archetype: "ruler",
    secondaryArchetype: "sage",
    personalitySincerity: 60,
    personalityExcitement: 25,
    personalityCompetence: 85,
    personalitySophistication: 95,
    personalityRuggedness: 10,
    distinctiveAssets: {
      recurring_motifs: ["quiet luxury", "considered edit"],
    },
    activeVoiceId: "voice-the-luxe-v2",
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
        sourceUrl: "",
        channel: "newsletter",
        language: "en",
        performanceSignal: "top",
        contentDate: "2026-05-12",
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
        sourceUrl: "",
        channel: "",
        language: "en",
        performanceSignal: "unknown",
        contentDate: null,
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

// ---------------------------------------------------------------------------
// Voice DNA mocks (mirror /api/brand-voices/, /api/audience-segments/,
// /api/channel-styles/, /api/voice-audit-scores/ response shapes)
// ---------------------------------------------------------------------------

export const mockBrandVoices = [
  {
    id: "voice-the-luxe-v2",
    brandProfileId: "the-luxe-signature",
    version: 2,
    isActive: true,
    extractedFrom: ["editorial-launch-note", "atelier-collection-brief"],
    voiceSummary:
      "Composed editorial authority. Opens with the point, favors craftsmanship specifics over superlatives, and never uses urgency-led framing.",
    tone: { funny: 10, casual: 20, irreverent: 10, enthusiastic: 35 },
    toneTags: ["quietly confident", "considered", "editorial"],
    pointOfView: "we-to-you",
    sentenceStyle:
      "Open with the answer. One idea per sentence. Concrete nouns over abstractions.",
    pacing: "Measured and unhurried; no exclamation marks.",
    proofStyle: "Provenance and craft details, never invented metrics.",
    claimBoundaries: [
      {
        rule: "Never guarantee availability or outcomes.",
        reason: "No sample substantiates outcome claims.",
      },
    ],
    preferredVocabulary: [
      { term: "clientele", instead_of: "customers", note: "Premium references." },
      { term: "curated edit", instead_of: "drop", note: "Seasonal selections." },
    ],
    bannedPhrases: [
      { phrase: "affordable luxury", reason: "Dilutes positioning.", severity: "hard" },
      { phrase: "go viral", reason: "Trend-led.", severity: "soft" },
    ],
    extractionConfidence: 74,
    extractionNotes:
      "Strong written-sample coverage; no social captions yet, so short-form tone is inferred.",
    createdAt: "2026-06-02T15:30:00.000Z",
  },
  {
    id: "voice-the-luxe-v1",
    brandProfileId: "the-luxe-signature",
    version: 1,
    isActive: false,
    extractedFrom: [],
    voiceSummary: "Seeded from the legacy tone tags during migration.",
    tone: { funny: 10, casual: 20, irreverent: 10, enthusiastic: 35 },
    toneTags: ["sophisticated", "authoritative", "approachable"],
    pointOfView: "",
    sentenceStyle: "",
    pacing: "",
    proofStyle: "",
    claimBoundaries: [],
    preferredVocabulary: [
      { term: "craftsmanship", instead_of: "artisan vibes", note: "" },
    ],
    bannedPhrases: [
      { phrase: "affordable luxury", reason: "Dilutes positioning.", severity: "soft" },
    ],
    extractionConfidence: 0,
    extractionNotes:
      "Tone sliders are seeded from the legacy tone tags, not extracted from samples.",
    createdAt: "2026-06-01T09:00:00.000Z",
  },
] as const satisfies readonly BrandVoice[];

export const mockAudienceSegments = [
  {
    id: "segment-private-clients",
    brandProfileId: "the-luxe-signature",
    name: "Private styling clients",
    isPrimary: true,
    buyerType: "affluent consumer",
    maturityLevel: "product_aware",
    pains: ["Generic luxury marketing", "Urgency-led sales language"],
    desiredOutcomes: ["Considered guidance", "Wardrobe-level curation"],
    jargonTolerance: 35,
    objections: ["Is this just another seasonal push?"],
    notes: "Responds to invitation-led, appointment-based framing.",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-02T15:30:00.000Z",
  },
] as const satisfies readonly AudienceSegment[];

export const mockChannelStyles = [
  {
    id: "channel-style-linkedin",
    brandProfileId: "the-luxe-signature",
    channel: "linkedin",
    toneFunnyDelta: 0,
    toneCasualDelta: 10,
    toneIrreverentDelta: 0,
    toneEnthusiasticDelta: 5,
    targetLength: "80-120 words",
    structureNorms: "Thought-leadership framing, single soft CTA, no headers.",
    emojiPolicy: "none",
    hashtagPolicy: "max 2, brand-owned only",
    ctaStyle: "soft invitation, never urgency-driven",
    notes: "",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-02T15:30:00.000Z",
  },
  {
    id: "channel-style-newsletter",
    brandProfileId: "the-luxe-signature",
    channel: "newsletter",
    toneFunnyDelta: 0,
    toneCasualDelta: -5,
    toneIrreverentDelta: 0,
    toneEnthusiasticDelta: 0,
    targetLength: "150-200 words",
    structureNorms: "Serif opener, advisor framing, no discount codes.",
    emojiPolicy: "none",
    hashtagPolicy: "none",
    ctaStyle: "personal appointment invitation",
    notes: "",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-02T15:30:00.000Z",
  },
] as const satisfies readonly ChannelStyle[];

export const mockVoiceAuditScores = [
  {
    id: "audit-private-preview-linkedin",
    voiceId: "voice-the-luxe-v2",
    channel: "linkedin",
    draftExcerpt:
      "THE LUXE will host a private preview of the autumn couture capsule for invited clients and partners...",
    overallScore: 86,
    dimensionScores: {
      tone_alignment: 88,
      vocabulary: 90,
      sentence_style: 82,
      claims: 95,
      channel_fit: 80,
    },
    violations: [
      {
        span: "centered on craftsmanship, considered silhouettes",
        issue: "Sentence stacks three qualifiers; style rule is one idea per sentence.",
        severity: "soft",
        suggested_fix: "Split into two sentences, one qualifier each.",
      },
    ],
    aiRunId: null,
    createdAt: "2026-06-05T10:07:00.000Z",
  },
] as const satisfies readonly VoiceAuditScore[];
