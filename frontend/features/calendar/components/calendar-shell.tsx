"use client";

import { useMemo, useState } from "react";

import { StatusIndicator } from "@/components/ui/status-indicator";
import type { StatusIndicatorTone } from "@/components/ui/status-indicator";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { CalendarPageData } from "@/data/mock-calendar";
import {
  CONTENT_CHANNEL_LABELS,
  DRAFT_STATUS_LABELS,
  COMPLIANCE_STATUS_LABELS,
  formatDisplayDate,
  formatShortDate,
} from "@/lib/formatters";
import type { ContentDraft, DraftStatus, ScheduledContent, DraftComment, AuditLog } from "@/types/content";
import type { ComplianceStatus } from "@/types/compliance";

interface CalendarShellProps {
  data: CalendarPageData;
}

const DRAFT_STATUS_TONES = {
  draft: "neutral",
  in_review: "warning",
  needs_changes: "critical",
  approved: "success",
  scheduled: "primary",
  published: "info",
} as const satisfies Record<DraftStatus, StatusIndicatorTone>;

const COMPLIANCE_STATUS_TONES = {
  green: "success",
  yellow: "warning",
  red: "critical",
} as const satisfies Record<ComplianceStatus, StatusIndicatorTone>;

// HEX colors for compliance traffic light indicators per DESIGN.md
const COMPLIANCE_COLORS = {
  green: "#2D5A27", // Emerald Green
  yellow: "#F57C00", // Amber
  red: "#D32F2F", // Soft Red
} as const;

function getDraftById(
  drafts: readonly ContentDraft[],
  draftId: string,
): ContentDraft | undefined {
  return drafts.find((draft) => draft.id === draftId);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupScheduledContent(
  items: readonly ScheduledContent[],
): Array<{ dateKey: string; scheduledFor: string; items: ScheduledContent[] }> {
  const groups = new Map<string, { dateKey: string; scheduledFor: string; items: ScheduledContent[] }>();
  const sortedItems = [...items].sort(
    (a, b) =>
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
  );

  sortedItems.forEach((item) => {
    const dateKey = item.scheduledFor.slice(0, 10);
    const group = groups.get(dateKey);

    if (group) {
      group.items.push(item);
      return;
    }

    groups.set(dateKey, {
      dateKey,
      scheduledFor: item.scheduledFor,
      items: [item],
    });
  });

  return Array.from(groups.values());
}

export function CalendarShell({ data }: CalendarShellProps) {
  const [selectedItemId, setSelectedItemId] = useState(
    data.scheduledContent[0]?.id ?? "",
  );

  const [commentsState, setCommentsState] = useState<DraftComment[]>(
    () => [...data.comments],
  );
  const [newComment, setNewComment] = useState("");

  const groups = useMemo(
    () => groupScheduledContent(data.scheduledContent),
    [data.scheduledContent],
  );

  const selectedItem =
    data.scheduledContent.find((item) => item.id === selectedItemId) ??
    data.scheduledContent[0];

  const selectedDraft = selectedItem
    ? getDraftById(data.drafts, selectedItem.draftId)
    : undefined;

  const selectedComplianceCheck = useMemo(() => {
    if (!selectedDraft) return undefined;
    return data.complianceChecks.find((c) => c.draftId === selectedDraft.id);
  }, [data.complianceChecks, selectedDraft]);

  const selectedComments = useMemo(() => {
    if (!selectedDraft) return [];
    return commentsState.filter((c) => c.draftId === selectedDraft.id);
  }, [commentsState, selectedDraft]);

  const selectedAuditLogs = useMemo(() => {
    if (!selectedDraft) return [];
    return data.auditLogs.filter((log) => log.targetId === selectedDraft.id);
  }, [data.auditLogs, selectedDraft]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDraft || !newComment.trim()) return;

    const added: DraftComment = {
      id: `comment-local-${Date.now()}`,
      draftId: selectedDraft.id,
      authorName: "Mario Salamanca",
      authorInitials: "MS",
      body: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    setCommentsState((prev) => [...prev, added]);
    setNewComment("");
  };

  // Statically configure June 2026 calendar cells + padding July cells
  const calendarCells = useMemo(() => {
    const cells = [];
    // June 1st, 2026 is a Monday. June has 30 days.
    for (let i = 1; i <= 30; i++) {
      cells.push({
        day: i,
        monthName: "June",
        isCurrentMonth: true,
        dateString: `2026-06-${String(i).padStart(2, "0")}`,
      });
    }
    // Pad first 5 days of July to fill 35-cell Mon-Sun grid (June 29-30 are Mon-Tue, July 1st is Wed)
    for (let i = 1; i <= 5; i++) {
      cells.push({
        day: i,
        monthName: "July",
        isCurrentMonth: false,
        dateString: `2026-07-${String(i).padStart(2, "0")}`,
      });
    }
    return cells;
  }, []);

  return (
    <div className="flex min-h-full flex-col gap-8">
      {/* Page Header */}
      <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
        <div className="max-w-4xl">
          <p className="luxe-eyebrow">{data.pageHeader.eyebrow}</p>
          <h1 className="luxe-page-title mt-3">{data.pageHeader.title}</h1>
          <p className="luxe-page-description mt-4">
            {data.pageHeader.description}
          </p>
        </div>

        {/* Schedule Summary Card */}
        <SurfaceCard className="flex flex-col gap-3" padding="sm">
          <p className="luxe-eyebrow">Schedule Summary</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="luxe-preview-stat p-3">
              <p className="luxe-label-sm">Items</p>
              <p className="luxe-serif mt-1 text-2xl">
                {data.scheduledContent.length}
              </p>
            </div>
            <div className="luxe-preview-stat p-3">
              <p className="luxe-label-sm">Dates</p>
              <p className="luxe-serif mt-1 text-2xl">{groups.length}</p>
            </div>
            <div className="luxe-preview-stat p-3">
              <p className="luxe-label-sm">Channels</p>
              <p className="luxe-serif mt-1 text-2xl">
                {new Set(data.scheduledContent.map((item) => item.channel)).size}
              </p>
            </div>
          </div>
        </SurfaceCard>
      </header>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Side: Calendar Grid (Desktop) / Grouped List (Mobile) */}
        <div className="flex min-w-0 flex-col">
          {/* Monthly Calendar View (Hidden on mobile, block on md+) */}
          <section className="hidden md:flex flex-col bg-(--color-surface) border border-(--color-border-subtle) rounded-sm overflow-hidden mb-6">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-(--color-border-subtle)">
              <h2 className="luxe-serif text-xl font-normal text-(--color-text-primary)">
                June 2026
              </h2>
              <div className="flex gap-2">
                <button
                  className="luxe-secondary-action p-1.5 rounded-sm flex items-center justify-center"
                  type="button"
                  aria-label="Previous month"
                  disabled
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  className="luxe-secondary-action p-1.5 rounded-sm flex items-center justify-center"
                  type="button"
                  aria-label="Next month"
                  disabled
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Weekly Days Header */}
            <div className="grid grid-cols-7 border-b border-(--color-border-subtle) bg-(--color-surface-muted) text-center py-2.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
                <span key={dayName} className="luxe-eyebrow text-[10px] font-semibold tracking-[0.14em]">
                  {dayName}
                </span>
              ))}
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-px bg-(--color-border-subtle)">
              {calendarCells.map((cell) => {
                const cellItems = data.scheduledContent.filter((item) =>
                  item.scheduledFor.startsWith(cell.dateString),
                );

                return (
                  <div
                    key={cell.dateString}
                    className={`min-h-[110px] p-2 flex flex-col transition-all duration-150 ${
                      cell.isCurrentMonth
                        ? "bg-(--color-surface)"
                        : "bg-(--color-surface-muted) opacity-60"
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex justify-between items-start mb-1.5">
                      <span
                        className={`text-[13px] font-semibold ${
                          cell.isCurrentMonth
                            ? "text-(--color-text-primary)"
                            : "text-(--color-text-muted)"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {!cell.isCurrentMonth && (
                        <span className="text-[10px] uppercase tracking-wider text-(--color-text-muted)">
                          {cell.monthName.slice(0, 3)}
                        </span>
                      )}
                    </div>

                    {/* Day Items */}
                    <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto luxe-scroll-panel">
                      {cellItems.map((item) => {
                        const draft = getDraftById(data.drafts, item.draftId);
                        const active = item.id === selectedItemId;
                        const check = data.complianceChecks.find((c) => c.draftId === item.draftId);
                        const compColor = check ? COMPLIANCE_COLORS[check.status] : null;

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`w-full text-left text-xs p-1.5 rounded transition-all duration-150 border luxe-focus-ring ${
                              active
                                ? "bg-[color-mix(in_srgb,var(--color-brand-muted)_12%,transparent)] border-(--color-brand-muted) text-(--color-text-primary)"
                                : "bg-(--color-background) hover:bg-(--color-surface-muted) border-(--color-border-subtle) text-(--color-text-secondary)"
                            }`}
                            type="button"
                          >
                            <div className="flex items-center gap-1.5 justify-between">
                              <span className="font-semibold text-[9px] uppercase tracking-wider opacity-85 truncate">
                                {CONTENT_CHANNEL_LABELS[item.channel]}
                              </span>
                              {compColor && check && (
                                <span
                                  className="h-2 w-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: compColor }}
                                  title={`Compliance: ${check.status}`}
                                />
                              )}
                            </div>
                            <p className="mt-1 font-medium truncate text-[11px] leading-tight">
                              {draft?.title ?? "Untitled Draft"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Mobile timeline view (grouped by date) - Hidden on md+ */}
          <main className="flex md:hidden min-w-0 flex-col gap-6">
            {groups.map((group) => {
              const { day, month } = formatShortDate(group.scheduledFor);

              return (
                <SurfaceCard className="flex flex-col gap-5" key={group.dateKey}>
                  <div className="flex flex-col gap-4 border-b border-(--color-border-subtle) pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="luxe-date-tile w-16 px-2 py-3 text-center">
                        <span className="luxe-date-month block text-xs font-medium uppercase tracking-[0.14em]">
                          {month}
                        </span>
                        <span className="luxe-date-day mt-1 block text-2xl leading-none">
                          {day}
                        </span>
                      </div>
                      <div>
                        <p className="luxe-eyebrow">Planned Date</p>
                        <h2 className="luxe-serif luxe-section-title mt-2 font-normal">
                          {formatDisplayDate(group.scheduledFor)}
                        </h2>
                      </div>
                    </div>
                    <p className="luxe-form-help">
                      {group.items.length === 1
                        ? "1 scheduled item"
                        : `${group.items.length} scheduled items`}
                    </p>
                  </div>

                  <div className="luxe-list-divider">
                    {group.items.map((item) => {
                      const draft = getDraftById(data.drafts, item.draftId);
                      const active = item.id === selectedItemId;
                      const check = data.complianceChecks.find((c) => c.draftId === item.draftId);
                      const compColor = check ? COMPLIANCE_COLORS[check.status] : null;

                      return (
                        <button
                          aria-pressed={active}
                          className={`luxe-focus-ring block w-full text-left transition-all duration-150 rounded px-3 py-3.5 ${
                            active
                              ? "bg-[color-mix(in_srgb,var(--color-brand-muted)_8%,transparent)] border-l-2 border-(--color-brand-muted)"
                              : "hover:bg-(--color-surface-muted) border-l-2 border-transparent"
                          }`}
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          type="button"
                        >
                          <article className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-start">
                            <div>
                              <p className="luxe-label-sm">
                                {formatTime(item.scheduledFor)}
                              </p>
                              <h3 className="mt-2 text-base font-semibold">
                                {draft?.title ?? "Untitled scheduled draft"}
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-(--color-text-secondary)">
                                {CONTENT_CHANNEL_LABELS[item.channel]}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 lg:justify-end">
                              {compColor && check && (
                                <span
                                  className="h-2 w-2 rounded-full mr-2"
                                  style={{ backgroundColor: compColor }}
                                  title={`Compliance: ${check.status}`}
                                />
                              )}
                              <StatusIndicator
                                label={DRAFT_STATUS_LABELS[item.status]}
                                tone={DRAFT_STATUS_TONES[item.status]}
                                uppercase
                              />
                            </div>
                          </article>
                        </button>
                      );
                    })}
                  </div>
                </SurfaceCard>
              );
            })}
          </main>

          {/* Small Audit Trail Preview at the bottom of left column */}
          <SurfaceCard className="mt-2">
            <div className="border-b border-(--color-border-subtle) pb-4 mb-4">
              <p className="luxe-eyebrow">Audit Log</p>
              <h2 className="luxe-serif luxe-section-title mt-2 font-normal">
                Activity History
              </h2>
            </div>
            {selectedAuditLogs.length > 0 ? (
              <div className="space-y-4">
                {selectedAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-4 items-start text-sm border-b border-(--color-border-subtle) pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="h-6 w-6 rounded-full bg-(--color-surface-muted) text-(--color-brand-muted) text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                      LOG
                    </div>
                    <div className="flex-1">
                      <p className="text-(--color-text-primary) font-medium">
                        {log.description}
                      </p>
                      <p className="text-xs text-(--color-text-muted) mt-1">
                        {formatDisplayDate(log.createdAt)} at {formatTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-(--color-text-muted) py-2">
                No activity logged for the selected draft. Please select an item to view its trail.
              </p>
            )}
          </SurfaceCard>
        </div>

        {/* Right Side: Details & Comments Feedback Pane */}
        <aside className="space-y-6">
          {/* Selected Item Details */}
          <SurfaceCard className="flex flex-col gap-5">
            <div>
              <p className="luxe-eyebrow">Scheduled Item</p>
              <h2 className="luxe-section-title mt-2">
                {selectedDraft?.title ?? "No item selected"}
              </h2>
            </div>

            {selectedItem ? (
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="luxe-form-help">Channel</dt>
                  <dd className="font-medium">
                    {CONTENT_CHANNEL_LABELS[selectedItem.channel]}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="luxe-form-help">Status</dt>
                  <dd className="font-medium">
                    <StatusIndicator
                      label={DRAFT_STATUS_LABELS[selectedItem.status]}
                      tone={DRAFT_STATUS_TONES[selectedItem.status]}
                      uppercase
                    />
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="luxe-form-help">Compliance Check</dt>
                  <dd className="font-medium">
                    {selectedComplianceCheck ? (
                      <StatusIndicator
                        label={COMPLIANCE_STATUS_LABELS[selectedComplianceCheck.status]}
                        tone={COMPLIANCE_STATUS_TONES[selectedComplianceCheck.status]}
                        uppercase
                      />
                    ) : (
                      <span className="text-(--color-text-muted)">Unchecked</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="luxe-form-help">Scheduled</dt>
                  <dd className="text-right font-medium">
                    {formatDisplayDate(selectedItem.scheduledFor)}
                    <br />
                    {formatTime(selectedItem.scheduledFor)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="luxe-form-help">Published</dt>
                  <dd className="text-right font-medium">
                    {selectedItem.publishedAt
                      ? `${formatDisplayDate(selectedItem.publishedAt)} ${formatTime(
                          selectedItem.publishedAt,
                        )}`
                      : "Not published"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="luxe-form-help">Schedule ID</dt>
                  <dd className="max-w-48 truncate text-right font-medium">
                    {selectedItem.id}
                  </dd>
                </div>
              </dl>
            ) : null}
          </SurfaceCard>

          {/* Linked Draft Copy Card */}
          <SurfaceCard className="flex flex-col gap-4">
            <div>
              <p className="luxe-eyebrow">Linked Draft</p>
              <h2 className="luxe-section-title mt-2">
                {selectedDraft
                  ? CONTENT_CHANNEL_LABELS[selectedDraft.channel]
                  : "Draft unavailable"}
              </h2>
            </div>

            {selectedDraft ? (
              <div className="space-y-4">
                <div className="luxe-preview-stat p-4">
                  <p className="luxe-label-sm">Draft Copy</p>
                  <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">{selectedDraft.content}</p>
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="luxe-form-help">Draft status</dt>
                    <dd className="font-medium">
                      {DRAFT_STATUS_LABELS[selectedDraft.status]}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="luxe-form-help">Draft ID</dt>
                    <dd className="max-w-48 truncate text-right font-medium">
                      {selectedDraft.id}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </SurfaceCard>

          {/* Reviewer Feedback & Comments Panel */}
          <SurfaceCard className="flex flex-col gap-5">
            <div>
              <p className="luxe-eyebrow">Reviewer Feedback</p>
              <h2 className="luxe-section-title mt-2">Comments</h2>
            </div>

            {/* Existing Comments List */}
            <div className="space-y-4 max-h-[220px] overflow-y-auto luxe-scroll-panel pr-1">
              {selectedComments.length > 0 ? (
                selectedComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 items-start text-sm bg-(--color-surface-muted) p-3 rounded-sm">
                    <div className="h-7 w-7 rounded-full bg-(--color-surface-strong) text-(--color-text-primary) text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {comment.authorInitials}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-semibold text-xs">{comment.authorName}</span>
                        <span className="text-[10px] text-(--color-text-muted)">
                          {formatDisplayDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-(--color-text-secondary) leading-relaxed">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-(--color-text-muted) italic py-2">
                  No feedback comments yet. Use the field below to leave notes for review.
                </p>
              )}
            </div>

            {/* Comment Form */}
            {selectedDraft ? (
              <form onSubmit={handlePostComment} className="space-y-3 pt-3 border-t border-(--color-border-subtle)">
                <div className="flex flex-col gap-1.5">
                  <label className="luxe-form-label text-xs" htmlFor="feedback-comment">
                    Add review notes
                  </label>
                  <textarea
                    id="feedback-comment"
                    className="luxe-field w-full p-2.5 text-xs h-16 resize-none"
                    placeholder="Provide alignment notes or requesting edits..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                </div>
                <button
                  className="luxe-primary-action luxe-focus-ring w-full py-2 text-xs font-semibold rounded-sm text-center disabled:opacity-50"
                  type="submit"
                  disabled={!newComment.trim()}
                >
                  Post Comment
                </button>
              </form>
            ) : null}
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}
