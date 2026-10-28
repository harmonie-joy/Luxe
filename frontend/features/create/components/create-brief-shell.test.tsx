import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockCreateBriefDemoData } from "@/data/mock-create-brief";
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
  ...mockCreateBriefDemoData.brandProfiles[0],
  id: "bp-live",
  workspaceId: "ws-1",
  name: "Live Profile",
};

function mockLiveBootstrap() {
  vi.mocked(authApi.getSession).mockResolvedValue(mockSession);
  vi.mocked(brandVoiceApi.getBrandProfiles).mockResolvedValue([liveProfile]);
}

describe("CreateBriefShell", () => {
  it("loads live context without pre-filling the form with demo content", async () => {
    mockLiveBootstrap();
    render(<CreateBriefShell />);

    const workspaceSelect = await screen.findByLabelText<HTMLSelectElement>(
      "Workspace",
    );
    await waitFor(() => expect(workspaceSelect.value).toBe("ws-1"));
    expect(
      screen.getByLabelText<HTMLSelectElement>("Brand Voice Profile").value,
    ).toBe("bp-live");
    expect(screen.getAllByText("Live Workspace").length).toBeGreaterThan(0);

    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Content objective").value,
    ).toBe("");
    expect(screen.getByLabelText<HTMLTextAreaElement>("Audience").value).toBe(
      "",
    );
    expect(screen.getByLabelText<HTMLTextAreaElement>("Angle").value).toBe("");
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Constraints").value,
    ).toBe("");
    expect(
      screen.getAllByRole<HTMLInputElement>("radio").every((option) => !option.checked),
    ).toBe(true);
    expect(
      screen.getAllByRole<HTMLInputElement>("checkbox").every((option) => !option.checked),
    ).toBe(true);
  });

  it.each(["session", "profiles"] as const)(
    "shows an error and blocks saving when live %s fail to load",
    async (failedResource) => {
      vi.mocked(authApi.getSession).mockImplementation(
        failedResource === "session"
          ? () => Promise.reject(new Error("offline"))
          : () => Promise.resolve(mockSession),
      );
      vi.mocked(brandVoiceApi.getBrandProfiles).mockImplementation(
        failedResource === "profiles"
          ? () => Promise.reject(new Error("offline"))
          : () => Promise.resolve([liveProfile]),
      );
      render(<CreateBriefShell />);

      expect(
        await screen.findByText(
          "Live workspace and brand voice data is unavailable. Brief saving is disabled.",
        ),
      ).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Save brief" }).hasAttribute("disabled"),
      ).toBe(true);
      expect(screen.getByLabelText<HTMLSelectElement>("Workspace").options).toHaveLength(0);
      expect(contentBriefsApi.createContentBrief).not.toHaveBeenCalled();
    },
  );

  it("creates a brief using only context from the live APIs and values the user typed", async () => {
    mockLiveBootstrap();
    vi.mocked(contentBriefsApi.createContentBrief).mockResolvedValue({
      ...mockCreateBriefDemoData.brief,
      id: "brief-new",
    } as ContentBrief);
    const user = userEvent.setup();
    render(<CreateBriefShell />);

    const workspaceSelect = await screen.findByLabelText<HTMLSelectElement>(
      "Workspace",
    );
    await waitFor(() => expect(workspaceSelect.value).toBe("ws-1"));

    await user.type(
      screen.getByLabelText("Content objective"),
      "Explain our new service",
    );
    await user.click(screen.getByRole("radio", { name: /^Educate/ }));
    await user.type(screen.getByLabelText("Audience"), "Existing customers");
    await user.type(screen.getByLabelText("Angle"), "A practical overview");
    await user.type(screen.getByLabelText("Constraints"), "No guarantees");
    await user.click(screen.getByRole("checkbox", { name: /^LinkedIn/ }));
    await user.click(screen.getByRole("button", { name: "Save brief" }));

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/drafts?brief=brief-new"),
    );
    expect(contentBriefsApi.createContentBrief).toHaveBeenCalledWith({
      workspace: "ws-1",
      brand_profile: "bp-live",
      content_objective: "Explain our new service",
      campaign_goal: "educate",
      audience: "Existing customers",
      angle: "A practical overview",
      constraints: "No guarantees",
      target_channels: ["linkedin"],
    });
  });

  it("labels the explicit demo path and prevents demo data from being submitted", async () => {
    render(<CreateBriefShell demoData={mockCreateBriefDemoData} />);

    expect(
      await screen.findByText(
        "Demo data - saving is disabled; no API calls will be made.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save brief" }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(authApi.getSession).not.toHaveBeenCalled();
    expect(brandVoiceApi.getBrandProfiles).not.toHaveBeenCalled();
    expect(contentBriefsApi.createContentBrief).not.toHaveBeenCalled();
  });

  it("blocks saving without a content objective", async () => {
    mockLiveBootstrap();
    const user = userEvent.setup();
    render(<CreateBriefShell />);

    fireEvent.change(screen.getByLabelText("Content objective"), {
      target: { value: "   " },
    });
    await screen.findByLabelText("Workspace");
    await user.click(screen.getByRole("button", { name: "Save brief" }));

    expect(
      await screen.findByText("Add a content objective before saving the brief."),
    ).toBeTruthy();
    expect(contentBriefsApi.createContentBrief).not.toHaveBeenCalled();
  });

  it("scopes brand profiles to the selected workspace", async () => {
    const secondWorkspace = { id: "ws-2", name: "Second Workspace", role: "editor" as const };
    const secondProfile: BrandProfile = {
      ...liveProfile,
      id: "bp-2",
      workspaceId: "ws-2",
      name: "Second Profile",
    };
    vi.mocked(authApi.getSession).mockResolvedValue({
      ...mockSession,
      workspaces: [...mockSession.workspaces, secondWorkspace],
    });
    vi.mocked(brandVoiceApi.getBrandProfiles).mockResolvedValue([
      liveProfile,
      secondProfile,
    ]);
    const user = userEvent.setup();
    render(<CreateBriefShell />);

    await screen.findByLabelText("Workspace");
    await user.selectOptions(
      screen.getByLabelText("Workspace"),
      secondWorkspace.id,
    );

    const profileSelect =
      screen.getByLabelText<HTMLSelectElement>("Brand Voice Profile");
    expect(profileSelect.value).toBe(secondProfile.id);
    // Only profiles from the selected workspace remain selectable.
    const optionIds = Array.from(profileSelect.options).map((o) => o.value);
    expect(optionIds).toEqual([secondProfile.id]);
  });
});
