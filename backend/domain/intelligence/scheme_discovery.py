"""Dynamic government scheme and incentive discovery engine.

Authority: PRD_v2.0 §21; TRD_v2.0 §30; Milestone Task — Schemes Pipeline.

Discovers business-specific government support schemes based on:
1. Enterprise scale (MSMED Act 2020: Micro, Small, Medium, Large).
2. Sector & Activity profile (Food processing, Electronics, Automotive/Machining, Textile, etc.).
3. Jurisdiction & State industrial policies (Maharashtra PSI 2019/2024, Central MSME, DPIIT).
4. Continuous Ingestion Pipeline & Immutable Version Store.
"""

from __future__ import annotations

from typing import Any

from apps.businesses.models import Business
from apps.schemes.engine.matcher import match_business_schemes
from domain.context.business_context import DerivedBusinessContext


def discover_business_schemes(
    business: Business,
    context: DerivedBusinessContext | None = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Dynamically discover government schemes matching the business's profile via ingestion database."""
    return match_business_schemes(business, context=context, assessment_id=assessment_id)
