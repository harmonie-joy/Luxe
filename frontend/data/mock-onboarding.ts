import type { BrandVoiceTone } from "@/types/brand-profile";
import type { OnboardingAnswers } from "@/types/onboarding";

/** UI-layer tone choice: friendly label mapped to a canonical BrandVoiceTone. */
export interface OnboardingToneOption {
  value: BrandVoiceTone;
  label: string;
  description: string;
}

export interface OnboardingSetupConfig {
  toneOptions: readonly OnboardingToneOption[];
  placeholders: Readonly<Record<Exclude<keyof OnboardingAnswers, "toneIntent">, string>>;
}

export const mockOnboardingSetup: OnboardingSetupConfig = {
  toneOptions: [
    {
      value: "approachable",
      label: "Friendly & human",
      description: "Warm, plain language that is easy to follow.",
    },
    {
      value: "professional",
      label: "Clear & professional",
      description: "Composed, polished, and to the point.",
    },
    {
      value: "authoritative",
      label: "Expert & confident",
      description: "Confident guidance backed by real experience.",
    },
    {
      value: "sophisticated",
      label: "Polished & premium",
      description: "Refined language with restraint.",
    },
    {
      value: "visionary",
      label: "Bold & forward-looking",
      description: "Future-focused without exaggeration.",
    },
  ],
  placeholders: {
    brandName: "Build Mode Lab",
    creatorRole: "Founder and live-coding streamer",
    projectDescription:
      "An AI-powered brand voice and content cockpit, built live on stream with a local-first stack.",
    audience:
      "Technical founders, software engineers, AI builders, indie hackers, and creators building products in public.",
    preferredWords: "build in public, working prototype, tradeoffs, shipped, real implementation",
    avoidedPhrases:
      "guaranteed success\npassive income\nsecret formula\n10x your life\ncrush it",
    personalityNotes:
      "Direct and curious. Honest about what broke, what it cost, and what actually shipped.",
    contentPillars:
      "Building THE LUXE in public\nLocal AI experiments\nMVP architecture\nDebugging real implementation issues\nFounder lessons without hype",
    formats: "Live streams, short clips, blog posts, newsletter recaps",
    firstGoal: "Publish one polished build-log post per week.",
    complianceBoundaries:
      "Do not show API keys, credentials, client data, or private user data.\nDo not use copyrighted music, clips, logos, or third-party assets without permission.\nDo not present experimental AI outputs as legal, financial, or professional advice.",
  },
};
