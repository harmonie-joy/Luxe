"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { AUTH_SESSION_UPDATED_EVENT, bootstrapWorkspace } from "@/lib/api/auth";
import { getBrandProfiles, getBrandVoices } from "@/lib/api/brand-voice";
import { approveBrandVoice, createContentItem, createProject, getProjects } from "@/lib/api/creator";
import { ApiError } from "@/lib/api/http-client";
import { APP_ROUTES, contentItemRoute } from "@/lib/routes";
import type { BrandProfile, BrandVoice } from "@/types/brand-profile";
import type { Project } from "@/types/creator";
import { CheckpointFields, checkpointPayload, checkpointValidation, type CheckpointForm } from "./checkpoint-fields";
import { useCreatorSession } from "./creator-session";
import { useUnsavedChanges } from "./use-unsaved-changes";

export function ContentItemCreate() {
  const session = useCreatorSession();
  const workspace = session.activeWorkspaceId;
  const router = useRouter();
  const [resources, setResources] = useState<{ projects: Project[]; profiles: BrandProfile[] } | null>(null);
  const [profileId, setProfileId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [voiceResult, setVoiceResult] = useState<{ profile: string; voice: BrandVoice | null } | null>(null);
  const voice = voiceResult?.profile === profileId ? voiceResult.voice : null;
  const [accepted, setAccepted] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [form, setForm] = useState<CheckpointForm>({ goal: "", workflowStage: "idea", nextAction: "", decisions: "", openQuestions: "" });
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  const [uncertain, setUncertain] = useState(false);
  const [created, setCreated] = useState(false);
  const canWrite = session.workspaces.some((row) => row.id === workspace && ["owner", "admin", "editor"].includes(row.role));
  useUnsavedChanges(!created && Boolean(title || form.goal || form.nextAction || form.decisions || form.openQuestions || projectName || form.workflowStage !== "idea"));

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    if (workspace) Promise.all([getProjects(workspace), getBrandProfiles()]).then(([projects, profiles]) => {
      if (cancelled) return;
      const scopedProfiles = profiles.filter((profile) => String(profile.workspaceId) === String(workspace));
      setResources({ projects, profiles: scopedProfiles });
      setProjectId(projects[0]?.id ?? "");
      setProfileId(scopedProfiles[0]?.id ?? "");
    }).catch(() => { if (!cancelled) setLoadError("Projects and Brand Profiles are unavailable. Try again before creating a post."); });
    return () => { cancelled = true; };
  }, [workspace, attempt]);
  useEffect(() => {
    let cancelled = false;
    if (profileId) getBrandVoices(profileId).then((voices) => {
      if (!cancelled) setVoiceResult({ profile: profileId, voice: voices.find((row) => row.brandProfileId === profileId && row.isActive) ?? null });
    }).catch(() => { if (!cancelled) setLoadError("Brand Voice is unavailable. Try again before creating a post."); });
    return () => { cancelled = true; };
  }, [profileId, attempt]);

  async function acceptVoice() {
    if (!voice || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    const exactVoice = voice.id;
    try {
      const approval = await approveBrandVoice(exactVoice);
      if (alive.current && approval.voiceId === exactVoice && approval.event === "accepted") setAccepted(exactVoice);
    } catch (failure) { if (alive.current) setError(failure instanceof Error ? failure.message : "Voice acceptance failed."); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!workspace || !voice || accepted !== voice.id || lock.current || !canWrite || uncertain) return;
    const validation = checkpointValidation(form);
    if (!title.trim() || (!projectId && !projectName.trim()) || validation) { setError(validation || "Enter a title and project name."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      let project = projectId;
      if (!project) {
        const savedProject = await createProject(workspace, projectName.trim());
        project = savedProject.id;
        if (!alive.current) return;
        setProjectId(project);
        setResources((current) => current ? { ...current, projects: [...current.projects, savedProject] } : current);
      }
      const context = await createContentItem({ project, brand_profile: profileId, brand_voice: voice.id, title: title.trim(), ...checkpointPayload(form) });
      if (!alive.current) return;
      setCreated(true);
      router.push(contentItemRoute(context.item.id));
    } catch (failure) {
      if (!alive.current) return;
      if (!(failure instanceof ApiError) || failure.status >= 500) setUncertain(true);
      setError(failure instanceof Error ? failure.message : "Creation failed. Your input is preserved.");
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  }

  if (!workspace) return <SurfaceCard className="space-y-4"><h1 className="luxe-section-title">Set up your workspace</h1><p>Save posts in your own workspace.</p>{error && <p role="alert">{error}</p>}<button disabled={busy} className="luxe-primary-action px-5 py-3" onClick={async () => {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { await bootstrapWorkspace(); window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Workspace setup failed."); }
    finally { lock.current = false; setBusy(false); }
  }}>Create workspace</button></SurfaceCard>;

  return <div className="space-y-6">
    <header className="space-y-3"><p className="luxe-eyebrow">Creator workspace</p><h1 className="luxe-page-title">Create With Me</h1><p className="luxe-page-description">Give one post a goal and a next step. Save it in your workspace.</p></header>
    {loadError ? <SurfaceCard><p role="alert">{loadError}</p><button className="luxe-secondary-action px-4 py-3" onClick={() => { setLoadError(""); setAttempt((n) => n + 1); }}>Try again</button></SurfaceCard> : !resources ? <p role="status">Loading projects and Brand Profiles…</p> : resources.profiles.length === 0 ? <SurfaceCard><p>No Brand Profile in this workspace. Set up Brand Voice before creating a post.</p><Link href={APP_ROUTES.brandVoice} className="luxe-secondary-action px-4 py-3">Open Brand Voice</Link></SurfaceCard> : <form onSubmit={submit} className="grid min-w-0 gap-6 lg:grid-cols-2"><fieldset disabled={busy} className="contents">
      <SurfaceCard className="min-w-0 space-y-5">
        {!canWrite && <p role="status">Your workspace role can view posts. An owner, admin or editor must create posts and accept voice versions.</p>}
        <label className="luxe-form-label block space-y-2">Project<select className="luxe-field w-full" value={projectId} disabled={busy} onChange={(e) => setProjectId(e.target.value)}>{resources.projects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}<option value="">New project</option></select></label>
        {!projectId && <label className="luxe-form-label block space-y-2">New project name<input className="luxe-field w-full" required maxLength={200} value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>}
        <label className="luxe-form-label block space-y-2">Title<input className="luxe-field w-full" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <CheckpointFields value={form} onChange={setForm} />
        {error && <p role="alert" className="break-words">{error}</p>}
        {uncertain && <div className="space-y-3" role="alert"><p>The request may have reached the server. Check saved posts and projects before starting again; creation cannot be retried safely automatically. Your input stays here until you choose to leave.</p><Link href={APP_ROUTES.dashboard} target="_blank" rel="noopener" className="luxe-secondary-action inline-block px-4 py-3">Check saved posts in a new tab</Link><button type="button" className="luxe-secondary-action px-4 py-3" onClick={() => { if (window.confirm("Have you checked saved posts and projects? Creating again may duplicate a successful request.")) { setUncertain(false); setAttempt((n) => n + 1); } }}>I checked; allow another attempt</button></div>}
        <button className="luxe-primary-action luxe-focus-ring px-5 py-3" disabled={busy || !voice || accepted !== voice.id || !canWrite || uncertain} type="submit">{busy ? "Working…" : "Create saved post"}</button>
      </SurfaceCard>
      <SurfaceCard className="min-w-0 space-y-5 break-words">
        <h2 className="luxe-section-title">Pin a Brand Voice</h2>
        <label className="luxe-form-label block space-y-2">Brand Profile<select className="luxe-field w-full" disabled={busy} value={profileId} onChange={(e) => { setProfileId(e.target.value); setAccepted(null); }}>{resources.profiles.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        {voiceResult?.profile !== profileId ? <p role="status">Loading the active voice…</p> : !voice ? <p>No active voice version. Open Brand Voice to extract or activate a version before creating a post.</p> : <>
          <p className="luxe-eyebrow">Active version {voice.version}</p><p>{voice.voiceSummary}</p><p className="luxe-form-help">Voice ID: {voice.id}</p>
          <details className="space-y-3"><summary className="luxe-focus-ring cursor-pointer">Review this exact voice version</summary><dl className="space-y-3">{[["Tone", `Funny: ${voice.tone.funny}/100; casual: ${voice.tone.casual}/100; irreverent: ${voice.tone.irreverent}/100; enthusiastic: ${voice.tone.enthusiastic}/100`], ["Tone tags", voice.toneTags.join(", ")], ["Point of view", voice.pointOfView], ["Sentence style", voice.sentenceStyle], ["Pacing", voice.pacing], ["Proof style", voice.proofStyle], ["Claim boundaries", voice.claimBoundaries.map((row) => `${row.rule}: ${row.reason}`).join("; ")], ["Vocabulary", voice.preferredVocabulary.map((row) => `${row.term} (${row.instead_of ?? "preferred"}): ${row.note}`).join("; ")], ["Banned phrases", voice.bannedPhrases.map((row) => `${row.phrase} (${row.severity}): ${row.reason}`).join("; ")]].map(([label, value]) => <div key={label}><dt className="luxe-form-help">{label}</dt><dd>{value || "None recorded"}</dd></div>)}</dl></details>
          <p className="luxe-form-help">{accepted === voice.id ? `Accepted version ${voice.version} for this workspace.` : "Human acceptance is unverified. Active does not mean approved. Review this version, then explicitly accept it."}</p>
          <button type="button" className="luxe-secondary-action luxe-focus-ring px-4 py-3" disabled={busy || !canWrite || accepted === voice.id} onClick={acceptVoice}>Review and accept version {voice.version}</button>
          <p className="luxe-form-help">Acceptance applies to this BrandVoice version. This is not final post approval or full Creator DNA.</p>
        </>}
        <Link href={APP_ROUTES.brandVoice} className="luxe-text-link luxe-focus-ring">Open Brand Voice</Link>
      </SurfaceCard>
    </fieldset></form>}
  </div>;
}
