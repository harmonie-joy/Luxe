import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSinglePostLoop } from "@/lib/mock-data/pocs-data";
import { POC_WORKSPACE_STORAGE_KEY, savePocGamePlan } from "@/lib/state/poc-workspace-state";
import HomePage from "./page";

const snapshot = vi.hoisted(() => ({ post: null as null | {
  caption: string; versions: typeof mockSinglePostLoop.versions; acceptedVersion: string | null;
  headline: string; template: string; layers: string[]; visualApproved: boolean;
  checks: string[]; approved: boolean; schedule: { date: string; time: string; timezone: string } | null;
} }));
vi.mock("@/lib/state/poc-post-state", () => ({ usePocPostSnapshot: () => snapshot.post }));

function savedPost() {
  return { caption: mockSinglePostLoop.versions[1].text, versions: mockSinglePostLoop.versions,
    acceptedVersion: "caption-v2", headline: "Saved cover", template: "Minimal",
    layers: ["Headline"], visualApproved: true, checks: ["Brand match", "Platform format", "Asset rights"], approved: true, schedule: null };
}

describe("Creator Home local POC", () => {
  beforeEach(() => { localStorage.clear(); snapshot.post = null; });

  it("shows genuine empty saved state, creation/plan links, and labeled examples without global navigation", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Home" })).toBeDefined();
    expect(screen.getByText("No post saved in this browser.")).toBeDefined();
    const pipeline = screen.getByRole("region", { name: "Saved work pipeline" });
    expect(within(pipeline).getAllByText("0")).toHaveLength(6);
    expect(screen.getByRole("link", { name: "Quick Create" }).getAttribute("href")).toBe("/pocs/content-workspace");
    expect(screen.getByRole("link", { name: "Quick Plan" }).getAttribute("href")).toBe("/pocs/plan");
    expect(screen.getByText(/Synthetic planning examples/)).toBeDefined();
    expect(screen.queryByRole("navigation")).toBeNull();
    const content = screen.getByRole("region", { name: "Your Content" });
    expect(content.contains(pipeline)).toBe(true);
    expect(within(content).getByRole("textbox", { name: "Idea note" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "This Week" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Your Momentum" })).toBeDefined();
    expect(content.parentElement?.querySelectorAll(":scope > section")).toHaveLength(4);
  });

  it("uses a saved plan's next action and captures ideas through the shared widget", () => {
    savePocGamePlan({ ideaId: null, objective: "Share the studio process", audience: "Independent creators", angle: "A small useful habit", format: "Carousel", nextAction: "Outline three practical steps", updatedAt: "2026-11-06T09:00:00Z" });
    const view = render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Outline three practical steps" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Resume plan" }).getAttribute("href")).toBe("/pocs/plan");
    fireEvent.change(screen.getByRole("textbox", { name: "Idea note" }), { target: { value: "A synthetic workshop reflection" } });
    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));
    expect(screen.getByText("A synthetic workshop reflection")).toBeDefined();
    expect(screen.getByRole("link", { name: "Open ideas inbox" }).getAttribute("href")).toBe("/pocs/plan");
    expect(JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!).ideas).toHaveLength(1);
    view.unmount();
    render(<HomePage />);
    expect(screen.getByText("A synthetic workshop reflection")).toBeDefined();
  });

  it("resumes the fixed saved post and chooses approval-specific next steps", () => {
    snapshot.post = { ...savedPost(), approved: false, visualApproved: false };
    const view = render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Review your working visual" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Resume active post" }).getAttribute("href")).toBe("/pocs/single-post");
    expect(within(screen.getByRole("region", { name: "Active work" })).getByRole("heading", { name: mockSinglePostLoop.title })).toBeDefined();
    snapshot.post = savedPost(); view.rerender(<HomePage />);
    expect(screen.getByRole("heading", { name: "Choose a schedule for your approved post" })).toBeDefined();
    snapshot.post = { ...savedPost(), schedule: { date: "2027-06-21", time: "23:15", timezone: "America/New_York" } }; view.rerender(<HomePage />);
    expect(screen.getByRole("heading", { name: "Review your upcoming schedule" })).toBeDefined();
    expect(screen.getByText(/2027-06-21.*23:15.*America\/New_York/)).toBeDefined();
    expect(screen.getByRole("link", { name: "View saved schedule" }).getAttribute("href")).toBe("/pocs/calendar");
  });

  it("does not treat a stale accepted caption as ready for visual review", () => {
    snapshot.post = { ...savedPost(), caption: "Edited after acceptance", approved: false };
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Accept your current caption" })).toBeDefined();
  });

  it("shows saved learning and reacts to workspace changes without fabricated performance", () => {
    render(<HomePage />);
    act(() => {
      localStorage.setItem(POC_WORKSPACE_STORAGE_KEY, JSON.stringify({ ideas: [], gamePlan: null, feedback: [{ postId: mockSinglePostLoop.id, worthIt: "partly", outcome: "A useful conversation", learning: "Make the opening more specific", updatedAt: "2026-11-06T10:00:00Z" }] }));
      window.dispatchEvent(new Event("storage"));
    });
    expect(screen.getByText("Make the opening more specific")).toBeDefined();
    expect(screen.getByText("A useful conversation")).toBeDefined();
    expect(screen.getByRole("link", { name: "Review learning" }).getAttribute("href")).toBe("/pocs/impact");
  });

  it("recovers malformed workspace state and preserves capture input on storage failure", () => {
    localStorage.setItem(POC_WORKSPACE_STORAGE_KEY, "malformed");
    render(<HomePage />);
    expect(screen.getByText("No post saved in this browser.")).toBeDefined();
    fireEvent.change(screen.getByRole("textbox", { name: "Idea note" }), { target: { value: "Keep this idea" } });
    const failure = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Unavailable"); });
    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));
    expect(screen.getByText(/Could not save this idea/)).toBeDefined();
    expect((screen.getByRole("textbox", { name: "Idea note" }) as HTMLInputElement).value).toBe("Keep this idea");
    failure.mockRestore();
  });
});