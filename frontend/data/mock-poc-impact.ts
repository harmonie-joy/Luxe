export interface PocImpactPost {
  id: string;
  workspaceId: string;
  title: string;
  channel: "instagram" | "linkedin";
  intendedGoal: string;
  replyGoal: number;
  impressions: number;
  saves: number;
  replies: number;
  dailyReplies: readonly { date: string; count: number }[];
  image: string;
  alt: string;
  createdAt: string;
  updatedAt: string;
}

export const mockPocImpact: { posts: readonly PocImpactPost[] } = {
  posts: [
    {
      id: "gallery-005", workspaceId: "workspace-poc-synthetic", title: "Weekend Reminder", channel: "instagram",
      intendedGoal: "Start useful conversations about a calmer weekly reset", replyGoal: 10,
      impressions: 1240, saves: 18, replies: 7,
      dailyReplies: [{ date: "2026-11-02", count: 2 }, { date: "2026-11-03", count: 3 }, { date: "2026-11-04", count: 2 }],
      image: "/pocs/inspiration/mountains.jpg", alt: "Mountain horizon used for the synthetic Weekend Reminder post",
      createdAt: "2026-11-02T09:00:00Z", updatedAt: "2026-11-04T18:00:00Z",
    },
    {
      id: "gallery-006", workspaceId: "workspace-poc-synthetic", title: "Day in the Life", channel: "instagram",
      intendedGoal: "Invite creators to share one sustainable work habit", replyGoal: 6,
      impressions: 860, saves: 8, replies: 3,
      dailyReplies: [{ date: "2026-11-03", count: 1 }, { date: "2026-11-04", count: 0 }, { date: "2026-11-05", count: 2 }],
      image: "/pocs/inspiration/workspace.jpg", alt: "Notebook and laptop used for the synthetic Day in the Life post",
      createdAt: "2026-11-03T09:00:00Z", updatedAt: "2026-11-05T18:00:00Z",
    },
  ],
};