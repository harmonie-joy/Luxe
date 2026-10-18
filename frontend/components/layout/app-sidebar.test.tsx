import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { APP_ROUTES } from "@/lib/routes";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

function link(name: string) {
  return screen.getByRole("link", { name });
}

describe("AppSidebar", () => {
  it("focuses Home navigation and keeps legacy routes reachable under More tools", async () => {
    pathname.current = APP_ROUTES.dashboard;
    render(<AppSidebar />);
    expect(link("Creator Home").getAttribute("aria-current")).toBe("page");
    expect(link("Draft Studio").getAttribute("href")).toBe(APP_ROUTES.drafts);
    expect(screen.queryByRole("link", { name: "Profile" })).toBeNull();
    await userEvent.setup().click(screen.getByText("More tools"));
    expect(link("Create Brief").getAttribute("href")).toBe(APP_ROUTES.create);
    expect(link("Compliance").getAttribute("href")).toBe(APP_ROUTES.compliance);
    expect(link("Calendar").getAttribute("href")).toBe(APP_ROUTES.calendar);
  });

  it("shows Brand Voice tools and marks only the literal current page", () => {
    pathname.current = APP_ROUTES.brandVoice;
    render(<AppSidebar />);
    expect(link("Brand Voice").getAttribute("aria-current")).toBe("page");
    expect(link("Profile").getAttribute("href")).toBe(APP_ROUTES.brandVoiceProfile);
    expect(link("Analysis").getAttribute("href")).toBe(APP_ROUTES.brandVoiceAnalysis);
    expect(link("Samples").getAttribute("href")).toBe(APP_ROUTES.brandVoiceSamples);
    expect(link("Profile").getAttribute("aria-current")).toBeNull();
  });

  it("marks a child page rather than its parent as current", () => {
    pathname.current = APP_ROUTES.brandVoiceProfile;
    render(<AppSidebar />);
    expect(link("Brand Voice").getAttribute("aria-current")).toBeNull();
    expect(link("Profile").getAttribute("aria-current")).toBe("page");
    expect(link("Analysis").getAttribute("aria-current")).toBeNull();
  });

  it("does not mark a parent link as the literal page for sample details", () => {
    pathname.current = `${APP_ROUTES.brandVoiceSamples}/asset-1`;
    render(<AppSidebar />);
    expect(link("Samples").getAttribute("aria-current")).toBeNull();
    expect(link("Brand Voice").getAttribute("aria-current")).toBeNull();
  });

  it("discloses secondary navigation automatically on an existing tool route", () => {
    pathname.current = APP_ROUTES.calendar;
    render(<AppSidebar />);
    expect(link("Calendar").getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("group").hasAttribute("open")).toBe(true);
  });
});
