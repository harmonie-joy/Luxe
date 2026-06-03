import {
  mockDraftStudioPage,
  type DraftStudioPageData,
} from "@/data/mock-drafts";

export async function getDraftStudioPage(): Promise<DraftStudioPageData> {
  return mockDraftStudioPage;
}
