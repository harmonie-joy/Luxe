import { mockCalendar, type CalendarPost } from "@/lib/mock-data/pocs-data";

export const mockPocHome = {
  weekLabel: "Nov 9-15, 2026",
  timezone: mockCalendar.timezone,
  upcoming: mockCalendar.posts.filter((post) => post.calendarStage === "Scheduled").sort((first, second) => first.scheduledAt.localeCompare(second.scheduledAt)).slice(0, 3) satisfies readonly CalendarPost[],
};