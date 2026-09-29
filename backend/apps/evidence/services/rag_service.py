"""ComplianceRag Service Client & Evidence Retrieval Boundary.

Authority: 08_RAG_SERVICE_CONTRACT.md (CW-RAG-2026-V1);
           01_ENGINEERING_CONSTITUTION.md §3;
           04_DOMAIN_BOUNDARIES.md §2;
           05_DATA_CONTRACTS.md §7.

Crucial Invariant:
    RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.
    This service has ZERO authority to emit legal applicability decisions
    (APPLICABLE, NOT_APPLICABLE, NEEDS_INFORMATION).
    It only discovers candidate requirements and retrieves authoritative evidence chunks.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import re
import time
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from django.conf import settings

logger = logging.getLogger("complywise.evidence.rag_service")


# ── Data Contracts (08_RAG_SERVICE_CONTRACT.md §3, 05_DATA_CONTRACTS.md §7) ──

@dataclass
class JurisdictionFilter:
    state_code: str = ""
    district: str = ""
    zone_type: str = ""


@dataclass
class EnterpriseFilter:
    entity_type: str = ""
    msme_category: str = ""


@dataclass
class OperationsFilter:
    manufacturing_status: str = ""
    sector: str = ""
    sub_sector: str = ""
    worker_count: int | None = None
    connected_load_hp: float | None = None


@dataclass
class EnvironmentalFilter:
    has_boiler: bool | None = None
    boiler_capacity_tph: float | None = None
    generates_trade_effluent: bool | None = None
    dyeing_activity: bool | None = None


@dataclass
class RegulatoryCandidateQuery:
    jurisdiction: JurisdictionFilter = field(default_factory=JurisdictionFilter)
    enterprise: EnterpriseFilter = field(default_factory=EnterpriseFilter)
    operations: OperationsFilter = field(default_factory=OperationsFilter)
    environmental: EnvironmentalFilter = field(default_factory=EnvironmentalFilter)
    raw_query: str = ""
    top_k: int = 25

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> RegulatoryCandidateQuery:
        jur = data.get("jurisdiction", {})
        ent = data.get("enterprise", {})
        ops = data.get("operations", {})
        env = data.get("environmental", {})
        return cls(
            jurisdiction=JurisdictionFilter(
                state_code=str(jur.get("state_code", "")).strip().upper(),
                district=str(jur.get("district", "")).strip(),
                zone_type=str(jur.get("zone_type", "")).strip(),
            ),
            enterprise=EnterpriseFilter(
                entity_type=str(ent.get("entity_type", "")).strip(),
                msme_category=str(ent.get("msme_category", "")).strip(),
            ),
            operations=OperationsFilter(
                manufacturing_status=str(ops.get("manufacturing_status", "")).strip(),
                sector=str(ops.get("sector", "")).strip(),
                sub_sector=str(ops.get("sub_sector", "")).strip(),
                worker_count=ops.get("worker_count"),
                connected_load_hp=ops.get("connected_load_hp"),
            ),
            environmental=EnvironmentalFilter(
                has_boiler=env.get("has_boiler"),
                boiler_capacity_tph=env.get("boiler_capacity_tph"),
                generates_trade_effluent=env.get("generates_trade_effluent"),
                dyeing_activity=env.get("dyeing_activity"),
            ),
            raw_query=str(data.get("raw_query", "")).strip(),
            top_k=int(data.get("top_k", 25)),
        )


@dataclass
class CandidateRequirement:
    requirement_id: str
    title: str
    issuing_authority: str
    regulatory_domain: str
    confidence_score: float
    matched_reasons: list[str]
    evidence_chunk_id: str = ""
    official_portal_url: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class RegulatoryCandidateResponse:
    candidates_count: int
    candidates: list[CandidateRequirement]
    retrieval_metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "candidates_count": self.candidates_count,
            "candidates": [c.to_dict() for c in self.candidates],
            "retrieval_metadata": self.retrieval_metadata,
        }


@dataclass
class EvidenceSearchQuery:
    query: str
    state_code: str = ""
    regulatory_domain: str = ""
    top_k: int = 10


@dataclass
class EvidenceSearchResult:
    chunk_id: str
    source_id: str
    source_title: str
    authority: str
    content: str
    locator: str = ""
    official_url: str = ""
    relevance_score: float = 0.0
    verification_status: str = "VERIFIED"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class EvidenceChunkDetail:
    chunk_id: str
    source_id: str
    source_title: str
    authority: str
    verbatim_text: str
    locator: str = ""
    official_url: str = ""
    content_hash: str = ""
    verification_status: str = "VERIFIED"
    effective_from: str | None = None
    effective_until: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ── Client Implementation ───────────────────────────────────────────────────

class ComplianceRagClient:
    """Client for retrieving regulatory candidates and authoritative legal evidence.

    Follows 08_RAG_SERVICE_CONTRACT.md.
    Operates in dual mode:
    1. HTTP RPC mode: If COMPLIANCERAG_URL is configured, dispatches signed HMAC requests.
    2. Embedded authoritative mode: Reads directly from ComplianceRag's KB and ComplyWise
       knowledge store with zero external network dependency.
    """

    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self.base_url = (base_url or getattr(settings, "COMPLIANCERAG_URL", "")).rstrip("/")
        self.api_key = api_key or getattr(settings, "COMPLIANCERAG_KEY", "complywise-internal-secret")

    def _generate_signature_headers(self, payload: bytes) -> dict[str, str]:
        """Generate canonical authentication headers per CW-RAG-2026-V1 §3.A."""
        timestamp = str(int(time.time()))
        nonce = str(uuid.uuid4())
        sig_data = f"{timestamp}:{nonce}:".encode("utf-8") + payload
        signature = hmac.new(self.api_key.encode("utf-8"), sig_data, hashlib.sha256).hexdigest()
        return {
            "Content-Type": "application/json",
            "X-ComplyWise-Signature": f"sha256={signature}",
            "X-ComplyWise-Timestamp": timestamp,
            "X-ComplyWise-Nonce": nonce,
            "X-Correlation-ID": f"req-{uuid.uuid4()}",
        }

    def discover_candidates(self, query: RegulatoryCandidateQuery) -> RegulatoryCandidateResponse:
        """Discover candidate requirements for a business without deciding legal status.

        Crucial Invariant: The returned candidates contain NO legal determinations.
        Engine 2 alone determines APPLICABLE / NOT_APPLICABLE / NEEDS_INFORMATION.
        """
        t0 = time.perf_counter()

        # If remote service configured, attempt HTTP RPC
        if self.base_url.startswith("http"):
            try:
                import urllib.request
                url = f"{self.base_url}/retrieval/candidates"
                payload = json.dumps(asdict(query)).encode("utf-8")
                headers = self._generate_signature_headers(payload)
                req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
                opener = (
                    urllib.request.build_opener(urllib.request.ProxyHandler({}))
                    if any(h in url for h in ["127.0.0.1", "localhost", ".internal"])
                    else urllib.request.build_opener()
                )
                with opener.open(req, timeout=5.0) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    candidates = [
                        CandidateRequirement(
                            requirement_id=c["requirement_id"],
                            title=c["title"],
                            issuing_authority=c["issuing_authority"],
                            regulatory_domain=c["regulatory_domain"],
                            confidence_score=float(c.get("confidence_score", 0.9)),
                            matched_reasons=c.get("matched_reasons", []),
                            evidence_chunk_id=c.get("evidence_chunk_id", ""),
                            official_portal_url=c.get("official_portal_url", ""),
                        )
                        for c in data.get("candidates", [])
                    ]
                    latency = round((time.perf_counter() - t0) * 1000, 2)
                    return RegulatoryCandidateResponse(
                        candidates_count=len(candidates),
                        candidates=candidates,
                        retrieval_metadata={"source": "REMOTE_RAG_RPC", "latency_ms": latency},
                    )
            except Exception as exc:
                logger.warning("Remote RAG RPC failed (%s), falling back to embedded retrieval", exc)

        # Embedded retrieval from database and knowledge fixtures
        candidates = self._embedded_candidate_discovery(query)
        latency = round((time.perf_counter() - t0) * 1000, 2)
        return RegulatoryCandidateResponse(
            candidates_count=len(candidates),
            candidates=candidates,
            retrieval_metadata={
                "source": "EMBEDDED_KNOWLEDGE_RETRIEVER",
                "latency_ms": latency,
                "index_version": "2026.09.1",
            },
        )

    def _embedded_candidate_discovery(self, query: RegulatoryCandidateQuery) -> list[CandidateRequirement]:
        """Perform deterministic candidate discovery against the authoritative knowledge base."""
        from apps.knowledge.models import RequirementDefinition
        from common.enums import KnowledgeStatus

        state = query.jurisdiction.state_code.upper()
        # Map common state abbreviations
        state_map = {
            "GJ": "GUJARAT",
            "MH": "MAHARASHTRA",
            "TN": "TAMIL NADU",
            "KA": "KARNATAKA",
            "DL": "DELHI",
            "UP": "UTTAR PRADESH",
            "TS": "TELANGANA",
            "WB": "WEST BENGAL",
        }
        resolved_state = state_map.get(state, state)

        # Query published requirements matching jurisdiction (CENTRAL or matching state)
        req_qs = RequirementDefinition.objects.filter(status=KnowledgeStatus.PUBLISHED)
        if resolved_state:
            req_qs = req_qs.filter(
                models_jurisdiction_match(resolved_state)
            )

        candidates: list[CandidateRequirement] = []
        is_mfg = (
            query.operations.manufacturing_status in ("PHYSICAL_MANUFACTURING", "MANUFACTURING")
            or "MANUFACTUR" in (query.operations.sector or "").upper()
        )

        for req in req_qs.order_by("requirement_id"):
            reasons = []
            score = 0.30
            req_name = req.name.lower()
            req_id = req.requirement_id.upper()
            req_text = f"{req_id} {req_name} {req.description}".lower()

            # 1. Jurisdiction baseline
            if req.jurisdiction == "CENTRAL":
                reasons.append("Central jurisdiction baseline")
                score += 0.10
            elif resolved_state and req.jurisdiction.upper() == resolved_state:
                reasons.append(f"State jurisdiction match: {resolved_state}")
                score += 0.20

            # 2. Factory Licensing (DISH / State Factories Act)
            is_factory_license = (
                "factory license" in req_name
                or req_id.endswith("FACTORY-LICENSE")
                or ("factory" in req_name and "license" in req_name)
            )
            if is_factory_license:
                if is_mfg:
                    workers = query.operations.worker_count or 0
                    power = query.operations.connected_load_hp or 0.0
                    if workers >= 10:
                        reasons.append(f"Worker count ({workers}) >= 10 threshold")
                        score += 0.25
                    if power > 0:
                        reasons.append(f"Connected electrical load ({power} HP)")
                        score += 0.20
                else:
                    # Non-manufacturing entities (e.g. SaaS / Services) are not factory license candidates
                    continue

            # 3. Environmental Consents (Consent to Establish / Consent to Operate)
            is_consent = (
                "consent to establish" in req_name
                or "consent to operate" in req_name
                or req_id.endswith("-CTE")
                or req_id.endswith("-CTO")
            )
            if is_consent:
                if not is_mfg and not query.environmental.generates_trade_effluent:
                    continue
                if query.environmental.generates_trade_effluent:
                    reasons.append("Trade effluent generation reported")
                    score += 0.25
                if query.environmental.dyeing_activity:
                    reasons.append("Wet chemical / textile dyeing activity")
                    score += 0.20

            # 4. Labor / Social Security Registrations
            if "epf" in req_id.lower() or "provident fund" in req_name:
                workers = query.operations.worker_count or 0
                if workers >= 20:
                    reasons.append(f"EPF worker count threshold met ({workers} >= 20)")
                    score += 0.20
            elif "esi" in req_id.lower() or "state insurance" in req_name:
                workers = query.operations.worker_count or 0
                if workers >= 10:
                    reasons.append(f"ESI worker count threshold met ({workers} >= 10)")
                    score += 0.20

            # 5. Boilers
            if "boiler" in req_id.lower() or "boiler" in req_name:
                if query.environmental.has_boiler:
                    cap = query.environmental.boiler_capacity_tph or 0.0
                    reasons.append(f"Industrial steam boiler installed ({cap} TPH)")
                    score += 0.25
                else:
                    # Explicitly no boiler -> exclude boiler registration
                    continue

            # 6. Software / Data
            if "data" in req_text or "dpdp" in req_text:
                reasons.append("Digital commercial data processing")
                score += 0.10

            ev_chunk_id = (req.evidence_refs or [""])[0] if req.evidence_refs else ""
            portal = str((req.metadata or {}).get("portal") or "")

            candidates.append(
                CandidateRequirement(
                    requirement_id=req.requirement_id,
                    title=req.name,
                    issuing_authority=req.authority,
                    regulatory_domain=req.domain,
                    confidence_score=min(round(score, 2), 0.99),
                    matched_reasons=reasons or ["General regulatory scope match"],
                    evidence_chunk_id=ev_chunk_id,
                    official_portal_url=portal,
                )
            )

        # Sort descending by confidence score
        candidates.sort(key=lambda c: -c.confidence_score)
        return candidates[:query.top_k]

    def search_evidence(self, query: EvidenceSearchQuery) -> list[EvidenceSearchResult]:
        """Perform natural language search against authoritative statutory evidence.

        Adheres to 08_RAG_SERVICE_CONTRACT.md §3.B.
        """
        from apps.evidence.models import Evidence
        from common.enums import VerificationStatus

        terms = [t.lower() for t in query.query.split() if len(t) > 2]
        qs = Evidence.objects.select_related("source").filter(
            verification_status=VerificationStatus.VERIFIED
        )

        results: list[EvidenceSearchResult] = []
        for ev in qs:
            haystack = f"{ev.evidence_id} {ev.source.title} {ev.source.authority} {ev.locator} {ev.excerpt}".lower()
            match_count = sum(1 for t in terms if t in haystack)
            if match_count > 0:
                score = round(match_count / max(len(terms), 1), 2)
                results.append(
                    EvidenceSearchResult(
                        chunk_id=ev.evidence_id,
                        source_id=ev.source.source_id,
                        source_title=ev.source.title,
                        authority=ev.source.authority,
                        content=ev.excerpt,
                        locator=ev.locator,
                        official_url=ev.source.canonical_url,
                        relevance_score=score,
                        verification_status=ev.verification_status,
                    )
                )

        results.sort(key=lambda r: -r.relevance_score)
        return results[:query.top_k]

    def get_evidence_chunk(self, chunk_id: str) -> EvidenceChunkDetail | None:
        """Direct retrieval of verbatim statutory text per 08_RAG_SERVICE_CONTRACT.md §3.C."""
        from apps.evidence.models import Evidence

        ev = Evidence.objects.select_related("source").filter(evidence_id=chunk_id).first()
        if not ev:
            return None

        content_bytes = ev.excerpt.encode("utf-8")
        computed_hash = f"sha256:{hashlib.sha256(content_bytes).hexdigest()}"

        return EvidenceChunkDetail(
            chunk_id=ev.evidence_id,
            source_id=ev.source.source_id,
            source_title=ev.source.title,
            authority=ev.source.authority,
            verbatim_text=ev.excerpt,
            locator=ev.locator,
            official_url=ev.source.canonical_url,
            content_hash=computed_hash,
            verification_status=ev.verification_status,
            effective_from=ev.effective_from.isoformat() if ev.effective_from else None,
            effective_until=ev.effective_until.isoformat() if ev.effective_until else None,
        )


def models_jurisdiction_match(state_name: str) -> Any:
    """Helper creating Q filter for central or matching state."""
    from django.db.models import Q
    return Q(jurisdiction="CENTRAL") | Q(jurisdiction__iexact=state_name)
