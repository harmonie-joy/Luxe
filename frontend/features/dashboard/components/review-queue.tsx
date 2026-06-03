import type {
  DashboardSectionCopy,
  ReviewQueueItem,
} from "@/data/mock-dashboard";
import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface ReviewQueueProps {
  items: readonly ReviewQueueItem[];
  section: DashboardSectionCopy;
}

export function ReviewQueue({ items, section }: ReviewQueueProps) {
  return (
    <SurfaceCard padding="none">
      <div className="luxe-card-header px-6 py-5">
        <p className="luxe-eyebrow">
          {section.eyebrow}
        </p>
        <h2 className="luxe-section-title mt-2">
          {section.title}
        </h2>
      </div>

      <div className="luxe-list-divider">
        {items.map((item) => (
          <article
            className="luxe-list-row flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
            key={item.id}
          >
            <div>
              <h3 className="luxe-item-title text-base">
                {item.title}
              </h3>
              <p className="luxe-item-meta mt-1 text-sm">
                {item.owner} · {item.submittedAt}
              </p>
            </div>
            <StatusIndicator
              label={item.status.label}
              tone={item.status.tone}
              uppercase
            />
          </article>
        ))}
      </div>
    </SurfaceCard>
  );
}
