import { beforeEach, describe, expect, it } from "vitest";
import { readStageFlowProfile, saveStageFlowProfile } from "./stage-flow-state";

describe("Stage 1 profile state", () => {
  beforeEach(() => sessionStorage.clear());

  it("round-trips chat answers and tone in the current tab", () => {
    const profile = {
      answers: ["Feel seen", "A useful idea", "Warm and direct"],
      tone: "Warm and direct",
      communicationStyle: "Stories that make complex ideas clear",
      completedSteps: [],
      dimensionSummaries: {},
    };

    saveStageFlowProfile(profile);

    expect(readStageFlowProfile()).toEqual(profile);
  });

  it("falls back to empty answers and the sample tone when stored data is invalid", () => {
    sessionStorage.setItem("luxe-pocs-stage1-profile", "not-json");

    expect(readStageFlowProfile()).toEqual({ answers: [], tone: "Warm and direct", communicationStyle: "", completedSteps: [], dimensionSummaries: {} });
  });
});