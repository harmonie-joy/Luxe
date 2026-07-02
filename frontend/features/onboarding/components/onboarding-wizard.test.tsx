import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockOnboardingSetup } from "@/data/mock-onboarding";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import * as aiApi from "@/lib/api/ai";
import * as authApi from "@/lib/api/auth";
import * as brandVoiceApi from "@/lib/api/brand-voice";
import { mockSession, router } from "@/test/setup";
import type { BrandAsset, BrandProfile } from "@/types/brand-profile";

vi.mock("@/lib/api/ai");
vi.mock("@/lib/api/auth");
vi.mock("@/lib/api/brand-voice");

const createdProfile = { id: "bp-new", tone: [] } as unknown as BrandProfile;
const createdAsset = { id: "asset-new" } as unknown as BrandAsset;

beforeEach(() => {
  vi.mocked(authApi.getSession).mockResolvedValue(mockSession);
  vi.mocked(brandVoiceApi.createBrandProfile).mockResolvedValue(createdProfile);
  vi.mocked(brandVoiceApi.createBrandAsset).mockResolvedValue(createdAsset);
});

async function fillStepOneAndAdvance(user: UserEvent) {
  await user.type(
    screen.getByLabelText("Creator or brand name"),
    "Build Mode Lab",
  );
  await user.type(screen.getByLabelText("Target audience"), "Indie builders");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
}

describe("OnboardingWizard", () => {
  it("blocks step one until brand name and audience are set", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard config={mockOnboardingSetup} />);

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      await screen.findByText(
        "Add a brand name and a target audience before continuing.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Step 1 of 3")).toBeTruthy();
  });

  it("creates the profile and foundation asset, then routes to Brand Voice", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard config={mockOnboardingSetup} />);

    await fillStepOneAndAdvance(user);
    await user.click(
      screen.getByRole("button", { name: "Create my brand voice" }),
    );

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/brand-voice"));
    expect(brandVoiceApi.createBrandProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: "ws-1",
        name: "Build Mode Lab",
        audience: "Indie builders",
        tone: [],
        preferred_vocabulary: [],
        banned_phrases: [],
        positioning_notes: expect.stringContaining("Brand name:\nBuild Mode Lab"),
      }),
    );
    expect(brandVoiceApi.createBrandAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        brand_profile: "bp-new",
        title: "Onboarding foundation answers",
        media_type: "text",
        source_type: "pasted",
        format: "onboarding_questionnaire",
        status: "ready",
      }),
    );
    // Mock brand-voice mode (default env): no AI extraction call.
    expect(aiApi.extractBrandVoice).not.toHaveBeenCalled();
  });

  it("shows the best-effort notice when the asset step fails after the profile saved", async () => {
    vi.mocked(brandVoiceApi.createBrandAsset).mockRejectedValue(
      new Error("asset save failed"),
    );
    const user = userEvent.setup();
    render(<OnboardingWizard config={mockOnboardingSetup} />);

    await fillStepOneAndAdvance(user);
    await user.click(
      screen.getByRole("button", { name: "Create my brand voice" }),
    );

    expect(
      await screen.findByText("Your starter profile is ready."),
    ).toBeTruthy();
    expect(
      screen.getByText(/AI voice extraction did not finish \(asset save failed\)/),
    ).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Continue to Brand Voice" })).toBeTruthy();
  });
});
