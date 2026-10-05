"""Normalized business-context representation for planning, discovery and applicability.

Authority: Milestone Task — Parts A, B, C; PRD_v2.0 §11; TRD_v2.0 §8.

Derives a single canonical, enriched snapshot from:
- Business entity identity
- Latest immutable BusinessProfileVersion
- Products & Activities text
- Smart Question answers
- Canonical profile variable definitions (V01–V19)

No authoritative business data is duplicated: this is a computed domain view.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from datetime import date
import re
from typing import Any

from domain.jurisdictions.resolver import JurisdictionRegistry, normalize_jurisdiction
from domain.profile.variables import (
    PROFILE_VARIABLES,
    VARIABLES_BY_KEY,
    Relevance,
    get_variable,
)
from apps.businesses.models import Business


# Classification aid, not proof of Udyam registration or scheme eligibility.
# Source: Ministry of MSME Chennai revised definition; official link in submission report.
# Revised criteria effective 2025-04-01; previous limits retained for dated use.
MSME_CLASSIFICATION_REFERENCE = "Ministry of MSME, revised classification effective 2025-04-01; see docs/final-submission-report.md"
MICRO_INVESTMENT = Decimal("25000000")
MICRO_TURNOVER = Decimal("100000000")
SMALL_INVESTMENT = Decimal("250000000")
SMALL_TURNOVER = Decimal("1000000000")
MEDIUM_INVESTMENT = Decimal("1250000000")
MEDIUM_TURNOVER = Decimal("5000000000")


def derive_msme_scale(
    investment: Decimal | None,
    turnover: Decimal | None,
    *, as_of: date | None = None,
) -> str:
    """Classify MSME scale using MSMED Act composite investment & turnover criteria."""
    if investment is None or turnover is None or investment < 0 or turnover < 0:
        return "UNKNOWN"

    limits = [(MICRO_INVESTMENT, MICRO_TURNOVER), (SMALL_INVESTMENT, SMALL_TURNOVER), (MEDIUM_INVESTMENT, MEDIUM_TURNOVER)]
    if (as_of or date.today()) < date(2025, 4, 1):
        limits = [(Decimal("10000000"), Decimal("50000000")),
                  (Decimal("100000000"), Decimal("500000000")),
                  (Decimal("500000000"), Decimal("2500000000"))]
    for scale, (inv_limit, turnover_limit) in zip(("MICRO", "SMALL", "MEDIUM"), limits):
        if investment <= inv_limit and turnover <= turnover_limit:
            return scale
    return "LARGE"


@dataclass(frozen=True)
class DerivedBusinessContext:
    """Normalized, immutable context representing the complete business state."""

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
    ecommerce_operations: bool | None
    multi_state_operations: bool | None
    msme_scale: str
    detected_activities: list[str] = field(default_factory=list)
    raw_variables: dict[str, Any] = field(default_factory=dict)
    known_variable_keys: list[str] = field(default_factory=list)
    missing_variable_keys: list[str] = field(default_factory=list)

    @property
    def is_manufacturing(self) -> bool:
        """Heuristic indication of manufacturing operations."""
        desc = (self.product_description or "").lower()
        desc = re.sub(r"\b(?:no|not|without|does\s+not|do\s+not)\s+[^.;\n]+", " ", desc)
        service_words = ["software", "saas", "platform", "app", "web application", "cloud", "digital", "consulting", "it services", "edtech", "fintech", "pre-visualization", "agency"]
        if any(sw in desc for sw in service_words) and not any(hw in desc for hw in ["hardware manufacturing", "assembly plant", "fabrication plant", "physical manufacturing"]):
            return False

        mfg_words = [r"\bmanufactur", r"\bassembl", r"\bfabricat", r"\bplant\b", r"\bfactory\b", r"\bboiler\b", r"\bfurnace\b", r"\bprocess", r"\bproduct", r"\bmachin"]
        return any(re.search(w, desc) for w in mfg_words)

    @property
    def is_cross_border(self) -> bool:
        return self.trade_intent in {"IMPORT_ONLY", "EXPORT_ONLY", "IMPORT_AND_EXPORT", "PLANNED"}

    @property
    def has_environmental_footprint(self) -> bool:
        return bool(self.effluent_emission_generation or self.hazardous_waste_generation)

    @property
    def primary_activity(self) -> str:
        if self.detected_activities:
            return ", ".join(self.detected_activities)
        return self.product_description or "Manufacturing / Processing"

    @property
    def industry_hint(self) -> str:
        if self.detected_activities:
            return ", ".join(self.detected_activities)
        return "Industrial operations"

    def as_dict(self) -> dict[str, Any]:
        return {
            "business_id": self.business_id,
            "business_name": self.business_name,
            "legal_constitution": self.legal_constitution,
            "state": self.state,
            "state_name": self.state_name,
            "district": self.district,
            "industrial_zone_status": self.industrial_zone_status,
            "lifecycle_stage": self.lifecycle_stage,
            "product_description": self.product_description,
            "trade_intent": self.trade_intent,
            "annual_turnover": str(self.annual_turnover) if self.annual_turnover is not None else None,
            "plant_machinery_investment": str(self.plant_machinery_investment) if self.plant_machinery_investment is not None else None,
            "total_worker_count": self.total_worker_count,
            "contract_worker_count": self.contract_worker_count,
            "connected_power_load": str(self.connected_power_load) if self.connected_power_load is not None else None,
            "effluent_emission_generation": self.effluent_emission_generation,
            "hazardous_waste_generation": self.hazardous_waste_generation,
            "ecommerce_operations": self.ecommerce_operations,
            "multi_state_operations": self.multi_state_operations,
            "msme_scale": self.msme_scale,
            "detected_activities": self.detected_activities,
            "known_variable_keys": self.known_variable_keys,
            "missing_variable_keys": self.missing_variable_keys,
        }

    def to_llm_summary(self) -> str:
        """Produce a structured text summary for LLM prompt context."""
        parts = [
            f"Business Name: {self.business_name}",
            f"Jurisdiction: {self.state_name} ({self.state})" if self.state else "Jurisdiction: Unknown",
            f"District/Hub: {self.district}" if self.district else None,
            f"Legal Constitution: {self.legal_constitution}" if self.legal_constitution else None,
            f"Lifecycle Stage: {self.lifecycle_stage}" if self.lifecycle_stage else None,
            f"Activity / Products: {self.product_description}" if self.product_description else None,
            f"Trade Intent: {self.trade_intent}" if self.trade_intent else None,
            f"MSME Scale: {self.msme_scale}",
            f"Turnover (INR): {self.annual_turnover:,.0f}" if self.annual_turnover is not None else "Turnover: Not specified",
            f"Plant & Machinery Investment (INR): {self.plant_machinery_investment:,.0f}" if self.plant_machinery_investment is not None else None,
            f"Workforce: {self.total_worker_count} workers" if self.total_worker_count is not None else None,
            f"Connected Power Load: {self.connected_power_load} HP" if self.connected_power_load is not None else None,
            f"Effluent/Emissions: {'Yes' if self.effluent_emission_generation else 'No' if self.effluent_emission_generation is False else 'Unknown'}",
            f"Hazardous Waste: {'Yes' if self.hazardous_waste_generation else 'No' if self.hazardous_waste_generation is False else 'Unknown'}",
        ]
        return "\n".join(p for p in parts if p is not None)


def _to_decimal(val: Any) -> Decimal | None:
    if val is None or val == "":
        return None
    try:
        return Decimal(str(val))
    except Exception:
        return None


def _to_int(val: Any) -> int | None:
    if val is None or val == "":
        return None
    try:
        return int(val)
    except Exception:
        return None


def _to_bool(val: Any) -> bool | None:
    if val is None or val == "":
        return None
    if isinstance(val, bool):
        return val
    s = str(val).strip().lower()
    if s in {"true", "yes", "1"}:
        return True
    if s in {"false", "no", "0"}:
        return False
    return None


def build_business_context(business: Business, *, profile_version=None) -> DerivedBusinessContext:
    """Build a DerivedBusinessContext snapshot for a business."""
    profile = profile_version if profile_version is not None else business.current_profile
    raw_vars: dict[str, Any] = {}
    if profile and profile.variables:
        for k, entry in profile.variables.items():
            if isinstance(entry, dict) and entry.get("value") not in (None, ""):
                raw_vars[k] = entry["value"]

    saved_keys = set(raw_vars)
    # These are the same factual aliases used by the applicability engine.
    # Do not infer activity from the company name or turn unknown into zero.
    if raw_vars.get("product_description") and not raw_vars.get("primary_activity"):
        raw_vars["primary_activity"] = raw_vars["product_description"]
    for target, source in (("total_workforce", "total_worker_count"), ("total_worker_count", "total_workforce"),
                           ("jurisdiction_state", "state")):
        if raw_vars.get(target) in (None, "") and raw_vars.get(source) not in (None, ""):
            raw_vars[target] = raw_vars[source]

    # Jurisdiction resolution
    raw_state = raw_vars.get("state")
    canonical_state = normalize_jurisdiction(str(raw_state)) if raw_state else ""
    state_name = ""
    if canonical_state:
        for item in JurisdictionRegistry.all_jurisdictions():
            if item["code"] == canonical_state:
                state_name = item["name"]
                break
    if not state_name and canonical_state:
        state_name = canonical_state.replace("_", " ").title()

    turnover = _to_decimal(raw_vars.get("annual_turnover"))
    investment = _to_decimal(raw_vars.get("plant_machinery_investment"))
    msme_scale = derive_msme_scale(investment, turnover)

    # Activity keyword detection from knowledge ASTs
    from apps.onboarding.services import detect_activity_keywords
    desc = str(raw_vars.get("product_description") or "")
    detected_activities = detect_activity_keywords(desc) if desc.strip() else []

    known_keys = [k for k in sorted(saved_keys) if raw_vars[k] is not None]
    all_canon_keys = [pv.key for pv in PROFILE_VARIABLES]
    missing_keys = [k for k in all_canon_keys if k not in known_keys]

    return DerivedBusinessContext(
        business_id=str(business.id),
        business_name=business.name,
        legal_constitution=str(raw_vars.get("legal_constitution") or ""),
        state=canonical_state,
        state_name=state_name,
        district=str(raw_vars.get("district") or ""),
        industrial_zone_status=str(raw_vars.get("industrial_zone_status") or ""),
        lifecycle_stage=str(raw_vars.get("lifecycle_stage") or ""),
        product_description=desc,
        trade_intent=str(raw_vars.get("import_export_intent") or "NONE"),
        annual_turnover=turnover,
        plant_machinery_investment=investment,
        total_worker_count=_to_int(raw_vars.get("total_worker_count")),
        contract_worker_count=_to_int(raw_vars.get("contract_worker_count")),
        connected_power_load=_to_decimal(raw_vars.get("connected_power_load")),
        effluent_emission_generation=_to_bool(raw_vars.get("effluent_emission_generation")),
        hazardous_waste_generation=_to_bool(raw_vars.get("hazardous_waste_generation")),
        ecommerce_operations=_to_bool(raw_vars.get("ecommerce_operations")),
        multi_state_operations=_to_bool(raw_vars.get("multi_state_operations")),
        msme_scale=msme_scale,
        detected_activities=detected_activities,
        raw_variables=raw_vars,
        known_variable_keys=known_keys,
        missing_variable_keys=missing_keys,
    )
