import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockCreateBriefPage } from "@/data/mock-create-brief";
import { CreateBriefShell } from "@/features/create/components/create-brief-shell";
import * as authApi from "@/lib/api/auth";
import * as brandVoiceApi from "@/lib/api/brand-voice";
import * as contentBriefsApi from "@/lib/api/content-briefs";
import { mockSession, router } from "@/test/setup";
import type { BrandProfile } from "@/types/brand-profile";
import type { ContentBrief } from "@/types/content";

vi.mock("@/lib/api/auth");
vi.mock("@/lib/api/brand-voice");
vi.mock("@/lib/api/content-briefs");

const liveProfile: BrandProfile = {
  ...mockCreateBriefPage.brandProfiles[0],
  id: "bp-live",
  workspaceId: "ws-1",
  name: "Live Profile",
};

function mockLiveBootstrap() {
  vi.mocked(authApi.getSession).mockResolvedValue(mockSession);
  vi.mocked(brandVoiceApi.getBrandProfiles).mockResolvedValue([liveProfile]);
}

function mockOfflineBootstrap() {
  vi.mocked(authApi.getSession).mockRejectedValue(new Error("offline"));
  vi.mocked(brandVoiceApi.getBrandProfiles).mockRejectedValue(
    new Error("offline"),
  );
}

describe("CreateBriefShell", () => {
  it("bootstraps workspaces and profiles from the live session", async () => {
    mockLiveBootstrap();
    render(<CreateBriefShell data={mockCreateBriefPage} />);

    const workspaceSelect = await screen.findByLabelText<HTMLSelectElement>(
      "Workspace",
    );
    await waitFor(() => expect(workspaceSelect.value).toBe("ws-1"));
    expect(
      screen.getByLabelText<HTMLSelectElement>("Brand Voice Profile").value,
    ).toBe("bp-live");
    expect(screen.getAllByText("Live Workspace").length).toBeGreaterThan(0);
  });

  it("creates the brief with a snake_case payload and opens Draft Studio", async () => {
    mockLiveBootstrap();
    vi.mocked(contentBriefsApi.createContentBrief).mockResolvedValue({
      ...mockCreateBriefPage.brief,
      id: "brief-new",
    } as ContentBrief);
    const user = userEvent.setup();
    render(<CreateBriefShell data={mockCreateBriefPage} />);

    const workspaceSelect = await screen.findByLabelText<HTMLSelectElement>(
      "Workspace",
    );
    await waitFor(() => expect(workspaceSelect.value).toBe("ws-1"));
    await user.click(screen.getByRole("button", { name: "Save brief" }));

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/drafts?brief=brief-new"),
    );
    expect(contentBriefsApi.createContentBrief).toHaveBeenCalledWith({
      workspace: "ws-1",
      brand_profile: "bp-live",
      content_objective: mockCreateBriefPage.brief.contentObjective,
      campaign_goal: mockCreateBriefPage.brief.campaignGoal,
      audience: mockCreateBriefPage.brief.audience,
      angle: mockCreateBriefPage.brief.angle,
      constraints: mockCreateBriefPage.brief.constraints,
      target_channels: mockCreateBriefPage.brief.targetChannels,
    });
  });

  it("blocks saving without a content objective", async () => {
    mockOfflineBootstrap();
    const user = userEvent.setup();
    render(<CreateBriefShell data={mockCreateBriefPage} />);

    fireEvent.change(screen.getByLabelText("Content objective"), {
      target: { value: "   " },
    });
    await user.click(screen.getByRole("button", { name: "Save brief" }));

    expect(
      await screen.findByText("Add a content objective before saving the brief."),
    ).toBeTruthy();
    expect(contentBriefsApi.createContentBrief).not.toHaveBeenCalled();
  });

  it("scopes brand profiles to the selected workspace", async () => {
    mockOfflineBootstrap();
    const user = userEvent.setup();
    render(<CreateBriefShell data={mockCreateBriefPage} />);

    const editorialWorkspace = mockCreateBriefPage.workspaces[1];
    const editorialProfile = mockCreateBriefPage.brandProfiles.find(
      (profile) => profile.workspaceId === editorialWorkspace.id,
    );
    await user.selectOptions(
      screen.getByLabelText("Workspace"),
      editorialWorkspace.id,
    );

    const profileSelect =
      screen.getByLabelText<HTMLSelectElement>("Brand Voice Profile");
    expect(profileSelect.value).toBe(editorialProfile?.id);
    // Only profiles from the selected workspace remain selectable.
    const optionIds = Array.from(profileSelect.options).map((o) => o.value);
    expect(optionIds).toEqual([editorialProfile?.id]);
  });
});
