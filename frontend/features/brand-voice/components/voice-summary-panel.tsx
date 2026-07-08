import Link from "next/link";

import { StatusIndicator } from "@/components/ui/status-indicator";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDisplayDate } from "@/lib/formatters";
import { APP_ROUTES } from "@/lib/routes";
import type {
  AudienceSegment,
  BrandProfile,
  BrandVoice,
  VoiceExample,
} from "@/types/brand-profile";

import { ToneMeter, TONE_DIMENSIONS } from "./tone-meter";

const PREVIEW_LIMIT = 4;

interface VoiceSummaryPanelProps {
  profile: BrandProfile;
  /** The active voice version, or null if none has been extracted yet. */
  voice: BrandVoice | null;
  segments: readonly AudienceSegment[];
  /** Examples belonging to the active voice. */
  examples: readonly VoiceExample[];
}

/** Right panel: at-a-glance profile of the active brand voice. */
export function VoiceSummaryPanel({
  profile,
  voice,
  segments,
  examples,
}: VoiceSummaryPanelProps) {
  const primarySegment = segments.find((segment) => segment.isPrimary) ?? segments[0];
  const doCount = examples.filter((example) => example.kind === "do").length;
  const dontCount = examples.length - doCount;

  return (
    <SurfaceCard className="flex flex-col self-start">
      <div className="luxe-card-header pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="luxe-eyebrow">Active Voice</p>
            <h2 className="luxe-section-title mt-2">Brand Voice Profile</h2>
          </div>
          <StatusIndicator
            label={voice ? "Ready to draft" : "Ready to review"}
            tone={voice ? "success" : "warning"}
          />
        </div>
      </div>

      {!voice ? (
        <p className="luxe-preview-stat mt-6 p-4 text-sm">
          No active voice version yet. Extract one from your samples to unlock
          drafting.
        </p>
      ) : (
        <div className="space-y-6 pt-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="luxe-count-pill px-3 py-1 text-xs font-medium">
                v{voice.version}
              </span>
              <h3 className="luxe-serif text-3xl leading-none text-luxe-brand">
                {profile.name}
              </h3>
            </div>
            <p className="luxe-item-meta mt-3 text-sm">
              Confidence {voice.extractionConfidence}%
              {voice.extractedFrom.length > 0
                ? ` · Extracted from ${voice.extractedFrom.length} samples`
                : ""}{" "}
              · Updated {formatDisplayDate(voice.createdAt)}
            </p>
          </div>

          <div>
            <p className="luxe-form-help">Voice summary</p>
            <p className="mt-2 text-sm leading-6 text-luxe-text-secondary">
              {voice.voiceSummary}
            </p>
          </div>

          <div className="space-y-3">
            <p className="luxe-form-help">Tone</p>
            {TONE_DIMENSIONS.map((dim) => (
              <ToneMeter
                compact
                key={dim.key}
                label={dim.label}
                value={voice.tone[dim.key]}
              />
            ))}
            {voice.toneTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {voice.toneTags.map((tag) => (
                  <span
                    className="luxe-count-pill px-3 py-1 text-xs font-medium"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {profile.keyBenefit || profile.differentiators.length > 0 ? (
            <div>
              <p className="luxe-form-help">Positioning</p>
              {profile.keyBenefit ? (
                <p className="mt-2 text-sm leading-6 text-luxe-text-secondary">
                  {profile.keyBenefit}
                </p>
              ) : null}
              {profile.differentiators[0] ? (
                <p className="luxe-item-meta mt-1 text-sm">
                  {profile.differentiators[0].claim}
                </p>
              ) : null}
            </div>
          ) : null}

          {primarySegment ? (
            <div>
              <p className="luxe-form-help">Primary segment</p>
              <p className="mt-2 text-sm leading-6 text-luxe-text-secondary">
                {primarySegment.name}
                <span className="luxe-item-meta"> · {primarySegment.buyerType}</span>
              </p>
            </div>
          ) : null}

          <div className="luxe-preview-stat p-4">
            <p className="luxe-form-help">Examples</p>
            <p className="mt-2 text-sm text-luxe-text-secondary">
              <span className="luxe-status-badge luxe-status-badge--success">
                {doCount} Do
              </span>
              <span className="luxe-status-badge luxe-status-badge--critical ml-4">
                {dontCount} Don&apos;t
              </span>
            </p>
          </div>

          {voice.preferredVocabulary.length > 0 ? (
            <div>
              <p className="luxe-form-help">Preferred vocabulary</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {voice.preferredVocabulary.slice(0, PREVIEW_LIMIT).map((rule) => (
                  <span
                    className="luxe-count-pill px-3 py-1 text-xs font-medium"
                    key={rule.term}
                  >
                    {rule.term}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {voice.bannedPhrases.length > 0 ? (
            <div>
              <p className="luxe-form-help">Banned phrases</p>
              <div className="luxe-list-divider mt-2">
                {voice.bannedPhrases.slice(0, PREVIEW_LIMIT).map((phrase) => (
                  <p
                    className="luxe-status-badge luxe-status-badge--critical py-2 text-sm"
                    key={phrase.phrase}
                  >
                    {phrase.phrase}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="luxe-subtle-divider border-t pt-5">
            <p className="luxe-form-help">Ready to create content?</p>
            <Link
              className="luxe-primary-action luxe-focus-ring mt-3 inline-block rounded-sm px-5 py-3 text-sm font-semibold"
              href={APP_ROUTES.create}
            >
              Create content
            </Link>
          </div>
        </div>
      )}
    </SurfaceCard>
  );
}
