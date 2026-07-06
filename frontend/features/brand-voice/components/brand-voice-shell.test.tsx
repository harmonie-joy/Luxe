import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  mockBrandVoiceSetup,
  type BrandVoiceSetupData,
} from "@/data/mock-brand-profiles";
import { BrandVoiceShell } from "@/features/brand-voice/components/brand-voice-shell";
import * as brandVoiceApi from "@/lib/api/brand-voice";
import type { BrandAsset } from "@/types/brand-profile";

vi.mock("@/lib/api/brand-voice");

const savedAsset: BrandAsset = {
  ...mockBrandVoiceSetup.sampleContent.samples[0],
  id: "new-live-sample",
  title: "New live sample",
  updatedAt: "2026-07-02T12:00:00.000Z",
};

function renderShell(data: BrandVoiceSetupData) {
  render(<BrandVoiceShell initialData={data} />);
}

// Intentional mock mode: live is the default, so pin the flag for demo tests.
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_USE_MOCK_BRAND_VOICE", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("BrandVoiceShell", () => {
  it("shows live, demo, and error-demo source states", () => {
    renderShell({ ...mockBrandVoiceSetup, source: "api" });
    expect(screen.getAllByText("Live").length).toBeGreaterThan(0);

    renderShell(mockBrandVoiceSetup);
    expect(screen.getAllByText("Demo").length).toBeGreaterThan(0);
    // Intentional mock mode never fetches live data behind the scenes.
    expect(brandVoiceApi.getBrandProfiles).not.toHaveBeenCalled();

    renderShell({
      ...mockBrandVoiceSetup,
      loadError: "API error 500: unavailable",
    });
    expect(screen.getByText("Error - demo data")).toBeTruthy();
    expect(screen.getByText(/API error 500: unavailable/)).toBeTruthy();
  });

  it("adds a saved live asset to the current sample list", async () => {
    vi.mocked(brandVoiceApi.createBrandAsset).mockResolvedValue(savedAsset);
    const user = userEvent.setup();
    renderShell({ ...mockBrandVoiceSetup, source: "api" });

    fireEvent.change(screen.getByLabelText(/Sample content paste area/), {
      target: { value: "New live sample copy" },
    });
    await user.click(screen.getByRole("button", { name: "Save Paste" }));

    expect(await screen.findByText("Text asset saved for analysis.")).toBeTruthy();
    expect((await screen.findAllByText("New live sample")).length).toBeGreaterThan(0);
  });
});
