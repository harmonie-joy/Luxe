"use client";

import { useEffect } from "react";

export function confirmDiscard() {
  return window.confirm("Discard your unsaved changes and load the saved version?");
}

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const marker = crypto.randomUUID();
    // A same-URL history entry lets Back ask before the App Router leaves this editor.
    history.pushState({ ...history.state, luxeUnsaved: marker }, "", location.href);
    let moving = false;
    const back = () => {
      if (history.state?.luxeUnsaved === marker || moving) return;
      if (confirmDiscard()) {
        moving = true;
        window.removeEventListener("popstate", back);
        history.back();
      } else history.forward();
    };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest("a[href]");
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || anchor?.getAttribute("target") === "_blank") return;
      if (anchor && anchor.getAttribute("href")?.startsWith("/") && !event.defaultPrevented && !confirmDiscard()) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", back);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("popstate", back);
      if (history.state?.luxeUnsaved === marker) {
        const state = { ...history.state };
        delete state.luxeUnsaved;
        history.replaceState(state, "", location.href);
      }
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);
}
