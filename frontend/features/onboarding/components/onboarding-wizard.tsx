"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { SurfaceCard } from "@/components/ui/surface-card";
import type { OnboardingSetupConfig } from "@/data/mock-onboarding";
import {
  toBannedPhrasePayload,
  toCanonicalTones,
  toVocabularyPayload,
} from "@/features/brand-voice/components/brand-voice-ai-panel";
import { extractBrandVoice } from "@/lib/api/ai";
import { getSession } from "@/lib/api/auth";
import {
  createBrandAsset,
  createBrandProfile,
  updateBrandProfile,
} from "@/lib/api/brand-voice";
import { ApiError } from "@/lib/api/http-client";
import { APP_ROUTES } from "@/lib/routes";
import type { BrandVoiceTone } from "@/types/brand-profile";
import type { OnboardingAnswers } from "@/types/onboarding";

interface OnboardingWizardProps {
  config: OnboardingSetupConfig;
}

// Same flag the Brand Voice screens use: API mode only when explicitly enabled.
const USE_API_BRAND_VOICE =
  process.env.NEXT_PUBLIC_USE_MOCK_BRAND_VOICE === "false";

const EMPTY_ANSWERS: OnboardingAnswers = {
  brandName: "",
  creatorRole: "",
  projectDescription: "",
  audience: "",
  toneIntent: [],
  preferredWords: "",
  avoidedPhrases: "",
  personalityNotes: "",
  contentPillars: "",
  formats: "",
  firstGoal: "",
  complianceBoundaries: "",
};

const STEPS = [
  {
    eyebrow: "Step 1 of 3",
    title: "Brand foundation",
    description: "Who you are, what you are building, and who it is for.",
  },
  {
    eyebrow: "Step 2 of 3",
    title: "Voice direction",
    description: "How your content should sound — and what it should never say.",
  },
  {
    eyebrow: "Step 3 of 3",
    title: "Content strategy",
    description: "What you will publish and the boundaries you work within.",
  },
] as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return `API error ${error.status}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/** Splits comma- or newline-separated user input into trimmed entries. */
function parseList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Serializes all answers into the structured text stored on both the BrandAsset and positioning notes. */
function serializeAnswers(answers: OnboardingAnswers): string {
  const sections: readonly [string, string][] = [
    ["Brand name", answers.brandName],
    ["Creator role", answers.creatorRole],
    ["What we are building", answers.projectDescription],
    ["Target audience", answers.audience],
    ["Tone direction", answers.toneIntent.join(", ")],
    ["Preferred words and phrases", answers.preferredWords],
    ["Phrases and styles to avoid", answers.avoidedPhrases],
    ["Personality notes", answers.personalityNotes],
    ["Content pillars", answers.contentPillars],
    ["Content formats", answers.formats],
    ["First goal", answers.firstGoal],
    ["Compliance boundaries", answers.complianceBoundaries],
  ];
  return sections
    .filter(([, value]) => value.trim().length > 0)
    .map(([label, value]) => `${label}:\n${value.trim()}`)
    .join("\n\n");
}

export function OnboardingWizard({ config }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY_ANSWERS);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const { placeholders, toneOptions } = config;

  function setField<K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K],
  ) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function toggleTone(tone: BrandVoiceTone, checked: boolean) {
    setField(
      "toneIntent",
      checked
        ? [...answers.toneIntent, tone]
        : answers.toneIntent.filter((value) => value !== tone),
    );
  }

  function handleNext() {
    if (step === 0 && (!answers.brandName.trim() || !answers.audience.trim())) {
      setError("Add a brand name and a target audience before continuing.");
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answers.brandName.trim() || !answers.audience.trim()) {
      setStep(0);
      setError("Add a brand name and a target audience before finishing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const summary = serializeAnswers(answers);

    try {
      const session = await getSession();
      const workspaceId =
        session.activeWorkspaceId ?? session.workspaces[0]?.id;
      if (!workspaceId) {
        throw new Error("No workspace found for this account. Sign in again and retry.");
      }

      const profile = await createBrandProfile({
        workspace: workspaceId,
        name: answers.brandName.trim(),
        audience: answers.audience.trim(),
        tone: answers.toneIntent,
        preferred_vocabulary: toVocabularyPayload(
          parseList(answers.preferredWords).map((term) => ({
            preferred_term: term,
            restricted_terms: [],
            note: "",
          })),
        ),
        banned_phrases: toBannedPhrasePayload(
          parseList(answers.avoidedPhrases).map((phrase) => ({
            phrase,
            reason: "Flagged during onboarding.",
          })),
        ),
        positioning_notes: summary,
      });

      // Profile persisted — everything below is best-effort and must not block
      // the user from landing on Brand Voice.
      try {
        const asset = await createBrandAsset({
          brand_profile: profile.id,
          title: "Onboarding foundation answers",
          content: summary,
          media_type: "text",
          source_type: "pasted",
          format: "onboarding_questionnaire",
          word_count: summary.trim().split(/\s+/).filter(Boolean).length,
          status: "ready",
        });

        if (USE_API_BRAND_VOICE) {
          const result = await extractBrandVoice({
            workspace: workspaceId,
            brand_profile: profile.id,
            asset_ids: [asset.id],
          });
          await updateBrandProfile(profile.id, {
            audience: result.suggestions.audience,
            tone: toCanonicalTones(result.suggestions.tone, profile.tone),
            preferred_vocabulary: toVocabularyPayload(
              result.suggestions.preferred_vocabulary,
            ),
            banned_phrases: toBannedPhrasePayload(
              result.suggestions.banned_phrases,
            ),
            positioning_notes: result.suggestions.positioning_notes,
          });
        }

        router.push(APP_ROUTES.brandVoice);
      } catch (err) {
        setSavedNotice(
          `Your starter profile is saved, but AI voice extraction did not finish (${getErrorMessage(
            err,
          )}). You can run it any time from Brand Voice.`,
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (savedNotice) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8">
        <header>
          <p className="luxe-eyebrow">Onboarding</p>
          <h1 className="luxe-page-title mt-3">Your starter profile is ready.</h1>
        </header>
        <SurfaceCard className="flex flex-col gap-5">
          <p className="luxe-preview-stat p-4 text-sm font-medium">{savedNotice}</p>
          <Link
            className="luxe-primary-action luxe-focus-ring self-start rounded-sm px-5 py-3 text-sm font-semibold"
            href={APP_ROUTES.brandVoice}
          >
            Continue to Brand Voice
          </Link>
        </SurfaceCard>
      </div>
    );
  }

  const current = STEPS[step];

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8">
      <header>
        <p className="luxe-eyebrow">Welcome to THE LUXE</p>
        <h1 className="luxe-page-title mt-3">Set up your starter brand voice.</h1>
        <p className="luxe-page-description mt-4 max-w-2xl">
          Answer a few beginner-friendly questions and we will scaffold a first
          Brand Voice Profile you can refine later.
        </p>
      </header>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <SurfaceCard className="flex flex-col gap-6">
          <div>
            <p className="luxe-eyebrow">{current.eyebrow}</p>
            <h2 className="luxe-section-title mt-2">{current.title}</h2>
            <p className="luxe-form-help mt-2">{current.description}</p>
          </div>

          {step === 0 ? (
            <div className="flex flex-col gap-5">
              <label className="block">
                <span className="luxe-form-label">Creator or brand name</span>
                <input
                  className="luxe-field mt-2 h-12 w-full px-4"
                  onChange={(event) => setField("brandName", event.currentTarget.value)}
                  placeholder={placeholders.brandName}
                  value={answers.brandName}
                />
              </label>
              <label className="block">
                <span className="luxe-form-label">Your role</span>
                <input
                  className="luxe-field mt-2 h-12 w-full px-4"
                  onChange={(event) => setField("creatorRole", event.currentTarget.value)}
                  placeholder={placeholders.creatorRole}
                  value={answers.creatorRole}
                />
              </label>
              <label className="block">
                <span className="luxe-form-label">What are you building?</span>
                <textarea
                  className="luxe-field mt-2 w-full px-4 py-3"
                  onChange={(event) =>
                    setField("projectDescription", event.currentTarget.value)
                  }
                  placeholder={placeholders.projectDescription}
                  rows={3}
                  value={answers.projectDescription}
                />
              </label>
              <label className="block">
                <span className="luxe-form-label">Target audience</span>
                <textarea
                  className="luxe-field mt-2 w-full px-4 py-3"
                  onChange={(event) => setField("audience", event.currentTarget.value)}
                  placeholder={placeholders.audience}
                  rows={3}
                  value={answers.audience}
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="luxe-form-label">Preferred tone</p>
                <div className="mt-3 grid gap-2">
                  {toneOptions.map((option) => (
                    <label
                      className="luxe-chip flex items-start gap-3 rounded-sm px-4 py-3"
                      key={option.value}
                    >
                      <input
                        checked={answers.toneIntent.includes(option.value)}
                        className="mt-1"
                        onChange={(event) =>
                          toggleTone(option.value, event.target.checked)
                        }
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {option.label}
                        </span>
                        <span className="luxe-chip-description mt-1 block text-xs leading-5">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="luxe-form-label">
                  Words and phrases you like (comma or line separated)
                </span>
                <textarea
                  className="luxe-field mt-2 w-full px-4 py-3"
                  onChange={(event) =>
                    setField("preferredWords", event.currentTarget.value)
                  }
                  placeholder={placeholders.preferredWords}
                  rows={2}
                  value={answers.preferredWords}
                />
              </label>
              <label className="block">
                <span className="luxe-form-label">
                  Phrases and styles to avoid (comma or line separated)
                </span>
                <textarea
                  className="luxe-field mt-2 w-full px-4 py-3"
                  onChange={(event) =>
                    setField("avoidedPhrases", event.currentTarget.value)
                  }
                  placeholder={placeholders.avoidedPhrases}
                  rows={4}
                  value={answers.avoidedPhrases}
                />
              </label>
              <label className="block">
                <span className="luxe-form-label">Personality notes</span>
                <textarea
                  className="luxe-field mt-2 w-full px-4 py-3"
                  onChange={(event) =>
                    setField("personalityNotes", event.currentTarget.value)
                  }
                  placeholder={placeholders.personalityNotes}
                  rows={2}
                  value={answers.personalityNotes}
                />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-5">
              <label className="block">
                <span className="luxe-form-label">Content pillars (one per line)</span>
                <textarea
                  className="luxe-field mt-2 w-full px-4 py-3"
                  onChange={(event) =>
                    setField("contentPillars", event.currentTarget.value)
                  }
                  placeholder={placeholders.contentPillars}
                  rows={5}
                  value={answers.contentPillars}
                />
              </label>
              <label className="block">
                <span className="luxe-form-label">Content formats</span>
                <input
                  className="luxe-field mt-2 h-12 w-full px-4"
                  onChange={(event) => setField("formats", event.currentTarget.value)}
                  placeholder={placeholders.formats}
                  value={answers.formats}
                />
              </label>
              <label className="block">
                <span className="luxe-form-label">First content goal</span>
                <input
                  className="luxe-field mt-2 h-12 w-full px-4"
                  onChange={(event) => setField("firstGoal", event.currentTarget.value)}
                  placeholder={placeholders.firstGoal}
                  value={answers.firstGoal}
                />
              </label>
              <label className="block">
                <span className="luxe-form-label">Compliance boundaries (one per line)</span>
                <textarea
                  className="luxe-field mt-2 w-full px-4 py-3"
                  onChange={(event) =>
                    setField("complianceBoundaries", event.currentTarget.value)
                  }
                  placeholder={placeholders.complianceBoundaries}
                  rows={4}
                  value={answers.complianceBoundaries}
                />
              </label>
            </div>
          ) : null}

          <div aria-live="polite">
            {error ? (
              <p className="luxe-preview-stat p-4 text-sm font-medium text-luxe-danger">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-(--color-border-subtle) pt-5">
            <button
              className="luxe-secondary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={step === 0 || isSubmitting}
              onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 0))}
              type="button"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                className="luxe-primary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold"
                onClick={handleNext}
                type="button"
              >
                Next
              </button>
            ) : (
              <button
                className="luxe-primary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Creating profile..." : "Create my brand voice"}
              </button>
            )}
          </div>
        </SurfaceCard>
      </form>
    </div>
  );
}
