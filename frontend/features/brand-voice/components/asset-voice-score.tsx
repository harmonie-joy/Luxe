import type { AssetVoiceScore } from "@/types/brand-profile";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDisplayDate } from "@/lib/formatters";

interface AssetVoiceScoreCardProps {
  score: AssetVoiceScore | null;
  brandProfileName: string;
}

export function AssetVoiceScoreCard({
  score,
  brandProfileName,
}: AssetVoiceScoreCardProps) {
  /* ── Empty state ─────────────────────────────────────────── */
  if (!score) {
    return (
      <SurfaceCard className="flex flex-col gap-4">
        <div className="luxe-card-header pb-5">
          <p className="luxe-eyebrow">Voice Preview</p>
          <h2 className="luxe-section-title mt-2">Brand Voice Score</h2>
        </div>

        <div className="flex flex-col items-center gap-4 py-12 text-center">
          {/* Placeholder ring */}
          <div className="luxe-preview-stat flex h-20 w-20 items-center justify-center rounded-full">
            <span className="luxe-serif text-3xl text-(--color-text-muted)">
              —
            </span>
          </div>
          <div className="max-w-52">
            <p className="text-sm font-medium text-luxe-text-primary">
              Not yet analyzed
            </p>
            <p className="luxe-form-help mt-1">
              Run the analysis below to see how well this sample aligns with{" "}
              <span className="font-medium text-luxe-text-secondary">
                {brandProfileName}
              </span>
              .
            </p>
          </div>
        </div>
      </SurfaceCard>
    );
  }

  /* ── Score color coding (design ref: traffic light indicators) ── */
  const overallColorClass =
    score.overallScore >= 80
      ? "text-luxe-success"
      : score.overallScore >= 60
        ? "text-luxe-warning"
        : "text-luxe-danger";

  const flaggedColorClass =
    score.flaggedPhraseCount === 0 ? "text-luxe-success" : "text-luxe-warning";

  return (
    <SurfaceCard className="flex flex-col gap-6">
      <div className="luxe-card-header pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="luxe-eyebrow">Voice Preview</p>
            <h2 className="luxe-section-title mt-2">Brand Voice Score</h2>
          </div>
        </div>
      </div>

      {/* Overall score — display-lg treatment, Libre Caslon */}
      <div>
        <p className="luxe-form-help">Overall alignment</p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={`luxe-serif text-5xl font-normal leading-none ${overallColorClass}`}>
            {score.overallScore}
          </span>
          <span className="luxe-serif text-2xl text-(--color-text-muted)">
            /100
          </span>
        </div>
        <p className="luxe-form-help mt-2">
          Analyzed {formatDisplayDate(score.analyzedAt)}
        </p>
      </div>

      {/* Metric tiles — same 3-column grid pattern as brand-profile-preview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        <div className="luxe-preview-stat p-4">
          <p className="luxe-form-help">Tone alignment</p>
          <p className="luxe-serif mt-2 text-3xl text-luxe-brand">
            {score.toneAlignmentScore}%
          </p>
        </div>
        <div className="luxe-preview-stat p-4">
          <p className="luxe-form-help">Vocabulary match</p>
          <p className="luxe-serif mt-2 text-3xl text-luxe-success">
            {score.vocabularyMatchScore}%
          </p>
        </div>
        <div className="luxe-preview-stat p-4">
          <p className="luxe-form-help">Flagged phrases</p>
          <p className={`luxe-serif mt-2 text-3xl ${flaggedColorClass}`}>
            {score.flaggedPhraseCount}
          </p>
        </div>
      </div>

      {/* Profile reference */}
      <div className="border-t border-luxe-border pt-4">
        <p className="luxe-label-sm">Compared against</p>
        <p className="mt-1 text-sm font-medium text-luxe-text-primary">
          {brandProfileName}
        </p>
      </div>
    </SurfaceCard>
  );
}
