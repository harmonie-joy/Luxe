import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_ROUTES } from "@/lib/routes";
import { POC_WORKSPACE_STORAGE_KEY } from "@/lib/state/poc-workspace-state";
import ImpactPage from "./page";

function fillFeedback(worthIt = "Yes", outcome = "Seven thoughtful replies", learning = "One clear question made the conversation easier") {
  fireEvent.click(screen.getByRole("radio", { name: worthIt }));
  fireEvent.change(screen.getByLabelText("What Happened", { exact: true }), { target: { value: outcome } });
  fireEvent.change(screen.getByLabelText("What We Learned", { exact: true }), { target: { value: learning } });
}

describe("Impact & Learn browser-local prototype", () => {
  beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

  it("distinguishes synthetic observations, absent confirmation and unavailable inference", () => {
    render(<ImpactPage />);
    expect(screen.getByText("Observed (synthetic)")).toBeDefined();
    expect(screen.getByText("Creator-Confirmed")).toBeDefined();
    expect(screen.getByText("Inferred")).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain("No feedback saved for this post yet");
    expect(screen.queryByRole("link", { name: "Create next post" })).toBeNull();
    expect(screen.getByRole("meter", { name: /Replies toward intended goal/ })).toBeDefined();
  });

  it("requires a worth-it decision, outcome and learning before saving", () => {
    render(<ImpactPage />);
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(screen.getByRole("alert").textContent).toContain("worth-it decision");
    expect(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(screen.getByRole("alert").textContent).toContain("outcome");
  });

  it("persists confirmation and derives a create action only after save", () => {
    const view = render(<ImpactPage />);
    fillFeedback();
    expect(screen.queryByRole("link", { name: "Create next post" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(screen.getByRole("status").textContent).toContain("Feedback saved in this browser");
    expect(screen.getByRole("link", { name: "Create next post" }).getAttribute("href")).toBe(APP_ROUTES.pocsContentWorkspace);
    expect(screen.getByRole("region", { name: "Next Best Move" }).textContent).toContain("One clear question");
    const saved = JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!).feedback[0];
    expect(saved.postId).toBe("gallery-005");
    expect(saved.worthIt).toBe("yes");
    expect(Number.isNaN(Date.parse(saved.updatedAt))).toBe(false);
    view.unmount();
    render(<ImpactPage />);
    expect(screen.getByLabelText("What Happened", { exact: true }).textContent).toBe("Seven thoughtful replies");
    expect(screen.getByRole("link", { name: "Create next post" })).toBeDefined();
  });

  it("edits saved feedback without duplicating it and changes the inferred move", () => {
    render(<ImpactPage />);
    fillFeedback();
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    fillFeedback("No", "The response did not justify the time", "Try a narrower question");
    expect(screen.getByRole("link", { name: "Create next post" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(screen.queryByRole("link", { name: "Create next post" })).toBeNull();
    expect(screen.getByRole("link", { name: "Revisit Plan" }).getAttribute("href")).toBe(APP_ROUTES.pocsPlan);
    expect(screen.getByRole("region", { name: "Next Best Move" }).textContent).toContain("Try a narrower question");
    expect(JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!).feedback).toHaveLength(1);
  });

  it("retains input and last saved inference on storage failure, then retries", () => {
    render(<ImpactPage />);
    fillFeedback("Partly", "Some replies but too much effort", "Reduce the scope");
    const blockedWrite = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage unavailable"); });
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(screen.getByRole("alert").textContent).toContain("Could not save");
    expect(screen.getByLabelText("What We Learned", { exact: true }).textContent).toBe("Reduce the scope");
    expect(screen.queryByRole("link", { name: "Revisit Plan" })).toBeNull();
    blockedWrite.mockRestore();
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(screen.getByRole("link", { name: "Revisit Plan" }).getAttribute("href")).toBe(APP_ROUTES.pocsPlan);
  });

  it("keeps feedback keyed by post and restores it when switching posts", () => {
    render(<ImpactPage />);
    fillFeedback();
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    fireEvent.change(screen.getByLabelText("Review post"), { target: { value: "gallery-006" } });
    expect(screen.getByRole("status").textContent).toContain("No feedback saved for this post yet");
    expect(screen.getByLabelText("What Happened", { exact: true }).textContent).toBe("");
    fillFeedback("Partly", "Three replies", "Use a shorter format");
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!).feedback).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Review post"), { target: { value: "gallery-005" } });
    expect(screen.getByLabelText("What Happened", { exact: true }).textContent).toBe("Seven thoughtful replies");
  });

  it("does not replace saved confirmation or inference when an edit fails to persist", () => {
    render(<ImpactPage />);
    fillFeedback();
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    fillFeedback("No", "Reconsidering the effort", "A new unsaved learning");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage unavailable"); });
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(screen.getByRole("alert").textContent).toContain("Could not save");
    expect(screen.getByLabelText("What We Learned", { exact: true }).textContent).toBe("A new unsaved learning");
    expect(screen.getByRole("link", { name: "Create next post" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Next Best Move" }).textContent).toContain("One clear question");
    expect(JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!).feedback[0].worthIt).toBe("yes");
  });
});