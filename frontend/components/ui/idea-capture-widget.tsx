"use client";

import { useId, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { capturePocIdea } from "@/lib/state/poc-workspace-state";

export interface IdeaCaptureWidgetProps {
  className?: string;
  title?: string;
  onCaptured?: (id: string) => void;
}

export function IdeaCaptureWidget({ className = "", title = "Capture an idea", onCaptured }: IdeaCaptureWidgetProps) {
  const inputId = useId();
  const [text, setText] = useState("");
  const [voicePreview, setVoicePreview] = useState(false);
  const [notice, setNotice] = useState("Browser-local prototype. No audio is recorded.");

  return <section className={`luxe-pocs-stack ${className}`} aria-label={title}>
    <h2>{title}</h2>
    <form className="luxe-pocs-row" onSubmit={(event) => {
      event.preventDefault();
      const id = capturePocIdea(text);
      if (!id) { setNotice("Could not save this idea in your browser. Your text is still here."); return; }
      setText("");
      setNotice("Idea saved in this browser's Ideas Inbox.");
      onCaptured?.(id);
    }}>
      <label className="luxe-pocs-field flex-1" htmlFor={inputId}>Idea note
        <Input id={inputId} required value={text} onChange={(event) => setText(event.target.value)} placeholder="A thought, reference, or link..." />
      </label>
      <Button type="submit" disabled={!text.trim()}>Capture idea</Button>
      <Button type="button" variant="outline" aria-pressed={voicePreview} onClick={() => {
        setVoicePreview((current) => !current);
        setNotice(voicePreview ? "Voice preview stopped. No audio was recorded." : "Voice preview selected. Microphone and audio are not used.");
      }}>{voicePreview ? "Stop preview" : "Voice preview"}</Button>
    </form>
    <p className="luxe-pocs-muted" role="status">{notice}</p>
  </section>;
}