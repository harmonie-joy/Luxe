import {
  mockCreateBriefPage,
  type CreateBriefPageData,
} from "@/data/mock-create-brief";

export async function getCreateBriefPage(): Promise<CreateBriefPageData> {
  return mockCreateBriefPage;
}
