import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "" }),
  Libre_Caslon_Text: () => ({ variable: "" }),
}));

import { metadata as homepageMetadata } from "@/app/page";
import { metadata as rootMetadata } from "@/app/layout";
import { HomeShell } from "./home-shell";

describe("public homepage", () => {
  it("names the Creator and CEO audience and the context-preserving task", () => {
    render(<HomeShell />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Keep your context",
    );
    expect(screen.getByText("For Creators and CEOs")).toBeTruthy();
    expect(
      screen.getByText(/carry their context into the next piece of work/i),
    ).toBeTruthy();
  });

  it("separates verified Internal Alpha behavior from future planned stages", () => {
    const { container } = render(<HomeShell />);

    expect(screen.getByRole("heading", { name: "Internal Alpha" })).toBeTruthy();
    expect(screen.getByText(/limited to the idea and drafting stages/i)).toBeTruthy();
    expect(screen.getByText(/explicitly accept the exact BrandVoice version/i)).toBeTruthy();
    expect(screen.getByText(/save and resume the post.s checkpoint state/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Build → Scale → Automate" })).toBeTruthy();
    expect(screen.getByText(/Scale and Automate are future, planned stages/i)).toBeTruthy();
    expect(container.textContent).not.toMatch(/publishing|compliance certification|viral|testimonials/i);
  });

  it("routes public calls to action to login and has no dead or prohibited links", () => {
    const { container } = render(<HomeShell />);

    const callsToAction = screen.getAllByRole("link", { name: "Sign in" });
    expect(callsToAction.length).toBeGreaterThan(0);
    for (const link of callsToAction) expect(link.getAttribute("href")).toBe("/login");

    const links = [...container.querySelectorAll("a")];
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      expect.arrayContaining(["/", "/login"]),
    );
    expect(links.every((link) => ["/", "/login"].includes(link.getAttribute("href") ?? ""))).toBe(true);
    expect(container.querySelectorAll("a[href^=\"#\"]")).toHaveLength(0);
    expect(container.querySelectorAll("#stories, #pricing")).toHaveLength(0);
    expect(container.textContent).not.toMatch(/Success Stories|Pricing|Request Access|Start Creating/i);
  });

  it("uses no remote illustrative assets", () => {
    const { container } = render(<HomeShell />);

    expect(container.querySelectorAll("img, picture, iframe, video")).toHaveLength(0);
    expect([...container.querySelectorAll("[style]")].some((node) => /url\(/i.test(node.getAttribute("style") ?? ""))).toBe(false);
    expect(container.innerHTML).not.toMatch(/googleusercontent|https?:\/\//i);
  });

  it("sets homepage-specific searchable metadata and defaults other routes to noindex", () => {
    expect(homepageMetadata.title).toBe("THE LUXE — Context for Creators and CEOs");
    expect(homepageMetadata.description).toMatch(/Creators and CEOs/);
    expect(homepageMetadata.robots).toEqual({ index: true, follow: true });
    expect(rootMetadata.title).toBe("THE LUXE | Creator Workspace");
    expect(rootMetadata.description).toMatch(/Internal Alpha workspace/);
    expect(rootMetadata.robots).toEqual({ index: false, follow: false });
  });
});
