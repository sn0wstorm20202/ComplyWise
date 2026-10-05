export interface AnalysisStage {
  name: string;
  done: boolean;
  detail: string;
}

interface AssessmentProgressProps {
  businessName?: string;
  activeQueryText: string;
  analysisStages: AnalysisStage[];
}

export default function AssessmentProgress({ businessName, activeQueryText,
  analysisStages,
}: AssessmentProgressProps) {
  return (
          <div className="bg-white rounded-2xl border border-[var(--ui-border)] p-8 shadow-2xs space-y-6 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-2xl animate-pulse shadow-2xs">
                ⚙️
              </div>
              <h2 className="text-xl font-sans font-bold tracking-tight text-[var(--ui-text)]">
                Building Your Compliance Plan
              </h2>
              <p className="text-xs text-[var(--ui-secondary)]">
                Checking the relevant requirements and their sources for {businessName || "your business"}.
              </p>
              <p role="status" className="text-sm text-[var(--ui-secondary)] leading-relaxed">
                Your compliance analysis may take up to 1–2 minutes. Please keep this page open while we verify sources and build your workspace.
              </p>
              {/* Dynamic query feedback strip */}
              <div aria-live="polite" className="p-2.5 rounded-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] text-xs font-semibold text-amber-800 flex items-center justify-center gap-2 shadow-2xs">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-600 animate-ping" />
                <span>{activeQueryText}</span>
              </div>
            </div>

            {/* 8-Stage Real Progress Checklist */}
            <div className="max-w-xl mx-auto text-left space-y-2.5 pt-2">
              {analysisStages.map((stage, idx) => (
                <div
                  key={`${stage.name}-${idx}`}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    stage.done
                      ? "bg-white border-[var(--ui-sage-soft)] shadow-2xs"
                      : "bg-[var(--ui-bg)] border-[var(--ui-border)]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      stage.done
                        ? "bg-[var(--ui-sage)] text-white"
                        : "bg-[var(--ui-inset)] text-[var(--ui-muted)] border border-[var(--ui-border)] animate-pulse"
                    }`}
                  >
                    {stage.done ? "✓" : idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--ui-text)] truncate">{stage.name}</div>
                    <div className="text-[11px] text-[var(--ui-secondary)] truncate">{stage.detail}</div>
                  </div>
                  {stage.done ? (
                    <span className="text-[11px] font-semibold text-[var(--ui-sage)] bg-[var(--ui-sage-faint)] px-2.5 py-0.5 rounded-full border border-[var(--ui-sage-soft)]">
                      Completed
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[var(--ui-muted)]">
                      Processing...
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-[11px] text-[var(--ui-muted)] pt-2">
              Published rules guide applicability. Source-backed decisions and contextual planning remain distinct.
            </div>
          </div>
  );
}
