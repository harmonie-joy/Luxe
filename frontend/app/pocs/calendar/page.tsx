"use client";

import { ContentCalendar } from "@/features/calendar/components/content-calendar";
import { mockCalendar } from "@/lib/mock-data/pocs-data";

export default function CalendarPage() {
  return <ContentCalendar initialData={mockCalendar} />;
}