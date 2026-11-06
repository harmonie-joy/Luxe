import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSinglePostLoop } from "@/lib/mock-data/pocs-data";
import CalendarPage from "./page";

const snapshot = vi.hoisted(() => ({ post: null as null | {
  caption: string; versions: typeof mockSinglePostLoop.versions; acceptedVersion: string | null;
  headline: string; template: string; layers: string[]; visualApproved: boolean;
  checks: string[]; approved: boolean; schedule: { date: string; time: string; timezone: string } | null;
} }));
vi.mock("@/lib/state/poc-post-state", () => ({ usePocPostSnapshot: () => snapshot.post }));

function savedPost() {
  return { caption: "A saved caption from the workshop", versions: mockSinglePostLoop.versions,
    acceptedVersion: "caption-v2", headline: "Saved visual headline", template: "Minimal",
    layers: ["Headline"], visualApproved: true, checks: ["Brand match", "Platform format", "Asset rights"], approved: true, schedule: null };
}

describe("Content Calendar preview", () => {
  beforeEach(() => { snapshot.post = null; });
  it("shows eight dated posts, switches month and navigates periods", () => {
    render(<CalendarPage />);
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(8);
    expect(screen.getByRole("heading", { name: "Nov 9 - Nov 15, 2026" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(screen.getByRole("heading", { name: "November 2026" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Month" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Next period" }));
    expect(screen.getByText("No posts in this month")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Previous period" }));
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(8);
  });

  it("combines platform and status filters and resets empty results", () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getByRole("button", { name: "LinkedIn" }));
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(2);
    fireEvent.change(screen.getByRole("combobox", { name: "Status filter" }), { target: { value: "Ready" } });
    expect(screen.getByText("No posts in this week")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Reset calendar" }));
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(8);
  });

  it("opens details, reschedules locally and changes status without publishing", () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getByRole("button", { name: "Open AI Workshop Takeaway" }));
    const drawer = screen.getByRole("complementary", { name: "Post details" });
    expect(within(drawer).queryByRole("link", { name: /Open Post Dashboard/ })).toBeNull();
    expect(within(drawer).getByText("Synthetic fixture · no linked saved post")).toBeDefined();
    fireEvent.change(within(drawer).getByLabelText("Reschedule date"), { target: { value: "2026-11-17" } });
    fireEvent.change(within(drawer).getByLabelText("Reschedule time"), { target: { value: "11:00" } });
    fireEvent.click(within(drawer).getByRole("button", { name: "Reschedule" }));
    expect(screen.getByRole("heading", { name: "Nov 16 - Nov 22, 2026" })).toBeDefined();
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(1);
    fireEvent.click(within(drawer).getByRole("button", { name: "Mark as Published" }));
    expect(within(drawer).getByText("Published", { exact: true })).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain("Not saved.");
    fireEvent.keyDown(drawer, { key: "Escape" });
    expect(screen.queryByRole("complementary", { name: "Post details" })).toBeNull();
  });

  it("deletes only the selected preview post", () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getByRole("button", { name: "Open Morning Mindset" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(7);
    expect(screen.queryByRole("complementary", { name: "Post details" })).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("preview only");
  });

  it("locates a saved schedule on its selected timezone date and resumes the fixed post", () => {
    snapshot.post = { ...savedPost(), schedule: { date: "2027-06-21", time: "23:15", timezone: "America/New_York" } };
    render(<CalendarPage />);
    fireEvent.click(screen.getByRole("button", { name: "Jump to saved schedule" }));
    expect(screen.getByRole("heading", { name: "Jun 21 - Jun 27, 2027" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: `Open saved ${mockSinglePostLoop.title}` }));
    const drawer = screen.getByRole("complementary", { name: "Post details" });
    expect(within(drawer).getByText(/23:15/).textContent).toContain("America/New_York");
    expect(within(drawer).getByText("A saved caption from the workshop")).toBeDefined();
    expect(within(drawer).getByText("Saved visual headline")).toBeDefined();
    expect(within(drawer).getByText(/Minimal/)).toBeDefined();
    expect(within(drawer).getByRole("link", { name: /Open Post Dashboard/ }).getAttribute("href")).toBe("/pocs/single-post");
    expect(within(drawer).queryByRole("button", { name: "Mark as Published" })).toBeNull();
    expect(within(drawer).queryByRole("button", { name: "Reschedule" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(screen.getByRole("button", { name: `Open saved ${mockSinglePostLoop.title}` })).toBeDefined();
  });

  it("shows an approved unscheduled saved post in Ready without a fabricated date", () => {
    snapshot.post = savedPost();
    render(<CalendarPage />);
    const queue = screen.getByRole("region", { name: "Ready queue" });
    expect(within(queue).getByText("1 saved post")).toBeDefined();
    fireEvent.click(within(queue).getByRole("button", { name: `Open saved ${mockSinglePostLoop.title}` }));
    expect(screen.getByText("No schedule selected")).toBeDefined();
    expect(screen.getByRole("link", { name: /Open Post Dashboard/ }).getAttribute("href")).toBe("/pocs/single-post");
    fireEvent.keyDown(screen.getByRole("complementary", { name: "Post details" }), { key: "Escape" });
    expect(screen.queryByRole("complementary", { name: "Post details" })).toBeNull();
    expect(document.activeElement).toBe(within(queue).getByRole("button", { name: `Open saved ${mockSinglePostLoop.title}` }));
  });

  it("does not treat an unapproved saved draft as Ready", () => {
    snapshot.post = { ...savedPost(), approved: false };
    render(<CalendarPage />);
    expect(within(screen.getByRole("region", { name: "Ready queue" })).getByText("No saved posts ready to schedule.")).toBeDefined();
  });

  it("separates a saved schedule from synthetic entries on the same day", () => {
    snapshot.post = { ...savedPost(), schedule: { date: "2026-11-10", time: "10:00", timezone: "Europe/Berlin" } };
    render(<CalendarPage />);
    const saved = screen.getByRole("button", { name: `Open saved ${mockSinglePostLoop.title}` });
    const fixture = screen.getByRole("button", { name: `Open ${mockSinglePostLoop.title}` });
    expect(saved.parentElement?.getAttribute("data-lane")).toBe("saved");
    expect(fixture.parentElement?.getAttribute("data-lane")).toBe("synthetic");
    fireEvent.click(saved);
    expect(screen.getByText("A saved caption from the workshop")).toBeDefined();
  });
});