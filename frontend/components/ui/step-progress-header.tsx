import type { ReactNode } from "react";

export interface StepProgressHeaderProps {
  steps: readonly { id: string; label: ReactNode }[];
  currentStep: number;
  label: string;
  className?: string;
  markCompleted?: boolean;
  completedMarker?: ReactNode;
}

export function StepProgressHeader({ steps, currentStep, label, className, markCompleted = false, completedMarker }: StepProgressHeaderProps) {
  return <ol className={className} aria-label={label}>{steps.map((step, index) => <li key={step.id} aria-current={index === currentStep ? "step" : undefined} data-complete={markCompleted ? index < currentStep : undefined}>
    <span>{markCompleted && index < currentStep && completedMarker !== undefined ? completedMarker : index + 1}</span>{step.label}
  </li>)}</ol>;
}