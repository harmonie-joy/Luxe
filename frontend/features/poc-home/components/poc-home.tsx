"use client";

import Image from "next/image";
import Link from "next/link";
import { DashboardShellLayout } from "@/components/layouts/dashboard-shell-layout";
import { Badge } from "@/components/ui/badge";
import { IdeaCaptureWidget } from "@/components/ui/idea-capture-widget";
import { MediaPreviewCard } from "@/components/ui/media-preview-card";
import { StatCounterCard } from "@/components/ui/stat-counter-card";
import type { mockPocHome } from "@/data/mock-poc-home";
import { mockSinglePostLoop } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";
import { usePocPostSnapshot } from "@/lib/state/poc-post-state";
import { usePocWorkspaceState } from "@/lib/state/poc-workspace-state";
import styles from "./poc-home.module.css";

export function PocHome({ examples }: { examples: typeof mockPocHome }) {
  const { ideas, gamePlan, feedback } = usePocWorkspaceState();
  const post = usePocPostSnapshot();
  const activeIdeas = ideas.filter((idea) => idea.status !== "archived");
  const scheduled = Boolean(post?.approved && post.schedule);
  const ready = Boolean(post?.approved && !post.schedule);
  const captionAccepted = post?.versions.some((version) => version.id === post.acceptedVersion && version.text === post.caption);
  const postStage = scheduled ? "Scheduled" : ready ? "Ready" : "In progress";
  const nextAction = post
    ? scheduled ? "Review your upcoming schedule" : ready ? "Choose a schedule for your approved post"
      : !captionAccepted ? "Accept your current caption" : !post.visualApproved ? "Review your working visual" : "Complete final review"
    : gamePlan ? gamePlan.nextAction.trim() || "Continue your saved plan" : "Start with one idea";
  const nextRoute = scheduled ? APP_ROUTES.pocsCalendar : post ? APP_ROUTES.pocsSinglePost : gamePlan ? APP_ROUTES.pocsPlan : APP_ROUTES.pocsContentWorkspace;
  const metrics = [
    { label: "Ideas", value: activeIdeas.length },
    { label: "Plans", value: Number(Boolean(gamePlan)) },
    { label: "In progress", value: Number(Boolean(post && !post.approved)) },
    { label: "Ready", value: Number(ready) },
    { label: "Scheduled", value: Number(scheduled) },
    { label: "Learning notes", value: feedback.length },
  ];
  const latestFeedback = [...feedback].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))[0];

  return <DashboardShellLayout className={styles.page} header={<header className={styles.header}>
      <div><p className="luxe-eyebrow">CREATOR / OVERVIEW</p><h1 className="luxe-page-title">Home</h1><p className="luxe-page-description">Your work, your context, your next step.</p><Badge variant="neutral">Browser-local POC</Badge></div>
      <div className={styles.actions}><Link href={APP_ROUTES.pocsContentWorkspace} className="luxe-primary-action">Quick Create</Link><Link href={APP_ROUTES.pocsPlan} className="luxe-secondary-action">Quick Plan</Link></div>
    </header>}>

    <section className={styles.focus} aria-label="Next best action"><div><p className="luxe-eyebrow">NEXT BEST ACTION</p><h2>{nextAction}</h2><p className={styles.muted}>{post ? mockSinglePostLoop.title : gamePlan ? gamePlan.objective : "No plan or post saved yet."}</p></div><Link href={nextRoute} className="luxe-primary-action">{scheduled ? "Open calendar" : post ? "Continue post" : gamePlan ? "Continue plan" : "Start creating"}</Link></section>

    <section className={styles.section} aria-label="Your Content">
      <div className={styles.sectionHeading}><h2 className="luxe-section-title">Your Content</h2><Link href={APP_ROUTES.pocsContentWorkspace}>Create</Link></div>
      <div className={styles.pipeline} role="region" aria-label="Saved work pipeline"><h3>Saved work pipeline</h3><p className={styles.muted}>Saved in this browser only</p><dl className={styles.metrics}>{metrics.map((metric) => <StatCounterCard key={metric.label} label={metric.label} value={metric.value} />)}</dl></div>
      <div className={styles.section} role="region" aria-label="Active work"><h3>Active work</h3>
        {post ? <MediaPreviewCard className={styles.activePost} image={{ src: mockSinglePostLoop.slides[0].image, alt: mockSinglePostLoop.slides[0].alt, width: 160, height: 120, className: styles.cover, sizes: "112px" }}><div><Badge variant={post.approved ? "active" : "pending"}>{postStage}</Badge><h3>{mockSinglePostLoop.title}</h3><p className={styles.caption}>{post.caption || "Caption not written yet."}</p><p className={styles.muted}>{post.versions.length} caption versions · {post.template}</p><Link href={APP_ROUTES.pocsSinglePost}>Resume active post</Link></div></MediaPreviewCard> : <p className={styles.empty}>No post saved in this browser.</p>}
        {gamePlan && <div className={styles.plan}><p className="luxe-eyebrow">SAVED PLAN</p><h3>{gamePlan.objective || "Untitled plan"}</h3><p className={styles.muted}>{gamePlan.angle}</p><Link href={APP_ROUTES.pocsPlan}>Resume plan</Link></div>}
        {activeIdeas.length > 0 && <div className={styles.ideas}><h3>Ideas inbox</h3><ul>{activeIdeas.slice(0, 3).map((idea) => <li key={idea.id}><span>{idea.text}</span><Badge variant="neutral">{idea.status}</Badge></li>)}</ul><Link href={APP_ROUTES.pocsPlan}>Open ideas inbox</Link></div>}
      </div>
      <div className={styles.capture}><IdeaCaptureWidget /></div>
    </section>

      <section className={styles.section} aria-label="Upcoming planning"><div className={styles.sectionHeading}><h2 className="luxe-section-title">This Week</h2><Link href={APP_ROUTES.pocsCalendar}>Calendar</Link></div>
        {scheduled && post?.schedule ? <div className={styles.plan}><Badge variant="active">Saved schedule</Badge><h3>{mockSinglePostLoop.title}</h3><p className={styles.muted}>{post.schedule.date} · {post.schedule.time} · {post.schedule.timezone}</p><Link href={APP_ROUTES.pocsCalendar}>View saved schedule</Link></div> : <p className={styles.empty}>{ready ? "Your approved post is ready for a schedule." : "No saved scheduled posts."}</p>}
        <div className={styles.examples}><p className={styles.muted}>Synthetic planning examples · {examples.weekLabel} · {examples.timezone}</p><ul>{examples.upcoming.map((item) => <li key={item.id}><Image src={item.image} alt={item.alt} width={80} height={64} className={styles.exampleImage} sizes="64px" /><div><h3>{item.title}</h3><time dateTime={item.scheduledAt}>{item.scheduledAt.slice(0, 10)} · {item.scheduledAt.slice(11, 16)}</time><p className={styles.muted}>{item.channel} · Synthetic fixture</p></div></li>)}</ul></div>
      </section>

      <section className={styles.section} aria-label="Progress and learning"><div className={styles.sectionHeading}><h2 className="luxe-section-title">Your Momentum</h2><Link href={APP_ROUTES.pocsImpact}>Review learning</Link></div>{latestFeedback ? <div className={styles.plan}><Badge variant="neutral">Saved reflection · {latestFeedback.worthIt === "yes" ? "Worth it" : latestFeedback.worthIt === "partly" ? "Partly worth it" : "Not worth it"}</Badge><p>{latestFeedback.learning || "No learning note added."}</p><p className={styles.muted}>{latestFeedback.outcome || "No outcome recorded."}</p></div> : <p className={styles.empty}>No saved reflections yet.</p>}
        <div role="region" aria-label="Creator and brand context"><h3>Creator & brand context</h3><div className={styles.context}><Link href={APP_ROUTES.pocsCreatorDNA}>Creator DNA</Link><Link href={APP_ROUTES.pocsBrandGuide}>Communication guide</Link><Link href={APP_ROUTES.pocsBrandAssetKit}>Brand assets</Link></div><p className={styles.muted}>Prototype context · no production approval implied</p></div>
      </section>
  </DashboardShellLayout>;
}