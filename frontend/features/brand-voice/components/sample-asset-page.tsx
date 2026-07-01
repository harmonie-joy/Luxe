"use client";

import { useState } from "react";
import Link from "next/link";
import type { BrandAssetStatus } from "@/types/brand-profile";
import type { SampleAssetPageData } from "@/data/mock-sample-assets";
import { APP_ROUTES } from "@/lib/routes";
import { BRAND_ASSET_STATUS_LABELS } from "@/lib/formatters";
import { SurfaceCard } from "@/components/ui/surface-card";

/* ── Icons ─────────────────────────────────────────────────────────── */

function PenIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={13}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 13 13"
      width={13}
    >
      <path d="M8.5 2 L11 4.5 L4.5 11 L2 11 L2 8.5 Z" />
      <path d="M6.5 3.5 L9.5 6.5" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={14}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 14 14"
      width={14}
    >
      <path d="M8 2L3 7l5 5" />
    </svg>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */

interface SampleAssetPageProps {
  data: SampleAssetPageData;
}

export function SampleAssetPage({ data }: SampleAssetPageProps) {
  const { asset: initial, brandProfileName } = data;

  /* ── Local state ── */
  const [title, setTitle] = useState(initial.title);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [content, setContent] = useState(initial.content);
  const [status, setStatus] = useState<BrandAssetStatus>(initial.status);
  const [savedPulse, setSavedPulse] = useState(false);

  const isDirty =
    title.trim() !== initial.title ||
    content !== initial.content ||
    status !== initial.status;

  function commitTitleEdit() {
    if (!title.trim()) setTitle(initial.title);
    setIsTitleEditing(false);
  }

  function handleSave() {
    // MVP: local only — future API call replaces this
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1800);
  }

  return (
    <div className="flex min-h-full flex-col gap-8">
      {/* ── Page header ────────────────────────────────────────────── */}
      <header className="shrink-0">
        <Link
          className="luxe-label-sm luxe-interactive inline-flex items-center gap-2 rounded px-1 py-0.5 text-(--color-text-muted) hover:text-luxe-text-primary"
          href={APP_ROUTES.brandVoice}
        >
          <BackArrowIcon />
          Brand Voice
        </Link>

        <p className="luxe-eyebrow mt-6">Reference Material</p>
      </header>

      <SurfaceCard className="flex flex-col gap-6">
        <div className="luxe-card-header pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              {isTitleEditing ? (
                <input
                  aria-label="Asset title"
                  autoFocus
                  className="luxe-field w-full px-3 py-2 luxe-serif text-2xl font-normal leading-snug"
                  value={title}
                  onBlur={commitTitleEdit}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTitleEdit();
                    if (e.key === "Escape") {
                      setTitle(initial.title);
                      setIsTitleEditing(false);
                    }
                  }}
                />
              ) : (
                <div className="flex items-start gap-3">
                  <h1 className="luxe-serif min-w-0 flex-1 truncate text-2xl font-normal leading-8 text-luxe-text-primary">
                    {title}
                  </h1>
                  <button
                    aria-label="Edit asset title"
                    className="luxe-icon-action luxe-focus-ring mt-1 shrink-0 rounded p-1.5"
                    type="button"
                    onClick={() => setIsTitleEditing(true)}
                  >
                    <PenIcon />
                  </button>
                </div>
              )}
              <p className="luxe-form-help mt-2">{brandProfileName}</p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div>
                <label className="sr-only" htmlFor="asset-status">
                  Status
                </label>
                <select
                  className="luxe-field px-3 py-2 text-sm"
                  id="asset-status"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as BrandAssetStatus)
                  }
                >
                  {(
                    Object.entries(BRAND_ASSET_STATUS_LABELS) as [
                      BrandAssetStatus,
                      string,
                    ][]
                  ).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={`luxe-focus-ring rounded px-4 py-2 text-sm font-medium transition-all ${
                  savedPulse
                    ? "luxe-secondary-action"
                    : isDirty
                      ? "luxe-primary-action"
                      : "luxe-secondary-action cursor-not-allowed opacity-40"
                }`}
                disabled={!isDirty && !savedPulse}
                type="button"
                onClick={handleSave}
              >
                {savedPulse ? "Saved ✓" : "Save changes"}
              </button>
            </div>
          </div>
        </div>

        <dl className="flex flex-wrap gap-6">
          <div>
            <dt className="luxe-label-sm">Source</dt>
            <dd className="mt-1 text-sm font-medium text-luxe-text-primary">
              {initial.sourceType === "pasted"
                ? "Pasted sample"
                : "Uploaded file"}
            </dd>
          </div>
          <div>
            <dt className="luxe-label-sm">Format</dt>
            <dd className="mt-1 text-sm font-medium text-luxe-text-primary">
              {initial.format}
            </dd>
          </div>
          <div>
            <dt className="luxe-label-sm">Word count</dt>
            <dd className="mt-1 text-sm font-medium text-luxe-text-primary">
              {initial.wordCount.toLocaleString()}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2">
          <label className="luxe-form-label" htmlFor="asset-content">
            Content
          </label>
          <textarea
            className="luxe-field min-h-64 w-full resize-y px-4 py-3 text-sm leading-relaxed"
            id="asset-content"
            placeholder="Paste or type the sample content here."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </SurfaceCard>
    </div>
  );
}
