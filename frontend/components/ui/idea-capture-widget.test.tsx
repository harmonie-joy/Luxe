import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdeaCaptureWidget } from "./idea-capture-widget";
import { POC_WORKSPACE_STORAGE_KEY, usePocWorkspaceState } from "@/lib/state/poc-workspace-state";

function Inbox() {
  const { ideas } = usePocWorkspaceState();
  return <ul>{ideas.map((idea) => <li key={idea.id}>{idea.text}</li>)}</ul>;
}

describe("shared prototype idea capture", () => {
  beforeEach(() => localStorage.clear());

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

  it("recovers from malformed storage and never invokes a microphone", () => {
    localStorage.setItem(POC_WORKSPACE_STORAGE_KEY, "invalid");
    render(<><IdeaCaptureWidget /><Inbox /></>);
    fireEvent.click(screen.getByRole("button", { name: "Voice preview" }));
    expect(screen.getByText("Voice preview selected. Microphone and audio are not used.")).toBeDefined();
    expect(screen.getByRole("list").children).toHaveLength(0);
  });
});