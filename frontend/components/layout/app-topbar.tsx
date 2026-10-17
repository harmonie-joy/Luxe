"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { APP_ROUTES, APP_PAGE_LABELS } from "@/lib/routes";
import type { AuthSession } from "@/types/auth";

export function AppTopbar({ session }: { session?: AuthSession } = {}) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const workspace = session?.workspaces.find((item) => item.id === session.activeWorkspaceId);
  const title = APP_PAGE_LABELS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "Workspace";

  return (
    <header className="luxe-topbar flex shrink-0 items-center justify-between gap-4 px-5 py-4 md:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button
          aria-label="Open navigation"
          aria-controls="workspace-navigation"
          aria-expanded={open}
          aria-haspopup="dialog"
          className="luxe-icon-action luxe-focus-ring grid h-11 w-11 shrink-0 place-items-center lg:hidden"
          onClick={() => { dialog.current?.showModal(); setOpen(true); }}
          type="button"
        >
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
        </button>
        <div className="min-w-0 lg:hidden">
          <Link className="luxe-wordmark luxe-focus-ring text-base" href={APP_ROUTES.dashboard}>THE LUXE<span aria-hidden>✦</span></Link>
          <p className="luxe-form-help truncate" title={workspace?.name}>{workspace?.name ?? "No active workspace"}</p>
        </div>
        <p className="luxe-muted hidden text-sm lg:block">Workspace <span aria-hidden className="px-3">/</span><span className="luxe-strong">{title}</span></p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="luxe-alpha-badge hidden sm:inline-flex">Internal alpha</span>
        <Link className="luxe-icon-action luxe-focus-ring grid h-11 w-11 place-items-center" href={APP_ROUTES.account} aria-label="Open account page">
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>
        </Link>
      </div>
      <dialog
        id="workspace-navigation"
        aria-label="Workspace navigation"
        className="luxe-mobile-navigation"
        ref={dialog}
        onClose={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], summary"))
            .filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="flex justify-end px-4 pt-4">
          <button autoFocus aria-label="Close navigation" className="luxe-icon-action luxe-focus-ring grid h-11 w-11 place-items-center" onClick={() => dialog.current?.close()} type="button">✕</button>
        </div>
        {open ? <AppSidebar mobile session={session} onNavigate={() => dialog.current?.close()} /> : null}
      </dialog>
    </header>
  );
}
