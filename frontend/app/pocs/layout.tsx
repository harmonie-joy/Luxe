"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardShellLayout } from "@/components/layouts/dashboard-shell-layout";
import { StageFlowFooter } from "@/components/pocs/stage-flow-footer";
import { APP_ROUTES, POC_NAV_ITEMS } from "@/lib/routes";
import { StageProvider } from "@/lib/state/stage-context";
import "./sandbox.css";

export default function SandboxLayout({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();
  const standaloneFlow = [APP_ROUTES.pocsHome, APP_ROUTES.pocsPlan, APP_ROUTES.pocsImpact].some((route) => route === pathname);

  return (
    <DashboardShellLayout
      className={`luxe-pocs${isDark ? " dark" : ""}`}
      mainId="sandbox-main"
      header={<>
      <a className="luxe-pocs-skip" href="#sandbox-main">Skip to content</a>
      <header className="luxe-pocs-header">
        <Link href={APP_ROUTES.pocsHome} className="luxe-pocs-brand">THE LUXE</Link>
        <Badge className="luxe-pocs-title">DESIGN PLAYGROUND</Badge>
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
      </>}
      sidebar={<>
        <nav aria-label="Creator navigation" className="luxe-pocs-primary-nav">
          {POC_NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href || (item.label === "Brand/DNA" && /^\/pocs\/(brand-|creator-dna)/.test(pathname)) ? "page" : undefined}>{item.label}</Link>)}
        </nav>
        <Link href={APP_ROUTES.pocsContentWorkspace} className="luxe-primary-action luxe-pocs-quick-create">+ Quick Create</Link>
        <details className="luxe-pocs-explore"><summary>Screens</summary>
          <nav aria-label="Sandbox pages" className="luxe-pocs-nav">
            <Link href={APP_ROUTES.pocsWelcome}>Welcome</Link>
            <Link href={APP_ROUTES.pocsDiscoverMe}>Discover Me</Link>
            <Link href={APP_ROUTES.pocsCreatorDNA}>Creator DNA</Link>
            <Link href={APP_ROUTES.pocsBrandKit}>Brand Kit</Link>
            <Link href={APP_ROUTES.pocsBrandAssetKit}>Brand Asset Kit</Link>
            <Link href={APP_ROUTES.pocsImportWorld}>Import My World</Link>
            <Link href={APP_ROUTES.pocsTornado}>Tornado</Link>
            <Link href={APP_ROUTES.pocsSinglePost}>Single Post</Link>
            <Link href={APP_ROUTES.pocsWebPortal}>Web Content Portal</Link>
            <Link href={APP_ROUTES.pocsAestheticBoard}>Aesthetic Board</Link>
            <Link href={APP_ROUTES.pocsIdeaBox}>Legacy Idea Canvas</Link>
            <Link href={APP_ROUTES.pocsComponents}>Components</Link>
          </nav>
        </details>
        <details className="luxe-pocs-explore"><summary>Settings</summary><label className="luxe-pocs-row"><input type="checkbox" checked={isDark} onChange={(event) => setIsDark(event.target.checked)} />Dark theme</label></details>
      </>}
      footer={standaloneFlow ? <StageFlowFooter prevRoute={APP_ROUTES.pocsHome} currentStep={1} totalSteps={13} /> : undefined}
    >
      <StageProvider>{children}</StageProvider>
    </DashboardShellLayout>
  );
}