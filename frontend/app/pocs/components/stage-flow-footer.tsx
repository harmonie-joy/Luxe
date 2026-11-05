"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { completeStageFlowStep } from "./stage-flow-state";
import styles from "./stage-flow.module.css";

interface StageFlowFooterProps {
  backHref: string;
  nextHref: string;
  nextLabel: string;
  nextDisabled?: boolean;
  nextHint?: string;
  completeStep?: string;
}

export function StageFlowFooter({
  backHref,
  nextHref,
  nextLabel,
  nextDisabled = false,
  nextHint,
  completeStep,
}: StageFlowFooterProps) {
  const router = useRouter();

  return (
    <Card aria-label="Wizard actions" className={styles.footer} padding="md">
      <Button onClick={() => router.push(backHref)} type="button" variant="outline">
        <span aria-hidden="true">←</span> Back
      </Button>
      <div className={styles.footerActions}>
        {nextDisabled && nextHint && <p className={styles.footerHint} role="status">{nextHint}</p>}
        <Button
          disabled={nextDisabled}
          onClick={() => {
            if (completeStep) completeStageFlowStep(completeStep);
            router.push(nextHref);
          }}
          type="button"
        >
          {nextLabel} <span aria-hidden="true">→</span>
        </Button>
      </div>
    </Card>
  );
}