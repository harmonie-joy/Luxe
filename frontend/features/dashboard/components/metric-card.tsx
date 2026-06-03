import type { DashboardMetric } from "@/data/mock-dashboard";
import { SurfaceCard } from "@/components/ui/surface-card";

interface MetricCardProps {
  metric: DashboardMetric;
}

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <SurfaceCard
      className={classNames(
        "luxe-metric-card group relative min-h-40 overflow-hidden",
        `luxe-metric-card--${metric.tone}`,
      )}
      padding="none"
    >
      <span className="luxe-metric-accent absolute inset-y-0 left-0 w-1" />
      <div className="flex h-full flex-col justify-between gap-8 p-6 pl-8">
        <p className="luxe-metric-label text-xs font-medium uppercase tracking-[0.18em]">
          {metric.label}
        </p>

        <div className="flex items-end justify-between gap-4">
          <span className="luxe-metric-value text-6xl leading-none tracking-[-0.04em]">
            {metric.value}
          </span>
          <span className="luxe-metric-detail text-sm font-medium">
            {metric.detail}
          </span>
        </div>
      </div>
    </SurfaceCard>
  );
}
