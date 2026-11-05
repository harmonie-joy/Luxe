"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StageFlowNavigation } from "@/app/pocs/components/stage-flow-navigation";
import { StageFlowFooter } from "@/app/pocs/components/stage-flow-footer";
import { completeStageFlowStep } from "@/app/pocs/components/stage-flow-state";
import { APP_ROUTES } from "@/lib/routes";
import { mockWelcomeHome } from "@/lib/mock-data/pocs-data";
import styles from "./page.module.css";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <StageFlowNavigation currentStep="welcome" />
      <section aria-labelledby="welcome-title" className={styles.hero}>
        <div className={styles.topline}>
          <span aria-hidden="true" className={styles.wordmark}>{mockWelcomeHome.title}</span>
          <Button onClick={() => router.push(APP_ROUTES.login)} size="sm" type="button" variant="outline">
            Login
          </Button>
        </div>

        <div className={styles.intro}>
          <span aria-hidden="true" className={styles.sparkle}>✧</span>
          <p className={styles.welcome}>Welcome to</p>
          <h1 className={`${styles.title} stage-flow-title`} id="welcome-title">{mockWelcomeHome.title}</h1>
          <p className={`${styles.subtitle} stage-flow-caption`}>{mockWelcomeHome.subtitle}</p>
          <p className={`${styles.supportingLine} stage-flow-caption`}>{mockWelcomeHome.supportingLine}</p>
          <div className={styles.actions}>
            <Button
              className={styles.startButton}
              onClick={() => {
                completeStageFlowStep("welcome");
                router.push(APP_ROUTES.pocsDiscoverMe);
              }}
              size="lg"
              type="button"
            >
              Get Started
              <span aria-hidden="true">→</span>
            </Button>
            <a className={styles.exploreButton} href="#welcome-features">
              Explore the Space <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <section aria-label="Workspace benefits" className={styles.features} id="welcome-features">
          {mockWelcomeHome.features.map((feature) => (
            <Card aria-label={feature.title} className={styles.feature} key={feature.id} padding="sm">
              <span aria-hidden="true" className={styles.featureIcon}>{feature.icon}</span>
              <span className={styles.featureTitle}>{feature.title}</span>
              <span className={styles.featureDescription}>{feature.description}</span>
            </Card>
          ))}
        </section>
      </section>
      <StageFlowFooter
        backHref={APP_ROUTES.home}
        completeStep="welcome"
        nextHref={APP_ROUTES.pocsDiscoverMe}
        nextLabel="Get Started"
      />
    </div>
  );
}