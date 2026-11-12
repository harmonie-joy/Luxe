"use client";

import { useSyncExternalStore } from "react";

export interface StageFlowProfile {
  answers: readonly string[];
  tone: string;
  communicationStyle: string;
  completedSteps: readonly string[];
  dimensionSummaries: Readonly<Record<string, string>>;
}

const storageKey = "luxe-pocs-stage1-profile";
const updateEvent = "luxe-pocs-stage1-profile-change";

export const initialStageFlowProfile: StageFlowProfile = {
  answers: [],
  tone: "Warm and direct",
  communicationStyle: "",
  completedSteps: [],
  dimensionSummaries: {},
};

const initialSnapshot = JSON.stringify(initialStageFlowProfile);

function parseProfile(serialized: string | null): StageFlowProfile {
  try {
    if (!serialized) return initialStageFlowProfile;
    const parsed: unknown = JSON.parse(serialized);
    if (!parsed || typeof parsed !== "object") return initialStageFlowProfile;

    const profile = parsed as Partial<StageFlowProfile>;
    return {
      answers: Array.isArray(profile.answers)
        ? profile.answers.filter((answer): answer is string => typeof answer === "string")
        : [],
      tone: typeof profile.tone === "string" && profile.tone ? profile.tone : initialStageFlowProfile.tone,
      communicationStyle: typeof profile.communicationStyle === "string" ? profile.communicationStyle : "",
      completedSteps: Array.isArray(profile.completedSteps)
        ? profile.completedSteps.filter((step): step is string => typeof step === "string")
        : [],
      dimensionSummaries: profile.dimensionSummaries && typeof profile.dimensionSummaries === "object"
        ? Object.fromEntries(
          Object.entries(profile.dimensionSummaries).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        )
        : {},
    };
  } catch {
    return initialStageFlowProfile;
  }
}

export function readStageFlowProfile(): StageFlowProfile {
  try {
    return parseProfile(sessionStorage.getItem(storageKey));
  } catch {
    return initialStageFlowProfile;
  }
}

function getSnapshot(): string {
  try {
    return sessionStorage.getItem(storageKey) ?? initialSnapshot;
  } catch {
    return initialSnapshot;
  }
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(updateEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(updateEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useStageFlowProfile(): StageFlowProfile {
  const serialized = useSyncExternalStore(subscribe, getSnapshot, () => initialSnapshot);
  return parseProfile(serialized);
}

export function saveStageFlowProfile(profile: StageFlowProfile): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(profile));
    window.dispatchEvent(new Event(updateEvent));
  } catch {
    // Keep the current screen usable when browser storage is unavailable.
  }
}

export function completeStageFlowStep(step: string): void {
  const profile = readStageFlowProfile();
  if (profile.completedSteps.includes(step)) return;
  saveStageFlowProfile({ ...profile, completedSteps: [...profile.completedSteps, step] });
}