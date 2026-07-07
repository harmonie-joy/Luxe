import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { APP_ROUTES } from "@/lib/routes";

const pathname = vi.hoisted(() => ({ current: "/" }));

// Overrides the shared setup mock so each test controls the current path.
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

function link(name: string | RegExp) {
  return screen.getByRole("link", { name });
}

describe("AppSidebar", () => {
  it("renders Brand Voice child links", () => {
    pathname.current = "/dashboard";
    render(<AppSidebar />);

    expect(link("Profile").getAttribute("href")).toBe(
      APP_ROUTES.brandVoiceProfile,
    );
    expect(link("Analysis").getAttribute("href")).toBe(
      APP_ROUTES.brandVoiceAnalysis,
    );
    expect(link("Samples").getAttribute("href")).toBe(
      APP_ROUTES.brandVoiceSamples,
    );
    expect(link("Brand Voice").className).not.toContain("luxe-nav-link-active");
  });

  it("marks only the exact overview link as the current page", () => {
    pathname.current = APP_ROUTES.brandVoice;
    render(<AppSidebar />);

    expect(link("Brand Voice").getAttribute("aria-current")).toBe("page");
    expect(link("Brand Voice").className).toContain("luxe-nav-link-active");
    expect(link("Profile").getAttribute("aria-current")).toBeNull();
    expect(link("Profile").className).not.toContain("luxe-nav-link-active");
  });

  it("keeps the parent active and marks the matching child on a child route", () => {
    pathname.current = APP_ROUTES.brandVoiceProfile;
    render(<AppSidebar />);

    expect(link("Brand Voice").className).toContain("luxe-nav-link-active");
    expect(link("Brand Voice").getAttribute("aria-current")).toBeNull();
    expect(link("Profile").className).toContain("luxe-nav-link-active");
    expect(link("Profile").getAttribute("aria-current")).toBe("page");
    expect(link("Analysis").className).not.toContain("luxe-nav-link-active");
  });

  it("keeps the Samples child active on a sample detail route", () => {
    pathname.current = `${APP_ROUTES.brandVoiceSamples}/asset-1`;
    render(<AppSidebar />);

    expect(link("Brand Voice").className).toContain("luxe-nav-link-active");
    expect(link("Samples").className).toContain("luxe-nav-link-active");
    // No sidebar link is the literal current page here.
    expect(link("Samples").getAttribute("aria-current")).toBeNull();
  });
});
