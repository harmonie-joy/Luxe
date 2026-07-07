import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, describe, expect, it, vi } from "vitest";

import {
  mockBrandVoiceSetup,
  type BrandVoiceSetupData,
} from "@/data/mock-brand-profiles";
import { BrandVoiceAnalysisShell } from "@/features/brand-voice/components/brand-voice-shell";
import { getBrandVoiceSetup } from "@/features/brand-voice/data/get-brand-voice-setup";
import * as aiApi from "@/lib/api/ai";
import * as brandVoiceApi from "@/lib/api/brand-voice";

vi.mock("@/features/brand-voice/data/get-brand-voice-setup");
vi.mock("@/lib/api/ai");
vi.mock("@/lib/api/brand-voice");

// The shell reads this flag at module import, so it must be set before
// the imports above evaluate — hence hoisted, and scoped to this file only.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_USE_MOCK_BRAND_VOICE = "false";
});

afterAll(() => {
  delete process.env.NEXT_PUBLIC_USE_MOCK_BRAND_VOICE;
});

const liveSamples = mockBrandVoiceSetup.sampleContent.samples.map(
  (sample, index) => ({
    ...sample,
    id: `live-asset-${index + 1}`,
    title: `Live sample ${index + 1}`,
  }),
);

const liveProfile = {
  ...mockBrandVoiceSetup.profile,
  id: "live-profile-1",
  name: "Live Signature Voice",
  audience: "Live premium clientele.",
};

const extractionSuggestions = {
  voice_summary: "Composed editorial authority.",
  tone: { funny: 10, casual: 20, irreverent: 10, enthusiastic: 35, justification: "" },
  tone_tags: ["quietly confident"],
  point_of_view: "we-to-you",
  sentence_style: "Open with the answer.",
  pacing: "",
  proof_style: "",
  claim_boundaries: [],
  preferred_vocabulary: [],
  banned_phrases: [],
  examples: [],
  audience_segments: [],
  positioning: {
    category: "",
    key_benefit: "",
    differentiators: [],
    reasons_to_believe: [],
    known_for: "",
  },
  confidence: 74,
  extraction_notes: "",
};

const extractedVoice = { id: "voice-live-2", version: 2, isActive: false };

const liveSetup: BrandVoiceSetupData = {
  ...mockBrandVoiceSetup,
  profile: liveProfile,
  sampleContent: {
    ...mockBrandVoiceSetup.sampleContent,
    samples: liveSamples,
  },
  source: "api",
};

describe("BrandVoiceAnalysisShell live hydration", () => {
  it("analyzes with only live asset ids after mock data is replaced", async () => {
    vi.mocked(getBrandVoiceSetup).mockResolvedValue(liveSetup);
    vi.mocked(aiApi.analyzeBrandAssets).mockResolvedValue({
      aiRunIds: ["analysis-run"],
      assets: liveSamples,
      warnings: [],
    });
    vi.mocked(aiApi.extractBrandVoice).mockResolvedValue({
      aiRunId: "extract-run",
      voice: extractedVoice,
      suggestions: extractionSuggestions,
    });
    const user = userEvent.setup();
    render(<BrandVoiceAnalysisShell initialData={mockBrandVoiceSetup} />);

    // Live profile and assets replace the mock setup after hydration.
    await screen.findAllByText("Live sample 1");
    expect(
      (await screen.findAllByText("Live Signature Voice")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Live premium clientele.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));

    await screen.findByText("Brand voice suggestions are ready for review.");
    expect(aiApi.analyzeBrandAssets).toHaveBeenCalledWith({
      workspace: liveSetup.profile.workspaceId,
      brand_profile: liveSetup.profile.id,
      asset_ids: liveSamples.map((sample) => sample.id),
    });
    const postedIds = vi.mocked(aiApi.analyzeBrandAssets).mock.calls[0][0]
      .asset_ids;
    for (const sample of mockBrandVoiceSetup.sampleContent.samples) {
      expect(postedIds).not.toContain(sample.id);
    }
  });

  it("updates the visible profile immediately after Accept Suggestions", async () => {
    vi.mocked(getBrandVoiceSetup).mockResolvedValue(liveSetup);
    vi.mocked(aiApi.analyzeBrandAssets).mockResolvedValue({
      aiRunIds: ["analysis-run"],
      assets: liveSamples,
      warnings: [],
    });
    vi.mocked(aiApi.extractBrandVoice).mockResolvedValue({
      aiRunId: "extract-run",
      voice: extractedVoice,
      suggestions: extractionSuggestions,
    });
    const acceptedProfile = {
      ...liveProfile,
      name: "Accepted Signature Voice",
      activeVoiceId: extractedVoice.id,
      updatedAt: "2026-07-06T12:00:00.000Z",
    };
    vi.mocked(brandVoiceApi.activateBrandVoice).mockResolvedValue({
      ...extractedVoice,
      isActive: true,
    } as never);
    vi.mocked(brandVoiceApi.getBrandProfile).mockResolvedValue(acceptedProfile);
    const user = userEvent.setup();
    render(<BrandVoiceAnalysisShell initialData={mockBrandVoiceSetup} />);

    await screen.findAllByText("Live sample 1");
    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));
    await screen.findByText("Brand voice suggestions are ready for review.");
    await user.click(screen.getByRole("button", { name: "Activate This Voice" }));

    await screen.findByText("Voice version 2 is now active for this profile.");
    expect(brandVoiceApi.activateBrandVoice).toHaveBeenCalledWith(
      extractedVoice.id,
    );
    // The persisted profile is visible in the preview without any refresh.
    expect(
      await screen.findByText("Accepted Signature Voice"),
    ).toBeTruthy();
  });
});
