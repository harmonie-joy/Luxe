import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdeaCaptureWidget } from "./idea-capture-widget";
import { POC_WORKSPACE_STORAGE_KEY, usePocWorkspaceState } from "@/lib/state/poc-workspace-state";

function Inbox() {
  const { ideas } = usePocWorkspaceState();
  return <ul>{ideas.map((idea) => <li key={idea.id}>{idea.text}</li>)}</ul>;
}

describe("shared prototype idea capture", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("adds an idea to the shared inbox and restores it on remount", () => {
    const captured = vi.fn();
    const view = render(<><IdeaCaptureWidget onCaptured={captured} /><Inbox /></>);
    fireEvent.change(screen.getByRole("textbox", { name: "Idea note" }), { target: { value: "A synthetic founder story" } });
    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));
    expect(screen.getByText("A synthetic founder story")).toBeDefined();
    expect(captured).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!).ideas).toHaveLength(1);
    view.unmount();
    render(<Inbox />);
    expect(screen.getByText("A synthetic founder story")).toBeDefined();
  });

  it("preserves input and reports storage failures without success", () => {
    render(<IdeaCaptureWidget />);
    fireEvent.change(screen.getByRole("textbox", { name: "Idea note" }), { target: { value: "Keep this thought" } });
    const failure = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Unavailable"); });
    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));
    expect(screen.getByRole("textbox", { name: "Idea note" }).getAttribute("value")).toBe("Keep this thought");
    expect(screen.getByText(/Could not save this idea/)).toBeDefined();
    failure.mockRestore();
  });

  it("retains input and stored work on read failure, then allows a retry after recovery", () => {
    const timestamp = "2026-11-06T12:00:00.000Z";
    const stored = {
      ideas: [{ id: "saved-idea", text: "Saved thought", status: "inbox", createdAt: timestamp, updatedAt: timestamp }],
      gamePlan: { ideaId: "saved-idea", objective: "Educate", audience: "Founders", angle: "Lessons", format: "Post", nextAction: "Draft", updatedAt: timestamp },
      feedback: [{ postId: "saved-post", worthIt: "yes", outcome: "Conversation", learning: "Be specific", updatedAt: timestamp }],
    };
    const raw = JSON.stringify(stored);
    localStorage.setItem(POC_WORKSPACE_STORAGE_KEY, raw);
    const captured = vi.fn();
    render(<><IdeaCaptureWidget onCaptured={captured} /><Inbox /></>);
    fireEvent.change(screen.getByRole("textbox", { name: "Idea note" }), { target: { value: "Keep this new thought" } });
    const readFailure = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Read unavailable"); });
    const write = vi.spyOn(Storage.prototype, "setItem");

    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));

    expect(screen.getByText(/Could not save this idea/)).toBeDefined();
    expect(screen.getByRole("textbox", { name: "Idea note" }).getAttribute("value")).toBe("Keep this new thought");
    expect(captured).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(screen.queryByText(/Idea saved in this browser/)).toBeNull();
    readFailure.mockRestore();
    expect(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)).toBe(raw);

    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));

    expect(captured).toHaveBeenCalledOnce();
    expect(screen.getByRole("textbox", { name: "Idea note" }).getAttribute("value")).toBe("");
    const saved = JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!);
    expect(saved.ideas).toHaveLength(2);
    expect(saved.ideas[1]).toEqual(stored.ideas[0]);
    expect(saved.gamePlan).toEqual(stored.gamePlan);
    expect(saved.feedback).toEqual(stored.feedback);
  });

  it("preserves malformed storage and input, and never invokes a microphone", () => {
    const captured = vi.fn();
    render(<><IdeaCaptureWidget onCaptured={captured} /><Inbox /></>);
    localStorage.setItem(POC_WORKSPACE_STORAGE_KEY, "invalid");
    const write = vi.spyOn(Storage.prototype, "setItem");
    fireEvent.click(screen.getByRole("button", { name: "Voice preview" }));
    expect(screen.getByText("Voice preview selected. Microphone and audio are not used.")).toBeDefined();
    expect(screen.getByRole("list").children).toHaveLength(0);
    fireEvent.change(screen.getByRole("textbox", { name: "Idea note" }), { target: { value: "Keep this thought" } });
    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));
    expect(screen.getByRole("textbox", { name: "Idea note" }).getAttribute("value")).toBe("Keep this thought");
    expect(screen.getByText(/Could not save this idea/)).toBeDefined();
    expect(captured).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)).toBe("invalid");
  });
});