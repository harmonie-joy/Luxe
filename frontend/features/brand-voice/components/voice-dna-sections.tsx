"use client";

import { useState } from "react";

import {
  AUDIENCE_MATURITY_LABELS,
  CONTENT_CHANNEL_LABELS,
} from "@/lib/formatters";
import type {
  AudienceSegment,
  BrandProfile,
  BrandVoice,
  ChannelStyle,
  VoiceExample,
} from "@/types/brand-profile";

import { ToneMeter, TONE_DIMENSIONS } from "./tone-meter";

// Read-only displays for the Voice DNA tabs. Voice is extracted from samples;
// nothing on this screen edits it.

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="luxe-preview-stat p-4 text-sm">{children}</p>;
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="luxe-form-help">{label}</p>
      <div className="mt-2 text-sm leading-6 text-luxe-text-secondary">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Tone
// ---------------------------------------------------------------------------

export function ToneSection({ voice }: { voice: BrandVoice }) {
  const styleRows = [
    ["Point of view", voice.pointOfView],
    ["Sentence style", voice.sentenceStyle],
    ["Pacing", voice.pacing],
    ["Proof style", voice.proofStyle],
  ].filter(([, value]) => value);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {TONE_DIMENSIONS.map((dim) => (
          <ToneMeter
            high={dim.high}
            key={dim.key}
            label={dim.label}
            low={dim.low}
            value={voice.tone[dim.key]}
          />
        ))}
      </div>

      {voice.toneTags.length > 0 ? (
        <FieldBlock label="Tone tags">
          <div className="flex flex-wrap gap-2">
            {voice.toneTags.map((tag) => (
              <span className="luxe-count-pill px-3 py-1 text-xs font-medium" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </FieldBlock>
      ) : null}

      {styleRows.length > 0 ? (
        <div className="luxe-list-divider">
          {styleRows.map(([label, value]) => (
            <div className="py-3" key={label}>
              <p className="luxe-item-title text-sm">{label}</p>
              <p className="luxe-item-meta mt-1 text-sm">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {voice.extractionNotes ? (
        <details className="luxe-preview-stat p-4">
          <summary className="luxe-form-label cursor-pointer">
            Extraction evidence
          </summary>
          <p className="mt-2 text-sm leading-6 text-luxe-text-secondary">
            {voice.extractionNotes}
          </p>
        </details>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Positioning (lives on BrandProfile, shown read-only alongside the voice)
// ---------------------------------------------------------------------------

export function PositioningSection({ profile }: { profile: BrandProfile }) {
  const hasAny =
    profile.category ||
    profile.keyBenefit ||
    profile.differentiators.length > 0 ||
    profile.reasonsToBelieve.length > 0 ||
    profile.knownFor;

  if (!hasAny) {
    return (
      <EmptyNote>
        Positioning has not been extracted yet. Run an extraction from your samples.
      </EmptyNote>
    );
  }

  return (
    <div className="space-y-6">
      {profile.category ? (
        <FieldBlock label="Category">
          <span className="luxe-count-pill px-3 py-1 text-xs font-medium">
            {profile.category}
          </span>
        </FieldBlock>
      ) : null}

      {profile.keyBenefit ? (
        <FieldBlock label="Key benefit">
          <blockquote className="luxe-preview-stat p-4 text-sm leading-6">
            {profile.keyBenefit}
          </blockquote>
        </FieldBlock>
      ) : null}

      {profile.differentiators.length > 0 ? (
        <FieldBlock label="Differentiators">
          <ul className="list-disc space-y-1 pl-5">
            {profile.differentiators.map((diff) => (
              <li key={diff.claim}>
                {diff.claim}
                {diff.vs ? (
                  <span className="luxe-item-meta"> — vs {diff.vs}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </FieldBlock>
      ) : null}

      {profile.reasonsToBelieve.length > 0 ? (
        <FieldBlock label="Reasons to believe">
          <BulletList items={profile.reasonsToBelieve} />
        </FieldBlock>
      ) : null}

      {profile.knownFor ? (
        <FieldBlock label="Known for">{profile.knownFor}</FieldBlock>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audience segments
// ---------------------------------------------------------------------------

export function SegmentsSection({
  segments,
}: {
  segments: readonly AudienceSegment[];
}) {
  if (segments.length === 0) {
    return <EmptyNote>No audience segments defined for this brand yet.</EmptyNote>;
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <details className="luxe-preview-stat" key={segment.id}>
          <summary className="cursor-pointer p-4">
            <div className="inline-flex flex-wrap items-center gap-3">
              <span className="luxe-item-title text-sm">{segment.name}</span>
              {segment.isPrimary ? (
                <span className="luxe-count-pill px-3 py-1 text-xs font-medium">
                  Primary
                </span>
              ) : null}
              <span className="luxe-item-meta text-xs">
                {segment.buyerType} · {AUDIENCE_MATURITY_LABELS[segment.maturityLevel]}
              </span>
            </div>
          </summary>
          <div className="luxe-subtle-divider space-y-4 border-t p-4">
            {segment.pains.length > 0 ? (
              <FieldBlock label="Pains">
                <BulletList items={segment.pains} />
              </FieldBlock>
            ) : null}
            {segment.desiredOutcomes.length > 0 ? (
              <FieldBlock label="Desired outcomes">
                <BulletList items={segment.desiredOutcomes} />
              </FieldBlock>
            ) : null}
            <ToneMeter
              compact
              label="Jargon tolerance"
              value={segment.jargonTolerance}
            />
            {segment.objections.length > 0 ? (
              <FieldBlock label="Objections">
                <BulletList items={segment.objections} />
              </FieldBlock>
            ) : null}
            {segment.notes ? <FieldBlock label="Notes">{segment.notes}</FieldBlock> : null}
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Channel styles
// ---------------------------------------------------------------------------

const CHANNEL_DELTA_BY_DIMENSION = {
  funny: "toneFunnyDelta",
  casual: "toneCasualDelta",
  irreverent: "toneIrreverentDelta",
  enthusiastic: "toneEnthusiasticDelta",
} as const;

export function ChannelStylesSection({
  channelStyles,
  voice,
}: {
  channelStyles: readonly ChannelStyle[];
  voice: BrandVoice | null;
}) {
  if (channelStyles.length === 0) {
    return <EmptyNote>No channel style overrides defined for this brand yet.</EmptyNote>;
  }

  return (
    <div className="space-y-3">
      {channelStyles.map((style) => {
        const norms = [
          ["Target length", style.targetLength],
          ["Structure", style.structureNorms],
          ["Emoji", style.emojiPolicy],
          ["Hashtags", style.hashtagPolicy],
          ["CTA style", style.ctaStyle],
        ].filter(([, value]) => value);

        return (
          <details className="luxe-preview-stat" key={style.id}>
            <summary className="cursor-pointer p-4">
              <div className="inline-flex flex-wrap items-center gap-3">
                <span className="luxe-item-title text-sm">
                  {CONTENT_CHANNEL_LABELS[style.channel]}
                </span>
                {style.targetLength ? (
                  <span className="luxe-item-meta text-xs">{style.targetLength}</span>
                ) : null}
              </div>
            </summary>
            <div className="luxe-subtle-divider space-y-4 border-t p-4">
              {voice ? (
                <div>
                  <p className="luxe-form-help">
                    Tone on this channel (base voice + delta)
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {TONE_DIMENSIONS.map((dim) => (
                      <ToneMeter
                        compact
                        delta={style[CHANNEL_DELTA_BY_DIMENSION[dim.key]]}
                        key={dim.key}
                        label={dim.label}
                        value={voice.tone[dim.key]}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="luxe-list-divider">
                {norms.map(([label, value]) => (
                  <div className="py-2" key={label}>
                    <p className="luxe-item-title text-sm">{label}</p>
                    <p className="luxe-item-meta mt-1 text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voice examples (do / don't)
// ---------------------------------------------------------------------------

function ExampleCard({ example }: { example: VoiceExample }) {
  return (
    <article
      className={`luxe-preview-stat border-l-2 p-4 ${
        example.kind === "do" ? "border-l-luxe-success" : "border-l-luxe-danger"
      }`}
    >
      <p className="text-sm leading-6 text-luxe-text-primary">{example.text}</p>
      <p className="luxe-item-meta mt-2 text-sm">{example.annotation}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        {example.channel ? (
          <span className="luxe-count-pill px-3 py-1 text-xs font-medium">
            {CONTENT_CHANNEL_LABELS[example.channel]}
          </span>
        ) : (
          <span />
        )}
        <button
          className="luxe-secondary-action luxe-focus-ring rounded-sm px-3 py-1.5 text-xs font-medium"
          onClick={() => void navigator.clipboard.writeText(example.text)}
          type="button"
        >
          Copy
        </button>
      </div>
    </article>
  );
}

export function ExamplesSection({
  examples,
}: {
  examples: readonly VoiceExample[];
}) {
  const [channelFilter, setChannelFilter] = useState("all");

  if (examples.length === 0) {
    return (
      <EmptyNote>
        No voice examples on this version yet. Extract a new version to generate
        do/don&apos;t patterns.
      </EmptyNote>
    );
  }

  const channels = Array.from(
    new Set(examples.map((example) => example.channel).filter(Boolean)),
  ) as Exclude<VoiceExample["channel"], "">[];
  const filtered =
    channelFilter === "all"
      ? examples
      : examples.filter((example) => example.channel === channelFilter);
  const doExamples = filtered.filter((example) => example.kind === "do");
  const dontExamples = filtered.filter((example) => example.kind === "dont");

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-3">
        <span className="luxe-form-label">Channel</span>
        <select
          className="luxe-field px-3 py-2 text-sm"
          onChange={(event) => setChannelFilter(event.target.value)}
          value={channelFilter}
        >
          <option value="all">All channels</option>
          {channels.map((channel) => (
            <option key={channel} value={channel}>
              {CONTENT_CHANNEL_LABELS[channel]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="luxe-status-badge luxe-status-badge--success text-sm font-semibold">
            Do — {doExamples.length}
          </p>
          {doExamples.map((example) => (
            <ExampleCard example={example} key={example.id} />
          ))}
        </div>
        <div className="space-y-3">
          <p className="luxe-status-badge luxe-status-badge--critical text-sm font-semibold">
            Don&apos;t — {dontExamples.length}
          </p>
          {dontExamples.map((example) => (
            <ExampleCard example={example} key={example.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
