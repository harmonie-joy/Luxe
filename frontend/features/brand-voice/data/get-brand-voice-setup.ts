/**
 * Brand Voice data-source.
 *
 * Single entry point for the /brand-voice page. Decides at runtime whether to
 * return live API data or fall back to mock data, keeping that decision out of
 * components and pages.
 *
 * Environment flags:
 *   NEXT_PUBLIC_USE_MOCK_BRAND_VOICE=true  → always use mock (default when unset)
 *
 * When API mode is active, the function tries to fetch the first BrandProfile
 * and its assets. If the request fails (e.g. auth not yet wired, backend
 * unavailable), it falls back to mock data and — in development — logs the
 * reason to the server console.
 *
 * Shape contract:
 * - pageHeader    : static copy — not from API
 * - toneOptions   : derived from the full canonical tone list + profile.tone
 * - sampleContent : static config fields + live/mock assets
 */

import {
  mockBrandVoiceSetup,
  type BrandVoiceSetupData,
} from "@/data/mock-brand-profiles";
import { ApiError } from "@/lib/api/http-client";
import { getBrandAssets, getBrandProfiles } from "@/lib/api/brand-voice";
import type {
  BrandProfile,
  BrandToneOption,
  BrandVoiceTone,
} from "@/types/brand-profile";

// ---------------------------------------------------------------------------
// Static UI constants (copy and schema — never from the API)
// ---------------------------------------------------------------------------

const PAGE_HEADER = mockBrandVoiceSetup.pageHeader;

const ALL_TONE_OPTIONS: readonly BrandToneOption[] = [
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
    selected: false,
  },
  {
    value: "sophisticated",
    label: "Sophisticated",
    description: "Refined language with restraint.",
    selected: false,
  },
  {
    value: "approachable",
    label: "Approachable",
    description: "Warm, human, and easy to understand.",
    selected: false,
  },
  {
    value: "visionary",
    label: "Visionary",
    description: "Forward-looking without exaggeration.",
    selected: false,
  },
];

const SAMPLE_CONTENT_CONFIG = {
  pasteDefaultValue: mockBrandVoiceSetup.sampleContent.pasteDefaultValue,
  uploadHelpText: mockBrandVoiceSetup.sampleContent.uploadHelpText,
  acceptedFormats: mockBrandVoiceSetup.sampleContent.acceptedFormats,
} as const;

// ---------------------------------------------------------------------------
// Shape-mapping helpers
// ---------------------------------------------------------------------------

function buildToneOptions(
  selectedTones: readonly BrandVoiceTone[],
): BrandToneOption[] {
  const selected = new Set<string>(selectedTones);
  return ALL_TONE_OPTIONS.map((opt) => ({
    ...opt,
    selected: selected.has(opt.value),
  }));
}

function buildFromProfile(profile: BrandProfile): BrandVoiceSetupData {
  return {
    pageHeader: PAGE_HEADER,
    profile,
    toneOptions: buildToneOptions(profile.tone),
    sampleContent: {
      ...SAMPLE_CONTENT_CONFIG,
      samples: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

const USE_MOCK =
  !process.env.NEXT_PUBLIC_USE_MOCK_BRAND_VOICE ||
  process.env.NEXT_PUBLIC_USE_MOCK_BRAND_VOICE === "true";

export async function getBrandVoiceSetup(): Promise<BrandVoiceSetupData> {
  if (USE_MOCK) {
    return mockBrandVoiceSetup;
  }

  try {
    const profiles = await getBrandProfiles();

    if (profiles.length === 0) {
      return mockBrandVoiceSetup;
    }

    const profile = profiles[0];
    const assets = await getBrandAssets(profile.id);

    return {
      ...buildFromProfile(profile),
      sampleContent: {
        ...SAMPLE_CONTENT_CONFIG,
        samples: assets,
      },
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      const reason =
        err instanceof ApiError
          ? `ApiError ${err.status}: ${err.message}`
          : String(err);
      console.warn(
        `[getBrandVoiceSetup] API unavailable, using mock data. Reason: ${reason}`,
      );
    }
    return mockBrandVoiceSetup;
  }
}
