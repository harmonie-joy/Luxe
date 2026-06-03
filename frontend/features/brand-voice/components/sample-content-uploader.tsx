"use client";

import { useRef, useState } from "react";
import type { BrandAsset, SampleContentConfig } from "@/types/brand-profile";
import {
  BRAND_ASSET_SOURCE_LABELS,
  BRAND_ASSET_STATUS_LABELS,
} from "@/lib/formatters";
import { SurfaceCard } from "@/components/ui/surface-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { SampleContentDetail } from "./sample-content-detail";

interface SampleContentUploaderProps {
  sampleContent: SampleContentConfig;
}

export function SampleContentUploader({
  sampleContent,
}: SampleContentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [samples, setSamples] = useState<BrandAsset[]>([
    ...sampleContent.samples,
  ]);
  const [detailAsset, setDetailAsset] = useState<{
    asset: BrandAsset;
    mode: "view" | "edit";
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BrandAsset | null>(null);

  function handleSave(updated: BrandAsset) {
    setSamples((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
    setDetailAsset(null);
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    setSamples((prev) => prev.filter((s) => s.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <>
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
          {/* Hidden file input — triggered by the button below */}
          <input
            ref={fileInputRef}
            accept={sampleContent.acceptedFormats.join(",")}
            aria-describedby="sample-content-upload-help"
            className="sr-only"
            id="sample-content-upload"
            name="sampleContentUpload"
            type="file"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="luxe-primary-action luxe-focus-ring rounded px-5 py-2.5 text-sm font-medium"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload reference material
            </button>
            <p
              className="luxe-form-help"
              id="sample-content-upload-help"
            >
              Accepted: {sampleContent.acceptedFormats.join(", ")}. Local-only
              in this MVP.
            </p>
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
                <article
                  className="luxe-list-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  key={sample.id}
                >
                  <div className="min-w-0">
                    <h4 className="luxe-item-title truncate text-sm">
                      {sample.title}
                    </h4>
                    <p className="luxe-item-meta mt-1 text-sm">
                      {BRAND_ASSET_SOURCE_LABELS[sample.sourceType]} ·{" "}
                      {sample.format} · {sample.wordCount} words
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <StatusIndicator
                      label={BRAND_ASSET_STATUS_LABELS[sample.status]}
                      tone={sample.status === "ready" ? "success" : "warning"}
                    />

                    <div className="flex items-center gap-1">
                      <button
                        aria-label={`View ${sample.title}`}
                        className="luxe-secondary-action luxe-focus-ring px-2.5 py-1 text-xs font-medium"
                        type="button"
                        onClick={() =>
                          setDetailAsset({ asset: sample, mode: "view" })
                        }
                      >
                        View
                      </button>
                      <button
                        aria-label={`Edit ${sample.title}`}
                        className="luxe-secondary-action luxe-focus-ring px-2.5 py-1 text-xs font-medium"
                        type="button"
                        onClick={() =>
                          setDetailAsset({ asset: sample, mode: "edit" })
                        }
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Delete ${sample.title}`}
                        className="luxe-focus-ring rounded px-2.5 py-1 text-xs font-medium text-luxe-danger transition-colors duration-(--motion-duration-fast) hover:bg-[color-mix(in_srgb,var(--status-danger)_10%,transparent)]"
                        type="button"
                        onClick={() => setPendingDelete(sample)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </SurfaceCard>

      {/* View / Edit modal */}
      {detailAsset && (
        <SampleContentDetail
          asset={detailAsset.asset}
          initialMode={detailAsset.mode}
          onClose={() => setDetailAsset(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirmation — Level 2 elevation per design reference */}
      {pendingDelete && (
        <div
          aria-label="Close"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingDelete(null);
          }}
        >
          <div
            aria-modal="true"
            className="luxe-panel flex w-full max-w-md flex-col gap-5 p-8"
            role="alertdialog"
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-desc"
            style={{ boxShadow: "0 4px 20px rgb(49 48 48 / 0.15)" }}
          >
            <div>
              {/* title-md: Inter 18px 600 per type scale */}
              <h2
                className="text-lg font-semibold leading-6 tracking-[-0.01em] text-luxe-text-primary"
                id="delete-confirm-title"
              >
                Delete sample?
              </h2>
              <p
                className="luxe-form-help mt-3 leading-relaxed"
                id="delete-confirm-desc"
              >
                <strong className="font-semibold text-luxe-text-primary">
                  &ldquo;{pendingDelete.title}&rdquo;
                </strong>{" "}
                will be permanently removed from this brand profile. This action
                cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-luxe-border pt-5">
              <button
                className="luxe-secondary-action luxe-focus-ring px-4 py-2 text-sm font-medium"
                type="button"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="luxe-danger-action luxe-focus-ring px-4 py-2 text-sm font-medium"
                type="button"
                onClick={handleConfirmDelete}
              >
                Delete sample
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
