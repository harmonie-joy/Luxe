"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getContentItemContext, getProjects, saveCheckpoint, type CheckpointPayload } from "@/lib/api/creator";
import { ApiError } from "@/lib/api/http-client";
import { APP_ROUTES } from "@/lib/routes";
import type { ContentItemContext } from "@/types/creator";
import { CheckpointFields, checkpointPayload, checkpointValidation, type CheckpointForm } from "./checkpoint-fields";
import { useCreatorSession } from "./creator-session";
import { confirmDiscard, useUnsavedChanges } from "./use-unsaved-changes";

function formFrom(context: ContentItemContext): CheckpointForm {
  return { goal: context.item.goal, workflowStage: context.item.workflowStage, nextAction: context.item.nextAction, decisions: context.item.decisions.join("\n"), openQuestions: context.item.openQuestions.join("\n") };
}

export function ContentItemDashboard({ id }: { id: string }) {
  return <ContentItemDashboardContent key={id} id={id} />;
}

function ContentItemDashboardContent({ id }: { id: string }) {
  const session = useCreatorSession();
  const workspace = session.activeWorkspaceId;
  const [context, setContext] = useState<ContentItemContext | null>(null);
  const [form, setForm] = useState<CheckpointForm | null>(null);
  const local = useRef(form); local.current = form;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  const retry = useRef<CheckpointPayload | null>(null);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const canWrite = session.workspaces.some((row) => row.id === workspace && ["owner", "admin", "editor"].includes(row.role));
  const dirty = Boolean(context && form && JSON.stringify(form) !== JSON.stringify(formFrom(context)));
  useUnsavedChanges(dirty);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    if (workspace) Promise.all([getProjects(workspace), getContentItemContext(id)]).then(([projects, result]) => {
      if (cancelled) return;
      if (!projects.some((project) => project.id === result.item.projectId)) { setLoadError("This post is not in the current workspace. Return to Creator Home."); return; }
      setContext(result); setForm(formFrom(result));
    }).catch((failure) => {
      if (!cancelled) setLoadError(failure instanceof ApiError && failure.status === 404 ? "This post was not found or is unavailable to your account." : "Saved post unavailable. Check your session and try again.");
    });
    return () => { cancelled = true; };
  }, [id, workspace, attempt]);

  async function save(event: FormEvent | null, returnToDashboard = false) {
    event?.preventDefault();
    if (!form || !context || lock.current || conflict || !canWrite) return;
    const validation = checkpointValidation(form);
    if (validation) { setError(validation); return; }
    const snapshot = checkpointPayload(form);
    const previous = retry.current;
    const request: CheckpointPayload = previous && JSON.stringify(snapshot) === JSON.stringify({ goal: previous.goal, workflow_stage: previous.workflow_stage, next_action: previous.next_action, decisions: previous.decisions, open_questions: previous.open_questions }) ? previous : { ...snapshot, expected_revision: context.item.revision, client_request_id: crypto.randomUUID() };
    retry.current = request;
    const submitted = JSON.stringify(form);
    lock.current = true; setBusy(true); setError("");
    try {
      const acknowledged = await saveCheckpoint(id, request);
      if (!alive.current) return;
      const latest = await getContentItemContext(id);
      if (!alive.current) return;
      if (latest.item.revision !== acknowledged.item.revision) {
        setConflict(true); setError(`Checkpoint ${acknowledged.item.revision} was acknowledged, but a newer server version exists. Your edits are preserved. Reload the saved version to reconcile.`);
        return;
      }
      setContext(latest); retry.current = null;
      if (JSON.stringify(local.current) === submitted) {
        setForm(formFrom(latest));
        if (returnToDashboard) setEditing(false);
      }
    } catch (failure) {
      if (!alive.current) return;
      if (failure instanceof ApiError && failure.status === 409) {
        setConflict(true);
        setError(`Revision conflict (${failure.message}). Your edits are preserved. Reload the saved version before saving again.`);
      } else setError(`Save not confirmed. Your edits are preserved. ${failure instanceof Error ? failure.message : "Try again."}`);
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  }

  async function reload() {
    if (lock.current || (dirty && !confirmDiscard())) return;
    const beforeReload = JSON.stringify(local.current);
    lock.current = true; setBusy(true); setError("");
    try {
      const latest = await getContentItemContext(id);
      if (!alive.current) return;
      setContext(latest);
      if (JSON.stringify(local.current) === beforeReload) setForm(formFrom(latest));
      retry.current = null; setConflict(false);
    } catch (failure) { if (alive.current) setError(`Reload failed; local edits are still here. ${failure instanceof Error ? failure.message : "Try again."}`); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }

  if (!workspace) return <SurfaceCard><h1 className="luxe-section-title">No active workspace</h1><Link href={APP_ROUTES.dashboard}>Return to Creator Home</Link></SurfaceCard>;
  if (loadError) return <SurfaceCard className="space-y-4"><h1 className="luxe-section-title">Post unavailable</h1><p role="alert">{loadError}</p><button className="luxe-secondary-action px-4 py-3" onClick={() => { setLoadError(""); setAttempt((n) => n + 1); }}>Try again</button><Link href={APP_ROUTES.dashboard}>Return to Creator Home</Link></SurfaceCard>;
  if (!context || !form) return <p role="status">Loading your saved post…</p>;
  return <div className="space-y-6">
    <header className="min-w-0 space-y-3 break-words"><p className="luxe-eyebrow">Single-Post Dashboard</p><h1 className="luxe-page-title">{context.item.title}</h1><p className="luxe-page-description">{context.item.goal}</p><p className="luxe-form-help">Current stage: {context.item.workflowStage === "idea" ? "Idea" : "Drafting"} · Stored checkpoint {context.checkpoint.revision}</p></header>
    <p role="status" className="luxe-form-help">{busy ? "Saving or checking persisted state…" : error ? "Save needs attention · local edits retained" : dirty ? "Unsaved changes" : `Saved checkpoint ${context.checkpoint.revision} · ${new Date(context.checkpoint.createdAt).toLocaleString()}`}</p>
    {error && <p role="alert" className="luxe-demo-notice break-words p-4">{error}</p>}
    {editing ? <SurfaceCard className="space-y-5"><h2 className="luxe-section-title">Edit checkpoint</h2><p className="luxe-form-help">Title, project and pinned Brand Voice stay fixed. Save records a new checkpoint.</p><form onSubmit={save} className="space-y-5"><CheckpointFields value={form} onChange={setForm} /><div className="flex flex-wrap gap-3"><button disabled={busy || conflict || !canWrite || !dirty} className="luxe-primary-action luxe-focus-ring px-5 py-3" type="submit">Save checkpoint</button><button disabled={busy || conflict || !canWrite || !dirty} className="luxe-secondary-action luxe-focus-ring px-5 py-3" type="button" onClick={() => save(null, true)}>Save and return</button><button className="luxe-secondary-action luxe-focus-ring px-5 py-3" disabled={busy} type="button" onClick={() => { if (!dirty || confirmDiscard()) { setForm(formFrom(context)); setEditing(false); } }}>Return to dashboard</button></div></form></SurfaceCard> : <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <SurfaceCard className="min-w-0 space-y-4 break-words"><p className="luxe-eyebrow">Your next step</p><h2 className="luxe-section-title">Next action</h2><p>{context.item.nextAction}</p><button className="luxe-primary-action luxe-focus-ring px-5 py-3" onClick={() => setEditing(true)} disabled={!canWrite}>Edit checkpoint</button>{!canWrite && <p className="luxe-form-help">Your workspace role can view this post. An owner, admin or editor can save changes.</p>}</SurfaceCard>
      <SurfaceCard className="min-w-0 space-y-4 break-words"><h2 className="luxe-section-title">Pinned Brand Voice</h2><p>Version {context.brandVoice.version} · {context.brandVoice.isApproved ? "Human approved" : "Acceptance unverified"}</p><p className="luxe-form-help">Voice ID: {context.brandVoice.id}</p><p className="luxe-form-help">This post keeps its selected version when another voice becomes active. Voice acceptance is separate from final post approval.</p></SurfaceCard>
      <SurfaceCard className="min-w-0 space-y-4 break-words"><h2 className="luxe-section-title">Previous decisions</h2>{context.item.decisions.length ? <ul className="list-disc space-y-2 pl-5">{context.item.decisions.map((row, i) => <li key={i}>{row}</li>)}</ul> : <p className="luxe-form-help">No decisions recorded yet.</p>}</SurfaceCard>
      <SurfaceCard className="min-w-0 space-y-4 break-words"><h2 className="luxe-section-title">Open questions</h2>{context.item.openQuestions.length ? <ul className="list-disc space-y-2 pl-5">{context.item.openQuestions.map((row, i) => <li key={i}>{row}</li>)}</ul> : <p className="luxe-form-help">No open questions recorded.</p>}</SurfaceCard>
    </div>}
    <div className="flex flex-wrap items-center gap-4"><button className="luxe-secondary-action luxe-focus-ring px-5 py-3" disabled={busy} onClick={reload}>Reload saved version</button><Link href={APP_ROUTES.dashboard} className="luxe-text-link luxe-focus-ring">Back to Creator Home</Link></div>
    <p className="luxe-preview-note">Internal alpha · Idea and drafting checkpoints are available. Media, generation, publishing and final post approval are not part of this workspace yet.</p>
  </div>;
}
