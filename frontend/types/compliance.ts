export type ComplianceStatus = "green" | "yellow" | "red";

export type ComplianceCategory = "gdpr" | "consent" | "ip" | "claims";

export type ComplianceSeverity = "low" | "medium" | "high";

export interface ComplianceIssue {
  id: string;
  title: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  summary: string;
  suggestedFix?: string;
}

export interface ComplianceCheck {
  id: string;
  draftId: string;
  status: ComplianceStatus;
  issues: readonly ComplianceIssue[];
  checkedAt?: string;
}

export type ComplianceFinding = ComplianceIssue;
export type ComplianceReview = ComplianceCheck;
