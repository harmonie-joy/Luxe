"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SplitPaneLayout } from "@/components/layouts/split-pane-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { StatusPillFilter } from "@/components/ui/status-pill-filter";
import { mockSinglePostLoop, type CalendarPost, type mockCalendar } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";
import { usePocPostSnapshot } from "@/lib/state/poc-post-state";
import styles from "./content-calendar.module.css";

type Platform = "all" | CalendarPost["channel"];
const platforms = [{ value: "instagram", label: "Instagram", short: "IG" }, { value: "linkedin", label: "LinkedIn", short: "in" }, { value: "short_video", label: "Short video", short: "Play" }] as const;
const stages: readonly CalendarPost["calendarStage"][] = ["Ready", "Scheduled", "Published", "Draft"];
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const parseDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00Z`);
const shiftDate = (date: Date, amount: number) => { const next = new Date(date); next.setUTCDate(next.getUTCDate() + amount); return next; };
const monday = (date: Date) => shiftDate(date, -((date.getUTCDay() + 6) % 7));
const labelDate = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" }).format(date);
const platformLabel = (channel: CalendarPost["channel"]) => platforms.find((platform) => platform.value === channel)?.label ?? channel;

export function ContentCalendar({ initialData }: { initialData: typeof mockCalendar }) {
  const [fixturePosts, setPosts] = useState(initialData.posts);
  const snapshot = usePocPostSnapshot();
  const savedPost: CalendarPost | null = snapshot?.approved ? {
    id: mockSinglePostLoop.id, workspaceId: mockSinglePostLoop.workspaceId,
    createdAt: mockSinglePostLoop.createdAt, updatedAt: mockSinglePostLoop.updatedAt,
    title: mockSinglePostLoop.title, channel: mockSinglePostLoop.channel,
    status: snapshot.schedule ? "scheduled" : "approved", stage: snapshot.schedule ? "Scheduled" : "Ready",
    calendarStage: snapshot.schedule ? "Scheduled" : "Ready", format: "Carousel",
    image: mockSinglePostLoop.slides[0].image, alt: mockSinglePostLoop.slides[0].alt,
    scheduledAt: snapshot.schedule ? `${snapshot.schedule.date}T${snapshot.schedule.time}:00` : "",
  } : null;
  const posts = [...fixturePosts, ...(savedPost ? [savedPost] : [])];
  const [anchor, setAnchor] = useState(parseDate(initialData.referenceDate));
  const [view, setView] = useState<"week" | "month">("week");
  const [platform, setPlatform] = useState<Platform>("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const selected = posts.find((post) => post.id === selectedId);
  const selectedSaved = selected?.id === mockSinglePostLoop.id;
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  useEffect(() => { if (selectedId) drawerRef.current?.querySelector("button")?.focus(); }, [selectedId]);

  const monthStart = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1, 12));
  const monthEnd = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0, 12));
  const start = view === "week" ? monday(anchor) : monday(monthStart);
  const dayCount = view === "week" ? 7 : Math.ceil((monthEnd.getUTCDate() + (monthStart.getUTCDay() + 6) % 7) / 7) * 7;
  const days = Array.from({ length: dayCount }, (_, index) => shiftDate(start, index));
  const filtered = posts.filter((post) => (platform === "all" || post.channel === platform) && (status === "all" || post.calendarStage === status));
  const visible = filtered.filter((post) => view === "week" ? post.scheduledAt.slice(0, 10) >= dateKey(start) && post.scheduledAt.slice(0, 10) <= dateKey(days[6]) : post.scheduledAt.slice(0, 7) === dateKey(anchor).slice(0, 7));
  const ready = filtered.filter((post) => !post.scheduledAt && post.calendarStage === "Ready");
  const firstHour = Math.min(8, ...visible.map((post) => Number(post.scheduledAt.slice(11, 13))));
  const lastHour = Math.max(21, ...visible.map((post) => Number(post.scheduledAt.slice(11, 13)) + 1));
  const hourCount = lastHour - firstHour;
  const savedDay = savedPost?.scheduledAt.slice(0, 10);
  const splitSavedDay = visible.some((post) => post.id === mockSinglePostLoop.id)
    && visible.some((post) => post.id !== mockSinglePostLoop.id && post.scheduledAt.slice(0, 10) === savedDay);
  function jumpToSavedSchedule() {
    if (!snapshot?.schedule) return;
    setPlatform("all"); setStatus("all"); setAnchor(parseDate(snapshot.schedule.date));
  }

  function closeDetails() { setSelectedId(null); lastTrigger.current?.focus(); }
  function navigate(direction: number) {
    if (view === "week") setAnchor(shiftDate(anchor, direction * 7));
    else setAnchor(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + direction, 1, 12)));
  }
  function updatePost(changes: Partial<CalendarPost>) {
    if (!selected || selectedSaved) return;
    setPosts((current) => current.map((post) => post.id === selected.id ? { ...post, ...changes, updatedAt: new Date().toISOString() } : post));
    setNotice(`Updated ${selected.title} in this preview only. Not saved.`);
  }
  function renderPost(post: CalendarPost) {
    const saved = post.id === mockSinglePostLoop.id;
    return <button key={post.id} className={styles.post} data-platform={post.channel} data-selected={selectedId === post.id} aria-label={`Open ${saved ? "saved " : ""}${post.title}`} onClick={(event) => { lastTrigger.current = event.currentTarget; setSelectedId(post.id); }}>
      <span className={styles.platform}>{platformLabel(post.channel)}</span>
      {view === "week" && <Image src={post.image} alt={post.alt} width={200} height={100} className={styles.thumbnail} sizes="140px" />}
      <strong>{post.title}</strong>
      <span className={styles.postMeta}>{post.scheduledAt ? `${post.scheduledAt.slice(11, 16)} · ${saved ? snapshot?.schedule?.timezone : initialData.timezone}` : "Unscheduled"} · {post.format}</span>
      <span className={styles.postMeta}>{saved ? "Saved in this browser" : "Synthetic fixture"}</span>
      <span className={styles.stage} data-stage={post.calendarStage}><span />{post.calendarStage}</span>
    </button>;
  }

  return <div className={styles.page}>
    <header className={styles.header}>
      <div><p className="luxe-eyebrow">12 / CONTENT PLANNING</p><h1 className="luxe-page-title">Content Calendar / Planning View</h1><p className="luxe-page-description">Upcoming content, and room for your next idea.</p><Badge variant="neutral">Browser-local POC · synthetic fixtures labeled</Badge></div>
      <div className={styles.controls}>
        <Button variant="outline" size="sm" onClick={() => setAnchor(parseDate(new Intl.DateTimeFormat("en-CA", { timeZone: initialData.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())))}>Today</Button>
        <Button variant="icon" aria-label="Previous period" title="Previous period" onClick={() => navigate(-1)}>&larr;</Button>
        <Button variant="icon" aria-label="Next period" title="Next period" onClick={() => navigate(1)}>&rarr;</Button>
        <h2 className={styles.period}>{view === "week" ? `${labelDate(start, { month: "short", day: "numeric" })} - ${labelDate(days[6], { month: "short", day: "numeric", year: "numeric" })}` : labelDate(anchor, { month: "long", year: "numeric" })}</h2>
        <div className={styles.switcher} role="group" aria-label="Calendar view">{(["week", "month"] as const).map((mode) => <Button key={mode} size="sm" variant={view === mode ? "secondary" : "ghost"} aria-pressed={view === mode} onClick={() => setView(mode)}>{mode === "week" ? "Week" : "Month"}</Button>)}</div>
      </div>
    </header>
    {savedPost?.scheduledAt && <div className={styles.savedSummary}><span>Saved schedule · {snapshot?.schedule?.date} · {snapshot?.schedule?.time} · {snapshot?.schedule?.timezone}</span><Button variant="outline" size="sm" onClick={jumpToSavedSchedule}>Jump to saved schedule</Button></div>}
    <div className={styles.toolbar}>
      <Select aria-label="Platform filter" value={platform} onChange={(event) => setPlatform(event.target.value as Platform)}><option value="all">All platforms</option>{platforms.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</Select>
      <div className={styles.controls}><StatusPillFilter<Platform> label="Platform filters" role="group" className={styles.controls} value={platform} onChange={setPlatform} toggleValue="all" options={platforms.map((item) => ({ value: item.value, label: item.label, content: <span className={styles.platform} data-platform={item.value}>{item.short}</span> }))} /><Link className={styles.newPost} href={APP_ROUTES.pocsSinglePost} aria-label="New post" title="New post">+</Link></div>
      <Select aria-label="Status filter" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</Select>
      <div className={styles.legend}>{stages.map((stage) => <span className={styles.stage} data-stage={stage} key={stage}><span />{stage}</span>)}</div>
    </div>
    <section className={styles.readyQueue} aria-label="Ready queue"><h2 className="luxe-section-title">Ready queue</h2><p>{ready.length ? `${ready.length} saved post${ready.length === 1 ? "" : "s"}` : "No saved posts ready to schedule."}</p><div>{ready.map(renderPost)}</div></section>
    <SplitPaneLayout className={styles.workspace} data-details={Boolean(selected)} primary={<section className={styles.calendarArea} aria-label="Content calendar">
        <div className={styles.scroll}>
          <div className={view === "week" ? styles.week : styles.month} style={view === "week" && splitSavedDay ? { gridTemplateColumns: `3.5rem ${days.map((day) => dateKey(day) === savedDay ? "20rem" : "minmax(6.5rem, 1fr)").join(" ")}` } : undefined}>
            {view === "week" && <div className={styles.timeHeading}>Local time</div>}
            {days.slice(0, 7).map((day) => <div className={styles.dayHeading} key={dateKey(day)}><span>{labelDate(day, { weekday: "short" })}</span>{view === "week" && <time dateTime={dateKey(day)} data-today={dateKey(day) === initialData.referenceDate}>{labelDate(day, { month: "short", day: "numeric" })}</time>}</div>)}
            {view === "week" && <div className={styles.timeAxis} style={{ height: `${hourCount * 70}px`, gridTemplateRows: `repeat(${hourCount}, 1fr)` }}>{Array.from({ length: hourCount }, (_, index) => <span key={index}>{String(index + firstHour).padStart(2, "0")}:00</span>)}</div>}
            {days.map((day) => <div key={dateKey(day)} className={view === "week" ? styles.weekDay : styles.monthDay} style={view === "week" ? { height: `${hourCount * 70}px` } : undefined} data-muted={view === "month" && day.getUTCMonth() !== anchor.getUTCMonth()}>
              {view === "month" && <time className={styles.monthNumber} dateTime={dateKey(day)}>{day.getUTCDate()}</time>}
              {filtered.filter((post) => post.scheduledAt.slice(0, 10) === dateKey(day)).sort((first, second) => first.scheduledAt.localeCompare(second.scheduledAt)).map((post) => view === "week" ? <div key={post.id} className={styles.timedPost} data-lane={splitSavedDay && dateKey(day) === savedDay ? post.id === mockSinglePostLoop.id ? "saved" : "synthetic" : undefined} style={{ top: `${((Number(post.scheduledAt.slice(11, 13)) + Number(post.scheduledAt.slice(14, 16)) / 60 - firstHour) / hourCount) * 100}%` }}>{renderPost(post)}</div> : renderPost(post))}
            </div>)}
          </div>
        </div>
        {visible.length === 0 && <div className={styles.empty}><h3>No posts in this {view}</h3><Button variant="outline" size="sm" onClick={() => { setPlatform("all"); setStatus("all"); setAnchor(parseDate(initialData.referenceDate)); }}>Reset calendar</Button></div>}
        <footer className={styles.summary}><div><strong>{view === "week" ? "This Week" : "This Month"}</strong><span>{visible.length} posts · {new Set(visible.map((post) => post.channel)).size} platforms</span></div>{stages.map((stage) => <div key={stage}><span className={styles.stage} data-stage={stage}><span />{stage}</span><strong>{visible.filter((post) => post.calendarStage === stage).length} posts</strong></div>)}</footer>
      </section>} secondary={selected && <aside ref={drawerRef} className={styles.drawer} aria-label="Post details" onKeyDown={(event) => { if (event.key === "Escape") closeDetails(); }}>
        <div className={styles.drawerHeading}><span className="luxe-eyebrow">POST DETAILS</span><Button variant="icon" aria-label="Close post details" title="Close post details" onClick={closeDetails}>&times;</Button></div>
        <div className={selectedSaved ? styles.savedVisual : undefined} data-template={selectedSaved ? snapshot?.template : undefined} data-format={selectedSaved ? snapshot?.format : undefined}><Image src={selected.image} alt={selected.alt} width={600} height={450} className={styles.preview} sizes="(max-width: 1000px) 90vw, 300px" />{selectedSaved && snapshot && <div className={styles.visualLayers}>{snapshot.layers.includes("Brand signature") && <span>THE LUXE STUDIO</span>}<div>{snapshot.layers.includes("Headline") && <strong>{snapshot.headline}</strong>}{snapshot.layers.includes("Accent line") && <em>{mockSinglePostLoop.slides[0].subtitle}</em>}</div></div>}</div>
        <h2 className="luxe-section-title">{selected.title}</h2><p className={styles.platform} data-platform={selected.channel}>{platformLabel(selected.channel)} · {selected.format}</p>
        <span className={styles.stage} data-stage={selected.calendarStage}><span />{selected.calendarStage}</span>
        <p className={styles.detailDate}>{selected.scheduledAt ? <>{labelDate(parseDate(selected.scheduledAt), { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · {selected.scheduledAt.slice(11, 16)}<br />{selectedSaved ? snapshot?.schedule?.timezone : initialData.timezone}</> : "No schedule selected"}</p>
        {selectedSaved && snapshot ? <><Badge variant="neutral">Saved in this browser</Badge><p className={styles.caption}>{snapshot.caption}</p><p className={styles.detailDate}>Caption: {snapshot.versions.find((version) => version.id === snapshot.acceptedVersion)?.label ?? "Not accepted"} · Visual: {snapshot.template} · {snapshot.visualApproved ? "Accepted" : "Not accepted"}</p><Link href={APP_ROUTES.pocsSinglePost} className={styles.openPost}>Open Post Dashboard &rarr;</Link><p className={styles.detailDate}>Edit or reschedule in the saved post. No publishing connection.</p></> : <p className={styles.detailDate}>Synthetic fixture · no linked saved post</p>}
        {!selectedSaved && <>
        <form className={styles.reschedule} onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); const date = String(values.get("date")); const time = String(values.get("time")); updatePost({ scheduledAt: `${date}T${time}:00+01:00` }); setAnchor(parseDate(date)); }}>
          <label>Reschedule date<Input key={`${selected.id}-${selected.scheduledAt}-date`} name="date" type="date" required min="2026-11-01" max="2027-02-28" defaultValue={selected.scheduledAt.slice(0, 10)} /></label>
          <label>Reschedule time<Input key={`${selected.id}-${selected.scheduledAt}-time`} name="time" type="time" min="08:00" max="18:30" required defaultValue={selected.scheduledAt.slice(11, 16)} /></label>
          <Button variant="outline" size="sm" type="submit">Reschedule</Button>
        </form>
        <Button variant="ghost" size="sm" onClick={() => updatePost({ calendarStage: "Published", stage: "Published", status: "published" })}>Mark as Published</Button>
        <Button variant="ghost" size="sm" onClick={() => updatePost({ calendarStage: "Ready", stage: "Ready", status: "approved" })}>Move to Ready</Button>
        <Button variant="ghost" size="sm" onClick={() => { setPosts((current) => current.filter((post) => post.id !== selected.id)); setNotice(`Removed ${selected.title} from this preview only. Not saved.`); closeDetails(); }}>Delete</Button>
        </>}
      </aside>} />
    <p className={styles.notice} role="status">{notice || `${visible.length} posts in view: ${visible.filter((post) => post.id === mockSinglePostLoop.id).length} browser-saved, ${visible.filter((post) => post.id !== mockSinglePostLoop.id).length} synthetic. Each entry uses its labeled local date/time. Fixture edits are not saved; nothing is published.`}</p>
  </div>;
}