import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import {
  BrandVoiceAiPanel,
  toBannedPhrasePayload,
  toVocabularyPayload,
} from "@/features/brand-voice/components/brand-voice-ai-panel";
import * as aiApi from "@/lib/api/ai";
import * as brandVoiceApi from "@/lib/api/brand-voice";
import type { BrandVoiceExtractionSuggestions } from "@/lib/api/ai";

vi.mock("@/lib/api/ai");
vi.mock("@/lib/api/brand-voice");

const { profile } = mockBrandVoiceSetup;
const samples = mockBrandVoiceSetup.sampleContent.samples;
const onProfileSaved = vi.fn();

const suggestions: BrandVoiceExtractionSuggestions = {
  voice_summary: "Composed editorial authority with concrete craft language.",
  tone: {
    funny: 10,
    casual: 20,
    irreverent: 10,
    enthusiastic: 35,
    justification: "Declarative openings, no exclamation marks.",
  },
  tone_tags: ["quietly confident"],
  point_of_view: "we-to-you",
  sentence_style: "Open with the answer. One idea per sentence.",
  pacing: "Measured.",
  proof_style: "Craft specifics over superlatives.",
  claim_boundaries: [{ rule: "Never guarantee availability.", reason: "" }],
  preferred_vocabulary: [
    { term: "clientele", instead_of: "customers", note: "Premium references." },
  ],
  banned_phrases: [{ phrase: "go viral", reason: "Trend-led.", severity: "soft" }],
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
  extraction_notes: "No social captions in the sample set.",
};

const extractedVoice = { id: "voice-new-3", version: 3, isActive: false };

function mockAnalysis(warnings: { assetId: string; message: string }[] = []) {
  vi.mocked(aiApi.analyzeBrandAssets).mockResolvedValue({
    aiRunIds: ["analysis-run"],
    assets: samples,
    warnings,
  });
  vi.mocked(aiApi.extractBrandVoice).mockResolvedValue({
    aiRunId: "extract-run",
    voice: extractedVoice,
    suggestions,
  });
}

describe("helper mappers", () => {
  it("maps vocabulary and banned phrase entries to write payloads", () => {
    expect(
      toVocabularyPayload([
        { preferred_term: "clientele", restricted_terms: ["customers"], note: "Premium references." },
      ]),
    ).toEqual([
      {
        id: "clientele-1",
        preferred_term: "clientele",
        restricted_terms: ["customers"],
        note: "Premium references.",
      },
    ]);
    expect(toBannedPhrasePayload([{ phrase: "go viral", reason: "Trend-led." }])).toEqual([
      { id: "go-viral-1", phrase: "go viral", reason: "Trend-led." },
    ]);
  });
});

describe("BrandVoiceAiPanel", () => {
  it("requires at least one selected sample before analysis", async () => {
    const user = userEvent.setup();
    render(<BrandVoiceAiPanel onProfileSaved={onProfileSaved} profile={profile} samples={samples} source="api" />);

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
      return { aiRunId: "extract-run", voice: extractedVoice, suggestions };
    });
    const user = userEvent.setup();
    render(<BrandVoiceAiPanel onProfileSaved={onProfileSaved} profile={profile} samples={samples} source="api" />);

    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));

    expect(await screen.findByText(/Low sample quality\./)).toBeTruthy();
    expect(order).toEqual(["analyze", "extract"]);
    expect(aiApi.extractBrandVoice).toHaveBeenCalledWith({
      workspace: profile.workspaceId,
      brand_profile: profile.id,
      asset_ids: samples.map((sample) => sample.id),
    });
    expect(
      screen.getByText("Composed editorial authority with concrete craft language."),
    ).toBeTruthy();
    expect(screen.getByText("Casual 20")).toBeTruthy();
  });

  it("drops stale mock asset ids when live samples replace them", async () => {
    mockAnalysis();
    const liveSamples = samples.map((sample, index) => ({
      ...sample,
      id: `live-asset-${index + 1}`,
      title: `Live sample ${index + 1}`,
    }));
    const user = userEvent.setup();
    const { rerender } = render(
      <BrandVoiceAiPanel onProfileSaved={onProfileSaved} profile={profile} samples={samples} source="mock" />,
    );

    rerender(
      <BrandVoiceAiPanel onProfileSaved={onProfileSaved} profile={profile} samples={liveSamples} source="api" />,
    );
    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));

    await screen.findByText("Composed editorial authority with concrete craft language.");
    expect(aiApi.analyzeBrandAssets).toHaveBeenCalledWith({
      workspace: profile.workspaceId,
      brand_profile: profile.id,
      asset_ids: liveSamples.map((sample) => sample.id),
    });
  });

  it("activates the extracted voice version and refreshes the profile", async () => {
    mockAnalysis();
    const activatedVoice = {
      ...extractedVoice,
      isActive: true,
    };
    const refreshedProfile = { ...profile, activeVoiceId: extractedVoice.id };
    vi.mocked(brandVoiceApi.activateBrandVoice).mockResolvedValue(
      activatedVoice as never,
    );
    vi.mocked(brandVoiceApi.getBrandProfile).mockResolvedValue(refreshedProfile);
    const user = userEvent.setup();
    render(<BrandVoiceAiPanel onProfileSaved={onProfileSaved} profile={profile} samples={samples} source="api" />);

    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));
    await screen.findByText("Composed editorial authority with concrete craft language.");
    await user.click(screen.getByRole("button", { name: "Activate This Voice" }));

    expect(
      await screen.findByText("Voice version 3 is now active for this profile."),
    ).toBeTruthy();
    expect(brandVoiceApi.activateBrandVoice).toHaveBeenCalledWith("voice-new-3");
    expect(onProfileSaved).toHaveBeenCalledWith(refreshedProfile);
  });

  it("blocks demo analysis instead of creating mock suggestions", async () => {
    const user = userEvent.setup();
    render(<BrandVoiceAiPanel onProfileSaved={onProfileSaved} profile={profile} samples={samples} source="mock" />);

    await user.click(screen.getByRole("button", { name: "Analyze Brand Voice" }));

    expect(
      await screen.findByText(
        "Demo mode only. Load live data before running brand voice analysis.",
      ),
    ).toBeTruthy();
    await waitFor(() => {
      expect(aiApi.analyzeBrandAssets).not.toHaveBeenCalled();
      expect(brandVoiceApi.activateBrandVoice).not.toHaveBeenCalled();
    });
    expect(screen.queryByRole("button", { name: "Activate This Voice" })).toBeNull();
  });
});
