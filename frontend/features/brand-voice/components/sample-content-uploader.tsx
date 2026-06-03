import type { SampleContentConfig } from "@/types/brand-profile";
import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface SampleContentUploaderProps {
  sampleContent: SampleContentConfig;
}

export function SampleContentUploader({
  sampleContent,
}: SampleContentUploaderProps) {
  return (
    <SurfaceCard className="flex min-h-0 flex-col gap-6">
      <div>
        <p className="luxe-eyebrow">Reference Material</p>
        <h2 className="luxe-section-title mt-2">Sample Content</h2>
        <p className="luxe-form-help mt-2">{sampleContent.uploadHelpText}</p>
      </div>

      <div>
        <label className="luxe-form-label" htmlFor="sample-content-paste">
          Sample content paste area
        </label>
        <textarea
          className="luxe-field mt-2 min-h-36 w-full resize-none px-4 py-3"
          defaultValue={sampleContent.pasteDefaultValue}
          id="sample-content-paste"
          name="sampleContentPaste"
          placeholder="Paste representative brand copy here."
        />
      </div>

      <div className="luxe-upload-zone p-5">
        <label className="luxe-form-label" htmlFor="sample-content-upload">
          Upload sample content
        </label>
        <input
          accept={sampleContent.acceptedFormats.join(",")}
          aria-describedby="sample-content-upload-help"
          className="luxe-field mt-3 w-full px-4 py-3"
          id="sample-content-upload"
          name="sampleContentUpload"
          type="file"
        />
        <p className="luxe-form-help mt-3" id="sample-content-upload-help">
          Accepted formats: {sampleContent.acceptedFormats.join(", ")}.
          Uploads are local-only in this MVP screen.
        </p>
      </div>

      <div className="min-h-0">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="luxe-section-title text-base">Current samples</h3>
          <span className="luxe-count-pill px-3 py-1 text-xs font-medium uppercase tracking-[0.14em]">
            {sampleContent.samples.length} Items
          </span>
        </div>

        <div className="luxe-list-divider luxe-scroll-panel max-h-56">
          {sampleContent.samples.map((sample) => (
            <article
              className="luxe-list-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              key={sample.id}
            >
              <div>
                <h4 className="luxe-item-title text-sm">{sample.title}</h4>
                <p className="luxe-item-meta mt-1 text-sm">
                  {sample.source} · {sample.format} · {sample.wordCount} words
                </p>
              </div>
              <StatusIndicator
                label={sample.status}
                tone={sample.status === "Ready" ? "success" : "warning"}
              />
            </article>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}
