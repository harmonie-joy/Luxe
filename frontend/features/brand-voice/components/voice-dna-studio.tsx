"use client";

import { useEffect, useState } from "react";

import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  mockAudienceSegments,
  mockBrandVoices,
  mockChannelStyles,
  mockVoiceExamples,
} from "@/data/mock-brand-profiles";
import {
  activateBrandVoice,
  getAudienceSegments,
  getBrandProfile,
  getBrandVoices,
  getChannelStyles,
  getVoiceExamples,
} from "@/lib/api/brand-voice";
import { ApiError } from "@/lib/api/http-client";
import { formatDisplayDate } from "@/lib/formatters";
import type {
  AudienceSegment,
  BrandAsset,
  BrandProfile,
  BrandVoice,
  ChannelStyle,
  VoiceExample,
} from "@/types/brand-profile";

import { BrandVoiceAiPanel } from "./brand-voice-ai-panel";
import {
  ChannelStylesSection,
  ExamplesSection,
  PositioningSection,
  SegmentsSection,
  ToneSection,
} from "./voice-dna-sections";
import { VoiceSummaryPanel } from "./voice-summary-panel";

type StudioTab =
  | "extraction"
  | "tone"
  | "positioning"
  | "segments"
  | "channels"
  | "examples";

const TABS: readonly { id: StudioTab; label: string }[] = [
  { id: "extraction", label: "Extraction" },
  { id: "tone", label: "Tone" },
  { id: "positioning", label: "Positioning" },
  { id: "segments", label: "Segments" },
  { id: "channels", label: "Channels" },
  { id: "examples", label: "Examples" },
];

interface VoiceDnaData {
  voices: readonly BrandVoice[];
  segments: readonly AudienceSegment[];
  channelStyles: readonly ChannelStyle[];
  /** Examples for the active voice version. */
  examples: readonly VoiceExample[];
}

interface VoiceDnaStudioProps {
  profile: BrandProfile;
  samples: readonly BrandAsset[];
  source: "api" | "mock";
  onProfileSaved: (profile: BrandProfile) => void;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return `API error ${error.status}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return "The request failed. Please try again.";
}

function byVersionDesc(a: BrandVoice, b: BrandVoice) {
  return b.version - a.version;
}

async function loadVoiceDna(brandProfileId: string): Promise<VoiceDnaData> {
  const [voices, segments, channelStyles] = await Promise.all([
    getBrandVoices(brandProfileId),
    getAudienceSegments(brandProfileId),
    getChannelStyles(brandProfileId),
  ]);
  const sorted = [...voices].sort(byVersionDesc);
  const activeVoice = sorted.find((voice) => voice.isActive);
  const examples = activeVoice ? await getVoiceExamples(activeVoice.id) : [];
  return { voices: sorted, segments, channelStyles, examples };
}

const MOCK_DNA: VoiceDnaData = {
  voices: [...mockBrandVoices].sort(byVersionDesc),
  segments: mockAudienceSegments,
  channelStyles: mockChannelStyles,
  examples: mockVoiceExamples,
};

/**
 * Brand Voice Studio: left panel drives the workflow (extract → review a
 * version → activate); right panel shows the active voice at a glance.
 * All voice fields are read-only here — voice is extracted, never hand-edited.
 */
export function VoiceDnaStudio({
  profile,
  samples,
  source,
  onProfileSaved,
}: VoiceDnaStudioProps) {
  const [dna, setDna] = useState<VoiceDnaData | null>(
    source === "mock" ? MOCK_DNA : null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [tab, setTab] = useState<StudioTab>("tone");
  const [isActivating, setIsActivating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (source === "mock") {
      setDna(MOCK_DNA);
      return;
    }

    let isMounted = true;

    loadVoiceDna(profile.id)
      .then((data) => {
        if (isMounted) {
          setDna(data);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setDna({ voices: [], segments: [], channelStyles: [], examples: [] });
          setLoadError(getErrorMessage(err));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [source, profile.id, refreshKey]);

  const voices = dna?.voices ?? [];
  const activeVoice = voices.find((voice) => voice.isActive) ?? null;
  // Tabs and the summary always show the active (or latest) voice; the
  // selector only drives the version detail card + activate action.
  const displayedVoice = activeVoice ?? voices[0] ?? null;
  const selectedVoice =
    voices.find((voice) => voice.id === selectedVoiceId) ?? displayedVoice;

  async function handleActivate(voice: BrandVoice) {
    setNotice(null);
    setActionError(null);

    if (source === "mock") {
      console.info(`[mock] POST /api/brand-voices/${voice.id}/activate/`);
      setDna((current) =>
        current
          ? {
              ...current,
              voices: current.voices.map((v) => ({
                ...v,
                isActive: v.id === voice.id,
              })),
            }
          : current,
      );
      setNotice(`Voice v${voice.version} is now active (demo).`);
      return;
    }

    setIsActivating(true);
    try {
      await activateBrandVoice(voice.id);
      const refreshedProfile = await getBrandProfile(profile.id);
      onProfileSaved(refreshedProfile);
      setRefreshKey((key) => key + 1);
      setNotice(`Voice v${voice.version} is now active for this profile.`);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsActivating(false);
    }
  }

  const extractedFromTitles = (selectedVoice?.extractedFrom ?? []).map(
    (assetId) => samples.find((sample) => sample.id === assetId)?.title ?? assetId,
  );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex min-w-0 flex-col gap-6">
        <SurfaceCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="luxe-eyebrow">Voice Studio</p>
              <h2 className="luxe-section-title mt-2">{profile.name}</h2>
            </div>
            {loadError ? (
              <StatusIndicator label="Voice data unavailable" tone="warning" />
            ) : null}
          </div>

          {voices.length === 0 ? (
            <p className="luxe-preview-stat mt-5 p-4 text-sm">
              No voice versions yet. Select samples in the Extraction tab to
              extract your first version.
              {loadError ? ` (${loadError})` : ""}
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              <label className="flex flex-wrap items-center gap-3">
                <span className="luxe-form-label">Version</span>
                <select
                  className="luxe-field px-3 py-2 text-sm"
                  onChange={(event) => setSelectedVoiceId(event.target.value)}
                  value={selectedVoice?.id ?? ""}
                >
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      v{voice.version}
                      {voice.isActive ? " · Active" : ""} ·{" "}
                      {formatDisplayDate(voice.createdAt)} · confidence{" "}
                      {voice.extractionConfidence}%
                    </option>
                  ))}
                </select>
              </label>

              {selectedVoice ? (
                <div className="luxe-preview-stat space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="luxe-count-pill px-3 py-1 text-xs font-medium">
                      v{selectedVoice.version}
                    </span>
                    <StatusIndicator
                      label={selectedVoice.isActive ? "Active" : "Inactive"}
                      tone={selectedVoice.isActive ? "success" : "neutral"}
                    />
                    <span className="luxe-item-meta text-xs">
                      Confidence {selectedVoice.extractionConfidence}% ·{" "}
                      {formatDisplayDate(selectedVoice.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-luxe-text-secondary">
                    {selectedVoice.voiceSummary}
                  </p>
                  {extractedFromTitles.length > 0 ? (
                    <p className="luxe-item-meta text-sm">
                      Extracted from: {extractedFromTitles.join(", ")}
                    </p>
                  ) : null}
                  {selectedVoice.extractionNotes ? (
                    <details>
                      <summary className="luxe-form-label cursor-pointer text-sm">
                        Extraction notes
                      </summary>
                      <p className="mt-2 text-sm leading-6 text-luxe-text-secondary">
                        {selectedVoice.extractionNotes}
                      </p>
                    </details>
                  ) : null}
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      className="luxe-primary-action luxe-focus-ring rounded-sm px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={selectedVoice.isActive || isActivating}
                      onClick={() => void handleActivate(selectedVoice)}
                      type="button"
                    >
                      {selectedVoice.isActive
                        ? "Active version"
                        : isActivating
                          ? "Activating..."
                          : `Activate v${selectedVoice.version}`}
                    </button>
                    <button
                      className="luxe-secondary-action luxe-focus-ring rounded-sm px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      disabled
                      title="Version compare is coming soon"
                      type="button"
                    >
                      Compare with...
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div aria-live="polite" className="mt-4 space-y-3 empty:hidden">
            {notice ? (
              <p className="luxe-preview-stat p-4 text-sm font-medium">{notice}</p>
            ) : null}
            {actionError ? (
              <p className="luxe-status-badge luxe-status-badge--critical luxe-preview-stat p-4 text-sm font-medium">
                {actionError}
              </p>
            ) : null}
          </div>
        </SurfaceCard>

        <nav aria-label="Voice sections" className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              aria-current={tab === item.id}
              className={`${
                tab === item.id ? "luxe-primary-action" : "luxe-secondary-action"
              } luxe-focus-ring rounded-full px-4 py-2 text-sm font-medium`}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "extraction" ? (
          <BrandVoiceAiPanel
            onProfileSaved={onProfileSaved}
            onVoiceChanged={() => setRefreshKey((key) => key + 1)}
            profile={profile}
            samples={samples}
            source={source}
          />
        ) : (
          <SurfaceCard>
            {!displayedVoice && (tab === "tone" || tab === "examples") ? (
              <p className="luxe-preview-stat p-4 text-sm">
                Extract a voice version first to see this section.
              </p>
            ) : tab === "tone" && displayedVoice ? (
              <ToneSection voice={displayedVoice} />
            ) : tab === "positioning" ? (
              <PositioningSection profile={profile} />
            ) : tab === "segments" ? (
              <SegmentsSection segments={dna?.segments ?? []} />
            ) : tab === "channels" ? (
              <ChannelStylesSection
                channelStyles={dna?.channelStyles ?? []}
                voice={displayedVoice}
              />
            ) : (
              <ExamplesSection examples={dna?.examples ?? []} />
            )}
          </SurfaceCard>
        )}
      </div>

      <VoiceSummaryPanel
        examples={dna?.examples ?? []}
        profile={profile}
        segments={dna?.segments ?? []}
        voice={activeVoice}
      />
    </div>
  );
}
