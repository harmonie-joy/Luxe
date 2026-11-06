"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import styles from "@/features/single-post/components/single-post.module.css";

export interface PostLayerProps {
  children: ReactNode;
  onClose: () => void;
  notice: string;
}

function PostDialog({ children, onClose, notice, title }: PostLayerProps & { title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [trigger] = useState(() => typeof document === "undefined" ? null : document.activeElement);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
      else document.querySelector<HTMLElement>("[data-post-next-action]")?.focus();
    };
  }, [trigger]);
  return <dialog ref={dialogRef} aria-labelledby={titleId} className={styles.dialog}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex="0"]',
      )].filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <header className={styles.dialogHeader}><h2 id={titleId}>{title}</h2>
      <Button variant="icon" title={`Close ${title}`} aria-label={`Close ${title}`} onClick={onClose} autoFocus>
        <span aria-hidden="true">×</span>
      </Button>
    </header>
    <p role="status" className={styles.notice}>{notice}</p>
    {children}
  </dialog>;
}

export function TextEditorDrawer(props: PostLayerProps) { return <PostDialog {...props} title="Message editor" />; }
export function VisualEditorDrawer(props: PostLayerProps) { return <PostDialog {...props} title="Visual editor" />; }
export function ReviewModal(props: PostLayerProps) { return <PostDialog {...props} title="Final review" />; }
export function ScheduleModal(props: PostLayerProps) { return <PostDialog {...props} title="Ready / Schedule" />; }