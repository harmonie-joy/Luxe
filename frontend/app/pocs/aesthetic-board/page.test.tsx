import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SandboxLayout from "../layout";
import AestheticBoardPage from "./page";

describe("Aesthetic & Inspiration Board prototype", () => {
  it("filters inspiration by category, tag and search, and resets empty results", () => {
    render(<SandboxLayout><AestheticBoardPage /></SandboxLayout>);
    expect(screen.getByRole("heading", { name: "Aesthetic & Inspiration Board" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Aesthetic Board" }).getAttribute("href")).toBe("/pocs/aesthetic-board");
    fireEvent.click(screen.getByRole("tab", { name: "Color Palettes" }));
    expect(screen.getByRole("heading", { name: "Summer Serenity" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Warm Minimalism" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "All Inspiration" }));
    fireEvent.change(screen.getByLabelText("Filter by tag"), { target: { value: "Editorial" } });
    expect(screen.getByRole("heading", { name: "Quiet Editorial" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Summer Serenity" })).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search inspiration" }), { target: { value: "no match" } });
    expect(screen.getByText("No inspiration found")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("heading", { name: "Warm Minimalism" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByRole("button", { name: "Grid view" }).getAttribute("aria-pressed")).toBe("true");
    screen.getByRole("tab", { name: "All Inspiration" }).focus();
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "End" });
    expect(screen.getByRole("tab", { name: "Pinned" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel", { name: "Pinned" })).toBeDefined();
  });

  it("pins items, opens accessible details and adds a local inspiration note", () => {
    render(<SandboxLayout><AestheticBoardPage /></SandboxLayout>);
    fireEvent.click(screen.getByRole("button", { name: "Pin Warm Minimalism" }));
    fireEvent.click(screen.getByRole("tab", { name: "Pinned" }));
    expect(screen.getByRole("heading", { name: "Warm Minimalism" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Open Warm Minimalism" }));
    expect(screen.getByRole("dialog", { name: "Warm Minimalism" })).toBeDefined();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add inspiration" }));
    const dialog = screen.getByRole("dialog", { name: "Add inspiration" });
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: "Autumn launch" } });
    fireEvent.change(within(dialog).getByLabelText("Inspiration note"), { target: { value: "Try a documentary approach with natural light." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add to board" }));
    expect(screen.getByRole("heading", { name: "Autumn launch" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(screen.getByRole("button", { name: "Dark mode" }).getAttribute("aria-pressed")).toBe("true");
  });
});