/** Exact source links only. Application portals use a separate contract. */
export function exactSourceUrl(raw?: string | null): string | null {
  if (!raw || raw !== raw.trim()) return null;
  try {
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const segments = url.pathname.toLowerCase().split('/').filter(Boolean);
    const lastSegment = segments.at(-1) || '';
    const hasResourceQuery = ['document', 'document_id', 'documentid', 'file', 'file_id', 'id', 'notification'].some(key => Boolean(url.searchParams.get(key)));
    // A root, generic search or portal home cannot identify an evidence document.
    if (!segments.length && !hasResourceQuery) return null;
    if (/^(?:index|home)(?:\.(?:html?|aspx?|php))?$/.test(lastSegment) || lastSegment === 'default.aspx') return null;
    if (segments.some(segment => ['home', 'search', 'login', 'signin', 'sign-in'].includes(segment))) return null;
    if (segments.some(segment => ['home', 'search', 'login', 'signin', 'sign-in'].includes(segment.split('.')[0]))) return null;
    if (segments.length === 1 && ['bis', 'portal', 'government'].includes(lastSegment)) return null;
    if (['q', 'query', 'search'].some(key => url.searchParams.has(key))) return null;
    return raw;
  } catch {
    return null;
  }
}

export function standardClassification(status?: string, mandatory?: boolean | null, origin?: string): string {
  if (origin === 'LLM_FALLBACK_RESULT' || status === 'CONTEXTUAL') return 'Contextual quality planning — no reviewed standard or mandatory status established.';
  if (status === 'REVIEWED_NOT_APPLICABLE') return 'Reviewed — not applicable within this assessment scope.';
  if (status === 'CANDIDATE') return 'Candidate standard — relevance and applicability need review.';
  if (status === 'NEEDS_REVIEW') return 'Needs review — applicability has not been established.';
  if (status === 'REVIEWED_APPLICABLE') return mandatory === true ? 'Mandatory within the recorded rule scope.' : mandatory === false ? 'Reviewed relevant standard — voluntary.' : 'Reviewed relevant standard — mandatory status not recorded.';
  return 'Applicability and mandatory status not established.';
}

export function schemeClassification(status?: string, origin?: string): string {
  if (origin === 'LLM_FALLBACK_RESULT') return 'Contextual support area';
  const labels: Record<string, string> = {
    EVIDENCE_SUPPORTED: 'Evidence-supported eligibility', ELIGIBLE: 'Evidence-supported eligibility',
    LIKELY_ELIGIBLE: 'Likely eligible — some facts need confirmation', SOME_FACTS_UNVERIFIED: 'Some eligibility facts need confirmation',
    CANDIDATE: 'Candidate — eligibility not established', RELEVANT_BUT_NOT_ESTABLISHED: 'Candidate — eligibility not established',
    NOT_ELIGIBLE: 'Not eligible within this assessment', EXPIRED_OR_NOT_CURRENT: 'Expired or currentness not established',
    NEEDS_REVIEW: 'Eligibility needs review',
  };
  return labels[status || ''] || 'Eligibility not established';
}
