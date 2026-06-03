import type { DashboardData } from "@/data/mock-dashboard";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { ReviewQueue } from "@/features/dashboard/components/review-queue";
import { ScheduledContentPreview } from "@/features/dashboard/components/scheduled-content-preview";

interface DashboardOverviewProps {
  dashboard: DashboardData;
}

export function DashboardOverview({ dashboard }: DashboardOverviewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-8">
      <header className="shrink-0 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="luxe-eyebrow">
            {dashboard.pageHeader.eyebrow}
          </p>
          <h1 className="luxe-page-title mt-3 max-w-3xl">
            {dashboard.pageHeader.title}
          </h1>
          <p className="luxe-page-description mt-4 max-w-2xl">
            {dashboard.pageHeader.description}
          </p>
        </div>

        <div className="luxe-card inline-flex w-fit rounded-full px-4 py-2">
          <StatusIndicator
            label={dashboard.systemStatus.label}
            tone={dashboard.systemStatus.tone}
          />
        </div>
      </header>

      <section
        aria-label="Dashboard metrics"
        className="shrink-0 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {dashboard.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ReviewQueue
          items={dashboard.reviewQueue}
          section={dashboard.reviewQueueSection}
        />
        <ScheduledContentPreview
          items={dashboard.scheduledContent}
          section={dashboard.scheduledContentSection}
        />
      </div>
    </div>
  );
}
