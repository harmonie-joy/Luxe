"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import type { mockContentWorkspace as ContentWorkspaceData } from "@/lib/mock-data/pocs-data";
import { APP_ROUTES } from "@/lib/routes";
import styles from "../content-workspace/page.module.css";

interface ContentWorkspaceProps {
  data: typeof ContentWorkspaceData;
}

export function ContentWorkspace({ data }: ContentWorkspaceProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [firstItemIndex, setFirstItemIndex] = useState(0);
  const [voiceText, setVoiceText] = useState("");
  const [voicePreview, setVoicePreview] = useState(false);

  const visibleItems = [...data.items.slice(firstItemIndex), ...data.items.slice(0, firstItemIndex)];
  const selectedPathTitle = data.paths.find((path) => path.id === selectedPath)?.title;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>PHASE 1 / BUILD / PAGE 9</p>
          <h1 className={styles.title}>Good morning, {data.creatorName}.</h1>
          <p className={styles.subtitle}>What are we creating today?</p>
        </div>
        <Badge className={styles.previewBadge} variant="neutral">Preview · synthetic data</Badge>
      </header>

      <section aria-labelledby="creation-title" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>START WITH WHAT YOU HAVE</p>
            <h2 id="creation-title">Choose a way in.</h2>
          </div>
          <p className={styles.sectionHint}>One idea is enough to begin.</p>
        </div>
        <div className={styles.pathGrid}>
          {data.paths.map((path, index) => (
            <Card className={`${styles.pathCard} ${styles[path.accent]}`} key={path.id} padding="none">
              <div className={styles.pathTopline}>
                <span aria-hidden="true" className={styles.pathIcon}>{path.icon}</span>
                <span className={styles.pathNumber}>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className={styles.pathCopy}>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <ul>
                  {path.details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              </div>
              <Button
                className={styles.pathAction}
                onClick={() => setSelectedPath(path.id)}
                type="button"
                variant={path.id === "guided" ? "primary" : "outline"}
              >
                {path.action}<span aria-hidden="true">→</span>
              </Button>
            </Card>
          ))}
        </div>
        <p aria-live="polite" className={styles.feedback}>
          {selectedPathTitle
            ? `${selectedPathTitle} is a visual preview. This action does not create, import, or save content.`
            : "Choose a path to preview it. No content is created or uploaded here."}
        </p>
      </section>

      <section aria-labelledby="continue-title" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>YOUR WORK, RIGHT WHERE YOU LEFT IT</p>
            <h2 id="continue-title">Continue where you left off.</h2>
          </div>
          <div className={styles.carouselControls}>
            <span className={styles.carouselCount}>{String(firstItemIndex + 1).padStart(2, "0")} / {String(data.items.length).padStart(2, "0")}</span>
            <Button
              aria-label="Show previous saved items"
              className={styles.carouselButton}
              onClick={() => setFirstItemIndex((index) => (index - 1 + data.items.length) % data.items.length)}
              type="button"
              variant="icon"
            >←</Button>
            <Button
              aria-label="Show next saved items"
              className={styles.carouselButton}
              onClick={() => setFirstItemIndex((index) => (index + 1) % data.items.length)}
              type="button"
              variant="icon"
            >→</Button>
          </div>
        </div>
        <div aria-label="Saved work preview" className={styles.itemGrid} role="list">
          {visibleItems.map((item, index) => (
            <Card className={styles.itemCard} key={item.id} padding="none" role="listitem">
              <div className={styles.itemImage}>
                <Image alt={item.imageAlt} fill priority={index === 0} sizes="(max-width: 700px) 82vw, (max-width: 1000px) 45vw, 30vw" src={item.image} />
                <span className={styles.channel}>{item.channel}</span>
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemMeta}>
                  <Badge variant={item.status === "Scheduled" ? "active" : "pending"}>{item.status}</Badge>
                  <span>{item.updatedLabel}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.nextAction}</p>
                <Button className={styles.resumeButton} onClick={() => setSelectedPath("guided")} type="button" variant="ghost">
                  Continue <span aria-hidden="true">→</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="voice-title" className={styles.voiceSection}>
        <div className={styles.voiceMark} aria-hidden="true">✦</div>
        <div className={styles.voicePrompt}>
          <h2 id="voice-title">Capture an idea as it arrives.</h2>
          <p>Type a thought or try the voice preview. Nothing is recorded or saved.</p>
        </div>
        <div className={styles.voiceControls}>
          <Input
            aria-label="Idea note"
            onChange={(event) => setVoiceText(event.target.value)}
            placeholder="Tell me about your idea..."
            value={voiceText}
          />
          <Button
            aria-pressed={voicePreview}
            className={styles.voiceButton}
            onClick={() => setVoicePreview((active) => !active)}
            type="button"
            variant="primary"
          >
            <span aria-hidden="true">◉</span>{voicePreview ? "Stop preview" : "Voice preview"}
          </Button>
        </div>
        <p aria-live="polite" className={styles.voiceStatus}>
          {voicePreview ? "Voice preview selected. Microphone and audio are not used." : voiceText ? "Draft note held in this page only." : "Preview only · no microphone access"}
        </p>
      </section>
      <StageFlowFooter
        currentStep={3}
        nextLabel="Open Single-Post Preview"
        nextRoute={APP_ROUTES.pocsSinglePost}
        prevRoute={APP_ROUTES.pocsTornadoWorkspace}
        totalSteps={5}
      />
    </div>
  );
}