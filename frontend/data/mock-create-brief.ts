import type { BrandProfile } from "@/types/brand-profile";

import { baseVoiceDnaProfileFields } from "./mock-brand-profiles";
import type {
  CampaignGoal,
  ContentBrief,
  ContentChannel,
} from "@/types/content";

export interface CreateBriefPageCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface CreateBriefSelectableOption<TValue extends string> {
  value: TValue;
  label: string;
  description: string;
  selected: boolean;
}

export interface CreateBriefWorkspaceOption {
  id: string;
  name: string;
  selected: boolean;
}

export interface CreateBriefPageData {
  pageHeader: CreateBriefPageCopy;
  workspaces: readonly CreateBriefWorkspaceOption[];
  brandProfiles: readonly BrandProfile[];
  brief: ContentBrief;
  campaignGoalOptions: readonly CreateBriefSelectableOption<CampaignGoal>[];
  channelOptions: readonly CreateBriefSelectableOption<ContentChannel>[];
}

const workspaceTheLuxe = "11111111-1111-4111-8111-111111111111";
const workspaceEditorial = "22222222-2222-4222-8222-222222222222";

const brandProfiles: readonly BrandProfile[] = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    workspaceId: workspaceTheLuxe,
    name: "THE LUXE Signature Voice",
    ...baseVoiceDnaProfileFields,
    audience:
      "Affluent fashion and lifestyle clients seeking curated, high-touch editorial guidance without inflated language.",
    tone: ["sophisticated", "authoritative", "approachable"],
    preferredVocabulary: [
      {
        id: "craftsmanship",
        preferredTerm: "craftsmanship",
        restrictedTerms: ["handmade-ish"],
        note: "Use when describing provenance or finishing.",
      },
    ],
    bannedPhrases: [
      {
        id: "cheap-luxury",
        phrase: "affordable luxury",
        reason: "Dilutes premium positioning.",
      },
    ],
    positioningNotes:
      "Editorial, assured, and never urgency-led. Prioritize restraint over hype.",
    sampleCount: 2,
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-03T10:00:00.000Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    workspaceId: workspaceTheLuxe,
    name: "Private Client Services",
    ...baseVoiceDnaProfileFields,
    audience:
      "Existing VIP clients who expect personal, invitation-led communication.",
    tone: ["professional", "authoritative"],
    preferredVocabulary: [
      {
        id: "private-appointment",
        preferredTerm: "private appointment",
        restrictedTerms: ["booking slot"],
      },
    ],
    bannedPhrases: [
      {
        id: "flash-sale",
        phrase: "flash sale",
        reason: "Conflicts with private client positioning.",
      },
    ],
    positioningNotes:
      "Use language that feels discreet, concierge-led, and highly tailored.",
    sampleCount: 1,
    createdAt: "2026-06-01T11:00:00.000Z",
    updatedAt: "2026-06-03T12:00:00.000Z",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    workspaceId: workspaceEditorial,
    name: "Editorial Partnerships",
    ...baseVoiceDnaProfileFields,
    audience:
      "External editors and collaborators evaluating premium partnership opportunities.",
    tone: ["visionary", "professional"],
    preferredVocabulary: [
      {
        id: "editorial-partnership",
        preferredTerm: "editorial partnership",
        restrictedTerms: ["collab"],
      },
    ],
    bannedPhrases: [
      {
        id: "viral-buzz",
        phrase: "viral buzz",
        reason: "Feels too trend-led for partner communications.",
      },
    ],
    positioningNotes:
      "Thoughtful and strategic, with partnership value framed through editorial alignment.",
    sampleCount: 3,
    createdAt: "2026-06-02T08:30:00.000Z",
    updatedAt: "2026-06-03T13:00:00.000Z",
  },
];

const brief: ContentBrief = {
  id: "66666666-6666-4666-8666-666666666666",
  workspaceId: workspaceTheLuxe,
  brandProfileId: "44444444-4444-4444-8444-444444444444",
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
};

function isSelectedGoal(goal: CampaignGoal) {
  return brief.campaignGoal === goal;
}

function isSelectedChannel(channel: ContentChannel) {
  return brief.targetChannels.includes(channel);
}

export const mockCreateBriefPage = {
  pageHeader: {
    eyebrow: "Create Brief",
    title: "Shape the strategy before the first draft exists.",
    description:
      "Select the workspace and brand voice, then capture the objective, audience, angle, constraints, and channels that will guide every downstream draft.",
  },
  workspaces: [
    {
      id: workspaceTheLuxe,
      name: "THE LUXE",
      selected: true,
    },
    {
      id: workspaceEditorial,
      name: "Editorial Partnerships",
      selected: false,
    },
  ],
  brandProfiles,
  brief,
  campaignGoalOptions: [
    {
      value: "educate",
      label: "Educate",
      description: "Clarify a concept, launch context, or client narrative.",
      selected: isSelectedGoal("educate"),
    },
    {
      value: "announce",
      label: "Announce",
      description: "Reveal a launch, partnership, event, or milestone.",
      selected: isSelectedGoal("announce"),
    },
    {
      value: "promote",
      label: "Promote",
      description: "Drive attention toward a collection, offer, or service.",
      selected: isSelectedGoal("promote"),
    },
    {
      value: "fundraise",
      label: "Fundraise",
      description: "Support a development, donor, or patronage initiative.",
      selected: isSelectedGoal("fundraise"),
    },
    {
      value: "thought_leadership",
      label: "Thought Leadership",
      description: "Position the brand as a trusted editorial authority.",
      selected: isSelectedGoal("thought_leadership"),
    },
  ],
  channelOptions: [
    {
      value: "linkedin",
      label: "LinkedIn",
      description: "Executive-facing brand and partnership messaging.",
      selected: isSelectedChannel("linkedin"),
    },
    {
      value: "instagram",
      label: "Instagram",
      description: "Visual-first storytelling and campaign moments.",
      selected: isSelectedChannel("instagram"),
    },
    {
      value: "blog",
      label: "Blog",
      description: "Long-form editorial framing and brand narrative.",
      selected: isSelectedChannel("blog"),
    },
    {
      value: "newsletter",
      label: "Newsletter",
      description: "Direct client and prospect communication.",
      selected: isSelectedChannel("newsletter"),
    },
    {
      value: "x",
      label: "X",
      description: "Timely short-form commentary and launch signals.",
      selected: isSelectedChannel("x"),
    },
    {
      value: "short_video",
      label: "Short Video",
      description: "Motion-led storytelling for teaser or reveal moments.",
      selected: isSelectedChannel("short_video"),
    },
  ],
} as const satisfies CreateBriefPageData;
