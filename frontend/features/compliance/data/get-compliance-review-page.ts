import {
  mockComplianceChecks,
  mockComplianceReviewPageHeader,
} from "@/data/mock-compliance";
import { mockDraftStudioPage } from "@/data/mock-drafts";
import type { ComplianceCheck } from "@/types/compliance";
import type { ContentDraft } from "@/types/content";

export interface ComplianceReviewPageData {
  pageHeader: typeof mockComplianceReviewPageHeader;
  draft: ContentDraft;
  check: ComplianceCheck;
  relatedDrafts: readonly ContentDraft[];
}

export async function getComplianceReviewPage(
  draftId: string,
): Promise<ComplianceReviewPageData | null> {
  const draft = mockDraftStudioPage.drafts.find(
    (candidate) => candidate.id === draftId,
  );
  const check = mockComplianceChecks.find(
    (candidate) => candidate.draftId === draftId,
  );

  if (!draft || !check) return null;

  return {
    pageHeader: mockComplianceReviewPageHeader,
    draft,
    check,
    relatedDrafts: mockDraftStudioPage.drafts,
  };
}

export async function getDefaultComplianceDraftId(): Promise<string | null> {
  const reviewReadyDraft = mockDraftStudioPage.drafts.find(
    (draft) => draft.status === "in_review",
  );

  return reviewReadyDraft?.id ?? mockComplianceChecks[0]?.draftId ?? null;
}
