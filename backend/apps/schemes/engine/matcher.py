"""Business Context Matching and Discovery Engine for Schemes.

Authority: User Specification —
"Context-driven Filtering: Rather than showing a generic list, the app only
queries relevant entries. Cement manufacturers in Maharashtra will see
Maharashtra-specific schemes; they won’t see unrelated electronics grants.
A scheme tagged 'Maharashtra – Textile manufacturing – Medium enterprises'
will match only businesses with State = Maharashtra, Sector = Textile, Size = Medium.
The string should be related to business context and also some which are applicable
for all industries."
"""

from __future__ import annotations

from typing import Any

from apps.businesses.models import Business
from apps.schemes.models import Scheme, SchemeVersion
from apps.schemes.pipeline.service import SchemePipelineService
from domain.context.business_context import DerivedBusinessContext, build_business_context


SECTOR_KEYWORDS = {
    "TEXTILE": [
        "textile", "garment", "fabric", "cotton", "ginning", "weaving", "spinning",
        "apparel", "yarn", "knitting", "loom", "silk", "cloth"
    ],
    "FOOD_PROCESSING": [
        "food", "fruit", "grain", "spice", "agro", "dairy", "bakery", "millet",
        "flour", "snack", "edible", "cereal", "beverage", "dehydrat", "onion",
        "garlic", "pickle", "cold storage", "packhouse", "meat", "pulses", "oilseed"
    ],
    "AUTOMOTIVE": [
        "auto", "car", "vehic", "motor", "engine", "gear", "transmission", "clutch",
        "ev", "powertrain", "chassis", "battery pack", "two wheeler", "three wheeler",
        "commercial vehicle"
    ],
    "ENGINEERING": [
        "metal", "machin", "cnc", "component", "precision", "fabricat", "tool",
        "casting", "forging", "mechanical", "sheet metal", "welding", "fitting", "lathe"
    ],
    "ELECTRONICS": [
        "electron", "pcb", "chip", "semiconduct", "sensor", "battery", "meter",
        "smart", "circuit", "bess", "hardware", "esdm", "telecom", "passive component"
    ],
    "PHARMACEUTICALS": [
        "pharma", "drug", "medicine", "biotech", "api", "ksm", "formulation",
        "bulk drug", "cleanroom", "who-gmp", "vaccine", "diagnostic"
    ],
    "SERVICES": [
        "software", "consult", "it", "logistics", "trade", "bpo", "financial"
    ],
}


def evaluate_sector_eligibility(
    scheme_sectors: list[str],
    product_desc: str,
    is_manufacturing: bool,
    is_cross_border: bool,
) -> tuple[bool, str, bool]:
    """Evaluates sector eligibility with strict differentiation:

    - Universal schemes (sectors containing 'ALL'): match ALL businesses.
    - Export schemes (sectors containing 'EXPORT'): match only if trade intent involves export.
    - Sector-specific schemes (Textile, Food, Auto, Electronics, Pharma): match ONLY if
      keywords matching that sector are present in product description.
    - General Manufacturing schemes (sectors == ['MANUFACTURING']): match if manufacturing.

    Returns:
        (is_eligible, matched_category_name, is_universal)
    """
    if not scheme_sectors or "ALL" in scheme_sectors or "UNIVERSAL" in scheme_sectors:
        return True, "All Industries", True

    desc = (product_desc or "").lower()

    # Export scheme check
    if "EXPORT" in scheme_sectors:
        if is_cross_border or any(w in desc for w in ["export", "overseas", "foreign trade", "icegate", "international"]):
            return True, "Export Promotion", False
        return False, "", False

    # Check specific sector tags
    matched_sectors = []
    for sec in scheme_sectors:
        sec_upper = sec.upper()
        if sec_upper in SECTOR_KEYWORDS:
            keywords = SECTOR_KEYWORDS[sec_upper]
            if any(k in desc for k in keywords):
                matched_sectors.append(sec_upper.replace("_", " ").title())

    if matched_sectors:
        return True, ", ".join(matched_sectors), False

    # General manufacturing only if explicitly tagged MANUFACTURING and business is manufacturing
    if is_manufacturing and scheme_sectors == ["MANUFACTURING"]:
        return True, "Manufacturing", False

    return False, "", False


def match_business_schemes(
    business: Business,
    context: DerivedBusinessContext | None = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Matches active, verified schemes from the database against business context.

    Returns:
        - Universal schemes applicable to all industries
        - State-specific schemes matching the business state (e.g. Maharashtra)
        - Targeted sector schemes matching the business's industry (Food, Auto, Textile, etc.)
    """
    if context is None:
        context = build_business_context(business)

    raw_state = (context.state or "").upper()
    state_code = "MH" if raw_state in ["MH", "MAHARASHTRA"] else ("GJ" if raw_state in ["GJ", "GUJARAT"] else raw_state)
    state_name = context.state_name or ("Maharashtra" if state_code == "MH" else ("Gujarat" if state_code == "GJ" else state_code))
    msme_scale = context.msme_scale  # "MICRO", "SMALL", "MEDIUM", "LARGE", "UNKNOWN"
    desc = (context.product_description or "").lower()

    active_schemes = Scheme.objects.filter(is_active=True).prefetch_related("versions")

    matched_schemes: list[dict[str, Any]] = []

    for scheme in active_schemes:
        ver = scheme.versions.filter(version_number=scheme.current_version_number, is_active=True).first()
        if not ver:
            ver = scheme.versions.filter(is_active=True).order_by("-version_number").first()
        if not ver:
            continue

        # 1. Jurisdiction Match
        # CENTRAL schemes apply nationally across all Indian states.
        # State-specific schemes (e.g. MH) match ONLY if business is in Maharashtra.
        is_central = ver.jurisdiction == "CENTRAL"
        is_state_match = ver.jurisdiction == state_code or (
            ver.jurisdiction in ["MH", "MAHARASHTRA"] and state_code in ["MH", "MAHARASHTRA"]
        )

        if not (is_central or is_state_match):
            continue

        # 1a. Regional Scope Exclusion (UNNATI is strictly for North Eastern states)
        if "UNNATI" in scheme.scheme_code or "NORTH_EAST" in (ver.title or "").upper():
            ne_states = {
                "ASSAM", "ARUNACHAL_PRADESH", "MANIPUR", "MEGHALAYA", "MIZORAM",
                "NAGALAND", "TRIPURA", "SIKKIM", "AS", "AR", "MN", "ML", "MZ", "NL", "TR", "SK"
            }
            if raw_state not in ne_states:
                continue

        # 1b. Non-manufacturing service exclusions
        if not context.is_manufacturing:
            # Physical cluster programs and manufacturing certifications do not apply
            if "CLUSTER" in ver.title.upper() or "MSE-CDP" in scheme.scheme_code or "ZED" in scheme.scheme_code:
                continue
            # Physical merchandise export duty drawback (RoDTEP) does not apply to software
            if "RODTEP" in scheme.scheme_code:
                continue
            # PMEGP/CMEGP micro employment subsidies do not apply to software/SaaS
            if "PMEGP" in scheme.scheme_code or "CMEGP" in scheme.scheme_code:
                continue

        # 2. MSME Scale Match
        scheme_scales = ver.scale_match or []
        if scheme_scales and msme_scale != "UNKNOWN":
            if msme_scale not in scheme_scales:
                continue

        # 3. Sector & Activity Match (Universal vs Targeted)
        scheme_sectors = ver.sectors or ["ALL"]
        is_sector_eligible, matched_category_name, is_universal = evaluate_sector_eligibility(
            scheme_sectors, desc, context.is_manufacturing, context.is_cross_border
        )
        if not is_sector_eligible:
            continue

        # 4. Generate Relevance Rationale
        scale_str = msme_scale.capitalize() if msme_scale != "UNKNOWN" else "MSME"
        if is_universal:
            if not is_central:
                rationale = (
                    f"Universal Maharashtra State incentive: Available for all eligible {scale_str} "
                    f"enterprises operating within {state_name} qualifying for state industrial incentives regardless of specific industry."
                )
            else:
                rationale = (
                    f"Universal National support program: Available for all eligible {scale_str} "
                    f"enterprises across India under Central Ministry guidelines."
                )
        else:
            if not is_central:
                rationale = (
                    f"Targeted state incentive: Formulated specifically for {matched_category_name} "
                    f"enterprises in {state_name} with {scale_str} scale classification."
                )
            else:
                rationale = (
                    f"Targeted Central scheme: Dedicated national program formulated specifically "
                    f"for {matched_category_name} manufacturing units."
                )

        dates_str = "Active"
        if ver.effective_from and ver.effective_to:
            dates_str = f"Active ({ver.effective_from.strftime('%b %Y')} – {ver.effective_to.strftime('%b %Y')})"
        elif ver.effective_from:
            dates_str = f"Active (from {ver.effective_from.strftime('%b %Y')})"

        jurisdiction_display = "Maharashtra State" if ver.jurisdiction in ["MH", "MAHARASHTRA"] else "Central Government"

        matched_schemes.append({
            "id": scheme.scheme_code,
            "scheme_code": scheme.scheme_code,
            "title": ver.title,
            "name": ver.title,
            "authority": ver.authority,
            "jurisdiction": jurisdiction_display,
            "jurisdiction_code": ver.jurisdiction,
            "benefit_type": ver.benefit_type,
            "benefit": ver.benefit_summary,
            "benefit_summary": ver.benefit_summary,
            "benefit_details": ver.benefit_details,
            "eligibility": ver.eligibility_statement,
            "eligibility_status": "ACTIVE_ELIGIBLE",
            "effective_dates": dates_str,
            "effective_from": ver.effective_from.isoformat() if ver.effective_from else None,
            "effective_to": ver.effective_to.isoformat() if ver.effective_to else None,
            "published_date": ver.published_date.isoformat() if ver.published_date else None,
            "last_verified_at": ver.last_verified_at.strftime("%d %b %Y"),
            "version": f"v{ver.version_number}.0",
            "version_number": ver.version_number,
            "content_hash": ver.content_hash,
            "source_url": ver.source_url,
            "source_domain": ver.source_domain or scheme.source_domain,
            "action_url": ver.application_url or ver.source_url,
            "portal_url": ver.application_url or ver.source_url,
            "application_route": ver.application_route,
            "evidence_snippet": ver.evidence_snippet,
            "relevance_rationale": rationale,
            "is_universal": is_universal,
            "sector_category": matched_category_name,
            "status": "ACTIVE_ELIGIBLE",
            "is_state_specific": not is_central,
            "is_active": ver.is_active,
        })

    def _compute_relevance(s: dict[str, Any]) -> int:
        code = s["scheme_code"].upper()
        title = s["title"].lower()
        score = 50
        if not s["is_universal"]:
            score += 20
        if s.get("is_state_specific"):
            score += 40
        if not context.is_manufacturing:
            if "STARTUP" in code or "SEED" in title or "SISFS" in code:
                score += 45
            elif "IPR" in code or "INTELLECTUAL PROPERTY" in title:
                score += 40
            elif "CGTMSE" in code or "CREDIT GUARANTEE" in title:
                score += 35
            elif "TREDS" in code or "FACTORING" in title:
                score += 30
            elif "SAMADHAAN" in code:
                score += 25
        else:
            if "PSI" in code or "PACKAGE SCHEME" in title:
                score += 40
            elif "ZED" in code:
                score += 35
            elif "CGTMSE" in code:
                score += 30
            elif "CLUSTER" in title or "CDP" in code:
                score += 25
        return score

    matched_schemes.sort(key=_compute_relevance, reverse=True)
    if not context.is_manufacturing:
        # Non-manufacturing / Software / SaaS: cap at top 5 high-impact tech & financial support schemes
        matched_schemes = matched_schemes[:5]

    universal_count = sum(1 for s in matched_schemes if s["is_universal"])
    sector_specific_count = len(matched_schemes) - universal_count

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "available": True,
        "state": state_code,
        "state_code": state_code,
        "raw_state": context.state,
        "state_name": state_name,
        "msme_scale": context.msme_scale,
        "product_description": context.product_description,
        "count": len(matched_schemes),
        "total_schemes_found": len(matched_schemes),
        "universal_schemes_count": universal_count,
        "sector_specific_schemes_count": sector_specific_count,
        "maharashtra_schemes_count": sum(1 for s in matched_schemes if s["is_state_specific"]),
        "central_schemes_count": sum(1 for s in matched_schemes if not s["is_state_specific"]),
        "schemes": matched_schemes,
        "discovery_mode": "CENTRAL_AND_MAHARASHTRA_INGESTION_PIPELINE",
        "data_freshness": "OFFICIAL_PORTAL_VERIFIED",
        "disclaimer": (
            "Scheme relevance is derived from your business activity, jurisdiction, and MSME classification. "
            "Universal programs apply across industries, while sector incentives require qualifying production activities."
        ),
    }
