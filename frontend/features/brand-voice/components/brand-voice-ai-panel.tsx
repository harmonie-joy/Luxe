"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import {
  analyzeBrandAssets,
  extractBrandVoice,
  type BrandVoiceExtractionSuggestions,
} from "@/lib/api/ai";
import {
  updateBrandProfile,
  type BannedPhraseWritePayload,
  type BrandVocabularyRuleWritePayload,
} from "@/lib/api/brand-voice";
import { ApiError } from "@/lib/api/http-client";
import type {
  BrandAsset,
  BrandProfile,
  BrandVoiceTone,
} from "@/types/brand-profile";

interface BrandVoiceAiPanelProps {
  profile: BrandProfile;
  samples: readonly BrandAsset[];
  source: "api" | "mock";
}

const CANONICAL_TONES: readonly BrandVoiceTone[] = [
  "professional",
  "authoritative",
  "sophisticated",
  "approachable",
  "visionary",
];

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return `API error ${error.status}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return "Brand voice analysis failed. Please try again.";
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "suggestion"
  );
}

export function toCanonicalTones(
  tones: readonly string[],
  fallback: readonly BrandVoiceTone[],
): readonly BrandVoiceTone[] {
  const valid = tones.filter((tone): tone is BrandVoiceTone =>
    CANONICAL_TONES.includes(tone as BrandVoiceTone),
  );
  return valid.length > 0 ? Array.from(new Set(valid)) : fallback;
}

export function toVocabularyPayload(
  suggestions: readonly BrandVoiceExtractionSuggestions["preferred_vocabulary"][number][],
): readonly BrandVocabularyRuleWritePayload[] {
  return suggestions.map((rule, index) => ({
    id: `${slugify(rule.preferred_term)}-${index + 1}`,
    preferred_term: rule.preferred_term,
    restricted_terms: rule.restricted_terms,
    note: rule.note,
  }));
}

export function toBannedPhrasePayload(
  suggestions: readonly BrandVoiceExtractionSuggestions["banned_phrases"][number][],
): readonly BannedPhraseWritePayload[] {
  return suggestions.map((phrase, index) => ({
    id: `${slugify(phrase.phrase)}-${index + 1}`,
    phrase: phrase.phrase,
    reason: phrase.reason,
  }));
}

export function BrandVoiceAiPanel({
  profile,
  samples,
  source,
}: BrandVoiceAiPanelProps) {
  const router = useRouter();
  const [selectedAssetIds, setSelectedAssetIds] = useState(() =>
    samples.map((sample) => sample.id),
  );
  const [suggestions, setSuggestions] =
    useState<BrandVoiceExtractionSuggestions | null>(null);
  const [aiRunId, setAiRunId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previousSampleIdsRef = useRef(new Set(samples.map((sample) => sample.id)));

  useEffect(() => {
    // Reconcile selections with the current samples: drop IDs that no longer
    // exist (e.g. mock IDs after live API hydration), keep the user's choices
    // for surviving IDs, and select newly added samples by default.
    const previousIds = previousSampleIdsRef.current;
    setSelectedAssetIds((current) =>
      samples
        .map((sample) => sample.id)
        .filter((id) => current.includes(id) || !previousIds.has(id)),
    );
    previousSampleIdsRef.current = new Set(samples.map((sample) => sample.id));
  }, [samples]);

  const selectedSamples = useMemo(
    () => samples.filter((sample) => selectedAssetIds.includes(sample.id)),
    [samples, selectedAssetIds],
  );

  function toggleAsset(assetId: string, checked: boolean) {
    setSelectedAssetIds((current) =>
      checked
        ? Array.from(new Set([...current, assetId]))
        : current.filter((id) => id !== assetId),
    );
    setMessage(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (source === "mock") {
      setMessage("Demo mode only. Load live data before running brand voice analysis.");
      setError(null);
      setSuggestions(null);
      setAiRunId(null);
      return;
    }

    if (selectedAssetIds.length === 0) {
      setError("Select at least one sample before analysis.");
      return;
    }

    setIsAnalyzing(true);
    setMessage(null);
    setError(null);

    try {
      const analysis = await analyzeBrandAssets({
        workspace: profile.workspaceId,
        brand_profile: profile.id,
        asset_ids: selectedAssetIds,
      });
      const result = await extractBrandVoice({
        workspace: profile.workspaceId,
        brand_profile: profile.id,
        asset_ids: selectedAssetIds,
      });
      setSuggestions(result.suggestions);
      setAiRunId(result.aiRunId);
      if (analysis.warnings.length > 0) {
        setMessage(
          `Brand voice suggestions are ready. ${analysis.warnings
            .map((warning) => warning.message)
            .join(" ")}`,
        );
        return;
      }
      setMessage("Brand voice suggestions are ready for review.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAccept() {
    // Suggestions only exist in api mode; handleAnalyze blocks demo mode.
    if (!suggestions || source !== "api") return;

    setIsAccepting(true);
    setMessage(null);
    setError(null);

    try {
      await updateBrandProfile(profile.id, {
        audience: suggestions.audience,
        tone: toCanonicalTones(suggestions.tone, profile.tone),
        preferred_vocabulary: toVocabularyPayload(suggestions.preferred_vocabulary),
        banned_phrases: toBannedPhrasePayload(suggestions.banned_phrases),
        positioning_notes: suggestions.positioning_notes,
      });
      router.refresh();
      setMessage("Suggestions accepted and profile updated.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <SurfaceCard className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="luxe-eyebrow">AI Suggestions</p>
          <h2 className="luxe-section-title mt-2">Brand Voice Extraction</h2>
          <p className="luxe-form-help mt-2">
            Analyze selected reference samples and review suggested profile updates.
          </p>
        </div>
        <StatusIndicator
          label={source === "mock" ? "Demo" : "Live"}
          tone={source === "mock" ? "neutral" : "info"}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="luxe-form-label">Samples to analyze</p>
          <span className="luxe-count-pill px-3 py-1 text-xs font-medium">
            {selectedSamples.length} selected
          </span>
        </div>

        {samples.length === 0 ? (
          <p className="luxe-preview-stat p-4 text-sm">
            Add sample content before running brand voice analysis.
          </p>
        ) : (
          <div className="grid gap-2">
            {samples.map((sample) => (
              <label
                className="luxe-chip flex items-start gap-3 rounded-sm px-4 py-3"
                key={sample.id}
              >
                <input
                  checked={selectedAssetIds.includes(sample.id)}
                  className="mt-1"
                  onChange={(event) => toggleAsset(sample.id, event.target.checked)}
                  type="checkbox"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{sample.title}</span>
                  <span className="luxe-chip-description mt-1 block text-xs leading-5">
                    {sample.mediaType.replace("_", " ")} · {sample.format || "Sample"}
                    {sample.wordCount > 0 ? ` · ${sample.wordCount} words` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className="luxe-primary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isAnalyzing || samples.length === 0}
          onClick={handleAnalyze}
          type="button"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Brand Voice"}
        </button>
        {aiRunId ? (
          <p className="luxe-form-help">
            Run: <code>{aiRunId}</code>
          </p>
        ) : null}
      </div>

      <div aria-live="polite" className="space-y-3">
        {message ? (
          <p className="luxe-preview-stat p-4 text-sm font-medium">{message}</p>
        ) : null}
        {error ? (
          <p className="luxe-preview-stat p-4 text-sm font-medium text-luxe-danger">
            {error}
          </p>
        ) : null}
      </div>

      {suggestions ? (
        <div className="space-y-5 border-t border-(--color-border-subtle) pt-6">
          <div>
            <p className="luxe-form-help">Suggested audience</p>
            <p className="mt-2 text-sm leading-6 text-luxe-text-secondary">
              {suggestions.audience}
            </p>
          </div>

          <div>
            <p className="luxe-form-help">Suggested tones</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.tone.map((tone) => (
                <span className="luxe-count-pill px-3 py-1 text-xs font-medium" key={tone}>
                  {tone}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="luxe-form-help">Preferred vocabulary</p>
              <div className="luxe-list-divider mt-3">
                {suggestions.preferred_vocabulary.map((rule) => (
                  <article className="py-3" key={rule.preferred_term}>
                    <h3 className="luxe-item-title text-sm">{rule.preferred_term}</h3>
                    <p className="luxe-item-meta mt-1 text-sm">
                      Avoid {rule.restricted_terms.join(", ") || "none"}
                    </p>
                    {rule.note ? (
                      <p className="mt-2 text-sm leading-6">{rule.note}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>

            <div>
              <p className="luxe-form-help">Banned phrases</p>
              <div className="luxe-list-divider mt-3">
                {suggestions.banned_phrases.map((phrase) => (
                  <article className="py-3" key={phrase.phrase}>
                    <h3 className="luxe-item-title text-sm">{phrase.phrase}</h3>
                    <p className="luxe-item-meta mt-1 text-sm">{phrase.reason}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="luxe-form-help">Positioning notes</p>
            <p className="mt-2 text-sm leading-6 text-luxe-text-secondary">
              {suggestions.positioning_notes}
            </p>
          </div>

          <button
            className="luxe-secondary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isAccepting}
            onClick={handleAccept}
            type="button"
          >
            {isAccepting ? "Accepting..." : "Accept Suggestions"}
          </button>
        </div>
      ) : null}
    </SurfaceCard>
  );
}
