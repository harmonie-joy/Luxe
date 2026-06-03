import type {
  BannedPhrase,
  BrandToneOption,
} from "@/data/mock-brand-profiles";
import type {
  BrandProfile,
  BrandVocabularyRule,
} from "@/types/brand-profile";
import { SurfaceCard } from "@/components/ui/surface-card";

interface BrandProfileFormProps {
  profile: BrandProfile;
  toneOptions: readonly BrandToneOption[];
  vocabularyRules: readonly BrandVocabularyRule[];
  bannedPhrases: readonly BannedPhrase[];
}

function formatVocabularyRules(rules: readonly BrandVocabularyRule[]) {
  return rules
    .map((rule) => {
      const restrictedTerms = rule.restrictedTerms.join(", ");

      return `${rule.preferredTerm} - avoid: ${restrictedTerms}`;
    })
    .join("\n");
}

function formatBannedPhrases(phrases: readonly BannedPhrase[]) {
  return phrases
    .map((phrase) => `${phrase.phrase} - ${phrase.reason}`)
    .join("\n");
}

export function BrandProfileForm({
  bannedPhrases,
  profile,
  toneOptions,
  vocabularyRules,
}: BrandProfileFormProps) {
  return (
    <SurfaceCard className="flex flex-col gap-6">
      <div>
        <p className="luxe-eyebrow">Setup</p>
        <h2 className="luxe-section-title mt-2">Brand Profile Details</h2>
        <p className="luxe-form-help mt-2">
          Start with the core voice settings. These fields use mock data only
          and do not save to a backend yet.
        </p>
      </div>

      <form aria-label="Brand voice profile form" className="space-y-6">
        <div>
          <label className="luxe-form-label" htmlFor="brand-profile-name">
            Brand profile name
          </label>
          <input
            className="luxe-field mt-2 w-full px-4 py-3"
            defaultValue={profile.name}
            id="brand-profile-name"
            name="brandProfileName"
            placeholder="Example: THE LUXE Signature Voice"
            type="text"
          />
        </div>

        <div>
          <label className="luxe-form-label" htmlFor="target-audience">
            Target audience
          </label>
          <textarea
            className="luxe-field mt-2 min-h-28 w-full resize-none px-4 py-3"
            defaultValue={profile.audience}
            id="target-audience"
            name="targetAudience"
            placeholder="Describe who this brand voice is written for."
          />
        </div>

        <fieldset>
          <legend className="luxe-form-label">Tone chips</legend>
          <p className="luxe-form-help mt-1">
            Choose the voice attributes content should preserve.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {toneOptions.map((tone) => (
              <label
                className="luxe-chip px-4 py-3"
                key={tone.value}
              >
                <input
                  className="sr-only"
                  defaultChecked={tone.selected}
                  name="tones"
                  type="checkbox"
                  value={tone.value}
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {tone.label}
                  </span>
                  <span className="luxe-chip-description mt-1 block text-xs">
                    {tone.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="luxe-form-label" htmlFor="preferred-vocabulary">
            Preferred vocabulary
          </label>
          <textarea
            className="luxe-field mt-2 min-h-32 w-full resize-none px-4 py-3"
            defaultValue={formatVocabularyRules(vocabularyRules)}
            id="preferred-vocabulary"
            name="preferredVocabulary"
            placeholder="Add preferred terms and replacement guidance."
          />
        </div>

        <div>
          <label className="luxe-form-label" htmlFor="banned-phrases">
            Banned phrases
          </label>
          <textarea
            className="luxe-field mt-2 min-h-28 w-full resize-none px-4 py-3"
            defaultValue={formatBannedPhrases(bannedPhrases)}
            id="banned-phrases"
            name="bannedPhrases"
            placeholder="List phrases that should be avoided."
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-[color:var(--color-border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="luxe-form-help">
            MVP preview mode. No API request is made from this form.
          </p>
          <button
            className="luxe-primary-action luxe-focus-ring rounded-full px-5 py-3 text-sm font-semibold"
            type="button"
          >
            Save draft profile
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}
