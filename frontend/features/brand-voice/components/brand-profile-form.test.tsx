import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import { BrandProfileForm } from "@/features/brand-voice/components/brand-profile-form";
import * as brandVoiceApi from "@/lib/api/brand-voice";

vi.mock("@/lib/api/brand-voice");

const { profile, toneOptions } = mockBrandVoiceSetup;

function renderForm(source: "api" | "mock", onProfileSaved?: () => void) {
  return render(
    <BrandProfileForm
      onProfileSaved={onProfileSaved}
      profile={profile}
      source={source}
      toneOptions={toneOptions}
    />,
  );
}

describe("BrandProfileForm", () => {
  it("saves to the API with parsed vocabulary, banned phrases, and selected tones", async () => {
    vi.mocked(brandVoiceApi.updateBrandProfile).mockResolvedValue(profile);
    const onProfileSaved = vi.fn();
    const user = userEvent.setup();
    renderForm("api", onProfileSaved);

    fireEvent.change(screen.getByLabelText("Preferred vocabulary"), {
      target: {
        value:
          "clientele - avoid: customers, buyers\ncurated edit - note with - extra dash\nbare term",
      },
    });
    fireEvent.change(screen.getByLabelText("Banned phrases"), {
      target: { value: "go viral - trend-led - always" },
    });
    await user.click(screen.getByRole("button", { name: "Save draft profile" }));

    expect(await screen.findByText("Brand profile saved.")).toBeTruthy();
    expect(brandVoiceApi.updateBrandProfile).toHaveBeenCalledWith(
      profile.id,
      expect.objectContaining({
        name: profile.name,
        audience: profile.audience,
        // Selected tone checkboxes come from toneOptions' selected flags.
        tone: ["authoritative", "sophisticated", "approachable"],
        preferred_vocabulary: [
          {
            id: "clientele-1",
            preferred_term: "clientele",
            restricted_terms: ["customers", "buyers"],
            note: "",
          },
          {
            id: "curated-edit-2",
            preferred_term: "curated edit",
            restricted_terms: [],
            note: "note with - extra dash",
          },
          {
            id: "bare-term-3",
            preferred_term: "bare term",
            restricted_terms: [],
            note: "",
          },
        ],
        banned_phrases: [
          { id: "go-viral-1", phrase: "go viral", reason: "trend-led - always" },
        ],
      }),
    );
    // Visible state updates through onProfileSaved alone — no router.refresh.
    expect(onProfileSaved).toHaveBeenCalledWith(profile);
  });

  it("stays local in mock mode", async () => {
    const user = userEvent.setup();
    renderForm("mock");

    await user.click(screen.getByRole("button", { name: "Save draft profile" }));

    expect(
      await screen.findByText("Mock mode only. No backend save was made."),
    ).toBeTruthy();
    expect(brandVoiceApi.updateBrandProfile).not.toHaveBeenCalled();
  });

  it("requires a name and an audience before saving", async () => {
    const user = userEvent.setup();
    renderForm("api");

    fireEvent.change(screen.getByLabelText("Brand profile name"), {
      target: { value: "  " },
    });
    await user.click(screen.getByRole("button", { name: "Save draft profile" }));
    expect(
      await screen.findByText("Add a brand profile name before saving."),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Brand profile name"), {
      target: { value: "Voice" },
    });
    fireEvent.change(screen.getByLabelText("Target audience"), {
      target: { value: "" },
    });
    await user.click(screen.getByRole("button", { name: "Save draft profile" }));
    expect(
      await screen.findByText("Add a target audience before saving."),
    ).toBeTruthy();
    expect(brandVoiceApi.updateBrandProfile).not.toHaveBeenCalled();
  });
});
