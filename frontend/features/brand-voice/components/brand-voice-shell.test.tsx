import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import {
  BrandVoiceOverviewShell,
  BrandVoiceProfileShell,
  BrandVoiceSamplesShell,
} from "@/features/brand-voice/components/brand-voice-shell";
import { APP_ROUTES } from "@/lib/routes";
import * as brandVoiceApi from "@/lib/api/brand-voice";
import type { BrandAsset } from "@/types/brand-profile";

vi.mock("@/lib/api/brand-voice");

const savedAsset: BrandAsset = {
  ...mockBrandVoiceSetup.sampleContent.samples[0],
  id: "new-live-sample",
  title: "New live sample",
  updatedAt: "2026-07-02T12:00:00.000Z",
};

// Intentional mock mode: live is the default, so pin the flag for demo tests.
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_USE_MOCK_BRAND_VOICE", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("BrandVoiceOverviewShell", () => {
  it("shows live, demo, and error-demo source states", () => {
    render(
      <BrandVoiceOverviewShell
        initialData={{ ...mockBrandVoiceSetup, source: "api" }}
      />,
    );
    expect(screen.getAllByText("Live").length).toBeGreaterThan(0);

    render(<BrandVoiceOverviewShell initialData={mockBrandVoiceSetup} />);
    expect(screen.getAllByText("Demo").length).toBeGreaterThan(0);
    // Intentional mock mode never fetches live data behind the scenes.
    expect(brandVoiceApi.getBrandProfiles).not.toHaveBeenCalled();

    render(
      <BrandVoiceOverviewShell
        initialData={{
          ...mockBrandVoiceSetup,
          loadError: "API error 500: unavailable",
        }}
      />,
    );
    expect(screen.getByText("Error - demo data")).toBeTruthy();
    expect(screen.getByText(/API error 500: unavailable/)).toBeTruthy();
  });

  it("links to the profile, analysis, and samples routes", () => {
    render(<BrandVoiceOverviewShell initialData={mockBrandVoiceSetup} />);

    expect(
      screen.getByRole("link", { name: /Profile/ }).getAttribute("href"),
    ).toBe(APP_ROUTES.brandVoiceProfile);
    expect(
      screen.getByRole("link", { name: /Analysis/ }).getAttribute("href"),
    ).toBe(APP_ROUTES.brandVoiceAnalysis);
    expect(
      screen.getByRole("link", { name: /Samples/ }).getAttribute("href"),
    ).toBe(APP_ROUTES.brandVoiceSamples);
  });
});

describe("BrandVoiceProfileShell", () => {
  it("saves the live profile and shows it in the preview", async () => {
    vi.mocked(brandVoiceApi.updateBrandProfile).mockResolvedValue({
      ...mockBrandVoiceSetup.profile,
      name: "Saved Live Voice",
    });
    const user = userEvent.setup();
    render(
      <BrandVoiceProfileShell
        initialData={{ ...mockBrandVoiceSetup, source: "api" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save draft profile" }));

    // The shell propagates the saved profile into the preview panel.
    // (The form's own success message is cleared when the profile prop
    // updates, so the propagated preview is the stable signal.)
    expect(await screen.findByText("Saved Live Voice")).toBeTruthy();
    expect(brandVoiceApi.updateBrandProfile).toHaveBeenCalledWith(
      mockBrandVoiceSetup.profile.id,
      expect.objectContaining({ name: mockBrandVoiceSetup.profile.name }),
    );
  });
});

describe("BrandVoiceSamplesShell", () => {
  it("adds a saved live asset to the current sample list", async () => {
    vi.mocked(brandVoiceApi.createBrandAsset).mockResolvedValue(savedAsset);
    const user = userEvent.setup();
    render(
      <BrandVoiceSamplesShell
        initialData={{ ...mockBrandVoiceSetup, source: "api" }}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Sample content paste area/), {
      target: { value: "New live sample copy" },
    });
    await user.click(screen.getByRole("button", { name: "Save Paste" }));

    expect(await screen.findByText("Text asset saved for analysis.")).toBeTruthy();
    expect((await screen.findAllByText("New live sample")).length).toBeGreaterThan(0);
  });
});
