"use client";

import Link from "next/link";
import { useState } from "react";

import { StatusIndicator } from "@/components/ui/status-indicator";
import type { StatusIndicatorTone } from "@/components/ui/status-indicator";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  CONTENT_CHANNEL_LABELS,
  DRAFT_STATUS_LABELS,
  formatDisplayDate,
} from "@/lib/formatters";
import { complianceReviewRoute } from "@/lib/routes";
import type { ContentDraft, DraftStatus } from "@/types/content";
import type {
  DraftStudioAiSimulationState,
  DraftStudioViewData,
} from "@/features/drafts/data/get-draft-studio-page";

interface DraftStudioShellProps {
  data: DraftStudioViewData;
}

const DRAFT_STATUS_TONES = {
  draft: "neutral",
  in_review: "warning",
  needs_changes: "critical",
  approved: "success",
  scheduled: "primary",
  published: "info",
} as const satisfies Record<DraftStatus, StatusIndicatorTone>;

const AI_STATE_LABELS = {
  ready: "Guidance Ready",
  loading: "Guidance Loading",
  failure: "Guidance Unavailable",
  empty: "No Suggestions",
} as const satisfies Record<DraftStudioAiSimulationState, string>;

const AI_STATE_TONES = {
  ready: "success",
  loading: "info",
  failure: "critical",
  empty: "neutral",
} as const satisfies Record<DraftStudioAiSimulationState, StatusIndicatorTone>;

const AI_SIMULATION_STATES: readonly DraftStudioAiSimulationState[] = [
  "ready",
  "loading",
  "failure",
  "empty",
];

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
  const [aiSimulationState, setAiSimulationState] =
    useState<DraftStudioAiSimulationState>(data.aiPanel.state);
  const [suggestionStates, setSuggestionStates] = useState<
    Record<string, "suggested" | "applied" | "discarded">
  >(() =>
    Object.fromEntries(
      data.aiPanel.suggestions.map((suggestion) => [suggestion.id, suggestion.state]),
    ),
  );

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
  const guidanceFailure = data.aiPanel.failures.find(
    (failure) => failure.stage === "brief_guidance",
  );
  const suggestionFailure = data.aiPanel.failures.find(
    (failure) =>
      failure.stage === "draft_generation" &&
      (failure.draftId === currentDraft.id || failure.draftId === null),
  );
  const activeSuggestions = data.aiPanel.suggestions.filter(
    (suggestion) =>
      suggestion.draftId === currentDraft.id &&
      suggestion.channel === currentDraft.channel,
  );

  function handleSuggestionStateChange(
    suggestionId: string,
    state: "suggested" | "applied" | "discarded",
  ) {
    setSuggestionStates((current) => ({
      ...current,
      [suggestionId]: state,
    }));
  }

  function handleApplySuggestion(suggestionId: string) {
    const selectedSuggestion = activeSuggestions.find(
      (suggestion) => suggestion.id === suggestionId,
    );

    if (!selectedSuggestion) return;

    handleDraftChange({
      title: selectedSuggestion.title,
      content: selectedSuggestion.content,
    });
    handleSuggestionStateChange(selectedSuggestion.id, "applied");
  }

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
            <div className="space-y-4 border-b border-(--color-border-subtle) pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="luxe-eyebrow">Mock AI Guidance</p>
                  <h3 className="luxe-section-title mt-2 text-lg">
                    Simulated guidance and draft suggestions
                  </h3>
                </div>
                <StatusIndicator
                  label={AI_STATE_LABELS[aiSimulationState]}
                  tone={AI_STATE_TONES[aiSimulationState]}
                />
              </div>

              <div className="flex flex-wrap gap-2" aria-label="AI simulation states">
                {AI_SIMULATION_STATES.map((state) => {
                  const isActive = aiSimulationState === state;

                  return (
                    <button
                      aria-pressed={isActive}
                      className={
                        isActive
                          ? "luxe-primary-action luxe-focus-ring rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                          : "luxe-secondary-action luxe-focus-ring rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                      }
                      key={state}
                      onClick={() => setAiSimulationState(state)}
                      type="button"
                    >
                      {AI_STATE_LABELS[state]}
                    </button>
                  );
                })}
              </div>

              <div className="luxe-preview-stat space-y-4 p-4">
                <p className="luxe-form-help">{data.aiPanel.disclaimer}</p>

                {aiSimulationState === "loading" ? (
                  <p className="text-sm leading-6">
                    Preparing simulated brief analysis and channel suggestions for this draft.
                  </p>
                ) : null}

                {aiSimulationState === "failure" ? (
                  <div className="space-y-3">
                    <p className="font-medium">{guidanceFailure?.title ?? "Guidance unavailable"}</p>
                    <p className="text-sm leading-6">
                      {guidanceFailure?.message ??
                        "Mock guidance is currently unavailable for this scenario."}
                    </p>
                    <button
                      className="luxe-secondary-action luxe-focus-ring rounded-sm px-4 py-2 text-sm font-semibold"
                      onClick={() => setAiSimulationState("ready")}
                      type="button"
                    >
                      {guidanceFailure?.retryLabel ?? "Retry guidance"}
                    </button>
                  </div>
                ) : null}

                {aiSimulationState === "ready" || aiSimulationState === "empty" ? (
                  <div className="space-y-3">
                    <p className="font-medium">{data.aiPanel.guidance.ready.summary}</p>

                    <div>
                      <p className="luxe-label-sm">Strengths</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {data.aiPanel.guidance.ready.strengths.map((strength) => (
                          <li key={strength}>{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="luxe-label-sm">Gaps to review</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {data.aiPanel.guidance.ready.gaps.map((gap) => (
                          <li key={gap}>{gap}</li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-sm leading-6">
                      Next action: {data.aiPanel.guidance.ready.nextAction}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="luxe-label-sm">Channel suggestions (simulated)</p>

                {aiSimulationState === "loading" ? (
                  <p className="luxe-form-help">
                    Suggestion cards will appear here once simulated generation completes.
                  </p>
                ) : null}

                {aiSimulationState === "failure" ? (
                  <div className="luxe-preview-stat space-y-3 p-4">
                    <p className="font-medium">{suggestionFailure?.title ?? "Suggestion service unavailable"}</p>
                    <p className="text-sm leading-6">
                      {suggestionFailure?.message ??
                        "Mock suggestions are unavailable for this state."}
                    </p>
                    <button
                      className="luxe-secondary-action luxe-focus-ring rounded-sm px-4 py-2 text-sm font-semibold"
                      onClick={() => setAiSimulationState("ready")}
                      type="button"
                    >
                      {suggestionFailure?.retryLabel ?? "Retry suggestions"}
                    </button>
                  </div>
                ) : null}

                {aiSimulationState === "empty" ? (
                  <div className="luxe-preview-stat space-y-2 p-4">
                    <p className="font-medium">No suggestions returned for this simulation.</p>
                    <p className="luxe-form-help">
                      Keep editing manually or switch to the ready simulation state.
                    </p>
                    <button
                      className="luxe-secondary-action luxe-focus-ring rounded-sm px-4 py-2 text-sm font-semibold"
                      onClick={() => setAiSimulationState("ready")}
                      type="button"
                    >
                      Generate suggestions again
                    </button>
                  </div>
                ) : null}

                {aiSimulationState === "ready" ? (
                  activeSuggestions.length > 0 ? (
                    <div className="grid gap-3">
                      {activeSuggestions.map((suggestion) => {
                        const suggestionState =
                          suggestionStates[suggestion.id] ?? suggestion.state;
                        const isApplied = suggestionState === "applied";

                        return (
                          <div className="luxe-preview-stat space-y-3 p-4" key={suggestion.id}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium">{suggestion.title}</p>
                              <StatusIndicator
                                label={
                                  suggestionState === "applied"
                                    ? "Applied"
                                    : suggestionState === "discarded"
                                      ? "Discarded"
                                      : "Suggested"
                                }
                                tone={
                                  suggestionState === "applied"
                                    ? "success"
                                    : suggestionState === "discarded"
                                      ? "neutral"
                                      : "primary"
                                }
                              />
                            </div>

                            <p className="text-sm leading-6">{suggestion.content}</p>
                            <p className="luxe-form-help">Rationale: {suggestion.rationale}</p>
                            <ul className="list-disc space-y-1 pl-5 text-sm">
                              {suggestion.fitNotes.map((fitNote) => (
                                <li key={fitNote}>{fitNote}</li>
                              ))}
                            </ul>

                            <div className="flex flex-wrap gap-2">
                              <button
                                className="luxe-primary-action luxe-focus-ring rounded-sm px-4 py-2 text-sm font-semibold"
                                disabled={isApplied}
                                onClick={() => handleApplySuggestion(suggestion.id)}
                                type="button"
                              >
                                {isApplied ? "Applied to draft" : "Apply suggestion"}
                              </button>
                              <button
                                className="luxe-secondary-action luxe-focus-ring rounded-sm px-4 py-2 text-sm font-semibold"
                                onClick={() =>
                                  handleSuggestionStateChange(suggestion.id, "discarded")
                                }
                                type="button"
                              >
                                Discard
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="luxe-form-help">
                      No simulated suggestions are mapped to this draft channel.
                    </p>
                  )
                ) : null}
              </div>
            </div>

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
