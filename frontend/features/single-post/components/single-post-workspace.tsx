"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TextEditorDrawer, VisualEditorDrawer, ReviewModal, ScheduleModal } from "@/components/pocs/single-post/post-layers";
import { SplitPaneLayout } from "@/components/layouts/split-pane-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { MediaPreviewCard } from "@/components/ui/media-preview-card";
import { StepProgressHeader } from "@/components/ui/step-progress-header";
import type { SinglePostLoopData } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";
import { canApprovePocPost, createPocPostState, hasAcceptedPocCaption, pocPostSignature, pocVisualSignature,
  POC_POST_CHECKS, readPocPostStateResult, savePocPostStateResult, zonedScheduleInstant, type PocPostState } from "@/lib/state/poc-post-state";
import styles from "./single-post.module.css";

const checks = POC_POST_CHECKS;
type ScheduleMode = "calendar" | "suggest" | "later";

export function SinglePostWorkspace({ data }: { data: SinglePostLoopData }) {
  const router = useRouter();
  const [post, setPost] = useState<PocPostState>(createPocPostState);
  const [view, setView] = useState("dashboard");
  const [selectedVersion, setSelectedVersion] = useState(data.versions[0].id);
  const [suggestion, setSuggestion] = useState(data.versions[0].text);
  const [slide, setSlide] = useState(0);
  const [comparison, setComparison] = useState("both");
  const [mode, setMode] = useState<ScheduleMode>("calendar");
  const [slot, setSlot] = useState(data.suggestedSlot);
  const [notice, setNotice] = useState("Preview / synthetic data. Saves stay in this browser; nothing is published.");
  const [loaded, setLoaded] = useState(false);
  const [savedState, setSavedState] = useState<string | null>(null);
  const baseline = useRef<string | null | undefined>(undefined);
  const [saveError, setSaveError] = useState<"conflict" | "unavailable" | "invalid" | null>(null);
  const [confirmReload, setConfirmReload] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const result = readPocPostStateResult();
      baseline.current = result.status === "available" ? result.snapshot : undefined;
      const restored = result.status === "available" ? result.post : null;
      if (result.status !== "available") {
        setSaveError(result.status);
        setNotice("Saved browser-local post could not be read. Local edits retained; saving is blocked until Reload Saved Post succeeds.");
      } else if (restored) {
        setPost(restored);
        setSavedState(JSON.stringify(restored));
        setSelectedVersion(restored.acceptedVersion ?? data.versions[0].id);
        setSuggestion(restored.workingCaption ?? restored.caption);
        if (restored.schedule) setSlot(restored.schedule);
        setNotice("Recovered saved browser-local post. Originals and versions preserved.");
      } else {
        setNotice("No valid saved post recovered. Local demo only; Save Draft to retain your work.");
      }
      setLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [data]);

  function save(candidate = post, message = "Draft saved in this browser. Original input preserved.") {
    if (!loaded) return false;
    const snapshot = { ...candidate, workingCaption: suggestion };
    setPost(snapshot);
    const result = baseline.current === undefined
      ? { status: "unavailable" as const } : savePocPostStateResult(snapshot, baseline.current);
    if (result.status !== "saved") {
      setSaveError(result.status);
      setNotice(result.status === "conflict"
        ? "Save conflict: the saved post changed or was deleted. Unsaved local edits retained; newer saved history was not overwritten. Reload Saved Post to continue."
        : result.status === "invalid"
          ? "Could not save an invalid post package. Unsaved local edits retained; saved history was not overwritten."
          : "Could not save in this browser. Storage unavailable or unreadable. Unsaved local edits retained; keep this tab open and retry or Reload Saved Post.");
      return false;
    }
    baseline.current = result.snapshot;
    setPost(result.post);
    setSavedState(JSON.stringify(result.post));
    setSaveError(null);
    setConfirmReload(false);
    setNotice(message);
    return true;
  }

  function reloadSavedPost() {
    const result = readPocPostStateResult();
    if (result.status !== "available") {
      setSaveError(result.status);
      setNotice("Could not reload saved post: storage is unreadable or invalid. Unsaved local edits retained; nothing was overwritten.");
      return;
    }
    const restored = result.post ?? createPocPostState();
    baseline.current = result.snapshot;
    setPost(restored);
    setSavedState(result.post ? JSON.stringify(restored) : null);
    setSelectedVersion(restored.acceptedVersion ?? data.versions[0].id);
    setSuggestion(restored.workingCaption ?? restored.caption);
    setSlot(restored.schedule ?? data.suggestedSlot);
    setSaveError(null);
    setConfirmReload(false);
    setView("dashboard");
    setNotice(result.post ? "Reloaded saved browser-local post. Newer caption and version history preserved."
      : "No saved post remains. Local demo restored; Save Draft to retain new work.");
  }

  function reloadActions() {
    return saveError && <div className={styles.actions}>{confirmReload
      ? <><Button variant="outline" onClick={reloadSavedPost}>Discard Local Edits &amp; Reload</Button><Button variant="outline" onClick={() => setConfirmReload(false)}>Keep Local Edits</Button></>
      : <Button variant="outline" onClick={() => { setConfirmReload(true); setNotice("Reloading replaces your unsaved local edits with the saved post. Discard Local Edits & Reload to confirm, or Keep Local Edits."); }}>Reload Saved Post</Button>}</div>;
  }

  function updatedPost(update: Partial<PocPostState>): PocPostState {
    const visualChanged = "headline" in update || "template" in update || "layers" in update || "format" in update;
    return { ...post, ...update, approved: false, approvedPackage: null, schedule: null,
      checks: "checks" in update ? update.checks! : [],
      ...(visualChanged ? { visualApproved: false, visualApproval: null } : {}) };
  }

  function changePost(update: Partial<PocPostState>) {
    setPost(updatedPost(update));
    setNotice("Unsaved local edits. Final approval and schedule cleared; originals preserved.");
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
    const next = updatedPost({ caption: suggestion, versions, acceptedVersion: version.id });
    setPost(next);
    setSelectedVersion(version.id);
    if (save(next, `${version.label} accepted and saved in this browser. Original input preserved.`)) setView("dashboard");
  }

  const captionValid = hasAcceptedPocCaption(post);
  const canApprove = canApprovePocPost(post);
  const isReady = post.approved && canApprove && post.approvedPackage === pocPostSignature(post);
  const dirty = savedState !== JSON.stringify({ ...post, workingCaption: suggestion });
  const format = post.format;
  const currentSlide = data.slides[slide];
  const status = isReady ? (post.schedule ? (dirty ? "Schedule unsaved" : "Scheduled locally") : "Ready") : captionValid ? "In review" : "In progress";
  const stage = isReady ? 5 : !captionValid ? 2 : !post.visualApproved ? 3 : 4;
  const nextView = isReady ? "ready" : !captionValid ? "message" : !post.visualApproved ? "visual" : "review";
  const ActiveLayer = view === "message" ? TextEditorDrawer : view === "visual" ? VisualEditorDrawer : view === "review" ? ReviewModal : ScheduleModal;

  function finishLayer() { if (save()) setView("dashboard"); }

  async function copyText() {
    try { await navigator.clipboard.writeText(post.caption); setNotice("Current message copied."); }
    catch { setNotice("Clipboard unavailable. Open the message editor to select your text."); }
  }

  async function sharePreview() {
    try {
      const preview = { title: data.title, text: `${post.caption}\n\n${post.assets.map((asset) => new URL(asset.image, window.location.origin).href).join("\n")}` };
      if (navigator.share) await navigator.share(preview);
      else { await navigator.clipboard.writeText(`${preview.title}\n\n${preview.text}`); setNotice("Preview text and original asset links copied. No public share was created."); }
    } catch { setNotice("Preview share cancelled or unavailable. Your post is unchanged."); }
  }

  function exportPackage() {
    if (!isReady || !save()) return;
    const packageData = { id: data.id, title: data.title, channel: data.channel, original: data.original,
      ...post, localPreviewOnly: true, rendering: "Recipe and source assets; no rendered media or publishing" };
    const url = URL.createObjectURL(new Blob([JSON.stringify(packageData, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `${data.id}-local-package.json`; link.click();
    URL.revokeObjectURL(url);
    setNotice("Approved local package exported with current message, source assets and visual recipe.");
  }

  function artwork(original = false) {
    return <MediaPreviewCard className={`${styles.artwork} ${format === "portrait" ? styles.portrait : ""} ${!original ? styles[post.template.toLowerCase()] : ""}`} image={{ src: currentSlide.image, alt: currentSlide.alt, fill: true, sizes: "(max-width: 700px) 90vw, 500px", priority: slide === 0 }}>
      {!original && <div className={styles.artworkText}>
        {post.layers.includes("Brand signature") && <span className={styles.signature}>THE LUXE STUDIO</span>}
        <div>{post.layers.includes("Headline") && <strong>{slide === 0 ? post.headline : currentSlide.headline}</strong>}
          {post.layers.includes("Accent line") && <em>{currentSlide.subtitle}</em>}</div>
        <span className={styles.signature}>Small steps. Consistent action. Big results.</span>
      </div>}
      <Badge className={styles.slideCount}>{slide + 1} / {data.slides.length}</Badge>
    </MediaPreviewCard>;
  }

  function slidePicker() {
    return <div className={styles.thumbnails} aria-label="Carousel slides">{data.slides.map((item, index) =>
      <button key={item.id} type="button" title={`Slide ${index + 1}: ${item.headline}`} aria-label={`Slide ${index + 1}`} aria-pressed={slide === index} onClick={() => setSlide(index)}>
        <Image src={item.image} alt="" fill sizes="80px" /><span>{index + 1}</span>
      </button>)}</div>;
  }

  function timeline() {
    return <StepProgressHeader className={styles.timeline} label="Post status timeline" currentStep={stage} markCompleted completedMarker="✓" steps={["Idea", "Assets", "Message", "Visual", "Review", "Ready"].map((name) => ({ id: name, label: <small>{name}</small> }))} />;
  }

  return <div className={styles.workspace}>
    <header className={styles.header}><div><p className={styles.eyebrow}>PAGE 10 / SINGLE-POST WORKSPACE</p><h1>{data.title}</h1><p>Instagram · Carousel · {data.id}</p></div>
      <div className={styles.actions}><Badge variant={isReady ? "active" : "pending"}>{status}</Badge><span aria-label="Browser save status">{!loaded ? "Recovering..." : dirty || saveError ? "Unsaved local edits" : "Saved in this browser"}</span><Button variant="outline" onClick={() => save()} disabled={!loaded}>Save Draft</Button></div>
    </header>
    <p role="status" className={styles.notice}>{notice}</p>
    {reloadActions()}
    <SplitPaneLayout as="section" aria-label="Post dashboard" className={styles.dashboard} primary={<div className={styles.side}>
        <div className={styles.previewHeader}><h2>Original / Working</h2><Badge>{data.slides.length} selected assets</Badge></div>
        <div role="group" aria-label="Comparison view" className={styles.actions}>{["both", "original", "working"].map((choice) =>
          <Button key={choice} variant="outline" aria-pressed={comparison === choice} onClick={() => setComparison(choice)}>{choice === "both" ? "Side by side" : choice === "original" ? "Original" : "Working"}</Button>)}</div>
        <div className={styles.hubComparison}>
          {comparison !== "working" && <div><h3>Original <Badge>Locked</Badge></h3>{artwork(true)}<p className={styles.caption}>{data.original}</p></div>}
          {comparison !== "original" && <div><h3>Working <Badge>{post.acceptedVersion ?? "Not accepted"}</Badge></h3>{artwork()}<p className={styles.caption}>{post.caption}</p></div>}
        </div>{slidePicker()}
      </div>} secondary={<div className={styles.side}><h2>Your post</h2>{timeline()}<p className={styles.eyebrow}>CURRENT STAGE</p><h3>{["Idea", "Assets", "Message", "Visual", "Review", "Ready"][stage]}</h3>
        <Button data-post-next-action disabled={!loaded} onClick={() => setView(nextView)}>{isReady ? "Continue to Schedule" : !captionValid ? "Continue Message" : !post.visualApproved ? "Continue to Visual" : "Continue to Review"} →</Button>
        <dl className={styles.summary}><dt>Start date</dt><dd>{data.createdAt.slice(0, 10)}</dd><dt>Target date</dt><dd>{post.schedule?.date ?? slot.date}</dd><dt>Timezone</dt><dd>{post.schedule?.timezone ?? slot.timezone}</dd></dl>
        <div className={styles.actions}><Button variant="outline" onClick={copyText}>Copy Text</Button><a className="luxe-ui-button luxe-ui-button--outline luxe-ui-button--md" href={currentSlide.image} target="_blank" rel="noreferrer">Original Link</a><Button variant="outline" onClick={sharePreview}>Share Preview</Button></div>
        <div className={styles.actions}><Button variant="outline" disabled={!loaded} onClick={() => setView("message")}>Edit Message</Button><Button variant="outline" disabled={!loaded} onClick={() => setView("visual")}>Edit Visual</Button><Button variant="outline" disabled={!loaded} onClick={() => setView("review")}>Review Post</Button></div>
        {isReady && <div className={styles.actions}><Button variant="outline" onClick={exportPackage}>Export Local Package</Button>{post.schedule && !dirty && <Button variant="outline" onClick={() => router.push(APP_ROUTES.pocsCalendar)}>View in Calendar</Button>}</div>}
      </div>} />
    {view !== "dashboard" && <ActiveLayer onClose={() => setView("dashboard")} notice={notice}>
      {reloadActions()}
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
        <footer className={styles.footer}><Button variant="outline" onClick={() => setView("dashboard")}>Back to Dashboard</Button><Button onClick={finishLayer}>Save &amp; Return</Button></footer>
      </>}
      {view === "visual" && <>
        <div className={styles.previewHeader}><div><p className={styles.eyebrow}>VISUAL / ASSET EDITOR</p><h2>Build on your original.</h2></div><Badge>{post.visualApproved ? "Visual approved" : "Working version"}</Badge></div>
        <div className={styles.visualGrid}><div><h3>Original asset <Badge>Locked</Badge></h3>{artwork(true)}</div><div><h3>Working asset</h3>{artwork()}{slidePicker()}</div>
          <aside className={styles.inspector}><h3>Canvas inspector</h3><label className={styles.field}>Template<Select value={post.template} onChange={(event) => changePost({ template: event.target.value, visualApproved: false })}>{data.templates.map((template) => <option key={template}>{template}</option>)}</Select></label>
            <label className={styles.field}>Cover headline<textarea aria-label="Cover headline" className={styles.headlineInput} value={post.headline} onChange={(event) => changePost({ headline: event.target.value, visualApproved: false })} /></label>
            <fieldset className={styles.layers}><legend>Layers</legend>{data.layers.map((layer) => <label key={layer}><input type="checkbox" checked={post.layers.includes(layer)} onChange={() => changePost({ layers: post.layers.includes(layer) ? post.layers.filter((item) => item !== layer) : [...post.layers, layer], visualApproved: false })} />{layer}</label>)}</fieldset>
            <Button disabled={!post.headline.trim()} onClick={() => { const next = updatedPost({ visualApproved: true, visualApproval: pocVisualSignature(post) }); setPost(next); if (save(next, "Working visual accepted and saved in this browser. Original asset preserved.")) setView("dashboard"); }}>Accept Visual</Button>
          </aside>
        </div><footer className={styles.footer}><Button variant="outline" onClick={() => setView("dashboard")}>Back to Dashboard</Button><Button onClick={finishLayer}>Save &amp; Return</Button></footer>
      </>}
      {view === "review" && <>
        <div className={styles.previewHeader}><div><p className={styles.eyebrow}>REVIEW / FINAL POST PREVIEW</p><h2>One last look.</h2></div><Select aria-label="Preview aspect ratio" value={format} onChange={(event) => changePost({ format: event.target.value as PocPostState["format"] })}><option value="square">1:1 Carousel</option><option value="portrait">9:16 Carousel</option></Select></div>
        <div className={styles.reviewGrid}>
          <aside className={styles.side}><h3>Post summary</h3><dl className={styles.summary}><dt>Platform</dt><dd>Instagram</dd><dt>Format</dt><dd>{format === "square" ? "1080 × 1080" : "1080 × 1920"}</dd><dt>Slides</dt><dd>{data.slides.length}</dd><dt>Caption</dt><dd>{post.acceptedVersion ? post.versions.find((item) => item.id === post.acceptedVersion)?.label : "Not accepted"}</dd></dl><h3>Validation checklist</h3>
            <div className={styles.checklist}><label><input type="checkbox" checked={captionValid} readOnly disabled />Message accepted</label><label><input type="checkbox" checked={post.visualApproved} readOnly disabled />Visual accepted</label>{checks.map((check) => <label key={check}><input type="checkbox" checked={post.checks.includes(check)} onChange={() => changePost({ checks: post.checks.includes(check) ? post.checks.filter((item) => item !== check) : [...post.checks, check] })} />{check}</label>)}</div>
          </aside><div>{artwork()}{slidePicker()}<p className={styles.caption}>{post.caption}</p></div>
          <aside className={styles.side}><h3>Post package</h3>{[`${data.slides.length} source slides + visual recipe`, "Caption / Message", "Original assets", `${post.versions.length} caption versions`].map((item) => <div key={item} className={styles.packageItem}>{item}<Badge>Included</Badge></div>)}<label className={styles.field}>Caption version<Select aria-label="Review caption version" value={post.acceptedVersion ?? ""} onChange={(event) => { chooseVersion(event.target.value); setView("message"); }}><option value="" disabled>Not accepted</option>{post.versions.map((version) => <option key={version.id} value={version.id}>{version.label}{version.id === post.acceptedVersion ? " - Current" : " - Preserved"}</option>)}</Select></label><details><summary>Version history</summary>{post.versions.map((version) => <p key={version.id}><strong>{version.label}</strong> · {version.id === post.acceptedVersion ? "Current" : "Preserved"}</p>)}</details></aside>
        </div><footer className={styles.footer}><div className={styles.actions}><Button variant="outline" onClick={() => setView("message")}>Edit Message</Button><Button variant="outline" onClick={() => setView("visual")}>Edit Visual</Button><Button variant="outline" onClick={finishLayer}>Save &amp; Return</Button></div><Button disabled={!canApprove} onClick={() => { const next = { ...post, approved: true, approvedPackage: pocPostSignature(post) }; setPost(next); if (save(next, "Exact message and visual package approved and saved locally. No production approval.")) setView("dashboard"); }}>Approve &amp; Mark Ready →</Button></footer>
      </>}
      {view === "ready" && <div className={styles.ready}>
        <div className={styles.readyHeading}><span className={styles.readyMark}>{isReady ? "✓" : "!"}</span><h2>{isReady ? "Your post is ready." : "Your post needs approval."}</h2><p>{isReady ? "Your accepted caption and visual are in one post package." : "Accept the caption and visual, then complete the review checklist."}</p></div>
        <Card className={`${styles.card} ${styles.readySummary}`}><div>{artwork()}</div><div><h3>{data.title}</h3><p>Instagram · Carousel</p><p>{data.slides.length} slides · {post.versions.length} caption versions</p><Badge variant={isReady ? "active" : "pending"}>{status}</Badge></div></Card>
        {!isReady ? <Button onClick={() => setView("review")}>Return to Review</Button> : <>
          <h3>When should this go live?</h3><div className={styles.options}>{([{ id: "calendar", title: "Add to Calendar", detail: "Choose your date and time" }, { id: "suggest", title: "Let THE LUXE Suggest", detail: "Use the sample planning slot" }, { id: "later", title: "Keep Ready for Later", detail: "Leave this post unscheduled" }] as const).map((option) => <button key={option.id} type="button" aria-pressed={mode === option.id} onClick={() => { setMode(option.id); if (option.id === "suggest") setSlot(data.suggestedSlot); }}><strong>{option.title}</strong><span>{option.detail}</span></button>)}</div>
          {mode !== "later" && <form className={styles.scheduleForm} onSubmit={(event) => { event.preventDefault(); if (zonedScheduleInstant(slot) === null) { setNotice("Choose a valid future date and time in the selected timezone. Ambiguous DST slots are not supported."); return; } const next = { ...post, schedule: { ...slot } }; setPost(next); if (save(next, "Scheduled in this browser only. No publishing service is connected.")) router.push(APP_ROUTES.pocsCalendar); }}>
            <div className={styles.scheduleFields}><label className={styles.field}>Date<Input aria-label="Schedule date" type="date" required value={slot.date} onChange={(event) => setSlot({ ...slot, date: event.target.value })} /></label><label className={styles.field}>Time<Input aria-label="Schedule time" type="time" required value={slot.time} onChange={(event) => setSlot({ ...slot, time: event.target.value })} /></label><label className={styles.field}>Timezone<Select aria-label="Schedule timezone" value={slot.timezone} onChange={(event) => setSlot({ ...slot, timezone: event.target.value })}><option>Europe/Berlin</option><option>Europe/London</option><option>America/New_York</option><option>UTC</option></Select></label></div><Button type="submit">Schedule Post</Button>
          </form>}
          {mode === "later" && <Button onClick={() => { const next = { ...post, schedule: null }; setPost(next); if (save(next, "Post saved Ready and unscheduled in this browser.")) setView("dashboard"); }}>Keep Ready</Button>}
          {post.schedule && <div className={styles.scheduled}><h3>{dirty ? "Schedule not saved" : "Scheduled locally"}</h3><p>{post.schedule.date} · {post.schedule.time} · {post.schedule.timezone}</p></div>}
        </>}
        <footer className={styles.footer}><Button variant="outline" onClick={() => setView("dashboard")}>Back to Post</Button><Button onClick={finishLayer} disabled={!loaded}>Save &amp; Return</Button></footer>
      </div>}
    </ActiveLayer>}
  </div>;
}