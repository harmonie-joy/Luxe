import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ContentItemDashboard } from "./content-item-dashboard";
import { CreatorSessionProvider } from "./creator-session";
import { mockSession } from "@/test/setup";

const initial = { item: { id: "post-1", projectId: "project-1", title: "Our launch", goal: "Explain our purpose", workflowStage: "idea", nextAction: "Choose an angle", decisions: ["Stay thoughtful"], openQuestions: ["Who first?"], revision: 1 }, checkpoint: { id: "checkpoint-1", revision: 1, createdAt: "2026-10-18T10:00:00Z" }, brandVoice: { id: "voice-1", version: 2, isApproved: true } };
afterEach(() => vi.unstubAllGlobals());
it("saves the full checkpoint snapshot with revision and UUID and restores acknowledged state", async () => {
  let current = initial;
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes("projects")) return Response.json([{ id: "project-1" }]);
    if (init?.method === "POST") {
      current = { ...initial, item: { ...initial.item, goal: "Explain the real launch", revision: 2 }, checkpoint: { ...initial.checkpoint, revision: 2 } };
      return Response.json(current);
    }
    return Response.json(current);
  });
  vi.stubGlobal("fetch", fetch);
  render(<CreatorSessionProvider session={mockSession}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  expect(await screen.findByRole("heading", { name: "Our launch" })).toBeTruthy();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Edit checkpoint" }));
  await user.clear(screen.getByLabelText("Content goal"));
  await user.type(screen.getByLabelText("Content goal"), "Explain the real launch");
  await user.click(screen.getByRole("button", { name: "Save checkpoint" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Saved checkpoint 2"));
  const payload = JSON.parse(fetch.mock.calls.find(([, init]) => init?.method === "POST")![1]!.body as string);
  expect(payload).toEqual({ expected_revision: 1, client_request_id: expect.stringMatching(/^[\da-f-]{36}$/), goal: "Explain the real launch", workflow_stage: "idea", next_action: "Choose an angle", decisions: ["Stay thoughtful"], open_questions: ["Who first?"] });
});

it.each(["stale_revision", "idempotency_key_reused"])("preserves edits on %s and requires confirmed reload", async (code) => {
  let latest = initial;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => url.includes("projects") ? Response.json([{ id: "project-1" }]) : init?.method === "POST" ? Response.json({ code, currentRevision: 4 }, { status: 409 }) : Response.json(latest)));
  render(<CreatorSessionProvider session={mockSession}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  await screen.findByRole("heading", { name: "Our launch" });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Edit checkpoint" }));
  await user.type(screen.getByLabelText("Content goal"), " with local notes");
  await user.click(screen.getByRole("button", { name: "Save and return" }));
  expect((await screen.findByRole("alert")).textContent).toContain(code);
  expect((screen.getByLabelText("Content goal") as HTMLTextAreaElement).value).toBe("Explain our purpose with local notes");
  expect((screen.getByRole("button", { name: "Save checkpoint" }) as HTMLButtonElement).disabled).toBe(true);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  await user.click(screen.getByRole("button", { name: "Reload saved version" }));
  expect((screen.getByLabelText("Content goal") as HTMLTextAreaElement).value).toContain("local notes");
  latest = { ...initial, item: { ...initial.item, goal: "Server writer's goal", revision: 4 }, checkpoint: { ...initial.checkpoint, revision: 4 } };
  confirm.mockReturnValue(true);
  await user.click(screen.getByRole("button", { name: "Reload saved version" }));
  await waitFor(() => expect((screen.getByLabelText("Content goal") as HTMLTextAreaElement).value).toBe("Server writer's goal"));
  confirm.mockRestore();
});

it("retries an uncertain save with the same UUID and snapshot without overwriting edits made while saving", async () => {
  const submissions: Record<string, unknown>[] = [];
  let complete: ((response: Response) => void) | undefined;
  let latest = initial;
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes("projects")) return Response.json([{ id: "project-1" }]);
    if (init?.method === "POST") {
      submissions.push(JSON.parse(init.body as string));
      if (submissions.length === 1) throw Error("Network interrupted");
      return new Promise<Response>((resolve) => { complete = resolve; });
    }
    return Response.json(latest);
  });
  vi.stubGlobal("fetch", fetch);
  render(<CreatorSessionProvider session={mockSession}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  await screen.findByRole("heading", { name: "Our launch" });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Edit checkpoint" }));
  await user.type(screen.getByLabelText("Content goal"), " changed");
  await user.click(screen.getByRole("button", { name: "Save checkpoint" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Network interrupted");
  await user.click(screen.getByRole("button", { name: "Save checkpoint" }));
  expect(submissions[1]).toEqual(submissions[0]);
  expect((screen.getByRole("button", { name: "Save checkpoint" }) as HTMLButtonElement).disabled).toBe(true);
  await user.type(screen.getByLabelText("Content goal"), " newer input");
  latest = { ...initial, item: { ...initial.item, goal: "Explain our purpose changed", revision: 2 }, checkpoint: { ...initial.checkpoint, revision: 2 } };
  complete!(Response.json(latest));
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Unsaved changes"));
  expect((screen.getByLabelText("Content goal") as HTMLTextAreaElement).value).toBe("Explain our purpose changed newer input");
});

it("does not present an old idempotency acknowledgment as the newest server checkpoint", async () => {
  let reads = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes("projects")) return Response.json([{ id: "project-1" }]);
    if (init?.method === "POST") return Response.json({ ...initial, item: { ...initial.item, revision: 2 } });
    reads += 1;
    return Response.json(reads > 1 ? { ...initial, item: { ...initial.item, revision: 3 } } : initial);
  }));
  render(<CreatorSessionProvider session={mockSession}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  await screen.findByRole("heading", { name: "Our launch" });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Edit checkpoint" }));
  await user.type(screen.getByLabelText("Next action"), " locally");
  await user.click(screen.getByRole("button", { name: "Save checkpoint" }));
  expect((await screen.findByRole("alert")).textContent).toContain("newer server version exists");
  expect((screen.getByLabelText("Next action") as HTMLInputElement).value).toContain("locally");
});

it.each([400, 401, 403, 404, 500])("retains local input after HTTP %s without fabricated success", async (status) => {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => url.includes("projects") ? Response.json([{ id: "project-1" }]) : init?.method === "POST" ? Response.json({ detail: "Request rejected" }, { status }) : Response.json(initial)));
  render(<CreatorSessionProvider session={mockSession}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  await screen.findByRole("heading", { name: "Our launch" });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Edit checkpoint" }));
  await user.type(screen.getByLabelText("Next action"), " local");
  await user.click(screen.getByRole("button", { name: "Save and return" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Your edits are preserved");
  expect((screen.getByLabelText("Next action") as HTMLInputElement).value).toBe("Choose an angle local");
});

it("rejects a deep link into a different workspace and clears old identity content", async () => {
  let scope = "project-1";
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("projects") ? Response.json([{ id: scope }]) : Response.json(initial)));
  const { rerender } = render(<CreatorSessionProvider session={mockSession}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  await screen.findByRole("heading", { name: "Our launch" });
  scope = "other-project";
  rerender(<CreatorSessionProvider session={{ ...mockSession, activeWorkspaceId: "ws-2" }}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  expect(screen.queryByRole("heading", { name: "Our launch" })).toBeNull();
  expect((await screen.findByRole("alert")).textContent).toContain("not in the current workspace");
});

it("preserves newer typing while a deliberate server reload is pending", async () => {
  let reload: ((response: Response) => void) | undefined;
  let reads = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.includes("projects")) return Response.json([{ id: "project-1" }]);
    reads += 1;
    if (reads > 1) return new Promise<Response>((resolve) => { reload = resolve; });
    return Response.json(initial);
  }));
  render(<CreatorSessionProvider session={mockSession}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  await screen.findByRole("heading", { name: "Our launch" });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Edit checkpoint" }));
  await user.type(screen.getByLabelText("Next action"), " initial edit");
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  await user.click(screen.getByRole("button", { name: "Reload saved version" }));
  await user.type(screen.getByLabelText("Next action"), " newer edit");
  reload!(Response.json({ ...initial, item: { ...initial.item, nextAction: "Server action", revision: 2 }, checkpoint: { ...initial.checkpoint, revision: 2 } }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Unsaved changes"));
  expect((screen.getByLabelText("Next action") as HTMLInputElement).value).toBe("Choose an angle initial edit newer edit");
  confirm.mockRestore();
});

it("cancels dirty link navigation and keeps edits until a deliberate discard", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("projects") ? Response.json([{ id: "project-1" }]) : Response.json(initial)));
  render(<CreatorSessionProvider session={mockSession}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  await screen.findByRole("heading", { name: "Our launch" });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Edit checkpoint" }));
  await user.type(screen.getByLabelText("Content goal"), " unsaved");
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const link = screen.getByRole("link", { name: "Back to Creator Home" });
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  expect(link.dispatchEvent(click)).toBe(false);
  expect(confirm).toHaveBeenCalledTimes(1);
  expect((screen.getByLabelText("Content goal") as HTMLTextAreaElement).value).toContain("unsaved");
  const unload = new Event("beforeunload", { cancelable: true });
  expect(window.dispatchEvent(unload)).toBe(false);
  confirm.mockRestore();
});

it("allows view-only roles to inspect pinned voice context without checkpoint write controls", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("projects") ? Response.json([{ id: "project-1" }]) : Response.json({ ...initial, brandVoice: { ...initial.brandVoice, isApproved: false } })));
  render(<CreatorSessionProvider session={{ ...mockSession, workspaces: [{ ...mockSession.workspaces[0], role: "reviewer" }] }}><ContentItemDashboard id="post-1" /></CreatorSessionProvider>);
  expect(await screen.findByText(/Acceptance unverified/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "Edit checkpoint" }) as HTMLButtonElement).disabled).toBe(true);
});
