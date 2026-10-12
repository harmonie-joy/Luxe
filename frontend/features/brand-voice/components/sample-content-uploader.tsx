"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type {
  BrandAsset,
  BrandProfile,
  SampleContentConfig,
} from "@/types/brand-profile";
import { BRAND_ASSET_SOURCE_LABELS, BRAND_ASSET_STATUS_LABELS } from "@/lib/formatters";
import {
  createBrandAsset,
  createBrandAssetUpload,
} from "@/lib/api/brand-voice";
import { ApiError } from "@/lib/api/http-client";
import { brandVoiceSampleRoute } from "@/lib/routes";
import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface SampleContentUploaderProps {
  onAssetSaved?: (asset: BrandAsset) => void;
  profile: BrandProfile;
  sampleContent: SampleContentConfig;
  source: "api" | "mock";
}

export function SampleContentUploader({
  onAssetSaved,
  profile,
  sampleContent,
  source,
}: SampleContentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState(sampleContent.pasteDefaultValue);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const samples = sampleContent.samples;
  const latestSamples = Array.from(samples)
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    )
    .slice(0, 3);

  function getErrorMessage(err: unknown) {
    if (err instanceof ApiError) return `API error ${err.status}: ${err.message}`;
    if (err instanceof Error) return err.message;
    return "Could not save this brand asset.";
  }

  function getPasteTitle(value: string) {
    return value.trim().split("\n")[0].slice(0, 80) || "Pasted brand sample";
  }

  function getWordCount(value: string) {
    return value.trim().split(/\s+/).filter(Boolean).length;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
    setMessage(null);
    setError(null);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    if (source === "mock") {
      setMessage("Demo mode only. No backend asset was saved.");
      setError(null);
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      setError("Only image uploads are saved in this MVP. Paste text or transcripts instead.");
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const savedAsset = await createBrandAssetUpload({
        brand_profile: profile.id,
        title: selectedFile.name,
        media_type: "image",
        file: selectedFile,
        mime_type: selectedFile.type,
        source_type: "uploaded",
        format: selectedFile.name.split(".").pop()?.toUpperCase() ?? "Image",
        status: "needs_review",
      });
      setSelectedFile(null);
      onAssetSaved?.(savedAsset);
      setMessage("Image asset saved for analysis.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAnalysePaste() {
    if (!pasteContent.trim()) return;
    if (source === "mock") {
      setMessage("Demo mode only. No backend asset was saved.");
      setError(null);
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);
    try {
      const savedAsset = await createBrandAsset({
        brand_profile: profile.id,
        title: pasteTitle.trim() || getPasteTitle(pasteContent),
        content: pasteContent,
        media_type: "text",
        source_type: "pasted",
        format: "Text",
        word_count: getWordCount(pasteContent),
        status: "needs_review",
      });
      setPasteTitle("");
      setPasteContent("");
      onAssetSaved?.(savedAsset);
      setMessage("Text asset saved for analysis.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
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
        <label className="luxe-form-label" htmlFor="sample-content-title">
          Sample title
        </label>
        <input
          className="luxe-field mt-2 w-full px-4 py-3"
          id="sample-content-title"
          name="sampleContentTitle"
          onChange={(e) => setPasteTitle(e.target.value)}
          placeholder="Example: Spring campaign manifesto"
          type="text"
          value={pasteTitle}
        />

        <div className="mt-4 flex items-center justify-between gap-4">
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
              disabled={isSaving}
              onClick={handleAnalysePaste}
            >
              Save Paste
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
                disabled={isSaving}
                onClick={handleUpload}
              >
                Save File
              </button>
            </>
          ) : (
            <p className="luxe-form-help" id="sample-content-upload-help">
              Accepted: {sampleContent.acceptedFormats.join(", ")}. Images save
              only in Live mode.
            </p>
          )}
        </div>
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

      <div className="min-h-0">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="luxe-section-title text-base">Current samples</h3>
          <span className="luxe-count-pill px-3 py-1 text-xs font-medium uppercase tracking-[0.14em]">
            {latestSamples.length} of {samples.length} Items
          </span>
        </div>

        <div className="luxe-list-divider luxe-scroll-panel max-h-56">
          {latestSamples.length === 0 ? (
            <p className="luxe-form-help py-6 text-center">
              No samples yet. Paste or upload content above.
            </p>
          ) : (
            latestSamples.map((sample) => (
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
                    {sample.mediaType.replace("_", " ")} · {sample.format}
                    {sample.wordCount > 0 ? ` · ${sample.wordCount} words` : ""}
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
