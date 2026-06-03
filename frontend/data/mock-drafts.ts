import type { ContentBrief, ContentDraft } from "@/types/content";

export interface DraftStudioPageCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface DraftStudioPageData {
  pageHeader: DraftStudioPageCopy;
  brief: ContentBrief;
  drafts: readonly ContentDraft[];
}

const workspaceId = "workspace-the-luxe";
const briefId = "brief-private-preview-event";

export const mockDraftStudioPage = {
  pageHeader: {
    eyebrow: "Draft Studio",
    title: "Refine each channel before review begins.",
    description:
      "Move between draft variants, tune the title and copy, and keep lifecycle status visible before the compliance queue takes over.",
  },
  brief: {
    id: briefId,
    workspaceId,
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
    createdAt: "2026-06-04T08:00:00.000Z",
    updatedAt: "2026-06-04T08:00:00.000Z",
  },
  drafts: [
    {
      id: "draft-private-preview-newsletter",
      workspaceId,
      briefId,
      title: "A Private First Look at the Autumn Couture Capsule",
      content:
        "You are invited to preview the autumn couture capsule in a private appointment before the wider editorial launch. The collection has been shaped around refined structure, tactile detail, and pieces intended to feel considered from first fitting to final wear.\n\nAppointments are limited to allow for a measured, one-to-one experience with the collection. Your client advisor can reserve a private viewing window and prepare selections aligned to your preferences.",
      channel: "newsletter",
      status: "draft",
      createdBy: "user-editor-mario",
      createdAt: "2026-06-04T08:10:00.000Z",
      updatedAt: "2026-06-04T09:15:00.000Z",
    },
    {
      id: "draft-private-preview-linkedin",
      workspaceId,
      briefId,
      title: "Private Preview: Autumn Couture Capsule",
      content:
        "Before the wider editorial launch, THE LUXE will host a private preview of the autumn couture capsule for selected clients and partners.\n\nThe appointment-led experience centers on craftsmanship, considered silhouettes, and the quieter details that define the collection. It is designed for clients who value personal context as much as first access.",
      channel: "linkedin",
      status: "in_review",
      createdBy: "user-editor-mario",
      createdAt: "2026-06-04T08:12:00.000Z",
      updatedAt: "2026-06-04T09:30:00.000Z",
    },
  ],
} as const satisfies DraftStudioPageData;
