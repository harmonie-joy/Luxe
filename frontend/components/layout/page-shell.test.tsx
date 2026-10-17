import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { PageShell } from "@/components/layout/page-shell";
import { mockSession } from "@/test/setup";

const pathname = vi.hoisted(() => ({ current: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
beforeEach(() => { pathname.current = "/dashboard"; });
afterEach(() => vi.unstubAllGlobals());

it("waits for a real session before showing the workspace and its content", async () => {
  let resolveSession!: (response: Response) => void;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => {
    resolveSession = resolve;
  })));
  render(<PageShell><p>Private work</p></PageShell>);

  expect(screen.queryByText("Private work")).toBeNull();
  expect(screen.getByRole("status").textContent).toContain("Checking your session");

  resolveSession(Response.json(mockSession));
  expect(await screen.findByText("Private work")).toBeTruthy();
  const identity = within(screen.getByRole("complementary"));
  expect(identity.getByText("Live Workspace")).toBeTruthy();
  expect(identity.getByText("Mario")).toBeTruthy();
});

it.each([401, 403])("offers sign-in without rendering workspace data after HTTP %s", async (status) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ detail: "Not authenticated" }, { status })));
  render(<PageShell><p>Private work</p></PageShell>);
  expect(await screen.findByRole("heading", { name: "Sign in to your workspace" })).toBeTruthy();
  expect(screen.queryByText("Private work")).toBeNull();
  expect(screen.queryByText("Live Workspace")).toBeNull();
  expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/login");
});

it("shows an outage without fake identity and can retry the session read", async () => {
  const fetch = vi.fn().mockRejectedValueOnce(new TypeError("Network down"))
    .mockResolvedValueOnce(Response.json(mockSession));
  vi.stubGlobal("fetch", fetch);
  render(<PageShell><p>Private work</p></PageShell>);
  expect(await screen.findByRole("heading", { name: "Workspace unavailable" })).toBeTruthy();
  expect(screen.queryByText("Private work")).toBeNull();
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Private work")).toBeTruthy();
});

it("does not invent a workspace when the session has none", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...mockSession, activeWorkspaceId: null, workspaces: [] })));
  render(<PageShell><p>Private work</p></PageShell>);
  await screen.findByText("Private work");
  expect(within(screen.getByRole("complementary")).getByText("No active workspace")).toBeTruthy();
  expect(screen.queryByText("Live Workspace")).toBeNull();
});

it("rechecks the session before revealing a newly navigated product screen", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json(mockSession))
    .mockResolvedValueOnce(Response.json({ detail: "Session expired" }, { status: 403 })));
  const { rerender } = render(<PageShell><p>First screen</p></PageShell>);
  await screen.findByText("First screen");
  pathname.current = "/drafts";
  rerender(<PageShell><p>New private screen</p></PageShell>);
  expect(screen.queryByText("New private screen")).toBeNull();
  expect(await screen.findByRole("heading", { name: "Sign in to your workspace" })).toBeTruthy();
  expect(screen.queryByText("Mario")).toBeNull();
});

it.each(["/calendar", "/compliance/example-draft"])("identifies the existing synthetic screen at %s", async (path) => {
  pathname.current = path;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(mockSession)));
  render(<PageShell><p>Existing screen</p></PageShell>);
  await screen.findByText("Existing screen");
  expect(screen.getByRole("note").textContent).toContain("Demonstration");
});
