import type { ContentDraft, ScheduledContent, DraftComment, AuditLog } from "@/types/content";
import type { ComplianceCheck } from "@/types/compliance";

export interface CalendarPageCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface CalendarPageData {
  pageHeader: CalendarPageCopy;
  scheduledContent: readonly ScheduledContent[];
  drafts: readonly ContentDraft[];
  complianceChecks: readonly ComplianceCheck[];
  comments: readonly DraftComment[];
  auditLogs: readonly AuditLog[];
}

const workspaceId = "workspace-the-luxe";
const briefId = "brief-autumn-calendar-plan";

export const mockCalendarPage = {
  pageHeader: {
    eyebrow: "Calendar",
    title: "Planned content by date and channel.",
    description:
      "Track approved drafts, scheduled placements, and published content from one planning view.",
  },
  scheduledContent: [
    {
      id: "scheduled-private-preview-newsletter",
      workspaceId,
      draftId: "draft-private-preview-newsletter",
      channel: "newsletter",
      status: "scheduled",
      scheduledFor: "2026-06-12T09:00:00.000Z",
      publishedAt: null,
      createdAt: "2026-06-05T08:30:00.000Z",
      updatedAt: "2026-06-05T08:30:00.000Z",
    },
    {
      id: "scheduled-private-preview-linkedin",
      workspaceId,
      draftId: "draft-private-preview-linkedin",
      channel: "linkedin",
      status: "approved",
      scheduledFor: "2026-06-12T14:00:00.000Z",
      publishedAt: null,
      createdAt: "2026-06-05T08:42:00.000Z",
      updatedAt: "2026-06-05T08:42:00.000Z",
    },
    {
      id: "scheduled-atelier-blog",
      workspaceId,
      draftId: "draft-atelier-blog",
      channel: "blog",
      status: "published",
      scheduledFor: "2026-06-14T10:30:00.000Z",
      publishedAt: "2026-06-14T10:35:00.000Z",
      createdAt: "2026-06-05T09:10:00.000Z",
      updatedAt: "2026-06-14T10:35:00.000Z",
    },
    {
      id: "scheduled-concierge-instagram",
      workspaceId,
      draftId: "draft-concierge-instagram",
      channel: "instagram",
      status: "scheduled",
      scheduledFor: "2026-06-15T16:00:00.000Z",
      publishedAt: null,
      createdAt: "2026-06-05T10:00:00.000Z",
      updatedAt: "2026-06-05T10:00:00.000Z",
    },
  ],
  drafts: [
    {
      id: "draft-private-preview-newsletter",
      workspaceId,
      briefId,
      title: "A Private First Look at the Autumn Couture Capsule",
      content:
        "You are invited to preview the autumn couture capsule in a private appointment before the wider editorial launch. The collection has been shaped around refined structure, tactile detail, and pieces intended to feel considered from first fitting to final wear.",
      channel: "newsletter",
      status: "scheduled",
      createdBy: "user-editor-mario",
      createdAt: "2026-06-04T08:10:00.000Z",
      updatedAt: "2026-06-05T08:30:00.000Z",
    },
    {
      id: "draft-private-preview-linkedin",
      workspaceId,
      briefId,
      title: "Private Preview: Autumn Couture Capsule",
      content:
        "THE LUXE will host a private preview of the autumn couture capsule for invited clients and partners. The appointment-led experience centers on craftsmanship, considered silhouettes, and the quieter details that define the collection.",
      channel: "linkedin",
      status: "approved",
      createdBy: "user-editor-mario",
      createdAt: "2026-06-04T08:12:00.000Z",
      updatedAt: "2026-06-05T08:42:00.000Z",
    },
    {
      id: "draft-atelier-blog",
      workspaceId,
      briefId: "brief-atelier-notes",
      title: "Atelier Notes: The Shape of Quiet Structure",
      content:
        "This atelier note traces the collection's structured silhouettes through material choice, private fittings, and the restraint that gives each piece its sense of permanence.",
      channel: "blog",
      status: "published",
      createdBy: "user-editor-mario",
      createdAt: "2026-06-02T11:00:00.000Z",
      updatedAt: "2026-06-14T10:35:00.000Z",
    },
    {
      id: "draft-concierge-instagram",
      workspaceId,
      briefId: "brief-concierge-reminder",
      title: "Concierge Appointment Reminder",
      content:
        "A quiet reminder that private appointments for the autumn capsule are now being arranged through client advisors.",
      channel: "instagram",
      status: "scheduled",
      createdBy: "user-editor-mario",
      createdAt: "2026-06-03T13:20:00.000Z",
      updatedAt: "2026-06-05T10:00:00.000Z",
    },
  ],
  complianceChecks: [
    {
      id: "check-private-preview-newsletter-20260604",
      workspaceId,
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
          workspaceId,
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
      workspaceId,
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
          workspaceId,
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
      ],
    },
    {
      id: "check-atelier-blog-20260605",
      workspaceId,
      draftId: "draft-atelier-blog",
      status: "green",
      summary: "Compliant content. Appropriate for blog publication.",
      checkedAt: "2026-06-05T09:00:00.000Z",
      createdAt: "2026-06-05T09:00:00.000Z",
      updatedAt: "2026-06-05T09:00:00.000Z",
      issues: [],
    },
    {
      id: "check-concierge-instagram-20260605",
      workspaceId,
      draftId: "draft-concierge-instagram",
      status: "green",
      summary: "Compliant short-form caption. Suitable for Instagram.",
      checkedAt: "2026-06-05T09:30:00.000Z",
      createdAt: "2026-06-05T09:30:00.000Z",
      updatedAt: "2026-06-05T09:30:00.000Z",
      issues: [],
    },
  ],
  comments: [
    {
      id: "comment-calendar-01",
      draftId: "draft-private-preview-newsletter",
      authorName: "Sarah Connor",
      authorInitials: "SC",
      body: "Please ensure the GDPR preference center link is included in the email footer before sending.",
      createdAt: "2026-06-04T10:15:00.000Z",
    },
    {
      id: "comment-calendar-02",
      draftId: "draft-private-preview-newsletter",
      authorName: "Mario Salamanca",
      authorInitials: "MS",
      body: "Preference center is configured. Re-verified opted-in basis.",
      createdAt: "2026-06-04T11:20:00.000Z",
    },
    {
      id: "comment-calendar-03",
      draftId: "draft-private-preview-linkedin",
      authorName: "Sarah Connor",
      authorInitials: "SC",
      body: "The exclusivity claim ('first access') should be softened for LinkedIn as this is a public network.",
      createdAt: "2026-06-04T10:30:00.000Z",
    },
    {
      id: "comment-calendar-04",
      draftId: "draft-private-preview-linkedin",
      authorName: "Mario Salamanca",
      authorInitials: "MS",
      body: "Softened the phrasing to focus on the preview invitation itself rather than guaranteed access.",
      createdAt: "2026-06-04T12:00:00.000Z",
    },
    {
      id: "comment-calendar-05",
      draftId: "draft-atelier-blog",
      authorName: "Sarah Connor",
      authorInitials: "SC",
      body: "Beautiful tone. No edits needed from legal.",
      createdAt: "2026-06-04T14:15:00.000Z",
    },
  ],
  auditLogs: [
    {
      id: "audit-01",
      workspaceId,
      action: "draft_created",
      targetType: "content_draft",
      targetId: "draft-private-preview-newsletter",
      description: "Mario Salamanca created draft variant for newsletter channel",
      createdAt: "2026-06-04T08:10:00.000Z",
    },
    {
      id: "audit-02",
      workspaceId,
      action: "draft_created",
      targetType: "content_draft",
      targetId: "draft-private-preview-linkedin",
      description: "Mario Salamanca created draft variant for linkedin channel",
      createdAt: "2026-06-04T08:12:00.000Z",
    },
    {
      id: "audit-03",
      workspaceId,
      action: "compliance_checked",
      targetType: "content_draft",
      targetId: "draft-private-preview-newsletter",
      description: "Compliance check status evaluated: GREEN (1 low risk issue)",
      createdAt: "2026-06-04T09:28:00.000Z",
    },
    {
      id: "audit-04",
      workspaceId,
      action: "compliance_checked",
      targetType: "content_draft",
      targetId: "draft-private-preview-linkedin",
      description: "Compliance check status evaluated: YELLOW (4 issues flagged)",
      createdAt: "2026-06-04T09:42:00.000Z",
    },
    {
      id: "audit-05",
      workspaceId,
      action: "status_changed",
      targetType: "content_draft",
      targetId: "draft-private-preview-newsletter",
      description: "Mario Salamanca changed status to: SCHEDULED",
      createdAt: "2026-06-05T08:30:00.000Z",
    },
    {
      id: "audit-06",
      workspaceId,
      action: "status_changed",
      targetType: "content_draft",
      targetId: "draft-private-preview-linkedin",
      description: "Sarah Connor approved draft and changed status to: APPROVED",
      createdAt: "2026-06-05T08:42:00.000Z",
    },
    {
      id: "audit-07",
      workspaceId,
      action: "draft_created",
      targetType: "content_draft",
      targetId: "draft-atelier-blog",
      description: "Mario Salamanca created draft variant for blog channel",
      createdAt: "2026-06-02T11:00:00.000Z",
    },
    {
      id: "audit-08",
      workspaceId,
      action: "published",
      targetType: "scheduled_content",
      targetId: "scheduled-atelier-blog",
      description: "Scheduled content published to blog channel",
      createdAt: "2026-06-14T10:35:00.000Z",
    },
  ],
} as const satisfies CalendarPageData;
