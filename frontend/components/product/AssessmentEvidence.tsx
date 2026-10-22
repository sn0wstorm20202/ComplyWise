import type { AssessmentProvenance, EvidenceSummary } from "@/types/comparison";
import { sanitizeExternalUrl } from "@/lib/url";

export function recordedDate(value?: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "Not recorded";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
const labels: Record<string, string> = {
  DEMO_EXAMPLE: "Curated demo evidence", LEGACY_UNPINNED: "Historical provenance not captured",
  NO_RECORDED_PASSAGE: "No source passage recorded", REVIEWED_RECORD: "Reviewed source record",
  REVIEW_NEEDED: "Source review needed",
};
export function EvidenceSummaryView({ evidence }: { evidence?: EvidenceSummary }) {
  return <div className="mt-3 space-y-2 text-xs text-[var(--ui-secondary)]">
    <p><strong>Evidence:</strong> {evidence ? labels[evidence.status] || "Review needed" : "No captured evidence summary"}
      {evidence && ` · ${evidence.reviewed_passages}/${evidence.recorded_passages} passages marked reviewed`}</p>
    {Boolean(evidence?.sources.length) && <p>Primary source published: {recordedDate(evidence?.sources[0]?.publication_date)} · Effective: {recordedDate(evidence?.sources[0]?.effective_date)}</p>}
    {evidence?.sources.length ? <details><summary className="cursor-pointer">Recorded source dates ({evidence.sources.length})</summary>
      <ul className="mt-2 space-y-3">{evidence.sources.map(source => {
        const url = sanitizeExternalUrl(source.url);
        return <li key={source.evidence_id}>{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="underline">{source.title || source.evidence_id} ↗</a> : source.title || source.evidence_id}
          <p>Published: {recordedDate(source.publication_date)} · Effective: {recordedDate(source.effective_date)} · Retrieved: {recordedDate(source.retrieved_at)}</p></li>;
      })}</ul></details> : <p>Source publication date: Not recorded</p>}
    {Boolean(evidence?.missing_references) && <p>{evidence?.missing_references} referenced passage(s) unavailable in this saved record.</p>}
    <p><strong>Completion:</strong> Applicability does not verify filing, licence issuance or authority approval.</p>
  </div>;
}
export function AssessmentEvidencePanel({ provenance }: { provenance?: AssessmentProvenance }) {
  if (!provenance) return null;
  return <section className="ui-object space-y-3" aria-label="Assessment evidence and coverage">
    <h2 className="font-semibold">Evidence & coverage</h2>
    <p className="text-sm text-[var(--ui-secondary)]">{provenance.coverage.message}</p>
    <dl className="grid gap-3 sm:grid-cols-3 text-xs">
      <div><dt className="font-semibold">Decision date</dt><dd>{recordedDate(provenance.evaluation_date)}</dd></div>
      <div><dt className="font-semibold">Evidence gaps</dt><dd>{provenance.requirements_without_passages} requirements without captured passages · {provenance.source_dates_missing} sources without publication dates</dd></div>
      <div><dt className="font-semibold">Unresolved results</dt><dd>{provenance.requirements_needing_review} need information or review</dd></div>
    </dl>
    <p className="text-xs text-[var(--ui-secondary)]">Applicability answers whether a requirement applies. Document review and filing progress are tracked separately; this assessment does not establish authority approval.</p>
  </section>;
}
