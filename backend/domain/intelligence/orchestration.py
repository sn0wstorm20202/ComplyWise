"""Central compliance assessment orchestrator and runtime mode separation.

Authority: Milestone Step 01 Specification; PRD_v2.0 §10, §11, §14; TRD_v2.0 §4, §12, §30.

This module provides the central application-level coordination boundary:
1. AssessmentStage lifecycle state machine.
2. Strategy separation: LLM_FIRST (active demo/hackathon runtime) vs KNOWLEDGE_FIRST / HYBRID.
3. Common OrchestrationContext shared across stages.
4. StageResult contract and normalized error hierarchy.
5. AssessmentRun persistent lifecycle tracking (reusing Assessment entity).
6. Integration boundaries for Schemes, Standards, Discovery, and Compliance Synthesis.
7. Budget guardrail verification and safe telemetry recording.
8. Backward-compatible facade for orchestrate_compliance_analysis.
"""

from __future__ import annotations

import abc
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
import logging
import time
from typing import Any
import uuid

from django.conf import settings
from django.db import transaction
from common.enums import ApplicabilityStatus, AssessmentStatus
from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.models import DecisionRun
from apps.businesses.models import Assessment, Business, BusinessProfileVersion
from apps.ingestion.models import CandidateRequirement, DiscoveryRun
from apps.ingestion.services import run_discovery
from domain.context.business_context import DerivedBusinessContext, build_business_context
from domain.intelligence.calendar_derivation import derive_business_calendar
from domain.intelligence.document_derivation import derive_business_documents
from domain.intelligence.scheme_discovery import discover_business_schemes
from domain.intelligence.standards_discovery import discover_business_standards
from domain.intelligence.workflow_derivation import derive_business_workflows
from domain.providers import (
    ChatMessage,
    CompletionResult,
    LLMProvider,
    ProviderError,
    ProviderNotConfigured,
    UnknownProvider,
    get_llm_provider,
)
from domain.providers.telemetry import telemetry_tracker

logger = logging.getLogger(__name__)


# ===========================================================================
# 1. Assessment Stages & Strategies
# ===========================================================================


class AssessmentStage(StrEnum):
    INITIALIZE = "INITIALIZE"
    BUSINESS_UNDERSTANDING = "BUSINESS_UNDERSTANDING"
    QUESTION_GENERATION = "QUESTION_GENERATION"
    ANSWER_COLLECTION = "ANSWER_COLLECTION"
    ANSWER_INTERPRETATION = "ANSWER_INTERPRETATION"
    CONTEXT_SYNTHESIS = "CONTEXT_SYNTHESIS"
    REGULATORY_DISCOVERY = "REGULATORY_DISCOVERY"
    COMPLIANCE_SYNTHESIS = "COMPLIANCE_SYNTHESIS"
    SCHEMES = "SCHEMES"
    STANDARDS = "STANDARDS"
    DOCUMENTS = "DOCUMENTS"
    WORKFLOW = "WORKFLOW"
    CALENDAR = "CALENDAR"
    DASHBOARD = "DASHBOARD"
    ASSISTANT = "ASSISTANT"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


STAGE_ORDER: list[AssessmentStage] = [
    AssessmentStage.INITIALIZE,
    AssessmentStage.BUSINESS_UNDERSTANDING,
    AssessmentStage.QUESTION_GENERATION,
    AssessmentStage.ANSWER_COLLECTION,
    AssessmentStage.ANSWER_INTERPRETATION,
    AssessmentStage.CONTEXT_SYNTHESIS,
    AssessmentStage.REGULATORY_DISCOVERY,
    AssessmentStage.COMPLIANCE_SYNTHESIS,
    AssessmentStage.SCHEMES,
    AssessmentStage.STANDARDS,
    AssessmentStage.DOCUMENTS,
    AssessmentStage.WORKFLOW,
    AssessmentStage.CALENDAR,
    AssessmentStage.DASHBOARD,
    AssessmentStage.ASSISTANT,
    AssessmentStage.COMPLETED,
]


class AssessmentStrategyType(StrEnum):
    LLM_FIRST = "LLM_FIRST"
    KNOWLEDGE_FIRST = "KNOWLEDGE_FIRST"
    HYBRID = "HYBRID"


class StageStatus(StrEnum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


# ===========================================================================
# 2. Stage Error Hierarchy
# ===========================================================================


class OrchestrationError(Exception):
    """Base exception for all orchestration errors."""

    def __init__(
        self,
        message: str,
        code: str = "ORCHESTRATION_ERROR",
        is_retryable: bool = False,
        details: list[Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message_safe = message
        self.code = code
        self.is_retryable = is_retryable
        self.details = details or []


class ProviderUnavailable(OrchestrationError):
    def __init__(self, message: str = "AI service provider is currently unavailable.") -> None:
        super().__init__(message, code="PROVIDER_UNAVAILABLE", is_retryable=False)


class ProviderTimeout(OrchestrationError):
    def __init__(self, message: str = "AI service provider request timed out.") -> None:
        super().__init__(message, code="PROVIDER_TIMEOUT", is_retryable=True)


class ProviderRateLimit(OrchestrationError):
    def __init__(self, message: str = "AI service rate limit encountered.") -> None:
        super().__init__(message, code="PROVIDER_RATE_LIMIT", is_retryable=True)


class StructuredOutputInvalid(OrchestrationError):
    def __init__(self, message: str = "Generated response did not conform to required schema.") -> None:
        super().__init__(message, code="STRUCTURED_OUTPUT_INVALID", is_retryable=False)


class StageInputInvalid(OrchestrationError):
    def __init__(self, message: str = "Invalid input supplied to orchestration stage.") -> None:
        super().__init__(message, code="STAGE_INPUT_INVALID", is_retryable=False)


class StageOutputInvalid(OrchestrationError):
    def __init__(self, message: str = "Invalid output produced by orchestration stage.") -> None:
        super().__init__(message, code="STAGE_OUTPUT_INVALID", is_retryable=False)


class DiscoveryUnavailable(OrchestrationError):
    def __init__(self, message: str = "Regulatory discovery source acquisition is unavailable.") -> None:
        super().__init__(message, code="DISCOVERY_UNAVAILABLE", is_retryable=False)


class OrchestrationConflict(OrchestrationError):
    def __init__(self, message: str = "An assessment run is already in progress for this business.") -> None:
        super().__init__(message, code="ORCHESTRATION_CONFLICT", is_retryable=False)


class BudgetExceeded(OrchestrationError):
    def __init__(self, message: str = "Assessment intelligence token or cost budget exceeded.") -> None:
        super().__init__(message, code="BUDGET_EXCEEDED", is_retryable=False)


# ===========================================================================
# 3. Stage Result Contract
# ===========================================================================


@dataclass
class StageResult:
    """Normalized contract returned by every orchestration stage."""

    stage: AssessmentStage | str
    status: StageStatus | str
    data: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        stage_val = self.stage.value if isinstance(self.stage, AssessmentStage) else str(self.stage)
        status_val = self.status.value if isinstance(self.status, StageStatus) else str(self.status)

        safe_metadata = {
            "provider": self.metadata.get("provider", "complywise_internal"),
            "model": self.metadata.get("model", ""),
            "latency_ms": round(float(self.metadata.get("latency_ms", 0.0)), 2),
            "input_tokens": int(self.metadata.get("input_tokens", 0)),
            "output_tokens": int(self.metadata.get("output_tokens", 0)),
            "estimated_cost": round(float(self.metadata.get("estimated_cost", 0.0)), 6),
        }
        for k, v in self.metadata.items():
            if k not in safe_metadata:
                safe_metadata[k] = v

        return {
            "stage": stage_val,
            "status": status_val,
            "data": self.data,
            "metadata": safe_metadata,
            "errors": self.errors,
        }


# ===========================================================================
# 4. Common Orchestration Context
# ===========================================================================


@dataclass
class OrchestrationContext:
    """Canonical domain context shared across all assessment stages."""

    business_id: str
    business_name: str
    profile_version_id: int | None = None
    correlation_id: str = ""
    raw_business_description: str = ""
    normalized_facts: dict[str, Any] = field(default_factory=dict)
    interpreted_activity: list[str] = field(default_factory=list)
    product: str = ""
    geography: dict[str, str] = field(default_factory=dict)
    financial_facts: dict[str, Any] = field(default_factory=dict)
    operational_facts: dict[str, Any] = field(default_factory=dict)
    answers: dict[str, Any] = field(default_factory=dict)
    discovered_regulatory_candidates: list[dict[str, Any]] = field(default_factory=list)
    schemes: list[dict[str, Any]] = field(default_factory=list)
    standards: list[dict[str, Any]] = field(default_factory=list)
    final_compliance_results: list[dict[str, Any]] = field(default_factory=list)
    extra: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_business(
        cls,
        business: Business,
        assessment: Assessment | None = None,
        correlation_id: str | None = None,
    ) -> OrchestrationContext:
        if assessment and assessment.business_id != business.id:
            raise StageInputInvalid("The selected assessment belongs to another business.")
        if assessment and not assessment.profile_version_id:
            # An empty assessment can be initialized before profile intake. It
            # must stay empty instead of inheriting a later mutable profile.
            return cls(business_id=str(business.id), business_name=business.name,
                       correlation_id=correlation_id or str(uuid.uuid4()))
        pv = assessment.profile_version if assessment else business.current_profile
        derived = build_business_context(business, profile_version=pv)
        cid = correlation_id or str(uuid.uuid4())

        return cls(
            business_id=str(business.id),
            business_name=business.name,
            profile_version_id=pv.version if pv else None,
            correlation_id=cid,
            raw_business_description=derived.product_description,
            normalized_facts={
                "legal_constitution": derived.legal_constitution,
                "msme_scale": derived.msme_scale,
                "lifecycle_stage": derived.lifecycle_stage,
                "is_manufacturing": derived.is_manufacturing,
                "is_cross_border": derived.is_cross_border,
            },
            interpreted_activity=list(derived.detected_activities),
            product=derived.product_description,
            geography={
                "state": derived.state,
                "state_name": derived.state_name,
                "district": derived.district,
                "industrial_zone_status": derived.industrial_zone_status,
            },
            financial_facts={
                "annual_turnover": str(derived.annual_turnover) if derived.annual_turnover is not None else None,
                "plant_machinery_investment": str(derived.plant_machinery_investment) if derived.plant_machinery_investment is not None else None,
            },
            operational_facts={
                "total_worker_count": derived.total_worker_count,
                "contract_worker_count": derived.contract_worker_count,
                "connected_power_load": str(derived.connected_power_load) if derived.connected_power_load is not None else None,
                "effluent_emission_generation": derived.effluent_emission_generation,
                "hazardous_waste_generation": derived.hazardous_waste_generation,
                "ecommerce_operations": derived.ecommerce_operations,
                "multi_state_operations": derived.multi_state_operations,
            },
            extra={},
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ===========================================================================
# 5. Persistent Assessment Run Wrapper
# ===========================================================================


class AssessmentRun:
    """Authoritative wrapper over persistent Assessment entity."""

    def __init__(
        self,
        assessment: Assessment,
        strategy: str = AssessmentStrategyType.LLM_FIRST,
        correlation_id: str | None = None,
    ) -> None:
        self._assessment = assessment
        state = self._assessment.step_state or {}
        self.strategy = state.get("strategy") or strategy
        self.current_stage = state.get("current_stage") or AssessmentStage.INITIALIZE
        self.correlation_id = state.get("correlation_id") or correlation_id or str(uuid.uuid4())
        self.error_code = state.get("error_code")
        self.error_message_safe = state.get("error_message_safe")
        self.stage_metadata = state.get("stage_metadata") or {}
        self.started_at = state.get("started_at") or self._assessment.created_at.isoformat()
        self.completed_at = (
            self._assessment.completed_at.isoformat()
            if self._assessment.completed_at
            else state.get("completed_at")
        )

    @property
    def run_id(self) -> str:
        return str(self._assessment.id)

    @property
    def business_id(self) -> str:
        return str(self._assessment.business_id)

    @property
    def profile_version_id(self) -> int | None:
        return self._assessment.profile_version.version if self._assessment.profile_version else None

    @property
    def status(self) -> str:
        return self._assessment.status

    @status.setter
    def status(self, val: str) -> None:
        self._assessment.status = val

    @property
    def created_at(self) -> str:
        return self._assessment.created_at.isoformat()

    @property
    def updated_at(self) -> str:
        return self._assessment.updated_at.isoformat()

    @property
    def assessment(self) -> Assessment:
        return self._assessment

    def record_stage_result(self, result: StageResult) -> None:
        stage_key = result.stage.value if isinstance(result.stage, AssessmentStage) else str(result.stage)
        self.current_stage = stage_key
        self.stage_metadata[stage_key] = result.to_dict()

        if result.status == StageStatus.FAILED:
            self.status = AssessmentStatus.FAILED
            self.error_code = self.stage_metadata[stage_key].get("errors", ["STAGE_FAILED"])[0] if result.errors else "STAGE_FAILED"
            self.error_message_safe = "Assessment stage encountered an issue and was logged safely."
        elif result.stage == AssessmentStage.COMPLETED and result.status == StageStatus.COMPLETED:
            self.status = AssessmentStatus.COMPLETED
            self.completed_at = datetime.now(timezone.utc).isoformat()
            self._assessment.completed_at = datetime.now(timezone.utc)
        elif self.status != AssessmentStatus.FAILED:
            self.status = AssessmentStatus.IN_PROGRESS

        self.save()

    def save(self) -> None:
        state = dict(self._assessment.step_state or {})
        state["strategy"] = self.strategy
        state["current_stage"] = str(self.current_stage)
        state["correlation_id"] = self.correlation_id
        state["error_code"] = self.error_code
        state["error_message_safe"] = self.error_message_safe
        state["stage_metadata"] = self.stage_metadata
        state["started_at"] = self.started_at
        state["completed_at"] = self.completed_at

        self._assessment.step_state = state
        self._assessment.save(update_fields=["status", "step_state", "completed_at", "updated_at"])

    def to_safe_dict(self) -> dict[str, Any]:
        """Return safe user-facing state without leaking internal strategy or provider names."""
        timings = {}
        phase_timings = {}
        for stage in STAGE_ORDER:
            record = self.stage_metadata.get(stage.value, {})
            if not isinstance(record, dict):
                continue
            duration = (record.get("metadata") or {}).get("duration_ms")
            if isinstance(duration, (int, float)) and not isinstance(duration, bool) and duration >= 0:
                timings[stage.value] = duration
            details = (record.get("data") or {}).get("metadata") or {}
            for phase, value in (details.get("timings_ms") or {}).items():
                if isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0:
                    phase_timings[phase] = round(phase_timings.get(phase, 0.0) + value, 2)
        # Recorded execution time excludes the user's time answering questions.
        # Missing historical measurements stay absent, rather than becoming zero.
        completed_stages = [
            k for k, v in self.stage_metadata.items()
            if isinstance(v, dict) and v.get("status") == StageStatus.COMPLETED
        ]
        total_stages = len(STAGE_ORDER)
        percent = int(min(100, max(0, (len(completed_stages) / total_stages) * 100)))

        safe_msg = "Assessment in progress."
        if self.status == AssessmentStatus.COMPLETED:
            safe_msg = "Assessment completed successfully."
        elif self.status == AssessmentStatus.FAILED:
            safe_msg = "Assessment encountered an issue. Please try again."

        return {
            "run_id": self.run_id,
            "assessment_id": self.run_id,
            "business_id": self.business_id,
            "status": self.status,
            "current_stage": str(self.current_stage),
            "stage": str(self.current_stage),
            "progress": {
                "current_stage": str(self.current_stage),
                "completed_stages": completed_stages,
                "percent": percent,
            },
            "safe_message": safe_msg,
            "timings_ms": timings,
            "phase_timings_ms": phase_timings,
            "measured_stage_total_ms": round(sum(timings.values()), 2),
            "safe_error": self.error_message_safe if self.error_code else None,
            "error": {
                "code": self.error_code,
                "message": self.error_message_safe,
            } if self.error_code else None,
        }


# ===========================================================================
# 6. Integration Provider Interfaces & Default Adapters
# ===========================================================================


@dataclass
class SchemeResult:
    scheme_code: str
    title: str
    authority: str
    jurisdiction: str
    benefit_type: str
    benefit_summary: str
    eligibility_statement: str
    source_url: str
    is_applicable: bool = True
    match_score: float = 1.0
    extra: dict[str, Any] = field(default_factory=dict)


class SchemeProvider(abc.ABC):
    @abc.abstractmethod
    def discover_schemes(self, context: OrchestrationContext, assessment_id=None) -> list[SchemeResult]:
        pass


class DefaultSchemeProvider(SchemeProvider):
    def discover_schemes(self, context: OrchestrationContext, assessment_id=None) -> list[SchemeResult]:
        biz = Business.objects.filter(pk=context.business_id).first()
        if not biz:
            return []
        selected_assessment = biz.assessments.filter(pk=assessment_id).first() if assessment_id else None
        if assessment_id and (not selected_assessment or not selected_assessment.profile_version_id):
            raise StageInputInvalid("The selected assessment has no business profile snapshot.")
        derived_ctx = build_business_context(biz, profile_version=selected_assessment.profile_version if selected_assessment else None)
        replacements: dict[str, Any] = {}
        desc = getattr(context, "raw_business_description", None) or getattr(context, "product", None)
        if desc and desc != derived_ctx.product_description:
            replacements["product_description"] = desc
        if hasattr(context, "answers") and isinstance(context.answers, dict):
            if "trade_intent" in context.answers:
                replacements["is_cross_border"] = context.answers["trade_intent"] in {"EXPORT_ONLY", "IMPORT_ONLY", "IMPORT_AND_EXPORT"}
        if replacements:
            import dataclasses
            derived_ctx = dataclasses.replace(derived_ctx, **replacements)
        res = discover_business_schemes(biz, context=derived_ctx, assessment_id=assessment_id)
        results: list[SchemeResult] = []
        for item in res.get("schemes", []):
            results.append(
                SchemeResult(
                    scheme_code=item.get("scheme_code", ""),
                    title=item.get("title", ""),
                    authority=item.get("authority", ""),
                    jurisdiction=item.get("jurisdiction", "CENTRAL"),
                    benefit_type=item.get("benefit_type", "INCENTIVE_SCHEME"),
                    benefit_summary=item.get("benefit_summary", ""),
                    eligibility_statement=item.get("eligibility_statement", ""),
                    source_url=item.get("source_url") or "",
                    is_applicable=item.get("eligibility_status") == "EVIDENCE_SUPPORTED",
                    match_score=item.get("match_score", 1.0),
                    extra=item,
                )
            )
        return results


@dataclass
class RegulatoryDiscoveryResult:
    status: str
    sources_count: int
    candidate_count: int
    queries: list[str] = field(default_factory=list)
    sources: list[dict[str, Any]] = field(default_factory=list)
    evidence_candidates: list[dict[str, Any]] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    search_metadata: dict[str, Any] = field(default_factory=dict)
    candidate_requirements: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        sm = dict(self.search_metadata or self.metadata.get("search_metadata", {}))
        if "fallback_used" not in sm:
            sm["fallback_used"] = self.metadata.get("fallback_used", False)
        return {
            "status": self.status,
            "queries": self.queries,
            "sources": self.sources or self.metadata.get("sources", []),
            "evidence_candidates": self.evidence_candidates or self.metadata.get("evidence_candidates", []),
            "warnings": self.warnings or self.metadata.get("warnings", []),
            "search_metadata": sm,
            "sources_count": self.sources_count,
            "candidate_count": self.candidate_count,
            "candidate_requirements": self.candidate_requirements,
            "metadata": self.metadata,
        }


class RegulatoryDiscoveryProvider(abc.ABC):
    @abc.abstractmethod
    def discover(
        self,
        context: OrchestrationContext,
        query_plan: dict[str, Any] | None = None,
    ) -> RegulatoryDiscoveryResult:
        pass


class DefaultRegulatoryDiscoveryProvider(RegulatoryDiscoveryProvider):
    def discover(
        self,
        context: OrchestrationContext,
        query_plan: dict[str, Any] | None = None,
    ) -> RegulatoryDiscoveryResult:
        # Step 01 prepares boundary contract; full live discovery wired in Step 03
        return RegulatoryDiscoveryResult(
            status="READY",
            sources_count=0,
            candidate_count=0,
            queries=[],
            candidate_requirements=[],
            metadata={"note": "Discovery interface ready for Step 03."},
        )


@dataclass
class StandardResult:
    standard_code: str
    title: str
    authority: str
    category: str
    description: str
    is_mandatory: bool
    source_url: str
    extra: dict[str, Any] = field(default_factory=dict)


class StandardsProvider(abc.ABC):
    @abc.abstractmethod
    def discover_standards(self, context: OrchestrationContext, assessment_id=None) -> list[StandardResult]:
        pass


class DefaultStandardsProvider(StandardsProvider):
    def discover_standards(self, context: OrchestrationContext, assessment_id=None) -> list[StandardResult]:
        biz = Business.objects.filter(pk=context.business_id).first()
        if not biz:
            return []
        selected_assessment = biz.assessments.filter(pk=assessment_id).first() if assessment_id else None
        if assessment_id and (not selected_assessment or not selected_assessment.profile_version_id):
            raise StageInputInvalid("The selected assessment has no business profile snapshot.")
        derived_ctx = build_business_context(biz, profile_version=selected_assessment.profile_version if selected_assessment else None)
        desc = getattr(context, "raw_business_description", None) or getattr(context, "product", None)
        if desc and desc != derived_ctx.product_description:
            import dataclasses
            derived_ctx = dataclasses.replace(derived_ctx, product_description=desc)
        res = discover_business_standards(biz, context=derived_ctx, assessment_id=assessment_id)
        results: list[StandardResult] = []
        for item in res.get("standards", []):
            results.append(
                StandardResult(
                    standard_code=item.get("standard_code", ""),
                    title=item.get("title", ""),
                    authority=item.get("authority", ""),
                    category=item.get("nature", "MANDATORY_STANDARD"),
                    description=item.get("why_it_matters", ""),
                    is_mandatory=item.get("is_mandatory"),
                    source_url=item.get("source_url", ""),
                    extra=item,
                )
            )
        return results


@dataclass
class ComplianceSynthesisResult:
    status: str
    applicable_count: int
    requirements: list[dict[str, Any]] = field(default_factory=list)
    executive_summary: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "applicable_count": self.applicable_count,
            "requirements": self.requirements,
            "executive_summary": self.executive_summary,
            "metadata": self.metadata,
        }


class ComplianceSynthesisProvider(abc.ABC):
    @abc.abstractmethod
    def synthesize(
        self,
        context: OrchestrationContext,
        discovered_material: dict[str, Any],
    ) -> ComplianceSynthesisResult:
        pass


class DefaultComplianceSynthesisProvider(ComplianceSynthesisProvider):
    def synthesize(
        self,
        context: OrchestrationContext,
        discovered_material: dict[str, Any],
    ) -> ComplianceSynthesisResult:
        # Step 01 prepares boundary contract; full synthesis wired in Step 03
        return ComplianceSynthesisResult(
            status="INITIALIZED",
            applicable_count=0,
            requirements=[],
            executive_summary={},
            metadata={"note": "Compliance synthesis interface ready for Step 03."},
        )


# ===========================================================================
# 7. Strategy Abstraction & Implementations
# ===========================================================================


class AssessmentStrategy(abc.ABC):
    name: str

    @abc.abstractmethod
    def execute_stage(
        self,
        stage: AssessmentStage,
        context: OrchestrationContext,
        run: AssessmentRun,
    ) -> StageResult:
        pass

    @abc.abstractmethod
    def is_applicable(self, context: OrchestrationContext) -> bool:
        pass


class LLMFirstStrategy(AssessmentStrategy):
    """Active demo/hackathon runtime strategy (LLM-first assessment pipeline)."""

    name = AssessmentStrategyType.LLM_FIRST

    def is_applicable(self, context: OrchestrationContext) -> bool:
        return True

    def execute_stage(
        self,
        stage: AssessmentStage,
        context: OrchestrationContext,
        run: AssessmentRun,
    ) -> StageResult:
        t0 = time.perf_counter()
        provider_name = getattr(settings, "LLM_PROVIDER", "gemini")

        if stage == AssessmentStage.INITIALIZE:
            latency_ms = (time.perf_counter() - t0) * 1000
            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data={
                    "business_id": context.business_id,
                    "business_name": context.business_name,
                    "initialized_at": datetime.now(timezone.utc).isoformat(),
                    "next_stage": AssessmentStage.BUSINESS_UNDERSTANDING,
                },
                metadata={
                    "provider": provider_name,
                    "latency_ms": latency_ms,
                },
            )

        if stage == AssessmentStage.BUSINESS_UNDERSTANDING:
            cached = run.stage_metadata.get("business_understanding")
            if cached:
                return StageResult(stage=stage, status=StageStatus.COMPLETED, data=cached, metadata={"cached": True})
            from domain.intelligence.business_understanding import BusinessUnderstandingEngine
            engine = BusinessUnderstandingEngine()
            result = engine.analyze_business(context, assessment_id=run.run_id)
            clean_data = result.to_clean_dict()
            state = dict(run.stage_metadata)
            state["business_understanding"] = clean_data
            run.stage_metadata = state
            run.save()
            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data=clean_data,
                metadata={"duration_ms": result.duration_ms},
            )

        if stage == AssessmentStage.QUESTION_GENERATION:
            from domain.intelligence.business_understanding import validate_business_understanding_schema
            from domain.intelligence.questionnaire import QuestionnaireEngine
            under_raw = run.stage_metadata.get("business_understanding")
            under_res = validate_business_understanding_schema(under_raw) if under_raw else None
            engine = QuestionnaireEngine()
            questions = engine.generate_questionnaire(context, run, understanding=under_res)

            # Guarantee question set is explicitly stored in run stage_metadata
            state = dict(run.stage_metadata)
            state["question_generation"] = {
                "question_policy_version": 5,
                "questions": [q.to_dict() for q in questions],
                "count": len(questions),
                "generated_at": time.time(),
            }
            run.stage_metadata = state
            run.save()

            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data={
                    "questions": [q.to_frontend_dict() for q in questions],
                    "total_questions": len(questions),
                },
                metadata={"total_questions": len(questions)},
            )

        if stage == AssessmentStage.ANSWER_COLLECTION:
            answers = run.stage_metadata.get("answers", {})
            q_meta = run.stage_metadata.get("question_generation", {}).get("questions", [])
            next_q = next((q for q in q_meta if q.get("question_id") not in answers), None)
            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data={
                    "answered_count": len(answers),
                    "total_questions": len(q_meta),
                    "is_complete": len(answers) >= (len(q_meta)),
                    "next_question": next_q,
                },
            )

        if stage == AssessmentStage.ANSWER_INTERPRETATION:
            from domain.intelligence.answer_interpretation import AnswerInterpreter
            interpreter = AnswerInterpreter()
            q_meta = run.stage_metadata.get("question_generation", {}).get("questions", [])
            answers = run.stage_metadata.get("answers", {})
            interpreted_facts = interpreter.interpret_answers_to_facts(q_meta, answers)
            state = dict(run.stage_metadata)
            state["answer_interpretation"] = interpreted_facts
            run.stage_metadata = state
            run.save()
            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data={"extracted_facts_count": len(interpreted_facts), "facts": interpreted_facts},
            )

        if stage == AssessmentStage.CONTEXT_SYNTHESIS:
            from domain.intelligence.business_understanding import validate_business_understanding_schema
            from domain.intelligence.context_merge import build_canonical_enriched_context
            under_raw = run.stage_metadata.get("business_understanding")
            under_res = validate_business_understanding_schema(under_raw) if under_raw else None
            interpreted_facts = run.stage_metadata.get("answer_interpretation") or []
            enriched_ctx = build_canonical_enriched_context(context, under_res, interpreted_facts)
            clean_ctx = enriched_ctx.to_clean_dict()
            state = dict(run.stage_metadata)
            state["context_synthesis"] = clean_ctx
            run.stage_metadata = state
            run.save()
            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data=clean_ctx,
            )

        if stage == AssessmentStage.REGULATORY_DISCOVERY:
            from domain.intelligence.discovery import LiveRegulatoryDiscoveryProvider
            # Check idempotency: if already discovered in this run, return cached
            cached = run.stage_metadata.get("regulatory_discovery")
            if cached and isinstance(cached, dict) and cached.get("evidence_candidates"):
                return StageResult(
                    stage=stage,
                    status=StageStatus.COMPLETED,
                    data=cached,
                    metadata={"cached": True},
                )

            # Resolve enriched canonical context if available
            ctx_to_use: Any = context
            if "context_synthesis" in run.stage_metadata:
                from domain.intelligence.business_understanding import validate_business_understanding_schema
                from domain.intelligence.context_merge import build_canonical_enriched_context
                under_raw = run.stage_metadata.get("business_understanding")
                under_res = validate_business_understanding_schema(under_raw) if under_raw else None
                interpreted_facts = run.stage_metadata.get("answer_interpretation") or []
                ctx_to_use = build_canonical_enriched_context(context, under_res, interpreted_facts)

            disc_provider = LiveRegulatoryDiscoveryProvider()
            disc_res = disc_provider.discover(ctx_to_use, assessment=run.assessment)
            clean_disc = disc_res.to_dict()
            discovery_id = (clean_disc.get("metadata") or {}).get("discovery_run_id")
            if discovery_id:
                persisted = DiscoveryRun.objects.filter(pk=discovery_id, business=run.assessment.business).first()
                if persisted and not persisted.assessment_id:
                    persisted.assessment = run.assessment
                    persisted.save(update_fields=["assessment"])
                if persisted and persisted.assessment_id == run.assessment.id:
                    run.assessment.discovery_run = persisted
                    run.assessment.save(update_fields=["discovery_run", "updated_at"])

            state = dict(run.stage_metadata)
            state["regulatory_discovery"] = clean_disc
            run.stage_metadata = state
            run.save()
            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data=clean_disc,
                metadata={
                    "sources_count": disc_res.sources_count,
                    "candidate_count": disc_res.candidate_count,
                    "provider": provider_name,
                },
            )

        if stage == AssessmentStage.COMPLIANCE_SYNTHESIS:
            from domain.intelligence.synthesis import LiveComplianceSynthesisProvider
            # Ensure regulatory discovery has executed
            if "regulatory_discovery" not in run.stage_metadata:
                self.execute_stage(AssessmentStage.REGULATORY_DISCOVERY, context, run)

            ctx_to_use = context
            if "context_synthesis" in run.stage_metadata:
                from domain.intelligence.business_understanding import validate_business_understanding_schema
                from domain.intelligence.context_merge import build_canonical_enriched_context
                under_raw = run.stage_metadata.get("business_understanding")
                under_res = validate_business_understanding_schema(under_raw) if under_raw else None
                interpreted_facts = run.stage_metadata.get("answer_interpretation") or []
                ctx_to_use = build_canonical_enriched_context(context, under_res, interpreted_facts)

            discovered_material = run.stage_metadata.get("regulatory_discovery") or {}
            q_meta = run.stage_metadata.get("question_generation", {}).get("questions", [])
            answers_map = run.stage_metadata.get("answers", {})
            synth_provider = LiveComplianceSynthesisProvider()
            synth_res = synth_provider.synthesize(
                ctx_to_use,
                discovered_material,
                questions=q_meta,
                answers=answers_map,
                assessment_id=run.run_id,
            )
            clean_synth = synth_res.to_dict()
            state = dict(run.stage_metadata)
            state["compliance_synthesis"] = clean_synth
            run.stage_metadata = state
            run.save()
            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data=clean_synth,
                metadata={
                    "applicable_count": synth_res.applicable_count,
                    "provider": provider_name,
                },
            )

        if stage == AssessmentStage.SCHEMES:
            cached = run.stage_metadata.get("schemes")
            if isinstance(cached, dict) and "schemes" in cached and cached.get("grounding_version") == 2:
                return StageResult(
                    stage=stage,
                    status=StageStatus.COMPLETED,
                    data=cached,
                    metadata={"cached": True},
                )

            scheme_prov = DefaultSchemeProvider()
            raw_schemes = scheme_prov.discover_schemes(context, assessment_id=run.run_id)
            normalized_schemes = [
                {
                    "scheme_id": s.scheme_code,
                    "name": s.title,
                    "authority": s.authority,
                    "jurisdiction": s.jurisdiction,
                    "eligibility": s.eligibility_statement,
                    "benefit": s.benefit_summary,
                    "status": s.extra.get("status", "TO_EXPLORE" if s.extra.get("result_origin") == "LLM_FALLBACK_RESULT" else "CANDIDATE"),
                    "eligibility_status": s.extra.get("eligibility_status", "CONTEXTUAL" if s.extra.get("result_origin") == "LLM_FALLBACK_RESULT" else "NEEDS_REVIEW"),
                    "result_origin": s.extra.get("result_origin", "DETERMINISTIC_KB_RESULT"),
                    "citations": s.extra.get("citations", []),
                    "source_url": s.source_url,
                    "source": s.extra.get("source"),
                    "evidence": s.extra.get("evidence", []),
                    "matched_facts": s.extra.get("matched_facts", []),
                    "matched_fact_values": s.extra.get("matched_fact_values", {}),
                    "application_url": s.extra.get("action_url") or s.extra.get("portal_url") or "",
                    "why_relevant": s.extra.get("relevance_rationale", s.eligibility_statement) if isinstance(s.extra, dict) else s.eligibility_statement,
                    "scheme_code": s.scheme_code,
                    "title": s.title,
                    "benefit_type": s.benefit_type,
                }
                for s in raw_schemes
            ]
            clean_schemes = {
                "grounding_version": 2,
                "schemes": normalized_schemes,
                "total_schemes": len(normalized_schemes),
            }
            state = dict(run.stage_metadata)
            state["schemes"] = clean_schemes
            run.stage_metadata = state
            run.save()
            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data=clean_schemes,
                metadata={"total_schemes": len(normalized_schemes)},
            )

        if stage == AssessmentStage.STANDARDS:
            cached = run.stage_metadata.get("standards")
            if isinstance(cached, dict) and "standards" in cached and cached.get("grounding_version") == 2:
                return StageResult(
                    stage=stage,
                    status=StageStatus.COMPLETED,
                    data=cached,
                    metadata={"cached": True},
                )

            std_prov = DefaultStandardsProvider()
            raw_stds = std_prov.discover_standards(context, assessment_id=run.run_id)
            normalized_stds = [
                {
                    "standard_id": s.standard_code,
                    "name": s.title,
                    "authority": s.authority,
                    "type": "QUALITY_PLANNING" if s.extra.get("result_origin") == "LLM_FALLBACK_RESULT" else "STATUTORY" if s.is_mandatory is True else "VOLUNTARY" if s.is_mandatory is False else "STANDARD",
                    "reason": s.description,
                    "evidence_ids": [ref["evidence_id"] for ref in s.extra.get("citations", []) if ref.get("evidence_id")],
                    "source_urls": [s.source_url] if s.source_url else [],
                    "standard_code": s.standard_code,
                    "title": s.title,
                    "is_mandatory": s.is_mandatory,
                    "nature": s.category,
                    "mandatory_status": s.extra.get("mandatory_status", "MANDATORY" if s.is_mandatory is True else "VOLUNTARY" if s.is_mandatory is False else "UNKNOWN"),
                    "verification_status": "CONTEXTUAL_GUIDANCE" if s.extra.get("result_origin") == "LLM_FALLBACK_RESULT" else "VERIFIED" if (s.extra.get("source") or {}).get("reviewed") else "NEEDS_VERIFICATION",
                    "status": s.extra.get("status", "NEEDS_REVIEW"),
                    "source": s.extra.get("source"),
                    "evidence": s.extra.get("evidence", []),
                    "matched_facts": s.extra.get("matched_facts", []),
                    "matched_fact_values": s.extra.get("matched_fact_values", {}),
                    "result_origin": s.extra.get("result_origin", "DETERMINISTIC_KB_RESULT"),
                    "rule_version_id": s.extra.get("rule_version_id"),
                    "citations": s.extra.get("citations", []),
                    "testing_requirements": s.extra.get("testing_requirements", ""),
                    "next_step": s.extra.get("next_step", ""),
                }
                for s in raw_stds
            ]
            clean_stds = {
                "grounding_version": 2,
                "standards": normalized_stds,
                "total_standards": len(normalized_stds),
            }
            state = dict(run.stage_metadata)
            state["standards"] = clean_stds
            run.stage_metadata = state
            run.save()
            return StageResult(
                stage=stage,
                status=StageStatus.COMPLETED,
                data=clean_stds,
                metadata={"total_standards": len(normalized_stds)},
            )

        # Later stages return clean initialized contracts for Step 01 / Steps 04-05
        latency_ms = (time.perf_counter() - t0) * 1000
        return StageResult(
            stage=stage,
            status=StageStatus.COMPLETED,
            data={
                "message": f"Stage {stage} prepared under {self.name}.",
                "business_id": context.business_id,
            },
            metadata={
                "provider": provider_name,
                "latency_ms": latency_ms,
            },
        )


class KnowledgeFirstStrategy(AssessmentStrategy):
    """Preserves legacy deterministic rule-pack evaluation path for regression/fallback."""

    name = AssessmentStrategyType.KNOWLEDGE_FIRST

    def is_applicable(self, context: OrchestrationContext) -> bool:
        return True

    def execute_stage(
        self,
        stage: AssessmentStage,
        context: OrchestrationContext,
        run: AssessmentRun,
    ) -> StageResult:
        t0 = time.perf_counter()
        biz = Business.objects.filter(pk=context.business_id).first()
        if not biz:
            return StageResult(
                stage=stage,
                status=StageStatus.FAILED,
                errors=["Business not found."],
            )

        # Delegates to deterministic legacy pipeline when requested
        legacy_summary = orchestrate_compliance_analysis(biz, assessment_id=run.run_id)
        latency_ms = (time.perf_counter() - t0) * 1000
        return StageResult(
            stage=stage,
            status=StageStatus.COMPLETED,
            data=legacy_summary,
            metadata={
                "provider": "deterministic_rule_engine",
                "latency_ms": latency_ms,
            },
        )


class HybridStrategy(AssessmentStrategy):
    """Hybrid combination strategy combining knowledge baseline with LLM synthesis."""

    name = AssessmentStrategyType.HYBRID

    def is_applicable(self, context: OrchestrationContext) -> bool:
        return True

    def execute_stage(
        self,
        stage: AssessmentStage,
        context: OrchestrationContext,
        run: AssessmentRun,
    ) -> StageResult:
        # Default fallback to LLM first for Step 01
        llm_strat = LLMFirstStrategy()
        return llm_strat.execute_stage(stage, context, run)


def get_assessment_strategy(name: str | None = None) -> AssessmentStrategy:
    strategy_name = (
        name or getattr(settings, "ASSESSMENT_STRATEGY", AssessmentStrategyType.LLM_FIRST)
    ).strip().upper()

    if strategy_name == AssessmentStrategyType.LLM_FIRST:
        return LLMFirstStrategy()
    elif strategy_name == AssessmentStrategyType.KNOWLEDGE_FIRST:
        return KnowledgeFirstStrategy()
    elif strategy_name == AssessmentStrategyType.HYBRID:
        return HybridStrategy()
    else:
        raise OrchestrationError(
            f"Unknown assessment strategy: {strategy_name}",
            code="UNKNOWN_STRATEGY",
        )


# ===========================================================================
# 8. Central Assessment Orchestrator
# ===========================================================================


class AssessmentOrchestrator:
    """Central coordination boundary for all assessment workflows."""

    def __init__(
        self,
        strategy: AssessmentStrategy | None = None,
        scheme_provider: SchemeProvider | None = None,
        discovery_provider: RegulatoryDiscoveryProvider | None = None,
        standards_provider: StandardsProvider | None = None,
        synthesis_provider: ComplianceSynthesisProvider | None = None,
    ) -> None:
        self.strategy = strategy or get_assessment_strategy()
        self.scheme_provider = scheme_provider or DefaultSchemeProvider()
        self.discovery_provider = discovery_provider or DefaultRegulatoryDiscoveryProvider()
        self.standards_provider = standards_provider or DefaultStandardsProvider()
        self.synthesis_provider = synthesis_provider or DefaultComplianceSynthesisProvider()

    @transaction.atomic
    def create_run(
        self,
        business: Business,
        user: Any = None,
        profile_version: BusinessProfileVersion | None = None,
        correlation_id: str | None = None,
        strategy: str | None = None,
        idempotency_key: str | None = None,
    ) -> AssessmentRun:
        """Create or reuse an assessment run with duplicate-run and idempotency protection."""
        if not getattr(settings, "ENABLE_API_ORCHESTRATION", True):
            raise OrchestrationError(
                "API Orchestration is disabled by configuration.",
                code="FEATURE_DISABLED",
            )

        cid = correlation_id or idempotency_key or str(uuid.uuid4())
        # Serialize creation per business so profile save + orchestration cannot
        # create two active assessments or duplicate assessment numbers.
        Business.objects.select_for_update().get(pk=business.pk)
        active_strategy = strategy or self.strategy.name

        # Validate strategy
        get_assessment_strategy(active_strategy)

        # Idempotency / Duplicate-run protection: check existing active assessment
        existing_active = (
            Assessment.objects.filter(
                business=business,
                status__in=[AssessmentStatus.IN_PROGRESS, AssessmentStatus.DRAFT],
            )
            .order_by("-created_at")
            .first()
        )

        if existing_active:
            state = existing_active.step_state or {}
            existing_cid = state.get("correlation_id")
            existing_idempotency = state.get("idempotency_key")

            # Exact match on idempotency key or correlation_id -> reuse safely
            if (idempotency_key and existing_idempotency == idempotency_key) or (
                correlation_id and existing_cid == correlation_id
            ):
                logger.info(
                    "Reusing existing active AssessmentRun %s for business %s (correlation %s)",
                    existing_active.id,
                    business.id,
                    cid,
                )
                return AssessmentRun(existing_active, strategy=active_strategy, correlation_id=cid)

            # Prevent concurrent overlapping runs
            if idempotency_key and existing_idempotency and existing_idempotency != idempotency_key:
                raise OrchestrationConflict(
                    f"An assessment run ({existing_active.id}) is already active for this business."
                )
            # Profile/onboarding already created the active assessment. Adopt it
            # rather than starting another run with a new correlation ID.
            state.setdefault("strategy", active_strategy)
            state.setdefault("current_stage", AssessmentStage.INITIALIZE)
            state.setdefault("correlation_id", cid)
            state.setdefault("stage_metadata", {})
            if idempotency_key:
                state.setdefault("idempotency_key", idempotency_key)
            existing_active.step_state = state
            existing_active.save(update_fields=["step_state", "updated_at"])
            return AssessmentRun(existing_active, strategy=state["strategy"], correlation_id=state["correlation_id"])

        # Resolve profile version
        pv = profile_version or business.current_profile
        next_num = business.assessment_count + 1

        assessment = Assessment.objects.create(
            business=business,
            created_by=user if (user and user.is_authenticated) else None,
            assessment_number=next_num,
            title=f"Assessment #{next_num}",
            status=AssessmentStatus.IN_PROGRESS,
            profile_version=pv,
            step_state={
                "strategy": active_strategy,
                "current_stage": AssessmentStage.INITIALIZE,
                "correlation_id": cid,
                "idempotency_key": idempotency_key,
                "stage_metadata": {},
                "started_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        run = AssessmentRun(assessment, strategy=active_strategy, correlation_id=cid)

        # Run INITIALIZE stage
        context = OrchestrationContext.from_business(business, assessment=assessment, correlation_id=cid)
        init_result = self.strategy.execute_stage(AssessmentStage.INITIALIZE, context, run)
        run.record_stage_result(init_result)

        logger.info(
            "Created new AssessmentRun %s for business %s (strategy %s, correlation %s)",
            run.run_id,
            business.id,
            active_strategy,
            cid,
        )
        return run

    def get_run(self, run_id: str | uuid.UUID, user: Any = None) -> AssessmentRun | None:
        """Retrieve an assessment run by ID with tenant access verification."""
        try:
            uuid_id = uuid.UUID(str(run_id))
        except (ValueError, TypeError):
            return None

        qs = Assessment.objects.all()
        if user and user.is_authenticated:
            qs = Assessment.accessible_to(user)

        assessment = qs.filter(pk=uuid_id).first()
        if not assessment:
            return None

        return AssessmentRun(assessment)

    def execute_stage(
        self,
        run: AssessmentRun,
        stage: AssessmentStage,
        context: OrchestrationContext | None = None,
    ) -> StageResult:
        """Execute a single lifecycle stage on an active assessment run."""
        # Check budget limits
        allowed, reason = telemetry_tracker.check_guardrails(run.run_id)
        if not allowed and stage in {AssessmentStage.BUSINESS_UNDERSTANDING, AssessmentStage.QUESTION_GENERATION, AssessmentStage.COMPLIANCE_SYNTHESIS}:
            err = BudgetExceeded(reason or "Cost/Token budget exceeded.")
            res = StageResult(
                stage=stage,
                status=StageStatus.FAILED,
                errors=[err.code],
                metadata={"error": err.message_safe},
            )
            run.record_stage_result(res)
            raise err

        ctx = context or OrchestrationContext.from_business(
            run.assessment.business,
            assessment=run.assessment,
            correlation_id=run.correlation_id,
        )

        stage_started = time.perf_counter()
        result = self.strategy.execute_stage(stage, ctx, run)
        result.metadata["duration_ms"] = round((time.perf_counter() - stage_started) * 1000, 2)
        run.record_stage_result(result)
        return result


# Global Singleton Orchestrator Instance
assessment_orchestrator = AssessmentOrchestrator()


# ===========================================================================
# 9. Backward-Compatible Facade for Legacy Callers
# ===========================================================================


def orchestrate_compliance_analysis(
    business: Business,
    *,
    assessment_id: str | None = None,
    force_live_discovery: bool = True,
) -> dict[str, Any]:
    """Execute complete staged compliance analysis for a business.
    
    Maintained as a facade for existing callers (e.g. apps.ingestion.views.AnalysisOrchestrateView).
    """
    start_time = datetime.now(timezone.utc)
    analysis_id = str(uuid.uuid4())
    stage_records: list[dict[str, Any]] = []
    phase_started = time.perf_counter()

    # Resolve assessment if passed or latest
    assessment = None
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
    if assessment is None and not assessment_id:
        assessment = business.assessments.order_by("-assessment_number").first()
    if assessment_id and assessment is None:
        raise ValueError("Assessment does not belong to this business.")
    if assessment and not assessment.profile_version_id:
        raise StageInputInvalid("Save a business profile for this assessment before analysis.")

    def record_stage(stage_name: str, message: str, count: int = 0) -> None:
        nonlocal phase_started
        phase_finished = time.perf_counter()
        stage_records.append({
            "stage": stage_name,
            "status": "COMPLETED",
            "message": message,
            "count": count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "duration_ms": round((phase_finished - phase_started) * 1000, 2),
        })
        phase_started = phase_finished

    # Stage 1: BUSINESS_CONTEXT
    context = build_business_context(business, profile_version=assessment.profile_version if assessment else None)
    record_stage(
        "BUSINESS_CONTEXT",
        f"Synthesized profile context for {business.name}. Enterprise scale: {context.msme_scale}.",
        count=len(context.known_variable_keys),
    )

    # Stage 2: SMART_QUESTIONS
    missing_count = len(context.missing_variable_keys)
    record_stage(
        "SMART_QUESTIONS",
        f"Verified known profile variables ({len(context.known_variable_keys)} resolved, {missing_count} pending).",
        count=len(context.known_variable_keys),
    )

    # Stage 3: REGULATORY_DISCOVERY
    disc_run = None
    if assessment and assessment.discovery_run:
        disc_run = assessment.discovery_run
    if disc_run is None:
        discovery_runs = DiscoveryRun.objects.filter(business=business)
        if assessment:
            discovery_runs = discovery_runs.filter(summary__profile_version_id=str(assessment.profile_version_id))
        disc_run = discovery_runs.order_by("-created_at").first()

    if disc_run is None or force_live_discovery:
        try:
            disc_res = run_discovery(business, max_scrape=1, assessment=assessment,
                profile_version=assessment.profile_version if assessment else None)
            disc_run_id = disc_res.get("run_id")
            disc_run = DiscoveryRun.objects.filter(pk=disc_run_id).first() if disc_run_id else None
        except Exception as exc:
            logger.warning("Live discovery encountered error, continuing with published rules: %s", exc)

    if disc_run and assessment and not disc_run.assessment_id:
        disc_run.assessment = assessment
        disc_run.save(update_fields=["assessment"])

    queries_run = getattr(disc_run, "queries", []) or []
    record_stage(
        "REGULATORY_DISCOVERY",
        f"Searched official regulatory portals across {len(queries_run)} targeted queries.",
        count=len(queries_run),
    )

    # Stage 4: SOURCE_REVIEW
    candidate_count = 0
    sources_count = 0
    if disc_run:
        sources_count = disc_run.scraped_count
        candidate_count = CandidateRequirement.objects.filter(discovery_run=disc_run).count()

    record_stage(
        "SOURCE_REVIEW",
        f"Reviewed {sources_count} regulatory sources; quarantined {candidate_count} candidate claims for verification.",
        count=sources_count,
    )

    # Stage 5: COMPLIANCE_EVALUATION
    from django.db import connection
    try:
        connection.close_if_unusable_or_obsolete()
    except Exception:
        connection.close()

    profile_version = assessment.profile_version if assessment else business.current_profile

    existing_run = None
    if assessment and assessment.decision_run:
        existing_run = assessment.decision_run
    if existing_run is None:
        existing_runs = DecisionRun.objects.filter(business=business)
        if assessment:
            existing_runs = existing_runs.filter(assessment=assessment)
        existing_run = existing_runs.order_by("-created_at").first()

    if existing_run and profile_version and existing_run.profile_version_id == profile_version.id:
        decision_run = existing_run
    elif profile_version:
        engine = ApplicabilityEngine()
        new_run = engine.evaluate_business_profile(
            business=business,
            profile_version=profile_version,
            save_run=True,
        )
        decision_run = new_run
    else:
        decision_run = existing_run

    if decision_run and assessment:
        if not decision_run.assessment_id:
            decision_run.assessment = assessment
            decision_run.save(update_fields=["assessment"])
        if not assessment.decision_run_id:
            assessment.decision_run = decision_run
        if disc_run and not assessment.discovery_run_id:
            assessment.discovery_run = disc_run
        if not assessment.profile_version_id and profile_version:
            assessment.profile_version = profile_version
        assessment.save(update_fields=["decision_run", "discovery_run", "profile_version"])

    actionable_reqs = []
    if decision_run:
        actionable_reqs = [
            r for r in decision_run.results.all()
            if r.status in {ApplicabilityStatus.APPLICABLE, ApplicabilityStatus.NEEDS_INFORMATION}
        ]

    applicable_count = sum(1 for r in actionable_reqs if r.status == ApplicabilityStatus.APPLICABLE)
    needs_info_count = sum(1 for r in actionable_reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION)

    enable_user_auto_ingest = getattr(settings, "ENABLE_USER_PATH_AUTO_INGEST", False)
    if profile_version and applicable_count == 0 and enable_user_auto_ingest:
        try:
            from apps.ingestion.auto_ingest import auto_ingest_regulatory_knowledge
            ingested = auto_ingest_regulatory_knowledge(
                business=business,
                context=context,
                discovery_run=disc_run,
                force=True,
            )
            if ingested:
                engine = ApplicabilityEngine()
                decision_run = engine.evaluate_business_profile(
                    business=business,
                    profile_version=profile_version,
                    save_run=True,
                )
                actionable_reqs = [
                    r for r in decision_run.results.all()
                    if r.status in {ApplicabilityStatus.APPLICABLE, ApplicabilityStatus.NEEDS_INFORMATION}
                ]
                applicable_count = sum(1 for r in actionable_reqs if r.status == ApplicabilityStatus.APPLICABLE)
                needs_info_count = sum(1 for r in actionable_reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION)
                if assessment:
                    decision_run.assessment = assessment
                    decision_run.save(update_fields=["assessment"])
                    assessment.decision_run = decision_run
                    assessment.save(update_fields=["decision_run"])
        except Exception as exc:
            logger.warning("Autonomous knowledge ingestion fallback encountered error: %s", exc)

    record_stage(
        "COMPLIANCE_EVALUATION",
        f"Authoritative evaluation complete: {applicable_count} requirements required, {needs_info_count} need information.",
        count=len(actionable_reqs),
    )

    from domain.intelligence.workspace_guidance import ensure_workspace, get_workspace
    workspace_timings = {}
    if assessment and profile_version and decision_run:
        recorded = [{"requirement_id": r.requirement_id, "title": r.requirement_name,
                     "status": r.status, "rule_version_id": str(r.rule_version_id) if r.rule_version_id else None}
                    for r in decision_run.results.all()]
        from apps.ingestion.models import RetrievedDocument
        capture_ids = [record.get("source_id") for record in (disc_run.scraped_urls or []) if isinstance(record, dict)] if disc_run else []
        captures = RetrievedDocument.objects.filter(source__source_id__in=capture_ids).select_related("source")[:5]
        captured_context = [{"retrieved_document_id": str(capture.id), "source_url": capture.source.canonical_url,
            "source_title": capture.source.title, "excerpt": capture.normalized_content[:3000],
            "verification_status": "UNVERIFIED"} for capture in captures]
        guidance_payload = ensure_workspace(business, assessment, profile_version, recorded,
                         {"queries": queries_run, "captured_sources": sources_count, "evidence_candidates": captured_context},
                         timings=workspace_timings)
        guidance_count = len(guidance_payload.get("compliance_items", []))
        record_stage("WORKSPACE_GUIDANCE", "Prepared contextual planning from this assessment." if guidance_count
                     else "Workspace uses recorded decisions; no contextual guidance was added.", count=guidance_count)
        stage_records[-1]["timings_ms"] = workspace_timings

    # Stage 6: DOCUMENT_PLANNING
    docs_payload = derive_business_documents(business, context=context, assessment_id=str(assessment.id) if assessment else None)
    total_docs = docs_payload.get("total_documents_needed", 0)
    record_stage(
        "DOCUMENT_PLANNING",
        f"Prepared {total_docs} document and record suggestions from this assessment.",
        count=total_docs,
    )

    # Stage 7: WORKFLOW_PLANNING
    wf_payload = derive_business_workflows(business, context=context, assessment_id=str(assessment.id) if assessment else None)
    total_wfs = wf_payload.get("total_workflows", 0)
    record_stage(
        "WORKFLOW_PLANNING",
        f"Prepared {total_wfs} workflows and practical next steps.",
        count=total_wfs,
    )

    # Stage 8: SCHEME_DISCOVERY
    schemes_payload = discover_business_schemes(business, context=context, assessment_id=str(assessment.id) if assessment else None)
    total_schemes = schemes_payload.get("total_schemes_found", 0)
    record_stage(
        "SCHEME_DISCOVERY",
        f"Identified {total_schemes} potentially relevant government support schemes & incentives for {context.state_name}.",
        count=total_schemes,
    )

    # Stage 9: STANDARDS_DISCOVERY
    standards_payload = discover_business_standards(business, context=context, assessment_id=str(assessment.id) if assessment else None)
    total_standards = standards_payload.get("total_standards_found", 0)
    record_stage(
        "STANDARDS_DISCOVERY",
        f"Found {total_standards} standards matches and contextual quality suggestions for review.",
        count=total_standards,
    )

    # Stage 10: CALENDAR_PLANNING
    cal_payload = derive_business_calendar(business, context=context, assessment_id=str(assessment.id) if assessment else None)
    upcoming_deadlines = sum(1 for e in cal_payload.get("events", []) if e.get("days_remaining", 999) <= 30)

    # Stage 11: COMPLETED
    end_time = datetime.now(timezone.utc)
    record_stage(
        "COMPLETED",
        f"Compliance plan synthesized successfully for {business.name}.",
        count=applicable_count,
    )

    from apps.applicability.serializers import DecisionRunSerializer
    run_data = DecisionRunSerializer(decision_run).data if decision_run else None

    executive_summary = {
        "total_requirements_evaluated": len(decision_run.results.all()) if decision_run else 0,
        "requirements_identified": applicable_count,
        "suggested_count": len(get_workspace(business, str(assessment.id) if assessment else None)["compliance_items"]),
        "requirements_action_needed": needs_info_count,
        "documents_to_prepare": total_docs,
        "documents_count": total_docs,
        "major_approval_workflows": total_wfs,
        "workflows_count": total_wfs,
        "upcoming_deadlines": upcoming_deadlines,
        "schemes_identified": total_schemes,
        "schemes_count": total_schemes,
        "standards_identified": total_standards,
        "standards_count": total_standards,
        "official_sources_searched": sources_count,
        "quarantined_claims": candidate_count,
    }

    phase_timings = dict((disc_run.summary or {}).get("timings_ms", {})) if disc_run else {}
    if assessment:
        phase_timings.update(AssessmentRun(assessment).to_safe_dict()["phase_timings_ms"])
    for phase, duration in workspace_timings.items():
        phase_timings[phase] = round(phase_timings.get(phase, 0.0) + duration, 2)

    if assessment:
        assessment.status = AssessmentStatus.COMPLETED
        assessment.current_step = 5
        assessment.completed_at = end_time
        assessment.summary = executive_summary
        assessment.step_state = {**(assessment.step_state or {}), "analysis": {
            "stages": stage_records, "timings_ms": {stage["stage"]: stage["duration_ms"] for stage in stage_records},
            "phase_timings_ms": phase_timings,
            "duration_seconds": (end_time - start_time).total_seconds(), "completed_at": end_time.isoformat(),
        }}
        assessment.save(update_fields=["status", "current_step", "completed_at", "summary", "step_state"])

        try:
            from apps.businesses.models import UserWorkspaceState
            user = assessment.created_by or getattr(business, "owner", None)
            if user:
                ws, _ = UserWorkspaceState.objects.get_or_create(user=user)
                ws.active_business = business
                ws.active_assessment = assessment
                ws.save()
        except Exception:
            pass

    disc_payload = None
    if disc_run:
        cand_reqs = [
            {
                "id": str(cr.id),
                "requirement_name": cr.requirement_name,
                "category": cr.category,
                "authority": cr.authority,
                "jurisdiction": cr.jurisdiction,
                "applicability_statement": cr.applicability_statement,
                "prerequisite": cr.prerequisite,
                "document_requirements": cr.document_requirements or [],
                "fee_info": cr.fee_info or "",
                "deadline_info": cr.deadline_info or "",
                "source_id": cr.source.source_id if getattr(cr, "source", None) else "",
                "source_url": (cr.source.canonical_url if getattr(cr, "source", None) else "") or "",
                "evidence_excerpt": cr.evidence.excerpt if getattr(cr, "evidence", None) else "",
                "verification_status": cr.verification_status,
            }
            for cr in CandidateRequirement.objects.filter(discovery_run=disc_run).select_related("source", "evidence")
        ]
        disc_payload = {
            "ran": True,
            "run_id": str(disc_run.id),
            "status": disc_run.status,
            "discovery_available": True,
            "queries": disc_run.queries or [],
            "candidate_urls_count": disc_run.candidate_count or len(disc_run.candidate_urls or []),
            "sources_scraped": disc_run.scraped_count or len(disc_run.scraped_urls or []),
            "official_sources_count": disc_run.official_source_count,
            "verified_count": disc_run.verified_count,
            "candidate_requirements_count": len(cand_reqs),
            "candidate_requirements": cand_reqs,
            "errors": [disc_run.error] if disc_run.error else [],
            "note": "Live regulatory discovery executed and quarantined.",
        }
    else:
        disc_payload = {
            "ran": False,
            "run_id": "",
            "status": "UNAVAILABLE",
            "discovery_available": False,
            "queries": queries_run,
            "candidate_urls_count": sources_count,
            "sources_scraped": sources_count,
            "official_sources_count": 0,
            "verified_count": 0,
            "candidate_requirements_count": candidate_count,
            "candidate_requirements": [],
            "errors": [],
            "note": "Knowledge base rules applied.",
        }

    return {
        "analysis_id": analysis_id,
        "business_id": str(business.id),
        "business_name": business.name,
        "assessment_id": str(assessment.id) if assessment else None,
        "assessment_number": assessment.assessment_number if assessment else 1,
        "assessment_title": assessment.title if assessment else None,
        "assessment_status": assessment.status if assessment else None,
        "status": "COMPLETED",
        "current_stage": "COMPLETED",
        "started_at": start_time.isoformat(),
        "completed_at": end_time.isoformat(),
        "duration_seconds": (end_time - start_time).total_seconds(),
        "timings_ms": {stage["stage"]: stage["duration_ms"] for stage in stage_records},
        "phase_timings_ms": phase_timings,
        "stages": stage_records,
        "decision_run": run_data,
        "executive_summary": executive_summary,
        "discovery": disc_payload,
        "live_discovery": disc_payload,
        "context_summary": context.as_dict(),
    }
