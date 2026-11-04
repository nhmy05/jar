"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";

export function Dialog({ children, labelId, onClose, className = "", noScrimFade = false, hideClose = false }: { children: ReactNode; labelId: string; onClose: () => void; className?: string; noScrimFade?: boolean; hideClose?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      const preferred = panel.current?.querySelector<HTMLElement>("[data-autofocus]");
      (preferred || panel.current)?.focus();
    });
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), a[href], input:not([disabled]):not([tabindex="-1"]), select, textarea, [tabindex="0"]')).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, []);

  return <div className={`modal-scrim${noScrimFade ? " no-fade" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={`dialog-panel ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelId} tabIndex={-1} ref={panel}>
      {!hideClose && <button className="dialog-close icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" size={20} /></button>}
      {children}
    </div>
  </div>;
}
