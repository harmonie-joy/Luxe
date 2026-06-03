import type { BrandToneOption } from "@/types/brand-profile";

interface ToneSelectorProps {
  tones: readonly BrandToneOption[];
  name?: string;
}

export function ToneSelector({
  name = "tones",
  tones,
}: ToneSelectorProps) {
  return (
    <fieldset>
      <legend className="luxe-form-label">Tone chips</legend>
      <p className="luxe-form-help mt-1">
        Choose the voice attributes content should preserve.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {tones.map((tone) => (
          <label className="luxe-chip px-4 py-3" key={tone.value}>
            <input
              className="sr-only"
              defaultChecked={tone.selected}
              name={name}
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
  );
}
