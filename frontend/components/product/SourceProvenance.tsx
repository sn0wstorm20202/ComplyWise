import type { EvidenceSourceRecord, GroundedEvidenceItem } from '@/types';
import { exactSourceUrl } from '@/lib/sourceProvenance';

export default function SourceProvenance({ source, evidence }: { source?: EvidenceSourceRecord | null; evidence?: GroundedEvidenceItem[] }) {
  // If the backend deliberately supplies url:null, do not substitute a different URL.
  const url = exactSourceUrl(source?.url === undefined ? source?.canonical_url : source?.url);
  const passages = (evidence || []).filter(item => source?.id && item.source_id === source.id && item.excerpt);
  return <section className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-3.5 space-y-2" aria-label="Source provenance">
    <h3 className="text-xs font-semibold text-[var(--ui-text)]">Source</h3>
    {source ? <>
      <p className="text-xs font-medium text-[var(--ui-text)]">{source.title || 'Source title not recorded'}</p>
      {source.authority && <p className="text-xs text-[var(--ui-secondary)]">{source.authority}</p>}
      {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ui-info)] hover:underline">View source ↗</a> : <p className="text-xs text-[var(--ui-secondary)]">Source link not recorded for this result.</p>}
      <div className="text-[11px] text-[var(--ui-secondary)] space-y-1">
        {source.source_type && <p>Source type: {source.source_type.replaceAll('_', ' ')}</p>}
        <p>Evidence: {source.evidence_status?.replaceAll('_', ' ') || 'Review status not recorded'}</p>
        {source.retrieved_at && <p>Retrieved: {new Date(source.retrieved_at).toLocaleDateString()}</p>}
        {source.acquisition_method && <p>Acquisition: {source.acquisition_method.replaceAll('_', ' ')}</p>}
      </div>
    </> : <p className="text-xs text-[var(--ui-secondary)]">Source not recorded for this contextual result.</p>}
    {passages.length ? passages.map((item, index) => <div key={item.evidence_id || index} className="text-xs text-[var(--ui-secondary)]">
      <p className="font-mono text-[11px]">{item.location || item.locator || 'Evidence location not recorded.'}</p>
      <blockquote className="border-l-2 border-[var(--ui-sage-soft)] pl-3 mt-1">{item.excerpt}</blockquote>
    </div>) : <p className="text-xs text-[var(--ui-secondary)]">Source excerpt/location not recorded for this result.</p>}
  </section>;
}
