import type { BrandVoiceToneSliders } from "@/types/brand-profile";

/** NN/g tone-of-voice dimensions with their 0/100 scale endpoints. */
export const TONE_DIMENSIONS = [
  { key: "funny", label: "Funny", low: "Serious", high: "Funny" },
  { key: "casual", label: "Casual", low: "Formal", high: "Casual" },
  { key: "irreverent", label: "Irreverent", low: "Respectful", high: "Irreverent" },
  {
    key: "enthusiastic",
    label: "Enthusiastic",
    low: "Matter-of-fact",
    high: "Enthusiastic",
  },
] as const satisfies readonly {
  key: keyof BrandVoiceToneSliders;
  label: string;
  low: string;
  high: string;
}[];

export function clampTone(value: number): number {
  return Math.min(100, Math.max(0, value));
}

interface ToneMeterProps {
  label: string;
  /** Base tone value, 0-100. */
  value: number;
  low?: string;
  high?: string;
  /** Channel delta; when set, the bar shows the clamped effective value. */
  delta?: number;
  compact?: boolean;
}

/**
 * Read-only tone bar. Voice tone is extracted from samples, never edited
 * here, so this is a meter rather than a range input.
 */
export function ToneMeter({ label, value, low, high, delta, compact }: ToneMeterProps) {
  const effective = delta === undefined ? clampTone(value) : clampTone(value + delta);
  const valueText =
    delta === undefined
      ? `${effective} / 100`
      : `${clampTone(value)} ${delta < 0 ? "−" : "+"} ${Math.abs(delta)} → ${effective}`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className={compact ? "luxe-form-help" : "luxe-form-label"}>{label}</span>
        <span className="luxe-item-meta text-xs tabular-nums">{valueText}</span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={effective}
        className={`mt-2 overflow-hidden rounded-full bg-(--color-surface-strong) ${
          compact ? "h-1" : "h-1.5"
        }`}
        role="meter"
      >
        <div
          className="luxe-transition h-full rounded-full bg-luxe-brand"
          style={{ width: `${effective}%` }}
        />
      </div>
      {!compact && low && high ? (
        <div className="mt-1.5 flex justify-between gap-4">
          <span className="luxe-form-help text-xs">0 · {low}</span>
          <span className="luxe-form-help text-xs">100 · {high}</span>
        </div>
      ) : null}
    </div>
  );
}
