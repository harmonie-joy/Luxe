"use client";

import type { WorkflowStage } from "@/types/creator";
import type { SnapshotPayload } from "@/lib/api/creator";

export interface CheckpointForm {
  goal: string;
  workflowStage: WorkflowStage;
  nextAction: string;
  decisions: string;
  openQuestions: string;
}

export function checkpointPayload(form: CheckpointForm): SnapshotPayload {
  return { goal: form.goal.trim(), workflow_stage: form.workflowStage, next_action: form.nextAction.trim(), decisions: form.decisions.split("\n").map((s) => s.trim()).filter(Boolean), open_questions: form.openQuestions.split("\n").map((s) => s.trim()).filter(Boolean) };
}

export function checkpointValidation(form: CheckpointForm) {
  const snapshot = checkpointPayload(form);
  if (!snapshot.goal || !snapshot.next_action) return "Enter a content goal and next action.";
  if (snapshot.goal.length > 5000 || snapshot.next_action.length > 500) return "Goal or next action exceeds the supported length.";
  if ([snapshot.decisions, snapshot.open_questions].some((rows) => rows.length > 20 || rows.some((row) => row.length > 500))) return "Use at most 20 decisions and 20 questions, each up to 500 characters.";
  return null;
}

export function CheckpointFields({ value, onChange }: { value: CheckpointForm; onChange: (value: CheckpointForm) => void }) {
  return <div className="min-w-0 space-y-5">
    <label className="luxe-form-label block space-y-2">Content goal<textarea className="luxe-field w-full px-4 py-3" required maxLength={5000} rows={4} value={value.goal} onChange={(e) => onChange({ ...value, goal: e.target.value })} /></label>
    <label className="luxe-form-label block space-y-2">Current stage<select className="luxe-field h-12 w-full px-4" value={value.workflowStage} onChange={(e) => onChange({ ...value, workflowStage: e.target.value as WorkflowStage })}><option value="idea">Idea</option><option value="drafting">Drafting</option></select></label>
    <label className="luxe-form-label block space-y-2">Next action<input className="luxe-field h-12 w-full px-4" required maxLength={500} value={value.nextAction} onChange={(e) => onChange({ ...value, nextAction: e.target.value })} /></label>
    <label className="luxe-form-label block space-y-2">Previous decisions<textarea className="luxe-field w-full px-4 py-3" rows={4} aria-describedby="decision-help" value={value.decisions} onChange={(e) => onChange({ ...value, decisions: e.target.value })} /></label><p id="decision-help" className="luxe-form-help">One decision per line. Up to 20, each up to 500 characters.</p>
    <label className="luxe-form-label block space-y-2">Open questions<textarea className="luxe-field w-full px-4 py-3" rows={4} aria-describedby="question-help" value={value.openQuestions} onChange={(e) => onChange({ ...value, openQuestions: e.target.value })} /></label><p id="question-help" className="luxe-form-help">One question per line. Up to 20, each up to 500 characters.</p>
  </div>;
}
