"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import { StageFlowNavigation } from "@/app/pocs/components/stage-flow-navigation";
import { useStageContext } from "@/lib/state/stage-context";
import { APP_ROUTES } from "@/lib/routes";
import { mockCreatorDNA, type CreatorDnaDimension } from "@/lib/mock-data/pocs-data";
import styles from "./page.module.css";

export default function CreatorDnaPage() {
  const { profile, saveProfile: saveStageProfile } = useStageContext();
  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummaries, setEditedSummaries] = useState<Record<string, string>>({});
  const dimensions = mockCreatorDNA.dimensions.map((dimension) => {
    const sourceSummary = dimension.id === "north-star"
      ? profile.answers[0]
      : dimension.id === "communication-style"
        ? profile.communicationStyle
        : dimension.id === "voice-tone"
          ? profile.tone
          : undefined;
    return {
      ...dimension,
          summary: editedSummaries[dimension.id] ?? profile.dimensionSummaries[dimension.id] ?? (sourceSummary || dimension.summary),
    };
  });
  const selectedDimension = dimensions.find(
    (dimension) => dimension.id === selectedDimensionId,
  );

  function updateSummary(id: string, summary: string) {
    setEditedSummaries((current) => ({ ...current, [id]: summary }));
  }

  function saveProfile() {
    const communicationStyle = editedSummaries["communication-style"] ?? dimensions.find((dimension) => dimension.id === "communication-style")?.summary ?? "";
    const tone = editedSummaries["voice-tone"] ?? dimensions.find((dimension) => dimension.id === "voice-tone")?.summary ?? "";
    const dimensionSummaries = Object.fromEntries(dimensions.map((dimension) => [dimension.id, dimension.summary]));
    saveStageProfile({ ...profile, communicationStyle, tone, dimensionSummaries });
    setEditedSummaries({});
    setIsEditing(false);
  }

  return (
    <div className={`${styles.page} stage-one-page`}>
      <StageFlowNavigation currentStep="creator-dna" />
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>PAGE 03 <span aria-hidden="true">/</span> YOUR FOUNDATION</p>
          <h1 className="stage-flow-title">{mockCreatorDNA.title}</h1>
          <p className={`${styles.subtitle} stage-flow-caption`}>{mockCreatorDNA.description}</p>
        </div>
        <Button onClick={isEditing ? saveProfile : () => setIsEditing(true)} size="sm" type="button" variant="outline">
          <span aria-hidden="true">{isEditing ? "✓" : "✎"}</span>
          {isEditing ? "Save profile" : "Edit Profile"}
        </Button>
      </header>

      <section aria-label="Profile source" className={styles.sourceBanner}>
        <span aria-hidden="true" className={styles.sourceMark}>✦</span>
        <div>
          <p className={styles.sourceTitle}>A foundation built from what you shared</p>
          <p className={styles.sourceText}>Your profile brings the ideas from {mockCreatorDNA.source} into one reusable place.</p>
        </div>
        <Badge className={styles.sampleBadge}>Sample profile</Badge>
      </section>

      <div className={styles.workspace}>
        <nav aria-label="Creator DNA sections" className={styles.navigation}>
          <p className={styles.navLabel}>YOUR PROFILE</p>
          <Button
            aria-pressed={selectedDimensionId === null}
            className={styles.navButton}
            onClick={() => setSelectedDimensionId(null)}
            size="sm"
            type="button"
            variant={selectedDimensionId === null ? "secondary" : "ghost"}
          >
            <span aria-hidden="true">⌂</span>
            Overview
          </Button>
          {mockCreatorDNA.dimensions.map((dimension) => (
            <Button
              aria-pressed={selectedDimensionId === dimension.id}
              className={styles.navButton}
              key={dimension.id}
              onClick={() => setSelectedDimensionId(dimension.id)}
              size="sm"
              type="button"
              variant={selectedDimensionId === dimension.id ? "secondary" : "ghost"}
            >
              <span aria-hidden="true">{dimension.icon}</span>
              {dimension.title}
            </Button>
          ))}
        </nav>

        <section aria-label="Creator DNA profile" className={styles.content}>
          {selectedDimension ? (
            <section aria-labelledby="dimension-title" className={styles.detailView}>
              <Button
                className={styles.backButton}
                onClick={() => setSelectedDimensionId(null)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <span aria-hidden="true">←</span>
                All dimensions
              </Button>
              <DimensionCard dimension={selectedDimension} onOpen={setSelectedDimensionId} onSummaryChange={updateSummary} editing={isEditing} featured />
            </section>
          ) : (
            <>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>WHO YOU ARE</p>
                  <h2>Identity, made reusable.</h2>
                </div>
                <span className={styles.dimensionCount}>{mockCreatorDNA.dimensions.length} dimensions</span>
              </div>
              <div className={styles.dimensionGrid}>
                {dimensions.map((dimension) => (
                  <DimensionCard
                    dimension={dimension}
                    editing={isEditing}
                    key={dimension.id}
                    onOpen={setSelectedDimensionId}
                    onSummaryChange={updateSummary}
                    featured={dimension.id === "north-star"}
                  />
                ))}
              </div>
              <HealthCheck />
            </>
          )}
        </section>
      </div>

      <StageFlowFooter
        prevRoute={APP_ROUTES.pocsDiscoverMe}
        currentStep={3}
        totalSteps={5}
        completeStep="creator-dna"
        nextRoute={APP_ROUTES.pocsBrandKit}
      />
    </div>
  );
}

function DimensionCard({
  dimension,
  onOpen,
  onSummaryChange,
  editing = false,
  featured = false,
}: {
  dimension: CreatorDnaDimension;
  onOpen: (dimensionId: string) => void;
  onSummaryChange: (dimensionId: string, summary: string) => void;
  editing?: boolean;
  featured?: boolean;
}) {
  return (
    <Card
      aria-labelledby={`${dimension.id}-title`}
      className={`${styles.dimensionCard}${featured ? ` ${styles.featuredCard}` : ""}`}
      padding="md"
    >
      <div className={styles.dimensionTopline}>
        <span aria-hidden="true" className={styles.dimensionIcon}>{dimension.icon}</span>
        <span className={styles.cardIndex}>{String(mockCreatorDNA.dimensions.indexOf(dimension) + 1).padStart(2, "0")}</span>
      </div>
      <h3 id={`${dimension.id}-title`}>{dimension.title}</h3>
      {editing ? (
        <label className="stage-flow-caption mt-2">
          {dimension.title} summary
          <textarea
            aria-label={`${dimension.title} summary`}
            className="luxe-ui-input mt-2 min-h-24 resize-y py-2"
            maxLength={500}
            onChange={(event) => onSummaryChange(dimension.id, event.target.value)}
            value={dimension.summary}
          />
        </label>
      ) : (
        <p className={styles.dimensionSummary}>{dimension.summary}</p>
      )}
      {featured && (
        <ul className={styles.detailList}>
          {dimension.details.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
      )}
      <Button
        className={styles.viewButton}
        onClick={() => onOpen(dimension.id)}
        size="sm"
        type="button"
        variant="ghost"
      >
        View details <span aria-hidden="true">→</span>
      </Button>
    </Card>
  );
}

function HealthCheck() {
  return (
    <Card aria-labelledby="health-title" className={styles.healthCard} padding="md">
      <div className={styles.healthHeader}>
        <span aria-hidden="true" className={styles.healthIcon}>◇</span>
        <div className={styles.healthTitleBlock}>
          <h2 id="health-title">DNA Health Check</h2>
          <p>Your profile is {mockCreatorDNA.health.completion}% complete</p>
        </div>
        <div aria-label={`${mockCreatorDNA.health.completion}% complete`} className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={mockCreatorDNA.health.completion}>
          <span style={{ width: `${mockCreatorDNA.health.completion}%` }} />
        </div>
      </div>
      <ul className={styles.healthSignals}>
        {mockCreatorDNA.health.signals.map((signal) => (
          <li key={signal}><span aria-hidden="true">✓</span>{signal}</li>
        ))}
      </ul>
    </Card>
  );
}
