export type ComplianceSeverity = "success" | "warning" | "danger" | "info";

export type ComplianceReviewStatus =
  | "safeToPublish"
  | "needsReview"
  | "blocked";

export interface ComplianceFinding {
  id: string;
  title: string;
  category: string;
  severity: ComplianceSeverity;
  summary: string;
  suggestedFix?: string;
}

export interface ComplianceReview {
  id: string;
  draftId: string;
  status: ComplianceReviewStatus;
  findings: readonly ComplianceFinding[];
  reviewedAt?: string;
}
