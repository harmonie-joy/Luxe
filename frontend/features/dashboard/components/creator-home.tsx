"use client";

import { useEffect, useState } from "react";
import { useCreatorSession } from "@/features/creator/components/creator-session";
import { getContentItems } from "@/lib/api/creator";
import type { ContentItem } from "@/types/creator";
import Link from "next/link";
import { SurfaceCard } from "@/components/ui/surface-card";
import { APP_ROUTES, contentItemRoute } from "@/lib/routes";

const creationPaths = [
  {
    title: "Create With Me",
    label: "A little guidance. A lot of you.",
    description: "Turn your idea into a post, one focused step at a time.",
    points: ["Start with a clear goal", "Keep your decisions together", "Pick up where you paused"],
    accent: "violet",
    badge: "Available",
    icon: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
    availability: "Save your goal and return to the same post.",
  },
  {
    title: "Quick Draft",
    label: "Find your starting point.",
    description: "A shorter path from a spark of an idea to a first draft.",
    points: ["Bring a simple idea", "Build on your brand voice", "Make the words your own"],
    accent: "blue",
    badge: "Coming next",
    icon: "M13 3 5 14h6l-1 7 9-12h-6l1-6Z",
    availability: "This shortcut isn’t available yet.",
  },
  {
    title: "Bring Something In",
    label: "Start with what you have.",
    description: "A place for the ideas and material you don’t want to lose.",
    points: ["An idea worth keeping", "Something you’ve already made", "A new starting point"],
    accent: "rose",
    badge: "Planned",
    icon: "M8 18H6a4 4 0 0 1-1-7.9 7 7 0 0 1 13.6-1A4.5 4.5 0 0 1 18 18h-2M12 21V11m-4 4 4-4 4 4",
    availability: "Import and uploads are planned.",
  },
] as const;

function ContinueWork() {
  const session = useCreatorSession();
  const workspace = session.activeWorkspaceId;
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (workspace) getContentItems(workspace).then((rows) => {
      if (!cancelled) setItems(rows);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [workspace, attempt]);
  return <section aria-labelledby="continue-heading" className="space-y-5">
    <h2 className="luxe-section-title" id="continue-heading">Continue where you left off</h2>
    {!workspace ? <p className="luxe-form-help">Create a workspace with Create With Me to start saving posts.</p> : error ? <SurfaceCard><p role="alert">Saved posts are unavailable. Your saved work has not been replaced with examples.</p><button className="luxe-secondary-action px-4 py-3" onClick={() => { setError(false); setItems(null); setAttempt((n) => n + 1); }}>Try again</button></SurfaceCard> : items === null ? <p role="status">Loading saved posts…</p> : items.length === 0 ? <SurfaceCard><h3 className="luxe-section-title">Your next idea deserves a place to land.</h3><p className="luxe-form-help">No saved posts in this workspace yet. Start with Create With Me.</p></SurfaceCard> : <div className="grid gap-4">{items.map((item) => <SurfaceCard key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-5">
      <div className="min-w-0 flex-1 space-y-2 break-words"><h3 className="luxe-section-title">{item.title}</h3><p>{item.goal}</p><p className="luxe-form-help">{item.workflowStage === "idea" ? "Idea" : "Drafting"} · Checkpoint {item.revision} · Last saved {new Date(item.updatedAt).toLocaleString()}</p><p className="luxe-form-help">Next: {item.nextAction}</p></div>
      <Link className="luxe-primary-action luxe-focus-ring px-5 py-3" href={contentItemRoute(item.id)} aria-label={`Resume ${item.title}`}>Resume →</Link>
    </SurfaceCard>)}</div>}
  </section>;
}

export function CreatorHome() {
  return (
    <div className="luxe-creator-home space-y-10">
      <header className="space-y-4">
        <p className="luxe-eyebrow flex items-center gap-3"><span className="luxe-heading-line" aria-hidden />Creator / CEO</p>
        <h1 className="luxe-workspace-title">What are we creating today?<span className="luxe-title-spark" aria-hidden>✦</span></h1>
        <p className="luxe-page-description">A little less friction. A little more creative flow.<br className="sm:hidden" /> Choose your way in.</p>
      </header>

      <section aria-label="Ways to create" className="grid gap-4 md:grid-cols-3 lg:gap-5">
        {creationPaths.map((path) => (
          <SurfaceCard className={`luxe-creation-card luxe-creation-card--${path.accent} flex min-w-0 flex-col gap-5 p-6`} padding="none" key={path.title} aria-label={path.title}>
            <div className="flex items-start justify-between gap-3">
              <span className="luxe-creation-icon" aria-hidden><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"><path d={path.icon} /></svg></span>
              <span className="luxe-availability">{path.badge}</span>
            </div>
            <div className="space-y-2">
              <p className="luxe-card-kicker">{path.label}</p>
              <h2 className="luxe-creation-title">{path.title}</h2>
              <p className="luxe-card-description">{path.description}</p>
            </div>
            <ul className="luxe-creation-points space-y-2" aria-label="Planned workflow">
              {path.points.map((point) => <li className="flex items-center gap-2" key={point}><span aria-hidden>↗</span>{point}</li>)}
            </ul>
            <div className="mt-auto space-y-3 pt-2">
              {path.title === "Create With Me" ? <Link href={APP_ROUTES.contentItemNew} className="luxe-creation-action luxe-focus-ring flex min-h-11 w-full items-center justify-between gap-2 px-4 py-3">Create With Me<span aria-hidden>→</span></Link> : <button className="luxe-creation-action luxe-focus-ring flex min-h-11 w-full items-center justify-between gap-2 px-4 py-3" disabled type="button" aria-describedby={`availability-${path.accent}`}>{path.title}<span aria-hidden>→</span></button>}
              <p id={`availability-${path.accent}`} className="luxe-form-help">{path.availability}</p>
            </div>
          </SurfaceCard>
        ))}
      </section>

      <ContinueWork />

      <section aria-labelledby="voice-heading" className="luxe-voice-shortcut flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="luxe-voice-mark" aria-hidden>✦</span>
          <div className="space-y-1"><h2 id="voice-heading" className="luxe-section-title">Make it sound like you.</h2><p className="luxe-form-help">Your existing Brand Voice tools are ready to explore.</p></div>
        </div>
        <Link className="luxe-secondary-action luxe-focus-ring flex min-h-11 shrink-0 items-center gap-5 px-5 py-3 text-sm" href={APP_ROUTES.brandVoice}>Open Brand Voice <span aria-hidden>↗</span></Link>
      </section>
      <p className="luxe-preview-note">Internal alpha · Guided posts save to your workspace. Quick Draft and imports remain unavailable.</p>
    </div>
  );
}
