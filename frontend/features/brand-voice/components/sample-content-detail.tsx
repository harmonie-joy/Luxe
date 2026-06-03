"use client";

import { useEffect, useRef, useState } from "react";
import type { BrandAsset } from "@/types/brand-profile";
import {
  BRAND_ASSET_SOURCE_LABELS,
  BRAND_ASSET_STATUS_LABELS,
  formatDisplayDate,
} from "@/lib/formatters";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface SampleContentDetailProps {
  asset: BrandAsset;
  initialMode?: "view" | "edit";
  onClose: () => void;
  onSave: (updated: BrandAsset) => void;
}

export function SampleContentDetail({
  asset,
  initialMode = "view",
  onClose,
  onSave,
}: SampleContentDetailProps) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [title, setTitle] = useState(asset.title);
  const [content, setContent] = useState(asset.content);
  const panelRef = useRef<HTMLDivElement>(null);

  // Trap focus inside the modal and close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSave() {
    onSave({
      ...asset,
      title: title.trim() || asset.title,
      content,
    });
    setMode("view");
  }

  function handleCancel() {
    setTitle(asset.title);
    setContent(asset.content);
    setMode("view");
  }

  return (
    /* Backdrop */
    <div
      aria-label="Close panel"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 sm:p-8"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Panel — Level 2 elevation: soft shadow + 1px border per design reference */}
      <div
        ref={panelRef}
        aria-label={`Sample content: ${asset.title}`}
        aria-modal="true"
        className="luxe-panel relative flex w-full max-w-2xl flex-col gap-6 overflow-y-auto p-8"
        role="dialog"
        style={{ maxHeight: "90vh", boxShadow: "0 4px 20px rgb(49 48 48 / 0.15)" }}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="luxe-eyebrow">Reference Material</p>
            {mode === "edit" ? (
              <input
                aria-label="Sample title"
                className="luxe-field mt-2 w-full px-3 py-2 text-base font-semibold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            ) : (
              /* headline-lg: Libre Caslon Text per the design reference type scale */
              <h2 className="luxe-serif mt-2 text-2xl font-normal leading-8 tracking-tight text-[var(--color-text-primary)]">
                {asset.title}
              </h2>
            )}
          </div>

          <button
            aria-label="Close"
            className="luxe-interactive luxe-focus-ring -mt-1 -mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            type="button"
            onClick={onClose}
          >
            <svg
              aria-hidden="true"
              fill="none"
              height={16}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 16 16"
              width={16}
            >
              <path d="M2 2l12 12M14 2L2 14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Meta row — label-sm type scale: 12px, 500, 0.05em tracking, uppercase per design ref */}
        <dl className="flex flex-wrap gap-6 border-b border-[var(--color-border)] pb-5">
          <div>
            <dt className="luxe-label-sm">Source</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
              {BRAND_ASSET_SOURCE_LABELS[asset.sourceType]}
            </dd>
          </div>
          <div>
            <dt className="luxe-label-sm">Format</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
              {asset.format}
            </dd>
          </div>
          <div>
            <dt className="luxe-label-sm">Word count</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
              {asset.wordCount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="luxe-label-sm">Added</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
              {formatDisplayDate(asset.createdAt)}
            </dd>
          </div>
          <div className="flex items-end">
            <StatusIndicator
              label={BRAND_ASSET_STATUS_LABELS[asset.status]}
              tone={asset.status === "ready" ? "success" : "warning"}
            />
          </div>
        </dl>

        {/* Content area */}
        <div className="flex flex-col gap-2">
          <label
            className="luxe-form-label"
            htmlFor="detail-content"
          >
            Content
          </label>
          {mode === "edit" ? (
            <textarea
              className="luxe-field min-h-48 w-full resize-y px-4 py-3 text-sm"
              id="detail-content"
              placeholder="Paste or type the sample content here."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          ) : (
            <div
              aria-labelledby="detail-content"
              className="min-h-24 rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text-secondary)]"
            >
              {content ? (
                <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
              ) : (
                <p className="text-[var(--color-text-muted)] italic">
                  No content recorded for this sample.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-5">
          {mode === "view" ? (
            <>
              <button
                className="luxe-secondary-action luxe-focus-ring px-4 py-2 text-sm font-medium"
                type="button"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="luxe-primary-action luxe-focus-ring rounded px-4 py-2 text-sm font-medium"
                type="button"
                onClick={() => setMode("edit")}
              >
                Edit sample
              </button>
            </>
          ) : (
            <>
              <button
                className="luxe-secondary-action luxe-focus-ring px-4 py-2 text-sm font-medium"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="luxe-primary-action luxe-focus-ring rounded px-4 py-2 text-sm font-medium"
                type="button"
                onClick={handleSave}
              >
                Save changes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
