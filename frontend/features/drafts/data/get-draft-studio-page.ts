import {
  mockDraftStudioPage,
  type DraftStudioPageData,
} from "@/data/mock-drafts";
import {
  mockAiDraftSuggestionFixtures,
  mockAiFailureFixtures,
  mockAiGuidanceFixtures,
  type MockAiFailureFixture,
  type MockAiGuidanceFixture,
  type MockDraftSuggestionFixture,
} from "@/data/mock-ai-flow";

export type DraftStudioAiSimulationState =
  | "ready"
  | "loading"
  | "failure"
  | "empty";

export interface DraftStudioAiPanelData {
  state: DraftStudioAiSimulationState;
  guidance: Record<"ready" | "loading" | "failure", MockAiGuidanceFixture>;
  suggestions: readonly MockDraftSuggestionFixture[];
  failures: readonly MockAiFailureFixture[];
  disclaimer: string;
}

export interface DraftStudioViewData extends DraftStudioPageData {
  aiPanel: DraftStudioAiPanelData;
}

export async function getDraftStudioPage(): Promise<DraftStudioViewData> {
  return {
    ...mockDraftStudioPage,
    aiPanel: {
      state: "ready",
      guidance: mockAiGuidanceFixtures,
      suggestions: mockAiDraftSuggestionFixtures,
      failures: mockAiFailureFixtures,
      disclaimer:
        "Simulated AI preview only. Suggestions and checks shown here are mock fixtures and are not persisted.",
    },
  };
}
