import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import {
  BrandVoiceAiPanel,
  toBannedPhrasePayload,
  toCanonicalTones,
  toVocabularyPayload,
} from "@/features/brand-voice/components/brand-voice-ai-panel";
import * as aiApi from "@/lib/api/ai";
import * as brandVoiceApi from "@/lib/api/brand-voice";
import { router } from "@/test/setup";

vi.mock("@/lib/api/ai");
vi.mock("@/lib/api/brand-voice");

const { profile } = mockBrandVoiceSetup;
const samples = mockBrandVoiceSetup.sampleContent.samples;

const suggestions = {
  audience: "Suggested audience.",
  tone: ["sophisticated", "visionary"],
  preferred_vocabulary: [
    {
      preferred_term: "clientele",
      restricted_terms: ["customers"],
      note: "Premium references.",
    },
  ],
  banned_phrases: [{ phrase: "go viral", reason: "Trend-led." }],
  positioning_notes: "Quiet authority.",
};

function mockAnalysis(warnings: { assetId: string; message: string }[] = []) {
  vi.mocked(aiApi.analyzeBrandAssets).mockResolvedValue({
    aiRunIds: ["analysis-run"],
    assets: samples,
    warnings,
  });
  vi.mocked(aiApi.extractBrandVoice).mockResolvedValue({
    aiRunId: "extract-run",
    suggestions,
  });
}

describe("helper mappers", () => {
  it("filters tones to canonical values, dedupes, and falls back", () => {
    expect(toCanonicalTones(["sophisticated", "bogus", "sophisticated"], ["professional"])).toEqual(
      ["sophisticated"],
    );
    expect(toCanonicalTones(["bogus"], ["professional"])).toEqual(["professional"]);
  });

  it("maps vocabulary and banned phrase suggestions to write payloads", () => {
    expect(toVocabularyPayload(suggestions.preferred_vocabulary)).toEqual([
      {
        id: "clientele-1",
        preferred_term: "clientele",
        restricted_terms: ["customers"],
        note: "Premium references.",
      },
    ]);
    expect(toBannedPhrasePayload(suggestions.banned_phrases)).toEqual([
      { id: "go-viral-1", phrase: "go viral", reason: "Trend-led." },
    ]);
  });
});

describe("BrandVoiceAiPanel", () => {
  it("requires at least one selected sample before analysis", async () => {
    const user = userEvent.setup();
    render(<BrandVoiceAiPanel profile={profile} samples={samples} source="api" />);

    for (const checkbox of screen.getAllByRole("checkbox")) {
      await user.click(checkbox);
    }
    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));

    expect(
      await screen.findByText("Select at least one sample before analysis."),
    ).toBeTruthy();
    expect(aiApi.analyzeBrandAssets).not.toHaveBeenCalled();
  });

  it("analyzes assets before extraction and surfaces warnings", async () => {
    const order: string[] = [];
    mockAnalysis([{ assetId: samples[0].id, message: "Low sample quality." }]);
    vi.mocked(aiApi.analyzeBrandAssets).mockImplementationOnce(async () => {
      order.push("analyze");
      return {
        aiRunIds: ["analysis-run"],
        assets: samples,
        warnings: [{ assetId: samples[0].id, message: "Low sample quality." }],
      };
    });
    vi.mocked(aiApi.extractBrandVoice).mockImplementationOnce(async () => {
      order.push("extract");
      return { aiRunId: "extract-run", suggestions };
    });
    const user = userEvent.setup();
    render(<BrandVoiceAiPanel profile={profile} samples={samples} source="api" />);

    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));

    expect(await screen.findByText(/Low sample quality\./)).toBeTruthy();
    expect(order).toEqual(["analyze", "extract"]);
    expect(aiApi.extractBrandVoice).toHaveBeenCalledWith({
      workspace: profile.workspaceId,
      brand_profile: profile.id,
      asset_ids: samples.map((sample) => sample.id),
    });
    expect(screen.getByText("Suggested audience.")).toBeTruthy();
  });

  it("accepts suggestions by patching the brand profile", async () => {
    mockAnalysis();
    vi.mocked(brandVoiceApi.updateBrandProfile).mockResolvedValue(profile);
    const user = userEvent.setup();
    render(<BrandVoiceAiPanel profile={profile} samples={samples} source="api" />);

    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));
    await screen.findByText("Suggested audience.");
    await user.click(screen.getByRole("button", { name: "Accept Suggestions" }));

    expect(
      await screen.findByText("Suggestions accepted and profile updated."),
    ).toBeTruthy();
    expect(brandVoiceApi.updateBrandProfile).toHaveBeenCalledWith(profile.id, {
      audience: "Suggested audience.",
      tone: ["sophisticated", "visionary"],
      preferred_vocabulary: toVocabularyPayload(suggestions.preferred_vocabulary),
      banned_phrases: toBannedPhrasePayload(suggestions.banned_phrases),
      positioning_notes: "Quiet authority.",
    });
    expect(router.refresh).toHaveBeenCalled();
  });

  it("keeps mock mode fully local", async () => {
    const user = userEvent.setup();
    render(<BrandVoiceAiPanel profile={profile} samples={samples} source="mock" />);

    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));
    await screen.findByText("Brand voice suggestions are ready for review.");
    await user.click(screen.getByRole("button", { name: "Accept Suggestions" }));

    expect(
      await screen.findByText("Mock suggestions accepted locally."),
    ).toBeTruthy();
    await waitFor(() => {
      expect(aiApi.analyzeBrandAssets).not.toHaveBeenCalled();
      expect(brandVoiceApi.updateBrandProfile).not.toHaveBeenCalled();
    });
  });
});
