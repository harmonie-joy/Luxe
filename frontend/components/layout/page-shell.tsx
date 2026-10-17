"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getSession } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http-client";
import { APP_ROUTES } from "@/lib/routes";
import type { AuthSession } from "@/types/auth";

interface PageShellProps {
  children: ReactNode;
}

type SessionResult = { pathname: string } & (
  { session: AuthSession; error?: never } |
  { error: "signin" | "unavailable"; session?: never }
);

export function PageShell({ children }: PageShellProps) {
  const pathname = usePathname();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const session = result?.pathname === pathname ? result.session : null;
  const error = result?.pathname === pathname ? result.error : null;

  useEffect(() => {
    let cancelled = false;
    getSession().then((nextSession) => {
      if (!cancelled) setResult({ pathname, session: nextSession });
    }).catch((failure: unknown) => {
      if (!cancelled) {
        setResult({ pathname, error: failure instanceof ApiError && [401, 403].includes(failure.status)
          ? "signin" : "unavailable" });
      }
    });
    return () => { cancelled = true; };
  }, [attempt, pathname]);

  if (!session) {
    return (
      <main className="luxe-session-screen" data-theme="dark">
        <section className="luxe-panel w-full max-w-lg space-y-5 p-8">
          <Link className="luxe-wordmark luxe-focus-ring" href={APP_ROUTES.home}>THE LUXE<span aria-hidden>✦</span></Link>
          <p className="luxe-eyebrow">Creator workspace</p>
          <h1 className="luxe-section-title">{error === "signin" ? "Sign in to your workspace" : error ? "Workspace unavailable" : "Opening your workspace"}</h1>
          <p className="luxe-page-description" role={error ? "alert" : "status"}>
            {error === "signin" ? "Your session has ended. Sign in to continue." : error ? "We couldn’t verify your session. Your workspace content has not been loaded." : "Checking your session…"}
          </p>
          {error ? <div className="flex flex-wrap gap-3">
            {error === "unavailable" ? <button className="luxe-secondary-action luxe-focus-ring px-5 py-3" onClick={() => { setResult(null); setAttempt((value) => value + 1); }} type="button">Try again</button> : null}
            <Link className="luxe-primary-action luxe-focus-ring px-5 py-3" href={APP_ROUTES.login}>Sign in</Link>
          </div> : null}
        </section>
      </main>
    );
  }

  return (
    <div className="luxe-app-shell h-dvh overflow-hidden" data-theme="dark">
      <a className="luxe-skip-link luxe-focus-ring" href="#workspace-main">Skip to content</a>
      <div className="flex h-full">
        <AppSidebar session={session} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AppTopbar session={session} />
          <main id="workspace-main" tabIndex={-1} className="luxe-main min-h-0 flex-1 overflow-y-auto px-5 py-8 md:px-8 lg:px-12 lg:py-10">
            <div className="luxe-page-transition mx-auto w-full max-w-[var(--layout-container-max)]">
              {pathname === APP_ROUTES.calendar || pathname === APP_ROUTES.compliance || pathname.startsWith(`${APP_ROUTES.compliance}/`) ? (
                <p className="luxe-demo-notice mb-6 px-4 py-3 text-sm" role="note">Demonstration · This screen shows synthetic examples, not your saved creator progress.</p>
              ) : null}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
