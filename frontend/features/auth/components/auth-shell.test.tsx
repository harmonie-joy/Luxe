import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function getInput(label: string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

describe("AuthShell", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("starts sign-in fields empty and preserves their autocomplete contracts", () => {
    render(<AuthShell mode="login" />);

    expect(getInput("Email").value).toBe("");
    expect(getInput("Email").getAttribute("autocomplete")).toBe("email");
    expect(getInput("Password").value).toBe("");
    expect(getInput("Password").getAttribute("autocomplete")).toBe(
      "current-password",
    );
    expect(
      screen.getByText("Sign in to your own account to enter the THE LUXE workspace."),
    ).toBeTruthy();
  });

  it("does not call auth APIs when required sign-in fields are missing", async () => {
    const user = userEvent.setup();
    render(<AuthShell mode="login" />);

    await user.click(screen.getByRole("button", { name: "Enter dashboard" }));

    expect(authApi.prepareCsrf).not.toHaveBeenCalled();
    expect(authApi.login).not.toHaveBeenCalled();
    expect(authApi.signup).not.toHaveBeenCalled();
    expect(authApi.bootstrapWorkspace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not call auth APIs when required signup fields are missing", async () => {
    const user = userEvent.setup();
    render(<AuthShell mode="signup" />);

    await user.click(screen.getByRole("button", { name: "Create workspace" }));

    expect(authApi.prepareCsrf).not.toHaveBeenCalled();
    expect(authApi.login).not.toHaveBeenCalled();
    expect(authApi.signup).not.toHaveBeenCalled();
    expect(authApi.bootstrapWorkspace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("orders CSRF, login, bootstrap and dashboard navigation with entered credentials unchanged", async () => {
    const order = trackCallOrder();
    router.push.mockImplementation(() => {
      order.push("dashboard");
    });
    const user = userEvent.setup();
    render(<AuthShell mode="login" />);

    await user.type(getInput("Email"), "creator@example.test");
    await user.type(getInput("Password"), "synthetic-password");
    await user.click(screen.getByRole("button", { name: "Enter dashboard" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/dashboard"));
    expect(order).toEqual(["csrf", "login", "bootstrap", "dashboard"]);
    expect(authApi.login).toHaveBeenCalledWith({
      email: "creator@example.test",
      password: "synthetic-password",
    });
    expect(getInput("Email").value).toBe("creator@example.test");
    expect(getInput("Password").value).toBe("synthetic-password");
  });

  it("keeps the form and entered credentials after a login error", async () => {
    trackCallOrder();
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError(401, "Unauthorized", "Invalid credentials."),
    );
    const user = userEvent.setup();
    render(<AuthShell mode="login" />);

    await user.type(getInput("Email"), "creator@example.test");
    await user.type(getInput("Password"), "synthetic-password");
    await user.click(screen.getByRole("button", { name: "Enter dashboard" }));

    expect(await screen.findByText("Invalid credentials.")).toBeTruthy();
    expect(getInput("Email").value).toBe("creator@example.test");
    expect(getInput("Password").value).toBe("synthetic-password");
    expect(authApi.login).toHaveBeenCalledWith({
      email: "creator@example.test",
      password: "synthetic-password",
    });
    expect(authApi.bootstrapWorkspace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("disables repeat submission while login is pending", async () => {
    trackCallOrder();
    let resolveLogin: ((session: typeof mockSession) => void) | undefined;
    vi.mocked(authApi.login).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<AuthShell mode="login" />);

    await user.type(getInput("Email"), "creator@example.test");
    await user.type(getInput("Password"), "synthetic-password");
    await user.click(screen.getByRole("button", { name: "Enter dashboard" }));

    const pendingButton = screen.getByRole("button", { name: "Working..." });
    expect((pendingButton as HTMLButtonElement).disabled).toBe(true);
    await user.click(pendingButton);
    expect(authApi.login).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();

    resolveLogin?.(mockSession);
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/dashboard"));
  });

  it("signs up with explicitly entered synthetic details and routes to onboarding", async () => {
    const order = trackCallOrder();
    router.push.mockImplementation(() => {
      order.push("onboarding");
    });
    const user = userEvent.setup();
    render(<AuthShell mode="signup" />);

    expect(getInput("Email").value).toBe("");
    expect(getInput("Email").getAttribute("autocomplete")).toBe("email");
    expect(getInput("Password").value).toBe("");
    expect(getInput("Password").getAttribute("autocomplete")).toBe(
      "new-password",
    );
    await user.type(getInput("Display name"), "Synthetic Creator");
    await user.type(getInput("Email"), "new-creator@example.test");
    await user.type(getInput("Password"), "synthetic-password");
    await user.click(screen.getByRole("button", { name: "Create workspace" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/onboarding"));
    expect(order).toEqual(["csrf", "signup", "bootstrap", "onboarding"]);
    expect(authApi.signup).toHaveBeenCalledWith({
      display_name: "Synthetic Creator",
      email: "new-creator@example.test",
      password: "synthetic-password",
    });
  });
});
