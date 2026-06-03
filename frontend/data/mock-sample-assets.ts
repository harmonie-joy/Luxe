/**
 * Mock data for the sample asset detail page.
 *
 * Keyed by BrandAsset.id so the page can look up a sample by route param.
 * Each entry includes the full asset content, a comment thread, and an
 * optional pre-computed voice score. A null voiceScore means the sample
 * has not been analyzed yet.
 *
 * Shape contract is kept API-compatible: replace getMockSampleAsset with an
 * API fetch without touching the consuming components.
 */

import type {
  AssetComment,
  AssetVoiceScore,
  BrandAsset,
} from "@/types/brand-profile";

// ---------------------------------------------------------------------------
// UI-layer composition type (page-level, not a domain entity)
// ---------------------------------------------------------------------------

export interface SampleAssetPageData {
  asset: BrandAsset;
  comments: AssetComment[];
  voiceScore: AssetVoiceScore | null;
  brandProfileName: string;
}

// ---------------------------------------------------------------------------
// Mock records
// ---------------------------------------------------------------------------

const MOCK_SAMPLE_ASSETS: Record<string, SampleAssetPageData> = {
  "editorial-launch-note": {
    asset: {
      id: "editorial-launch-note",
      workspaceId: "workspace-the-luxe",
      brandProfileId: "the-luxe-signature",
      title: "Editorial launch note",
      content: `A considered edit of sculptural silhouettes, tactile finishes, and quiet statement pieces designed for clients who value presence over spectacle.

The collection arrives without announcement—precisely the point. Each piece is selected to earn its place in a considered wardrobe, not to compete for attention in a saturated market. Craftsmanship speaks through restraint; provenance is understood, not advertised.`,
      sourceType: "pasted",
      format: "Text",
      wordCount: 42,
      status: "ready",
      createdAt: "2026-06-01T09:00:00.000Z",
      updatedAt: "2026-06-02T10:00:00.000Z",
    },
    comments: [
      {
        id: "comment-001",
        assetId: "editorial-launch-note",
        authorName: "Sophia Laurent",
        authorInitials: "SL",
        body: "The tone is exactly right—restrained without being cold. This is a good reference for newsletter openers going forward.",
        createdAt: "2026-06-01T11:30:00.000Z",
      },
      {
        id: "comment-002",
        assetId: "editorial-launch-note",
        authorName: "Marcus Webb",
        authorInitials: "MW",
        body: "Agreed. Worth preserving 'arrives without announcement' in the vocabulary guide — it captures the quiet luxury positioning precisely.",
        createdAt: "2026-06-02T09:15:00.000Z",
      },
    ],
    voiceScore: {
      assetId: "editorial-launch-note",
      overallScore: 91,
      toneAlignmentScore: 94,
      vocabularyMatchScore: 88,
      flaggedPhraseCount: 0,
      analyzedAt: "2026-06-02T10:00:00.000Z",
    },
    brandProfileName: "THE LUXE Signature Voice",
  },

  "atelier-collection-brief": {
    asset: {
      id: "atelier-collection-brief",
      workspaceId: "workspace-the-luxe",
      brandProfileId: "the-luxe-signature",
      title: "Atelier collection brief",
      content: `Autumn–Winter 2026 Collection Brief

Objective: To present the THE LUXE Atelier range to our clientele through a series of editorial touchpoints across email, LinkedIn, and curated print inserts.

Tone directive: Authoritative yet warm. The copy should feel like guidance from a trusted advisor rather than a sales pitch. Avoid urgency-driven language.

Key vocabulary: craftsmanship, provenance, clientele, curated edit, considered.
Restricted: affordable, haul, drop, go viral.

Channel notes:
- Email: 150–200 words, serif opener, no discount codes
- LinkedIn: 80–120 words, thought leadership framing
- Print insert: 40–60 words, editorial tone`,
      sourceType: "uploaded",
      format: "PDF",
      wordCount: 680,
      status: "needs_review",
      createdAt: "2026-06-01T10:15:00.000Z",
      updatedAt: "2026-06-01T14:00:00.000Z",
    },
    comments: [
      {
        id: "comment-003",
        assetId: "atelier-collection-brief",
        authorName: "Sophia Laurent",
        authorInitials: "SL",
        body: "This brief needs review before it can be used as a training sample—there are a few phrases that conflict with the banned list. Flagging for the team.",
        createdAt: "2026-06-01T14:00:00.000Z",
      },
    ],
    voiceScore: null,
    brandProfileName: "THE LUXE Signature Voice",
  },
};

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

export function getMockSampleAsset(id: string): SampleAssetPageData | null {
  return MOCK_SAMPLE_ASSETS[id] ?? null;
}
