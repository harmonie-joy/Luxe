import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CalendarPage from "./page";

describe("Content Calendar preview", () => {
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
    expect(within(drawer).getByRole("link", { name: /Open Post Dashboard/ }).getAttribute("href")).toBe("/pocs/single-post");
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
});