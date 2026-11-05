"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/input";
import type { BrandGuideData } from "@/lib/mock-data/pocs-data";
import styles from "./brand-guide-prototype.module.css";

export function BrandGuidePrototype({ guide }: { guide: BrandGuideData }) {
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [copyStatus, setCopyStatus] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const chapter = guide.chapters.find((item) => item.id === chapterId);
  const filteredChapters = guide.chapters.filter((item) =>
    `${item.title} ${item.description} ${item.introduction} ${item.rules.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function navigate(id: string | null) {
    setChapterId(id);
    setCopyStatus("");
    headingRef.current?.focus();
  }

  async function copyExample(text: string, title: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${title} copied to clipboard.`);
    } catch {
      setCopyStatus("Copy unavailable. Select the example text to copy it manually.");
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>PAGE 04 / BRAND KIT GUIDE</p>
          <h1 className="stage-flow-title" ref={headingRef} tabIndex={-1}>{chapter ? chapter.title : "Your Brand Guide"}</h1>
          <p className="stage-flow-caption">{chapter ? "Your voice is how your brand comes to life." : "The living playbook for your brand."}</p>
        </div>
        <Badge>Sample playbook</Badge>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.wordmark}><span aria-hidden="true">&#10023;</span> THE LUXE</div>
          <p className={styles.eyebrow}>YOUR PLAYBOOK</p>
          <nav aria-label="Brand guide chapters">
            <Button aria-current={!chapter ? "page" : undefined} onClick={() => navigate(null)} variant={!chapter ? "secondary" : "ghost"} type="button">
              <span aria-hidden="true">&#8962;</span> Overview
            </Button>
            {guide.chapters.map((item, index) => (
              <Button key={item.id} aria-current={item.id === chapterId ? "page" : undefined} onClick={() => navigate(item.id)} variant={item.id === chapterId ? "secondary" : "ghost"} type="button" size="sm">
                <span className={styles.chapterNumber}>{String(index + 1).padStart(2, "0")}</span>{item.title}
              </Button>
            ))}
          </nav>
          <p className={styles.source}>Built from Creator DNA.<br />A reference for everything you share.</p>
        </aside>

        <div className={styles.content}>
          {chapter ? (
            <>
              <Button className={styles.back} onClick={() => navigate(null)} variant="ghost" size="sm" type="button"><span aria-hidden="true">&#8592;</span> Back to Guide</Button>
              <section className={styles.chapterHeader} aria-label="Chapter introduction">
                <div className={styles.chapterEmblem} aria-hidden="true">{String(guide.chapters.indexOf(chapter) + 1).padStart(2, "0")}</div>
                <div><p className={styles.eyebrow}>THE BRAND PLAYBOOK</p><h2>{chapter.title}</h2><p>{chapter.introduction}</p></div>
              </section>
              {chapter.id === "tone" ? (
                <>
                  <section aria-labelledby="pillars-title">
                    <h3 id="pillars-title" className={styles.sectionTitle}>Voice Pillars</h3>
                    <div className={styles.pillars}>
                      {guide.voice.pillars.map((pillar, index) => (
                        <Card className={styles.pillar} key={pillar.title} padding="sm">
                          <span className={styles.pillarIcon} aria-hidden="true">{["\u2727", "\u25ce", "\u2661", "\u25c7"][index]}</span>
                          <h4>{pillar.title}</h4><p>{pillar.description}</p>
                        </Card>
                      ))}
                    </div>
                  </section>
                  <div className={styles.pair}>
                    <Card className={styles.wordPanel} aria-labelledby="use-title"><h3 id="use-title"><span className={styles.positive} aria-hidden="true">&#10003;</span> Words We Use</h3><div className={styles.tags}>{guide.voice.wordsToUse.map((word) => <span key={word}>{word}</span>)}</div></Card>
                    <Card className={styles.wordPanel} aria-labelledby="avoid-title"><h3 id="avoid-title"><span className={styles.negative} aria-hidden="true">&#8856;</span> Words We Avoid</h3><div className={`${styles.tags} ${styles.avoid}`}>{guide.voice.wordsToAvoid.map((word) => <span key={word}>{word}</span>)}</div></Card>
                  </div>
                  <div className={styles.pair}>
                    {guide.voice.examples.map((example) => (
                      <Card className={styles.example} key={example.id} aria-labelledby={`${example.id}-title`}>
                        <h3 id={`${example.id}-title`}>{example.title}</h3>
                        <blockquote className={example.id === "headline" ? styles.headline : undefined}>{example.text}</blockquote>
                        <Button aria-label={`Copy ${example.title}`} title={`Copy ${example.title}`} onClick={() => copyExample(example.text, example.title)} variant="outline" size="sm" type="button"><span aria-hidden="true">&#10697;</span> Copy</Button>
                      </Card>
                    ))}
                  </div>
                  <section className={styles.confidence} aria-labelledby="interpretation-title">
                    <div><h3 id="interpretation-title"><span aria-hidden="true">&#10023;</span> AI Interpretation</h3><p>{guide.voice.interpretation}</p></div>
                    <div className={styles.meter}><label htmlFor="voice-confidence">AI Confidence Match <span>Sample score</span></label><div><strong>{guide.voice.confidence}%</strong><progress id="voice-confidence" value={guide.voice.confidence} max={100}>{guide.voice.confidence}%</progress></div></div>
                  </section>
                </>
              ) : null}
              <section className={styles.rules} aria-labelledby="rules-title"><h3 id="rules-title">{chapter.id === "tone" ? "Voice in Practice" : "Brand Rules"}</h3><ul>{chapter.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul></section>
            </>
          ) : (
            <>
              <SearchInput aria-label="Search the brand guide" placeholder="Search the brand guide..." value={query} onChange={(event) => setQuery(event.target.value)} />
              <section className={styles.intro} aria-labelledby="intro-title">
                <div><span className={styles.bookIcon} aria-hidden="true">&#9707;</span><h2 id="intro-title">This is your brand&apos;s playbook.</h2><p>Everything here is built from your Creator DNA<br />and evolves as you grow.</p></div>
                <Image className={styles.editorialImage} src="/pocs/brand-guide-editorial.jpg" alt="A hand holding a curated stack of books" width={600} height={400} priority unoptimized />
              </section>
              <section aria-labelledby="chapters-title">
                <div className={styles.sectionHeading}><h2 id="chapters-title">Brand Guide Chapters</h2><div className={styles.viewToggle} role="group" aria-label="Chapter layout"><Button aria-label="Grid view" title="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")} variant={view === "grid" ? "secondary" : "ghost"} size="sm" type="button"><span aria-hidden="true">&#9638;</span></Button><Button aria-label="List view" title="List view" aria-pressed={view === "list"} onClick={() => setView("list")} variant={view === "list" ? "secondary" : "ghost"} size="sm" type="button"><span aria-hidden="true">&#9776;</span></Button></div></div>
                <div className={view === "grid" ? styles.chapterGrid : styles.chapterList}>
                  {filteredChapters.map((item) => (
                    <Card className={`${styles.chapterCard} ${item.id === "tone" ? styles.featured : ""}`} key={item.id} padding="none">
                      <button onClick={() => navigate(item.id)} type="button" aria-label={`Open ${item.title}`}>
                        <span className={styles.cardTop}><span>{String(guide.chapters.indexOf(item) + 1).padStart(2, "0")}</span><span aria-hidden="true">&#8599;</span></span>
                        <h3>{item.title}</h3><p>{item.description}</p>
                        {item.id === "tone" && <span className={styles.continue}>Explore your voice <span aria-hidden="true">&#8594;</span></span>}
                      </button>
                    </Card>
                  ))}
                </div>
                {filteredChapters.length === 0 && <p className={styles.empty} role="status">No chapters match &quot;{query}&quot;. Try another brand rule.</p>}
              </section>
              <footer className={styles.footer}>
                <div><span aria-hidden="true">&#8635;</span><p><strong>Always evolving</strong>Grows with your brand.</p></div>
                <div><span aria-hidden="true">&#10023;</span><p><strong>Built from you</strong>Rooted in your DNA.</p></div>
                <div><span aria-hidden="true">&#9671;</span><p><strong>Easy to apply</strong>Clear rules. Real examples.</p></div>
              </footer>
            </>
          )}
          <p className={styles.copyStatus} role="status">{copyStatus}</p>
        </div>
      </div>
    </div>
  );
}