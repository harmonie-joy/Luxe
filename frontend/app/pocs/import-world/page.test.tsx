import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { router } from "@/test/setup";
import SandboxLayout from "../layout";
import ImportWorldPage from "./page";

describe("Import My World wizard", () => {
  afterEach(() => vi.useRealTimers());

  it("connects mock sources locally and shows the five-step checklist", () => {
    render(<ImportWorldPage />);

    expect(screen.getByRole("heading", { name: "Import My World" })).toBeDefined();
    expect(screen.getByRole("list", { name: "Import progress" }).children).toHaveLength(5);
    expect(screen.getByText(/Real provider access and import are not enabled/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByRole("button", { name: "Connect Google Drive" }));
    expect(screen.getByRole("button", { name: "Disconnect" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByText("1,241")).toHaveLength(2);
  });

  it("animates categorization before showing the review step", () => {
    vi.useFakeTimers();
    render(<ImportWorldPage />);

    fireEvent.click(screen.getByRole("button", { name: "Connect Google Drive" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Organize content" }));

    const progress = screen.getByRole("progressbar", { name: "Categorization progress" });
    expect(progress.getAttribute("aria-valuenow")).toBe("0");
    act(() => vi.advanceTimersByTime(3600));
    expect(progress.getAttribute("aria-valuenow")).toBe("100");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Review" })).toBeDefined();
    expect(screen.getByText("Step 4 / 5")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Finish preview" }));
    fireEvent.click(screen.getByRole("button", { name: /Open Tornado Workspace/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/tornado-workspace");
  });

  it("keeps the page inside the playground light and dark theme scope", () => {
    const { container } = render(<SandboxLayout><ImportWorldPage /></SandboxLayout>);
    const sandbox = container.firstElementChild;

    expect(sandbox?.classList.contains("dark")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(sandbox?.classList.contains("dark")).toBe(true);
  });
});