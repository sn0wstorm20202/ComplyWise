"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function Overlay({ open, onClose, title, children, drawer = false, wide = false, initialFocusSelector }: { open: boolean; onClose: () => void; title: string; children: ReactNode; drawer?: boolean; wide?: boolean; initialFocusSelector?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    dialog.querySelector<HTMLElement>(initialFocusSelector || "input:not([disabled]), textarea:not([disabled]), select:not([disabled])")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open, initialFocusSelector]);
  if (!open) return null;
  return <dialog ref={ref} aria-label={title} className={`ui-overlay ${drawer ? "ui-overlay-drawer" : ""} ${wide ? "ui-overlay-wide" : ""}`} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) { const rect = e.currentTarget.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose(); } }}>
    <div className="ui-overlay-header"><h2>{title}</h2><button type="button" className="ui-icon-button" onClick={onClose} aria-label={`Close ${title}`}><X size={18} /></button></div>
    <div className="ui-overlay-body">{children}</div>
  </dialog>;
}
