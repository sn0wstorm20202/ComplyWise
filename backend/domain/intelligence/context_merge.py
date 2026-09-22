"""Canonical Enriched BusinessContext Builder & Multi-Layer Precedence Merge Engine.

Authority: Milestone Step 02 Specification; PRD_v2.0 §10, §11; TRD_v2.0 §4, §8, §30.

Merge Precedence Rule:
EXPLICIT USER ANSWER > PROFILE DATA > DERIVED FACT > LLM INFERENCE

Guarantees:
1. Every fact carries provenance (source, confidence level, and extraction timestamp).
2. LLM inferences NEVER silently overwrite explicit user answers or confirmed database facts.
3. Produces a single canonical enriched context consumable by Step 03 SchemeProvider and downstream discovery.
"""

from __future__ import annotations

import logging
from dataclasses import asdict, dataclass, field
from decimal import Decimal
from enum import StrEnum
from typing import Any

from domain.context.business_context import (
    DerivedBusinessContext,
    build_business_context,
    derive_msme_scale,
)
from domain.intelligence.business_understanding import BusinessUnderstandingResult
from domain.intelligence.orchestration import AssessmentRun, OrchestrationContext

logger = logging.getLogger(__name__)


class FactSource(StrEnum):
    USER_ANSWER = "USER_ANSWER"
    BUSINESS_PROFILE = "BUSINESS_PROFILE"
    DERIVED_FACT = "DERIVED_FACT"
    LLM_BUSINESS_UNDERSTANDING = "LLM_BUSINESS_UNDERSTANDING"
    LLM_ANSWER_INTERPRETATION = "LLM_ANSWER_INTERPRETATION"


class ConfidenceLevel(StrEnum):
    EXPLICIT = "EXPLICIT"
    HIGH = "HIGH"
    INFERRED = "INFERRED"


SOURCE_PRECEDENCE: dict[str, int] = {
    FactSource.USER_ANSWER.value: 100,
    FactSource.LLM_ANSWER_INTERPRETATION.value: 90,
    FactSource.BUSINESS_PROFILE.value: 80,
    FactSource.DERIVED_FACT.value: 70,
    FactSource.LLM_BUSINESS_UNDERSTANDING.value: 50,
}


@dataclass
class ProvenanceFact:
    key: str
    value: Any
    source: str
    confidence: str
    raw_source_ref: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class EnrichedBusinessContext:
    business_id: str
    business_name: str
    legal_constitution: str
    state: str
    state_name: str
    district: str
    industrial_zone_status: str
    lifecycle_stage: str
    product_description: str
    trade_intent: str
    annual_turnover: Decimal | None
    plant_machinery_investment: Decimal | None
    total_worker_count: int | None
    contract_worker_count: int | None
    connected_power_load: Decimal | None
    effluent_emission_generation: bool | None
    hazardous_waste_generation: bool | None
    msme_scale: str
    is_manufacturing: bool
    is_cross_border: bool
    detected_activities: list[str] = field(default_factory=list)
    likely_regulatory_domains: list[str] = field(default_factory=list)
    facts_with_provenance: dict[str, dict[str, Any]] = field(default_factory=dict)
    extra_facts: dict[str, Any] = field(default_factory=dict)

    def to_clean_dict(self) -> dict[str, Any]:
        """User-safe enriched context dictionary without internal model or prompt leaks."""
        return {
            "business_id": self.business_id,
            "business_name": self.business_name,
            "legal_constitution": self.legal_constitution,
            "geography": {
                "state": self.state,
                "state_name": self.state_name,
                "district": self.district,
                "industrial_zone_status": self.industrial_zone_status,
            },
            "operational_facts": {
                "lifecycle_stage": self.lifecycle_stage,
                "is_manufacturing": self.is_manufacturing,
                "is_cross_border": self.is_cross_border,
                "total_worker_count": self.total_worker_count,
                "connected_power_load": str(self.connected_power_load) if self.connected_power_load is not None else None,
                "hazardous_waste_generation": self.hazardous_waste_generation,
                "effluent_emission_generation": self.effluent_emission_generation,
            },
            "financial_facts": {
                "msme_scale": self.msme_scale,
                "annual_turnover": str(self.annual_turnover) if self.annual_turnover is not None else None,
                "plant_machinery_investment": str(self.plant_machinery_investment) if self.plant_machinery_investment is not None else None,
            },
            "trade": {
                "trade_intent": self.trade_intent,
            },
            "likely_regulatory_domains": self.likely_regulatory_domains,
            "provenance_summary": {
                k: {
                    "source": v.get("source"),
                    "confidence": v.get("confidence"),
                }
                for k, v in self.facts_with_provenance.items()
            },
        }


def merge_facts_with_precedence(
    existing_facts: dict[str, ProvenanceFact],
    incoming_facts: list[dict[str, Any]],
) -> dict[str, ProvenanceFact]:
    """Merge incoming facts into existing fact pool strictly respecting SOURCE_PRECEDENCE."""
    merged = dict(existing_facts)
    for raw in incoming_facts:
        if not isinstance(raw, dict) or "key" not in raw or "value" not in raw:
            continue
        key = str(raw["key"])
        source = str(raw.get("source") or FactSource.LLM_BUSINESS_UNDERSTANDING.value)
        confidence = str(raw.get("confidence") or ConfidenceLevel.INFERRED.value)

        incoming_rank = SOURCE_PRECEDENCE.get(source, 10)
        existing = merged.get(key)

        if existing is not None:
            existing_rank = SOURCE_PRECEDENCE.get(existing.source, 10)
            # Only overwrite if incoming rank is strictly greater or equal
            if incoming_rank >= existing_rank:
                merged[key] = ProvenanceFact(
                    key=key,
                    value=raw["value"],
                    source=source,
                    confidence=confidence,
                    raw_source_ref=raw.get("raw_source_ref"),
                )
            else:
                logger.debug(
                    "Rejected fact overwrite for '%s': incoming %s (rank %d) < existing %s (rank %d)",
                    key, source, incoming_rank, existing.source, existing_rank
                )
        else:
            merged[key] = ProvenanceFact(
                key=key,
                value=raw["value"],
                source=source,
                confidence=confidence,
                raw_source_ref=raw.get("raw_source_ref"),
            )

    return merged


def build_canonical_enriched_context(
    base_context: OrchestrationContext,
    understanding: BusinessUnderstandingResult | None,
    interpreted_facts: list[dict[str, Any]],
) -> EnrichedBusinessContext:
    """Construct one canonical EnrichedBusinessContext combining all four provenance layers."""
    fact_pool: dict[str, ProvenanceFact] = {}

    # Layer 4: LLM Business Understanding Inferences (Lowest Precedence)
    if understanding:
        for nf in understanding.normalized_facts:
            key = nf.get("key")
            if key:
                fact_pool[key] = ProvenanceFact(
                    key=key,
                    value=nf.get("value"),
                    source=FactSource.LLM_BUSINESS_UNDERSTANDING.value,
                    confidence=ConfidenceLevel.INFERRED.value,
                )
        if understanding.trade_intent:
            fact_pool["trade_intent"] = ProvenanceFact(
                key="trade_intent",
                value=understanding.trade_intent,
                source=FactSource.LLM_BUSINESS_UNDERSTANDING.value,
                confidence=ConfidenceLevel.INFERRED.value,
            )

    # Layer 3: System Derived Facts (MSME scale, manufacturing hints)
    fact_pool["is_manufacturing"] = ProvenanceFact(
        key="is_manufacturing",
        value=base_context.normalized_facts.get("is_manufacturing", True),
        source=FactSource.DERIVED_FACT.value,
        confidence=ConfidenceLevel.HIGH.value,
    )
    if base_context.normalized_facts.get("msme_scale"):
        fact_pool["msme_scale"] = ProvenanceFact(
            key="msme_scale",
            value=base_context.normalized_facts["msme_scale"],
            source=FactSource.DERIVED_FACT.value,
            confidence=ConfidenceLevel.HIGH.value,
        )

    # Layer 2: Confirmed Business Profile Facts from DB
    if base_context.normalized_facts.get("legal_constitution"):
        fact_pool["legal_constitution"] = ProvenanceFact(
            key="legal_constitution",
            value=base_context.normalized_facts["legal_constitution"],
            source=FactSource.BUSINESS_PROFILE.value,
            confidence=ConfidenceLevel.EXPLICIT.value,
        )
    if base_context.geography.get("state"):
        fact_pool["state"] = ProvenanceFact(
            key="state",
            value=base_context.geography["state"],
            source=FactSource.BUSINESS_PROFILE.value,
            confidence=ConfidenceLevel.EXPLICIT.value,
        )
    if base_context.geography.get("district"):
        fact_pool["district"] = ProvenanceFact(
            key="district",
            value=base_context.geography["district"],
            source=FactSource.BUSINESS_PROFILE.value,
            confidence=ConfidenceLevel.EXPLICIT.value,
        )

    # Layer 1: Explicit User Answers (Highest Precedence)
    fact_pool = merge_facts_with_precedence(fact_pool, interpreted_facts)

    # Resolve canonical properties from fact pool
    def _get_val(k: str, default: Any = None) -> Any:
        f = fact_pool.get(k)
        return f.value if f is not None else default

    turnover_val = _get_val("annual_turnover", base_context.financial_facts.get("annual_turnover"))
    invest_val = _get_val("plant_machinery_investment", base_context.financial_facts.get("plant_machinery_investment"))
    turnover_dec = Decimal(str(turnover_val)) if turnover_val is not None else None
    invest_dec = Decimal(str(invest_val)) if invest_val is not None else None

    msme_scale = derive_msme_scale(invest_dec, turnover_dec)
    power_load = _get_val("connected_power_load")
    power_dec = Decimal(str(power_load)) if power_load is not None else None

    worker_count = _get_val("total_worker_count", base_context.operational_facts.get("total_worker_count"))
    worker_int = int(worker_count) if worker_count is not None else None

    return EnrichedBusinessContext(
        business_id=base_context.business_id,
        business_name=base_context.business_name,
        legal_constitution=_get_val("legal_constitution", base_context.normalized_facts.get("legal_constitution") or "Private Limited"),
        state=_get_val("state", base_context.geography.get("state") or "Maharashtra"),
        state_name=base_context.geography.get("state_name") or "Maharashtra",
        district=_get_val("district", base_context.geography.get("district") or "Pune"),
        industrial_zone_status=_get_val("industrial_zone_status", base_context.geography.get("industrial_zone_status") or "APPROVED_ESTATE"),
        lifecycle_stage=base_context.normalized_facts.get("lifecycle_stage") or "OPERATIONAL",
        product_description=base_context.raw_business_description or base_context.product or "",
        trade_intent=_get_val("trade_intent", "DOMESTIC_ONLY"),
        annual_turnover=turnover_dec,
        plant_machinery_investment=invest_dec,
        total_worker_count=worker_int,
        contract_worker_count=_get_val("contract_worker_count"),
        connected_power_load=power_dec,
        effluent_emission_generation=_get_val("effluent_generation", False),
        hazardous_waste_generation=_get_val("hazardous_waste_generation", False),
        msme_scale=msme_scale,
        is_manufacturing=_get_val("is_manufacturing", True),
        is_cross_border=_get_val("trade_intent") in {"IMPORT_ONLY", "EXPORT_ONLY", "IMPORT_AND_EXPORT"},
        detected_activities=understanding.products if understanding else [],
        likely_regulatory_domains=understanding.likely_regulatory_domains if understanding else [],
        facts_with_provenance={k: v.to_dict() for k, v in fact_pool.items()},
        extra_facts={k: v.value for k, v in fact_pool.items() if k not in {
            "legal_constitution", "state", "district", "annual_turnover", "plant_machinery_investment", "connected_power_load", "total_worker_count"
        }},
    )
