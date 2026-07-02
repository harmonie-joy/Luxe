import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockDraftStudioPage } from "@/data/mock-drafts";
import { DraftStudioShell } from "@/features/drafts/components/draft-studio-shell";
import * as aiApi from "@/lib/api/ai";
import * as authApi from "@/lib/api/auth";
import * as contentBriefsApi from "@/lib/api/content-briefs";
import * as contentDraftsApi from "@/lib/api/content-drafts";
import { mockSession, router } from "@/test/setup";
import type { ContentBrief, ContentDraft } from "@/types/content";

vi.mock("@/lib/api/ai");
vi.mock("@/lib/api/auth");
vi.mock("@/lib/api/content-briefs");
vi.mock("@/lib/api/content-drafts");

const briefA: ContentBrief = {
  ...mockDraftStudioPage.brief,
  id: "brief-a",
  workspaceId: "ws-1",
};
const briefB: ContentBrief = {
  ...mockDraftStudioPage.brief,
  id: "brief-b",
  workspaceId: "ws-1",
  contentObjective: "Second brief objective",
};
const draftA: ContentDraft = {
  ...mockDraftStudioPage.drafts[0],
  id: "draft-a",
  briefId: "brief-a",
};

function mockLiveLoad() {
  vi.mocked(authApi.getSession).mockResolvedValue(mockSession);
  vi.mocked(contentBriefsApi.getContentBriefs).mockResolvedValue([
    briefA,
    briefB,
  ]);
  vi.mocked(contentDraftsApi.getContentDrafts).mockResolvedValue([draftA]);
}

beforeEach(mockLiveLoad);

async function renderLive() {
  render(<DraftStudioShell data={mockDraftStudioPage} />);
  // loadMessage is hidden once a draft is active; the source badge flips to Live.
  await screen.findByText("Live");
}

describe("DraftStudioShell", () => {
  it("loads persisted drafts for the active workspace", async () => {
    await renderLive();

    expect(screen.getByText("Live")).toBeTruthy();
    expect(
      screen.getByLabelText<HTMLInputElement>("Draft title").value,
    ).toBe(draftA.title);
    expect(contentDraftsApi.getContentDrafts).toHaveBeenCalledWith("brief-a");
  });

  it("switches briefs and reloads their drafts", async () => {
    const user = userEvent.setup();
    await renderLive();

    await user.selectOptions(screen.getByLabelText("Switch brief"), "brief-b");

    await waitFor(() =>
      expect(contentDraftsApi.getContentDrafts).toHaveBeenCalledWith("brief-b"),
    );
    expect(router.replace).toHaveBeenCalledWith("/drafts?brief=brief-b");
    expect(
      screen.getByRole("heading", { name: "Second brief objective" }),
    ).toBeTruthy();
  });

  it("saves title and content edits through the drafts API", async () => {
    vi.mocked(contentDraftsApi.updateContentDraft).mockResolvedValue({
      ...draftA,
      title: "Edited Title",
    });
    const user = userEvent.setup();
    await renderLive();

    fireEvent.change(screen.getByLabelText("Draft title"), {
      target: { value: "Edited Title" },
    });
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText("Draft saved.")).toBeTruthy();
    expect(contentDraftsApi.updateContentDraft).toHaveBeenCalledWith("draft-a", {
      title: "Edited Title",
      content: draftA.content,
    });
  });

  it("generates channel drafts and reports AI runs", async () => {
    vi.mocked(aiApi.generateDrafts).mockResolvedValue({
      aiRunIds: ["run-1"],
      drafts: [
        {
          id: "gen-1",
          brief: "brief-a",
          channel: "newsletter",
          title: "Generated",
          content: "Generated copy",
          status: "draft",
        },
      ],
    });
    const user = userEvent.setup();
    await renderLive();

    await user.click(screen.getByRole("button", { name: "Generate Drafts" }));

    expect(
      await screen.findByText("Generated 1 draft. AI runs: run-1."),
    ).toBeTruthy();
    expect(aiApi.generateDrafts).toHaveBeenCalledWith({
      workspace: briefA.workspaceId,
      brief: "brief-a",
      channels: briefA.targetChannels,
    });
  });

  it("blocks generation in demo mode", async () => {
    vi.mocked(authApi.getSession).mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    render(<DraftStudioShell data={mockDraftStudioPage} />);
    await screen.findByText("Demo");

    await user.click(screen.getByRole("button", { name: "Generate Drafts" }));

    expect(
      await screen.findByText(
        "Sign in and load a persisted brief before generating drafts.",
      ),
    ).toBeTruthy();
    expect(aiApi.generateDrafts).not.toHaveBeenCalled();
  });

  it("deletes a brief only after dialog confirmation", async () => {
    vi.mocked(contentBriefsApi.deleteContentBrief).mockResolvedValue();
    const user = userEvent.setup();
    await renderLive();

    await user.click(screen.getByRole("button", { name: "Delete Brief" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Permanently delete this brief?"),
    ).toBeTruthy();
    expect(contentBriefsApi.deleteContentBrief).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", { name: "Delete Brief" }),
    );

    expect(await screen.findByText("Brief deleted.")).toBeTruthy();
    expect(contentBriefsApi.deleteContentBrief).toHaveBeenCalledWith("brief-a");
    // Falls forward to the next remaining brief.
    await waitFor(() =>
      expect(contentDraftsApi.getContentDrafts).toHaveBeenCalledWith("brief-b"),
    );
    expect(router.replace).toHaveBeenCalledWith("/drafts?brief=brief-b");
  });
});
