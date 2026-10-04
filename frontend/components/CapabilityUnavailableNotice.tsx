import React from "react";

/**
 * The rendered form of a backend `available: false` capability response.
 *
 * Authority: PRD_v2.0 §18, TRD_v2.0 §30.
 *
 * Three boundaries (scheme matching, approval workflows, regulatory change feed)
 * have no knowledge substrate behind them. An empty list on those screens reads as
 * a finding — "no schemes apply to you", "nothing has changed at any authority" —
 * which is a claim the system cannot support. This states the absence instead, and
 * says what would have to exist for the screen to hold data.
 */
interface CapabilityUnavailableNoticeProps {
  /** Backend capability identifier, e.g. `SCHEME_MATCHING`. */
  capability: string;
  /** Why nothing can be shown. Comes from the backend; not written in the UI. */
  reason: string;
  /** What the system would need before this screen can hold data. */
  requires: string;
  icon?: string;
}

export function CapabilityUnavailableNotice({
  capability,
  reason,
  requires,
  icon = "○",
}: CapabilityUnavailableNoticeProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--ui-border)]/80 p-8 shadow-xs space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-xl text-[var(--ui-muted)] leading-none pt-0.5">{icon}</span>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[var(--ui-text)]">Not configured</h3>
          <span className="font-mono text-[11px] text-[var(--ui-secondary)]">{capability}</span>
        </div>
      </div>

      <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">{reason}</p>

      <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/70 p-4 space-y-1">
        <span className="text-[11px] font-semibold text-[var(--ui-secondary)] uppercase tracking-wide block">
          What this would require
        </span>
        <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">{requires}</p>
      </div>

      <p className="text-[11px] text-[var(--ui-secondary)] border-t border-[var(--ui-border)] pt-3">
        This screen is empty because the capability is absent, not because the
        analysis found nothing that applies to your business.
      </p>
    </div>
  );
}

export default CapabilityUnavailableNotice;
