import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountShell } from "@/features/account/components/account-shell";
import * as authApi from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http-client";
import { mockSession, router } from "@/test/setup";

vi.mock("@/lib/api/auth");

beforeEach(() => {
  vi.mocked(authApi.getSession).mockResolvedValue(mockSession);
});

describe("AccountShell", () => {
  it("loads the session into the display-name form and workspace details", async () => {
    render(<AccountShell />);

    expect(await screen.findByDisplayValue("Mario")).toBeTruthy();
    expect(screen.getByText("mario@example.com")).toBeTruthy();
    expect(screen.getByText("Live Workspace")).toBeTruthy();
  });

  it("saves a trimmed display name", async () => {
    vi.mocked(authApi.updateCurrentUser).mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, displayName: "Mario S" },
    });
    const user = userEvent.setup();
    render(<AccountShell />);

    const input = await screen.findByLabelText("Display name");
    await user.clear(input);
    await user.type(input, "  Mario S  ");
    await user.click(screen.getByRole("button", { name: "Save display name" }));

    expect(await screen.findByText("Display name saved.")).toBeTruthy();
    expect(authApi.updateCurrentUser).toHaveBeenCalledWith({
      display_name: "Mario S",
    });
  });

  it("rejects a blank display name without calling the API", async () => {
    const user = userEvent.setup();
    render(<AccountShell />);

    const input = await screen.findByLabelText("Display name");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Save display name" }));

    expect(
      await screen.findByText("Add a display name before saving."),
    ).toBeTruthy();
    expect(authApi.updateCurrentUser).not.toHaveBeenCalled();
  });

  it("logs out and redirects to login", async () => {
    vi.mocked(authApi.logout).mockResolvedValue();
    const user = userEvent.setup();
    render(<AccountShell />);

    await screen.findByDisplayValue("Mario");
    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/login"));
    expect(authApi.logout).toHaveBeenCalled();
  });

  it("shows the session-unavailable state when loading fails", async () => {
    vi.mocked(authApi.getSession).mockRejectedValue(
      new ApiError(401, "Unauthorized", "Not signed in."),
    );
    render(<AccountShell />);

    expect(await screen.findByText("Session unavailable")).toBeTruthy();
    expect(screen.getByText("API error 401: Not signed in.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to login" })).toBeTruthy();
  });
});
