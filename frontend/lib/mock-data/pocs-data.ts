export type WelcomePathId = "build" | "scale" | "automate";

export interface WelcomePath {
  id: WelcomePathId;
  title: string;
  description: string;
}

export interface WelcomeFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface WelcomeHomeData {
  title: string;
  subtitle: string;
  supportingLine: string;
  invitation: string;
  paths: readonly WelcomePath[];
  features: readonly WelcomeFeature[];
}

export const mockWelcomeHome: WelcomeHomeData = {
  title: "THE LUXE",
  subtitle: "Your creative workspace.",
  supportingLine: "Everything you need. In one intelligent space.",
  invitation: "Are you ready to build your content journey?",
  paths: [
    { id: "build", title: "Build", description: "Start with a clear creative foundation." },
    { id: "scale", title: "Scale", description: "Bring more intention to the work you share." },
    { id: "automate", title: "Automate", description: "Make room for a more sustainable rhythm." },
  ],
  features: [
    { id: "intelligence", icon: "✦", title: "AI-powered intelligence", description: "A thoughtful partner for your creative work." },
    { id: "organized", icon: "▤", title: "Everything organized", description: "Keep your ideas and projects in one space." },
    { id: "creators", icon: "◎", title: "Built for creators", description: "A workspace shaped around how you work." },
    { id: "private", icon: "⌑", title: "Your data stays private", description: "Your creative space is yours." },
  ],
};