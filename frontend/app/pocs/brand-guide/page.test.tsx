import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SandboxLayout from "../layout";
import BrandGuidePage from "./page";

describe("Brand Guide prototype", () => {
  it("opens all chapters, returns home, searches rules, and switches layouts", () => {
    render(<BrandGuidePage />);
    expect(screen.getByRole("heading", { name: "Your Brand Guide" })).toBeDefined();
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(12);
    fireEvent.click(screen.getByRole("button", { name: "List view" }));
    expect(screen.getByRole("button", { name: "List view" }).getAttribute("aria-pressed")).toBe("true");
    const search = screen.getByRole("searchbox", { name: "Search the brand guide" });
    fireEvent.change(search, { target: { value: "licensed" } });
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Open Photography Style" }));
    expect(screen.getByRole("heading", { level: 1, name: "Photography Style" })).toBeDefined();
    expect(screen.getByText(/licensed or permissioned/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Back to Guide" }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "no-such-rule" } });
    expect(screen.getByText(/No chapters match/)).toBeDefined();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(12);
  });

  it("shows the tone breakdown and copies examples with truthful success and failure states", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    try {
      render(<BrandGuidePage />);
      fireEvent.click(screen.getByRole("button", { name: "Open Tone of Voice" }));
      expect(screen.getByRole("heading", { level: 1, name: "Tone of Voice" })).toBeDefined();
      for (const title of ["Voice Pillars", "Words We Use", "Words We Avoid", "Example Caption", "Headline Example", "AI Interpretation"]) {
        expect(screen.getByRole("heading", { name: title })).toBeDefined();
      }
      for (const pillar of ["Empowering", "Clear", "Warm", "Confident"]) {
        expect(screen.getByRole("heading", { name: pillar })).toBeDefined();
      }
      expect(screen.getByRole("progressbar", { name: /AI Confidence Match/ }).getAttribute("value")).toBe("92");
      expect(screen.getByText("Sample score")).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "Copy Example Caption" }));
      expect(await screen.findByText("Example Caption copied to clipboard.")).toBeDefined();
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("You don't need more followers."));
      writeText.mockRejectedValueOnce(new Error("Permission denied"));
      fireEvent.click(screen.getByRole("button", { name: "Copy Headline Example" }));
      expect(await screen.findByText(/Copy unavailable/)).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "Back to Guide" }));
      expect(screen.queryByText(/Copy unavailable/)).toBeNull();
    } finally {
      if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
      else Reflect.deleteProperty(navigator, "clipboard");
    }
  });

  it("links from the playground and supports both views under a local dark theme", () => {
    const { container } = render(<SandboxLayout><BrandGuidePage /></SandboxLayout>);
    expect(within(screen.getByRole("navigation", { name: "Sandbox pages" })).getByRole("link", { name: "Brand Kit" }).getAttribute("href")).toBe("/pocs/brand-kit");
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(container.firstElementChild?.classList.contains("dark")).toBe(true);
    const navigation = within(screen.getByRole("navigation", { name: "Brand guide chapters" }));
    fireEvent.click(navigation.getByRole("button", { name: /Tone of Voice/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Tone of Voice" })).toBeDefined();
    expect(navigation.getByRole("button", { name: /Tone of Voice/ }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(navigation.getByRole("button", { name: /Overview/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Your Brand Guide" })).toBeDefined();
  });
});