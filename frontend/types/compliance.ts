export type ComplianceStatus = "green" | "yellow" | "red";

export type ComplianceCategory = "gdpr" | "consent" | "ip" | "claims";

export type ComplianceSeverity = "low" | "medium" | "high";

export interface ComplianceIssue {
  id: string;
  workspaceId: string;
  checkId: string;
  draftId: string;
  title: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  explanation: string;
  suggestedFix: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceCheck {
  id: string;
  workspaceId: string;
  draftId: string;
  status: ComplianceStatus;
  summary: string;
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
  issues: readonly ComplianceIssue[];
}

export type ComplianceFinding = ComplianceIssue;
export type ComplianceReview = ComplianceCheck;
