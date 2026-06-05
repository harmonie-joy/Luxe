import type { ComplianceCategory, ComplianceStatus } from "@/types/compliance";
import type { AuditLog, CampaignGoal, ContentChannel } from "@/types/content";

export type MockAiTaskStatus = "loading" | "ready" | "failure";

export type MockAiFailureCode =
  | "guidance_timeout"
  | "no_suggestions_returned"
  | "compliance_mock_unavailable";

export interface MockWorkspaceValidationState {
  id: string;
  workspaceId: string | null;
  selectedBrandProfileId: string | null;
  state: "selected" | "none_selected" | "no_brand_profiles" | "profile_mismatch";
  message: string;
}

export interface MockBriefInputState {
  id: string;
  workspaceId: string;
  brandProfileId: string | null;
  contentObjective: string;
  campaignGoal: CampaignGoal | null;
  audience: string;
  angle: string;
  constraints: string;
  targetChannels: readonly ContentChannel[];
  validationErrors: readonly string[];
}

export interface MockAiGuidanceFixture {
  id: string;
  workspaceId: string;
  briefId: string;
  status: MockAiTaskStatus;
  summary: string | null;
  strengths: readonly string[];
  gaps: readonly string[];
  nextAction: string | null;
  generatedAt: string;
}

export interface MockDraftSuggestionFixture {
  id: string;
  workspaceId: string;
  briefId: string;
  draftId: string;
  channel: ContentChannel;
  title: string;
  content: string;
  rationale: string;
  fitNotes: readonly string[];
  state: "suggested" | "applied" | "discarded";
  generatedAt: string;
}

export interface MockAiFailureFixture {
  id: string;
  workspaceId: string;
  briefId: string;
  draftId: string | null;
  stage: "brief_guidance" | "draft_generation" | "compliance_review";
  code: MockAiFailureCode;
  title: string;
  message: string;
  retryLabel: string;
  occurredAt: string;
}

export interface MockComplianceScenarioFixture {
  id: string;
  workspaceId: string;
  draftId: string;
  checkId: string;
  status: ComplianceStatus;
  summary: string;
  issueCategories: readonly ComplianceCategory[];
  hasSuggestedFixes: boolean;
  checkedAt: string;
}

export interface MockComplianceFixSuggestionFixture {
  id: string;
  workspaceId: string;
  checkId: string;
  draftId: string;
  issueId: string;
  category: ComplianceCategory;
  state: "available" | "missing";
  suggestedFix: string | null;
  suggestedReplacement: string | null;
  generatedAt: string;
}

export const mockAiWorkspaceValidationStates = [
  {
    id: "workspace-state-selected",
    workspaceId: "workspace-the-luxe",
    selectedBrandProfileId: "private-client-services",
    state: "selected",
    message: "Workspace and brand profile are aligned for the current brief.",
  },
  {
    id: "workspace-state-none-selected",
    workspaceId: null,
    selectedBrandProfileId: null,
    state: "none_selected",
    message: "Select a workspace to continue with AI guidance and draft generation.",
  },
  {
    id: "workspace-state-no-brand-profiles",
    workspaceId: "workspace-editorial",
    selectedBrandProfileId: null,
    state: "no_brand_profiles",
    message: "No brand profiles are available in this workspace yet.",
  },
  {
    id: "workspace-state-profile-mismatch",
    workspaceId: "workspace-editorial",
    selectedBrandProfileId: "private-client-services",
    state: "profile_mismatch",
    message:
      "The selected brand profile belongs to a different workspace. Pick a matching profile.",
  },
] as const satisfies readonly MockWorkspaceValidationState[];

export const mockAiBriefInputStates = [
  {
    id: "brief-state-complete-multi-channel",
    workspaceId: "workspace-the-luxe",
    brandProfileId: "private-client-services",
    contentObjective:
      "Invite top-tier clients to a private preview of the autumn couture capsule before the wider editorial launch.",
    campaignGoal: "announce",
    audience:
      "Existing VIP clients and concierge-level prospects who respond to invitation-led luxury experiences.",
    angle:
      "Frame the preview as a considered first look, centered on rarity, craftsmanship, and private access.",
    constraints:
      "Avoid discount language, urgency framing, and any guarantee of availability. Keep tone discreet and assured.",
    targetChannels: ["newsletter", "linkedin"],
    validationErrors: [],
  },
  {
    id: "brief-state-missing-required-fields",
    workspaceId: "workspace-the-luxe",
    brandProfileId: null,
    contentObjective: "",
    campaignGoal: null,
    audience: "",
    angle: "",
    constraints: "",
    targetChannels: [],
    validationErrors: [
      "Select a brand profile.",
      "Add a content objective.",
      "Select a campaign goal.",
      "Add an audience.",
      "Select at least one channel.",
    ],
  },
  {
    id: "brief-state-single-channel",
    workspaceId: "workspace-the-luxe",
    brandProfileId: "private-client-services",
    contentObjective:
      "Share the private preview invitation with existing clients in one direct channel.",
    campaignGoal: "announce",
    audience: "Existing opted-in clients.",
    angle: "Lead with private appointment context and craftsmanship.",
    constraints: "Avoid availability guarantees.",
    targetChannels: ["newsletter"],
    validationErrors: [],
  },
] as const satisfies readonly MockBriefInputState[];

export const mockAiGuidanceFixtures = {
  loading: {
    id: "ai-guidance-private-preview-loading",
    workspaceId: "workspace-the-luxe",
    briefId: "brief-private-preview-event",
    status: "loading",
    summary: null,
    strengths: [],
    gaps: [],
    nextAction: null,
    generatedAt: "2026-06-05T09:58:00.000Z",
  },
  ready: {
    id: "ai-guidance-private-preview",
    workspaceId: "workspace-the-luxe",
    briefId: "brief-private-preview-event",
    status: "ready",
    summary:
      "Strong objective and audience fit. Add consent context before review.",
    strengths: [
      "Clear private-preview objective",
      "Audience and tone are aligned to the selected brand profile",
    ],
    gaps: ["Recipient consent basis", "Availability wording"],
    nextAction: "Generate newsletter and LinkedIn drafts",
    generatedAt: "2026-06-05T10:00:00.000Z",
  },
  failure: {
    id: "ai-guidance-private-preview-failure",
    workspaceId: "workspace-the-luxe",
    briefId: "brief-private-preview-event",
    status: "failure",
    summary: null,
    strengths: [],
    gaps: ["Guidance output unavailable"],
    nextAction: "Retry guidance generation",
    generatedAt: "2026-06-05T10:01:00.000Z",
  },
} as const satisfies Record<"loading" | "ready" | "failure", MockAiGuidanceFixture>;

export const mockAiDraftSuggestionFixtures = [
  {
    id: "suggestion-linkedin-private-preview-01",
    workspaceId: "workspace-the-luxe",
    briefId: "brief-private-preview-event",
    draftId: "draft-private-preview-linkedin",
    channel: "linkedin",
    title: "Private Preview: Autumn Couture Capsule",
    content:
      "THE LUXE will host a private preview of the autumn couture capsule for invited clients and partners, centered on craftsmanship, considered silhouettes, and a discreet appointment-led experience.",
    rationale: "Keeps the tone invitation-led and avoids discount language.",
    fitNotes: [
      "Aligns with the private-client-services profile",
      "Maintains public-network-safe wording",
    ],
    state: "suggested",
    generatedAt: "2026-06-05T10:02:00.000Z",
  },
  {
    id: "suggestion-linkedin-private-preview-02",
    workspaceId: "workspace-the-luxe",
    briefId: "brief-private-preview-event",
    draftId: "draft-private-preview-linkedin",
    channel: "linkedin",
    title: "Invitation-Led Autumn Capsule Preview",
    content:
      "Ahead of the wider editorial launch, invited clients and partners can preview the autumn couture capsule through private appointments designed to provide measured, one-to-one context.",
    rationale: "Softens exclusivity language and reduces claim risk.",
    fitNotes: [
      "Stronger compliance posture for public copy",
      "Matches concise LinkedIn length",
    ],
    state: "suggested",
    generatedAt: "2026-06-05T10:02:30.000Z",
  },
  {
    id: "suggestion-newsletter-private-preview-01",
    workspaceId: "workspace-the-luxe",
    briefId: "brief-private-preview-event",
    draftId: "draft-private-preview-newsletter",
    channel: "newsletter",
    title: "Your Private First Look",
    content:
      "You are invited to a private preview of the autumn couture capsule before the wider editorial release, with appointments prepared around your preferences and advisor guidance.",
    rationale: "Supports the concierge-led tone expected in client email.",
    fitNotes: [
      "Directly usable for newsletter variant testing",
      "Preserves discretion and brand positioning",
    ],
    state: "suggested",
    generatedAt: "2026-06-05T10:03:00.000Z",
  },
] as const satisfies readonly MockDraftSuggestionFixture[];

export const mockAiFailureFixtures = [
  {
    id: "ai-failure-guidance-timeout",
    workspaceId: "workspace-the-luxe",
    briefId: "brief-private-preview-event",
    draftId: null,
    stage: "brief_guidance",
    code: "guidance_timeout",
    title: "Guidance timed out",
    message:
      "AI guidance could not be prepared in time. You can continue manually or retry.",
    retryLabel: "Retry guidance",
    occurredAt: "2026-06-05T10:04:00.000Z",
  },
  {
    id: "ai-failure-no-suggestions",
    workspaceId: "workspace-the-luxe",
    briefId: "brief-private-preview-event",
    draftId: "draft-private-preview-linkedin",
    stage: "draft_generation",
    code: "no_suggestions_returned",
    title: "No suggestions returned",
    message:
      "No draft suggestions were returned for this channel. Keep editing the current draft or retry.",
    retryLabel: "Generate suggestions again",
    occurredAt: "2026-06-05T10:05:00.000Z",
  },
  {
    id: "ai-failure-compliance-unavailable",
    workspaceId: "workspace-the-luxe",
    briefId: "brief-private-preview-event",
    draftId: "draft-private-preview-linkedin",
    stage: "compliance_review",
    code: "compliance_mock_unavailable",
    title: "Compliance mock unavailable",
    message:
      "The simulated compliance service is unavailable. Keep the draft in review and retry.",
    retryLabel: "Retry compliance check",
    occurredAt: "2026-06-05T10:06:00.000Z",
  },
] as const satisfies readonly MockAiFailureFixture[];

export const mockComplianceScenarioFixtures = [
  {
    id: "compliance-scenario-green-newsletter",
    workspaceId: "workspace-the-luxe",
    draftId: "draft-private-preview-newsletter",
    checkId: "check-private-preview-newsletter-20260604",
    status: "green",
    summary: "No blockers found. Final editorial pass recommended.",
    issueCategories: ["consent"],
    hasSuggestedFixes: true,
    checkedAt: "2026-06-04T09:28:00.000Z",
  },
  {
    id: "compliance-scenario-yellow-linkedin",
    workspaceId: "workspace-the-luxe",
    draftId: "draft-private-preview-linkedin",
    checkId: "check-private-preview-linkedin-20260604",
    status: "yellow",
    summary: "Review required before approval-ready state.",
    issueCategories: ["gdpr", "consent", "ip", "claims"],
    hasSuggestedFixes: true,
    checkedAt: "2026-06-04T09:42:00.000Z",
  },
  {
    id: "compliance-scenario-red-linkedin",
    workspaceId: "workspace-the-luxe",
    draftId: "draft-private-preview-linkedin",
    checkId: "check-private-preview-linkedin-20260604",
    status: "red",
    summary: "Blocked pending claim and consent wording updates.",
    issueCategories: ["claims", "consent"],
    hasSuggestedFixes: false,
    checkedAt: "2026-06-05T10:07:00.000Z",
  },
] as const satisfies readonly MockComplianceScenarioFixture[];

export const mockComplianceFixSuggestionFixtures = [
  {
    id: "fix-suggestion-linkedin-claims",
    workspaceId: "workspace-the-luxe",
    checkId: "check-private-preview-linkedin-20260604",
    draftId: "draft-private-preview-linkedin",
    issueId: "issue-linkedin-claims-first-access",
    category: "claims",
    state: "available",
    suggestedFix:
      "Replace first access framing with a private preview invitation and avoid guarantees about availability.",
    suggestedReplacement:
      "THE LUXE will host a private preview of the autumn couture capsule for invited clients and partners.",
    generatedAt: "2026-06-05T10:08:00.000Z",
  },
  {
    id: "fix-suggestion-linkedin-ip",
    workspaceId: "workspace-the-luxe",
    checkId: "check-private-preview-linkedin-20260604",
    draftId: "draft-private-preview-linkedin",
    issueId: "issue-linkedin-ip-design-language",
    category: "ip",
    state: "available",
    suggestedFix:
      "Keep the wording descriptive and focused on the brand's collection rather than ownership of general design traits.",
    suggestedReplacement:
      "The collection emphasizes considered silhouettes and quiet detailing shaped for private appointments.",
    generatedAt: "2026-06-05T10:08:30.000Z",
  },
  {
    id: "fix-suggestion-newsletter-consent-missing",
    workspaceId: "workspace-the-luxe",
    checkId: "check-private-preview-newsletter-20260604",
    draftId: "draft-private-preview-newsletter",
    issueId: "issue-newsletter-consent-note",
    category: "consent",
    state: "missing",
    suggestedFix: null,
    suggestedReplacement: null,
    generatedAt: "2026-06-05T10:09:00.000Z",
  },
] as const satisfies readonly MockComplianceFixSuggestionFixture[];

export const mockApprovalAuditPreviewFixtures = [
  {
    id: "audit-preview-draft-approval-ready",
    workspaceId: "workspace-the-luxe",
    userId: "user-editor-mario",
    action: "draft.approval_ready",
    targetType: "content_draft",
    targetId: "draft-private-preview-linkedin",
    description:
      "Draft marked ready for approval after mock compliance review.",
    createdAt: "2026-06-05T10:00:00.000Z",
  },
  {
    id: "audit-preview-draft-approved",
    workspaceId: "workspace-the-luxe",
    userId: "user-sarah-connor",
    action: "draft.approved",
    targetType: "content_draft",
    targetId: "draft-private-preview-linkedin",
    description: "Draft approved in mock-only validation flow.",
    createdAt: "2026-06-05T10:11:00.000Z",
  },
] as const satisfies readonly AuditLog[];

export const mockAiFlowFixtures = {
  workspaceStates: mockAiWorkspaceValidationStates,
  briefStates: mockAiBriefInputStates,
  guidance: mockAiGuidanceFixtures,
  suggestions: mockAiDraftSuggestionFixtures,
  failures: mockAiFailureFixtures,
  complianceScenarios: mockComplianceScenarioFixtures,
  complianceFixSuggestions: mockComplianceFixSuggestionFixtures,
  approvalAuditPreview: mockApprovalAuditPreviewFixtures,
} as const;
