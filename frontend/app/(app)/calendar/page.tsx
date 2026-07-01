import { mockCalendarPage } from "@/data/mock-calendar";
import { CalendarShell } from "@/features/calendar/components/calendar-shell";

export default function CalendarPage() {
  return <CalendarShell data={mockCalendarPage} />;
}
