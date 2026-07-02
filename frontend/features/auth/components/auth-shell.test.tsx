import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthShell } from "@/features/auth/components/auth-shell";
import * as authApi from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http-client";
import { mockSession, router } from "@/test/setup";

vi.mock("@/lib/api/auth");

function trackCallOrder() {
  const order: string[] = [];
  vi.mocked(authApi.prepareCsrf).mockImplementation(async () => {
    order.push("csrf");
    return { detail: "ok" };
  });
  vi.mocked(authApi.login).mockImplementation(async () => {
    order.push("login");
    return mockSession;
  });
  vi.mocked(authApi.signup).mockImplementation(async () => {
    order.push("signup");
    return mockSession;
  });
  vi.mocked(authApi.bootstrapWorkspace).mockImplementation(async () => {
    order.push("bootstrap");
    return mockSession;
  });
  return order;
}

describe("AuthShell", () => {
  it("logs in with CSRF prep and workspace bootstrap, then routes to the dashboard", async () => {
    const order = trackCallOrder();
    const user = userEvent.setup();
    render(<AuthShell mode="login" />);

    await user.click(screen.getByRole("button", { name: "Enter dashboard" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/dashboard"));
    expect(order).toEqual(["csrf", "login", "bootstrap"]);
    expect(authApi.login).toHaveBeenCalledWith({
      email: "demo@theluxe.local",
      password: "theluxe-demo",
    });
  });

  it("signs up with the display name and routes to onboarding", async () => {
    trackCallOrder();
    const user = userEvent.setup();
    render(<AuthShell mode="signup" />);

    await user.type(screen.getByLabelText("Display name"), "New Mario");
    await user.type(screen.getByLabelText("Email"), "new@theluxe.local");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create workspace" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/onboarding"));
    expect(authApi.signup).toHaveBeenCalledWith({
      display_name: "New Mario",
      email: "new@theluxe.local",
      password: "password123",
    });
  });

  it("shows the API error and stays put when login fails", async () => {
    trackCallOrder();
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError(401, "Unauthorized", "Invalid credentials."),
    );
    const user = userEvent.setup();
    render(<AuthShell mode="login" />);

    await user.click(screen.getByRole("button", { name: "Enter dashboard" }));

    expect(await screen.findByText("Invalid credentials.")).toBeTruthy();
    expect(authApi.bootstrapWorkspace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});
