import type { ContentChannel, DraftStatus } from "@/types/content";

export interface CalendarPost extends GalleryPost {
  scheduledAt: string;
  calendarStage: "Ready" | "Scheduled" | "Published" | "Draft";
}

export const mockCalendar = {
  referenceDate: "2026-11-10",
  timezone: "Europe/Berlin",
  posts: ([
    { id: "calendar-001", title: "Morning Mindset", channel: "instagram", status: "approved", calendarStage: "Ready", format: "Image", image: "/pocs/inspiration/mountains.jpg", alt: "Open mountain horizon", scheduledAt: "2026-11-09T09:00:00+01:00" },
    { id: "calendar-002", title: "AI Workshop Takeaway", channel: "instagram", status: "scheduled", calendarStage: "Scheduled", format: "Carousel", image: "/pocs/inspiration/coast.jpg", alt: "Mountain lake framed by trees", scheduledAt: "2026-11-10T10:00:00+01:00" },
    { id: "calendar-003", title: "Productivity Rituals", channel: "linkedin", status: "published", calendarStage: "Published", format: "Carousel", image: "/pocs/inspiration/workspace.jpg", alt: "Notebook and laptop in a creative workspace", scheduledAt: "2026-11-11T12:00:00+01:00" },
    { id: "calendar-004", title: "Day in the Life", channel: "short_video", status: "draft", calendarStage: "Draft", format: "Video", image: "/pocs/inspiration/interior.jpg", alt: "Light-filled creative studio", scheduledAt: "2026-11-12T10:00:00+01:00" },
    { id: "calendar-005", title: "Direction Over Distraction", channel: "instagram", status: "approved", calendarStage: "Ready", format: "Image", image: "/pocs/inspiration/mountains.jpg", alt: "Layered mountains in evening light", scheduledAt: "2026-11-13T10:00:00+01:00" },
    { id: "calendar-006", title: "Weekend Reminder", channel: "short_video", status: "scheduled", calendarStage: "Scheduled", format: "Video", image: "/pocs/inspiration/interior.jpg", alt: "Sunlit studio with natural textures", scheduledAt: "2026-11-14T12:00:00+01:00" },
    { id: "calendar-007", title: "Protect Your Peace", channel: "short_video", status: "published", calendarStage: "Published", format: "Image", image: "/pocs/inspiration/coast.jpg", alt: "Calm mountain lake", scheduledAt: "2026-11-09T17:00:00+01:00" },
    { id: "calendar-008", title: "Plan with Purpose", channel: "linkedin", status: "scheduled", calendarStage: "Scheduled", format: "Image", image: "/pocs/inspiration/mountains.jpg", alt: "Mountain landscape at sunset", scheduledAt: "2026-11-10T18:00:00+01:00" },
  ] satisfies Omit<CalendarPost, "workspaceId" | "createdAt" | "updatedAt" | "stage">[]).map((post): CalendarPost => ({ ...post, stage: post.calendarStage === "Draft" ? "In Progress" : post.calendarStage, workspaceId: "workspace-sample-001", createdAt: "2026-11-05T09:00:00Z", updatedAt: "2026-11-05T10:00:00Z" })),
};

export type GalleryStage = "Ideas" | "In Progress" | "Review" | "Ready" | "Scheduled" | "Published";

export interface GalleryPost {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  channel: ContentChannel;
  status: DraftStatus;
  stage: GalleryStage;
  format: "Image" | "Carousel" | "Video" | "Text";
  image: string;
  alt: string;
}

export const mockPostsGallery: readonly GalleryPost[] = ([
  { id: "gallery-001", title: "AI Workshop Takeaway", channel: "instagram", status: "draft", stage: "In Progress", format: "Carousel", image: "/pocs/inspiration/coast.jpg", alt: "Mountain lake framed by trees" },
  { id: "gallery-002", title: "Morning Mindset", channel: "instagram", status: "in_review", stage: "Review", format: "Image", image: "/pocs/inspiration/mountains.jpg", alt: "Open mountain horizon" },
  { id: "gallery-003", title: "Productivity Rituals", channel: "linkedin", status: "approved", stage: "Ready", format: "Carousel", image: "/pocs/inspiration/workspace.jpg", alt: "Notebook and laptop in a creative workspace" },
  { id: "gallery-004", title: "Direction Over Distraction", channel: "short_video", status: "scheduled", stage: "Scheduled", format: "Video", image: "/pocs/inspiration/interior.jpg", alt: "Light-filled creative studio" },
  { id: "gallery-005", title: "Weekend Reminder", channel: "instagram", status: "published", stage: "Published", format: "Image", image: "/pocs/inspiration/mountains.jpg", alt: "Layered mountains in the evening light" },
  { id: "gallery-006", title: "Day in the Life", channel: "short_video", status: "published", stage: "Published", format: "Video", image: "/pocs/inspiration/workspace.jpg", alt: "A quiet workspace with a notebook" },
  { id: "gallery-007", title: "Protect Your Peace", channel: "linkedin", status: "published", stage: "Published", format: "Image", image: "/pocs/inspiration/interior.jpg", alt: "Sunlit interior with natural textures" },
  { id: "gallery-008", title: "A More Intentional Week", channel: "linkedin", status: "draft", stage: "Ideas", format: "Text", image: "/pocs/inspiration/coast.jpg", alt: "Calm lake as a reference for an intentional week" },
] satisfies Omit<GalleryPost, "workspaceId" | "createdAt" | "updatedAt">[]).map((post, index) => ({
  ...post,
  workspaceId: "workspace-sample-001",
  createdAt: `2026-10-${String(28 - index).padStart(2, "0")}T09:00:00Z`,
  updatedAt: `2026-11-${String(5 - Math.floor(index / 2)).padStart(2, "0")}T10:00:00Z`,
}));

export type IdeaCategory = "Storytelling" | "Content series" | "Creative practice" | "Business";
export type IdeaStage = "idea" | "drafting";

export interface IdeaBoxIdea {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  note: string;
  category: IdeaCategory;
  tags: readonly string[];
  stage: IdeaStage;
  storyboard: readonly string[];
}

export const mockIdeaBoxIdeas: readonly IdeaBoxIdea[] = [
  {
    id: "idea-001",
    workspaceId: "workspace-sample-001",
    createdAt: "2026-11-02T09:00:00Z",
    updatedAt: "2026-11-04T14:20:00Z",
    title: "A more honest launch story",
    note: "What changed when I stopped polishing the messy middle out of my process?",
    category: "Storytelling",
    tags: ["Behind the scenes", "Personal"],
    stage: "idea",
    storyboard: ["The version I planned to tell", "The moment things changed", "What I know now"],
  },
  {
    id: "idea-002",
    workspaceId: "workspace-sample-001",
    createdAt: "2026-11-01T11:30:00Z",
    updatedAt: "2026-11-04T10:15:00Z",
    title: "Turn one client question into three posts",
    note: "A repeatable series: the question, the real answer, and one small next step.",
    category: "Content series",
    tags: ["Repurpose", "LinkedIn"],
    stage: "idea",
    storyboard: ["The question I hear most", "The assumption behind it", "One useful next step"],
  },
  {
    id: "idea-003",
    workspaceId: "workspace-sample-001",
    createdAt: "2026-10-30T08:45:00Z",
    updatedAt: "2026-11-03T16:05:00Z",
    title: "A reset ritual for creative blocks",
    note: "Share the three-minute walk and voice memo that help me return to a stuck idea.",
    category: "Creative practice",
    tags: ["Routine", "Voice note"],
    stage: "idea",
    storyboard: ["Name the block", "Step away for three minutes", "Return with one question"],
  },
  {
    id: "idea-004",
    workspaceId: "workspace-sample-001",
    createdAt: "2026-10-28T13:10:00Z",
    updatedAt: "2026-11-02T09:25:00Z",
    title: "Notes from the first 100 customers",
    note: "Patterns I did not expect, and what they changed about the offer.",
    category: "Business",
    tags: ["Lessons learned", "Offer"],
    stage: "idea",
    storyboard: ["What I expected", "What customers actually needed", "What I changed"],
  },
  {
    id: "idea-005",
    workspaceId: "workspace-sample-001",
    createdAt: "2026-10-27T09:00:00Z",
    updatedAt: "2026-11-04T15:40:00Z",
    title: "A weekly field note from the studio",
    note: "Collect one observation, one lesson, and one question from the work week.",
    category: "Content series",
    tags: ["Weekly", "Studio"],
    stage: "drafting",
    storyboard: ["One moment from the week", "The lesson it revealed", "A question to take forward"],
  },
];

export interface SinglePostVersion {
  id: string;
  label: string;
  text: string;
  createdAt: string;
}

export interface SinglePostLoopData {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  channel: "instagram";
  original: string;
  versions: readonly SinglePostVersion[];
  slides: readonly { id: string; image: string; alt: string; headline: string; subtitle: string }[];
  templates: readonly string[];
  layers: readonly string[];
  suggestedSlot: { date: string; time: string; timezone: string };
}

export const mockSinglePostLoop: SinglePostLoopData = {
  id: "post-sample-0624",
  workspaceId: "workspace-sample-001",
  createdAt: "2026-11-05T09:00:00Z",
  updatedAt: "2026-11-05T10:42:00Z",
  title: "AI Workshop Takeaway",
  channel: "instagram",
  original: "Biggest takeaway from today's AI workshop:\n\nAI amplifies your thinking, not replaces it.\n\n3 actions I'm taking this week: protect focus, create with purpose, and reflect on what works.",
  versions: [
    { id: "caption-v1", label: "V1", createdAt: "2026-11-05T09:20:00Z", text: "Here's the biggest takeaway from today's AI workshop:\n\nAI doesn't replace our thinking. It amplifies it.\n\n3 actions I'm taking this week: protect my focus, create with purpose, and reflect on what works.\n\nWhat's one small step you'll take?" },
    { id: "caption-v2", label: "V2", createdAt: "2026-11-05T09:40:00Z", text: "Small steps. Consistent action. Big results.\n\nAI amplifies your thinking, not replaces it. This week, I'm making room to focus, create, and reflect.\n\nWhich one will you start with?" },
    { id: "caption-v3", label: "V3", createdAt: "2026-11-05T10:00:00Z", text: "You don't need to do more. You need to give your best ideas room to grow.\n\nMy AI workshop takeaway: protect your focus, create with purpose, and let technology amplify your thinking.\n\nOne intentional step at a time." },
  ],
  slides: [
    { id: "slide-focus", image: "/pocs/inspiration/coast.jpg", alt: "Mountain lake framed by trees and distant peaks", headline: "FOCUS.\nCREATE.", subtitle: "Make an impact." },
    { id: "slide-plan", image: "/pocs/inspiration/mountains.jpg", alt: "Open mountain horizon", headline: "PLAN", subtitle: "with purpose." },
    { id: "slide-execute", image: "/pocs/inspiration/workspace.jpg", alt: "Notebook and laptop in a creative workspace", headline: "EXECUTE", subtitle: "with focus." },
    { id: "slide-review", image: "/pocs/inspiration/interior.jpg", alt: "Sunlit studio interior", headline: "REVIEW", subtitle: "what matters." },
  ],
  templates: ["Editorial", "Minimal", "Statement"],
  layers: ["Headline", "Accent line", "Brand signature"],
  suggestedSlot: { date: "2026-11-12", time: "10:00", timezone: "Europe/Berlin" },
};

export interface WebPortalPage {
  id: string;
  title: string;
  path: string;
  status: "published" | "draft";
  headline: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
}

export const mockWebPortal = {
  id: "website-sample-001",
  workspaceId: "workspace-sample-001",
  createdAt: "2026-11-01T09:00:00Z",
  updatedAt: "2026-11-05T09:00:00Z",
  brand: "THE LUXE STUDIO",
  domain: "theluxe-studio.example",
  image: "/pocs/inspiration/interior.jpg",
  imageAlt: "Sunlit studio interior with natural textures and sculptural furniture",
  assets: [
    { id: "asset-interior", image: "/pocs/inspiration/interior.jpg", alt: "Studio interior brand reference" },
    { id: "asset-workspace", image: "/pocs/inspiration/workspace.jpg", alt: "Creative workspace brand reference" },
    { id: "asset-coast", image: "/pocs/inspiration/coast.jpg", alt: "Landscape brand reference" },
  ],
  colors: [
    { name: "Ink", token: "--color-on-surface" },
    { name: "Iris", token: "--color-primary" },
    { name: "Lilac", token: "--color-primary-fixed-dim" },
    { name: "Peach", token: "--color-secondary-container" },
    { name: "Sage", token: "--color-tertiary-container" },
  ],
  typography: { heading: "Libre Caslon Text", body: "Inter" },
  metrics: [
    { label: "Visitors", value: "8.2K", change: "+12.5%", weekValue: "2.1K", weekChange: "+4.2%" },
    { label: "Page views", value: "12.4K", change: "+18.4%", weekValue: "3.2K", weekChange: "+6.1%" },
    { label: "Avg. visit", value: "02:31", change: "+8.2%", weekValue: "02:18", weekChange: "+2.8%" },
    { label: "Conversions", value: "156", change: "+15.7%", weekValue: "38", weekChange: "+5.6%" },
  ],
  activity: { month: [35, 52, 44, 67, 58, 80, 72, 95, 78, 88, 70, 92], week: [42, 58, 48, 76, 64, 85, 92] },
  suggestions: [
    { title: "How living spaces shape our days", pageId: "web-blog", kind: "Blog" },
    { title: "Behind our design process", pageId: "web-services", kind: "Services" },
    { title: "Meet the studio", pageId: "web-about", kind: "About" },
  ],
  pages: ([
    { id: "web-home", title: "Home", path: "/", status: "published", headline: "Your Vision. Our Strategy. Timeless Impact.", body: "We help creators and brands build purposeful identities and spaces that reflect who they are.", seoTitle: "THE LUXE STUDIO | Intentional brand design", seoDescription: "Discover a thoughtful design studio creating purposeful brand identities, considered spaces, and meaningful experiences for founders and creators." },
    { id: "web-about", title: "About", path: "/about", status: "published", headline: "A studio built on intention.", body: "We are a small team of designers and strategists who believe the most enduring work starts with listening.", seoTitle: "About our studio | THE LUXE STUDIO", seoDescription: "Meet the designers and strategists behind THE LUXE STUDIO and explore our considered approach to purposeful brands and lasting creative partnerships." },
    { id: "web-services", title: "Services", path: "/services", status: "published", headline: "Make room for what comes next.", body: "From brand strategy to website design, we bring clarity and a distinctive point of view to every touchpoint.", seoTitle: "Brand strategy and website design | THE LUXE STUDIO", seoDescription: "Explore brand strategy, visual identity, and website design services shaped around your goals, your audience, and the next chapter of your business." },
    { id: "web-work", title: "Work", path: "/work", status: "published", headline: "Considered work. Lasting connections.", body: "A selection of original identities and experiences, developed in close collaboration with ambitious founders.", seoTitle: "Selected creative work | THE LUXE STUDIO", seoDescription: "Browse selected brand identities and digital experiences created in collaboration with founders who value clarity, thoughtful design, and lasting impact." },
    { id: "web-blog", title: "Blog", path: "/journal", status: "draft", headline: "Notes from the studio.", body: "Ideas on design, creative practice, and building something that matters.", seoTitle: "", seoDescription: "" },
    { id: "web-contact", title: "Contact", path: "/contact", status: "published", headline: "Let's build something meaningful.", body: "Tell us about your next chapter. We would love to hear what you have in mind.", seoTitle: "Contact the studio | THE LUXE STUDIO", seoDescription: "Start a conversation with THE LUXE STUDIO about your brand, your website, or a new creative collaboration. Share your vision and meet your design team." },
  ] satisfies Omit<WebPortalPage, "updatedAt">[]).map((page) => ({ ...page, updatedAt: "2026-11-05T09:00:00Z" })),
};

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

export type BrandAssetCategory = "Logos" | "Fonts" | "Media" | "Templates" | "Documents";
export type BrandAssetPreviewKind = "logo" | "font" | "image" | "video" | "audio" | "template" | "document";

export interface BrandKitAsset {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  category: BrandAssetCategory;
  format: string;
  sizeLabel: string;
  description: string;
  previewKind: BrandAssetPreviewKind;
  image?: string;
  alt?: string;
}

export const mockBrandAssetKit = {
  storageUsedPercent: 68,
  storageUsedLabel: "6.8 GB",
  storageLimitLabel: "10 GB",
  assets: [
    { id: "asset-logo-primary", workspaceId: "workspace-sample-001", createdAt: "2026-10-12T10:00:00Z", updatedAt: "2026-10-29T14:30:00Z", name: "Primary Logo", category: "Logos", format: "SVG", sizeLabel: "2.4 MB", description: "Approved master mark for light backgrounds.", previewKind: "logo" },
    { id: "asset-logo-reverse", workspaceId: "workspace-sample-001", createdAt: "2026-10-12T10:00:00Z", updatedAt: "2026-10-27T09:10:00Z", name: "Reverse Logo", category: "Logos", format: "PNG", sizeLabel: "1.8 MB", description: "Light mark for use on dark backgrounds.", previewKind: "logo" },
    { id: "asset-logo-icon", workspaceId: "workspace-sample-001", createdAt: "2026-10-12T10:00:00Z", updatedAt: "2026-10-21T11:45:00Z", name: "Brand Symbol", category: "Logos", format: "SVG", sizeLabel: "840 KB", description: "Standalone symbol for compact placements.", previewKind: "logo" },
    { id: "asset-font-sora", workspaceId: "workspace-sample-001", createdAt: "2026-10-14T08:30:00Z", updatedAt: "2026-10-28T15:00:00Z", name: "Sora SemiBold", category: "Fonts", format: "OTF", sizeLabel: "1.2 MB", description: "Primary sans-serif for interface and body copy.", previewKind: "font" },
    { id: "asset-font-caslon", workspaceId: "workspace-sample-001", createdAt: "2026-10-14T08:30:00Z", updatedAt: "2026-10-28T15:00:00Z", name: "Libre Caslon Text", category: "Fonts", format: "TTF", sizeLabel: "980 KB", description: "Editorial serif for display headings.", previewKind: "font" },
    { id: "asset-media-editorial", workspaceId: "workspace-sample-001", createdAt: "2026-10-19T13:15:00Z", updatedAt: "2026-10-26T16:20:00Z", name: "Editorial Portrait", category: "Media", format: "JPG", sizeLabel: "8.6 MB", description: "Natural-light editorial reference image.", previewKind: "image", image: "/pocs/brand-guide-editorial.jpg", alt: "Editorial portrait in a softly lit studio" },
    { id: "asset-media-campaign", workspaceId: "workspace-sample-001", createdAt: "2026-10-20T09:00:00Z", updatedAt: "2026-10-25T10:05:00Z", name: "Launch Film", category: "Media", format: "MP4", sizeLabel: "184 MB", description: "Launch campaign video master.", previewKind: "video", image: "/pocs/brand-guide-editorial.jpg", alt: "Launch film poster" },
    { id: "asset-media-audio", workspaceId: "workspace-sample-001", createdAt: "2026-10-20T09:00:00Z", updatedAt: "2026-10-23T12:40:00Z", name: "Audio Signature", category: "Media", format: "WAV", sizeLabel: "12.1 MB", description: "Short audio signature for branded video.", previewKind: "audio" },
    { id: "asset-template-social", workspaceId: "workspace-sample-001", createdAt: "2026-10-16T12:00:00Z", updatedAt: "2026-10-29T11:30:00Z", name: "Social Quote", category: "Templates", format: "FIG", sizeLabel: "4.1 MB", description: "Square quote layout with approved logo placement.", previewKind: "template" },
    { id: "asset-template-story", workspaceId: "workspace-sample-001", createdAt: "2026-10-16T12:00:00Z", updatedAt: "2026-10-24T10:15:00Z", name: "Story Cover", category: "Templates", format: "PSD", sizeLabel: "16.3 MB", description: "Portrait title card for story sequences.", previewKind: "template" },
    { id: "asset-template-presentation", workspaceId: "workspace-sample-001", createdAt: "2026-10-16T12:00:00Z", updatedAt: "2026-10-22T08:50:00Z", name: "Pitch Deck", category: "Templates", format: "PPTX", sizeLabel: "9.7 MB", description: "Presentation master with the current type system.", previewKind: "template" },
    { id: "asset-document-guidelines", workspaceId: "workspace-sample-001", createdAt: "2026-10-17T14:00:00Z", updatedAt: "2026-10-30T09:25:00Z", name: "Brand Guidelines", category: "Documents", format: "PDF", sizeLabel: "5.2 MB", description: "Reference guide for using the approved identity.", previewKind: "document" },
    { id: "asset-document-license", workspaceId: "workspace-sample-001", createdAt: "2026-10-17T14:00:00Z", updatedAt: "2026-10-18T16:45:00Z", name: "Image License Notes", category: "Documents", format: "PDF", sizeLabel: "640 KB", description: "Usage notes for licensed campaign photography.", previewKind: "document" },
  ] satisfies readonly BrandKitAsset[],
} as const;

export type ImportWorldConnectorId = "google-drive" | "dropbox" | "notion" | "instagram" | "youtube";

export interface ImportWorldConnector {
  id: ImportWorldConnectorId;
  name: string;
  mark: string;
  kind: string;
  sampleCount: number;
  description: string;
}

export interface ImportWorldCategory {
  id: string;
  name: string;
  sampleCount: number;
  description: string;
}

export const mockImportWorld = {
  id: "import-world-sample-001",
  workspaceId: "workspace-sample-001",
  createdAt: "2026-10-30T09:00:00Z",
  updatedAt: "2026-10-30T09:00:00Z",
  steps: [
    { id: "connect", label: "Connect sources", description: "Choose where your work lives." },
    { id: "select", label: "Choose content", description: "Select what to bring in." },
    { id: "organize", label: "Organize", description: "Sort and categorize your content." },
    { id: "review", label: "Review", description: "Check what is ready to import." },
    { id: "complete", label: "Complete", description: "Your world is ready." },
  ],
  connectors: [
    { id: "google-drive", name: "Google Drive", mark: "G", kind: "Drive", sampleCount: 1241, description: "Documents, images, and brand files." },
    { id: "dropbox", name: "Dropbox", mark: "D", kind: "Drive", sampleCount: 563, description: "Creative files and working folders." },
    { id: "notion", name: "Notion", mark: "N", kind: "Workspace", sampleCount: 32, description: "Notes, plans, and knowledge pages." },
    { id: "instagram", name: "Instagram", mark: "◎", kind: "Social", sampleCount: 247, description: "Posts, reels, and saved highlights." },
    { id: "youtube", name: "YouTube", mark: "▶", kind: "Video", sampleCount: 68, description: "Videos, descriptions, and transcripts." },
  ] satisfies readonly ImportWorldConnector[],
  categories: [
    { id: "brand", name: "Brand assets", sampleCount: 86, description: "Logos, guidelines, templates, and visual references." },
    { id: "content", name: "Content & stories", sampleCount: 542, description: "Published work, drafts, and creator stories." },
    { id: "strategy", name: "Strategy & notes", sampleCount: 118, description: "Ideas, plans, and audience insights." },
  ] satisfies readonly ImportWorldCategory[],
  organizingTasks: ["Categorizing files", "Generating tags", "Connecting insights", "Detecting duplicates"],
} as const;

export interface TornadoWorkspaceMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  mark: string;
}

export interface TornadoWorkspaceAsset {
  id: string;
  name: string;
  source: string;
  mark: string;
}

export interface TornadoWorkspaceFocusItem {
  id: string;
  title: string;
  category: string;
  due: string;
}

export const mockTornadoWorkspace = {
  id: "tornado-workspace-sample-001",
  workspaceId: "workspace-sample-001",
  createdAt: "2026-11-05T09:00:00Z",
  updatedAt: "2026-11-05T09:00:00Z",
  creatorName: "Harmonie",
  metrics: [
    { id: "projects", label: "Projects", value: "7", detail: "Active", mark: "P" },
    { id: "tasks", label: "Tasks", value: "12", detail: "This week", mark: "T" },
    { id: "content", label: "Content items", value: "1,248", detail: "Organized", mark: "C" },
    { id: "insights", label: "Insights", value: "92", detail: "This week", mark: "I" },
  ] satisfies readonly TornadoWorkspaceMetric[],
  scatteredAssets: [
    { id: "asset-drive", name: "Launch notes", source: "Drive", mark: "D" },
    { id: "asset-notion", name: "Audience map", source: "Notion", mark: "N" },
    { id: "asset-social", name: "Founder story", source: "Instagram", mark: "IG" },
    { id: "asset-video", name: "Studio interview", source: "YouTube", mark: "YT" },
    { id: "asset-dropbox", name: "Brand references", source: "Dropbox", mark: "Db" },
  ] satisfies readonly TornadoWorkspaceAsset[],
  collections: ["Brand assets", "Stories", "Campaigns"],
  focus: [
    { id: "focus-review", title: "Review new brand references", category: "Brand foundation", due: "10 min" },
    { id: "focus-launch", title: "Shape the spring launch idea", category: "Spring campaign", due: "Today" },
    { id: "focus-image", title: "Choose a hero image", category: "Founder story", due: "Today" },
  ] satisfies readonly TornadoWorkspaceFocusItem[],
} as const;

export interface ContentWorkspacePath {
  id: "guided" | "quick-draft" | "bring-in";
  title: string;
  description: string;
  details: readonly string[];
  icon: string;
  action: string;
  accent: "primary" | "secondary" | "tertiary";
}

export interface ContentWorkspaceItem {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  channel: string;
  status: string;
  updatedLabel: string;
  nextAction: string;
  image: string;
  imageAlt: string;
}

export const mockContentWorkspace = {
  id: "content-workspace-sample-001",
  workspaceId: "workspace-sample-001",
  createdAt: "2026-11-05T09:00:00Z",
  updatedAt: "2026-11-05T09:00:00Z",
  creatorName: "Sandra",
  paths: [
    {
      id: "guided",
      title: "Create With Me",
      description: "Shape one idea into work that sounds like you.",
      details: ["Guided, one step at a time", "Your accepted voice stays in view", "Pick up where you left off"],
      icon: "✦",
      action: "Start guided",
      accent: "primary",
    },
    {
      id: "quick-draft",
      title: "Quick Draft",
      description: "Start with a thought and find its shape.",
      details: ["Begin with a rough idea", "Keep your point of view", "Refine it when you are ready"],
      icon: "↗",
      action: "Explore quick draft",
      accent: "secondary",
    },
    {
      id: "bring-in",
      title: "Bring Something In",
      description: "Keep a link, note, or reference close to your work.",
      details: ["Bring a source into focus", "Add context as you go", "Nothing is uploaded in this preview"],
      icon: "＋",
      action: "Explore import",
      accent: "tertiary",
    },
  ] satisfies readonly ContentWorkspacePath[],
  items: [
    {
      id: "content-item-sample-001",
      workspaceId: "workspace-sample-001",
      createdAt: "2026-11-03T09:00:00Z",
      updatedAt: "2026-11-04T15:20:00Z",
      title: "Founder story: finding a steadier pace",
      channel: "LinkedIn post",
      status: "In progress",
      updatedLabel: "Yesterday",
      nextAction: "Add the moment that changed your approach",
      image: "/pocs/inspiration/workspace.jpg",
      imageAlt: "Notebook and laptop on a calm creative workspace",
    },
    {
      id: "content-item-sample-002",
      workspaceId: "workspace-sample-001",
      createdAt: "2026-11-02T11:30:00Z",
      updatedAt: "2026-11-04T10:15:00Z",
      title: "Leadership is a daily practice",
      channel: "Instagram post",
      status: "In review",
      updatedLabel: "Yesterday",
      nextAction: "Revisit the opening line",
      image: "/pocs/inspiration/interior.jpg",
      imageAlt: "Sunlit interior with natural textures and sculptural furniture",
    },
    {
      id: "content-item-sample-003",
      workspaceId: "workspace-sample-001",
      createdAt: "2026-10-30T08:45:00Z",
      updatedAt: "2026-11-03T16:40:00Z",
      title: "Monthly note on making room to grow",
      channel: "Newsletter",
      status: "Scheduled",
      updatedLabel: "Nov 3",
      nextAction: "Review the saved outline",
      image: "/pocs/inspiration/coast.jpg",
      imageAlt: "Quiet coastline beneath a wide open sky",
    },
  ] satisfies readonly ContentWorkspaceItem[],
} as const;