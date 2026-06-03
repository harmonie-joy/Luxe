import type {
  DashboardSectionCopy,
  ScheduledContentItem,
} from "@/data/mock-dashboard";
import type { ContentChannel } from "@/types/content";
import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { formatShortDate } from "@/lib/formatters";

const CHANNEL_LABELS: Record<ContentChannel, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  blog: "Blog",
  newsletter: "Newsletter",
  x: "X",
  short_video: "Short Video",
};

interface ScheduledContentPreviewProps {
  items: readonly ScheduledContentItem[];
  section: DashboardSectionCopy;
}

export function ScheduledContentPreview({
  items,
  section,
}: ScheduledContentPreviewProps) {
  return (
    <SurfaceCard className="flex h-full min-h-0 flex-col">
      <div className="luxe-card-header mb-6 shrink-0 flex items-start justify-between gap-4 pb-5">
        <div>
          <p className="luxe-eyebrow">
            {section.eyebrow}
          </p>
          <h2 className="luxe-section-title mt-2">
            {section.title}
          </h2>
        </div>
        <span className="luxe-count-pill px-3 py-1 text-xs font-medium uppercase tracking-[0.14em]">
          {items.length} Items
        </span>
      </div>

      <div className="luxe-scroll-panel flex-1 space-y-5 pr-1">
        {items.map((item) => {
          const { month, day } = formatShortDate(item.scheduledFor);
          return (
          <article className="grid grid-cols-[56px_1fr] gap-4" key={item.id}>
            <div className="luxe-date-tile px-2 py-3 text-center">
              <span className="luxe-date-month block text-xs font-medium uppercase tracking-[0.14em]">
                {month}
              </span>
              <span className="luxe-date-day mt-1 block text-2xl leading-none">
                {day}
              </span>
            </div>

            <div className="luxe-subtle-divider border-b pb-5 last:border-b-0">
              <h3 className="luxe-item-title text-base">
                {item.title}
              </h3>
              <p className="luxe-item-meta mt-1 text-sm">{CHANNEL_LABELS[item.channel]}</p>
              <div className="mt-3">
                <StatusIndicator
                  label={item.status.label}
                  tone={item.status.tone}
                />
              </div>
            </div>
          </article>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
