"""Demo Scenario Resolver for ComplyWise.

Authority: SELECTION DEMO SPECIFICATION Part 2, 3, 6, 7
Invariants:
1. One controlled abstraction for demo scenario handling.
2. Does NOT scatter demo checks across business logic.
3. Produces standard canonical domain objects (DecisionResult, RequirementDefinition, Evidence).
4. Rest of the application (CIR, frontend, admin scrutiny, workflows, calendar) receives normal objects.
"""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings
from django.utils import timezone

from apps.applicability.models import DecisionResult, DecisionRun
from apps.evidence.models import Evidence, Source
from apps.knowledge.models import RequirementDefinition
from common.enums import (
    ApplicabilityStatus,
    KnowledgeStatus,
    SourceStatus,
    VerificationStatus,
)
from .scenarios.base import DemoRequirementItem, DemoScenario
from .scenarios.construction import ConstructionScenario
from .scenarios.data_centre import DataCentreScenario
from .scenarios.ev_charging import EvChargingScenario
from .scenarios.food_processing import FoodProcessingScenario
from .scenarios.logistics import LogisticsScenario
from .scenarios.meridian_pharma import MeridianPharmaScenario
from .scenarios.microfinance import MicrofinanceScenario
from .scenarios.saas import SaasScenario
from .scenarios.textile import TextileScenario
from .scenarios.textile_export import TextileExportScenario

logger = logging.getLogger("complywise.demo.resolver")


class DemoScenarioResolver:
    """Orchestrates deterministic demo scenario matching and canonical projection."""

    _SCENARIOS: list[DemoScenario] = [
        MeridianPharmaScenario(),
        EvChargingScenario(),
        ConstructionScenario(),
        TextileExportScenario(),
        DataCentreScenario(),
        MicrofinanceScenario(),
        SaasScenario(),
        TextileScenario(),
        LogisticsScenario(),
        FoodProcessingScenario(),
    ]

    @classmethod
    def is_demo_mode(cls) -> bool:
        """Check whether Demo Mode is actively enabled in settings."""
        return getattr(settings, "COMPLYWISE_DEMO_MODE", False)

    @classmethod
    def resolve_scenario(cls, business_name: str, context: dict[str, Any]) -> DemoScenario | None:
        """Match canonical business facts to one of the curated demo scenarios."""
        if not cls.is_demo_mode():
            return None

        for scenario in cls._SCENARIOS:
            try:
                if scenario.matches(business_name, context):
                    logger.info(
                        "DemoScenarioResolver: Matched %s for business '%s'",
                        scenario.scenario_id,
                        business_name,
                    )
                    return scenario
            except Exception as e:
                logger.warning("Error evaluating demo scenario %s: %s", scenario.scenario_id, e)

        return None

    @classmethod
    def ensure_backing_knowledge(cls, demo_items: list[DemoRequirementItem]) -> None:
        """Ensure canonical RequirementDefinition and Evidence records exist in DB for demo items."""
        for item in demo_items:
            dest = item.action_destination
            meta = {
                "statutory_act": item.statutory_act,
                "required_documents": item.required_documents,
                "application_steps": item.application_steps,
                "timeline": item.timeline,
                "statutory_fee": item.statutory_fee,
                "portal": dest.url,
                "portal_name": dest.portal_name,
                "destination_type": dest.destination_type.value,
                "display_label": dest.display_label,
                "requires_login": dest.requires_login,
            }

            req_def, _ = RequirementDefinition.objects.update_or_create(
                requirement_id=item.requirement_id,
                defaults={
                    "name": item.name,
                    "authority": item.authority,
                    "jurisdiction": item.jurisdiction,
                    "domain": item.domain,
                    "description": item.description,
                    "status": KnowledgeStatus.PUBLISHED,
                    "metadata": meta,
                },
            )

            # Ensure backing Evidence and Source records
            if item.evidence_records:
                for ev in item.evidence_records:
                    ev_id = ev.get("evidence_id", f"EV-{item.requirement_id}")
                    src_id = f"SRC-{item.requirement_id}"

                    src, _ = Source.objects.get_or_create(
                        source_id=src_id,
                        defaults={
                            "authority": item.authority,
                            "title": ev.get("source_title", item.statutory_act),
                            "canonical_url": ev.get("canonical_url", dest.url),
                            "status": SourceStatus.ACTIVE,
                        },
                    )

                    Evidence.objects.get_or_create(
                        evidence_id=ev_id,
                        defaults={
                            "source": src,
                            "locator": ev.get("locator", item.statutory_act),
                            "excerpt": ev.get("excerpt", item.why_it_applies),
                            "verification_status": VerificationStatus.VERIFIED,
                        },
                    )

    @classmethod
    def generate_decision_results(
        cls,
        decision_run: DecisionRun,
        scenario: DemoScenario,
        context: dict[str, Any],
    ) -> list[DecisionResult]:
        """Produce canonical DecisionResult instances for the matched scenario."""
        demo_items = scenario.get_requirements(context)
        cls.ensure_backing_knowledge(demo_items)

        results: list[DecisionResult] = []

        for item in demo_items:
            dest = item.action_destination
            associated_evidence: list[dict[str, Any]] = []

            for ev in item.evidence_records:
                associated_evidence.append(
                    {
                        "evidence_id": ev.get("evidence_id"),
                        "source_id": f"SRC-{item.requirement_id}",
                        "source_title": ev.get("source_title", item.statutory_act),
                        "authority": ev.get("authority", item.authority),
                        "locator": ev.get("locator", item.statutory_act),
                        "excerpt": ev.get("excerpt", item.why_it_applies),
                        "verification_status": ev.get("verification_status", "VERIFIED"),
                        "canonical_url": ev.get("canonical_url", dest.url),
                    }
                )

            trace: dict[str, Any] = {
                "requirement_id": item.requirement_id,
                "requirement_name": item.name,
                "authority": item.authority,
                "jurisdiction": item.jurisdiction,
                "status": item.status.value if hasattr(item.status, "value") else str(item.status),
                "reason": "DEMO_SCENARIO_EVALUATION",
                "note": item.why_it_applies,
                "missing_facts": item.missing_facts,
                "facts_used": item.facts_used,
                "evaluations": [
                    {
                        "rule_id": f"RULE-{item.requirement_id}-01",
                        "result": item.status.value if hasattr(item.status, "value") else str(item.status),
                        "matched": item.status == ApplicabilityStatus.APPLICABLE,
                        "reason": item.why_it_applies,
                    }
                ],
                "evidence_count": len(associated_evidence),
                "action_destination": dest.to_dict(),
            }

            dr = DecisionResult(
                decision_run=decision_run,
                requirement_id=item.requirement_id,
                requirement_name=item.name,
                rule_version=None,
                status=item.status,
                explanation_trace=trace,
                evidence_refs=associated_evidence,
            )
            results.append(dr)

        return results
