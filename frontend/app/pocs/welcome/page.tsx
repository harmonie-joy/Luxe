"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/routes";
import { mockWelcomeHome, type WelcomePathId } from "@/lib/mock-data/pocs-data";
import styles from "./page.module.css";

export default function WelcomePage() {
  const router = useRouter();
  const [isInvitationOpen, setIsInvitationOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<WelcomePathId | null>(null);

  return (
    <div className={styles.page}>
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
          <h1 className={styles.title} id="welcome-title">{mockWelcomeHome.title}</h1>
          <p className={styles.subtitle}>{mockWelcomeHome.subtitle}</p>
          <p className={styles.supportingLine}>{mockWelcomeHome.supportingLine}</p>
          <div className={styles.actions}>
            <Button
              aria-controls="welcome-invitation"
              aria-expanded={isInvitationOpen}
              className={styles.startButton}
              onClick={() => setIsInvitationOpen((open) => !open)}
              size="lg"
              type="button"
            >
              {isInvitationOpen ? "Close invitation" : "Get Started"}
              <span aria-hidden="true">→</span>
            </Button>
            <a className={styles.exploreButton} href="#welcome-features">
              Explore the Space <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        {isInvitationOpen && (
          <div aria-labelledby="invitation-title" className={styles.invitation} id="welcome-invitation">
            <p className={styles.invitationPrompt} id="invitation-title">{mockWelcomeHome.invitation}</p>
            <div aria-label="Choose a creative direction" className={styles.paths} role="group">
              {mockWelcomeHome.paths.map((path) => (
                <Button
                  aria-pressed={selectedPath === path.id}
                  key={path.id}
                  onClick={() => setSelectedPath(path.id)}
                  size="sm"
                  type="button"
                  variant={selectedPath === path.id ? "primary" : "outline"}
                >
                  {path.title}
                </Button>
              ))}
            </div>
            <p aria-live="polite" className={styles.pathDescription}>
              {mockWelcomeHome.paths.find((path) => path.id === selectedPath)?.description ?? "Choose the pace that feels right for you."}
            </p>
          </div>
        )}

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
    </div>
  );
}