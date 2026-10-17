import Link from "next/link";
import { SurfaceCard } from "@/components/ui/surface-card";
import { APP_ROUTES } from "@/lib/routes";

const creationPaths = [
  {
    title: "Create With Me",
    label: "A little guidance. A lot of you.",
    description: "Turn your idea into a post, one focused step at a time.",
    points: ["Start with a clear goal", "Keep your decisions together", "Pick up where you paused"],
    accent: "violet",
    icon: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
    availability: "Guided creation is coming next.",
  },
  {
    title: "Quick Draft",
    label: "Find your starting point.",
    description: "A shorter path from a spark of an idea to a first draft.",
    points: ["Bring a simple idea", "Build on your brand voice", "Make the words your own"],
    accent: "blue",
    icon: "M13 3 5 14h6l-1 7 9-12h-6l1-6Z",
    availability: "This shortcut isn’t available yet.",
  },
  {
    title: "Bring Something In",
    label: "Start with what you have.",
    description: "A place for the ideas and material you don’t want to lose.",
    points: ["An idea worth keeping", "Something you’ve already made", "A new starting point"],
    accent: "rose",
    icon: "M8 18H6a4 4 0 0 1-1-7.9 7 7 0 0 1 13.6-1A4.5 4.5 0 0 1 18 18h-2M12 21V11m-4 4 4-4 4 4",
    availability: "Import and uploads are planned.",
  },
] as const;

function ContinueWork() {
  return (
    <section aria-labelledby="continue-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="luxe-section-title" id="continue-heading">Continue where you left off</h2>
        <span className="luxe-form-help">One post. One home. One next step.</span>
      </div>
      <SurfaceCard className="luxe-resume-empty flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8" padding="none">
        <div className="luxe-empty-icon shrink-0" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M4 6h6l2 2h8v12H4Z" /><path d="M9 14h6m-3-3v6" /></svg>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="luxe-section-title">Your next idea deserves a place to land.</h3>
          <p className="luxe-form-help max-w-xl">Saved-post resume is coming next. This space will bring your goal, decisions and next step back together. No saved posts are displayed in this preview.</p>
        </div>
        <span className="luxe-availability shrink-0">Coming next</span>
      </SurfaceCard>
    </section>
  );
}

export function CreatorHome() {
  return (
    <div className="luxe-creator-home space-y-10">
      <header className="space-y-4">
        <p className="luxe-eyebrow flex items-center gap-3"><span className="luxe-heading-line" aria-hidden />Creator / CEO</p>
        <h1 className="luxe-workspace-title">What are we creating today?<span className="luxe-title-spark" aria-hidden>✦</span></h1>
        <p className="luxe-page-description">A little less friction. A little more creative flow.<br className="sm:hidden" /> Choose your way in.</p>
      </header>

      <section aria-label="Ways to create" className="grid gap-4 md:grid-cols-3 lg:gap-5">
        {creationPaths.map((path) => (
          <SurfaceCard className={`luxe-creation-card luxe-creation-card--${path.accent} flex min-w-0 flex-col gap-5 p-6`} padding="none" key={path.title} aria-label={path.title}>
            <div className="flex items-start justify-between gap-3">
              <span className="luxe-creation-icon" aria-hidden><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"><path d={path.icon} /></svg></span>
              <span className="luxe-availability">{path.accent === "rose" ? "Planned" : "Coming next"}</span>
            </div>
            <div className="space-y-2">
              <p className="luxe-card-kicker">{path.label}</p>
              <h2 className="luxe-creation-title">{path.title}</h2>
              <p className="luxe-card-description">{path.description}</p>
            </div>
            <ul className="luxe-creation-points space-y-2" aria-label="Planned workflow">
              {path.points.map((point) => <li className="flex items-center gap-2" key={point}><span aria-hidden>↗</span>{point}</li>)}
            </ul>
            <div className="mt-auto space-y-3 pt-2">
              <button className="luxe-creation-action luxe-focus-ring flex min-h-11 w-full items-center justify-between gap-2 px-4 py-3" disabled type="button" aria-describedby={`availability-${path.accent}`}>{path.title}<span aria-hidden>→</span></button>
              <p id={`availability-${path.accent}`} className="luxe-form-help">{path.availability}</p>
            </div>
          </SurfaceCard>
        ))}
      </section>

      <ContinueWork />

      <section aria-labelledby="voice-heading" className="luxe-voice-shortcut flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="luxe-voice-mark" aria-hidden>✦</span>
          <div className="space-y-1"><h2 id="voice-heading" className="luxe-section-title">Make it sound like you.</h2><p className="luxe-form-help">Your existing Brand Voice tools are ready to explore.</p></div>
        </div>
        <Link className="luxe-secondary-action luxe-focus-ring flex min-h-11 shrink-0 items-center gap-5 px-5 py-3 text-sm" href={APP_ROUTES.brandVoice}>Open Brand Voice <span aria-hidden>↗</span></Link>
      </section>
      <p className="luxe-preview-note">Internal alpha · New creation paths are in progress. Existing tools remain available in navigation.</p>
    </div>
  );
}
