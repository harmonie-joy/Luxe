import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_ROUTES } from "@/lib/routes";
import { POC_WORKSPACE_STORAGE_KEY } from "@/lib/state/poc-workspace-state";
import PlanPage from "./page";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function enterStep(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

function finishPlan() {
  enterStep("Goal", "Start useful conversations");
  enterStep("Audience", "Independent creators");
  enterStep("Angle", "A practical weekly reset");
  fireEvent.change(screen.getByLabelText("Format", { exact: true }), { target: { value: "Text post" } });
}

describe("Plan browser-local prototype", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("starts with an empty inbox and captures raw text and a reference", () => {
    render(<PlanPage />);
    expect(screen.getByText("Your Ideas Inbox is empty.")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Raw idea"), { target: { value: "An unfinished weekly reset" } });
    fireEvent.change(screen.getByLabelText("Reference link"), { target: { value: "https://example.com/reset" } });
    fireEvent.click(screen.getByRole("button", { name: "Save to inbox" }));
    const inbox = screen.getByRole("region", { name: "Ideas Inbox" });
    expect(inbox.textContent).toContain("An unfinished weekly reset");
    expect(inbox.textContent).toContain("https://example.com/reset");
    expect(screen.getByLabelText("Raw idea").getAttribute("value") ?? screen.getByLabelText("Raw idea").textContent).not.toContain("An unfinished");
  });

  it("consumes the shared capture widget and can use or archive an idea", () => {
    render(<PlanPage />);
    fireEvent.change(screen.getByLabelText("Idea note"), { target: { value: "One good client question" } });
    fireEvent.click(screen.getByRole("button", { name: "Capture idea" }));
    const inbox = screen.getByRole("region", { name: "Ideas Inbox" });
    fireEvent.click(within(inbox).getByRole("button", { name: /Use idea/ }));
    enterStep("Goal", "Educate");
    enterStep("Audience", "New founders");
    expect(screen.getByLabelText("Angle").textContent).toBe("One good client question");
    fireEvent.click(within(inbox).getByRole("button", { name: /Archive idea/ }));
    expect(screen.getByText("Your Ideas Inbox is empty.")).toBeDefined();
  });

  it("validates every step and preserves values when going back", () => {
    render(<PlanPage />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("alert").textContent).toContain("Goal");
    enterStep("Goal", "Build trust");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("alert").textContent).toContain("Audience");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Goal").textContent).toBe("Build trust");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    enterStep("Audience", "New founders");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("alert").textContent).toContain("Angle");
    enterStep("Angle", "Lessons from a first launch");
    fireEvent.click(screen.getByRole("button", { name: "Save Game Plan" }));
    expect(screen.getByRole("alert").textContent).toContain("Format");
    expect(push).not.toHaveBeenCalled();
  });

  it("saves a plan, marks its idea planned, navigates and recovers on remount", () => {
    const view = render(<PlanPage />);
    fireEvent.change(screen.getByLabelText("Raw idea"), { target: { value: "Weekly reset" } });
    fireEvent.click(screen.getByRole("button", { name: "Save to inbox" }));
    fireEvent.click(within(screen.getByRole("region", { name: "Ideas Inbox" })).getByRole("button", { name: /Use idea/ }));
    finishPlan();
    fireEvent.click(screen.getByRole("button", { name: "Save Game Plan" }));
    expect(push).toHaveBeenCalledWith(APP_ROUTES.pocsContentWorkspace);
    const stored = JSON.parse(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!);
    expect(stored.ideas[0].status).toBe("planned");
    expect(stored.gamePlan.ideaId).toBe(stored.ideas[0].id);
    expect(stored.gamePlan.nextAction).toBeTruthy();
    expect(Number.isNaN(Date.parse(stored.gamePlan.updatedAt))).toBe(false);
    view.unmount();
    render(<PlanPage />);
    expect(screen.getByRole("region", { name: "Saved Game Plan" }).textContent).toContain("Start useful conversations");
    fireEvent.click(screen.getByRole("button", { name: "Edit saved plan" }));
    expect(screen.getByLabelText("Goal").textContent).toBe("Start useful conversations");
  });

  it("retains raw text and the wizard if browser writes fail", () => {
    render(<PlanPage />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage unavailable"); });
    fireEvent.change(screen.getByLabelText("Raw idea"), { target: { value: "Keep this unfinished thought" } });
    fireEvent.click(screen.getByRole("button", { name: "Save to inbox" }));
    expect(screen.getByRole("alert").textContent).toContain("Could not save");
    expect(screen.getByLabelText("Raw idea").textContent).toBe("Keep this unfinished thought");
    finishPlan();
    fireEvent.click(screen.getByRole("button", { name: "Save Game Plan" }));
    expect(screen.getByRole("alert").textContent).toContain("Could not save");
    expect(screen.getByLabelText("Format").getAttribute("aria-invalid")).not.toBe("true");
    expect(push).not.toHaveBeenCalled();
    expect(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Angle").textContent).toBe("A practical weekly reset");
  });

  it("makes Quick Create available without completing the wizard", () => {
    render(<PlanPage />);
    expect(screen.getByRole("link", { name: "Quick Create" }).getAttribute("href")).toBe(APP_ROUTES.pocsContentWorkspace);
    expect(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)).toBeNull();
  });

  it("captures file metadata without contents and rejects non-web references", () => {
    render(<PlanPage />);
    const file = new File(["Private synthetic body should not be persisted"], "reference.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("File references (metadata only)"), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText("Reference link"), { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Save to inbox" }));
    expect(screen.getByRole("alert").textContent).toContain("http or https");
    expect(localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)).toBeNull();
    fireEvent.change(screen.getByLabelText("Reference link"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save to inbox" }));
    const stored = localStorage.getItem(POC_WORKSPACE_STORAGE_KEY)!;
    expect(stored).toContain("reference.txt");
    expect(stored).toContain("text/plain");
    expect(stored).not.toContain("Private synthetic body");
    fireEvent.click(screen.getByRole("button", { name: "Voice preview" }));
    expect(screen.getByText("Voice preview selected. Microphone and audio are not used.")).toBeDefined();
  });

  it("reads optional stage context without filling decisions implicitly", () => {
    sessionStorage.setItem("luxe-pocs-stage1-profile", JSON.stringify({ answers: [], tone: "Direct", communicationStyle: "Short practical notes", completedSteps: [], dimensionSummaries: { audience: "Independent creators" } }));
    render(<PlanPage />);
    expect(screen.getByText("Independent creators")).toBeDefined();
    expect(screen.getByText("Short practical notes")).toBeDefined();
    expect(screen.getByLabelText("Goal").textContent).toBe("");
    expect(screen.getByText("Saved onboarding notes, not inferred or approved brand guidance.")).toBeDefined();
  });
});