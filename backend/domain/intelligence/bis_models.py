"""Versioned Inter-Service Contract between ComplyWise and BIS Agent.

Authority: TRD_v2.0 §4, §30; PRD_v2.0 §22, §24; Master Engineering Directive.
Version: 2.0.0

This module defines the canonical, machine-readable data contract for all
standards intelligence, answerability evaluation, claim-level validation,
and evidence-grade provenance exchanged between ComplyWise and the BIS Agent.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class AnswerabilityState(str, Enum):
    """Explicit 10-state answerability model evaluated before answer generation."""
    ANSWERABLE = "ANSWERABLE"
    PARTIALLY_ANSWERABLE = "PARTIALLY_ANSWERABLE"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    NO_RELEVANT_EVIDENCE = "NO_RELEVANT_EVIDENCE"
    CONFLICTING_EVIDENCE = "CONFLICTING_EVIDENCE"
    AMBIGUOUS_QUERY = "AMBIGUOUS_QUERY"
    OUT_OF_CORPUS = "OUT_OF_CORPUS"
    TEMPORALLY_UNCERTAIN = "TEMPORALLY_UNCERTAIN"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    SYSTEM_FAILURE = "SYSTEM_FAILURE"


class ClaimStatus(str, Enum):
    """Claim-level support status ensuring zero ungrounded claims reach the user."""
    SUPPORTED = "SUPPORTED"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    UNSUPPORTED = "UNSUPPORTED"
    CONFLICTED = "CONFLICTED"
    UNVERIFIED = "UNVERIFIED"


class AuthorityTier(int, Enum):
    """Hierarchical source authority classification."""
    TIER_1_REGULATORY = 1      # Official BIS Gazette Orders, Indian Standards (IS), STI
    TIER_2_STATUTORY_PORTAL = 2 # Manakonline official schedules, DPIIT QCO orders
    TIER_3_TECHNICAL_DATA = 3   # NABL Lab Test Reports, Factory MTCs
    TIER_4_SECONDARY_INFO = 4   # BIS Website FAQs, technical guidance summaries
    TIER_5_UNTRUSTED = 5       # General web content, unverified manufacturer brochures


class BisClaim(BaseModel):
    """An atomic technical or regulatory claim decomposed from the answer."""
    model_config = ConfigDict(extra="ignore")

    claim_text: str
    status: ClaimStatus = ClaimStatus.UNVERIFIED
    citation: Optional[str] = None
    authority_tier: int = AuthorityTier.TIER_1_REGULATORY
    verification_reason: Optional[str] = None


class BisCitation(BaseModel):
    """Verified citation anchored to an authoritative source chunk."""
    model_config = ConfigDict(extra="ignore")

    standard_number: str
    standard_year: Optional[int] = None
    clause_id: Optional[str] = None
    table_id: Optional[str] = None
    page_number: Optional[int] = None
    source_document_id: Optional[str] = None
    source_hash: Optional[str] = None
    excerpt: str = ""
    canonical_url: Optional[str] = None
    verifiable: bool = True
    authority: str = "Bureau of Indian Standards"


class BisConfidence(BaseModel):
    """Multi-factor bounded confidence scores evaluated deterministically."""
    model_config = ConfigDict(extra="ignore")

    score: float = 0.0
    level: str = "LOW"
    retrieval_density: Optional[float] = None
    reranker_margin: Optional[float] = None
    provenance_completeness: Optional[float] = None


class BisTemporal(BaseModel):
    """Temporal currentness and version lifecycle state."""
    model_config = ConfigDict(extra="ignore")

    standard_number: Optional[str] = None
    standard_year: Optional[int] = None
    status: str = "UNKNOWN"
    is_current: Optional[bool] = None
    gazette_enforced: Optional[bool] = None
    requires_verification: bool = False
    details: Optional[str] = None


class BisQueryRequest(BaseModel):
    """Structured request payload sent to the BIS Agent service."""
    model_config = ConfigDict(extra="ignore")

    query: str
    top_k: Optional[int] = 5
    business_context: Optional[dict[str, Any]] = None
    profile_context: Optional[dict[str, Any]] = None
    technical_specification: Optional[dict[str, Any]] = None
    tender_specification: Optional[dict[str, Any]] = None
    compliance_documents: Optional[list[dict[str, Any]]] = None
    correlation_id: Optional[str] = None


class BisQueryResponse(BaseModel):
    """Canonical versioned response returned from the BIS Agent service."""
    model_config = ConfigDict(extra="ignore")

    version: str = "2.0"
    query_id: Optional[str] = None
    correlation_id: Optional[str] = None
    query: str = ""
    answerability: AnswerabilityState = AnswerabilityState.NO_RELEVANT_EVIDENCE
    decision: str = "VERIFICATION_REQUIRED"
    verification_required: bool = True
    verification_reason: Optional[str] = None
    answer: str = ""
    claims: list[BisClaim] = Field(default_factory=list)
    citations: list[BisCitation] = Field(default_factory=list)
    confidence: Optional[BisConfidence] = None
    temporal: Optional[BisTemporal] = None
    candidate_standards: list[dict[str, Any]] = Field(default_factory=list)
    execution_metrics: dict[str, Any] = Field(default_factory=dict)
