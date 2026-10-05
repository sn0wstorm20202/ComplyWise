"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";

export default function Disclosure({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { const element = panel.current; return () => { if (element) gsap.killTweensOf(element); }; }, []);
  function toggle() {
    const next = !open;
    setOpen(next);
    const element = panel.current;
    if (!element) return;
    gsap.killTweensOf(element);
    gsap.to(element, { height: next ? "auto" : 0, opacity: next ? 1 : 0, duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.24, ease: "power2.out" });
  }
  return <section className="ui-disclosure" data-open={open}>
    <button type="button" aria-expanded={open} aria-controls={id} onClick={toggle} className="ui-disclosure-trigger">
      <span>{title}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    <div id={id} ref={panel} inert={!open} style={{ height: defaultOpen ? "auto" : 0, opacity: defaultOpen ? 1 : 0, overflow: "hidden" }}>
      <div className="ui-disclosure-content">{children}</div>
    </div>
  </section>;
}
