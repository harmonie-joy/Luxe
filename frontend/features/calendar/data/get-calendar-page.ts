import {
  mockCalendarPage,
  type CalendarPageData,
} from "@/data/mock-calendar";

export async function getCalendarPage(): Promise<CalendarPageData> {
  return mockCalendarPage;
}
