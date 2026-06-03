import type {
  BrandAsset,
  BrandToneOption,
  BrandProfile,
} from "@/types/brand-profile";
import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface BrandProfilePreviewProps {
  profile: BrandProfile;
  toneOptions: readonly BrandToneOption[];
  samples: readonly BrandAsset[];
}

function getVocabularyMeta(profile: BrandProfile, index: number): string {
  const rule = profile.preferredVocabulary[index];

  if (rule.restrictedTerms.length > 0) {
    return `Avoid ${rule.restrictedTerms.join(", ")}`;
  }

  return rule.note ?? "Preferred term";
}

export function BrandProfilePreview({
  profile,
  samples,
  toneOptions,
}: BrandProfilePreviewProps) {
  const selectedTones = toneOptions.filter((tone) =>
    profile.tone.includes(tone.value),
  );

  return (
    <SurfaceCard className="flex flex-col">
      <div className="luxe-card-header pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="luxe-eyebrow">Preview</p>
            <h2 className="luxe-section-title mt-2">
              Brand Voice Profile
            </h2>
          </div>
          <StatusIndicator label="Ready to draft" tone="success" />
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <div>
          <p className="luxe-form-help">Profile name</p>
          <h3 className="luxe-serif mt-2 text-3xl leading-none text-luxe-brand">
            {profile.name}
          </h3>
          <p className="luxe-item-meta mt-3 text-sm">
            {profile.workspaceId} · {profile.sampleCount} samples
          </p>
        </div>

        <div>
          <p className="luxe-form-help">Target audience</p>
          <p className="mt-2 text-sm leading-6 text-luxe-text-secondary">
            {profile.audience}
          </p>
        </div>

        {profile.positioningNotes && (
          <div>
            <p className="luxe-form-help">Positioning notes</p>
            <p className="mt-2 text-sm leading-6 text-luxe-text-secondary">
              {profile.positioningNotes}
            </p>
          </div>
        )}

        <div>
          <p className="luxe-form-help">Tone summary</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTones.map((tone) => (
              <span
                className="luxe-count-pill px-3 py-1 text-xs font-medium"
                key={tone.value}
              >
                {tone.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <div className="luxe-preview-stat p-4">
            <p className="luxe-form-help">Vocabulary rules</p>
            <p className="luxe-serif mt-2 text-3xl text-luxe-brand">
              {profile.preferredVocabulary.length}
            </p>
          </div>
          <div className="luxe-preview-stat p-4">
            <p className="luxe-form-help">Banned phrases</p>
            <p className="luxe-serif mt-2 text-3xl text-luxe-warning">
              {profile.bannedPhrases.length}
            </p>
          </div>
          <div className="luxe-preview-stat p-4">
            <p className="luxe-form-help">Samples</p>
            <p className="luxe-serif mt-2 text-3xl text-luxe-success">
              {samples.length}
            </p>
          </div>
        </div>

        <div>
          <p className="luxe-form-help">Preferred vocabulary</p>
          <div className="luxe-list-divider mt-3">
            {profile.preferredVocabulary.map((rule, index) => (
              <article className="py-3" key={rule.id}>
                <h4 className="luxe-item-title text-sm">
                  {rule.preferredTerm}
                </h4>
                <p className="luxe-item-meta mt-1 text-sm">
                  {getVocabularyMeta(profile, index)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
