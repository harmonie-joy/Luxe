"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/routes";
import { useStageFlowProfile } from "./stage-flow-state";
import styles from "./stage-flow.module.css";

const stageSteps = [
  { id: "welcome", label: "Welcome", href: APP_ROUTES.pocsWelcome },
  { id: "discover-me", label: "Discover Me", href: APP_ROUTES.pocsDiscoverMe },
  { id: "creator-dna", label: "Creator DNA", href: APP_ROUTES.pocsCreatorDNA },
  { id: "brand-kit", label: "Brand Kit", href: APP_ROUTES.pocsBrandKit },
  { id: "brand-asset-kit", label: "Brand Asset Kit", href: APP_ROUTES.pocsBrandAssetKit },
] as const;

export type StageStepId = (typeof stageSteps)[number]["id"];

export function StageFlowNavigation({ currentStep }: { currentStep?: StageStepId }) {
  const profile = useStageFlowProfile();

  return (
    <Card aria-label="Stage 1 progress" className={styles.stepper} padding="md">
      <nav aria-label="Stage 1 page flow">
        <ol className={styles.stepList}>
          {stageSteps.map((step, index) => {
            const complete = profile.completedSteps.includes(step.id);
            return (
              <li className={styles.stepItem} key={step.id}>
                <Link
                  aria-current={step.id === currentStep ? "step" : undefined}
                  className={styles.stepLink}
                  data-complete={complete}
                  href={step.href}
                >
                  <span aria-hidden="true" className={styles.stepMarker}>
                    {complete ? "✓" : String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.stepLabel}>{String(index + 1).padStart(2, "0")} {step.label}</span>
                </Link>
                {index < stageSteps.length - 1 && <span aria-hidden="true" className={styles.stepArrow}>→</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      {!currentStep && <p className="stage-flow-caption mt-2">Optional inspiration detour</p>}
    </Card>
  );
}