"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/routes";
import { StageProvider } from "@/lib/state/stage-context";
import "./sandbox.css";

export default function SandboxLayout({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={`luxe-pocs${isDark ? " dark" : ""}`}>
      <a className="luxe-pocs-skip" href="#sandbox-main">Skip to gallery</a>
      <header className="luxe-pocs-header">
        <Badge className="luxe-pocs-title">⚡ DESIGN SYSTEM PLAYGROUND</Badge>
        <nav aria-label="Sandbox pages" className="luxe-pocs-nav">
          <Link href={APP_ROUTES.pocsWelcome}>Welcome / Home</Link>
          <Link href={APP_ROUTES.pocsDiscoverMe}>Discover Me</Link>
          <Link href="/pocs/components">Components</Link>
          <Link href={APP_ROUTES.pocsCreatorDNA}>Creator DNA</Link>
          <Link href={APP_ROUTES.pocsBrandKit}>Brand Kit</Link>
          <Link href={APP_ROUTES.pocsBrandAssetKit}>Brand Asset Kit</Link>
          <Link href={APP_ROUTES.pocsImportWorld}>Import My World</Link>
          <Link href={APP_ROUTES.pocsTornadoWorkspace}>Tornado Workspace</Link>
          <Link href={APP_ROUTES.pocsContentWorkspace}>Content Workspace</Link>
          <Link href={APP_ROUTES.pocsAestheticBoard}>Aesthetic Board</Link>
          <Link href={APP_ROUTES.pocsWebPortal}>Web Content Portal</Link>
          <Link href={APP_ROUTES.pocsSinglePost}>Single-Post Loop</Link>
          <Link href={APP_ROUTES.pocsPostsGallery}>Posts Gallery</Link>
          <Link href={APP_ROUTES.pocsCalendar}>Content Calendar</Link>
          <Link href={APP_ROUTES.pocsIdeaBox}>Idea Box</Link>
          <span aria-disabled="true" title="Coming soon">Layouts</span>
          <span aria-disabled="true" title="Coming soon">Patterns</span>
        </nav>
        <Button
          aria-label="Dark mode"
          aria-pressed={isDark}
          className="luxe-pocs-theme-toggle"
          onClick={() => setIsDark((current) => !current)}
          type="button"
          variant="outline"
        >
          {isDark ? "🌙 Dark" : "☀️ Light"}
        </Button>
      </header>
      <main className="luxe-pocs-main" id="sandbox-main" tabIndex={-1}>
        <div className="luxe-pocs-content"><StageProvider>{children}</StageProvider></div>
      </main>
    </div>
  );
}