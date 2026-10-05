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
import re

from apps.businesses.models import Business
from apps.schemes.models import Scheme
from apps.schemes.presentation import scheme_evidence_projection, scheme_source_projection
from apps.schemes.provenance import is_authored_fixture_version
from domain.context.business_context import DerivedBusinessContext, build_business_context
from domain.context.activity_text import strip_negations
from apps.evidence.presentation import exact_source_url
from .eligibility import assessment_facts, evaluate_declared_eligibility


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

    desc = strip_negations((product_desc or "").lower())

    # Export scheme check
    if "EXPORT" in scheme_sectors:
        # `is_cross_border` includes importing and cannot establish exports.
        if re.search(r"\bexport\w*\b", desc):
            return True, "Export Promotion", False
        return False, "", False

    # Check specific sector tags
    matched_sectors = []
    for sec in scheme_sectors:
        sec_upper = sec.upper()
        if sec_upper in SECTOR_KEYWORDS:
            keywords = SECTOR_KEYWORDS[sec_upper]
            stems = {"vehic", "electron", "semiconduct", "machin", "fabricat", "dehydrat", "pharma", "consult"}
            if any(re.search(r"\b" + re.escape(k) + (r"\w*\b" if k in stems else r"\b"), desc) for k in keywords):
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
    assessment = (business.assessments.filter(pk=assessment_id).first() if assessment_id
                  else business.assessments.order_by("-assessment_number").first() if hasattr(business, "assessments") else None)
    if assessment_id and (assessment is None or not assessment.profile_version_id):
        return {"business_id": str(business.id), "business_name": business.name, "schemes": [],
                "count": 0, "total_schemes_found": 0, "available": True, "assessment_id": str(assessment_id),
                "scope_status": "ASSESSMENT_REQUIRED"}
    if context is None:
        context = build_business_context(business, profile_version=assessment.profile_version if assessment else None)
    facts = assessment_facts(context)
    manufacturing = facts.get("is_manufacturing") if isinstance(facts.get("is_manufacturing"), bool) else context.is_manufacturing

    raw_state = (context.state or "").upper()
    state_code = "MH" if raw_state in ["MH", "MAHARASHTRA"] else ("GJ" if raw_state in ["GJ", "GUJARAT"] else raw_state)
    state_name = context.state_name or ("Maharashtra" if state_code == "MH" else ("Gujarat" if state_code == "GJ" else state_code))
    msme_scale = context.msme_scale  # "MICRO", "SMALL", "MEDIUM", "LARGE", "UNKNOWN"
    desc = (context.product_description or "").lower()

    active_schemes = Scheme.objects.filter(is_active=True).prefetch_related("versions")

    matched_schemes: list[dict[str, Any]] = []
    quarantined_count = 0

    for scheme in active_schemes:
        ver = scheme.versions.filter(version_number=scheme.current_version_number, is_active=True).first()
        if not ver:
            ver = scheme.versions.filter(is_active=True).order_by("-version_number").first()
        if not ver:
            continue
        if is_authored_fixture_version(ver):
            quarantined_count += 1
            continue
        eligibility_status, predicate_facts, unresolved_facts = evaluate_declared_eligibility(ver, facts)
        if eligibility_status == "NOT_ELIGIBLE":
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
        if not manufacturing:
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
        if "EXPORT" in scheme_sectors:
            if facts.get("exports") is False:
                continue
            is_sector_eligible = facts.get("exports") is True
            matched_category_name, is_universal = "Export Promotion", False
        else:
            is_sector_eligible, matched_category_name, is_universal = evaluate_sector_eligibility(
                scheme_sectors, desc, manufacturing, context.is_cross_border
            )
        if not is_sector_eligible:
            continue

        matched_fact_values = {"state": context.state}
        if scheme_scales and msme_scale != "UNKNOWN":
            matched_fact_values["msme_scale"] = msme_scale
        if not is_universal:
            matched_fact_values["product_description"] = context.product_description
        matched_fact_values.update({key: value for key, value in predicate_facts.items() if value is not None})
        source_url = exact_source_url(ver.source_url)
        usable_evidence = bool(source_url and (ver.evidence_snippet or "").strip())
        if eligibility_status == "EVIDENCE_SUPPORTED" and (ver.verification_status != "VERIFIED" or not usable_evidence):
            eligibility_status = "NEEDS_REVIEW"

        rationale = "Matched recorded facts: " + "; ".join(
            f"{key.replace('_', ' ')}: {state_name if key == 'state' else value}" for key, value in matched_fact_values.items()) + "."
        if eligibility_status != "EVIDENCE_SUPPORTED":
            rationale += " Relevance is a candidate match; full eligibility has not been established."
        if unresolved_facts:
            rationale += " Missing eligibility facts: " + ", ".join(key.replace("_", " ") for key in unresolved_facts) + "."
        dates_str = "Currentness not recorded"
        if ver.effective_from and ver.effective_to:
            dates_str = f"Recorded window ({ver.effective_from.strftime('%b %Y')} – {ver.effective_to.strftime('%b %Y')})"
        elif ver.effective_from:
            dates_str = f"Recorded start: {ver.effective_from.strftime('%b %Y')}"

        jurisdiction_display = "Maharashtra State" if ver.jurisdiction in ["MH", "MAHARASHTRA"] else "Central Government"

        source = scheme_source_projection(ver)
        evidence = scheme_evidence_projection(ver)

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
            "eligibility_status": eligibility_status,
            "effective_dates": dates_str,
            "effective_from": ver.effective_from.isoformat() if ver.effective_from else None,
            "effective_to": ver.effective_to.isoformat() if ver.effective_to else None,
            "published_date": ver.published_date.isoformat() if ver.published_date else None,
            "last_verified_at": ver.last_verified_at.strftime("%d %b %Y"),
            "version": f"v{ver.version_number}.0",
            "version_number": ver.version_number,
            "content_hash": ver.content_hash,
            "source_url": source_url,
            "source": source, "evidence": evidence,
            "matched_facts": list(matched_fact_values), "matched_fact_values": matched_fact_values,
            "unresolved_facts": unresolved_facts, "result_origin": "DETERMINISTIC_KB_RESULT" if eligibility_status == "EVIDENCE_SUPPORTED" else "HUMAN_REVIEW_RESULT",
            "source_domain": ver.source_domain or scheme.source_domain,
            "action_url": ver.application_url or None,
            "portal_url": ver.application_url or None,
            "application_route": ver.application_route,
            "evidence_snippet": ver.evidence_snippet,
            "relevance_rationale": rationale,
            "is_universal": is_universal,
            "sector_category": matched_category_name,
            "status": eligibility_status,
            "is_state_specific": not is_central,
            "is_active": ver.is_active,
        })

    def _compute_relevance(s: dict[str, Any]) -> int:
        score = 100 if s["eligibility_status"] == "EVIDENCE_SUPPORTED" else 0
        score += 30 if s["source"]["url"] and s["evidence"] else -20
        score += 20 if not s["is_universal"] else 0
        score += 5 * len(s["matched_facts"])
        score -= 10 * len(s["unresolved_facts"])
        if s["eligibility_status"] == "EXPIRED_OR_NOT_CURRENT":
            score -= 100
        return score

    matched_schemes.sort(key=_compute_relevance, reverse=True)
    if not manufacturing:
        # Non-manufacturing / Software / SaaS: cap at top 5 high-impact tech & financial support schemes
        matched_schemes = matched_schemes[:5]

    universal_count = sum(1 for s in matched_schemes if s["is_universal"])
    sector_specific_count = len(matched_schemes) - universal_count

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "assessment_id": str(assessment.id) if assessment else None,
        "excluded_unreviewed_count": quarantined_count,
        "scope_status": "SOURCE_REVIEW_REQUIRED" if quarantined_count and not matched_schemes else "MATCHED" if matched_schemes else "PARTIAL_SCOPE",
        "scope_note": "Historical authored scheme records have no established source evidence and are excluded from recommendations. Reviewed scheme sources must be acquired before eligibility can be established." if quarantined_count else "Candidate matches do not establish complete scheme eligibility.",
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
        "data_freshness": "RECORDED_VERSIONS",
        "disclaimer": (
            "Scheme relevance is derived from your business activity, jurisdiction, and MSME classification. "
            "Candidate relevance is not eligibility; reviewed predicates and exact source evidence are required to support eligibility."
        ),
    }
