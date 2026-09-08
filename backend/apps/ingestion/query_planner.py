"""Regulatory Query Planner for dynamic source discovery.

Authority: Milestone Task — Part C; TRD_v2.0 §11A.

Constructs focused, multidimensional queries from a business context:
- SPCB Consent to Establish / Operate (Water & Air Acts)
- Factories Act licensing
- Product safety & technical standards (BIS QCO)
- Waste management / EPR (Battery, E-Waste, Plastic, Hazardous)
- Cross-border trade (DGFT / Customs)
- State industrial approvals & policies

Queries are dynamically parameterized by the business profile:
never hardcoded to any golden fixture.
"""

from __future__ import annotations

import re
from typing import Any
from domain.context.business_context import DerivedBusinessContext


def _clean_keywords(text: str, max_words: int = 6) -> str:
    """Extract salient words from a text description."""
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    stopwords = {"and", "with", "from", "for", "the", "that", "this", "our", "all", "are", "have", "been", "operating"}
    words = [w for w in cleaned.split() if len(w) > 3 and w.lower() not in stopwords]
    return " ".join(words[:max_words])


class RegulatoryQueryPlanner:
    """Generates focused regulatory queries based on structured business context."""

    @staticmethod
    def plan_queries(context: DerivedBusinessContext, max_queries: int = 6) -> list[str]:
        queries: list[str] = []
        state_name = context.state_name or "India"
        activity_phrase = _clean_keywords(context.product_description) or "manufacturing"

        # 1. State Environmental Consent (CTE / CTO)
        if state_name != "India":
            queries.append(
                f"{state_name} pollution control board consent to establish {activity_phrase} official"
            )
        else:
            queries.append(
                f"state pollution control board consent to establish {activity_phrase} guidelines official"
            )

        # 2. State Factory Act Licensing
        if context.is_manufacturing and state_name != "India":
            queries.append(
                f"{state_name} factories directorate factory licence registration eligibility"
            )
        elif context.is_manufacturing:
            queries.append(
                f"factory licence registration eligibility rules manufacturing India official"
            )

        # 3. Product Safety, BIS Quality Control Orders, Technical Standards
        if activity_phrase:
            queries.append(
                f"BIS mandatory certification Quality Control Order {activity_phrase} India"
            )

        # 4. Waste Management & EPR (Battery / E-Waste / Hazardous)
        desc_lower = (context.product_description or "").lower()
        if "battery" in desc_lower or "cell" in desc_lower:
            queries.append(
                "Battery Waste Management Rules 2022 EPR portal registration CPCB India"
            )
        elif "electronic" in desc_lower or "telemetry" in desc_lower or "meter" in desc_lower:
            queries.append(
                "E-Waste Management Rules EPR registration CPCB India official"
            )
        elif context.hazardous_waste_generation or "chemical" in desc_lower:
            queries.append(
                "Hazardous and Other Wastes Rules authorization SPCB India official"
            )

        # 5. Cross-Border Trade (DGFT / Customs / IEC)
        if context.is_cross_border:
            queries.append(
                f"DGFT import export code registration guidelines {activity_phrase} India"
            )

        # 6. MSME / Industrial Schemes
        if context.msme_scale in {"MICRO", "SMALL", "MEDIUM"} and state_name != "India":
            queries.append(
                f"{state_name} industrial policy {context.msme_scale.lower()} enterprise incentives {activity_phrase}"
            )

        # Deduplicate while preserving order
        seen = set()
        deduped: list[str] = []
        for q in queries:
            if q not in seen:
                seen.add(q)
                deduped.append(q)

        return deduped[:max_queries]
