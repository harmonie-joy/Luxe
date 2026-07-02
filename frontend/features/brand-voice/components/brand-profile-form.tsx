"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/components/ui/surface-card";
import { ToneSelector } from "@/features/brand-voice/components/tone-selector";
import {
  updateBrandProfile,
  type BannedPhraseWritePayload,
  type BrandVocabularyRuleWritePayload,
} from "@/lib/api/brand-voice";
import { ApiError } from "@/lib/api/http-client";
import type {
  BrandProfile,
  BrandToneOption,
  BrandVoiceTone,
} from "@/types/brand-profile";

interface BrandProfileFormProps {
  profile: BrandProfile;
  source: "api" | "mock";
  toneOptions: readonly BrandToneOption[];
  onProfileSaved?: (profile: BrandProfile) => void;
}

interface BrandProfileFormState {
  name: string;
  audience: string;
  preferredVocabulary: string;
  bannedPhrases: string;
  positioningNotes: string;
}

const CANONICAL_TONES: readonly BrandVoiceTone[] = [
  "professional",
  "authoritative",
  "sophisticated",
  "approachable",
  "visionary",
];

function formatVocabularyRules(profile: BrandProfile) {
  const rules = profile.preferredVocabulary;
  return rules
    .map((rule) => {
      const restrictedTerms = rule.restrictedTerms.join(", ");

      if (restrictedTerms) {
        return `${rule.preferredTerm} - avoid: ${restrictedTerms}`;
      }

      return rule.note
        ? `${rule.preferredTerm} - ${rule.note}`
        : rule.preferredTerm;
    })
    .join("\n");
}

function formatBannedPhrases(profile: BrandProfile) {
  return profile.bannedPhrases
    .map((phrase) => `${phrase.phrase} - ${phrase.reason}`)
    .join("\n");
}

function getInitialState(profile: BrandProfile): BrandProfileFormState {
  return {
    name: profile.name,
    audience: profile.audience,
    preferredVocabulary: formatVocabularyRules(profile),
    bannedPhrases: formatBannedPhrases(profile),
    positioningNotes: profile.positioningNotes ?? "",
  };
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

function parseVocabularyRules(
  value: string,
): readonly BrandVocabularyRuleWritePayload[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [preferredTerm, detail = ""] = line.split(/\s+-\s+/, 2);
      const avoidPrefix = /^avoid:\s*/i;
      const isAvoidRule = avoidPrefix.test(detail);
      const restrictedTerms = isAvoidRule
        ? detail
            .replace(avoidPrefix, "")
            .split(",")
            .map((term) => term.trim())
            .filter(Boolean)
        : [];

      return {
        id: `${slugify(preferredTerm)}-${index + 1}`,
        preferred_term: preferredTerm,
        restricted_terms: restrictedTerms,
        note: isAvoidRule ? "" : detail,
      };
    });
}

function parseBannedPhrases(value: string): readonly BannedPhraseWritePayload[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [phrase, reason = ""] = line.split(/\s+-\s+/, 2);
      return {
        id: `${slugify(phrase)}-${index + 1}`,
        phrase,
        reason,
      };
    });
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return `API error ${error.status}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return "Brand profile could not be saved.";
}

function getSelectedTones(form: HTMLFormElement): readonly BrandVoiceTone[] {
  return new FormData(form)
    .getAll("tones")
    .filter((tone): tone is BrandVoiceTone =>
      CANONICAL_TONES.includes(tone as BrandVoiceTone),
    );
}

export function BrandProfileForm({
  onProfileSaved,
  profile,
  source,
  toneOptions,
}: BrandProfileFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(() => getInitialState(profile));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormState(getInitialState(profile));
    setMessage(null);
    setError(null);
  }, [profile]);

  function updateField(field: keyof BrandProfileFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.name.trim()) {
      setError("Add a brand profile name before saving.");
      setMessage(null);
      return;
    }

    if (!formState.audience.trim()) {
      setError("Add a target audience before saving.");
      setMessage(null);
      return;
    }

    if (source === "mock") {
      setMessage("Mock mode only. No backend save was made.");
      setError(null);
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const updatedProfile = await updateBrandProfile(profile.id, {
        name: formState.name.trim(),
        audience: formState.audience.trim(),
        tone: getSelectedTones(event.currentTarget),
        preferred_vocabulary: parseVocabularyRules(formState.preferredVocabulary),
        banned_phrases: parseBannedPhrases(formState.bannedPhrases),
        positioning_notes: formState.positioningNotes.trim(),
      });
      onProfileSaved?.(updatedProfile);
      setMessage("Brand profile saved.");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SurfaceCard className="flex flex-col gap-6">
      <div>
        <p className="luxe-eyebrow">Setup</p>
        <h2 className="luxe-section-title mt-2">Brand Profile Details</h2>
        <p className="luxe-form-help mt-2">
          {source === "api"
            ? "Start with the core voice settings. Saves go to the BrandProfile API."
            : "Mock fallback mode. Changes here stay local and are not persisted."}
        </p>
      </div>

      <form
        aria-label="Brand voice profile form"
        className="space-y-6"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="luxe-form-label" htmlFor="brand-profile-name">
            Brand profile name
          </label>
          <input
            className="luxe-field mt-2 w-full px-4 py-3"
            id="brand-profile-name"
            name="brandProfileName"
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Example: THE LUXE Signature Voice"
            type="text"
            value={formState.name}
          />
        </div>

        <div>
          <label className="luxe-form-label" htmlFor="target-audience">
            Target audience
          </label>
          <textarea
            className="luxe-field mt-2 min-h-28 w-full resize-none px-4 py-3"
            id="target-audience"
            name="targetAudience"
            onChange={(event) => updateField("audience", event.target.value)}
            placeholder="Describe who this brand voice is written for."
            value={formState.audience}
          />
        </div>

        <div onChange={() => {
          setMessage(null);
          setError(null);
        }}>
          <ToneSelector key={profile.updatedAt} tones={toneOptions} />
        </div>

        <div>
          <label className="luxe-form-label" htmlFor="preferred-vocabulary">
            Preferred vocabulary
          </label>
          <textarea
            className="luxe-field mt-2 min-h-32 w-full resize-none px-4 py-3"
            id="preferred-vocabulary"
            name="preferredVocabulary"
            onChange={(event) =>
              updateField("preferredVocabulary", event.target.value)
            }
            placeholder="Add preferred terms and replacement guidance."
            value={formState.preferredVocabulary}
          />
        </div>

        <div>
          <label className="luxe-form-label" htmlFor="banned-phrases">
            Banned phrases
          </label>
          <textarea
            className="luxe-field mt-2 min-h-28 w-full resize-none px-4 py-3"
            id="banned-phrases"
            name="bannedPhrases"
            onChange={(event) => updateField("bannedPhrases", event.target.value)}
            placeholder="List phrases that should be avoided."
            value={formState.bannedPhrases}
          />
        </div>

        <div>
          <label className="luxe-form-label" htmlFor="positioning-notes">
            Positioning notes
          </label>
          <textarea
            className="luxe-field mt-2 min-h-28 w-full resize-none px-4 py-3"
            id="positioning-notes"
            name="positioningNotes"
            onChange={(event) => updateField("positioningNotes", event.target.value)}
            placeholder="Describe where this brand sits in its market and any overarching content strategy notes."
            value={formState.positioningNotes}
          />
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

        <div className="flex flex-col gap-3 border-t border-(--color-border-subtle) pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="luxe-form-help">
            {source === "api"
              ? "Saves with PATCH /api/brand-profiles/{id}/."
              : "Mock fallback is clearly local; switch to API mode to persist."}
          </p>
          <button
            className="luxe-primary-action luxe-focus-ring rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving..." : "Save draft profile"}
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}
