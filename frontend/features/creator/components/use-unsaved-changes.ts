"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

export function confirmDiscard() {
  return window.confirm("Discard your unsaved changes?");
}

let installed = false;
let currentIndex = 0;
let currentHref = "";
let currentState: unknown = null;
let activeGuard: (() => boolean) | null = null;

function trackHistory() {
  if (installed) return;
  installed = true;
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  const indexed = (state: unknown, index: number) => ({ ...(state && typeof state === "object" ? state : {}), luxeNavigationIndex: index });
  currentIndex = history.state?.luxeNavigationIndex ?? 0;
  currentHref = location.href;
  replace(indexed(history.state, currentIndex), "", location.href);
  currentState = history.state;
  history.pushState = (state, title, url) => {
    push(indexed(state, currentIndex + 1), title, url);
    currentIndex += 1;
    currentHref = location.href;
    currentState = history.state;
  };
  history.replaceState = (state, title, url) => { replace(indexed(state, currentIndex), title, url); currentHref = location.href; currentState = history.state; };
  let restoring = false;
  // Capture before the App Router renders a traversed route; canceled traversals restore its entry.
  window.addEventListener("popstate", (event: PopStateEvent) => {
    const previous = new URL(currentHref);
    const samePage = previous.pathname === location.pathname && previous.search === location.search;
    // A native fragment link adds an entry without going through pushState or copying Next's state.
    const nativeFragment = samePage && event.state === null;
    const targetIndex = event.state?.luxeNavigationIndex ?? currentIndex + (nativeFragment ? 1 : -1);
    if (restoring) { restoring = false; currentIndex = targetIndex; currentHref = location.href; currentState = event.state; return; }
    if (!samePage && activeGuard?.() && !confirmDiscard()) {
      event.stopImmediatePropagation();
      restoring = true;
      history.go(currentIndex - targetIndex);
      return;
    }
    currentIndex = targetIndex;
    currentHref = location.href;
    replace(indexed(nativeFragment ? currentState : event.state, currentIndex), "", location.href);
    currentState = history.state;
  }, true);
}

export function useUnsavedChanges(dirty: boolean) {
  const currentDirty = useRef(dirty);
  useLayoutEffect(() => { currentDirty.current = dirty; }, [dirty]);
  useEffect(() => {
    trackHistory();
    const guard = () => currentDirty.current;
    activeGuard = guard;
    const unload = (event: BeforeUnloadEvent) => {
      if (guard()) { event.preventDefault(); event.returnValue = ""; }
    };
    const navigate = (event: MouseEvent) => {
      if (!guard()) return;
      const anchor = (event.target as Element).closest("a[href]");
      if (!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href");
      if (href?.startsWith("/") && new URL(href, location.href).href !== location.href && !event.defaultPrevented && !confirmDiscard()) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      if (activeGuard === guard) activeGuard = null;
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, []);
}

// Install before App Router hydration so history restoration cannot render a target before confirmation.
if (typeof window !== "undefined") trackHistory();

export function CreatorNavigationGuard() { return null; }
