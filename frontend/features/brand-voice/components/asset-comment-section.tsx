"use client";

import { useState } from "react";
import type { AssetComment } from "@/types/brand-profile";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDisplayDate } from "@/lib/formatters";

interface AssetCommentSectionProps {
  assetId: string;
  initialComments: AssetComment[];
}

export function AssetCommentSection({
  assetId,
  initialComments,
}: AssetCommentSectionProps) {
  const [comments, setComments] = useState<AssetComment[]>(initialComments);
  const [newComment, setNewComment] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;

    const comment: AssetComment = {
      id: `comment-local-${Date.now()}`,
      assetId,
      authorName: "You",
      authorInitials: "YO",
      body: trimmed,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, comment]);
    setNewComment("");
  }

  return (
    <SurfaceCard className="flex flex-col gap-5">
      <div className="luxe-card-header pb-5">
        <p className="luxe-eyebrow">Asset tracking</p>
        <h2 className="luxe-section-title mt-2">Comments</h2>
        <p className="luxe-form-help mt-1">
          Track review notes and change requests for this sample.
        </p>
      </div>

      {/* Comment thread */}
      {comments.length > 0 ? (
        <div className="luxe-list-divider">
          {comments.map((comment) => (
            <Comment comment={comment} key={comment.id} />
          ))}
        </div>
      ) : (
        <p className="luxe-form-help py-6 text-center">
          No comments yet. Use comments to track review notes and change
          requests.
        </p>
      )}

      {/* New comment form */}
      <form
        className="flex flex-col gap-3 border-t border-luxe-border pt-5"
        onSubmit={handleSubmit}
      >
        <label className="luxe-form-label" htmlFor="new-comment">
          Add a comment
        </label>
        <textarea
          className="luxe-field min-h-24 w-full resize-none px-4 py-3 text-sm leading-relaxed"
          id="new-comment"
          placeholder="Add a review note or change request…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            // Cmd/Ctrl + Enter submits
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
        <div className="flex items-center justify-between gap-4">
          <p className="luxe-form-help">
            <kbd className="font-sans">⌘</kbd>
            <kbd className="font-sans"> + Enter</kbd> to submit
          </p>
          <button
            className="luxe-primary-action luxe-focus-ring rounded px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!newComment.trim()}
            type="submit"
          >
            Post comment
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}

/* ── Individual comment ──────────────────────────────────────────────── */

function Comment({ comment }: { comment: AssetComment }) {
  return (
    <article className="flex gap-4 py-5">
      {/* Author initials avatar */}
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-luxe-border bg-luxe-surface-muted text-xs font-semibold text-luxe-brand"
      >
        {comment.authorInitials}
      </div>

      {/* Comment body */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold text-luxe-text-primary">
            {comment.authorName}
          </span>
          <span className="luxe-label-sm">
            {formatDisplayDate(comment.createdAt)}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-luxe-text-secondary">
          {comment.body}
        </p>
      </div>
    </article>
  );
}
