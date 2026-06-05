import type { ComplianceCheck } from "@/types/compliance";

export interface ComplianceReviewPageCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export const mockComplianceReviewPageHeader = {
  eyebrow: "Compliance Review",
  title: "Resolve risk signals before approval.",
  description:
    "Review the current draft status, inspect category-specific issues, and decide whether the draft needs edits before it moves forward.",
} as const satisfies ComplianceReviewPageCopy;

export const mockComplianceChecks = [
  {
    id: "check-private-preview-newsletter-20260604",
    workspaceId: "workspace-the-luxe",
    draftId: "draft-private-preview-newsletter",
    status: "green",
    summary:
      "No blocking issues found. The draft keeps claims modest and uses invitation language that can be approved after a final editorial pass.",
    checkedAt: "2026-06-04T09:28:00.000Z",
    createdAt: "2026-06-04T09:28:00.000Z",
    updatedAt: "2026-06-04T09:28:00.000Z",
    issues: [
      {
        id: "issue-newsletter-consent-note",
        workspaceId: "workspace-the-luxe",
        checkId: "check-private-preview-newsletter-20260604",
        draftId: "draft-private-preview-newsletter",
        title: "Confirm opted-in recipient basis",
        category: "consent",
        severity: "low",
        explanation:
          "The message is suitable for an existing client list, but the draft should only be sent to recipients who opted in to brand communications.",
        suggestedFix:
          "Keep the audience limited to opted-in clients or add a preference-center note in the send workflow.",
        createdAt: "2026-06-04T09:28:00.000Z",
        updatedAt: "2026-06-04T09:28:00.000Z",
      },
    ],
  },
  {
    id: "check-private-preview-linkedin-20260604",
    workspaceId: "workspace-the-luxe",
    draftId: "draft-private-preview-linkedin",
    status: "yellow",
    summary:
      "The draft can likely move forward after edits. Review consent wording, soften exclusivity claims, and avoid implying protected design ownership without review.",
    checkedAt: "2026-06-04T09:42:00.000Z",
    createdAt: "2026-06-04T09:42:00.000Z",
    updatedAt: "2026-06-04T09:42:00.000Z",
    issues: [
      {
        id: "issue-linkedin-gdpr-selected-clients",
        workspaceId: "workspace-the-luxe",
        checkId: "check-private-preview-linkedin-20260604",
        draftId: "draft-private-preview-linkedin",
        title: "Avoid implying personal data selection criteria",
        category: "gdpr",
        severity: "medium",
        explanation:
          "The phrase selected clients may imply data-based targeting. Public copy should avoid suggesting specific personal data was used to identify invitees.",
        suggestedFix:
          "Use broader wording such as invited clients and partners, or keep selection criteria out of public-facing copy.",
        createdAt: "2026-06-04T09:42:00.000Z",
        updatedAt: "2026-06-04T09:42:00.000Z",
      },
      {
        id: "issue-linkedin-consent-private-preview",
        workspaceId: "workspace-the-luxe",
        checkId: "check-private-preview-linkedin-20260604",
        draftId: "draft-private-preview-linkedin",
        title: "Clarify invitation consent",
        category: "consent",
        severity: "medium",
        explanation:
          "The draft describes an invitation-led experience but does not clarify whether recipients are existing clients or opted-in prospects.",
        suggestedFix:
          "Frame the audience as opted-in clients and partners, or remove language that assumes prior relationship status.",
        createdAt: "2026-06-04T09:42:00.000Z",
        updatedAt: "2026-06-04T09:42:00.000Z",
      },
      {
        id: "issue-linkedin-ip-design-language",
        workspaceId: "workspace-the-luxe",
        checkId: "check-private-preview-linkedin-20260604",
        draftId: "draft-private-preview-linkedin",
        title: "Review design ownership implications",
        category: "ip",
        severity: "low",
        explanation:
          "References to defining details are acceptable, but avoid implying legal ownership of broad style elements unless the claim has been reviewed.",
        suggestedFix:
          "Keep the wording descriptive and focused on the brand's collection rather than ownership of general design traits.",
        createdAt: "2026-06-04T09:42:00.000Z",
        updatedAt: "2026-06-04T09:42:00.000Z",
      },
      {
        id: "issue-linkedin-claims-first-access",
        workspaceId: "workspace-the-luxe",
        checkId: "check-private-preview-linkedin-20260604",
        draftId: "draft-private-preview-linkedin",
        title: "Soften first-access claim",
        category: "claims",
        severity: "high",
        explanation:
          "The copy may imply guaranteed first access for all invited readers. This could overpromise availability if appointments or pieces are limited.",
        suggestedFix:
          "Replace first access framing with a private preview invitation and avoid guarantees about availability.",
        createdAt: "2026-06-04T09:42:00.000Z",
        updatedAt: "2026-06-04T09:42:00.000Z",
      },
    ],
  },
] as const satisfies readonly ComplianceCheck[];
