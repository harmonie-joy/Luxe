import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSinglePostLoop } from "@/lib/mock-data/pocs-data";
import { createPocPostState, pocPostSignature, pocVisualSignature, readPocPostState, savePocPostState, usePocPostSnapshot } from "@/lib/state/poc-post-state";
import { router } from "@/test/setup";
import SandboxLayout from "../layout";
import SinglePostPage from "./page";

const key = `luxe-poc-single-post:${mockSinglePostLoop.id}`;
const reviewChecks = ["Brand match", "Platform format", "Asset rights"];

async function recovered() {
  await waitFor(() => expect((screen.getByRole("button", { name: "Save Draft" }) as HTMLButtonElement).disabled).toBe(false));
}

function open(button: string | RegExp, title: string) {
  const trigger = screen.getByRole("button", { name: button });
  trigger.focus();
  fireEvent.click(trigger);
  return screen.getByRole("dialog", { name: title });
}

async function approve() {
  await recovered();
  let dialog = open("Edit Message", "Message editor");
  fireEvent.click(within(dialog).getByRole("button", { name: "Accept" }));
  dialog = open("Edit Visual", "Visual editor");
  fireEvent.click(within(dialog).getByRole("button", { name: "Accept Visual" }));
  dialog = open("Review Post", "Final review");
  for (const name of reviewChecks) fireEvent.click(within(dialog).getByRole("checkbox", { name }));
  fireEvent.click(within(dialog).getByRole("button", { name: /Approve & Mark Ready/ }));
}

describe("Persistent single-post home with focused layers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: { configurable: true, value() { this.setAttribute("open", ""); this.querySelector("[autofocus]")?.focus(); } },
      close: { configurable: true, value() { this.removeAttribute("open"); } },
    });
  });

  it("keeps the same hub mounted, one layer active, and returns focus on Close or Escape", async () => {
    render(<SinglePostPage />);
    await recovered();
    const hub = screen.getByRole("region", { name: "Post dashboard" });
    expect(localStorage.getItem(key)).toBeNull();
    for (const [button, title] of [["Edit Message", "Message editor"], ["Edit Visual", "Visual editor"], ["Review Post", "Final review"]]) {
      const trigger = screen.getByRole("button", { name: button });
      const dialog = open(button, title);
      expect(screen.getAllByRole("dialog").length).toBe(1);
      expect(screen.getByRole("region", { name: "Post dashboard" })).toBe(hub);
      const close = within(dialog).getByRole("button", { name: `Close ${title}` });
      expect(document.activeElement).toBe(close);
      fireEvent.click(close);
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    }
    const dialog = open("Edit Message", "Message editor");
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit Message" }));
    expect(screen.getByRole("button", { name: /Continue Message/ })).toBeDefined();
    expect(screen.getByRole("link", { name: "Original Link" }).getAttribute("href")).toBe(mockSinglePostLoop.slides[0].image);
    expect(screen.getByRole("button", { name: "Share Preview" })).toBeDefined();
  });

  it("preserves original and working edits/history through Close, Reject, Adjust, Accept and refresh", async () => {
    const { unmount } = render(<SinglePostPage />);
    await recovered();
    let dialog = open("Edit Message", "Message editor");
    fireEvent.click(within(dialog).getByRole("button", { name: "V2" }));
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Suggested caption" }), { target: { value: "My refined message." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Message editor" }));
    expect(localStorage.getItem(key)).toBeNull();
    dialog = open("Edit Message", "Message editor");
    expect((within(dialog).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("My refined message.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Accept" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(readPocPostState()?.caption).toBe("My refined message.");
    expect(readPocPostState()?.acceptedVersion).toBe("caption-v4");
    expect(screen.getByRole("button", { name: /Continue to Visual/ })).toBeDefined();
    dialog = open("Edit Message", "Message editor");
    expect(within(dialog).getByRole("button", { name: "V4" })).toBeDefined();
    expect((within(dialog).getByRole("textbox", { name: "Original caption" }) as HTMLTextAreaElement).value).toBe(mockSinglePostLoop.original);
    fireEvent.click(within(dialog).getByRole("button", { name: "V1" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject" }));
    expect((within(dialog).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("My refined message.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Adjust" }));
    expect(document.activeElement).toBe(within(dialog).getByRole("combobox", { name: "Refine the suggestion" }));
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Suggested caption" }), { target: { value: "An unaccepted working edit." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save & Return" }));
    expect(readPocPostState()?.caption).toBe("My refined message.");
    expect(readPocPostState()?.workingCaption).toBe("An unaccepted working edit.");
    unmount();
    render(<SinglePostPage />);
    await recovered();
    dialog = open("Edit Message", "Message editor");
    expect((within(dialog).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("An unaccepted working edit.");
    expect(within(dialog).getByRole("button", { name: "V4" })).toBeDefined();
  });

  it("blocks stale Save Draft without losing newer accepted history or unsaved local text", async () => {
    const baseline = createPocPostState();
    expect(savePocPostState(baseline)).toBe(true);
    render(<SinglePostPage />);
    await recovered();
    let dialog = open("Edit Message", "Message editor");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Suggested caption" }), { target: { value: "Unsaved older-tab edit." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Message editor" }));
    const version = { id: "caption-v4", label: "V4", text: "Newer accepted caption.", createdAt: "2026-11-06T12:00:00Z" };
    expect(savePocPostState({ ...baseline, caption: version.text, acceptedVersion: version.id,
      versions: [...baseline.versions, version] })).toBe(true);
    const newerBytes = localStorage.getItem(key);

    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    expect(localStorage.getItem(key)).toBe(newerBytes);
    expect(readPocPostState()?.versions).toEqual([...baseline.versions, version]);
    expect(screen.getByRole("status").textContent).toContain("conflict");
    expect(screen.getByLabelText("Browser save status").textContent).toBe("Unsaved local edits");
    dialog = open("Edit Message", "Message editor");
    expect((within(dialog).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("Unsaved older-tab edit.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Message editor" }));
    fireEvent.click(screen.getByRole("button", { name: "Reload Saved Post" }));
    expect(screen.getByRole("button", { name: "Discard Local Edits & Reload" })).toBeDefined();
    expect(localStorage.getItem(key)).toBe(newerBytes);
    fireEvent.click(screen.getByRole("button", { name: "Discard Local Edits & Reload" }));
    expect(screen.getByText(version.text)).toBeDefined();
    dialog = open("Edit Message", "Message editor");
    expect((within(dialog).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe(version.text);
    expect(within(dialog).getByRole("button", { name: "V4" })).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save & Return" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(readPocPostState()?.versions).toEqual([...baseline.versions, version]);
  });

  it.each([
    ["Edit Message", "Message editor", "Accept"],
    ["Edit Visual", "Visual editor", "Accept Visual"],
    ["Review Post", "Final review", /Approve & Mark Ready/],
    [/Continue to Schedule/, "Ready / Schedule", "Schedule Post"],
    [/Continue to Schedule/, "Ready / Schedule", "Keep Ready"],
    ["Edit Message", "Message editor", "Save & Return"],
  ] as const)("binds %s / %s / %s to the controller baseline even for visual-only external changes", async (trigger, title, action) => {
    render(<SinglePostPage />);
    await approve();
    const dialog = open(trigger, title);
    if (title === "Message editor") fireEvent.change(within(dialog).getByRole("textbox", { name: "Suggested caption" }), { target: { value: "Keep my stale local caption" } });
    if (title === "Visual editor") fireEvent.change(within(dialog).getByRole("textbox", { name: "Cover headline" }), { target: { value: "Keep my stale local visual" } });
    if (action === "Schedule Post") fireEvent.change(within(dialog).getByLabelText("Schedule date"), { target: { value: "2099-11-12" } });
    if (action === "Keep Ready") fireEvent.click(within(dialog).getByRole("button", { name: /Keep Ready for Later/ }));
    const previous = readPocPostState();
    if (!previous) throw new Error("Expected approved saved package");
    const newer = { ...previous, headline: "Newer approved visual" };
    newer.visualApproval = pocVisualSignature(newer);
    newer.approvedPackage = pocPostSignature(newer);
    expect(savePocPostState(newer)).toBe(true);
    const newerBytes = localStorage.getItem(key);

    fireEvent.click(within(dialog).getByRole("button", { name: action }));

    expect(localStorage.getItem(key)).toBe(newerBytes);
    expect(readPocPostState()?.versions).toEqual(previous.versions);
    expect(readPocPostState()?.visualApproval).toBe(newer.visualApproval);
    expect(readPocPostState()?.approvedPackage).toBe(newer.approvedPackage);
    expect(within(dialog).getByRole("status").textContent).toContain("conflict");
    expect(within(dialog).getByRole("button", { name: "Reload Saved Post" })).toBeDefined();
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: title })).toBe(dialog);
    if (title === "Message editor") expect((within(dialog).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("Keep my stale local caption");
    if (title === "Visual editor") expect((within(dialog).getByRole("textbox", { name: "Cover headline" }) as HTMLTextAreaElement).value).toBe("Keep my stale local visual");
  });

  it.each(["missing initially", "deleted", "malformed"])("blocks Save Draft when storage is %s without silently replacing local work", async (change) => {
    const baseline = createPocPostState();
    if (change !== "missing initially") expect(savePocPostState(baseline)).toBe(true);
    render(<SinglePostPage />);
    await recovered();
    const dialog = open("Edit Message", "Message editor");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Suggested caption" }), { target: { value: "Unsaved local work" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Message editor" }));
    if (change === "missing initially") expect(savePocPostState({ ...baseline, headline: "New external saved post" })).toBe(true);
    if (change === "deleted") localStorage.removeItem(key);
    if (change === "malformed") localStorage.setItem(key, "{malformed");
    const newerBytes = localStorage.getItem(key);
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(screen.getByRole("status").textContent).toContain("conflict");
    expect(localStorage.getItem(key)).toBe(newerBytes);
    fireEvent.click(screen.getByRole("button", { name: "Reload Saved Post" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep Local Edits" }));
    const retained = open("Edit Message", "Message editor");
    expect((within(retained).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("Unsaved local work");
    expect(localStorage.getItem(key)).toBe(newerBytes);
  });

  it.each(["restore", "save"])("does not overwrite storage after a %s read failure, and reload failure retains local edits", async (phase) => {
    expect(savePocPostState(createPocPostState())).toBe(true);
    const savedBytes = localStorage.getItem(key);
    const read = vi.spyOn(Storage.prototype, "getItem");
    if (phase === "restore") read.mockImplementation(() => { throw new Error("Storage unreadable"); });
    render(<SinglePostPage />);
    await recovered();
    const dialog = open("Edit Message", "Message editor");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Suggested caption" }), { target: { value: "Retain despite read failure" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Message editor" }));
    read.mockImplementation(() => { throw new Error("Storage unreadable"); });
    const write = vi.spyOn(Storage.prototype, "setItem");
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(screen.getByRole("status").textContent).toContain("Unsaved local edits retained");
    fireEvent.click(screen.getByRole("button", { name: "Reload Saved Post" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard Local Edits & Reload" }));
    expect(screen.getByRole("status").textContent).toContain("Could not reload");
    expect(write).not.toHaveBeenCalled();
    read.mockRestore();
    expect(localStorage.getItem(key)).toBe(savedBytes);
    const retained = open("Edit Message", "Message editor");
    expect((within(retained).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("Retain despite read failure");
    fireEvent.click(within(retained).getByRole("button", { name: "Close Message editor" }));
    if (phase === "restore") {
      fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
      expect(write).not.toHaveBeenCalled();
    }
    fireEvent.click(screen.getByRole("button", { name: "Discard Local Edits & Reload" }));
    expect(screen.getByRole("status").textContent).toContain("Reloaded saved");
    expect(write).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("requires exact accepted message, visual and every review check, then routes the intact saved package to Calendar", async () => {
    function CalendarReader() {
      const post = usePocPostSnapshot();
      return <output aria-label="Saved calendar snapshot">{post ? JSON.stringify(post) : "No saved post"}</output>;
    }
    render(<><SinglePostPage /><CalendarReader /></>);
    await recovered();
    let dialog = open("Review Post", "Final review");
    for (const name of reviewChecks) fireEvent.click(within(dialog).getByRole("checkbox", { name }));
    expect((within(dialog).getByRole("button", { name: /Approve & Mark Ready/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Final review" }));
    await approve();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(readPocPostState()?.approved).toBe(true);
    dialog = open(/Continue to Schedule/, "Ready / Schedule");
    fireEvent.change(within(dialog).getByLabelText("Schedule date"), { target: { value: "2099-11-12" } });
    fireEvent.change(within(dialog).getByLabelText("Schedule time"), { target: { value: "16:45" } });
    fireEvent.change(within(dialog).getByLabelText("Schedule timezone"), { target: { value: "America/New_York" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Schedule Post" }));
    expect(router.push).toHaveBeenCalledWith("/pocs/calendar");
    const saved = readPocPostState();
    expect(saved?.schedule).toEqual({ date: "2099-11-12", time: "16:45", timezone: "America/New_York" });
    expect(saved?.caption).toBe(mockSinglePostLoop.versions[0].text);
    expect(saved?.assets).toEqual(mockSinglePostLoop.slides);
    expect(screen.getByRole("status", { name: "Saved calendar snapshot" }).textContent).toBe(JSON.stringify(saved));
    expect(window.location.hash).not.toBe("#calendar");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Ready / Schedule" }));
    dialog = open("Edit Visual", "Visual editor");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Cover headline" }), { target: { value: "A new direction" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save & Return" }));
    expect(readPocPostState()?.approved).toBe(false);
    expect(readPocPostState()?.schedule).toBeNull();
    expect(readPocPostState()?.visualApproved).toBe(false);
    expect(readPocPostState()?.assets).toEqual(mockSinglePostLoop.slides);
    expect(screen.getByRole("button", { name: /Continue to Visual/ })).toBeDefined();
  });

  it("invalidates final acceptance on caption changes and supports keeping Ready unscheduled", async () => {
    render(<SinglePostPage />);
    await approve();
    let dialog = open(/Continue to Schedule/, "Ready / Schedule");
    fireEvent.click(within(dialog).getByRole("button", { name: /Keep Ready for Later/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Keep Ready" }));
    expect(readPocPostState()?.schedule).toBeNull();
    expect(readPocPostState()?.approved).toBe(true);
    dialog = open("Edit Message", "Message editor");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Suggested caption" }), { target: { value: "A new accepted direction." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Accept" }));
    expect(readPocPostState()?.approved).toBe(false);
    expect(readPocPostState()?.checks).toEqual([]);
    expect(readPocPostState()?.visualApproved).toBe(true);
    expect(screen.getByRole("button", { name: /Continue to Review/ })).toBeDefined();
    dialog = open("Review Post", "Final review");
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Review caption version" }), { target: { value: "caption-v1" } });
    dialog = screen.getByRole("dialog", { name: "Message editor" });
    expect((within(dialog).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe(mockSinglePostLoop.versions[0].text);
    expect(readPocPostState()?.caption).toBe("A new accepted direction.");
  });

  it("does not allow message-only or visual-only readiness, or a partial final checklist", async () => {
    render(<SinglePostPage />);
    await recovered();
    let dialog = open("Edit Message", "Message editor");
    fireEvent.click(within(dialog).getByRole("button", { name: "Accept" }));
    dialog = open("Review Post", "Final review");
    for (const name of reviewChecks) fireEvent.click(within(dialog).getByRole("checkbox", { name }));
    expect((within(dialog).getByRole("button", { name: /Approve & Mark Ready/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(dialog).getByRole("button", { name: "Edit Visual" }));
    dialog = screen.getByRole("dialog", { name: "Visual editor" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Accept Visual" }));
    expect(screen.getByRole("button", { name: /Continue to Review/ })).toBeDefined();
    dialog = open("Review Post", "Final review");
    for (const name of reviewChecks.slice(0, 2)) fireEvent.click(within(dialog).getByRole("checkbox", { name }));
    expect((within(dialog).getByRole("button", { name: /Approve & Mark Ready/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Asset rights" }));
    expect((within(dialog).getByRole("button", { name: /Approve & Mark Ready/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("does not navigate or overwrite the saved Ready package if scheduling storage fails", async () => {
    render(<SinglePostPage />);
    await approve();
    const saved = localStorage.getItem(key);
    const dialog = open(/Continue to Schedule/, "Ready / Schedule");
    fireEvent.change(within(dialog).getByLabelText("Schedule date"), { target: { value: "2099-11-12" } });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    fireEvent.click(within(dialog).getByRole("button", { name: "Schedule Post" }));
    expect(router.push).not.toHaveBeenCalled();
    expect(localStorage.getItem(key)).toBe(saved);
    expect(readPocPostState()?.schedule).toBeNull();
    expect(within(dialog).getByRole("status").textContent).toContain("Unsaved local edits retained");
    expect(within(dialog).getByText("Schedule not saved")).toBeDefined();
    expect(screen.getByLabelText("Browser save status").textContent).toBe("Unsaved local edits");
  });

  it("retains work, does not claim Saved or navigate when browser storage fails", async () => {
    render(<SinglePostPage />);
    await recovered();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    let dialog = open("Edit Message", "Message editor");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Suggested caption" }), { target: { value: "Retain my unsaved work." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Accept" }));
    expect(within(dialog).getByRole("status").textContent).toContain("Could not save");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save & Return" }));
    expect(screen.getByRole("dialog", { name: "Message editor" })).toBe(dialog);
    expect(screen.getByLabelText("Browser save status").textContent).toBe("Unsaved local edits");
    expect(localStorage.getItem(key)).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Message editor" }));
    dialog = open("Edit Message", "Message editor");
    expect((within(dialog).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("Retain my unsaved work.");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not replace invalid restored state on Save Draft, acceptance or deliberate reload", async () => {
    const invalid = JSON.stringify({ ...createPocPostState(), approved: true });
    localStorage.setItem(key, invalid);
    render(<SinglePostPage />);
    await recovered();
    expect(localStorage.getItem(key)).toBe(invalid);
    expect(readPocPostState()).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
    const dialog = open("Edit Message", "Message editor");
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Suggested caption" }), { target: { value: "Retained local draft" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Accept" }));
    expect(localStorage.getItem(key)).toBe(invalid);
    fireEvent.click(within(dialog).getByRole("button", { name: "Reload Saved Post" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Discard Local Edits & Reload" }));
    expect(within(dialog).getByRole("status").textContent).toContain("Could not reload");
    expect((within(dialog).getByRole("textbox", { name: "Suggested caption" }) as HTMLTextAreaElement).value).toBe("Retained local draft");
    expect(localStorage.getItem(key)).toBe(invalid);
  });

  it("rejects a past slot in the chosen timezone", async () => {
    render(<SinglePostPage />);
    await approve();
    const dialog = open(/Continue to Schedule/, "Ready / Schedule");
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-06T10:00:00Z"));
    fireEvent.change(within(dialog).getByLabelText("Schedule date"), { target: { value: "2026-11-06" } });
    fireEvent.change(within(dialog).getByLabelText("Schedule time"), { target: { value: "10:30" } });
    fireEvent.change(within(dialog).getByLabelText("Schedule timezone"), { target: { value: "Europe/Berlin" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Schedule Post" }));
    expect(within(dialog).getByRole("status").textContent).toContain("valid future date and time in the selected timezone");
    expect(router.push).not.toHaveBeenCalled();
    expect(readPocPostState()?.schedule).toBeNull();
  });

  it("changes carousel format and slides and supports both sandbox themes", async () => {
    const { container } = render(<SandboxLayout><SinglePostPage /></SandboxLayout>);
    await recovered();
    const dialog = open("Review Post", "Final review");
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Preview aspect ratio" }), { target: { value: "portrait" } });
    expect(within(dialog).getByText("1080 × 1920")).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "Slide 2" }));
    expect(within(dialog).getByRole("img", { name: "Open mountain horizon" })).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Final review" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(container.firstElementChild?.classList.contains("dark")).toBe(true);
  });

  it("continues from the single-post workspace to Posts Gallery", () => {
    render(<SinglePostPage />);

    fireEvent.click(screen.getByRole("button", { name: /Open Posts Gallery/ }));
    expect(router.push).toHaveBeenCalledWith("/pocs/posts-gallery");
  });
});