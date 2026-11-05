"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import type { SinglePostLoopData, SinglePostVersion } from "@/lib/mock-data/pocs-data";
import styles from "./single-post.module.css";

const views = [
  { value: "dashboard", label: "10a Dashboard" },
  { value: "message", label: "10b Caption / Text" },
  { value: "visual", label: "10c Visual / Assets" },
  { value: "review", label: "10d Final Review" },
  { value: "ready", label: "10e Ready / Schedule" },
];
const checks = ["Brand match", "Platform format", "Asset rights"];
type ScheduleMode = "calendar" | "suggest" | "later";

interface PostState {
  caption: string;
  versions: SinglePostVersion[];
  acceptedVersion: string | null;
  headline: string;
  template: string;
  layers: string[];
  visualApproved: boolean;
  checks: string[];
  approved: boolean;
  schedule: { date: string; time: string; timezone: string } | null;
}

function initialState(data: SinglePostLoopData): PostState {
  return {
    caption: data.original, versions: [...data.versions], acceptedVersion: null,
    headline: data.slides[0].headline, template: data.templates[0], layers: [...data.layers],
    visualApproved: false, checks: [], approved: false, schedule: null,
  };
}

function restoreState(raw: string, data: SinglePostLoopData): PostState | null {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") return null;
  const candidate = value as PostState;
  if (typeof candidate.caption !== "string" || typeof candidate.headline !== "string"
    || !data.templates.includes(candidate.template) || !Array.isArray(candidate.layers)
    || !candidate.layers.every((layer) => data.layers.includes(layer))
    || !Array.isArray(candidate.checks) || !candidate.checks.every((check) => checks.includes(check))
    || !Array.isArray(candidate.versions) || !candidate.versions.every((version) => version
      && typeof version.id === "string" && typeof version.label === "string"
      && typeof version.text === "string" && typeof version.createdAt === "string")
    || !(candidate.acceptedVersion === null || typeof candidate.acceptedVersion === "string")
    || typeof candidate.visualApproved !== "boolean" || typeof candidate.approved !== "boolean"
    || !(candidate.schedule === null || (typeof candidate.schedule === "object"
      && typeof candidate.schedule.date === "string" && typeof candidate.schedule.time === "string"
      && typeof candidate.schedule.timezone === "string"))) return null;
  return candidate;
}

export function SinglePostWorkspace({ data }: { data: SinglePostLoopData }) {
  const [post, setPost] = useState<PostState>(() => initialState(data));
  const [view, setView] = useState("dashboard");
  const [selectedVersion, setSelectedVersion] = useState(data.versions[0].id);
  const [suggestion, setSuggestion] = useState(data.versions[0].text);
  const [slide, setSlide] = useState(0);
  const [format, setFormat] = useState("square");
  const [mode, setMode] = useState<ScheduleMode>("calendar");
  const [slot, setSlot] = useState(data.suggestedSlot);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notice, setNotice] = useState("Preview / synthetic data. Saves stay in this browser; nothing is published.");
  const [loaded, setLoaded] = useState(false);
  const storageKey = `luxe-poc-single-post:${data.id}`;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        const restored = saved ? restoreState(saved, data) : null;
        if (restored) setPost(restored);
      } catch {
        setNotice("Browser recovery unavailable. This preview remains usable in this session.");
      }
      setLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [data, storageKey]);

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(post));
      setNotice("Draft saved in this browser. Original input preserved.");
      return true;
    } catch {
      setNotice("Could not save in this browser. Keep this tab open to preserve your work.");
      return false;
    }
  }

  function changePost(update: Partial<PostState>) {
    setPost((current) => ({ ...current, ...update, approved: false, schedule: null }));
  }

  function chooseVersion(id: string) {
    const version = post.versions.find((item) => item.id === id);
    if (version) { setSelectedVersion(id); setSuggestion(version.text); }
  }

  function acceptCaption() {
    if (!suggestion.trim()) { setNotice("Add a caption before accepting."); return; }
    let version = post.versions.find((item) => item.id === selectedVersion && item.text === suggestion);
    const versions = [...post.versions];
    if (!version) {
      version = { id: `caption-v${versions.length + 1}`, label: `V${versions.length + 1}`, text: suggestion, createdAt: new Date().toISOString() };
      versions.push(version);
    }
    changePost({ caption: suggestion, versions, acceptedVersion: version.id });
    setSelectedVersion(version.id);
    setNotice(`${version.label} accepted as the current caption. Original input preserved.`);
  }

  const captionValid = post.versions.some((version) => version.id === post.acceptedVersion && version.text === post.caption);
  const canApprove = captionValid && post.visualApproved && checks.every((check) => post.checks.includes(check));
  const isReady = post.approved && canApprove;
  const currentSlide = data.slides[slide];
  const status = isReady ? (post.schedule ? "Scheduled" : "Ready") : captionValid ? "In review" : "In progress";
  const stage = isReady ? 5 : post.visualApproved ? 4 : captionValid ? 3 : 2;

  function artwork(original = false) {
    return <div className={`${styles.artwork} ${format === "portrait" ? styles.portrait : ""} ${!original ? styles[post.template.toLowerCase()] : ""}`}>
      <Image src={currentSlide.image} alt={currentSlide.alt} fill sizes="(max-width: 700px) 90vw, 500px" priority={slide === 0} />
      {!original && <div className={styles.artworkText}>
        {post.layers.includes("Brand signature") && <span className={styles.signature}>THE LUXE STUDIO</span>}
        <div>{post.layers.includes("Headline") && <strong>{slide === 0 ? post.headline : currentSlide.headline}</strong>}
          {post.layers.includes("Accent line") && <em>{currentSlide.subtitle}</em>}</div>
        <span className={styles.signature}>Small steps. Consistent action. Big results.</span>
      </div>}
      <Badge className={styles.slideCount}>{slide + 1} / {data.slides.length}</Badge>
    </div>;
  }

  function slidePicker() {
    return <div className={styles.thumbnails} aria-label="Carousel slides">{data.slides.map((item, index) =>
      <button key={item.id} type="button" title={`Slide ${index + 1}: ${item.headline}`} aria-label={`Slide ${index + 1}`} aria-pressed={slide === index} onClick={() => setSlide(index)}>
        <Image src={item.image} alt="" fill sizes="80px" /><span>{index + 1}</span>
      </button>)}</div>;
  }

  function timeline() {
    return <ol className={styles.timeline} aria-label="Post status timeline">{["Idea", "Assets", "Message", "Visual", "Review", "Ready"].map((name, index) =>
      <li key={name} aria-current={index === stage ? "step" : undefined} data-complete={index < stage}>
        <span>{index < stage ? "✓" : index + 1}</span><small>{name}</small>
      </li>)}</ol>;
  }

  return <div className={styles.workspace}>
    <header className={styles.header}><div><p className={styles.eyebrow}>PAGE 10 / SINGLE-POST WORKSPACE</p><h1>{data.title}</h1><p>Instagram · Carousel · {data.id}</p></div>
      <div className={styles.actions}><Badge variant={isReady ? "active" : "pending"}>{status}</Badge><Button variant="outline" onClick={save} disabled={!loaded}>Save Draft</Button></div>
    </header>
    <Tabs items={views} value={view} onValueChange={(next) => { setView(next); setCalendarOpen(false); }} ariaLabel="Post creation layers" className={styles.tabs} />
    <p role="status" className={styles.notice}>{notice}</p>
    <div role="tabpanel" aria-label={views.find((item) => item.value === view)?.label}>
      {view === "dashboard" && <div className={styles.dashboard}>
        <div><div className={styles.previewHeader}><h2>Current post</h2><Badge>{data.slides.length} slides</Badge></div>{artwork()}{slidePicker()}</div>
        <div className={styles.side}><h2>Your workspace</h2>{timeline()}<p className={styles.eyebrow}>CURRENT STAGE</p><h3>{["Idea", "Assets", "Message", "Visual", "Review", "Ready"][stage]}</h3><p className={styles.caption}>{post.caption}</p>
          <Button onClick={() => setView(isReady ? "ready" : captionValid ? "visual" : "message")}>Continue {isReady ? "to Schedule" : captionValid ? "to Visual" : "Message"} →</Button>
          <Card className={styles.card}><h3>Original input <Badge>Locked</Badge></h3><p className={styles.caption}>{data.original}</p><small>Created {new Date(data.createdAt).toLocaleDateString("en-GB", { timeZone: "UTC" })}</small></Card>
          <div className={styles.actions}><Button variant="outline" onClick={() => setView("message")}>Edit Message</Button><Button variant="outline" onClick={() => setView("review")}>Review Post</Button></div>
        </div>
      </div>}
      {view === "message" && <>
        <div className={styles.previewHeader}><div><p className={styles.eyebrow}>CAPTION / TEXT EDITOR</p><h2>Keep your voice. Refine your message.</h2></div><Badge>{post.acceptedVersion ? `${post.versions.find((item) => item.id === post.acceptedVersion)?.label} current` : "Awaiting acceptance"}</Badge></div>
        <div className={styles.versionBar}><span>Version history</span>{post.versions.map((version) => <Button key={version.id} size="sm" variant={version.id === selectedVersion ? "primary" : "outline"} aria-pressed={selectedVersion === version.id} onClick={() => chooseVersion(version.id)}>{version.label}</Button>)}</div>
        <div className={styles.editorGrid}>
          <Card className={styles.card}><div className={styles.previewHeader}><h3>Original / baseline</h3><Badge>Locked</Badge></div><textarea aria-label="Original caption" className={styles.textarea} value={data.original} readOnly /><small>Original thought · Never overwritten</small></Card>
          <Card className={styles.card}><div className={styles.previewHeader}><h3>AI suggested / working</h3><Badge>Sample suggestion</Badge></div><textarea aria-label="Suggested caption" className={styles.textarea} value={suggestion} onChange={(event) => setSuggestion(event.target.value)} /><small>{suggestion.length} characters</small>
            <div className={styles.actions}><Button onClick={acceptCaption}>Accept</Button><Button variant="outline" onClick={() => { setSuggestion(post.caption); setNotice("Suggestion rejected. Current caption unchanged."); }}>Reject</Button><Button variant="outline" onClick={() => { document.getElementById("caption-adjust")?.focus(); }}>Adjust</Button></div>
          </Card>
        </div>
        <label className={styles.field}>Refine the suggestion<Select id="caption-adjust" value="" onChange={(event) => { if (event.target.value === "shorten") setSuggestion(suggestion.split("\n\n").slice(0, 2).join("\n\n")); if (event.target.value === "original") setSuggestion(data.original); setNotice("Working suggestion adjusted. Accept to update the current caption."); }}><option value="" disabled>Choose an adjustment</option><option value="shorten">Shorten</option><option value="original">More like my original</option></Select></label>
        <footer className={styles.footer}><Button variant="outline" onClick={() => setView("dashboard")}>Back to Dashboard</Button><Button onClick={() => setView("visual")}>Continue to Visual →</Button></footer>
      </>}
      {view === "visual" && <>
        <div className={styles.previewHeader}><div><p className={styles.eyebrow}>VISUAL / ASSET EDITOR</p><h2>Build on your original.</h2></div><Badge>{post.visualApproved ? "Visual approved" : "Working version"}</Badge></div>
        <div className={styles.visualGrid}><div><h3>Original asset <Badge>Locked</Badge></h3>{artwork(true)}</div><div><h3>Working asset</h3>{artwork()}{slidePicker()}</div>
          <aside className={styles.inspector}><h3>Canvas inspector</h3><label className={styles.field}>Template<Select value={post.template} onChange={(event) => changePost({ template: event.target.value, visualApproved: false })}>{data.templates.map((template) => <option key={template}>{template}</option>)}</Select></label>
            <label className={styles.field}>Cover headline<textarea aria-label="Cover headline" className={styles.headlineInput} value={post.headline} onChange={(event) => changePost({ headline: event.target.value, visualApproved: false })} /></label>
            <fieldset className={styles.layers}><legend>Layers</legend>{data.layers.map((layer) => <label key={layer}><input type="checkbox" checked={post.layers.includes(layer)} onChange={() => changePost({ layers: post.layers.includes(layer) ? post.layers.filter((item) => item !== layer) : [...post.layers, layer], visualApproved: false })} />{layer}</label>)}</fieldset>
            <Button disabled={!post.headline.trim()} onClick={() => { changePost({ visualApproved: true }); setNotice("Working visual approved. Original asset preserved."); }}>Accept Visual</Button>
          </aside>
        </div><footer className={styles.footer}><Button variant="outline" onClick={() => setView("message")}>Back to Message</Button><Button onClick={() => setView("review")}>Continue to Review →</Button></footer>
      </>}
      {view === "review" && <>
        <div className={styles.previewHeader}><div><p className={styles.eyebrow}>REVIEW / FINAL POST PREVIEW</p><h2>One last look.</h2></div><Select aria-label="Preview aspect ratio" value={format} onChange={(event) => setFormat(event.target.value)}><option value="square">1:1 Carousel</option><option value="portrait">9:16 Carousel</option></Select></div>
        <div className={styles.reviewGrid}>
          <aside className={styles.side}><h3>Post summary</h3><dl className={styles.summary}><dt>Platform</dt><dd>Instagram</dd><dt>Format</dt><dd>{format === "square" ? "1080 × 1080" : "1080 × 1920"}</dd><dt>Slides</dt><dd>{data.slides.length}</dd><dt>Caption</dt><dd>{post.acceptedVersion ? post.versions.find((item) => item.id === post.acceptedVersion)?.label : "Not accepted"}</dd></dl><h3>Validation checklist</h3>
            <div className={styles.checklist}><label><input type="checkbox" checked={captionValid} readOnly disabled />Message accepted</label><label><input type="checkbox" checked={post.visualApproved} readOnly disabled />Visual accepted</label>{checks.map((check) => <label key={check}><input type="checkbox" checked={post.checks.includes(check)} onChange={() => changePost({ checks: post.checks.includes(check) ? post.checks.filter((item) => item !== check) : [...post.checks, check] })} />{check}</label>)}</div>
          </aside><div>{artwork()}{slidePicker()}<p className={styles.caption}>{post.caption}</p></div>
          <aside className={styles.side}><h3>Post package</h3>{[`${data.slides.length} final slides`, "Caption / Message", "Original assets", `${post.versions.length} caption versions`, "Brand signature"].map((item) => <div key={item} className={styles.packageItem}>{item}<Badge>Included</Badge></div>)}<details><summary>Version history</summary>{post.versions.map((version) => <p key={version.id}><strong>{version.label}</strong> · {version.id === post.acceptedVersion ? "Current" : "Preserved"}</p>)}</details><p>Originals and earlier versions remain available.</p></aside>
        </div><footer className={styles.footer}><div className={styles.actions}><Button variant="outline" onClick={() => setView("message")}>Edit Message</Button><Button variant="outline" onClick={() => setView("visual")}>Edit Visual</Button></div><Button disabled={!canApprove} onClick={() => { setPost((current) => ({ ...current, approved: true })); setView("ready"); setNotice("Final version approved in this preview. Ready for scheduling."); }}>Approve &amp; Mark Ready →</Button></footer>
      </>}
      {view === "ready" && <div className={styles.ready}>
        <div className={styles.readyHeading}><span className={styles.readyMark}>{isReady ? "✓" : "!"}</span><h2>{isReady ? "Your post is ready." : "Your post needs approval."}</h2><p>{isReady ? "Your accepted caption and visual are in one post package." : "Accept the caption and visual, then complete the review checklist."}</p></div>
        <Card className={`${styles.card} ${styles.readySummary}`}><div>{artwork()}</div><div><h3>{data.title}</h3><p>Instagram · Carousel</p><p>{data.slides.length} slides · {post.versions.length} caption versions</p><Badge variant={isReady ? "active" : "pending"}>{status}</Badge></div></Card>
        {!isReady ? <Button onClick={() => setView("review")}>Return to Review</Button> : <>
          <h3>When should this go live?</h3><div className={styles.options}>{([{ id: "calendar", title: "Add to Calendar", detail: "Choose your date and time" }, { id: "suggest", title: "Let THE LUXE Suggest", detail: "Use the sample planning slot" }, { id: "later", title: "Keep Ready for Later", detail: "Leave this post unscheduled" }] as const).map((option) => <button key={option.id} type="button" aria-pressed={mode === option.id} onClick={() => { setMode(option.id); if (option.id === "suggest") setSlot(data.suggestedSlot); }}><strong>{option.title}</strong><span>{option.detail}</span></button>)}</div>
          {mode !== "later" && <form className={styles.scheduleForm} onSubmit={(event) => { event.preventDefault(); const scheduled = new Date(`${slot.date}T${slot.time}:00Z`); if (!Number.isFinite(scheduled.getTime()) || slot.date < new Date().toISOString().slice(0, 10)) { setNotice("Choose a valid future date and time."); return; } setPost((current) => ({ ...current, schedule: { ...slot } })); setNotice("Scheduled in this preview only. No publishing service is connected."); }}>
            <div className={styles.scheduleFields}><label className={styles.field}>Date<Input aria-label="Schedule date" type="date" required min={new Date().toISOString().slice(0, 10)} value={slot.date} onChange={(event) => setSlot({ ...slot, date: event.target.value })} /></label><label className={styles.field}>Time<Input aria-label="Schedule time" type="time" required value={slot.time} onChange={(event) => setSlot({ ...slot, time: event.target.value })} /></label><label className={styles.field}>Timezone<Select value={slot.timezone} onChange={(event) => setSlot({ ...slot, timezone: event.target.value })}><option>Europe/Berlin</option><option>Europe/London</option><option>America/New_York</option><option>UTC</option></Select></label></div><Button type="submit">Schedule Post</Button>
          </form>}
          {mode === "later" && <Button onClick={() => { setPost((current) => ({ ...current, schedule: null })); setNotice("Post kept Ready in this preview. Save Draft to retain it in this browser."); }}>Keep Ready</Button>}
          {post.schedule && <div className={styles.scheduled}><h3>Scheduled in preview</h3><p>{post.schedule.date} · {post.schedule.time} · {post.schedule.timezone}</p><Button variant="outline" onClick={() => { setCalendarOpen(true); window.history.replaceState(null, "", "#calendar"); }}>View in Calendar</Button></div>}
          {calendarOpen && post.schedule && <Card className={styles.card} aria-label="Preview calendar"><div className={styles.previewHeader}><h3>Calendar / {post.schedule.date}</h3><Button variant="outline" onClick={() => { setCalendarOpen(false); window.history.replaceState(null, "", window.location.pathname); }}>Close Calendar</Button></div><p>{post.schedule.time} · {data.title} · Instagram</p><Badge variant="active">Scheduled</Badge></Card>}
        </>}
        <footer className={styles.footer}><Button variant="outline" onClick={() => setView("dashboard")}>Back to Post</Button><Button onClick={() => { if (save()) setView("dashboard"); }} disabled={!loaded}>Save &amp; Return</Button></footer>
      </div>}
    </div>
  </div>;
}