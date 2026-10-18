import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, expect, it, vi } from "vitest";

import { AppTopbar } from "@/components/layout/app-topbar";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    fireEvent(this, new Event("close"));
  });
});

it("opens mobile navigation and closes it when a route is chosen", async () => {
  const user = userEvent.setup();
  render(<AppTopbar />);

  const trigger = screen.getByRole("button", { name: "Open navigation" });
  await user.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const dialog = screen.getByRole("dialog", { name: "Workspace navigation" });
  const home = within(dialog).getByRole("link", { name: "Creator Home" });
  expect(home.getAttribute("href")).toBe("/dashboard");
  await user.click(home);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});
