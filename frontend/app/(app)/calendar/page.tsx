import { CalendarShell } from "@/features/calendar/components/calendar-shell";
import { getCalendarPage } from "@/features/calendar/data/get-calendar-page";

export default async function CalendarPage() {
  const data = await getCalendarPage();

  return <CalendarShell data={data} />;
}
