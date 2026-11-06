import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  capturePocIdea,
  POC_WORKSPACE_STORAGE_KEY,
  savePocFeedback,
  savePocGamePlan,
  updatePocIdea,
  usePocWorkspaceState,
  type PocFeedback,
  type PocGamePlan,
  type PocIdea,
} from "./poc-workspace-state";

const timestamp = "2026-11-06T12:00:00.000Z";
const idea: PocIdea = { id: "saved-idea", text: "Saved thought", status: "inbox", createdAt: timestamp, updatedAt: timestamp };
const plan: PocGamePlan = { ideaId: idea.id, objective: "Educate", audience: "Founders", angle: "Lessons", format: "Post", nextAction: "Draft", updatedAt: timestamp };
const feedback: PocFeedback = { postId: "saved-post", worthIt: "yes", outcome: "Conversation", learning: "Be specific", updatedAt: timestamp };
const storedState = { ideas: [idea], gamePlan: plan, feedback: [feedback] };
const storedRaw = JSON.stringify(storedState);
const operations = [
  { name: "capture", run: () => capturePocIdea("New thought"), failure: null },
  { name: "update", run: () => updatePocIdea(idea.id, "archived"), failure: false },
  { name: "save plan", run: () => savePocGamePlan({ ...plan, objective: "New objective" }), failure: false },
  { name: "save feedback", run: () => savePocFeedback({ ...feedback, learning: "New learning" }), failure: false },
];

describe("guarded prototype workspace storage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(POC_WORKSPACE_STORAGE_KEY, storedRaw);
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(operations)("blocks $name on a failed fresh read and permits retry after recovery", ({ run, failure }) => {
    const { result, rerender } = renderHook(usePocWorkspaceState);
    const snapshot = result.current;
    const readFailure = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Read unavailable"); });
    const write = vi.spyOn(Storage.prototype, "setItem");

    expect(run()).toBe(failure);
    expect(readFailure).toHaveBeenCalledOnce();
    rerender();
    expect(result.current).toBe(snapshot);
    expect(snapshot).toEqual(storedState);
    expect(write).not.toHaveBeenCalled();
    readFailure.mockRestore();
    expect(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)).toBe(storedRaw);

    rerender();
    expect(result.current).toBe(snapshot);
    expect(run()).toBeTruthy();
    expect(write).toHaveBeenCalledOnce();
    expect(snapshot).toEqual(storedState);
  });

  it.each([
    { name: "malformed JSON", raw: "invalid" },
    { name: "empty bytes", raw: "" },
    { name: "JSON null", raw: "null" },
    { name: "missing fields", raw: "{}" },
    { name: "invalid idea status", raw: JSON.stringify({ ...storedState, ideas: [{ ...idea, status: ["inbox"] }] }) },
    { name: "invalid feedback answer", raw: JSON.stringify({ ...storedState, feedback: [{ ...feedback, worthIt: ["yes"] }] }) },
    { name: "invalid plan", raw: JSON.stringify({ ...storedState, gamePlan: { ...plan, nextAction: 7 } }) },
  ])("blocks every operation on $name without changing bytes or the cached snapshot", ({ raw }) => {
    const { result, rerender } = renderHook(usePocWorkspaceState);
    const snapshot = result.current;
    localStorage.setItem(POC_WORKSPACE_STORAGE_KEY, raw);
    const write = vi.spyOn(Storage.prototype, "setItem");

    for (const operation of operations) expect(operation.run()).toBe(operation.failure);

    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)).toBe(raw);
    rerender();
    expect(result.current).toBe(snapshot);
    expect(snapshot).toEqual(storedState);
  });

  it("writes genuinely missing storage and preserves other fields through successive operations", () => {
    const { result, rerender, unmount } = renderHook(usePocWorkspaceState);
    const previous = result.current;
    localStorage.removeItem(POC_WORKSPACE_STORAGE_KEY);
    rerender();
    expect(result.current).toEqual({ ideas: [], gamePlan: null, feedback: [] });
    expect(result.current).not.toBe(previous);
    const empty = result.current;
    rerender();
    expect(result.current).toBe(empty);
    unmount();

    const capturedId = capturePocIdea("New thought");
    expect(capturedId).toEqual(expect.any(String));
    if (!capturedId) throw new Error("Expected successful capture");
    expect(savePocFeedback(feedback)).toBe(true);
    const capturedPlan = { ...plan, ideaId: capturedId };
    expect(savePocGamePlan(capturedPlan)).toBe(true);
    expect(updatePocIdea(capturedId, "drafting")).toBe(true);

    const saved = JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!);
    expect(saved.ideas).toEqual([expect.objectContaining({ id: capturedId, text: "New thought", status: "drafting" })]);
    expect(saved.gamePlan).toEqual(capturedPlan);
    expect(saved.feedback).toEqual([feedback]);
  });

  it("uses the actual current bytes instead of a stale cached view", () => {
    const { result, rerender, unmount } = renderHook(usePocWorkspaceState);
    const snapshot = result.current;
    rerender();
    expect(result.current).toBe(snapshot);
    unmount();
    const latest = {
      ideas: [{ ...idea, id: "latest-idea" }],
      gamePlan: { ...plan, ideaId: "latest-idea", objective: "Latest objective" },
      feedback: [{ ...feedback, learning: "Latest learning" }],
    };
    localStorage.setItem(POC_WORKSPACE_STORAGE_KEY, JSON.stringify(latest));

    expect(capturePocIdea("New thought")).toBeTruthy();

    const saved = JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!);
    expect(saved.ideas).toHaveLength(2);
    expect(saved.ideas[1]).toEqual(latest.ideas[0]);
    expect(saved.gamePlan).toEqual(latest.gamePlan);
    expect(saved.feedback).toEqual(latest.feedback);
    const restored = renderHook(usePocWorkspaceState);
    expect(restored.result.current).toEqual(saved);
    const current = restored.result.current;
    restored.rerender();
    expect(restored.result.current).toBe(current);
  });
});