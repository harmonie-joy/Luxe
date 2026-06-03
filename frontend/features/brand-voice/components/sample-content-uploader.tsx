"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SampleContentConfig } from "@/types/brand-profile";
import { BRAND_ASSET_SOURCE_LABELS, BRAND_ASSET_STATUS_LABELS } from "@/lib/formatters";
import { brandVoiceSampleRoute } from "@/lib/routes";
import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface SampleContentUploaderProps {
  sampleContent: SampleContentConfig;
}

export function SampleContentUploader({
  sampleContent,
}: SampleContentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pasteContent, setPasteContent] = useState(sampleContent.pasteDefaultValue);
  const router = useRouter();
  const samples = sampleContent.samples;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
  }

  function handleUpload() {
    if (!selectedFile) return;
    // MVP: generate a stable slug from the filename and timestamp.
    const slug = `${Date.now()}-${selectedFile.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;
    router.push(brandVoiceSampleRoute(slug));
  }

  function handleAnalysePaste() {
    if (!pasteContent.trim()) return;
    const slug = `paste-${Date.now()}`;
    router.push(brandVoiceSampleRoute(slug));
  }

  return (
    <SurfaceCard className="flex min-h-0 flex-col gap-6">
      <div>
        <p className="luxe-eyebrow">Reference Material</p>
        {/* headline-lg: Libre Caslon per design reference type scale */}
        <h2 className="luxe-serif luxe-section-title mt-2 text-2xl font-normal leading-8">
          Sample Content
        </h2>
        <p className="luxe-form-help mt-2">{sampleContent.uploadHelpText}</p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <label className="luxe-form-label" htmlFor="sample-content-paste">
            Sample content paste area
            <span className="luxe-item-meta ml-2 font-normal">Markdown supported</span>
          </label>
        </div>
        <textarea
          className="luxe-field mt-2 min-h-36 w-full resize-y px-4 py-3 font-mono text-sm"
          id="sample-content-paste"
          name="sampleContentPaste"
          placeholder="Paste representative brand copy here. Markdown is supported — use **bold**, _italic_, # headings, - lists, etc."
          value={pasteContent}
          onChange={(e) => setPasteContent(e.target.value)}
        />
        {pasteContent.trim() && (
          <div className="mt-3 flex justify-end">
            <button
              className="luxe-primary-action luxe-focus-ring rounded px-5 py-2.5 text-sm font-medium"
              type="button"
              onClick={handleAnalysePaste}
            >
              Analyse Paste
            </button>
          </div>
        )}
      </div>

      <div className="luxe-upload-zone p-5">
        <label className="luxe-form-label" htmlFor="sample-content-upload">
          Upload sample content
        </label>
        {/* Hidden file input — triggered by the button below */}
        <input
          ref={fileInputRef}
          accept={sampleContent.acceptedFormats.join(",")}
          aria-describedby="sample-content-upload-help"
          className="sr-only"
          id="sample-content-upload"
          name="sampleContentUpload"
          type="file"
          onChange={handleFileChange}
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="luxe-secondary-action luxe-focus-ring rounded px-5 py-2.5 text-sm font-medium"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose file
          </button>
          {selectedFile ? (
            <>
              <span className="luxe-item-meta truncate text-sm">
                {selectedFile.name}
              </span>
              <button
                className="luxe-primary-action luxe-focus-ring rounded px-5 py-2.5 text-sm font-medium sm:ml-auto"
                type="button"
                onClick={handleUpload}
              >
                Upload &amp; Analyse
              </button>
            </>
          ) : (
            <p className="luxe-form-help" id="sample-content-upload-help">
              Accepted: {sampleContent.acceptedFormats.join(", ")}. Local-only
              in this MVP.
            </p>
          )}
        </div>
      </div>

      <div className="min-h-0">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="luxe-section-title text-base">Current samples</h3>
          <span className="luxe-count-pill px-3 py-1 text-xs font-medium uppercase tracking-[0.14em]">
            {samples.length} Items
          </span>
        </div>

        <div className="luxe-list-divider luxe-scroll-panel max-h-56">
          {samples.length === 0 ? (
            <p className="luxe-form-help py-6 text-center">
              No samples yet. Paste or upload content above.
            </p>
          ) : (
            samples.map((sample) => (
              /* Entire row is a link to the sample detail page */
              <Link
                className="luxe-list-row flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                href={brandVoiceSampleRoute(sample.id)}
                key={sample.id}
              >
                <div className="min-w-0">
                  <p className="luxe-item-title truncate text-sm">
                    {sample.title}
                  </p>
                  <p className="luxe-item-meta mt-1 text-sm">
                    {BRAND_ASSET_SOURCE_LABELS[sample.sourceType]} ·{" "}
                    {sample.format} · {sample.wordCount} words
                  </p>
                </div>

                <StatusIndicator
                  className="shrink-0"
                  label={BRAND_ASSET_STATUS_LABELS[sample.status]}
                  tone={sample.status === "ready" ? "success" : "warning"}
                />
              </Link>
            ))
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}
