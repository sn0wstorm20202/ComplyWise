"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, Building2, Mail, User, ArrowUpRight } from "lucide-react";

interface RequestDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestDemoModal({ isOpen, onClose }: RequestDemoModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    sector: "Industrial equipment",
  });

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = dialog?.querySelectorAll<HTMLElement>("button, input, select, a[href]");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function handleReset() {
    setSubmitted(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#171714]/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-preview-title"
        data-lenis-prevent
        className="w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-[28px] bg-[#F7F5EF] border border-[rgba(23,23,20,0.12)] shadow-[0_24px_64px_rgba(23,23,20,0.14)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[rgba(23,23,20,0.08)] bg-[#EFEEE7]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#171714] text-[#F7F5EF] font-mono font-semibold text-xs flex items-center justify-center">
              CW
            </div>
            <div>
              <div id="business-preview-title" className="text-sm font-serif font-normal text-[#171714]">
                See what applies to your business
              </div>
              <div className="text-[11px] font-mono text-[#96938A] uppercase tracking-[0.14em]">
                Business profile preview
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#F7F5EF] hover:bg-[#E7EEE9] border border-[rgba(23,23,20,0.08)] flex items-center justify-center text-[#6F6D66] hover:text-[#171714] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-7">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
              <p className="text-[#6F6D66] text-xs leading-relaxed font-light">
                Start with a few details about your business. This preview stays
                in your browser; it does not send a request.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="preview-name" className="font-mono uppercase tracking-[0.12em] text-[#6F6D66] text-[10px]">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[#96938A]"
                    strokeWidth={1.5}
                  />
                  <input
                    id="preview-name"
                    autoComplete="name"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Your name"
                    className="w-full rounded-xl border border-[rgba(23,23,20,0.12)] bg-[#EFEEE7] pl-10 pr-4 py-2.5 text-xs text-[#171714] placeholder-[#96938A] focus:bg-[#FFFFFF] focus:border-[#557D6B] focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="preview-email" className="font-mono uppercase tracking-[0.12em] text-[#6F6D66] text-[10px]">
                  Work email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[#96938A]"
                    strokeWidth={1.5}
                  />
                  <input
                    id="preview-email"
                    autoComplete="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="name@enterprise.com"
                    className="w-full rounded-xl border border-[rgba(23,23,20,0.12)] bg-[#EFEEE7] pl-10 pr-4 py-2.5 text-xs text-[#171714] placeholder-[#96938A] focus:bg-[#FFFFFF] focus:border-[#557D6B] focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="preview-company" className="font-mono uppercase tracking-[0.12em] text-[#6F6D66] text-[10px]">
                  Business name
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[#96938A]"
                    strokeWidth={1.5}
                  />
                  <input
                    id="preview-company"
                    autoComplete="organization"
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Your business"
                    className="w-full rounded-xl border border-[rgba(23,23,20,0.12)] bg-[#EFEEE7] pl-10 pr-4 py-2.5 text-xs text-[#171714] placeholder-[#96938A] focus:bg-[#FFFFFF] focus:border-[#557D6B] focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="preview-sector" className="font-mono uppercase tracking-[0.12em] text-[#6F6D66] text-[10px]">
                  Business activity
                </label>
                <select
                  id="preview-sector"
                  value={formData.sector}
                  onChange={(e) =>
                    setFormData({ ...formData, sector: e.target.value })
                  }
                  className="w-full rounded-xl border border-[rgba(23,23,20,0.12)] bg-[#EFEEE7] px-4 py-2.5 text-xs text-[#171714] focus:bg-[#FFFFFF] focus:border-[#557D6B] focus:outline-none cursor-pointer transition-all duration-300"
                >
                  <option>Industrial equipment</option>
                  <option>Electrical and electronics</option>
                  <option>Food and beverage processing</option>
                  <option>Chemicals and materials</option>
                  <option>Other business activity</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[rgba(23,23,20,0.08)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full border border-[rgba(23,23,20,0.12)] text-[#6F6D66] hover:text-[#171714] hover:bg-[#EFEEE7] font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#171714] hover:bg-[#557D6B] text-[#F7F5EF] font-medium text-xs transition-all duration-500 shadow-sm cursor-pointer active:scale-[0.98]"
                >
                  <span>Preview business details</span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="py-8 text-center space-y-4 font-sans">
              <div className="h-14 w-14 rounded-full bg-[#DCEAE2] text-[#557D6B] border border-[#7FAF9A]/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <div className="font-serif text-xl text-[#171714]">
                  Your business details are ready
                </div>
                <p className="text-[#6F6D66] text-xs max-w-sm mx-auto leading-relaxed font-light">
                  Thank you,{" "}
                  <span className="font-medium text-[#171714]">
                    {formData.fullName}
                  </span>
                  . This is a local preview for{" "}
                  <span className="font-mono text-[#171714]">
                    {formData.email}
                  </span>{" "}
                  . Explore the workspace to continue.
                </p>
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-full bg-[#171714] hover:bg-[#557D6B] text-[#F7F5EF] font-medium text-xs transition-all duration-300 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  Return to ComplyWise
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestDemoModal;
