"use client";

import { useSyncExternalStore } from "react";
import { mockSinglePostLoop, type SinglePostLoopData, type SinglePostVersion } from "@/lib/mock-data/pocs-data";

export const POC_POST_CHECKS = ["Brand match", "Platform format", "Asset rights"];
const storageKey = `luxe-poc-single-post:${mockSinglePostLoop.id}`;
const changeEvent = "luxe-poc-single-post:changed";

export interface PocPostState {
  caption: string;
  versions: SinglePostVersion[];
  acceptedVersion: string | null;
  headline: string;
  template: string;
  layers: string[];
  visualApproved: boolean;
  checks: string[];
  approved: boolean;
  schedule: { date: string; time: string; timezone: string } | null;
  assets: SinglePostLoopData["slides"];
  format: "square" | "portrait";
  visualApproval: string | null;
  approvedPackage: string | null;
  workingCaption?: string;
}

export function createPocPostState(): PocPostState {
  return {
    caption: mockSinglePostLoop.original, versions: mockSinglePostLoop.versions.map((version) => ({ ...version })),
    acceptedVersion: null, headline: mockSinglePostLoop.slides[0].headline,
    template: mockSinglePostLoop.templates[0], layers: [...mockSinglePostLoop.layers],
    visualApproved: false, checks: [], approved: false, schedule: null,
    assets: mockSinglePostLoop.slides.map((asset) => ({ ...asset })), format: "square",
    visualApproval: null, approvedPackage: null,
  };
}

export function pocVisualSignature(post: PocPostState): string {
  return JSON.stringify([post.headline, post.template, post.layers, post.format, post.assets]);
}

export function pocPostSignature(post: PocPostState): string {
  return JSON.stringify([post.caption, post.acceptedVersion, pocVisualSignature(post)]);
}

export function hasAcceptedPocCaption(post: PocPostState): boolean {
  return !!post.caption.trim() && post.versions.some((version) => version.id === post.acceptedVersion && version.text === post.caption);
}

export function canApprovePocPost(post: PocPostState): boolean {
  return hasAcceptedPocCaption(post) && post.visualApproved && !!post.headline.trim()
    && post.visualApproval === pocVisualSignature(post) && POC_POST_CHECKS.every((check) => post.checks.includes(check));
}

export function zonedScheduleInstant(slot: NonNullable<PocPostState["schedule"]>, now = Date.now()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time)) return null;
  const wallTime = Date.parse(`${slot.date}T${slot.time}:00Z`);
  if (!Number.isFinite(wallTime) || new Date(wallTime).toISOString().slice(0, 16) !== `${slot.date}T${slot.time}`) return null;
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: slot.timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    const asWallTime = (instant: number) => {
      const parts = Object.fromEntries(formatter.formatToParts(instant).map((part) => [part.type, part.value]));
      return Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
    };
    const offsets = new Set<number>();
    for (let hours = -36; hours <= 36; hours += 6) {
      const sample = wallTime + hours * 3_600_000;
      offsets.add(asWallTime(sample) - sample);
    }
    const matches = [...offsets].map((offset) => wallTime - offset).filter((instant) => asWallTime(instant) === wallTime);
    return matches.length === 1 && matches[0] > now ? matches[0] : null;
  } catch { return null; }
}

export function validatePocPostState(value: unknown): PocPostState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as PocPostState;
  const allowed = (items: unknown, choices: readonly string[]): items is string[] => Array.isArray(items)
    && items.every((item) => typeof item === "string" && choices.includes(item)) && new Set(items).size === items.length;
  if (typeof candidate.caption !== "string" || typeof candidate.headline !== "string"
    || (candidate.workingCaption !== undefined && typeof candidate.workingCaption !== "string")
    || !mockSinglePostLoop.templates.includes(candidate.template) || !allowed(candidate.layers, mockSinglePostLoop.layers)
    || !allowed(candidate.checks, POC_POST_CHECKS) || !Array.isArray(candidate.versions)
    || !candidate.versions.every((version) => version && typeof version.id === "string" && !!version.id
      && typeof version.label === "string" && typeof version.text === "string"
      && typeof version.createdAt === "string" && Number.isFinite(Date.parse(version.createdAt)))
    || new Set(candidate.versions.map((version) => version.id)).size !== candidate.versions.length
    || !mockSinglePostLoop.versions.every((original) => candidate.versions.some((version) => version.id === original.id
      && version.text === original.text && version.label === original.label && version.createdAt === original.createdAt))
    || !(candidate.acceptedVersion === null || typeof candidate.acceptedVersion === "string")
    || typeof candidate.visualApproved !== "boolean" || typeof candidate.approved !== "boolean") return null;
  const post: PocPostState = {
    ...candidate, assets: candidate.assets ?? mockSinglePostLoop.slides,
    format: candidate.format ?? "square", visualApproval: candidate.visualApproval ?? null,
    approvedPackage: candidate.approvedPackage ?? null,
  };
  if (JSON.stringify(post.assets) !== JSON.stringify(mockSinglePostLoop.slides)
    || !["square", "portrait"].includes(post.format)
    || (post.acceptedVersion !== null && !hasAcceptedPocCaption(post))
    || (post.visualApproved ? !post.headline.trim() || post.visualApproval !== pocVisualSignature(post) : post.visualApproval !== null)
    || (post.approved ? !canApprovePocPost(post) || post.approvedPackage !== pocPostSignature(post) : post.approvedPackage !== null)) return null;
  if (post.schedule !== null && (!post.approved || typeof post.schedule !== "object"
    || typeof post.schedule.date !== "string" || typeof post.schedule.time !== "string" || typeof post.schedule.timezone !== "string"
    || zonedScheduleInstant(post.schedule, -Infinity) === null)) return null;
  return post;
}

let cachedRaw: string | null | undefined;
let cachedPost: PocPostState | null = null;

export type PocPostReadResult =
  | { status: "available"; snapshot: string | null; post: PocPostState | null }
  | { status: "invalid" }
  | { status: "unavailable" };

export type PocPostSaveResult =
  | { status: "saved"; snapshot: string; post: PocPostState }
  | { status: "conflict" | "unavailable" | "invalid" };

export function readPocPostStateResult(): PocPostReadResult {
  if (typeof window === "undefined") return { status: "unavailable" };
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedPost = null;
      if (raw !== null) {
        try { cachedPost = validatePocPostState(JSON.parse(raw)); }
        catch { return { status: "invalid" }; }
      }
    }
    if (raw !== null && !cachedPost) return { status: "invalid" };
    return { status: "available", snapshot: raw, post: cachedPost };
  } catch { cachedRaw = undefined; cachedPost = null; return { status: "unavailable" }; }
}

export function readPocPostState(): PocPostState | null {
  const result = readPocPostStateResult();
  return result.status === "available" ? result.post : null;
}

export function savePocPostStateResult(post: PocPostState, expectedSnapshot?: string | null): PocPostSaveResult {
  try {
    const stored = readPocPostStateResult();
    if (stored.status === "unavailable") return { status: "unavailable" };
    if (stored.status === "invalid") return { status: expectedSnapshot === undefined ? "invalid" : "conflict" };
    if (expectedSnapshot !== undefined && stored.snapshot !== expectedSnapshot) return { status: "conflict" };
    const validated = validatePocPostState(post);
    if (!validated) return { status: "invalid" };
    if (stored.post && !stored.post.versions.every((previous) => validated.versions.some((version) => version.id === previous.id
      && version.text === previous.text && version.label === previous.label && version.createdAt === previous.createdAt))) {
      return { status: "conflict" };
    }
    if (validated.schedule && JSON.stringify(validated.schedule) !== JSON.stringify(stored.post?.schedule)
      && zonedScheduleInstant(validated.schedule) === null) return { status: "invalid" };
    const snapshot = JSON.stringify(validated);
    window.localStorage.setItem(storageKey, snapshot);
    window.dispatchEvent(new Event(changeEvent));
    return { status: "saved", snapshot, post: validated };
  } catch { return { status: "unavailable" }; }
}

export function savePocPostState(post: PocPostState, expectedSnapshot?: string | null): boolean {
  return savePocPostStateResult(post, expectedSnapshot).status === "saved";
}

function subscribe(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) listener(); };
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(changeEvent, listener); window.removeEventListener("storage", onStorage); };
}

export function usePocPostSnapshot(): PocPostState | null {
  return useSyncExternalStore(subscribe, readPocPostState, () => null);
}