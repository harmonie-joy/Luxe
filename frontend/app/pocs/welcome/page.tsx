"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StageFlowNavigation } from "@/app/pocs/components/stage-flow-navigation";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import { completeStageFlowStep } from "@/app/pocs/components/stage-flow-state";
import { APP_ROUTES } from "@/lib/routes";
import { mockWelcomeHome } from "@/lib/mock-data/pocs-data";
import styles from "./page.module.css";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className={`${styles.page} stage-one-page`}>
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

        <section aria-label="Choose your goal" className="grid gap-6 sm:grid-cols-3 mb-6">
          {mockWelcomeHome.paths.map((path) => (
            <Card key={path.id} padding="none">
              <Button aria-label={path.title} className="stage-flow-feature-action" variant="ghost" type="button" onClick={() => {
                completeStageFlowStep("welcome");
                router.push(APP_ROUTES.pocsDiscoverMe);
              }}>
                <span className="text-text-primary font-bold">{path.title}</span>
                <span className="stage-flow-caption">{path.description}</span>
              </Button>
            </Card>
          ))}
        </section>
        <section aria-label="Workspace benefits" className={styles.features} id="welcome-features">
          {mockWelcomeHome.features.map((feature) => (
            <Card aria-label={feature.title} className={`${styles.feature} bg-bg-surface text-text-primary border-border-subtle`} key={feature.id} padding="none">
              <div className="stage-flow-feature-action">
              <span aria-hidden="true" className={styles.featureIcon}>{feature.icon}</span>
              <span className={styles.featureTitle}>{feature.title}</span>
              <span className={styles.featureDescription}>{feature.description}</span>
              </div>
            </Card>
          ))}
        </section>
      </section>
      <StageFlowFooter
        prevRoute={APP_ROUTES.home}
        currentStep={1}
        totalSteps={5}
        completeStep="welcome"
        nextRoute={APP_ROUTES.pocsDiscoverMe}
      />
    </div>
  );
}