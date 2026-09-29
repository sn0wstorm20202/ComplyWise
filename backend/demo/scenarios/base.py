"""Base classes for ComplyWise Demo Scenarios.

Authority: SELECTION DEMO SPECIFICATION Part 3 & 4
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from common.enums import ApplicabilityStatus
from demo.destinations import ActionDestination, resolve_demo_destination


@dataclass
class DemoRequirementItem:
    """Canonical specification of a compliance requirement within a demo scenario."""

    requirement_id: str
    name: str
    authority: str
    jurisdiction: str
    domain: str
    status: ApplicabilityStatus
    description: str
    why_it_applies: str
    statutory_act: str
    required_documents: list[str] = field(default_factory=list)
    application_steps: list[str] = field(default_factory=list)
    timeline: str = "Prior to operations"
    statutory_fee: str = "Prescribed statutory scale"
    missing_facts: list[str] = field(default_factory=list)
    facts_used: list[str] = field(default_factory=list)
    evidence_records: list[dict[str, Any]] = field(default_factory=list)

    @property
    def action_destination(self) -> ActionDestination:
        return resolve_demo_destination(self.requirement_id, authority=self.authority)

    def to_dict(self) -> dict[str, Any]:
        dest = self.action_destination
        return {
            "requirement_id": self.requirement_id,
            "name": self.name,
            "authority": self.authority,
            "jurisdiction": self.jurisdiction,
            "domain": self.domain,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "description": self.description,
            "why_it_applies": self.why_it_applies,
            "statutory_act": self.statutory_act,
            "required_documents": self.required_documents,
            "application_steps": self.application_steps,
            "timeline": self.timeline,
            "statutory_fee": self.statutory_fee,
            "missing_facts": self.missing_facts,
            "facts_used": self.facts_used,
            "action_destination": dest.to_dict(),
            "evidence_records": self.evidence_records,
        }


class DemoScenario(ABC):
    """Abstract base class for curated deterministic demo scenarios."""

    scenario_id: str
    name: str
    description: str

    @abstractmethod
    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        """Evaluate whether this scenario matches the canonical business facts."""
        raise NotImplementedError

    @abstractmethod
    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        """Return the complete canonical list of requirements for this scenario."""
        raise NotImplementedError
