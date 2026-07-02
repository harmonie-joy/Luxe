import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockBrandVoiceSetup } from "@/data/mock-brand-profiles";
import { SampleContentUploader } from "@/features/brand-voice/components/sample-content-uploader";
import * as brandVoiceApi from "@/lib/api/brand-voice";
import { router } from "@/test/setup";

vi.mock("@/lib/api/brand-voice");

const { profile, sampleContent } = mockBrandVoiceSetup;
const savedAsset = sampleContent.samples[0];

function renderUploader(source: "api" | "mock") {
  return render(
    <SampleContentUploader
      profile={profile}
      sampleContent={sampleContent}
      source={source}
    />,
  );
}

function selectFile(file: File) {
  fireEvent.change(screen.getByLabelText("Upload sample content"), {
    target: { files: [file] },
  });
}

describe("SampleContentUploader", () => {
  it("saves pasted text with title fallback and word count", async () => {
    vi.mocked(brandVoiceApi.createBrandAsset).mockResolvedValue(savedAsset);
    const user = userEvent.setup();
    renderUploader("api");

    fireEvent.change(screen.getByLabelText(/Sample content paste area/), {
      target: { value: "First line title\nMore considered copy here." },
    });
    await user.click(screen.getByRole("button", { name: "Save Paste" }));

    expect(await screen.findByText("Text asset saved for analysis.")).toBeTruthy();
    expect(brandVoiceApi.createBrandAsset).toHaveBeenCalledWith({
      brand_profile: profile.id,
      title: "First line title",
      content: "First line title\nMore considered copy here.",
      media_type: "text",
      source_type: "pasted",
      format: "Text",
      word_count: 7,
      status: "needs_review",
    });
    expect(router.refresh).toHaveBeenCalled();
  });

  it("uploads image files through the FormData path", async () => {
    vi.mocked(brandVoiceApi.createBrandAssetUpload).mockResolvedValue(savedAsset);
    const user = userEvent.setup();
    renderUploader("api");

    const file = new File(["img"], "campaign.png", { type: "image/png" });
    selectFile(file);
    await user.click(screen.getByRole("button", { name: "Save Image" }));

    expect(
      await screen.findByText("Image asset saved for analysis."),
    ).toBeTruthy();
    expect(brandVoiceApi.createBrandAssetUpload).toHaveBeenCalledWith({
      brand_profile: profile.id,
      title: "campaign.png",
      media_type: "image",
      file,
      mime_type: "image/png",
      source_type: "uploaded",
      format: "PNG",
      status: "needs_review",
    });
  });

  it("rejects non-image uploads in API mode", async () => {
    const user = userEvent.setup();
    renderUploader("api");

    selectFile(new File(["text"], "notes.txt", { type: "text/plain" }));
    await user.click(screen.getByRole("button", { name: "Save Image" }));

    expect(
      await screen.findByText(
        "Only image uploads are saved in this MVP. Paste text or transcripts instead.",
      ),
    ).toBeTruthy();
    expect(brandVoiceApi.createBrandAssetUpload).not.toHaveBeenCalled();
  });

  it("navigates to a local sample detail route in mock mode", async () => {
    const user = userEvent.setup();
    renderUploader("mock");

    await user.click(screen.getByRole("button", { name: "Analyse Paste" }));

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        expect.stringMatching(/^\/brand-voice\/samples\/paste-\d+$/),
      ),
    );
    expect(brandVoiceApi.createBrandAsset).not.toHaveBeenCalled();
  });
});
