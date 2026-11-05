"use client";

import { useSyncExternalStore } from "react";

export interface PocIdea {
  id: string;
  text: string;
  status: "inbox" | "planned" | "drafting" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface PocGamePlan {
  ideaId: string | null;
  objective: string;
  audience: string;
  angle: string;
  format: string;
  nextAction: string;
  updatedAt: string;
}

export interface PocFeedback {
  postId: string;
  worthIt: "yes" | "partly" | "no";
  outcome: string;
  learning: string;
  updatedAt: string;
}

interface PocWorkspaceState {
  ideas: readonly PocIdea[];
  gamePlan: PocGamePlan | null;
  feedback: readonly PocFeedback[];
}

export const POC_WORKSPACE_STORAGE_KEY = "luxe-poc-workspace:v1";
const changeEvent = "luxe-poc-workspace-change";
const emptyState: PocWorkspaceState = { ideas: [], gamePlan: null, feedback: [] };
let cachedRaw: string | null = null;
let cachedState = emptyState;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function hasStrings(value: Record<string, unknown>, fields: string[]) {
  return fields.every((field) => typeof value[field] === "string");
}

function validState(value: unknown): value is PocWorkspaceState {
  if (!isRecord(value) || !Array.isArray(value.ideas) || !Array.isArray(value.feedback)) return false;
  if (!value.ideas.every((idea: unknown) => isRecord(idea)
    && hasStrings(idea, ["id", "text", "createdAt", "updatedAt"])
    && ["inbox", "planned", "drafting", "archived"].includes(String(idea.status)))) return false;
  if (!value.feedback.every((feedback: unknown) => isRecord(feedback)
    && hasStrings(feedback, ["postId", "outcome", "learning", "updatedAt"])
    && ["yes", "partly", "no"].includes(String(feedback.worthIt)))) return false;
  return value.gamePlan === null || (isRecord(value.gamePlan)
    && hasStrings(value.gamePlan, ["objective", "audience", "angle", "format", "nextAction", "updatedAt"])
    && (value.gamePlan.ideaId === null || typeof value.gamePlan.ideaId === "string"));
}

function getSnapshot(): PocWorkspaceState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(POC_WORKSPACE_STORAGE_KEY);
    if (raw === cachedRaw) return cachedState;
    cachedRaw = raw;
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cachedState = validState(parsed) ? parsed : emptyState;
  } catch {
    cachedState = emptyState;
    cachedRaw = null;
  }
  return cachedState;
}

function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

function writeState(state: PocWorkspaceState): boolean {
  try {
    window.localStorage.setItem(POC_WORKSPACE_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(changeEvent));
    return true;
  } catch {
    return false;
  }
}

export function usePocWorkspaceState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => emptyState);
}

export function capturePocIdea(text: string): string | null {
  if (!text.trim()) return null;
  const now = new Date().toISOString();
  const idea: PocIdea = { id: crypto.randomUUID(), text: text.trim(), status: "inbox", createdAt: now, updatedAt: now };
  const state = getSnapshot();
  return writeState({ ...state, ideas: [idea, ...state.ideas] }) ? idea.id : null;
}

export function updatePocIdea(id: string, status: PocIdea["status"]): boolean {
  const state = getSnapshot();
  if (!state.ideas.some((idea) => idea.id === id)) return false;
  return writeState({ ...state, ideas: state.ideas.map((idea) => idea.id === id
    ? { ...idea, status, updatedAt: new Date().toISOString() } : idea) });
}

export function savePocGamePlan(plan: PocGamePlan): boolean {
  const state = getSnapshot();
  return writeState({ ...state, gamePlan: plan, ideas: state.ideas.map((idea) => idea.id === plan.ideaId
    ? { ...idea, status: "planned", updatedAt: plan.updatedAt } : idea) });
}

export function savePocFeedback(feedback: PocFeedback): boolean {
  const state = getSnapshot();
  return writeState({ ...state, feedback: [feedback, ...state.feedback.filter((item) => item.postId !== feedback.postId)] });
}