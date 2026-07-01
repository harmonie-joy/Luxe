import {
  mockDraftStudioPage,
  type DraftStudioPageData,
} from "@/data/mock-drafts";

export type DraftStudioViewData = DraftStudioPageData;

export async function getDraftStudioPage(): Promise<DraftStudioViewData> {
  return mockDraftStudioPage;
}
