import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CreatorHome } from "./creator-home";
import { CreatorSessionProvider } from "@/features/creator/components/creator-session";
import { mockSession } from "@/test/setup";

afterEach(() => vi.unstubAllGlobals());
it("lists only the active workspace's persisted items and exposes honest creation paths", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify([
    { id: "post-b", title: "Earlier save", goal: "Explain our purpose", workflowStage: "idea", nextAction: "Choose the angle", revision: 2, updatedAt: "2026-10-17T10:00:00Z" },
    { id: "post-1", title: "A thoughtful launch", goal: "Explain our purpose", workflowStage: "idea", nextAction: "Choose the angle", revision: 2, updatedAt: "2026-10-18T10:00:00Z" },
    { id: "post-a", title: "Same-time save", goal: "Explain our purpose", workflowStage: "drafting", nextAction: "Review the opening", revision: 3, updatedAt: "2026-10-17T10:00:00Z" },
  ])));
  vi.stubGlobal("fetch", fetch);
  render(<CreatorSessionProvider session={mockSession}><CreatorHome /></CreatorSessionProvider>);
  expect(await screen.findByText("A thoughtful launch")).toBeTruthy();
  expect(fetch.mock.calls[0][0]).toContain("/api/content-items/?workspace=ws-1");
  const savedWork = screen.getByRole("region", { name: "Continue where you left off" });
  expect(within(savedWork).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
    "A thoughtful launch",
    "Same-time save",
    "Earlier save",
  ]);
  expect(within(savedWork).getAllByText("Next action")).toHaveLength(3);
  expect(within(savedWork).getAllByText("Choose the angle")).toHaveLength(2);
  const resumeLinks = within(savedWork).getAllByRole("link", { name: /^Resume/ });
  expect(resumeLinks.map((link) => link.getAttribute("href"))).toEqual([
    "/content-items/post-1",
    "/content-items/post-a",
    "/content-items/post-b",
  ]);
  const resumeLink = resumeLinks[0];
  expect(resumeLink.className).toContain("min-h-12");
  expect(resumeLink.className).toContain("w-full");
  expect(screen.getByRole("link", { name: "Create With Me" }).getAttribute("href")).toBe("/content-items/new");
  for (const name of ["Quick Draft", "Bring Something In"]) expect((screen.getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(true);
  expect(within(savedWork).getAllByText(/Checkpoint 2/)).toHaveLength(2);
});

it("distinguishes loading, empty and unavailable workspaces without mock fallback", async () => {
  let complete: (value: Response) => void = () => {};
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { complete = resolve; })));
  const { unmount } = render(<CreatorSessionProvider session={mockSession}><CreatorHome /></CreatorSessionProvider>);
  expect(screen.getByRole("status").textContent).toContain("Loading saved posts");
  complete(Response.json([]));
  expect(await screen.findByText(/No saved posts in this workspace/)).toBeTruthy();
  unmount();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Error("offline")));
  render(<CreatorSessionProvider session={mockSession}><CreatorHome /></CreatorSessionProvider>);
  expect((await screen.findByRole("alert")).textContent).toContain("Saved posts are unavailable");
  expect(screen.queryByRole("link", { name: /Resume/ })).toBeNull();
});

it("ignores an old workspace response after switching session identity", async () => {
  let finishOld: (value: Response) => void = () => {};
  vi.stubGlobal("fetch", vi.fn((url: string) => url.includes("ws-1") ? new Promise<Response>((resolve) => { finishOld = resolve; }) : Promise.resolve(Response.json([]))));
  const { rerender } = render(<CreatorSessionProvider session={mockSession}><CreatorHome /></CreatorSessionProvider>);
  rerender(<CreatorSessionProvider session={{ ...mockSession, user: { ...mockSession.user, id: "other-user" }, activeWorkspaceId: "ws-2" }}><CreatorHome /></CreatorSessionProvider>);
  expect(await screen.findByText(/No saved posts in this workspace/)).toBeTruthy();
  finishOld(Response.json([{ id: "private-old", title: "Old workspace private title" }]));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.queryByText("Old workspace private title")).toBeNull();
});
