"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StageFlowFooter } from "@/app/pocs/components/stage-flow-footer";
import { StageFlowNavigation } from "@/app/pocs/components/stage-flow-navigation";
import { saveStageFlowProfile, useStageFlowProfile } from "@/app/pocs/components/stage-flow-state";
import { APP_ROUTES } from "@/lib/routes";
import {
  mockDiscoverMe,
  type ConsultationTab,
  type DiscoverMePath,
  type DiscoverMeScreen,
} from "@/lib/mock-data/pocs-data";
import styles from "./page.module.css";

const screenOrder: readonly DiscoverMeScreen[] = ["choice", "chat", "consultation"];

const screenLabels: Record<DiscoverMeScreen, string> = {
  choice: "Choose your path",
  chat: "Chat experience",
  consultation: "Brand consultation",
};

export default function DiscoverMePage() {
  const profile = useStageFlowProfile();
  const [screen, setScreen] = useState<DiscoverMeScreen>("choice");
  const chatAnswers = profile.answers;
  const chatStep = Math.min(chatAnswers.length, mockDiscoverMe.chat.questions.length - 1);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<ConsultationTab>("notes");
  const [completedAgenda, setCompletedAgenda] = useState<ReadonlySet<string>>(
    new Set(mockDiscoverMe.consultation.agenda.filter((item) => item.complete).map((item) => item.id)),
  );
  const [isCallLive, setIsCallLive] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const currentQuestion = mockDiscoverMe.chat.questions[Math.min(chatStep, mockDiscoverMe.chat.questions.length - 1)];
  const chatComplete = chatAnswers.length === mockDiscoverMe.chat.questions.length;
  const consultationComplete = completedAgenda.size === mockDiscoverMe.consultation.agenda.length;
  const activeScreen = screen === "choice" && chatAnswers.length > 0 ? "chat" : screen;
  const canContinue = (activeScreen === "chat" && chatComplete) || (activeScreen === "consultation" && consultationComplete);

  function choosePath(path: DiscoverMePath) {
    setScreen(path);
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const answer = typedAnswer.trim();
    if (!answer) return;
    setTypedAnswer("");
    saveAnswer(answer);
  }

  function chooseSuggestedAnswer(answer: string) {
    saveAnswer(answer);
  }

  function saveAnswer(answer: string) {
    const answers = [...chatAnswers, answer].slice(0, mockDiscoverMe.chat.questions.length);
    saveStageFlowProfile({
      answers,
      tone: answers[2] ?? "Warm and direct",
      communicationStyle: answers[1] ?? answers[0] ?? "",
      completedSteps: profile.completedSteps,
      dimensionSummaries: profile.dimensionSummaries,
    });
  }

  function toggleAgendaItem(id: string) {
    setCompletedAgenda((items) => {
      const next = new Set(items);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <StageFlowNavigation currentStep="discover-me" />
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>PHASE 1 / CREATOR DNA</p>
          <h1 className="stage-flow-title">{mockDiscoverMe.title}</h1>
        </div>
        <Badge variant="neutral">3-screen prototype</Badge>
      </header>

      <div className={styles.workspace}>
        <aside aria-label="Discover Me screens" className={styles.sidebar}>
          <p className={styles.sidebarLabel}>YOUR JOURNEY</p>
          <ol className={styles.steps}>
            {screenOrder.map((step, index) => (
              <li key={step}>
                <button
                  aria-current={activeScreen === step ? "step" : undefined}
                  className={styles.stepButton}
                  onClick={() => setScreen(step)}
                  type="button"
                >
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <span className={styles.stepCopy}>
                    <strong>{screenLabels[step]}</strong>
                    <small>{step === "choice" ? "Find your starting point" : step === "chat" ? "Share your story" : "Explore your vision"}</small>
                  </span>
                  <span aria-hidden="true" className={styles.stepChevron}>›</span>
                </button>
              </li>
            ))}
          </ol>
          <Card className={styles.privacyCard} padding="sm">
            <span aria-hidden="true" className={styles.privacyIcon}>⌑</span>
            <div>
              <strong>Made for you</strong>
              <p>{mockDiscoverMe.privacyNote}</p>
            </div>
          </Card>
        </aside>

        <main className={styles.stage}>
          {activeScreen === "choice" && (
            <section aria-labelledby="choice-title" className={styles.choiceScreen}>
              <div className={styles.screenHeading}>
                <Badge variant="neutral">SCREEN 1 OF 3</Badge>
                <h2 id="choice-title">Let’s get to know you</h2>
                <p>{mockDiscoverMe.introduction} {mockDiscoverMe.invitation}</p>
              </div>
              <div className={styles.pathGrid}>
                {mockDiscoverMe.paths.map((path) => (
                  <Card className={`${styles.pathCard} ${path.id === "consultation" ? styles.pathCardAlt : ""}`} key={path.id} padding="lg">
                    <span aria-hidden="true" className={styles.pathIcon}>{path.id === "chat" ? "◌" : "▣"}</span>
                    <h3>{path.title}</h3>
                    <p>{path.description}</p>
                    <span className={styles.duration}>{path.duration}</span>
                    <Button className={styles.pathAction} onClick={() => choosePath(path.id)} type="button">
                      {path.action}<span aria-hidden="true"> →</span>
                    </Button>
                  </Card>
                ))}
              </div>
              <div className={styles.choiceFooter}>
                <span aria-hidden="true" className={styles.shield}>✧</span>
                <p>{mockDiscoverMe.privacyNote} <span>You’re in control at every step.</span></p>
              </div>
            </section>
          )}

          {activeScreen === "chat" && (
            <section aria-labelledby="chat-title" className={styles.chatScreen}>
              <div className={styles.screenTopline}>
                <div>
                  <Badge variant="neutral">SCREEN 2 OF 3</Badge>
                  <h2 id="chat-title">A conversation, at your pace</h2>
                  <p>There are no right or wrong answers. Just your story.</p>
                </div>
                <div aria-label={`Journey ${mockDiscoverMe.chat.progress} percent complete`} className={styles.progressRing}>
                  <strong>{mockDiscoverMe.chat.progress}%</strong>
                  <span>journey</span>
                </div>
              </div>

              <div className={styles.chatLayout}>
                <Card className={styles.conversation} padding="md">
                  <div className={styles.messageList} aria-live="polite">
                    {mockDiscoverMe.chat.messages.map((message, index) => (
                      <div className={styles.messageRow} key={`${message.speaker}-${index}`}>
                        <span aria-hidden="true" className={styles.avatarGuide}>L</span>
                        <p className={styles.guideBubble}>{message.text}</p>
                      </div>
                    ))}
                    {chatAnswers.map((answer, index) => (
                      <div className={`${styles.messageRow} ${styles.messageRowCreator}`} key={`${index}-${answer}`}>
                        <p className={styles.creatorBubble}>{answer}</p>
                        <span aria-hidden="true" className={styles.avatarCreator}>M</span>
                      </div>
                    ))}
                    {chatComplete ? (
                      <div aria-live="polite" className={styles.guideBubble}>
                        Your answers are ready to shape your DNA. Selected tone: {chatAnswers[2]}.
                      </div>
                    ) : (
                      <div className={styles.messageRow}>
                        <span aria-hidden="true" className={styles.avatarGuide}>L</span>
                        <p className={styles.guideBubble}>{currentQuestion.prompt}</p>
                      </div>
                    )}
                  </div>
                  {!chatComplete && (
                    <>
                      <div aria-label="Suggested responses" className={styles.answerChoices}>
                        {currentQuestion.answers.map((answer) => (
                          <Button key={answer} onClick={() => chooseSuggestedAnswer(answer)} size="sm" type="button" variant="outline">
                            {answer}
                          </Button>
                        ))}
                      </div>
                      <form className={styles.chatForm} onSubmit={submitAnswer}>
                        <label className={styles.srOnly} htmlFor="chat-answer">Your answer</label>
                        <input
                          id="chat-answer"
                          onChange={(event) => setTypedAnswer(event.target.value)}
                          placeholder={mockDiscoverMe.chat.inputPlaceholder}
                          value={typedAnswer}
                        />
                        <Button aria-label="Send answer" disabled={!typedAnswer.trim()} size="sm" type="submit">↑</Button>
                      </form>
                    </>
                  )}
                </Card>

                <aside className={styles.chatAside}>
                  <Card className={styles.promptCard} padding="md">
                    <span aria-hidden="true" className={styles.asideSpark}>✧</span>
                    <h3>Let’s make this fun</h3>
                    <p>Take a breath, think of a moment when your work felt unmistakably yours.</p>
                    <div aria-hidden="true" className={styles.sparkleLine}><span>✦</span><span>✧</span><span>✦</span></div>
                  </Card>
                  <Card className={styles.voiceCard} padding="md">
                    <div className={styles.voiceHeading}>
                      <div><p className={styles.sidebarLabel}>VOICE PREVIEW</p><h3>{mockDiscoverMe.chat.voiceLabel}</h3></div>
                      <span className={styles.voiceMark} aria-hidden="true">≈</span>
                    </div>
                    <button
                      aria-label={isVoicePlaying ? "Pause voice sample" : "Play voice sample"}
                      aria-pressed={isVoicePlaying}
                      className={`${styles.waveButton} ${isVoicePlaying ? styles.wavePlaying : ""}`}
                      onClick={() => setIsVoicePlaying((playing) => !playing)}
                      type="button"
                    >
                      {Array.from({ length: 31 }, (_, index) => <span key={index} style={{ "--bar": `${((index * 7) % 9) + 3}` } as React.CSSProperties} />)}
                    </button>
                    <p aria-live="polite">{isVoicePlaying ? "Playing a short sample" : mockDiscoverMe.chat.voiceSample}</p>
                  </Card>
                </aside>
              </div>
            </section>
          )}

          {activeScreen === "consultation" && (
            <section aria-labelledby="consultation-title" className={styles.consultScreen}>
              <div className={styles.consultTopline}>
                <div>
                  <Badge variant="neutral">SCREEN 3 OF 3</Badge>
                  <h2 id="consultation-title">Live Brand Consultation</h2>
                </div>
                <div className={styles.callStatus}>
                  <span className={isCallLive ? styles.liveDot : styles.pausedDot} />
                  {isCallLive ? `Call in progress · ${mockDiscoverMe.consultation.duration}` : "Call paused"}
                  <Button onClick={() => setIsCallLive((live) => !live)} size="sm" type="button" variant={isCallLive ? "outline" : "primary"}>
                    {isCallLive ? "End call" : "Resume call"}
                  </Button>
                </div>
              </div>

              <div className={styles.consultLayout}>
                <div className={styles.consultMain}>
                  <div aria-label="Video room mockup" className={styles.videoRoom}>
                    <div className={styles.videoTile}>
                      <div aria-hidden="true" className={styles.portraitMaya}><span>MC</span></div>
                      <span className={styles.videoName}>{mockDiscoverMe.consultation.hostName}<small>{mockDiscoverMe.consultation.hostRole}</small></span>
                    </div>
                    <div className={`${styles.videoTile} ${styles.videoTileYou} ${!isCameraEnabled ? styles.videoTileMuted : ""}`}>
                      <div aria-hidden="true" className={styles.portraitYou}><span>YOU</span></div>
                      <span className={styles.videoName}>{mockDiscoverMe.consultation.creatorName}<small>{!isCallLive ? "Camera paused" : isCameraEnabled ? "Camera on" : "Camera off"}</small></span>
                    </div>
                    <div className={styles.videoControls} aria-label="Call controls">
                      <Button aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"} aria-pressed={isMicMuted} onClick={() => setIsMicMuted((muted) => !muted)} size="sm" type="button" variant="secondary">{isMicMuted ? "×" : "⌁"}</Button>
                      <Button aria-label={isCameraEnabled ? "Turn camera off" : "Turn camera on"} aria-pressed={!isCameraEnabled} onClick={() => setIsCameraEnabled((enabled) => !enabled)} size="sm" type="button" variant="secondary">{isCameraEnabled ? "▣" : "×"}</Button>
                      <Button aria-label={isScreenSharing ? "Stop screen share" : "Start screen share"} aria-pressed={isScreenSharing} onClick={() => setIsScreenSharing((sharing) => !sharing)} size="sm" type="button" variant="secondary">▤</Button>
                    </div>
                    {isScreenSharing && <span className={styles.shareIndicator}>Screen sharing preview</span>}
                    <Badge className={styles.roomBadge} variant={isCallLive ? "active" : "pending"}>
                      {isCallLive ? "LIVE SESSION" : "SESSION PAUSED"}
                    </Badge>
                  </div>

                  <Card className={styles.notesPanel} padding="none">
                    <div aria-label="Consultation workspace tabs" className={styles.tabs} role="tablist">
                      {mockDiscoverMe.consultation.tabs.map((tab) => (
                        <button
                          aria-selected={activeTab === tab.id}
                          className={styles.tab}
                          id={`tab-${tab.id}`}
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          role="tab"
                          type="button"
                        >{tab.label}</button>
                      ))}
                    </div>
                    <div aria-labelledby={`tab-${activeTab}`} className={styles.tabContent} role="tabpanel">
                      {activeTab === "notes" && <ul className={styles.noteList}>{mockDiscoverMe.consultation.notes.map((note) => <li key={note}>{note}</li>)}</ul>}
                      {activeTab === "assistant" && <p>{mockDiscoverMe.consultation.assistant}</p>}
                      {activeTab === "actions" && <ul className={styles.noteList}>{mockDiscoverMe.consultation.actions.map((action) => <li key={action}><label><input type="checkbox" />{action}</label></li>)}</ul>}
                    </div>
                  </Card>
                </div>

                <aside className={styles.agendaPanel}>
                  <Card className={styles.agendaCard} padding="md">
                    <div className={styles.agendaHeading}><div><p className={styles.sidebarLabel}>SESSION AGENDA</p><h3>Today’s conversation</h3></div><Badge variant="neutral">5 topics</Badge></div>
                    <ol className={styles.agendaList}>
                      {mockDiscoverMe.consultation.agenda.map((item) => {
                        const complete = completedAgenda.has(item.id);
                        return (
                          <li key={item.id}>
                            <span className={styles.agendaTime}>{item.time}</span>
                            <button aria-pressed={complete} className={styles.agendaItem} onClick={() => toggleAgendaItem(item.id)} type="button">
                              <span className={complete ? styles.agendaCheckComplete : styles.agendaCheck}>{complete ? "✓" : "○"}</span>
                              <span>{item.title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                    <div className={styles.consultProgress}>
                      <div><span>Creator DNA captured</span><strong>{mockDiscoverMe.consultation.progress}%</strong></div>
                      <span className={styles.progressTrack}><span style={{ width: `${mockDiscoverMe.consultation.progress}%` }} /></span>
                    </div>
                  </Card>
                  <Card className={styles.roomNote} padding="md">
                    <span aria-hidden="true">✦</span>
                    <p>Notes and decisions are captured as you talk, so you can stay in the moment.</p>
                  </Card>
                </aside>
              </div>
            </section>
          )}
        </main>
      </div>
      <StageFlowFooter
        backHref={APP_ROUTES.pocsWelcome}
        completeStep="discover-me"
        nextDisabled={!canContinue}
        nextHint={!canContinue ? "Complete the chat or the consultation agenda to continue." : undefined}
        nextHref={APP_ROUTES.pocsCreatorDNA}
        nextLabel="Save & Generate DNA"
      />
    </div>
  );
}