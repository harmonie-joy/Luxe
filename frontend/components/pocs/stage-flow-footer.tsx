"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { completeStageFlowStep } from "@/app/pocs/components/stage-flow-state";
import styles from "@/app/pocs/components/stage-flow.module.css";

interface StageFlowFooterProps {
  prevRoute: string;
  nextRoute?: string;
  currentStep: number;
  totalSteps: number;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextHint?: string;
  completeStep?: string;
}

export function StageFlowFooter({
  prevRoute,
  nextRoute,
  currentStep,
  totalSteps,
  nextLabel = "Continue",
  nextDisabled = false,
  nextHint,
  completeStep,
}: StageFlowFooterProps) {
  const router = useRouter();
  return (
    <Card aria-label="Wizard actions" className={`${styles.footer} bg-bg-surface text-text-primary border-border-subtle`} padding="md">
      <Button onClick={() => router.push(prevRoute)} type="button" variant="outline">
        <span aria-hidden="true">&#8592;</span> Back
      </Button>
      <p className="stage-flow-caption">Step {currentStep} of {totalSteps}</p>
      <div className={styles.footerActions}>
        {nextDisabled && nextHint && <p className={styles.footerHint} role="status">{nextHint}</p>}
        {nextRoute && (
          <Button
            disabled={nextDisabled}
            onClick={() => {
              if (completeStep) completeStageFlowStep(completeStep);
              router.push(nextRoute);
            }}
            type="button"
          >
            {nextLabel} <span aria-hidden="true">&#8594;</span>
          </Button>
        )}
      </div>
    </Card>
  );
}