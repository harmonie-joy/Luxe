import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSinglePostLoop } from "@/lib/mock-data/pocs-data";
import {
  createPocPostState, pocPostSignature, pocVisualSignature, readPocPostState, readPocPostStateResult,
  savePocPostState, savePocPostStateResult, usePocPostSnapshot, zonedScheduleInstant,
} from "@/lib/state/poc-post-state";

const key = `luxe-poc-single-post:${mockSinglePostLoop.id}`;

function approvedPost() {
  const post = createPocPostState();
  post.caption = post.versions[0].text;
  post.acceptedVersion = post.versions[0].id;
  post.visualApproved = true;
  post.visualApproval = pocVisualSignature(post);
  post.checks = ["Brand match", "Platform format", "Asset rights"];
  post.approved = true;
  post.approvedPackage = pocPostSignature(post);
  return post;
}

describe("Browser-local post snapshot contract", () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it("does not bootstrap a saved post, notifies readers on save and storage events", () => {
    function Reader() {
      const post = usePocPostSnapshot();
      return <output>{post?.caption ?? "No saved post"}</output>;
    }
    render(<Reader />);
    expect(screen.getByText("No saved post")).toBeDefined();
    expect(localStorage.getItem(key)).toBeNull();
    act(() => { expect(savePocPostState(approvedPost())).toBe(true); });
    expect(screen.getByRole("status").textContent).toBe(mockSinglePostLoop.versions[0].text);
    act(() => { localStorage.removeItem(key); window.dispatchEvent(new StorageEvent("storage", { key })); });
    expect(screen.getByText("No saved post")).toBeDefined();
  });

  it("rejects mismatched caption acceptance, visual approval and forged Ready or schedule", () => {
    const post = approvedPost();
    expect(savePocPostState(post)).toBe(true);
    expect(savePocPostState({ ...post, caption: "Unaccepted edit" })).toBe(false);
    expect(savePocPostState({ ...post, headline: "Unaccepted visual edit" })).toBe(false);
    expect(savePocPostState({ ...post, checks: [] })).toBe(false);
    expect(savePocPostState({ ...post, approved: false, schedule: mockSinglePostLoop.suggestedSlot })).toBe(false);
    expect(savePocPostState({ ...post, schedule: { date: "2000-01-01", time: "12:00", timezone: "UTC" } })).toBe(false);
    expect(readPocPostState()?.caption).toBe(post.caption);
    localStorage.setItem(key, JSON.stringify({ ...post, acceptedVersion: "missing-version" }));
    expect(readPocPostState()).toBeNull();
    localStorage.setItem(key, "{malformed");
    expect(readPocPostState()).toBeNull();
    localStorage.setItem(key, JSON.stringify({ ...post, schedule: { date: "2099-02-30", time: "12:00", timezone: "UTC" } }));
    expect(readPocPostState()).toBeNull();
  });

  it("retains an intact scheduled caption and assets and reports storage failure", () => {
    const post = { ...approvedPost(), schedule: { date: "2099-11-12", time: "10:00", timezone: "Europe/Berlin" } };
    expect(savePocPostState(post)).toBe(true);
    expect(readPocPostState()).toEqual(post);
    expect(readPocPostState()?.assets).toEqual(mockSinglePostLoop.slides);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    expect(savePocPostState({ ...post, schedule: null })).toBe(false);
    expect(readPocPostState()?.schedule).toEqual(post.schedule);
  });

  it("compares exact snapshots, including null before the first save, and returns the saved baseline", () => {
    const post = createPocPostState();
    expect(readPocPostStateResult()).toEqual({ status: "available", snapshot: null, post: null });
    const first = savePocPostStateResult(post, null);
    expect(first.status).toBe("saved");
    if (first.status !== "saved") throw new Error("Expected first save to succeed");
    expect(first.snapshot).toBe(localStorage.getItem(key));
    expect(first.post).toEqual(post);
    expect(savePocPostStateResult({ ...post, workingCaption: "Unaccepted edit" }, first.snapshot).status).toBe("saved");
    const newerBytes = localStorage.getItem(key);
    expect(savePocPostStateResult(post, first.snapshot)).toEqual({ status: "conflict" });
    expect(savePocPostState(post, null)).toBe(false);
    expect(localStorage.getItem(key)).toBe(newerBytes);
  });

  it.each(["visual", "deleted", "malformed", "invalid", "whitespace"])("blocks an expected snapshot when stored bytes become %s", (change) => {
    const post = createPocPostState();
    expect(savePocPostState(post)).toBe(true);
    const baseline = localStorage.getItem(key);
    if (change === "visual") expect(savePocPostState({ ...post, headline: "Newer visual" })).toBe(true);
    if (change === "deleted") localStorage.removeItem(key);
    if (change === "malformed") localStorage.setItem(key, "{malformed");
    if (change === "invalid") localStorage.setItem(key, JSON.stringify({ ...post, approved: true }));
    if (change === "whitespace") localStorage.setItem(key, `${baseline}\n`);
    const newerBytes = localStorage.getItem(key);
    expect(savePocPostStateResult(post, baseline)).toEqual({ status: "conflict" });
    expect(localStorage.getItem(key)).toBe(newerBytes);
  });

  it("never lets direct callers remove or rewrite stored versions, but permits intact appended history", () => {
    const baseline = createPocPostState();
    const version = { id: "caption-v4", label: "V4", text: "New accepted caption", createdAt: "2026-11-06T12:00:00Z" };
    const newer = { ...baseline, caption: version.text, acceptedVersion: version.id, versions: [...baseline.versions, version] };
    expect(savePocPostState(newer)).toBe(true);
    const newerBytes = localStorage.getItem(key);
    expect(savePocPostState(baseline)).toBe(false);
    for (const changed of [{ ...version, text: "Rewritten caption" }, { ...version, label: "Rewritten label" },
      { ...version, createdAt: "2026-11-06T13:00:00Z" }]) {
      expect(savePocPostStateResult({ ...baseline, versions: [...baseline.versions, changed] })).toEqual({ status: "conflict" });
      expect(localStorage.getItem(key)).toBe(newerBytes);
    }
    expect(savePocPostState({ ...newer, versions: [...newer.versions,
      { ...version, id: "caption-v5", label: "V5", text: "Another caption" }] })).toBe(true);
    expect(readPocPostState()?.versions.slice(0, newer.versions.length)).toEqual(newer.versions);
  });

  it("distinguishes unavailable storage and invalid packages without attempting a write", () => {
    const post = approvedPost();
    expect(savePocPostState(post)).toBe(true);
    const baseline = localStorage.getItem(key);
    const write = vi.spyOn(Storage.prototype, "setItem");
    const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage unreadable"); });
    expect(readPocPostStateResult()).toEqual({ status: "unavailable" });
    expect(savePocPostStateResult(post, baseline)).toEqual({ status: "unavailable" });
    expect(savePocPostState(post)).toBe(false);
    expect(write).not.toHaveBeenCalled();
    read.mockRestore();
    expect(localStorage.getItem(key)).toBe(baseline);
    expect(savePocPostStateResult({ ...post, checks: [] }, baseline)).toEqual({ status: "invalid" });
    expect(write).not.toHaveBeenCalled();
    localStorage.setItem(key, "{malformed");
    write.mockClear();
    expect(readPocPostStateResult()).toEqual({ status: "invalid" });
    expect(savePocPostStateResult(post)).toEqual({ status: "invalid" });
    expect(savePocPostState(post)).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(key)).toBe("{malformed");
  });

  it("converts the chosen timezone, rejects same-day past, invalid dates and DST gaps or overlaps", () => {
    const now = Date.parse("2026-11-06T10:00:00Z");
    expect(zonedScheduleInstant({ date: "2026-11-06", time: "12:00", timezone: "Europe/Berlin" }, now)).toBe(Date.parse("2026-11-06T11:00:00Z"));
    expect(zonedScheduleInstant({ date: "2026-11-06", time: "10:30", timezone: "Europe/Berlin" }, now)).toBeNull();
    expect(zonedScheduleInstant({ date: "2026-11-06", time: "06:00", timezone: "America/New_York" }, now)).toBe(Date.parse("2026-11-06T11:00:00Z"));
    for (const slot of [
      { date: "2099-02-30", time: "12:00", timezone: "UTC" },
      { date: "2099-11-12", time: "25:00", timezone: "UTC" },
      { date: "2099-11-12", time: "12:00", timezone: "Not/AZone" },
      { date: "2027-03-28", time: "02:30", timezone: "Europe/Berlin" },
      { date: "2027-10-31", time: "02:30", timezone: "Europe/Berlin" },
    ]) expect(zonedScheduleInstant(slot, now)).toBeNull();
  });
});