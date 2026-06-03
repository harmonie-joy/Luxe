/**
 * Derives a short month and day string from an ISO 8601 timestamp.
 * Used by calendar/schedule display components.
 */
export function formatShortDate(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  return {
    month: d.toLocaleString("en-US", { month: "short" }),
    day: String(d.getDate()),
  };
}

/**
 * Formats an ISO 8601 timestamp as a human-readable date (e.g. "Jun 3, 2026").
 */
export function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
