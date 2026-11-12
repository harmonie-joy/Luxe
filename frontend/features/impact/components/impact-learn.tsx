"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { DashboardShellLayout } from "@/components/layouts/dashboard-shell-layout";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { StatCounterCard } from "@/components/ui/stat-counter-card";
import type { PocImpactPost } from "@/data/mock-poc-impact";
import { APP_ROUTES } from "@/lib/routes";
import { savePocFeedback, usePocWorkspaceState, type PocFeedback } from "@/lib/state/poc-workspace-state";
import styles from "./impact-learn.module.css";

export function ImpactLearn({ posts }: { posts: readonly PocImpactPost[] }) {
  const prefix = useId();
  const [selectedId, setSelectedId] = useState(posts[0]?.id ?? "");
  const post = posts.find((item) => item.id === selectedId);

  return <DashboardShellLayout className={styles.page} header={<header className={styles.header}>
      <div><p className="luxe-eyebrow">A moment to reflect</p><h1 className="luxe-serif">Impact & Learn</h1></div>
      {posts.length > 0 && <label className={styles.field} htmlFor={`${prefix}-post`}>Review post
        <Select id={`${prefix}-post`} value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{posts.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</Select>
      </label>}
    </header>}>
    <p className={styles.muted}>Browser-local prototype. All observed signals below are synthetic, not platform data. No attribution, revenue measurement, or causal claims.</p>
    {post ? <PostReflection key={post.id} post={post} /> : <p role="status">No sample posts to review.</p>}
  </DashboardShellLayout>;
}

function PostReflection({ post }: { post: PocImpactPost }) {
  const workspace = usePocWorkspaceState();
  const saved = workspace.feedback.find((feedback) => feedback.postId === post.id);
  const prefix = useId();
  const [draft, setDraft] = useState<{ worthIt: PocFeedback["worthIt"] | ""; outcome: string; learning: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<string[]>([]);
  const form = draft ?? { worthIt: saved?.worthIt ?? "", outcome: saved?.outcome ?? "", learning: saved?.learning ?? "" };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = [!form.worthIt ? "worthIt" : "", !form.outcome.trim() ? "outcome" : "", !form.learning.trim() ? "learning" : ""].filter(Boolean);
    setInvalid(missing);
    if (missing.length > 0) {
      setError("Add a worth-it decision, an outcome, and a learning before saving.");
      const field = event.currentTarget.elements.namedItem(missing[0]);
      if (field instanceof HTMLElement) field.focus();
      else event.currentTarget.querySelector<HTMLInputElement>("input[name='worthIt']")?.focus();
      return;
    }
    if (!form.worthIt) return;
    if (!savePocFeedback({ postId: post.id, worthIt: form.worthIt, outcome: form.outcome.trim(), learning: form.learning.trim(), updatedAt: new Date().toISOString() })) {
      setError("Could not save feedback in this browser. Your answers are still here; retry when browser storage is available.");
      return;
    }
    setDraft(null);
    setError("");
    setNotice("Feedback saved in this browser. You can edit it below.");
  }

  return <>
    <section className={styles.post} aria-labelledby={`${prefix}-goal`}>
      <Image className={styles.image} src={post.image} alt={post.alt} width={320} height={200} sizes="(max-width: 760px) 100vw, 240px" />
      <div className={styles.stack}>
        <p className="luxe-eyebrow">{post.channel} / sample post</p>
        <h2>{post.title}</h2>
        <h3 id={`${prefix}-goal`}>Intended goal</h3>
        <p>{post.intendedGoal}</p>
        <p className={styles.muted}>Sample target: {post.replyGoal} replies. Counts alone do not establish whether the effort was worthwhile.</p>
      </div>
    </section>
    <div className={styles.columns}>
      <section className={styles.section} aria-labelledby={`${prefix}-observed`}>
        <p id={`${prefix}-observed`} className="luxe-eyebrow">Observed (synthetic)</p>
        <h2>What Happened</h2>
        <dl className={styles.metrics}>
          <StatCounterCard label="Impressions" value={post.impressions.toLocaleString("en-US")} valueClassName="luxe-serif" />
          <StatCounterCard label="Saves" value={post.saves} valueClassName="luxe-serif" />
          <StatCounterCard label="Replies" value={post.replies} valueClassName="luxe-serif" />
        </dl>
        <label className={styles.field} htmlFor={`${prefix}-goal-meter`}>Replies toward intended goal (synthetic)
          <meter id={`${prefix}-goal-meter`} className={styles.meter} min={0} max={post.replyGoal} value={post.replies}>{post.replies} of {post.replyGoal}</meter>
        </label>
        <p className={styles.muted}>{post.replies} of {post.replyGoal} sample target replies</p>
        <figure className={styles.chart}>
          <figcaption>Daily replies / synthetic sample</figcaption>
          <ul>{post.dailyReplies.map((day) => <li key={day.date}>
            <time dateTime={day.date}>{day.date.slice(5)}</time>
            <div className={styles.track} aria-hidden="true"><div className={styles.bar} style={{ width: `${Math.min(100, day.count / post.replyGoal * 100)}%` }} /></div>
            <span>{day.count} {day.count === 1 ? "reply" : "replies"}</span>
          </li>)}</ul>
        </figure>
        <p className={styles.muted}>Sample snapshot: <time dateTime={post.updatedAt}>{post.updatedAt.slice(0, 10)}</time>. No live connection or automatic attribution.</p>
      </section>
      <section className={styles.section} aria-labelledby={`${prefix}-confirmed`}>
        <p id={`${prefix}-confirmed`} className="luxe-eyebrow">Creator-Confirmed</p>
        <h2>Your perspective</h2>
        <p className={styles.muted} role="status">{draft ? "Unsaved feedback. Your last saved reflection remains unchanged." : notice || (saved ? "Saved feedback recovered from this browser. You can edit it below." : "No feedback saved for this post yet.")}</p>
        {error && <p id={`${prefix}-error`} className={styles.error} role="alert">{error}</p>}
        <form className={styles.stack} onSubmit={submit} noValidate>
          <fieldset className={styles.worth} aria-invalid={invalid.includes("worthIt")} aria-describedby={invalid.includes("worthIt") ? `${prefix}-error` : undefined}>
            <legend>Was It Worth It?</legend>
            <div className={styles.choices}>
              {([{ value: "yes", label: "Yes" }, { value: "partly", label: "Partly" }, { value: "no", label: "No" }] as const).map((choice) => <label key={choice.value}>
                <input type="radio" name="worthIt" value={choice.value} checked={form.worthIt === choice.value} required onChange={() => setDraft({ ...form, worthIt: choice.value })} />{choice.label}
              </label>)}
            </div>
          </fieldset>
          <label className={styles.field} htmlFor={`${prefix}-outcome`}>What Happened
            <textarea id={`${prefix}-outcome`} className="luxe-ui-input" name="outcome" rows={3} required value={form.outcome} aria-invalid={invalid.includes("outcome")} aria-describedby={invalid.includes("outcome") ? `${prefix}-error` : undefined} onChange={(event) => setDraft({ ...form, outcome: event.target.value })} placeholder="What did you actually notice?" />
          </label>
          <label className={styles.field} htmlFor={`${prefix}-learning`}>What We Learned
            <textarea id={`${prefix}-learning`} className="luxe-ui-input" name="learning" rows={3} required value={form.learning} aria-invalid={invalid.includes("learning")} aria-describedby={invalid.includes("learning") ? `${prefix}-error` : undefined} onChange={(event) => setDraft({ ...form, learning: event.target.value })} placeholder="What would you keep or change?" />
          </label>
          <div><Button type="submit">Save feedback</Button></div>
        </form>
        {saved && <p className={styles.muted}>Last confirmed <time dateTime={saved.updatedAt}>{new Date(saved.updatedAt).toLocaleString()}</time></p>}
      </section>
    </div>
    <section className={styles.next} aria-labelledby={`${prefix}-next`}>
      <p className="luxe-eyebrow">Inferred</p>
      <h2 id={`${prefix}-next`}>Next Best Move</h2>
      {saved ? <>
        <p>{saved.worthIt === "yes" ? "Build on what felt worthwhile with another piece." : saved.worthIt === "partly" ? "Adjust the plan before investing more effort." : "Revisit the goal and scope before creating again."}</p>
        <p>Your saved learning: {saved.learning}</p>
        <p className={styles.muted}>A simple rule based on your saved worth-it decision, not AI analysis or a causal conclusion.</p>
        <Link className="luxe-ui-button luxe-ui-button--outline luxe-ui-button--md" href={saved.worthIt === "yes" ? APP_ROUTES.pocsContentWorkspace : APP_ROUTES.pocsPlan}>{saved.worthIt === "yes" ? "Create next post" : "Revisit Plan"}</Link>
      </> : <p className={styles.muted}>No inferred move yet. A saved creator reflection is needed.</p>}
    </section>
  </>;
}