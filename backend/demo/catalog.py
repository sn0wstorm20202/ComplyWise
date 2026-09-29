"""Canonical Demo Compliance Catalog.

Authority: SELECTION DEMO SPECIFICATION Part 5
Consolidates all demo scenario requirements and provides metadata lookups.
"""

from __future__ import annotations

from typing import Any

from .scenarios.base import DemoRequirementItem
from .scenarios.meridian_pharma import MeridianPharmaScenario
from .scenarios.saas import SaasScenario
from .scenarios.textile import TextileScenario
from .scenarios.logistics import LogisticsScenario
from .scenarios.food_processing import FoodProcessingScenario


class DemoCatalog:
    """Consolidated registry of demo requirement definitions."""

    @classmethod
    def get_all_demo_requirements(cls) -> list[DemoRequirementItem]:
        """Aggregate requirements across all curated scenarios."""
        seen: set[str] = set()
        all_reqs: list[DemoRequirementItem] = []

        scenarios = [
            MeridianPharmaScenario(),
            SaasScenario(),
            TextileScenario(),
            LogisticsScenario(),
            FoodProcessingScenario(),
        ]

        dummy_context = {
            "total_worker_count": 164,
            "annual_turnover": 420000000,
            "state": "TELANGANA",
            "is_manufacturing": True,
        }

        for scenario in scenarios:
            for req in scenario.get_requirements(dummy_context):
                if req.requirement_id not in seen:
                    seen.add(req.requirement_id)
                    all_reqs.append(req)

        return all_reqs

    @classmethod
    def find_requirement(cls, requirement_id: str) -> DemoRequirementItem | None:
        """Find a demo requirement by ID."""
        for req in cls.get_all_demo_requirements():
            if req.requirement_id.upper() == requirement_id.upper():
                return req
        return None
