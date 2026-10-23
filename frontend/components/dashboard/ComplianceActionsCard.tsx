"use client";

import { useId, useState } from "react";
import { ArrowUpDown, ArrowUpRight } from "lucide-react";

interface TimelinePoint { day: string; count: number }

interface ComplianceActionsCardProps {
  actionsData: {
    openCount: number | null;
    reviewCount: number | null;
    timeline: TimelinePoint[];
  };
  onExpand?: () => void;
}

export function ComplianceActionsCard({ actionsData, onExpand }: ComplianceActionsCardProps) {
  const [reviewOnly, setReviewOnly] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);
  const gradientId = useId();
  const maxCount = Math.max(1, ...actionsData.timeline.map(item => item.count));
  const points = actionsData.timeline.map((item, index, all) => ({
    ...item,
    x: 15 + (index / Math.max(1, all.length - 1)) * 270,
    y: 90 - (item.count / maxCount) * 70,
  }));
  const path = points.reduce((result, point, index, all) => {
    if (!index) return `M ${point.x} ${point.y}`;
    const previous = all[index - 1];
    const midpoint = (previous.x + point.x) / 2;
    return `${result} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }, "");
  const first = points[0];
  const last = points[points.length - 1];
  const peak = points.reduce<(typeof points)[number] | undefined>((highest, point) =>
    !highest || point.count > highest.count ? point : highest, undefined);
  const count = reviewOnly ? actionsData.reviewCount : actionsData.openCount;

  return <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-[var(--ui-border)] shadow-sm flex flex-col justify-between h-full min-h-[270px] relative w-full">
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--ui-text)]">Compliance Actions</h3>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => setReviewOnly(value => !value)}
            aria-label="Show actions needing information or conflict review" aria-pressed={reviewOnly}
            className="h-6 w-6 rounded-[6px] flex items-center justify-center border border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-secondary)]">
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <button type="button" onClick={onExpand} aria-label="Expand actions details"
            className="h-6 w-6 rounded-[6px] flex items-center justify-center border border-[var(--ui-border)] bg-[var(--ui-bg)] text-[var(--ui-secondary)]">
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className="text-xs text-[var(--ui-muted)] mt-2.5">{reviewOnly ? "Needs information or review" : "Actions to review"}</p>
      <p aria-live="polite" aria-atomic="true" className="text-3xl sm:text-4xl font-bold tracking-tight leading-none mt-1">
        <span className="sr-only">{reviewOnly ? "Needs review: " : "Actions to review: "}</span>{count ?? "—"}
      </p>
      {count == null && <p className="text-xs text-[var(--ui-secondary)] mt-2">Assessment needed</p>}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(110px,1fr)_3fr] gap-5 items-end mt-6">
      <div className="flex flex-col gap-2">
        {[{ review: true, label: "Needs review", count: actionsData.reviewCount },
          { review: false, label: "All actions", count: actionsData.openCount }].map(filter =>
          <button key={filter.label} type="button" onClick={() => setReviewOnly(filter.review)} aria-pressed={reviewOnly === filter.review}
            className={`px-3 py-2 rounded-[10px] border flex items-center justify-between gap-3 text-xs ${reviewOnly === filter.review
              ? "bg-[var(--ui-text)] border-[var(--ui-text)] text-white"
              : "bg-white border-[var(--ui-border)] text-[var(--ui-secondary)]"}`}>
            <span className="font-semibold">{filter.count ?? "—"}</span><span>{filter.label}</span>
          </button>)}
      </div>
      <div>
        <p className="text-[11px] text-[var(--ui-secondary)] mb-5">Workflow events · last seven days</p>
        {points.length ? <div className="relative">
          <svg className="w-full h-24 overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none" role="img"
            aria-label={`Recorded workflow events: ${points.map(point => `${point.day}: ${point.count}`).join(", ")}`}>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F172A" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </linearGradient></defs>
            <path d={`${path} L ${last.x} 100 L ${first.x} 100 Z`} fill={`url(#${gradientId})`} />
            {peak && peak.count > 0 && <line x1={peak.x} y1={peak.y} x2={peak.x} y2="100" stroke="#D4F66C" strokeWidth="1.5" strokeDasharray="3 3" />}
            <path d={path} fill="none" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
            {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3" fill="#0F172A"
              onMouseEnter={() => setHoveredPoint(point)} onMouseLeave={() => setHoveredPoint(null)}>
              <title>{`${point.day}: ${point.count} workflow events`}</title>
            </circle>)}
          </svg>
          {hoveredPoint && <span className="absolute -top-4 right-0 text-[10px] bg-[var(--ui-text)] text-white px-2 py-1 rounded-full">{hoveredPoint.day}: {hoveredPoint.count} events</span>}
          <div className="flex justify-between text-[10px] text-[var(--ui-muted)] mt-2">{points.map((point, index) => <span key={index}>{point.day}</span>)}</div>
        </div> : <p className="text-xs text-[var(--ui-secondary)] py-8">No recorded workflow activity yet.</p>}
      </div>
    </div>
  </div>;
}

export default ComplianceActionsCard;
