"use client";

import Link from "next/link";
import { useState } from "react";

import { StatusIndicator } from "@/components/ui/status-indicator";
import type { StatusIndicatorTone } from "@/components/ui/status-indicator";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { DraftStudioPageData } from "@/data/mock-drafts";
import {
  CONTENT_CHANNEL_LABELS,
  DRAFT_STATUS_LABELS,
  formatDisplayDate,
} from "@/lib/formatters";
import { complianceReviewRoute } from "@/lib/routes";
import type { ContentDraft, DraftStatus } from "@/types/content";

interface DraftStudioShellProps {
  data: DraftStudioPageData;
}

const DRAFT_STATUS_TONES = {
  draft: "neutral",
  in_review: "warning",
  needs_changes: "critical",
  approved: "success",
  scheduled: "primary",
  published: "info",
} as const satisfies Record<DraftStatus, StatusIndicatorTone>;

function getDraftById(
  drafts: readonly ContentDraft[],
  draftId: string,
): ContentDraft | undefined {
  return drafts.find((draft) => draft.id === draftId) ?? drafts[0];
}

function updateDraftById(
  drafts: readonly ContentDraft[],
  draftId: string,
  updates: Partial<ContentDraft>,
): ContentDraft[] {
  return drafts.map((draft) =>
    draft.id === draftId ? { ...draft, ...updates } : draft,
  );
}

export function DraftStudioShell({ data }: DraftStudioShellProps) {
  const [drafts, setDrafts] = useState<ContentDraft[]>([...data.drafts]);
  const [activeDraftId, setActiveDraftId] = useState(data.drafts[0]?.id ?? "");
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  const activeDraft = getDraftById(drafts, activeDraftId);

  if (!activeDraft) {
    return (
      <SurfaceCard className="max-w-3xl">
        <p className="luxe-eyebrow">Draft Studio</p>
        <h1 className="luxe-page-title mt-3">No drafts yet.</h1>
        <p className="luxe-page-description mt-4">
          Save a brief with at least one target channel to create channel drafts.
        </p>
      </SurfaceCard>
    );
  }

  const currentDraft = activeDraft;

  function handleDraftChange(updates: Partial<ContentDraft>) {
    setDrafts((currentDrafts) =>
      updateDraftById(currentDrafts, currentDraft.id, updates),
    );
    setSavedDraftId(null);
  }

  function handleSave() {
    const updatedAt = new Date().toISOString();
    setDrafts((currentDrafts) =>
      updateDraftById(currentDrafts, currentDraft.id, { updatedAt }),
    );
    setSavedDraftId(currentDraft.id);
  }

  const activeStatusLabel = DRAFT_STATUS_LABELS[currentDraft.status];
  const activeStatusTone = DRAFT_STATUS_TONES[currentDraft.status];
  const savedCurrentDraft = savedDraftId === currentDraft.id;

  return (
    <div className="flex min-h-full flex-col gap-8">
      <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
        <div className="max-w-4xl">
          <p className="luxe-eyebrow">{data.pageHeader.eyebrow}</p>
          <h1 className="luxe-page-title mt-3">{data.pageHeader.title}</h1>
          <p className="luxe-page-description mt-4">
            {data.pageHeader.description}
          </p>
        </div>

        <SurfaceCard className="flex flex-col gap-3" padding="sm">
          <p className="luxe-eyebrow">Current Status</p>
          <div className="flex items-center justify-between gap-4">
            <StatusIndicator
              label={activeStatusLabel}
              tone={activeStatusTone}
              uppercase
            />
            <p className="luxe-form-help">
              Updated {formatDisplayDate(currentDraft.updatedAt)}
            </p>
          </div>
        </SurfaceCard>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SurfaceCard className="flex min-h-0 flex-col gap-6">
          <div className="flex flex-col gap-4 border-b border-(--color-border-subtle) pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="luxe-eyebrow">Channel Drafts</p>
              <h2 className="luxe-section-title mt-2">
                One working draft per selected channel
              </h2>
            </div>

            <div className="flex flex-wrap gap-2" role="tablist">
              {drafts.map((draft) => {
                const isActive = draft.id === currentDraft.id;

                return (
                  <button
                    aria-selected={isActive}
                    className={
                      isActive
                        ? "luxe-primary-action luxe-focus-ring rounded-sm px-4 py-2 text-sm font-semibold"
                        : "luxe-secondary-action luxe-focus-ring rounded-sm px-4 py-2 text-sm font-semibold"
                    }
                    key={draft.id}
                    onClick={() => {
                      setActiveDraftId(draft.id);
                      setSavedDraftId(null);
                    }}
                    role="tab"
                    type="button"
                  >
                    {CONTENT_CHANNEL_LABELS[draft.channel]}
                  </button>
                );
              })}
            </div>
          </div>

          <form
            aria-label="Draft editor"
            className="flex min-h-0 flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <div>
              <label className="luxe-form-label" htmlFor="draft-title">
                Draft title
              </label>
              <input
                className="luxe-field mt-2 h-12 w-full px-4"
                id="draft-title"
                name="title"
                onChange={(event) =>
                  handleDraftChange({ title: event.currentTarget.value })
                }
                value={currentDraft.title}
              />
            </div>

            <div className="min-h-0 flex-1">
              <label className="luxe-form-label" htmlFor="draft-content">
                Draft content
              </label>
              <textarea
                className="luxe-field mt-2 min-h-[420px] w-full resize-y px-4 py-3 leading-6"
                id="draft-content"
                name="content"
                onChange={(event) =>
                  handleDraftChange({ content: event.currentTarget.value })
                }
                value={currentDraft.content}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-(--color-border-subtle) pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="luxe-form-help">
                {savedCurrentDraft
                  ? "Draft saved locally. API update wiring is ready for the next integration pass."
                  : "Edits stay in this studio until you save the active channel draft."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Link
                  className="luxe-secondary-action luxe-focus-ring rounded-sm px-5 py-3 text-center text-sm font-semibold"
                  href={complianceReviewRoute(currentDraft.id)}
                >
                  Review compliance
                </Link>
                <button
                  className="luxe-primary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold"
                  type="submit"
                >
                  Save draft
                </button>
              </div>
            </div>
          </form>
        </SurfaceCard>

        <aside className="space-y-6">
          <SurfaceCard className="flex flex-col gap-5">
            <div>
              <p className="luxe-eyebrow">Brief Context</p>
              <h2 className="luxe-section-title mt-2">Source Brief</h2>
            </div>

            <div className="space-y-4">
              <div className="luxe-preview-stat p-4">
                <p className="luxe-label-sm">Objective</p>
                <p className="mt-2 text-sm leading-6">
                  {data.brief.contentObjective}
                </p>
              </div>

              <div className="luxe-preview-stat p-4">
                <p className="luxe-label-sm">Audience</p>
                <p className="mt-2 text-sm leading-6">{data.brief.audience}</p>
              </div>

              <div className="luxe-preview-stat p-4">
                <p className="luxe-label-sm">Constraints</p>
                <p className="mt-2 text-sm leading-6">
                  {data.brief.constraints}
                </p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="flex flex-col gap-4">
            <div>
              <p className="luxe-eyebrow">Draft Metadata</p>
              <h2 className="luxe-section-title mt-2">
                {CONTENT_CHANNEL_LABELS[currentDraft.channel]}
              </h2>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Status</dt>
                <dd className="font-medium">{activeStatusLabel}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Created</dt>
                <dd className="font-medium">
                  {formatDisplayDate(currentDraft.createdAt)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Draft ID</dt>
                <dd className="max-w-44 truncate text-right font-medium">
                  {currentDraft.id}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="luxe-form-help">Brief ID</dt>
                <dd className="max-w-44 truncate text-right font-medium">
                  {currentDraft.briefId}
                </dd>
              </div>
            </dl>
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}
