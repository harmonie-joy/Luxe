"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { completeStageFlowStep } from "@/app/pocs/components/stage-flow-state";
import { APP_ROUTES, POC_STAGE_ROUTES } from "@/lib/routes";
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
  const pathname = usePathname();
  const canonicalPath = pathname === APP_ROUTES.pocsTornadoWorkspace ? APP_ROUTES.pocsTornado
    : pathname === "/pocs/brand-assets" ? APP_ROUTES.pocsStageOneBrandAssetKit : pathname;
  const index = POC_STAGE_ROUTES.findIndex((route) => route === canonicalPath);
  const previous = index >= 0 ? POC_STAGE_ROUTES[Math.max(0, index - 1)] : prevRoute;
  const next = index >= 0 ? POC_STAGE_ROUTES[index + 1] : nextRoute;
  const stageLabels = ["Welcome", "Discover Me", "Creator DNA", "Brand Kit", "Brand Asset Kit", "Import My World", "Tornado", "Home", "Plan", "Create", "Single Post", "Library", "Impact"];
  const label = index >= 0 && next !== nextRoute ? `Continue to ${stageLabels[index + 1]}` : nextLabel;
  return (
    <Card aria-label="Wizard actions" className={`${styles.footer} bg-bg-surface text-text-primary border-border-subtle`} padding="md">
      <Button disabled={index === 0} onClick={() => router.push(previous)} type="button" variant="outline">
        <span aria-hidden="true">&#8592;</span> Back
      </Button>
      <p className="stage-flow-caption">Step {index >= 0 ? index + 1 : currentStep} of {index >= 0 ? POC_STAGE_ROUTES.length : totalSteps}</p>
      <div className={styles.footerActions}>
        {nextDisabled && nextHint && <p className={styles.footerHint} role="status">{nextHint}</p>}
        {next && (
          <Button
            disabled={nextDisabled}
            onClick={() => {
              if (completeStep) completeStageFlowStep(completeStep);
              router.push(next);
            }}
            type="button"
          >
            {label} <span aria-hidden="true">&#8594;</span>
          </Button>
        )}
      </div>
    </Card>
  );
}