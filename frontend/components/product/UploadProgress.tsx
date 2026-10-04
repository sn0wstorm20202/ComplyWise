import { Check } from "lucide-react";
export default function UploadProgress({ stage }: { stage: number }) {
  return <div role="status" aria-live="polite" className="rounded-xl bg-[var(--ui-inset)] p-4 space-y-3">
    <div className="flex items-center gap-3 text-sm"><Check size={16} className="text-[var(--ui-sage)]" />File selected</div>
    <div className="h-1 overflow-hidden rounded-full bg-[var(--ui-border)]"><div className="h-full bg-[var(--ui-sage)] transition-[width] duration-240" style={{ width: stage >= 2 ? "65%" : "20%" }} /></div>
    <p className="text-xs text-[var(--ui-secondary)]">{stage >= 2 ? "Uploading and checking your document. The result will appear when checking is complete." : "Reading file information…"}</p>
  </div>;
}
