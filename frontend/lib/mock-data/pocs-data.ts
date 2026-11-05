export type InspirationCategory = "Mood & Vibe" | "Color Palettes" | "Typography" | "Photography" | "Campaigns" | "Content Styles" | "Videos";

export interface InspirationItem {
  id: string;
  title: string;
  category: InspirationCategory;
  tags: readonly string[];
  note: string;
  image?: string;
  alt?: string;
  swatches?: readonly { name: string; token: string }[];
  sample?: string;
}

export const mockAestheticBoard: {
  categories: readonly InspirationCategory[];
  tags: readonly string[];
  items: readonly InspirationItem[];
} = {
  categories: ["Mood & Vibe", "Color Palettes", "Typography", "Photography", "Campaigns", "Content Styles", "Videos"],
  tags: ["Warm", "Minimal", "Editorial", "Nature", "Empowering"],
  items: [
    { id: "inspiration-001", title: "Warm Minimalism", category: "Mood & Vibe", tags: ["Warm", "Minimal"], image: "/pocs/inspiration/interior.jpg", alt: "Sunlit interior with natural textures and sculptural furniture", note: "Explore soft daylight, tactile surfaces and generous negative space. Add a personal story rather than recreating the composition." },
    { id: "inspiration-002", title: "Your Potential Is Endless", category: "Campaigns", tags: ["Empowering", "Editorial"], sample: "YOUR POTENTIAL IS ENDLESS.", note: "Pair a confident editorial headline with a simple, actionable message for a founder-focused campaign." },
    { id: "inspiration-003", title: "Summer Serenity", category: "Color Palettes", tags: ["Warm", "Nature"], swatches: [{ name: "Iris", token: "--color-primary" }, { name: "Lilac", token: "--color-primary-fixed-dim" }, { name: "Peach", token: "--color-secondary-container" }, { name: "Sage", token: "--color-tertiary-container" }, { name: "Ink", token: "--color-on-surface" }], note: "A seasonal exploration of lilac, peach and sage. Inspiration only, not an accepted brand color system." },
    { id: "inspiration-004", title: "Dreamy & Ethereal", category: "Photography", tags: ["Nature", "Warm"], image: "/pocs/inspiration/coast.jpg", alt: "Mountain lake framed by trees and distant peaks", note: "Look for luminous skies and a feeling of openness. Bring this light into original photography." },
    { id: "inspiration-005", title: "Quiet Editorial", category: "Typography", tags: ["Editorial", "Minimal"], sample: "Aa", note: "Contrast a considered serif headline with quiet, practical sans-serif text. Keep the message legible and the hierarchy clear." },
    { id: "inspiration-006", title: "Peaceful & Empowering", category: "Mood & Vibe", tags: ["Nature", "Empowering"], image: "/pocs/inspiration/mountains.jpg", alt: "Layered mountains fading into a quiet, open horizon", note: "Use wide horizons as a starting point for stories about perspective, growth and sustainable ambition." },
    { id: "inspiration-007", title: "Align Your Focus", category: "Content Styles", tags: ["Empowering", "Minimal"], sample: "Align your focus. Build your legacy.", note: "Try a short reflective post with one clear thought, plenty of breathing room and your own lived example." },
    { id: "inspiration-008", title: "Intentional Workspace", category: "Photography", tags: ["Warm", "Editorial"], image: "/pocs/inspiration/workspace.jpg", alt: "Minimal creative workspace with a notebook and laptop", note: "Capture the real working process: a few useful objects, natural light and an imperfect human detail." },
    { id: "inspiration-009", title: "Brand Story: A Quiet Beginning", category: "Videos", tags: ["Editorial", "Warm"], image: "/pocs/inspiration/interior.jpg", alt: "Natural-light interior as a reference for an original brand story", note: "Storyboard reference only; no playable video is attached. Begin with a quiet establishing shot, then show the person behind the work." },
  ],
};

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

export type DiscoverMeScreen = "choice" | "chat" | "consultation";
export type DiscoverMePath = "chat" | "consultation";
export type ConsultationTab = "notes" | "assistant" | "actions";

export interface DiscoverMeMessage {
  speaker: "guide" | "creator";
  text: string;
}

export interface DiscoverMeQuestion {
  prompt: string;
  answers: readonly string[];
}

export interface ConsultationAgendaItem {
  id: string;
  time: string;
  title: string;
  complete: boolean;
}

export const mockDiscoverMe = {
  title: "Discover Me",
  introduction: "Your Creator DNA starts here.",
  invitation: "Choose the experience that feels right for you.",
  paths: [
    {
      id: "chat" as const,
      title: "Chat Experience",
      description: "An interactive conversation to discover your voice, brand, and creative identity.",
      action: "Start chat",
      duration: "About 10 minutes",
    },
    {
      id: "consultation" as const,
      title: "Brand Consultation Call",
      description: "A one-on-one session to dive deep into your brand, goals, and vision with a specialist.",
      action: "Book a call",
      duration: "About 30 minutes",
    },
  ] satisfies readonly {
    id: DiscoverMePath;
    title: string;
    description: string;
    action: string;
    duration: string;
  }[],
  privacyNote: "Your information is private, secure, and used only to build your Creator DNA.",
  chat: {
    progress: 28,
    messages: [
      { speaker: "guide", text: "Hey there! I’m Lumi, your creative co-pilot. I’m here to understand you, your voice, your story, and what makes your brand you." },
      { speaker: "guide", text: "Ready to dive in?" },
    ] satisfies readonly DiscoverMeMessage[],
    questions: [
      {
        prompt: "What does your work make possible for people?",
        answers: ["Feel seen", "Build something meaningful", "Find a new perspective", "Make an impact"],
      },
      {
        prompt: "What do you want people to remember after spending time with your work?",
        answers: ["A useful idea", "A little more courage", "A sense of connection", "A reason to act"],
      },
      {
        prompt: "When your voice feels most like you, what is it like?",
        answers: ["Warm and direct", "Thoughtful and curious", "Playful and candid", "Calm and assured"],
      },
    ] satisfies readonly DiscoverMeQuestion[],
    voiceSample: "A quick voice preview, just for you.",
    voiceLabel: "Lumi voice sample",
    inputPlaceholder: "Type your answer or use voice…",
  },
  consultation: {
    hostName: "Maya Chen",
    hostRole: "Creator brand specialist",
    creatorName: "You",
    duration: "24:18",
    agenda: [
      { id: "introduction", time: "00:00", title: "Welcome & introductions", complete: true },
      { id: "north-star", time: "04:15", title: "Purpose & north star", complete: true },
      { id: "audience", time: "10:40", title: "Audience & positioning", complete: true },
      { id: "voice", time: "16:20", title: "Messaging & tone", complete: false },
      { id: "next-steps", time: "22:00", title: "Creator DNA review", complete: false },
    ] satisfies readonly ConsultationAgendaItem[],
    tabs: [
      { id: "notes" as const, label: "Live notes" },
      { id: "assistant" as const, label: "AI assistant" },
      { id: "actions" as const, label: "Action items" },
    ] satisfies readonly { id: ConsultationTab; label: string }[],
    notes: [
      "Key strengths emerge when you teach through real examples.",
      "Your audience values clear, practical steps over big promises.",
      "A calm, candid tone feels most natural across your channels.",
    ],
    assistant: "Maya is exploring how your personal point of view can make practical advice feel distinctly yours.",
    actions: ["Choose three stories that show your approach.", "Bring one example of a post that felt especially natural."],
    progress: 72,
  },
} as const;

export interface CreatorDnaDimension {
  id: string;
  title: string;
  icon: string;
  summary: string;
  details: readonly string[];
}

export interface CreatorDnaProfile {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  source: string;
  dimensions: readonly CreatorDnaDimension[];
  health: {
    completion: number;
    signals: readonly string[];
  };
}

export const mockCreatorDNA: CreatorDnaProfile = {
  id: "creator-dna-sample-001",
  workspaceId: "workspace-sample-001",
  createdAt: "2026-10-20T09:00:00Z",
  updatedAt: "2026-10-20T09:00:00Z",
  title: "Your Creator DNA",
  description: "A reusable foundation for the work you make and the way you show up.",
  source: "Discover Me",
  dimensions: [
    {
      id: "north-star",
      title: "My North Star",
      icon: "✦",
      summary: "Empower founders and creators to grow their businesses with clarity, confidence, and alignment.",
      details: [
        "Make ambitious work feel more human and sustainable.",
        "Turn hard-won experience into useful guidance for others.",
      ],
    },
    {
      id: "core-values",
      title: "Core Values",
      icon: "◈",
      summary: "Integrity, curiosity, meaningful impact, and personal growth.",
      details: [
        "Choose honesty and usefulness over hype.",
        "Stay open to learning and changing your mind.",
      ],
    },
    {
      id: "communication-style",
      title: "Communication Style",
      icon: "◉",
      summary: "Warm and direct, with thoughtful stories that make complex ideas clear.",
      details: [
        "Lead with the point, then give the context that matters.",
        "Sound like a trusted peer, not a distant authority.",
      ],
    },
    {
      id: "voice-tone",
      title: "Voice & Tone",
      icon: "〰",
      summary: "Empowering, knowledgeable, elevated, and human.",
      details: [
        "Be confident without sounding absolute.",
        "Use clear language and a measured sense of optimism.",
      ],
    },
    {
      id: "creative-strengths",
      title: "Creative Strengths",
      icon: "☆",
      summary: "Strategy, storytelling, brand-building, and systems thinking.",
      details: [
        "Find the throughline in a busy set of ideas.",
        "Connect creative direction to practical next steps.",
      ],
    },
    {
      id: "visual-identity",
      title: "Visual Identity",
      icon: "◎",
      summary: "Clean, minimal, and editorial, with warm details and room to breathe.",
      details: [
        "Favor strong hierarchy and considered whitespace.",
        "Use color as a quiet signal, not decoration.",
      ],
    },
    {
      id: "workflow",
      title: "Workflow",
      icon: "⌘",
      summary: "Structured, focused, and self-directed, with space for exploration.",
      details: [
        "Start with a clear intention and a small number of priorities.",
        "Protect focused time and leave room to refine.",
      ],
    },
  ],
  health: {
    completion: 92,
    signals: ["Clear", "Consistent", "Connected", "Aligned"],
  },
};

export interface BrandGuideChapter {
  id: string;
  title: string;
  description: string;
  introduction: string;
  rules: readonly string[];
}

export interface BrandGuideData {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  chapters: readonly BrandGuideChapter[];
  voice: {
    pillars: readonly { title: string; description: string }[];
    wordsToUse: readonly string[];
    wordsToAvoid: readonly string[];
    examples: readonly { id: string; title: string; text: string }[];
    confidence: number;
    interpretation: string;
  };
}

export const mockBrandGuide: BrandGuideData = {
  id: "brand-guide-sample-001",
  workspaceId: "workspace-sample-001",
  createdAt: "2026-10-20T09:00:00Z",
  updatedAt: "2026-10-20T09:00:00Z",
  chapters: [
    { id: "story", title: "Brand Story", description: "The story behind your brand.", introduction: "Make ambitious work feel more human.", rules: ["Start with the problem you experienced, not a polished origin myth.", "Connect your own turning point to the people you serve.", "Show the work behind the outcome. Keep every detail truthful."] },
    { id: "mission", title: "Mission, Vision & Purpose", description: "Why you exist and where you are going.", introduction: "Empower creators to build freedom, impact, and legacy through aligned content and smart systems.", rules: ["Mission: turn creative ambition into clear, sustainable action.", "Vision: a world where meaningful work leaves room for a full life.", "Purpose: help people build on their own terms, without promising guaranteed outcomes."] },
    { id: "positioning", title: "Positioning & Differentiation", description: "What makes you uniquely useful.", introduction: "A thoughtful partner for creators building with intention.", rules: ["Lead with clarity and practical systems rather than growth-at-any-cost promises.", "Explain the specific benefit before describing the method.", "Use concrete examples to demonstrate what makes your approach different."] },
    { id: "audience", title: "Target Audience", description: "Who you serve and how you impact them.", introduction: "Speak to independent creators and founders who want meaningful, sustainable growth.", rules: ["Assume your reader is capable, busy, and curious.", "Acknowledge real constraints: time, energy, and competing priorities.", "Offer a useful next step rather than a prescription for everyone."] },
    { id: "personality", title: "Brand Personality", description: "The human side of your brand.", introduction: "A trusted friend with expertise, not a distant authority.", rules: ["Be warm without being overly familiar.", "Be confident enough to acknowledge uncertainty.", "Let curiosity and generosity show through specific, useful advice."] },
    { id: "tone", title: "Tone of Voice", description: "How your brand speaks.", introduction: "Our tone is warm, confident, and human. We speak like a trusted friend and industry expert. We inspire, we empower, and we keep it real.", rules: ["Lead with the point. Keep sentences clear and natural.", "Encourage action without pressure, hype, or unrealistic promises.", "Sound like a person: use direct language and make space for nuance."] },
    { id: "messaging", title: "Messaging Framework", description: "Core messages that drive everything.", introduction: "Build your brand. Live your freedom.", rules: ["Anchor each message in one clear audience need.", "Support your main point with a story, example, or verifiable fact.", "Close with one thoughtful invitation, not competing calls to action."] },
    { id: "visual", title: "Visual Principles", description: "The look and feel of your brand.", introduction: "Editorial clarity with a human touch.", rules: ["Create a clear focal point and leave enough breathing room.", "Use restrained accents to guide attention, not compete with content.", "Keep imagery, typography, and language connected to the same message."] },
    { id: "logo", title: "Logo Usage", description: "How to use your logo the right way.", introduction: "Give the brand mark space to be recognized.", rules: ["Use the approved master asset; never redraw or stretch the mark.", "Keep surrounding space at least the height of the symbol.", "Choose a light or dark approved variant with clear background contrast."] },
    { id: "color", title: "Color System", description: "Your approved color palette.", introduction: "A considered palette that supports the message.", rules: ["Use neutral surfaces for reading and a primary accent for emphasis.", "Reserve success and warning colors for meaningful status signals.", "Check contrast in both light and dark contexts. Never use color alone to convey meaning."] },
    { id: "typography", title: "Typography", description: "Fonts, hierarchy, and usage.", introduction: "An editorial voice, with everyday readability.", rules: ["Use the brand serif for display moments and the brand sans for body copy.", "Keep headings brief and build a clear hierarchy.", "Avoid dense all-caps paragraphs. Let line length and spacing support comfortable reading."] },
    { id: "photography", title: "Photography Style", description: "Imagery that reflects your brand.", introduction: "Real moments. Natural light. Intentional composition.", rules: ["Choose authentic workspaces, people, and details over staged success imagery.", "Favor natural light and realistic skin tones; avoid heavy filters.", "Use only licensed or permissioned images, with consent for recognizable people."] },
  ],
  voice: {
    pillars: [
      { title: "Empowering", description: "We uplift and encourage action." },
      { title: "Clear", description: "We communicate simply and directly." },
      { title: "Warm", description: "We connect with human emotion." },
      { title: "Confident", description: "We lead with value and conviction." },
    ],
    wordsToUse: ["Empower", "Elevate", "Simplify", "Transform", "Build", "Freedom", "Aligned", "Authentic", "Impact", "Growth", "Purpose", "Clarity"],
    wordsToAvoid: ["Just", "Really", "Very", "Basically", "Actually", "Obviously", "Easy", "Cheap", "Perfect", "Try", "Maybe", "Hopefully"],
    examples: [
      { id: "caption", title: "Example Caption", text: "You don't need more followers.\nYou need more freedom.\nLet's build a brand that works for you." },
      { id: "headline", title: "Headline Example", text: "Build Your Brand.\nLive Your Freedom." },
    ],
    confidence: 92,
    interpretation: "Your tone is best described as Empowering, Clear, Warm, Confident. The AI will use this to guide your voice in captions, emails, and content.",
  },
};