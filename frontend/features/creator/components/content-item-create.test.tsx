import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ContentItemCreate } from "./content-item-create";
import { CreatorSessionProvider } from "./creator-session";
import { mockSession, router } from "@/test/setup";

afterEach(() => vi.unstubAllGlobals());
it("requires deliberate acceptance of the exact active voice before creating a persisted post", async () => {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes("/projects/")) return Response.json([{ id: "project-1", workspaceId: 1, name: "Launch" }]);
    if (url.includes("/brand-profiles/")) return Response.json([{ id: "profile-1", workspaceId: "ws-1", name: "Our brand" }]);
    if (url.includes("/approve/")) return Response.json({ voiceId: "voice-1", event: "accepted" });
    if (url.includes("/brand-voices/")) return Response.json([{ id: "voice-1", brandProfileId: "profile-1", isActive: true, version: 4, voiceSummary: "Warm, precise and honest", tone: {}, claimBoundaries: [], preferredVocabulary: [], bannedPhrases: [], toneTags: [] }]);
    if (url.includes("/content-items/") && init?.method === "POST") return Response.json({ item: { id: "created-post" } });
    throw Error(url);
  });
  vi.stubGlobal("fetch", fetch);
  render(<CreatorSessionProvider session={mockSession}><ContentItemCreate /></CreatorSessionProvider>);
  expect(await screen.findByText("Warm, precise and honest")).toBeTruthy();
  expect(fetch.mock.calls.some(([url]) => url.includes("approve"))).toBe(false);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Title"), "Our next launch");
  await user.type(screen.getByLabelText("Content goal"), "Explain the launch");
  await user.type(screen.getByLabelText("Next action"), "Write the opening");
  await user.click(screen.getByRole("button", { name: "Review and accept version 4" }));
  expect(await screen.findByText(/Accepted version 4/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Create saved post" }));
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/content-items/created-post"));
  const call = fetch.mock.calls.find(([url, init]) => url.includes("content-items") && init?.method === "POST")!;
  expect(JSON.parse(call[1]!.body as string)).toEqual({ project: "project-1", brand_profile: "profile-1", brand_voice: "voice-1", title: "Our next launch", goal: "Explain the launch", workflow_stage: "idea", next_action: "Write the opening", decisions: [], open_questions: [] });
});

function createHttp(options: { approvalStatus?: number; createFailure?: boolean; pending?: boolean; noVoice?: boolean; noProfiles?: boolean; noProjects?: boolean } = {}) {
  return vi.fn(async (url: string, init?: RequestInit): Promise<Response> => {
    if (url.includes("/projects/")) return init?.method === "POST" ? Response.json({ id: "new-project", name: "Launch", workspaceId: 1 }) : Response.json(options.noProjects ? [] : [{ id: "project-1", name: "Launch", workspaceId: 1 }]);
    if (url.includes("/brand-profiles/")) return Response.json(options.noProfiles ? [] : [{ id: "profile-1", workspaceId: "ws-1", name: "Our brand" }]);
    if (url.includes("/approve/")) return Response.json(options.approvalStatus ? { detail: "Not allowed to accept voice" } : { voiceId: "voice-1", event: "accepted" }, { status: options.approvalStatus ?? 200 });
    if (url.includes("/brand-voices/")) return Response.json(options.noVoice ? [] : [{ id: "voice-1", brandProfileId: "profile-1", isActive: true, version: 4, voiceSummary: "Warm and honest", tone: {}, claimBoundaries: [], preferredVocabulary: [], bannedPhrases: [], toneTags: [] }]);
    if (url.includes("/content-items/") && init?.method === "POST") {
      if (options.createFailure) throw Error("Connection lost");
      if (options.pending) return new Promise(() => {});
      return Response.json({ item: { id: "created-post" } });
    }
    throw Error(url);
  });
}
async function fillCreate(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText("Warm and honest");
  await user.type(screen.getByLabelText("Title"), "Our launch");
  await user.type(screen.getByLabelText("Content goal"), "Explain the launch");
  await user.type(screen.getByLabelText("Next action"), "Write the opening");
}

it.each([403, 500])("shows acceptance failure HTTP %s and blocks creation without implicit approval", async (approvalStatus) => {
  const fetch = createHttp({ approvalStatus }); vi.stubGlobal("fetch", fetch);
  render(<CreatorSessionProvider session={mockSession}><ContentItemCreate /></CreatorSessionProvider>);
  const user = userEvent.setup(); await fillCreate(user);
  await user.click(screen.getByRole("button", { name: "Review and accept version 4" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Not allowed");
  expect((screen.getByRole("button", { name: "Create saved post" }) as HTMLButtonElement).disabled).toBe(true);
  expect(fetch.mock.calls.some(([url]) => url.includes("content-items"))).toBe(false);
});

it("creates a minimal project and prevents duplicate pending item submissions", async () => {
  const fetch = createHttp({ noProjects: true, pending: true }); vi.stubGlobal("fetch", fetch);
  render(<CreatorSessionProvider session={mockSession}><ContentItemCreate /></CreatorSessionProvider>);
  const user = userEvent.setup(); await fillCreate(user);
  await user.type(screen.getByLabelText("New project name"), "Launch");
  await user.selectOptions(screen.getByLabelText("Current stage"), "drafting");
  await user.type(screen.getByLabelText("Previous decisions"), "Keep it precise");
  await user.type(screen.getByLabelText("Open questions"), "Which audience?");
  await user.click(screen.getByRole("button", { name: "Review and accept version 4" }));
  await user.click(screen.getByRole("button", { name: "Create saved post" }));
  expect((screen.getByRole("button", { name: "Working…" }) as HTMLButtonElement).disabled).toBe(true);
  const writes = fetch.mock.calls.filter(([, init]) => init?.method === "POST");
  expect(writes.filter(([url]) => url.includes("projects"))).toHaveLength(1);
  expect(writes.filter(([url]) => url.includes("content-items"))).toHaveLength(1);
  expect(JSON.parse(writes.find(([url]) => url.includes("content-items"))![1]!.body as string)).toMatchObject({ project: "new-project", workflow_stage: "drafting", decisions: ["Keep it precise"], open_questions: ["Which audience?"] });
});

it("preserves input after an ambiguous create and requires saved-work reconciliation before another attempt", async () => {
  const fetch = createHttp({ createFailure: true }); vi.stubGlobal("fetch", fetch);
  render(<CreatorSessionProvider session={mockSession}><ContentItemCreate /></CreatorSessionProvider>);
  const user = userEvent.setup(); await fillCreate(user);
  await user.click(screen.getByRole("button", { name: "Review and accept version 4" }));
  await user.click(screen.getByRole("button", { name: "Create saved post" }));
  expect(await screen.findByText(/request may have reached the server/)).toBeTruthy();
  expect((screen.getByLabelText("Content goal") as HTMLTextAreaElement).value).toBe("Explain the launch");
  expect((screen.getByRole("button", { name: "Create saved post" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByRole("link", { name: /Check saved posts/ }).getAttribute("target")).toBe("_blank");
  expect(router.push).not.toHaveBeenCalled();
});

it.each([{ noVoice: true, message: /No active voice version/ }, { noProfiles: true, message: /No Brand Profile in this workspace/ }])("guides unavailable setup without synthetic voices", async ({ message, ...options }) => {
  vi.stubGlobal("fetch", createHttp(options));
  render(<CreatorSessionProvider session={mockSession}><ContentItemCreate /></CreatorSessionProvider>);
  expect(await screen.findByText(message)).toBeTruthy();
});
