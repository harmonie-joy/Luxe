import type { BrandProfile } from "@/types/brand-profile";

import { baseVoiceDnaProfileFields } from "./mock-brand-profiles";
import type { ContentBrief } from "@/types/content";

interface CreateBriefWorkspaceOption {
  id: string;
  name: string;
  selected: boolean;
}

export interface CreateBriefDemoData {
  workspaces: readonly CreateBriefWorkspaceOption[];
  brandProfiles: readonly BrandProfile[];
  brief: ContentBrief;
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

export const mockCreateBriefDemoData: CreateBriefDemoData = {
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
};
