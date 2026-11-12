"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { useStageFlowProfile } from "@/app/pocs/components/stage-flow-state";
import { WizardLayout } from "@/components/layouts/wizard-layout";
import { Button } from "@/components/ui/button";
import { IdeaCaptureWidget } from "@/components/ui/idea-capture-widget";
import { Input, Select } from "@/components/ui/input";
import { StepProgressHeader } from "@/components/ui/step-progress-header";
import type { mockPocPlan } from "@/data/mock-poc-plan";
import { APP_ROUTES } from "@/lib/routes";
import { capturePocIdea, savePocGamePlan, updatePocIdea, usePocWorkspaceState, type PocGamePlan, type PocIdea } from "@/lib/state/poc-workspace-state";
import styles from "./plan-capture.module.css";

export function PlanCapture({ copy }: { copy: typeof mockPocPlan }) {
  const router = useRouter();
  const workspace = usePocWorkspaceState();
  const profile = useStageFlowProfile();
  const prefix = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState("");
  const [link, setLink] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({ ideaId: null as string | null, objective: "", audience: "", angle: "", format: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const current = copy.steps[step];
  const inbox = workspace.ideas.filter((idea) => idea.status === "inbox");
  const selectedIdea = workspace.ideas.find((idea) => idea.id === draft.ideaId);
  const context = Object.entries(profile.dimensionSummaries);

  function capture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (link.trim()) {
      try {
        const reference = new URL(link.trim());
        if (!["https:", "http:"].includes(reference.protocol)) throw new Error("Invalid link");
      } catch {
        setError("Use a full http or https reference link. Your text is still here.");
        return;
      }
    }
    const text = [raw.trim(), link.trim() ? `Reference: ${link.trim()}` : "", ...files].filter(Boolean).join("\n");
    if (!text) { setError("Add a thought, a link, or a file reference first."); return; }
    if (!capturePocIdea(text)) { setError("Could not save this idea in your browser. Your text and references are still here."); return; }
    setRaw("");
    setLink("");
    setFiles([]);
    if (fileInput.current) fileInput.current.value = "";
    setNotice("Idea saved in this browser's Ideas Inbox.");
  }

  function selectIdea(idea: PocIdea) {
    setDraft((previous) => ({ ...previous, ideaId: idea.id, angle: idea.text }));
    setNotice("Idea selected for your Game Plan.");
    setError("");
  }

  function submitStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInvalidField("");
    const missing = copy.steps.slice(0, step + 1).find(({ field }) => !draft[field].trim());
    if (missing) {
      setStep(copy.steps.findIndex(({ field }) => field === missing.field));
      setInvalidField(missing.field);
      setError(`${missing.label} is required before continuing.`);
      const input = event.currentTarget.elements.namedItem(missing.field);
      if (input instanceof HTMLElement) input.focus();
      return;
    }
    if (step < copy.steps.length - 1) { setStep(step + 1); return; }
    const plan: PocGamePlan = {
      ideaId: draft.ideaId,
      objective: draft.objective.trim(),
      audience: draft.audience.trim(),
      angle: draft.angle.trim(),
      format: draft.format,
      nextAction: `Create a ${draft.format.toLowerCase()} for ${draft.audience.trim()}`,
      updatedAt: new Date().toISOString(),
    };
    if (!savePocGamePlan(plan)) { setError("Could not save your Game Plan in this browser. Your decisions are still here."); return; }
    setNotice("Game Plan saved in this browser.");
    router.push(APP_ROUTES.pocsContentWorkspace);
  }

  return <div className={styles.page}>
    <header className={styles.header}>
      <div><p className="luxe-eyebrow">A little direction, when you need it</p><h1 className="luxe-serif">{copy.title}</h1></div>
      <Link className="luxe-ui-button luxe-ui-button--outline luxe-ui-button--md" href={APP_ROUTES.pocsContentWorkspace}>Quick Create</Link>
    </header>
    <p className={styles.muted}>Browser-local prototype. Planning is optional. No AI analysis, uploads, or audio recording.</p>
    {error && <p id={`${prefix}-error`} className={styles.error} role="alert">{error}</p>}
    <p className={styles.muted} role="status">{notice}</p>
    <div className={styles.columns}>
      <div className={styles.stack}>
        <section className={styles.section} aria-labelledby={`${prefix}-capture`}>
          <h2 id={`${prefix}-capture`}>Leave it unfinished</h2>
          <form className={styles.stack} onSubmit={capture} noValidate>
            <label className={styles.field} htmlFor={`${prefix}-raw`}>Raw idea
              <textarea className="luxe-ui-input" id={`${prefix}-raw`} value={raw} onChange={(event) => setRaw(event.target.value)} rows={5} placeholder="A thought, a voice-note transcript, a story, a question..." />
            </label>
            <label className={styles.field} htmlFor={`${prefix}-link`}>Reference link
              <Input id={`${prefix}-link`} type="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://..." />
            </label>
            <label className={styles.field} htmlFor={`${prefix}-files`}>File references (metadata only)
              <input ref={fileInput} className="luxe-ui-input" id={`${prefix}-files`} type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => `File reference: ${file.name} (${file.size} bytes; ${file.type || "unknown type"})`))} />
            </label>
            {files.length > 0 && <ul className={styles.references}>{files.map((file, index) => <li key={`${file}-${index}`}>{file}</li>)}</ul>}
            <p className={styles.muted}>Files stay on your device. Only their names, sizes, and types enter the inbox.</p>
            <div><Button type="submit">Save to inbox</Button></div>
          </form>
        </section>
        <section className={styles.section} aria-labelledby={`${prefix}-inbox`}>
          <h2 id={`${prefix}-inbox`}>Ideas Inbox</h2>
          {inbox.length === 0 ? <p className={styles.muted}>Your Ideas Inbox is empty.</p> : <ul className={styles.inbox}>
            {inbox.map((idea) => <li key={idea.id} className={styles.idea}>
              <p className={styles.ideaText}>{idea.text}</p>
              <div className={styles.actions}>
                <Button variant="outline" type="button" aria-label={`Use idea: ${idea.text}`} aria-pressed={draft.ideaId === idea.id} onClick={() => selectIdea(idea)}>Use idea</Button>
                <Button variant="ghost" type="button" aria-label={`Archive idea: ${idea.text}`} onClick={() => {
                  if (!updatePocIdea(idea.id, "archived")) { setError("Could not archive this idea in your browser."); return; }
                  if (draft.ideaId === idea.id) setDraft((previous) => ({ ...previous, ideaId: null }));
                  setError("");
                  setNotice("Idea archived in this browser.");
                }}>Archive</Button>
              </div>
            </li>)}
          </ul>}
        </section>
        <div className={styles.section}><IdeaCaptureWidget title="Quick note" onCaptured={() => { setError(""); setNotice("Idea added to your shared inbox."); }} /></div>
      </div>
      <div className={styles.stack}>
        <WizardLayout className={styles.section} aria-labelledby={`${prefix}-plan`} header={<h2 id={`${prefix}-plan`}>A simple Game Plan</h2>} progress={<StepProgressHeader className={styles.steps} label="Planning progress" currentStep={step} steps={copy.steps.map((item) => ({ id: item.field, label: item.label }))} />}>
          {selectedIdea && <p className={styles.ideaText}>Selected idea: {selectedIdea.text}</p>}
          <form className={styles.stack} onSubmit={submitStep} noValidate aria-label="Game Plan">
            <h3>{current.question}</h3>
            <label className={styles.field} htmlFor={`${prefix}-decision`}>{current.label}
              {current.field === "format" ? <Select id={`${prefix}-decision`} name={current.field} required value={draft.format} aria-invalid={invalidField === current.field} aria-describedby={error ? `${prefix}-error` : undefined} onChange={(event) => { setDraft({ ...draft, format: event.target.value }); setInvalidField(""); }}>
                <option value="">Choose a format</option>
                {copy.formats.map((format) => <option key={format}>{format}</option>)}
                {draft.format && !copy.formats.some((format) => format === draft.format) && <option>{draft.format}</option>}
              </Select> : <textarea className="luxe-ui-input" id={`${prefix}-decision`} name={current.field} required rows={4} value={draft[current.field]} placeholder={current.placeholder} aria-invalid={invalidField === current.field} aria-describedby={error ? `${prefix}-error` : undefined} onChange={(event) => { setDraft({ ...draft, [current.field]: event.target.value }); setInvalidField(""); }} />}
            </label>
            {step === 3 && <dl className={styles.summary}>{copy.steps.slice(0, 3).map(({ field, label }) => <div key={field}><dt>{label}</dt><dd>{draft[field]}</dd></div>)}</dl>}
            <div className={styles.actions}>
              {step > 0 && <Button type="button" variant="outline" onClick={() => { setStep(step - 1); setError(""); setInvalidField(""); }}>Back</Button>}
              <Button type="submit">{step === 3 ? "Save Game Plan" : "Continue"}</Button>
            </div>
          </form>
        </WizardLayout>
        {workspace.gamePlan && <section className={styles.section} aria-labelledby={`${prefix}-saved`}>
          <h2 id={`${prefix}-saved`}>Saved Game Plan</h2>
          <dl className={styles.summary}>{copy.steps.map(({ field, label }) => <div key={field}><dt>{label}</dt><dd>{workspace.gamePlan?.[field]}</dd></div>)}</dl>
          <p>{workspace.gamePlan.nextAction}</p>
          <p className={styles.muted}>Saved in this browser <time dateTime={workspace.gamePlan.updatedAt}>{new Date(workspace.gamePlan.updatedAt).toLocaleString()}</time></p>
          <Button type="button" variant="outline" onClick={() => {
            const saved = workspace.gamePlan;
            if (!saved) return;
            setDraft({ ideaId: saved.ideaId, objective: saved.objective, audience: saved.audience, angle: saved.angle, format: saved.format });
            setStep(0);
            setError("");
            setInvalidField("");
          }}>Edit saved plan</Button>
        </section>}
        <details className={styles.section}>
          <summary>Creator context & learnings (optional)</summary>
          {context.length === 0 && !profile.communicationStyle ? <p className={styles.muted}>No saved onboarding context yet.</p> : <>
            <p className={styles.muted}>Saved onboarding notes, not inferred or approved brand guidance.</p>
            {profile.communicationStyle && <p>{profile.communicationStyle}</p>}
            <dl className={styles.summary}>{context.map(([dimension, value]) => <div key={dimension}><dt>{dimension}</dt><dd>{value}</dd></div>)}</dl>
          </>}
          {workspace.feedback.length === 0 ? <p className={styles.muted}>No creator-confirmed learnings yet.</p> : workspace.feedback.map((feedback) => <div className={styles.learning} key={feedback.postId}>
            <p>Creator-Confirmed: {feedback.learning}</p>
            <Button type="button" variant="outline" onClick={() => { setDraft((previous) => ({ ...previous, angle: feedback.learning })); setNotice("Saved learning added to your angle. Review it before saving."); }}>Use learning</Button>
          </div>)}
        </details>
      </div>
    </div>
  </div>;
}