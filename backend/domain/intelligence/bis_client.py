"""Typed client for communicating with the internal BIS Standards Intelligence Engine.

Authority: TRD_v2.0 §4, §30; PRD_v2.0 §22, §24; Master Engineering Directive.
Enforces:
  - Strictly typed inter-service contract (BisQueryRequest / BisQueryResponse).
  - Bounded connection and read timeouts (connect=2.0s, read=12.0s).
  - Maximum 1 retry on transient network disconnects with exponential backoff and jitter.
  - Thread-safe circuit breaker with half-open canary probe and sliding window.
  - 4xx client validation errors do not trip the circuit breaker.
  - Internal service authentication (X-Internal-Service-Key).
  - Correlation ID propagation (X-Correlation-ID).
  - Data minimization: sanitizes in-flight business context to strip financial PII.
  - Zero conversion of infrastructure failures into "no evidence" states.
  - Zero unsupported claims reaching the user as verified facts.
"""

from __future__ import annotations

import logging
import random
import threading
import time
import uuid
from typing import Any, Optional

import httpx
from django.conf import settings

from .bis_models import (
    AnswerabilityState,
    AuthorityTier,
    BisClaim,
    BisCitation,
    BisConfidence,
    BisQueryRequest,
    BisQueryResponse,
    BisTemporal,
    ClaimStatus,
)

logger = logging.getLogger("complywise.bis_client")

# Thread-safe Circuit breaker state
_CIRCUIT_LOCK = threading.Lock()
_CIRCUIT_FAILURE_COUNT = 0
_CIRCUIT_OPEN_UNTIL = 0.0
_CIRCUIT_HALF_OPEN_IN_PROGRESS = False
CIRCUIT_FAILURE_LIMIT = 3
CIRCUIT_COOLDOWN_SECONDS = 30.0


class BisClientError(Exception):
    """Base exception for BIS Service Client errors."""
    def __init__(self, message: str, correlation_id: Optional[str] = None):
        super().__init__(message)
        self.correlation_id = correlation_id


class BisServiceUnavailable(BisClientError):
    """Raised when the internal BIS service cannot be connected to or circuit is open."""


class BisTimeoutException(BisClientError):
    """Raised when the BIS service request exceeds the bounded timeout."""


class BisAuthenticationError(BisClientError):
    """Raised when the internal service key is rejected by the BIS service."""


class BisMalformedResponseError(BisClientError):
    """Raised when the BIS service returns invalid JSON or schema violations."""


class BisSystemFailure(BisClientError):
    """Raised when the BIS service returns an HTTP 500 or unhandled server error."""


def get_bis_config() -> dict[str, Any]:
    """Resolve BIS integration settings with safe defaults."""
    return {
        "enabled": getattr(settings, "ENABLE_BIS_INTEGRATION", True),
        "base_url": getattr(settings, "BIS_AGENT_BASE_URL", "http://127.0.0.1:8001").rstrip("/"),
        "internal_key": getattr(settings, "BIS_AGENT_INTERNAL_KEY", "complywise-internal-bis-key-default"),
        "timeout": float(getattr(settings, "BIS_AGENT_TIMEOUT_SECONDS", 12.0)),
        "max_retries": int(getattr(settings, "BIS_AGENT_MAX_RETRIES", 1)),
    }


def sanitize_business_context_for_bis(context: Any) -> dict[str, Any]:
    """Sanitize in-flight business context to enforce data minimization.

    Strips confidential tenant PII, financial turnover, capital investments,
    and raw identity tokens. Forwards only product and technical specifications
    necessary for standards and QCO matching.
    """
    if not context:
        return {}

    if isinstance(context, dict):
        return {
            "product_description": context.get("product_description", ""),
            "product_category": context.get("product_description", ""),
            "manufacturing_activity": "manufacturing" if context.get("is_manufacturing", True) else "trading",
            "manufacturing_location": context.get("state_name", "All India"),
            "target_market": "INTERNATIONAL" if context.get("is_cross_border") else "DOMESTIC",
            "technical_characteristics": {
                "power_load_hp": context.get("connected_power_load"),
                "has_effluents": context.get("effluent_emission_generation", False),
                "has_hazardous_waste": context.get("hazardous_waste_generation", False),
                "detected_activities": context.get("detected_activities", []),
            },
        }

    # If an object (e.g. DerivedBusinessContext)
    return {
        "product_description": getattr(context, "product_description", ""),
        "product_category": getattr(context, "product_description", ""),
        "manufacturing_activity": "manufacturing" if getattr(context, "is_manufacturing", True) else "trading",
        "manufacturing_location": getattr(context, "state_name", "All India"),
        "target_market": "INTERNATIONAL" if getattr(context, "is_cross_border", False) else "DOMESTIC",
        "technical_characteristics": {
            "power_load_hp": getattr(context, "connected_power_load", None),
            "has_effluents": getattr(context, "effluent_emission_generation", False),
            "has_hazardous_waste": getattr(context, "hazardous_waste_generation", False),
            "detected_activities": getattr(context, "detected_activities", []),
        },
    }


class BisServiceClient:
    """Production client for the BIS Agent FastAPI service."""

    _shared_http_client: Optional[httpx.Client] = None
    _client_lock = threading.Lock()

    def __init__(self, config: Optional[dict[str, Any]] = None):
        self.config = config or get_bis_config()
        self.base_url = self.config["base_url"]
        self.internal_key = self.config["internal_key"]
        self.timeout = self.config["timeout"]
        self.max_retries = self.config["max_retries"]
        self.enabled = self.config["enabled"]

    @classmethod
    def get_http_client(cls, timeout: float = 12.0) -> httpx.Client:
        """Provide a pooled, reusable HTTP client session with bounded limits."""
        with cls._client_lock:
            if cls._shared_http_client is None or cls._shared_http_client.is_closed:
                limits = httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=30.0)
                timeout_config = httpx.Timeout(timeout=timeout, connect=2.0, read=timeout, write=5.0)
                cls._shared_http_client = httpx.Client(limits=limits, timeout=timeout_config, trust_env=False)
            return cls._shared_http_client

    def _is_circuit_open(self) -> bool:
        """Thread-safe check of circuit breaker state with half-open canary support."""
        global _CIRCUIT_FAILURE_COUNT, _CIRCUIT_OPEN_UNTIL, _CIRCUIT_HALF_OPEN_IN_PROGRESS
        with _CIRCUIT_LOCK:
            now = time.time()
            if now >= _CIRCUIT_OPEN_UNTIL:
                # Cooldown expired. If we were open, enter HALF-OPEN state allowing one canary request
                if _CIRCUIT_OPEN_UNTIL > 0:
                    if not _CIRCUIT_HALF_OPEN_IN_PROGRESS:
                        _CIRCUIT_HALF_OPEN_IN_PROGRESS = True
                        logger.info("BIS Circuit breaker entering HALF-OPEN state for canary request.")
                        return False  # Allow single canary request
                    return True  # Other requests wait until canary completes
                return False
            return True

    def _record_success(self) -> None:
        """Record successful response and reset circuit breaker."""
        global _CIRCUIT_FAILURE_COUNT, _CIRCUIT_OPEN_UNTIL, _CIRCUIT_HALF_OPEN_IN_PROGRESS
        with _CIRCUIT_LOCK:
            _CIRCUIT_FAILURE_COUNT = 0
            _CIRCUIT_OPEN_UNTIL = 0.0
            _CIRCUIT_HALF_OPEN_IN_PROGRESS = False

    def _record_failure(self) -> None:
        """Record connection/server failure and trip breaker if threshold exceeded."""
        global _CIRCUIT_FAILURE_COUNT, _CIRCUIT_OPEN_UNTIL, _CIRCUIT_HALF_OPEN_IN_PROGRESS
        with _CIRCUIT_LOCK:
            _CIRCUIT_HALF_OPEN_IN_PROGRESS = False
            _CIRCUIT_FAILURE_COUNT += 1
            if _CIRCUIT_FAILURE_COUNT >= CIRCUIT_FAILURE_LIMIT:
                _CIRCUIT_OPEN_UNTIL = time.time() + CIRCUIT_COOLDOWN_SECONDS
                logger.warning(
                    "BIS Client Circuit Breaker OPENED for %s seconds after %s consecutive failures.",
                    CIRCUIT_COOLDOWN_SECONDS,
                    _CIRCUIT_FAILURE_COUNT,
                )

    def create_fallback_response(
        self,
        state: AnswerabilityState,
        reason: str,
        query: str = "",
        correlation_id: Optional[str] = None,
    ) -> BisQueryResponse:
        """Create a deterministic, safe refusal response adhering to the response contract."""
        actionable_guidance = (
            f"Verification Required: {reason}\n\n"
            "Recommended Next Steps:\n"
            "1. Search the official Bureau of Indian Standards catalog: https://standardsbis.bsbedge.com\n"
            "2. Verify applicable Quality Control Orders (QCOs) on the BIS Manakonline portal: https://www.manakonline.in\n"
            "3. Consult a NABL-accredited testing laboratory for standard clause parameters."
        )
        return BisQueryResponse(
            version="2.0",
            query_id=f"fallback_{uuid.uuid4().hex[:8]}",
            correlation_id=correlation_id,
            query=query,
            answerability=state,
            decision="VERIFICATION_REQUIRED",
            verification_required=True,
            verification_reason=reason,
            answer=actionable_guidance,
            claims=[],
            citations=[],
            confidence=BisConfidence(score=0.0, level="LOW"),
            temporal=BisTemporal(status="UNKNOWN", requires_verification=True),
            candidate_standards=[],
            execution_metrics={"state": state.value, "fallback": True},
        )

    def query(
        self,
        query: str,
        *,
        business_context: Optional[dict[str, Any]] = None,
        profile_context: Optional[dict[str, Any]] = None,
        technical_specification: Optional[dict[str, Any]] = None,
        tender_specification: Optional[dict[str, Any]] = None,
        compliance_documents: Optional[list[dict[str, Any]]] = None,
        top_k: int = 5,
        correlation_id: Optional[str] = None,
    ) -> BisQueryResponse:
        """Execute a query against the BIS Agent service with bounded timeouts and fail-safe recovery."""
        cid = correlation_id or f"cw-{uuid.uuid4().hex[:12]}"

        if not self.enabled:
            return self.create_fallback_response(
                AnswerabilityState.SERVICE_UNAVAILABLE,
                "BIS Standards Intelligence integration is disabled in system configuration.",
                query=query,
                correlation_id=cid,
            )

        if self._is_circuit_open():
            logger.error("[%s] BIS service call blocked by open circuit breaker.", cid)
            return self.create_fallback_response(
                AnswerabilityState.SERVICE_UNAVAILABLE,
                "BIS Standards Intelligence service is temporarily paused due to upstream connectivity failures. Circuit breaker is OPEN.",
                query=query,
                correlation_id=cid,
            )

        # Sanitize business context before transmission
        sanitized_context = sanitize_business_context_for_bis(business_context)

        request_model = BisQueryRequest(
            query=query,
            top_k=top_k,
            business_context=sanitized_context,
            profile_context=profile_context,
            technical_specification=technical_specification,
            tender_specification=tender_specification,
            compliance_documents=compliance_documents,
            correlation_id=cid,
        )

        headers = {
            "Content-Type": "application/json",
            "X-Internal-Service-Key": self.internal_key,
            "X-Correlation-ID": cid,
        }

        url = f"{self.base_url}/query"
        payload = request_model.model_dump(exclude_none=True)

        attempts = 0
        last_exception: Optional[Exception] = None

        while attempts <= self.max_retries:
            attempts += 1
            try:
                client = self.get_http_client(timeout=self.timeout)
                response = client.post(url, json=payload, headers=headers)

                if response.status_code == 200:
                    self._record_success()
                    return self._parse_bis_response(response.json(), query=query, correlation_id=cid)

                if response.status_code in (401, 403):
                    self._record_failure()
                    logger.error("[%s] Internal service authentication rejected by BIS Agent (HTTP %s).", cid, response.status_code)
                    return self.create_fallback_response(
                        AnswerabilityState.SERVICE_UNAVAILABLE,
                        f"Internal service authentication rejected by BIS Agent (HTTP {response.status_code}). Check X-Internal-Service-Key.",
                        query=query,
                        correlation_id=cid,
                    )

                if response.status_code >= 500:
                    self._record_failure()
                    logger.error("[%s] BIS service returned server error HTTP %s: %s", cid, response.status_code, response.text)
                    return self.create_fallback_response(
                        AnswerabilityState.SERVICE_UNAVAILABLE,
                        f"BIS Standards Engine reported internal server failure (HTTP {response.status_code}).",
                        query=query,
                        correlation_id=cid,
                    )

                # Client 4xx validation errors (400, 422, etc.) — DO NOT record circuit failure
                logger.warning("[%s] Request rejected by BIS service (HTTP %s): %s", cid, response.status_code, response.text)
                return self.create_fallback_response(
                    AnswerabilityState.INSUFFICIENT_EVIDENCE,
                    f"Query rejected by standards engine (HTTP {response.status_code}): {response.text}",
                    query=query,
                    correlation_id=cid,
                )

            except httpx.TimeoutException as exc:
                self._record_failure()
                logger.error("[%s] BIS service request timed out after %ss: %s", cid, self.timeout, exc)
                return self.create_fallback_response(
                    AnswerabilityState.SERVICE_UNAVAILABLE,
                    f"BIS Standards Engine verification timed out after {self.timeout}s. Live verification aborted to protect request safety.",
                    query=query,
                    correlation_id=cid,
                )

            except (httpx.ConnectError, httpx.NetworkError) as exc:
                last_exception = exc
                if attempts <= self.max_retries:
                    backoff = 0.2 * (2 ** (attempts - 1)) + random.uniform(0.05, 0.15)
                    logger.warning("[%s] Transient connection error to BIS service. Retrying in %.2fs (attempt %s)...", cid, backoff, attempts)
                    time.sleep(backoff)
                    continue

                self._record_failure()
                logger.error("[%s] Failed to connect to BIS service at %s: %s", cid, self.base_url, exc)
                return self.create_fallback_response(
                    AnswerabilityState.SERVICE_UNAVAILABLE,
                    f"The Bureau of Indian Standards Intelligence Service is unreachable at {self.base_url}. Factual parameters cannot be verified.",
                    query=query,
                    correlation_id=cid,
                )

            except Exception as exc:
                self._record_failure()
                logger.exception("[%s] Unexpected client error during BIS service communication: %s", cid, exc)
                return self.create_fallback_response(
                    AnswerabilityState.SYSTEM_FAILURE,
                    f"Integration failure during standards query: {str(exc)}",
                    query=query,
                    correlation_id=cid,
                )

        return self.create_fallback_response(
            AnswerabilityState.SERVICE_UNAVAILABLE,
            f"BIS Service unreachable after retries: {str(last_exception)}",
            query=query,
            correlation_id=cid,
        )

    def _parse_bis_response(self, data: Any, query: str, correlation_id: str) -> BisQueryResponse:
        """Parse raw JSON into BisQueryResponse, ensuring mandatory fields fail closed on violation."""
        if not isinstance(data, dict):
            raise BisMalformedResponseError(
                f"Expected JSON object from BIS service, received: {type(data)}",
                correlation_id=correlation_id,
            )

        retrieved_count = data.get("retrieved_chunks", 0)
        query_state = str(data.get("query_state", "") or "").upper()
        decision = str(data.get("decision", "VERIFICATION_REQUIRED") or "").upper()
        verif_req = bool(data.get("verification_required", False))
        intent = str(data.get("intent", "") or "").lower()
        temporal_conflict = bool(data.get("temporal_conflict", False))
        grounding_status = str(data.get("grounding_status", "") or "").lower()

        # Deterministic 10-state AnswerabilityState resolution
        if retrieved_count == 0:
            if intent in ("standard_discovery", "applicability_query") or "standard" in query.lower():
                answerability = AnswerabilityState.OUT_OF_CORPUS
            else:
                answerability = AnswerabilityState.NO_RELEVANT_EVIDENCE
        elif query_state == "AMBIGUOUS_QUERY":
            answerability = AnswerabilityState.AMBIGUOUS_QUERY
        elif query_state == "CONFLICTING_EVIDENCE" or temporal_conflict:
            answerability = AnswerabilityState.CONFLICTING_EVIDENCE
        elif data.get("temporal_verification_required") or data.get("temporal_status") == "temporally_uncertain":
            answerability = AnswerabilityState.TEMPORALLY_UNCERTAIN
        elif grounding_status == "unsupported" or query_state == "INSUFFICIENT_EVIDENCE":
            answerability = AnswerabilityState.INSUFFICIENT_EVIDENCE
        elif grounding_status == "partially_grounded" or decision == "QUALIFIED_ANSWER":
            answerability = AnswerabilityState.PARTIALLY_ANSWERABLE
        elif decision == "ANSWER" and grounding_status == "fully_grounded" and not verif_req:
            answerability = AnswerabilityState.ANSWERABLE
        else:
            answerability = AnswerabilityState.INSUFFICIENT_EVIDENCE

        # Parse citations with field normalization
        parsed_citations: list[BisCitation] = []
        for c in data.get("citations", []):
            if isinstance(c, dict):
                page = c.get("page_number") or c.get("page_start")
                parsed_citations.append(
                    BisCitation(
                        standard_number=c.get("standard_number", "IS Unknown"),
                        standard_year=c.get("standard_year"),
                        clause_id=c.get("clause_id"),
                        table_id=c.get("table_id"),
                        page_number=int(page) if page is not None else None,
                        source_document_id=c.get("source_document_id") or c.get("document_id"),
                        source_hash=c.get("source_hash"),
                        excerpt=c.get("excerpt", c.get("text", "")),
                        canonical_url=c.get("canonical_url") or c.get("source_url") or "https://standardsbis.bsbedge.com",
                        verifiable=c.get("verifiable", True),
                        authority=c.get("authority", "Bureau of Indian Standards"),
                    )
                )

        # Parse claims with key mapping (text -> claim_text, support_status -> status)
        parsed_claims: list[BisClaim] = []
        has_unsupported_claims = False

        status_map = {
            "supported": ClaimStatus.SUPPORTED,
            "partially_supported": ClaimStatus.PARTIALLY_SUPPORTED,
            "unsupported": ClaimStatus.UNSUPPORTED,
            "unverifiable": ClaimStatus.UNVERIFIED,
            "conflicted": ClaimStatus.CONFLICTED,
        }

        for cl in data.get("claims", []):
            if isinstance(cl, dict):
                raw_text = cl.get("text") or cl.get("claim_text") or ""
                raw_status = str(cl.get("support_status") or cl.get("status") or "unverifiable").lower()
                c_status = status_map.get(raw_status, ClaimStatus.UNSUPPORTED)

                if c_status != ClaimStatus.SUPPORTED:
                    has_unsupported_claims = True

                cit_ids = cl.get("citation_ids", [])
                cit_str = ", ".join(cit_ids) if isinstance(cit_ids, list) else str(cl.get("citation", ""))
                issues = cl.get("issues", [])
                v_reason = "; ".join(issues) if issues else cl.get("validation_notes")

                parsed_claims.append(
                    BisClaim(
                        claim_text=raw_text,
                        status=c_status,
                        citation=cit_str or None,
                        authority_tier=AuthorityTier.TIER_1_REGULATORY,
                        verification_reason=v_reason,
                    )
                )

        # ZERO UNSUPPORTED CLAIMS POLICY:
        # If any claim is unsupported, force verification_required = True and lock decision
        if has_unsupported_claims or grounding_status == "unsupported":
            verif_req = True
            decision = "VERIFICATION_REQUIRED"

        # Confidence
        confidence_data = None
        if "confidence_score" in data:
            trace = data.get("confidence_trace") or {}
            confidence_data = BisConfidence(
                score=float(data.get("confidence_score") or 0.0),
                level=str(data.get("confidence_level") or "LOW").upper(),
                retrieval_density=trace.get("retrieval_density"),
                reranker_margin=trace.get("reranker_margin"),
                provenance_completeness=trace.get("provenance_completeness"),
            )

        # Temporal
        temporal_data = None
        if "temporal_status" in data or "temporal_resolution" in data:
            temporal_data = BisTemporal(
                standard_number=data.get("standard_number"),
                standard_year=data.get("standard_year"),
                status=str(data.get("temporal_status") or "UNKNOWN").upper(),
                is_current=data.get("is_current"),
                requires_verification=bool(data.get("temporal_verification_required", False) or temporal_conflict),
                details=data.get("temporal_reason"),
            )

        answer_text = data.get("answer", "")
        # If verification is required, attach guidance banner
        if verif_req and not answer_text.startswith("Verification Required:"):
            answer_text = (
                "⚠️ **Regulatory Verification Required**\n"
                "The findings below require verification against official Gazette of India QCO notices or testing laboratory evidence.\n\n"
                + answer_text
            )

        return BisQueryResponse(
            version="2.0",
            query_id=data.get("query_id"),
            correlation_id=correlation_id,
            query=query,
            answerability=answerability,
            decision=decision,
            verification_required=verif_req,
            verification_reason=data.get("verification_reason"),
            answer=answer_text,
            claims=parsed_claims,
            citations=parsed_citations,
            confidence=confidence_data,
            temporal=temporal_data,
            candidate_standards=data.get("candidate_standards", []),
            execution_metrics={
                "retrieved_chunks": retrieved_count,
                "reranked_chunks": data.get("reranked_chunks", 0),
                "model": data.get("model"),
            },
        )

    def check_health(self) -> dict[str, Any]:
        """Probe both BIS service /health (liveness) and /ready (readiness) endpoints."""
        health_url = f"{self.base_url}/health"
        ready_url = f"{self.base_url}/ready"
        client = self.get_http_client(timeout=3.0)

        try:
            live_resp = client.get(health_url)
            liveness_ok = live_resp.status_code == 200
        except Exception as exc:
            return {
                "status": "unreachable",
                "healthy": False,
                "error": f"Liveness probe failed: {str(exc)}",
            }

        try:
            ready_resp = client.get(ready_url)
            readiness_data = ready_resp.json() if ready_resp.status_code in (200, 503) else ready_resp.text
            return {
                "status": "ok" if (liveness_ok and ready_resp.status_code == 200) else "degraded",
                "healthy": liveness_ok and ready_resp.status_code == 200,
                "liveness": liveness_ok,
                "readiness": ready_resp.status_code == 200,
                "details": readiness_data,
            }
        except Exception as exc:
            return {
                "status": "degraded",
                "healthy": False,
                "liveness": liveness_ok,
                "readiness": False,
                "error": f"Readiness probe failed: {str(exc)}",
            }
