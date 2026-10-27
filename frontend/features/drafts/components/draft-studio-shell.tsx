"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StatusIndicator } from "@/components/ui/status-indicator";
import type { StatusIndicatorTone } from "@/components/ui/status-indicator";
import { SurfaceCard } from "@/components/ui/surface-card";
import { generateDrafts } from "@/lib/api/ai";
import { getSession } from "@/lib/api/auth";
import { deleteContentBrief, getContentBriefs } from "@/lib/api/content-briefs";
import { getContentDrafts, updateContentDraft } from "@/lib/api/content-drafts";
import { ApiError } from "@/lib/api/http-client";
import {
  CONTENT_CHANNEL_LABELS,
  DRAFT_STATUS_LABELS,
  formatDisplayDate,
} from "@/lib/formatters";
import { APP_ROUTES, complianceReviewRoute, draftStudioRoute } from "@/lib/routes";
import type { ContentBrief, ContentDraft, DraftStatus } from "@/types/content";
import type { DraftStudioViewData } from "@/features/drafts/data/get-draft-studio-page";

interface DraftStudioShellProps {
  data: DraftStudioViewData;
  initialBriefId?: string;
}

type DataSource = "loading" | "api" | "mock";
type RequestStatus = "idle" | "loading" | "success" | "error";

const DRAFT_STATUS_TONES = {
  draft: "neutral",
  in_review: "warning",
  needs_changes: "critical",
  approved: "success",
  scheduled: "primary",
  published: "info",
} as const satisfies Record<DraftStatus, StatusIndicatorTone>;

const DATA_SOURCE_LABELS = {
  loading: "Loading",
  api: "Live",
  mock: "Demo",
} as const satisfies Record<DataSource, string>;

const DATA_SOURCE_TONES = {
  loading: "info",
  api: "success",
  mock: "neutral",
} as const satisfies Record<DataSource, StatusIndicatorTone>;

const DELETE_WARNING_ITEMS = [
  "the brief",
  "generated drafts",
  "saved edits",
  "compliance checks and issues",
  "approvals",
  "scheduled content",
] as const;

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

function getPersistedDraftContents(
  drafts: readonly ContentDraft[],
): Record<string, string> {
  return Object.fromEntries(drafts.map((draft) => [draft.id, draft.content]));
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function generatedDraftToContentDraft(
  draft: Awaited<ReturnType<typeof generateDrafts>>["drafts"][number],
  workspaceId: string,
): ContentDraft {
  const now = new Date().toISOString();
  return {
    id: draft.id,
    workspaceId,
    briefId: draft.brief,
    title: draft.title,
    content: draft.content,
    channel: draft.channel,
    status: draft.status,
    createdBy: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function DraftStudioShell({ data, initialBriefId }: DraftStudioShellProps) {
  const router = useRouter();
  const [briefs, setBriefs] = useState<ContentBrief[]>([data.brief]);
  const [brief, setBrief] = useState<ContentBrief>(data.brief);
  const [drafts, setDrafts] = useState<ContentDraft[]>([...data.drafts]);
  const [persistedDraftContents, setPersistedDraftContents] = useState<
    Record<string, string>
  >({});
  const [activeDraftId, setActiveDraftId] = useState(data.drafts[0]?.id ?? "");
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("loading");
  const [loadMessage, setLoadMessage] = useState("Loading persisted drafts.");
  const [generationStatus, setGenerationStatus] =
    useState<RequestStatus>("idle");
  const [generationMessage, setGenerationMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<RequestStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState<RequestStatus>("idle");
  const [copyMessage, setCopyMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<RequestStatus>("idle");
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLiveDrafts() {
      try {
        const [session, briefs] = await Promise.all([
          getSession(),
          getContentBriefs(),
        ]);
        const workspaceBriefs = briefs.filter(
          (item) => item.workspaceId === session.activeWorkspaceId,
        );
        const availableBriefs = workspaceBriefs.length > 0 ? workspaceBriefs : briefs;
        const selectedBrief =
          availableBriefs.find((item) => item.id === initialBriefId) ??
          availableBriefs[0];

        if (!selectedBrief) {
          if (!cancelled) {
            setDataSource("mock");
            setLoadMessage("No persisted briefs found. Showing demo draft data.");
          }
          return;
        }

        const selectedDrafts = await getContentDrafts(selectedBrief.id);
        if (cancelled) return;

        setBriefs(availableBriefs);
        setBrief(selectedBrief);
        setDrafts(selectedDrafts);
        setPersistedDraftContents(getPersistedDraftContents(selectedDrafts));
        setActiveDraftId(selectedDrafts[0]?.id ?? "");
        setDataSource("api");
        setLoadMessage(
          selectedDrafts.length > 0
            ? "Persisted drafts loaded."
            : "No drafts have been generated for this brief yet.",
        );
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[DraftStudioShell] API unavailable, using mock data. Reason: ${errorMessage(error)}`,
          );
        }
        if (!cancelled) {
          setDataSource("mock");
          setLoadMessage("API unavailable. Showing demo draft data.");
        }
      }
    }

    void loadLiveDrafts();

    return () => {
      cancelled = true;
    };
  }, [data.brief, initialBriefId]);

  const currentDraft = getDraftById(drafts, activeDraftId);
  const activeStatusLabel = currentDraft
    ? DRAFT_STATUS_LABELS[currentDraft.status]
    : "No draft";
  const activeStatusTone = currentDraft
    ? DRAFT_STATUS_TONES[currentDraft.status]
    : "neutral";
  const savedCurrentDraft = currentDraft ? savedDraftId === currentDraft.id : false;
  const canGenerate = generationStatus !== "loading" && dataSource !== "loading";
  const canDelete = deleteStatus !== "loading" && dataSource !== "loading";
  const targetChannelLabels = brief.targetChannels
    .map((channel) => CONTENT_CHANNEL_LABELS[channel])
    .join(", ");
  const hasExistingDrafts = drafts.length > 0;

  async function selectBrief(nextBriefId: string) {
    const selectedBrief = briefs.find((item) => item.id === nextBriefId);
    if (!selectedBrief) return;

    setBrief(selectedBrief);
    setDrafts([]);
    setPersistedDraftContents({});
    setActiveDraftId("");
    setSavedDraftId(null);
    setGenerationStatus("idle");
    setGenerationMessage("");
    setSaveStatus("idle");
    setSaveMessage("");
    setCopyStatus("idle");
    setCopyMessage("");
    setDeleteStatus("idle");
    setDeleteMessage("");
    router.replace(draftStudioRoute(selectedBrief.id));

    if (dataSource !== "api") {
      setLoadMessage("Demo brief selected.");
      return;
    }

    setLoadMessage("Loading drafts for the selected brief.");

    try {
      const selectedDrafts = await getContentDrafts(selectedBrief.id);
      setDrafts(selectedDrafts);
      setPersistedDraftContents(getPersistedDraftContents(selectedDrafts));
      setActiveDraftId(selectedDrafts[0]?.id ?? "");
      setLoadMessage(
        selectedDrafts.length > 0
          ? "Persisted drafts loaded."
          : "No drafts have been generated for this brief yet.",
      );
    } catch (error) {
      setDataSource("mock");
      setPersistedDraftContents({});
      setLoadMessage(errorMessage(error));
    }
  }

  async function handleDeleteBrief() {
    if (!canDelete) return;

    setDeleteStatus("loading");
    setDeleteMessage("Deleting brief.");

    try {
      if (dataSource === "api") {
        await deleteContentBrief(brief.id);
      }

      const remainingBriefs = briefs.filter((item) => item.id !== brief.id);
      const nextBrief = remainingBriefs[0];

      setBriefs(remainingBriefs);
      setDrafts([]);
      setPersistedDraftContents({});
      setActiveDraftId("");
      setSavedDraftId(null);
      setDeleteDialogOpen(false);
      setDeleteStatus("success");
      setDeleteMessage(
        dataSource === "api" ? "Brief deleted." : "Demo brief deleted locally.",
      );
      setGenerationStatus("idle");
      setGenerationMessage("");
      setSaveStatus("idle");
      setSaveMessage("");
      setCopyStatus("idle");
      setCopyMessage("");

      if (!nextBrief) {
        router.push(APP_ROUTES.create);
        return;
      }

      setBrief(nextBrief);
      router.replace(draftStudioRoute(nextBrief.id));

      if (dataSource !== "api") {
        setLoadMessage("Demo brief selected.");
        return;
      }

      const nextDrafts = await getContentDrafts(nextBrief.id);
      setDrafts(nextDrafts);
      setPersistedDraftContents(getPersistedDraftContents(nextDrafts));
      setActiveDraftId(nextDrafts[0]?.id ?? "");
      setLoadMessage(
        nextDrafts.length > 0
          ? "Persisted drafts loaded."
          : "No drafts have been generated for this brief yet.",
      );
    } catch (error) {
      setDeleteStatus("error");
      setDeleteMessage(errorMessage(error));
    }
  }

  function handleDraftChange(draftId: string, updates: Partial<ContentDraft>) {
    setDrafts((currentDrafts) => updateDraftById(currentDrafts, draftId, updates));
    setSavedDraftId(null);
    setSaveStatus("idle");
    setSaveMessage("");
    setCopyStatus("idle");
    setCopyMessage("");
  }

  async function handleGenerateDrafts() {
    if (!canGenerate) return;

    if (dataSource !== "api") {
      setGenerationStatus("error");
      setGenerationMessage("Sign in and load a persisted brief before generating drafts.");
      return;
    }

    if (brief.targetChannels.length === 0) {
      setGenerationStatus("error");
      setGenerationMessage("This brief has no target channels.");
      return;
    }

    setGenerationStatus("loading");
    setGenerationMessage("Generating channel drafts.");
    setSaveStatus("idle");
    setSaveMessage("");
    setPersistedDraftContents({});
    setCopyStatus("idle");
    setCopyMessage("");

    try {
      const response = await generateDrafts({
        workspace: brief.workspaceId,
        brief: brief.id,
        channels: brief.targetChannels,
      });
      const persistedDrafts = await getContentDrafts(brief.id);
      const nextDrafts =
        persistedDrafts.length > 0
          ? persistedDrafts
          : response.drafts.map((draft) =>
              generatedDraftToContentDraft(draft, brief.workspaceId),
            );

      setDrafts(nextDrafts);
      setPersistedDraftContents(getPersistedDraftContents(persistedDrafts));
      setActiveDraftId(response.drafts[0]?.id ?? nextDrafts[0]?.id ?? "");
      setSavedDraftId(null);
      setGenerationStatus("success");
      setGenerationMessage(
        `Generated ${response.drafts.length} draft${
          response.drafts.length === 1 ? "" : "s"
        }. AI runs: ${response.aiRunIds.join(", ")}.`,
      );
    } catch (error) {
      setGenerationStatus("error");
      setGenerationMessage(errorMessage(error));
    }
  }

  async function handleSave() {
    if (!currentDraft) return;

    const updatedAt = new Date().toISOString();

    if (dataSource !== "api") {
      setDrafts((currentDrafts) =>
        updateDraftById(currentDrafts, currentDraft.id, { updatedAt }),
      );
      setSavedDraftId(currentDraft.id);
      setSaveStatus("success");
      setSaveMessage("Demo draft saved locally.");
      return;
    }

    setSaveStatus("loading");
    setSaveMessage("Saving draft.");

    try {
      const savedDraft = await updateContentDraft(currentDraft.id, {
        title: currentDraft.title,
        content: currentDraft.content,
      });
      setDrafts((currentDrafts) =>
        updateDraftById(currentDrafts, currentDraft.id, savedDraft),
      );
      setPersistedDraftContents((currentContents) => ({
        ...currentContents,
        [savedDraft.id]: savedDraft.content,
      }));
      setSavedDraftId(savedDraft.id);
      setSaveStatus("success");
      setSaveMessage("Draft saved.");
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(errorMessage(error));
    }
  }

  const persistedCurrentContent = currentDraft
    ? persistedDraftContents[currentDraft.id]
    : undefined;
  const canCopyDraft =
    dataSource === "api" &&
    currentDraft?.channel === "linkedin" &&
    currentDraft.content.trim().length > 0 &&
    persistedCurrentContent === currentDraft.content;

  async function handleCopyDraft() {
    if (!currentDraft || !canCopyDraft) return;

    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyStatus("error");
      setCopyMessage(
        "Clipboard access is unavailable in this browser. Select and copy the draft text manually.",
      );
      return;
    }

    setCopyStatus("loading");
    setCopyMessage("Copying draft text.");

    try {
      await navigator.clipboard.writeText(currentDraft.content);
      setCopyStatus("success");
      setCopyMessage(
        "Draft text copied. This does not approve or publish it or indicate final export readiness.",
      );
    } catch {
      setCopyStatus("error");
      setCopyMessage(
        "Could not copy draft text. Check browser clipboard permissions and try again.",
      );
    }
  }

  const copyUnavailableMessage =
    currentDraft?.channel !== "linkedin"
      ? ""
      : dataSource !== "api"
        ? "Copy is available only for a persisted LinkedIn draft."
        : persistedCurrentContent !== currentDraft.content
          ? "Save this draft before copying its persisted text."
          : currentDraft.content.trim().length === 0
            ? "Add draft text before copying."
            : "";

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
            <StatusIndicator
              label={DATA_SOURCE_LABELS[dataSource]}
              tone={DATA_SOURCE_TONES[dataSource]}
            />
          </div>
          <p className="luxe-form-help">
            {currentDraft
              ? `Updated ${formatDisplayDate(currentDraft.updatedAt)}`
              : loadMessage}
          </p>
        </SurfaceCard>
      </header>

      <SurfaceCard className="flex flex-col gap-4" padding="sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div>
            <p className="luxe-eyebrow">Current Brief</p>
            <h2 className="luxe-section-title mt-2">{brief.contentObjective}</h2>
            <p className="luxe-form-help mt-3">
              Brief = what you want to create and why. Draft = generated,
              editable content for one channel.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {briefs.length > 1 ? (
              <div>
                <label className="luxe-form-label" htmlFor="brief-selector">
                  Switch brief
                </label>
                <select
                  className="luxe-field mt-2 h-12 w-full px-4"
                  id="brief-selector"
                  onChange={(event) => {
                    void selectBrief(event.currentTarget.value);
                  }}
                  value={brief.id}
                >
                  {briefs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.contentObjective}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <button
              className="luxe-danger-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canDelete}
              onClick={() => {
                setDeleteDialogOpen(true);
                setDeleteStatus("idle");
                setDeleteMessage("");
              }}
              type="button"
            >
              Delete Brief
            </button>
          </div>
        </div>

        {deleteMessage ? (
          <p
            className={
              deleteStatus === "error"
                ? "text-sm font-medium text-(--color-danger)"
                : "luxe-form-help"
            }
          >
            {deleteMessage}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="luxe-preview-stat p-4">
            <p className="luxe-label-sm">Audience</p>
            <p className="mt-2 text-sm leading-6">{brief.audience}</p>
          </div>
          <div className="luxe-preview-stat p-4">
            <p className="luxe-label-sm">Why this content exists</p>
            <p className="mt-2 text-sm leading-6">{brief.angle || brief.campaignGoal}</p>
          </div>
          <div className="luxe-preview-stat p-4">
            <p className="luxe-label-sm">Guardrails</p>
            <p className="mt-2 text-sm leading-6">
              {brief.constraints || "No constraints added."}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="flex flex-col gap-4" padding="sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="luxe-eyebrow">Generate Channel Drafts</p>
            <h2 className="luxe-section-title mt-2">Create drafts from this brief</h2>
            <p className="luxe-form-help mt-2">
              One brief can produce multiple channel drafts. Channels:
              {" "}
              {targetChannelLabels || "None selected"}
            </p>
          </div>
          <button
            className="luxe-primary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canGenerate}
            onClick={handleGenerateDrafts}
            type="button"
          >
            {generationStatus === "loading" ? "Generating..." : "Generate Drafts"}
          </button>
        </div>

        {hasExistingDrafts ? (
          <p className="luxe-preview-stat p-4 text-sm">
            Regenerating will update the existing drafts for this brief and its
            selected channels.
          </p>
        ) : null}

        {generationMessage ? (
          <p
            className={
              generationStatus === "error"
                ? "text-sm font-medium text-(--color-danger)"
                : "luxe-form-help"
            }
          >
            {generationMessage}
          </p>
        ) : null}
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SurfaceCard className="flex min-h-0 flex-col gap-6">
          <div className="flex flex-col gap-4 border-b border-(--color-border-subtle) pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="luxe-eyebrow">Drafts from this Brief</p>
              <h2 className="luxe-section-title mt-2">
                Generated, editable channel outputs
              </h2>
            </div>

            {drafts.length > 0 ? (
              <div className="flex flex-wrap gap-2" role="tablist">
                {drafts.map((draft) => {
                  const isActive = currentDraft?.id === draft.id;

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
                        setSaveStatus("idle");
                        setSaveMessage("");
                        setCopyStatus("idle");
                        setCopyMessage("");
                      }}
                      role="tab"
                      type="button"
                    >
                      {CONTENT_CHANNEL_LABELS[draft.channel]}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {currentDraft ? (
            <form
              aria-label="Draft editor"
              className="flex min-h-0 flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <div>
                <p className="luxe-eyebrow">Active Draft</p>
                <h2 className="luxe-section-title mt-2">
                  {CONTENT_CHANNEL_LABELS[currentDraft.channel]}
                </h2>
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
                    handleDraftChange(currentDraft.id, {
                      title: event.currentTarget.value,
                    })
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
                    handleDraftChange(currentDraft.id, {
                      content: event.currentTarget.value,
                    })
                  }
                  value={currentDraft.content}
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-(--color-border-subtle) pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={
                    saveStatus === "error"
                      ? "text-sm font-medium text-(--color-danger)"
                      : "luxe-form-help"
                  }
                >
                  {saveMessage ||
                    (savedCurrentDraft
                      ? "Draft saved."
                      : "Edits stay in this studio until you save the active channel draft.")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Link
                    className="luxe-secondary-action luxe-focus-ring rounded-sm px-5 py-3 text-center text-sm font-semibold"
                    href={complianceReviewRoute(currentDraft.id)}
                  >
                    Review this Draft
                  </Link>
                  {currentDraft.channel === "linkedin" ? (
                    <button
                      className="luxe-secondary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!canCopyDraft || copyStatus === "loading"}
                      onClick={() => {
                        void handleCopyDraft();
                      }}
                      type="button"
                    >
                      Copy LinkedIn draft
                    </button>
                  ) : null}
                  <button
                    className="luxe-primary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={saveStatus === "loading"}
                    type="submit"
                  >
                    {saveStatus === "loading" ? "Saving..." : "Save draft"}
                  </button>
                </div>
              </div>
              {currentDraft.channel === "linkedin" ? (
                <p
                  aria-live={copyStatus === "error" ? "assertive" : "polite"}
                  className={
                    copyStatus === "error"
                      ? "text-sm font-medium text-(--color-danger)"
                      : "luxe-form-help"
                  }
                  role={copyStatus === "error" ? "alert" : "status"}
                >
                  {copyMessage ||
                    (!canCopyDraft ? copyUnavailableMessage : "")}
                </p>
              ) : null}
            </form>
          ) : (
            <div className="luxe-preview-stat space-y-3 p-4">
              <p className="font-medium">No drafts for this brief yet.</p>
              <p className="luxe-form-help">
                {loadMessage} Generate channel drafts to create editable content
                outputs from the selected brief.
              </p>
            </div>
          )}
        </SurfaceCard>

        <aside className="space-y-6">
          {currentDraft ? (
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
          ) : null}
        </aside>
      </div>

      {deleteDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            aria-labelledby="delete-brief-title"
            aria-modal="true"
            className="luxe-panel flex w-full max-w-xl flex-col gap-6 p-6"
            role="dialog"
          >
            <div>
              <p className="luxe-eyebrow">Delete Brief</p>
              <h2 className="luxe-section-title mt-2" id="delete-brief-title">
                Permanently delete this brief?
              </h2>
              <p className="luxe-form-help mt-3">
                This cannot be undone. Deleting this brief permanently deletes:
              </p>
            </div>

            <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
              {DELETE_WARNING_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            {deleteMessage ? (
              <p
                className={
                  deleteStatus === "error"
                    ? "text-sm font-medium text-(--color-danger)"
                    : "luxe-form-help"
                }
              >
                {deleteMessage}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="luxe-secondary-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold"
                disabled={deleteStatus === "loading"}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeleteStatus("idle");
                  setDeleteMessage("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="luxe-danger-action luxe-focus-ring rounded-sm px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deleteStatus === "loading"}
                onClick={() => {
                  void handleDeleteBrief();
                }}
                type="button"
              >
                {deleteStatus === "loading" ? "Deleting..." : "Delete Brief"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
