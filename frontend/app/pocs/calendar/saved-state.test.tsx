import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { mockSinglePostLoop } from "@/lib/mock-data/pocs-data";
import { createPocPostState, pocPostSignature, pocVisualSignature, POC_POST_CHECKS, savePocPostState } from "@/lib/state/poc-post-state";
import HomePage from "../home/page";
import CalendarPage from "./page";

function approvedPost() {
  const post = createPocPostState();
  post.caption = post.versions[1].text;
  post.acceptedVersion = post.versions[1].id;
  post.headline = "A saved intentional week";
  post.template = "Minimal";
  post.format = "portrait";
  post.visualApproved = true;
  post.visualApproval = pocVisualSignature(post);
  post.checks = [...POC_POST_CHECKS];
  post.approved = true;
  post.approvedPackage = pocPostSignature(post);
  return post;
}

describe("Home and Calendar real browser-local post contract", () => {
  beforeEach(() => localStorage.clear());

  it("reacts to a saved approved post and restores Ready after remount", () => {
    const view = render(<CalendarPage />);
    expect(screen.queryByRole("button", { name: `Open saved ${mockSinglePostLoop.title}` })).toBeNull();
    act(() => { expect(savePocPostState(approvedPost())).toBe(true); });
    expect(within(screen.getByRole("region", { name: "Ready queue" })).getByText("1 saved post")).toBeDefined();
    view.unmount();
    render(<CalendarPage />);
    fireEvent.click(screen.getByRole("button", { name: `Open saved ${mockSinglePostLoop.title}` }));
    expect(screen.getByText("A saved intentional week")).toBeDefined();
    expect(screen.getByRole("link", { name: /Open Post Dashboard/ }).getAttribute("href")).toBe("/pocs/single-post");
  });

  it("shows the same valid saved schedule and accepted caption in Home and Calendar", () => {
    const post = approvedPost();
    post.schedule = { date: "2027-06-21", time: "23:15", timezone: "America/New_York" };
    expect(savePocPostState(post)).toBe(true);
    const home = render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Review your upcoming schedule" })).toBeDefined();
    home.unmount();
    render(<CalendarPage />);
    fireEvent.click(screen.getByRole("button", { name: "Jump to saved schedule" }));
    fireEvent.click(screen.getByRole("button", { name: `Open saved ${mockSinglePostLoop.title}` }));
    const drawer = screen.getByRole("complementary", { name: "Post details" });
    expect(within(drawer).getByText(/Small steps\. Consistent action/).textContent).toBe(post.caption);
    expect(within(drawer).getByText(/Caption: V2/)).toBeDefined();
    expect(within(drawer).getByText(/23:15/).textContent).toContain("America/New_York");
    expect(drawer.querySelector('[data-format="portrait"]')).not.toBeNull();
  });

  it("does not turn corrupted or invalid saved post data into Ready or scheduled work", () => {
    localStorage.setItem(`luxe-poc-single-post:${mockSinglePostLoop.id}`, JSON.stringify({ ...approvedPost(), approvedPackage: "stale" }));
    const home = render(<HomePage />);
    expect(screen.getByText("No post saved in this browser.")).toBeDefined();
    home.unmount();
    render(<CalendarPage />);
    expect(screen.queryByRole("button", { name: "Jump to saved schedule" })).toBeNull();
    expect(within(screen.getByRole("region", { name: "Ready queue" })).getByText("No saved posts ready to schedule.")).toBeDefined();
  });
});