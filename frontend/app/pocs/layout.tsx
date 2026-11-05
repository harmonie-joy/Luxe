"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import "./sandbox.css";

export default function SandboxLayout({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={`luxe-pocs${isDark ? " dark" : ""}`}>
      <a className="luxe-pocs-skip" href="#sandbox-main">Skip to gallery</a>
      <header className="luxe-pocs-header">
        <Badge className="luxe-pocs-title">⚡ DESIGN SYSTEM PLAYGROUND</Badge>
        <nav aria-label="Sandbox pages" className="luxe-pocs-nav">
          <Link href="/pocs/welcome">Welcome / Home</Link>
          <Link href="/pocs/components">Components</Link>
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
        <div className="luxe-pocs-content">{children}</div>
      </main>
    </div>
  );
}