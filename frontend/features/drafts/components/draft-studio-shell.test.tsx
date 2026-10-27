import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);

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
const linkedinDraft: ContentDraft = {
  ...draftA,
  title: "Persisted LinkedIn title",
  content: "Persisted LinkedIn copy only.",
  channel: "linkedin",
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
afterEach(() => {
  if (originalClipboardDescriptor) {
    Object.defineProperty(navigator, "clipboard", originalClipboardDescriptor);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
});

async function renderLive(drafts: ContentDraft[] = [draftA]) {
  vi.mocked(contentDraftsApi.getContentDrafts).mockResolvedValue(drafts);
  render(<DraftStudioShell data={mockDraftStudioPage} />);
  // loadMessage is hidden once a draft is active; the source badge flips to Live.
  await screen.findByText("Live");
}

describe("DraftStudioShell", () => {
  it("copies the persisted LinkedIn draft text without its title", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    await renderLive([linkedinDraft]);

    await user.click(screen.getByRole("button", { name: "Copy LinkedIn draft" }));

    expect(writeText).toHaveBeenCalledWith("Persisted LinkedIn copy only.");
    expect((await screen.findByRole("status")).textContent).toBe(
      "Draft text copied. This does not approve or publish it or indicate final export readiness.",
    );
  });

  it("reports clipboard permission failures without claiming success", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    await renderLive([linkedinDraft]);

    await user.click(screen.getByRole("button", { name: "Copy LinkedIn draft" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not copy draft text. Check browser clipboard permissions and try again.",
    );
    expect(
      screen.queryByText(/Draft text copied\./),
    ).toBeNull();
  });

  it.each([
    ["editing content", "resolve"],
    ["editing content", "reject"],
    ["switching drafts", "resolve"],
    ["switching drafts", "reject"],
    ["switching briefs", "resolve"],
    ["switching briefs", "reject"],
  ] as const)(
    "ignores delayed clipboard %s when the editor context changes (%s)",
    async (contextChange, outcome) => {
      let resolveWriteText!: () => void;
      let rejectWriteText!: (error: Error) => void;
      const writeText = vi.fn(
        () =>
          new Promise<void>((resolve, reject) => {
            resolveWriteText = resolve;
            rejectWriteText = reject;
          }),
      );
      const user = userEvent.setup();
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      const newsletterDraft = {
        ...linkedinDraft,
        id: "draft-b",
        channel: "newsletter" as const,
      };
      await renderLive([linkedinDraft, newsletterDraft]);
      await user.click(screen.getByRole("button", { name: "Copy LinkedIn draft" }));
      await screen.findByText("Copying draft text.");

      if (contextChange === "editing content") {
        fireEvent.change(screen.getByLabelText("Draft content"), {
          target: { value: "Edited LinkedIn copy." },
        });
      } else if (contextChange === "switching drafts") {
        await user.click(screen.getByRole("tab", { name: "Newsletter" }));
      } else {
        vi.mocked(contentDraftsApi.getContentDrafts).mockResolvedValueOnce([
          { ...linkedinDraft, id: "draft-c", briefId: "brief-b" },
        ]);
        await user.selectOptions(screen.getByLabelText("Switch brief"), "brief-b");
        await screen.findByRole("heading", { name: "Second brief objective" });
      }

      await act(async () => {
        if (outcome === "resolve") resolveWriteText();
        else rejectWriteText(new Error("denied"));
      });

      expect(screen.queryByText(/Draft text copied\./)).toBeNull();
      expect(screen.queryByText(/Could not copy draft text\./)).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      if (contextChange === "editing content") {
        expect(
          screen.getByText("Save this draft before copying its persisted text."),
        ).toBeTruthy();
      }
    },
  );

  it("explains when clipboard access is unsupported", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    await renderLive([linkedinDraft]);

    await user.click(screen.getByRole("button", { name: "Copy LinkedIn draft" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Clipboard access is unavailable in this browser. Select and copy the draft text manually.",
    );
  });

  it("does not offer copying for non-LinkedIn drafts", async () => {
    await renderLive([{ ...linkedinDraft, channel: "newsletter" }]);

    expect(
      screen.queryByRole("button", { name: "Copy LinkedIn draft" }),
    ).toBeNull();
  });

  it("keeps copying unavailable while persisted data is loading", () => {
    vi.mocked(authApi.getSession).mockImplementation(
      () => new Promise(() => {}),
    );
    render(
      <DraftStudioShell
        data={{ ...mockDraftStudioPage, drafts: [linkedinDraft] }}
      />,
    );

    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Copy LinkedIn draft",
      }).disabled,
    ).toBe(true);
  });

  it("keeps copying unavailable for demo drafts", async () => {
    vi.mocked(authApi.getSession).mockRejectedValue(new Error("offline"));
    render(
      <DraftStudioShell
        data={{ ...mockDraftStudioPage, drafts: [linkedinDraft] }}
      />,
    );
    await screen.findByText("Demo");

    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Copy LinkedIn draft",
      }).disabled,
    ).toBe(true);
    expect(
      screen.getByText("Copy is available only for a persisted LinkedIn draft."),
    ).toBeTruthy();
  });

  it("keeps copying unavailable when the persisted LinkedIn text is empty", async () => {
    await renderLive([{ ...linkedinDraft, content: " \n " }]);

    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Copy LinkedIn draft",
      }).disabled,
    ).toBe(true);
    expect(screen.getByText("Add draft text before copying.")).toBeTruthy();
  });

  it("requires saved content before copying edits", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.mocked(contentDraftsApi.updateContentDraft).mockResolvedValue({
      ...linkedinDraft,
      content: "Updated persisted LinkedIn copy.",
    });
    await renderLive([linkedinDraft]);

    fireEvent.change(screen.getByLabelText("Draft content"), {
      target: { value: "Updated persisted LinkedIn copy." },
    });
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Copy LinkedIn draft",
      }).disabled,
    ).toBe(true);
    expect(
      screen.getByText("Save this draft before copying its persisted text."),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Save draft" }));
    await screen.findByText("Draft saved.");
    await user.click(screen.getByRole("button", { name: "Copy LinkedIn draft" }));

    expect(writeText).toHaveBeenCalledWith("Updated persisted LinkedIn copy.");
  });

  it("keeps copying unavailable when saving edited content fails", async () => {
    const user = userEvent.setup();
    vi.mocked(contentDraftsApi.updateContentDraft).mockRejectedValue(
      new Error("Save failed"),
    );
    await renderLive([linkedinDraft]);

    fireEvent.change(screen.getByLabelText("Draft content"), {
      target: { value: "Unsaved LinkedIn copy." },
    });
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText("Save failed")).toBeTruthy();
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Copy LinkedIn draft",
      }).disabled,
    ).toBe(true);
  });

  it("does not treat generated local fallback drafts as persisted", async () => {
    vi.mocked(contentDraftsApi.getContentDrafts)
      .mockResolvedValueOnce([linkedinDraft])
      .mockResolvedValueOnce([]);
    vi.mocked(aiApi.generateDrafts).mockResolvedValue({
      aiRunIds: ["run-linkedin"],
      drafts: [
        {
          id: "generated-linkedin",
          brief: "brief-a",
          channel: "linkedin",
          title: "Generated",
          content: "Generated LinkedIn copy.",
          status: "draft",
        },
      ],
    });
    const user = userEvent.setup();
    await renderLive();

    await user.click(screen.getByRole("button", { name: "Generate Drafts" }));
    await screen.findByText("Generated 1 draft. AI runs: run-linkedin.");

    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Copy LinkedIn draft",
      }).disabled,
    ).toBe(true);
    expect(
      screen.getByText("Save this draft before copying its persisted text."),
    ).toBeTruthy();
  });

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
