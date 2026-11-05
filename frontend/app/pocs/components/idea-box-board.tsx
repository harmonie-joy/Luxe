"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/input";
import type { IdeaBoxIdea, IdeaCategory, IdeaStage } from "@/lib/mock-data/pocs-data";
import styles from "./idea-box-board.module.css";

const categories: readonly (IdeaCategory | "All")[] = ["All", "Storytelling", "Content series", "Creative practice", "Business"];

interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface IdeaBoxBoardProps {
  initialIdeas: readonly IdeaBoxIdea[];
}

export function IdeaBoxBoard({ initialIdeas }: IdeaBoxBoardProps) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<IdeaCategory>("Storytelling");
  const [filter, setFilter] = useState<IdeaCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("Preview only. Nothing here is saved to your workspace.");
  const [selectedIdea, setSelectedIdea] = useState<IdeaBoxIdea | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [draggingIdeaId, setDraggingIdeaId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const filteredIdeas = ideas.filter((idea) => {
    const matchesCategory = filter === "All" || idea.category === filter;
    const searchable = `${idea.title} ${idea.note} ${idea.category} ${idea.tags.join(" ")}`.toLowerCase();
    return matchesCategory && searchable.includes(query.trim().toLowerCase());
  });
  const inboxIdeas = filteredIdeas.filter((idea) => idea.stage === "idea");
  const draftingIdeas = filteredIdeas.filter((idea) => idea.stage === "drafting");

  function captureIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = draft.trim();
    if (!note) return;

    const timestamp = new Date().toISOString();
    const title = note.split("\n")[0].slice(0, 72) || "Untitled idea";
    const idea: IdeaBoxIdea = {
      id: `idea-local-${Date.now()}`,
      workspaceId: "workspace-sample-001",
      createdAt: timestamp,
      updatedAt: timestamp,
      title,
      note,
      category,
      tags: [],
      stage: "idea",
      storyboard: ["The spark", "The useful detail", "A next question"],
    };
    setIdeas((current) => [idea, ...current]);
    setDraft("");
    setFilter("All");
    setQuery("");
    setNotice("Idea captured in this preview. Not saved.");
  }

  function toggleVoiceCapture() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      setNotice("Voice capture stopped. Review the transcript before capturing.");
      return;
    }

    const browserWindow = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice("Voice transcription is not supported here. Type your idea instead.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setDraft((current) => `${current}${current.trim() ? " " : ""}${transcript}`);
      setNotice("Transcript added to this preview. Review before capturing. Nothing here is saved.");
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setNotice("Voice capture was interrupted. You can keep typing.");
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    setNotice("Listening with your browser's speech service. Audio handling depends on its privacy settings.");
    recognition.start();
  }

  function moveIdea(ideaId: string, stage: IdeaStage) {
    const idea = ideas.find((item) => item.id === ideaId);
    if (!idea || idea.stage === stage) return;
    setIdeas((current) => current.map((item) => item.id === ideaId ? { ...item, stage, updatedAt: new Date().toISOString() } : item));
    setNotice(stage === "drafting"
      ? "Moved into the local drafting preview. No project was created or saved."
      : "Returned to the local idea inbox. Nothing was saved.");
  }

  function dropIdea(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const ideaId = event.dataTransfer.getData("text/plain") || draggingIdeaId;
    if (ideaId) moveIdea(ideaId, "drafting");
    setDraggingIdeaId(null);
  }

  function renderIdea(idea: IdeaBoxIdea, stage: IdeaStage) {
    const toneClass = {
      Storytelling: styles.storytelling,
      "Content series": styles.contentSeries,
      "Creative practice": styles.creativePractice,
      Business: styles.business,
    }[idea.category];

    return (
      <Card
        aria-label={idea.title}
        className={`${styles.note} ${toneClass}`}
        draggable={stage === "idea"}
        key={idea.id}
        onDragEnd={() => setDraggingIdeaId(null)}
        onDragStart={(event) => {
          setDraggingIdeaId(idea.id);
          event.dataTransfer.setData("text/plain", idea.id);
          event.dataTransfer.effectAllowed = "move";
        }}
        onDoubleClick={() => setSelectedIdea(idea)}
        role="article"
      >
        <div className={styles.noteTopline}>
          <Badge variant="neutral">{idea.category}</Badge>
          <time dateTime={idea.updatedAt}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(idea.updatedAt))}</time>
        </div>
        <h3>{idea.title}</h3>
        <p>{idea.note}</p>
        <ul aria-label={`${idea.title} tags`} className={styles.tags}>
          {idea.tags.map((tag) => <li key={tag}>{tag}</li>)}
          {idea.tags.length === 0 && <li>Quick capture</li>}
        </ul>
        <div className={styles.noteActions}>
          <Button aria-label={`Open storyboard for ${idea.title}`} onClick={() => setSelectedIdea(idea)} size="sm" variant="ghost">
            View storyboard <span aria-hidden="true">↗</span>
          </Button>
          {stage === "idea" ? (
            <Button aria-label={`Move ${idea.title} to pipeline`} onClick={() => moveIdea(idea.id, "drafting")} size="sm" variant="outline">
              Move to pipeline
            </Button>
          ) : (
            <Button aria-label={`Return ${idea.title} to inbox`} onClick={() => moveIdea(idea.id, "idea")} size="sm" variant="outline">
              Return to inbox
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className={styles.ideaBox}>
      <header className={styles.header}>
        <div>
          <p className="luxe-eyebrow">PAGE 13 · IDEA BOX</p>
          <h1 className="luxe-page-title">Keep the spark.</h1>
          <p className="luxe-page-description">A home for the thoughts worth coming back to.</p>
        </div>
        <Badge variant="neutral">Interactive preview · not saved</Badge>
      </header>

      <form className={styles.capture} onSubmit={captureIdea}>
        <div className={styles.captureMark} aria-hidden="true">✳</div>
        <label className={styles.captureField}>
          <span>Catch it before it goes</span>
          <textarea
            aria-label="Capture an idea"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="A thought, a question, a moment..."
            rows={2}
            value={draft}
          />
        </label>
        <div className={styles.captureControls}>
          <label className={styles.categoryField}>
            <span>Category</span>
            <Select aria-label="Idea category" onChange={(event) => setCategory(event.target.value as IdeaCategory)} value={category}>
              {categories.filter((item): item is IdeaCategory => item !== "All").map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </label>
          <Button aria-pressed={isListening} onClick={toggleVoiceCapture} type="button" variant="outline">
            <span aria-hidden="true">{isListening ? "■" : "◖"}</span> {isListening ? "Stop voice note" : "Voice note"}
          </Button>
          <Button disabled={!draft.trim()} type="submit" variant="primary">
            Capture idea <span aria-hidden="true">↗</span>
          </Button>
        </div>
      </form>

      <div className={styles.toolbar}>
        <div aria-label="Filter by idea category" className={styles.filters} role="group">
          {categories.map((item) => (
            <Button aria-pressed={filter === item} key={item} onClick={() => setFilter(item)} size="sm" variant={filter === item ? "secondary" : "ghost"}>
              {item}<span className={styles.filterCount}>{item === "All" ? ideas.length : ideas.filter((idea) => idea.category === item).length}</span>
            </Button>
          ))}
        </div>
        <label className={styles.search}>
          <span className="sr-only">Search ideas</span>
          <SearchInput aria-label="Search ideas" onChange={(event) => setQuery(event.target.value)} placeholder="Search your ideas" value={query} />
        </label>
      </div>

      <p className={styles.notice} role="status">{notice}</p>

      <div className={styles.board}>
        <section
          aria-label="Idea inbox"
          className={`${styles.lane} ${styles.inboxLane}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const ideaId = event.dataTransfer.getData("text/plain") || draggingIdeaId;
            if (ideaId) moveIdea(ideaId, "idea");
            setDraggingIdeaId(null);
          }}
          role="region"
        >
          <div className={styles.laneHeading}>
            <div><span className={styles.laneSymbol} aria-hidden="true">✳</span><h2>Idea inbox</h2></div>
            <Badge variant="neutral">{inboxIdeas.length} ideas</Badge>
          </div>
          <p className={styles.laneHint}>Loose thoughts, ready when you are.</p>
          <div className={styles.canvas}>
            {inboxIdeas.map((idea) => renderIdea(idea, "idea"))}
            {inboxIdeas.length === 0 && <p className={styles.empty}>Nothing here matches yet. Try another search or category.</p>}
          </div>
        </section>

        <section
          aria-label="In motion"
          className={`${styles.lane} ${styles.pipelineLane} ${draggingIdeaId ? styles.dropTarget : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={dropIdea}
          role="region"
        >
          <div className={styles.laneHeading}>
            <div><span className={styles.pipelineSymbol} aria-hidden="true">↗</span><h2>In motion</h2></div>
            <Badge variant="pending">{draftingIdeas.length} shaping</Badge>
          </div>
          <p className={styles.laneHint}>Drag a thought here when you’re ready to shape it.</p>
          <div className={styles.pipelineList}>
            {draftingIdeas.map((idea) => renderIdea(idea, "drafting"))}
            {draftingIdeas.length === 0 && <p className={styles.dropHint}>Drop an idea here to move it into the local drafting preview.</p>}
          </div>
        </section>
      </div>

      {selectedIdea && (
        <div
          aria-label={`${selectedIdea.title} storyboard`}
          aria-modal="true"
          className={styles.storyboardBackdrop}
          onClick={(event) => { if (event.target === event.currentTarget) setSelectedIdea(null); }}
          role="dialog"
        >
          <section aria-labelledby="storyboard-title" className={styles.storyboardDialog}>
            <div className={styles.storyboardHeader}>
              <div><p className="luxe-eyebrow">STORYBOARD · PREVIEW</p><h2 id="storyboard-title">{selectedIdea.title}</h2></div>
              <Button aria-label="Close storyboard" onClick={() => setSelectedIdea(null)} size="sm" variant="ghost">×</Button>
            </div>
            <p className={styles.storyboardNote}>{selectedIdea.note}</p>
            <ol className={styles.storyboardBeats}>
              {selectedIdea.storyboard.map((beat, index) => <li key={beat}><span>{String(index + 1).padStart(2, "0")}</span><strong>{beat}</strong></li>)}
            </ol>
            <p className={styles.storyboardFootnote}>A thinking space only. Starting a real project is not connected in this preview.</p>
          </section>
        </div>
      )}
    </div>
  );
}