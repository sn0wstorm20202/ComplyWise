"""Deterministic Intent Router for Compliance and Standards Inquiries.

Authority: TRD_v2.0 §4, §30; PRD_v2.0 §22, §24; Master Engineering Directive.
"""

from __future__ import annotations

import re
from enum import Enum
from typing import NamedTuple


class QueryIntent(str, Enum):
    """Categorization of user inquiry routing."""
    GENERAL_COMPLIANCE = "GENERAL_COMPLIANCE"
    BIS_STANDARDS = "BIS_STANDARDS"
    MIXED_QUERY = "MIXED_QUERY"
    AMBIGUOUS = "AMBIGUOUS"


class RouteDecision(NamedTuple):
    intent: QueryIntent
    confidence: float
    detected_standards: list[str]
    detected_keywords: list[str]
    rationale: str


_IS_PATTERN = re.compile(
    r"\b(IS\s*(?:[0-9]{3,5})(?:\s*[-/:]\s*[0-9]{1,4})?(?:\s*\([Pp]art\s*[0-9]+\))?)\b",
    re.IGNORECASE,
)


def extract_standard_references(query: str) -> list[str]:
    """Extract standard designations (e.g. 'IS 16444') found in text."""
    if not query:
        return []
    return [_IS_PATTERN.sub(r"\1", m.group(1)).strip() for m in _IS_PATTERN.finditer(query)]


# Explicit BIS & Technical Standards indicators
_BIS_KEYWORDS = [
    "bis",
    "bureau of indian standards",
    "qco",
    "quality control order",
    "isi mark",
    "scheme-i",
    "scheme 1",
    "scheme-ii",
    "scheme 2",
    "compulsory registration",
    "crs",
    "hallmark",
    "manakonline",
    "standard mark",
    "sti",
    "scheme of testing",
    "nabl",
    "test clause",
    "testing clause",
    "acceptance criteria",
    "clause 18",
    "temperature rise test",
    "conformance testing",
    "cm/l",
]

# Explicit General Compliance indicators
_GENERAL_KEYWORDS = [
    "spcb",
    "cpcb",
    "pollution",
    "pollution control",
    "clearance",
    "clearances",
    "consent to establish",
    "consent to operate",
    "cte",
    "cto",
    "form i",
    "effluent",
    "etp",
    "stp",
    "factories act",
    "factory license",
    "fssai",
    "food license",
    "udyam",
    "cgtmse",
    "subsidy",
    "subsidies",
    "grant",
    "grants",
    "msme incentive",
    "epr",
    "battery waste",
    "hazardous waste",
    "red category",
    "orange category",
    "green category",
    "white category",
]


def classify_compliance_query(query: str) -> RouteDecision:
    """Classify user query deterministically into standard, general, or mixed intents."""
    q_norm = (query or "").strip().lower()

    if not q_norm:
        return RouteDecision(
            intent=QueryIntent.AMBIGUOUS,
            confidence=1.0,
            detected_standards=[],
            detected_keywords=[],
            rationale="Empty query cannot be routed.",
        )

    # Detect exact standard identifiers
    standards_found = [_IS_PATTERN.sub(r"\1", m.group(1)) for m in _IS_PATTERN.finditer(query)]

    # Detect keyword occurrences
    matched_bis = [k for k in _BIS_KEYWORDS if k in q_norm]
    matched_general = [k for k in _GENERAL_KEYWORDS if k in q_norm]

    has_bis_signals = bool(standards_found or matched_bis)
    has_general_signals = bool(matched_general)

    if has_bis_signals and has_general_signals:
        return RouteDecision(
            intent=QueryIntent.MIXED_QUERY,
            confidence=0.95,
            detected_standards=standards_found,
            detected_keywords=matched_bis + matched_general,
            rationale="Query combines specific Bureau of Indian Standards and general statutory/environmental compliance concerns.",
        )

    if has_bis_signals:
        return RouteDecision(
            intent=QueryIntent.BIS_STANDARDS,
            confidence=0.98 if standards_found else 0.90,
            detected_standards=standards_found,
            detected_keywords=matched_bis,
            rationale="Query specifically targets Indian Standards, Quality Control Orders, or laboratory testing clauses.",
        )

    if has_general_signals:
        return RouteDecision(
            intent=QueryIntent.GENERAL_COMPLIANCE,
            confidence=0.92,
            detected_standards=[],
            detected_keywords=matched_general,
            rationale="Query targets statutory factory permits, pollution consents (SPCB), food licenses (FSSAI), or financial subsidies.",
        )

    # Default: if user mentions product or general manufacturing without specific keywords
    return RouteDecision(
        intent=QueryIntent.GENERAL_COMPLIANCE,
        confidence=0.50,
        detected_standards=[],
        detected_keywords=[],
        rationale="General compliance inquiry routed to default statutory reasoning engine.",
    )


def decompose_mixed_query(query: str) -> tuple[str, str]:
    """Decompose a mixed compliance query into distinct (bis_subquery, general_subquery) parts.

    Ensures the general compliance engine is never fed the BIS technical inquiry,
    and the specialized BIS RAG engine is given the targeted standards inquiry.
    """
    if not query or not query.strip():
        return ("", "")

    # 1. Split by sentence delimiters (? . ! ; \n)
    sentence_delimiters = re.compile(r"(?<=[?!;\n])\s+|\.\s+(?=[A-Z0-9])")
    sentences = [s.strip() for s in sentence_delimiters.split(query) if s.strip()]

    # 2. If single sentence or compound sentence, attempt splitting by coordinating conjunctions
    clauses: list[str] = []
    conjunction_pattern = re.compile(
        r"\s+(?:and(?:\s+also)?|as well as|also|along with|plus|in addition to)\s+",
        re.IGNORECASE,
    )

    for s in sentences:
        parts = conjunction_pattern.split(s)
        if len(parts) > 1:
            clauses.extend([p.strip() for p in parts if p.strip()])
        else:
            clauses.append(s)

    bis_parts: list[str] = []
    general_parts: list[str] = []

    for clause in clauses:
        c_norm = clause.lower()
        has_bis = bool(_IS_PATTERN.search(clause) or any(k in c_norm for k in _BIS_KEYWORDS))
        has_general = any(k in c_norm for k in _GENERAL_KEYWORDS)

        if has_bis and not has_general:
            bis_parts.append(clause)
        elif has_general and not has_bis:
            general_parts.append(clause)
        elif has_bis and has_general:
            bis_parts.append(clause)
            general_parts.append(clause)
        else:
            # Contextual preamble: share across both
            bis_parts.append(clause)
            general_parts.append(clause)

    bis_subquery = " ".join(bis_parts).strip() if bis_parts else query
    general_subquery = " ".join(general_parts).strip() if general_parts else query

    def _clean(q: str) -> str:
        q = re.sub(r"^(?:and|also|as well as|plus)\s+", "", q, flags=re.IGNORECASE)
        q = q.strip()
        if q and not q.endswith(("?", ".", "!")):
            q += "?"
        return q

    return (_clean(bis_subquery), _clean(general_subquery))

