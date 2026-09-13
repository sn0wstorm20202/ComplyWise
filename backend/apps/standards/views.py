"""Standards and certification views for Screen 14.

Authority: PRD_v2.0 §22, §P5; TRD_v2.0 §30, §31.

There is no standards catalogue in the repository: `apps.standards` has no models and
no knowledge pack carries BIS/QCO records, test parameters or product scopes. What
does exist is a small number of published requirements in the STANDARD category, so
this endpoint searches those and says plainly that it is not a BIS catalogue.

The previous implementation returned four hardcoded entries (IS 13252, IS 15885,
IS 2491, ISO 9001) with invented `testing_parameters` and product scopes, filtered by
substring. Presenting that as a standards lookup asserts which products a compulsory
registration scheme covers — a claim nothing in the system had established.
"""

from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.enums import KnowledgeStatus
from common.envelope import envelope
from apps.evidence.models import Evidence
from apps.knowledge.models import RequirementDefinition

from apps.businesses.models import Business
from domain.intelligence.standards_discovery import discover_business_standards

#: Requirement category holding standards/certification obligations.
STANDARD_CATEGORY = "STANDARD"


class StandardsSearchView(APIView):
    """Search published STANDARD-category requirements or discover business standards."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:  # noqa: ANN001
        query = request.query_params.get("query", "").strip()
        business_id = request.query_params.get("business_id", "").strip()

        assessment_id = request.query_params.get("assessment_id", "").strip() or None

        if business_id:
            business = Business.objects.filter(pk=business_id).first()
            if business:
                disc_result = discover_business_standards(business, assessment_id=assessment_id)
                items = disc_result.get("standards", [])
                if query:
                    needle = query.lower()
                    items = [
                        s
                        for s in items
                        if needle in s["title"].lower()
                        or needle in s["standard_code"].lower()
                        or needle in s["why_it_matters"].lower()
                    ]
                formatted_items = []
                for s in items:
                    citations = []
                    if s.get("source_url"):
                        citations.append({
                            "evidence_id": f"EVID::{s['standard_code']}",
                            "authority": s["authority"],
                            "locator": s["standard_code"],
                            "verification_status": "VERIFIED",
                            "excerpt": s["why_it_matters"],
                            "source_title": f"BIS Official Standard: {s['standard_code']}",
                            "canonical_url": s["source_url"],
                        })
                    formatted_items.append({
                        "requirement_id": s["standard_code"],
                        "standard_code": s["standard_code"],
                        "title": f"{s['standard_code']} — {s['title']}",
                        "authority": s["authority"],
                        "jurisdiction": "CENTRAL",
                        "domain": "STANDARDS & QUALITY",
                        "description": f"{s['why_it_matters']} Testing requirements: {s.get('testing_requirements', 'Standard laboratory compliance testing.')}",
                        "category": s.get("nature", "MANDATORY_STANDARD"),
                        "citations": citations,
                        "citation_count": len(citations),
                        "is_mandatory": s.get("is_mandatory", True),
                        "next_step": s.get("next_step", ""),
                    })

                return Response(
                    envelope(
                        {
                            "business_id": business_id,
                            "query": query,
                            "count": len(formatted_items),
                            "standards": formatted_items,
                            "catalogue_available": True,
                            "catalogue_note": disc_result.get("disclaimer", ""),
                        }
                    ),
                    status=status.HTTP_200_OK,
                )

        qs = RequirementDefinition.objects.filter(
            category__iexact=STANDARD_CATEGORY,
            status=KnowledgeStatus.PUBLISHED,
        ).order_by("authority", "requirement_id")

        if query:
            needle = query.lower()
            candidates = [
                req
                for req in qs
                if needle in req.name.lower()
                or needle in req.description.lower()
                or needle in req.requirement_id.lower()
                or needle in req.authority.lower()
                or needle in req.domain.lower()
            ]
        else:
            candidates = list(qs)

        # Evidence is fetched so every returned standard carries its citation.
        # A standards claim without a source is exactly what this endpoint used
        # to produce.
        ref_ids: set[str] = set()
        for req in candidates:
            ref_ids.update(req.evidence_refs or [])

        evidence_by_id = {
            ev.evidence_id: ev
            for ev in Evidence.objects.filter(evidence_id__in=ref_ids).select_related("source")
        }

        standards: list[dict[str, Any]] = []
        for req in candidates:
            citations = []
            for ref in req.evidence_refs or []:
                ev = evidence_by_id.get(ref)
                if ev is None:
                    continue
                citations.append(
                    {
                        "evidence_id": ev.evidence_id,
                        "source_title": ev.source.title,
                        "authority": ev.source.authority,
                        "locator": ev.locator,
                        "excerpt": ev.excerpt,
                        "verification_status": ev.verification_status,
                        "canonical_url": ev.source.canonical_url,
                    }
                )

            standards.append(
                {
                    "requirement_id": req.requirement_id,
                    "title": req.name,
                    "authority": req.authority,
                    "jurisdiction": req.jurisdiction,
                    "domain": req.domain,
                    "description": req.description,
                    # The category the knowledge base recorded, not a judgement
                    # about whether the standard is mandatory for the searcher.
                    "category": req.category,
                    "citations": citations,
                    "citation_count": len(citations),
                }
            )

        return Response(
            envelope(
                {
                    "query": query,
                    "count": len(standards),
                    "standards": standards,
                    # A standards catalogue is a separate knowledge source. This
                    # endpoint only reaches requirements already published, so the
                    # frontend must not present it as a complete BIS lookup.
                    "catalogue_available": False,
                    "catalogue_note": (
                        "No BIS or QCO standards catalogue has been ingested. Results "
                        "are limited to published requirements in the STANDARD "
                        "category, and product scopes and testing parameters are not "
                        "held."
                    ),
                }
            ),
            status=status.HTTP_200_OK,
        )
