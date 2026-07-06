import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, describe, expect, it, vi } from "vitest";

import {
  mockBrandVoiceSetup,
  type BrandVoiceSetupData,
} from "@/data/mock-brand-profiles";
import { BrandVoiceShell } from "@/features/brand-voice/components/brand-voice-shell";
import { getBrandVoiceSetup } from "@/features/brand-voice/data/get-brand-voice-setup";
import * as aiApi from "@/lib/api/ai";
import * as brandVoiceApi from "@/lib/api/brand-voice";

vi.mock("@/features/brand-voice/data/get-brand-voice-setup");
vi.mock("@/lib/api/ai");
vi.mock("@/lib/api/brand-voice");

// BrandVoiceShell reads this flag at module import, so it must be set before
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

const liveSetup: BrandVoiceSetupData = {
  ...mockBrandVoiceSetup,
  profile: liveProfile,
  sampleContent: {
    ...mockBrandVoiceSetup.sampleContent,
    samples: liveSamples,
  },
  source: "api",
};

describe("BrandVoiceShell live hydration", () => {
  it("analyzes with only live asset ids after mock data is replaced", async () => {
    vi.mocked(getBrandVoiceSetup).mockResolvedValue(liveSetup);
    vi.mocked(aiApi.analyzeBrandAssets).mockResolvedValue({
      aiRunIds: ["analysis-run"],
      assets: liveSamples,
      warnings: [],
    });
    vi.mocked(aiApi.extractBrandVoice).mockResolvedValue({
      aiRunId: "extract-run",
      suggestions: {
        audience: "Suggested audience.",
        tone: ["sophisticated"],
        preferred_vocabulary: [],
        banned_phrases: [],
        positioning_notes: "Quiet authority.",
      },
    });
    const user = userEvent.setup();
    render(<BrandVoiceShell initialData={mockBrandVoiceSetup} />);

    // Live profile and assets replace the mock setup after hydration.
    await screen.findAllByText("Live sample 1");
    expect(
      await screen.findByDisplayValue("Live Signature Voice"),
    ).toBeTruthy();
    expect(
      screen.getByDisplayValue("Live premium clientele."),
    ).toBeTruthy();

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
      suggestions: {
        audience: "Suggested audience.",
        tone: ["sophisticated"],
        preferred_vocabulary: [],
        banned_phrases: [],
        positioning_notes: "Quiet authority.",
      },
    });
    const acceptedProfile = {
      ...liveProfile,
      audience: "Suggested audience.",
      tone: ["sophisticated"] as const,
      updatedAt: "2026-07-06T12:00:00.000Z",
    };
    vi.mocked(brandVoiceApi.updateBrandProfile).mockResolvedValue(
      acceptedProfile,
    );
    const user = userEvent.setup();
    render(<BrandVoiceShell initialData={mockBrandVoiceSetup} />);

    await screen.findAllByText("Live sample 1");
    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));
    await screen.findByText("Brand voice suggestions are ready for review.");
    await user.click(screen.getByRole("button", { name: "Accept Suggestions" }));

    await screen.findByText("Suggestions accepted and profile updated.");
    expect(brandVoiceApi.updateBrandProfile).toHaveBeenCalledWith(
      liveProfile.id,
      expect.objectContaining({ audience: "Suggested audience." }),
    );
    // The persisted profile is visible in the form without any refresh.
    expect(
      await screen.findByDisplayValue("Suggested audience."),
    ).toBeTruthy();
  });
});
