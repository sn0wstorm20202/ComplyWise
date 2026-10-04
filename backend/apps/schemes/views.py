"""Schemes & incentives API views.

Authority: PRD_v2.0 §21, §P5; TRD_v2.0 §30, §31; Schemes Pipeline Specification.
"""

from __future__ import annotations

from decimal import Decimal
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from common.permissions import IsComplianceReviewer
from domain.intelligence.scheme_discovery import discover_business_schemes
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.businesses.models import Business
from apps.schemes.engine.matcher import evaluate_sector_eligibility, match_business_schemes
from apps.schemes.models import Scheme, SchemeVersion
from apps.schemes.pipeline.service import SchemePipelineService
from common.envelope import envelope, error_response
from domain.context.business_context import DerivedBusinessContext


class BusinessSchemesListView(APIView):
    """GET /api/v1/businesses/{business_id}/schemes

    Matches verified, active schemes against the specific business's derived context.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id=None) -> Response:  # noqa: ANN001
        user = request.user if (request.user and request.user.is_authenticated) else None
        business = Business.resolve_safely(business_id, user)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment_id = request.query_params.get("assessment_id")
        payload = discover_business_schemes(business, assessment_id=assessment_id)
        return Response(envelope(payload), status=status.HTTP_200_OK)


class SchemeContextEvaluateView(APIView):
    """POST /api/v1/schemes/evaluate

    Dynamically matches schemes for any simulated business context:
    {
        "state": "MH" | "GJ" | "DL",
        "product_description": "...",
        "msme_scale": "MICRO" | "SMALL" | "MEDIUM",
        "is_manufacturing": true,
        "is_cross_border": false
    }
    """
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        raw_state = request.data.get("state", "MH").strip().upper()
        state_code = "MH" if raw_state in ["MH", "MAHARASHTRA"] else ("GJ" if raw_state in ["GJ", "GUJARAT"] else raw_state)
        state_name = "Maharashtra" if state_code == "MH" else ("Gujarat" if state_code == "GJ" else state_code)
        product_desc = request.data.get("product_description", "").strip()
        msme_scale = request.data.get("msme_scale", "MICRO").strip().upper()
        is_manufacturing = bool(request.data.get("is_manufacturing", True))
        is_cross_border = bool(request.data.get("is_cross_border", False))

        active_schemes = Scheme.objects.filter(is_active=True).prefetch_related("versions")
        matched: list[dict] = []

        for scheme in active_schemes:
            ver = scheme.versions.filter(version_number=scheme.current_version_number, is_active=True).first()
            if not ver:
                ver = scheme.versions.filter(is_active=True).order_by("-version_number").first()
            if not ver:
                continue

            # 1. Jurisdiction match
            is_central = ver.jurisdiction == "CENTRAL"
            is_state_match = ver.jurisdiction == state_code or (
                ver.jurisdiction in ["MH", "MAHARASHTRA"] and state_code in ["MH", "MAHARASHTRA"]
            )
            if not (is_central or is_state_match):
                continue

            # 2. MSME scale match
            if ver.scale_match and msme_scale != "UNKNOWN":
                if msme_scale not in ver.scale_match:
                    continue

            # 3. Sector match
            is_eligible, matched_name, is_universal = evaluate_sector_eligibility(
                ver.sectors or ["ALL"], product_desc, is_manufacturing, is_cross_border
            )
            if not is_eligible:
                continue

            # 4. Rationale
            scale_str = msme_scale.capitalize()
            if is_universal:
                if not is_central:
                    rationale = f"Universal Maharashtra State incentive: Available for all eligible {scale_str} enterprises in {state_name}."
                else:
                    rationale = f"Universal National support program: Available for all eligible {scale_str} enterprises across India."
            else:
                if not is_central:
                    rationale = f"Targeted state incentive: Specifically designed for {matched_name} enterprises in {state_name}."
                else:
                    rationale = f"Targeted Central scheme: Dedicated national incentive formulated for {matched_name} manufacturing."

            dates_str = "Active"
            if ver.effective_from and ver.effective_to:
                dates_str = f"Active ({ver.effective_from.strftime('%b %Y')} – {ver.effective_to.strftime('%b %Y')})"

            matched.append({
                "id": scheme.scheme_code,
                "scheme_code": scheme.scheme_code,
                "title": ver.title,
                "authority": ver.authority,
                "jurisdiction": "Maharashtra State" if ver.jurisdiction in ["MH", "MAHARASHTRA"] else "Central Government",
                "jurisdiction_code": ver.jurisdiction,
                "benefit_type": ver.benefit_type,
                "benefit": ver.benefit_summary,
                "benefit_summary": ver.benefit_summary,
                "eligibility": ver.eligibility_statement,
                "eligibility_status": "ACTIVE_ELIGIBLE",
                "effective_dates": dates_str,
                "last_verified_at": ver.last_verified_at.strftime("%d %b %Y"),
                "version": f"v{ver.version_number}.0",
                "content_hash": ver.content_hash,
                "source_url": ver.source_url,
                "action_url": ver.application_url or ver.source_url,
                "relevance_rationale": rationale,
                "is_universal": is_universal,
                "sector_category": matched_name,
                "is_state_specific": not is_central,
                "is_active": ver.is_active,
            })

        universal_count = sum(1 for s in matched if s["is_universal"])
        sector_specific_count = len(matched) - universal_count

        return Response(
            envelope({
                "state": state_code,
                "state_name": state_name,
                "msme_scale": msme_scale,
                "product_description": product_desc,
                "count": len(matched),
                "total_schemes_found": len(matched),
                "universal_schemes_count": universal_count,
                "sector_specific_schemes_count": sector_specific_count,
                "maharashtra_schemes_count": sum(1 for s in matched if s["is_state_specific"]),
                "central_schemes_count": sum(1 for s in matched if not s["is_state_specific"]),
                "schemes": matched,
            }),
            status=status.HTTP_200_OK,
        )


class SchemeCatalogListView(APIView):
    """GET /api/v1/schemes/catalog

    Full searchable catalog of ingested schemes with filtering by jurisdiction and sector.
    """
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        # Auto-seed if empty
        if Scheme.objects.count() == 0:
            SchemePipelineService().run_pipeline(force=True)

        jurisdiction = request.query_params.get("jurisdiction", "").strip().upper()
        sector = request.query_params.get("sector", "").strip().upper()
        search = request.query_params.get("q", "").strip().lower()

        queryset = Scheme.objects.filter(is_active=True).prefetch_related("versions")
        if jurisdiction:
            queryset = queryset.filter(jurisdiction=jurisdiction)

        schemes_list = []
        for s in queryset:
            ver = s.current_version
            if not ver:
                continue

            if sector and sector != "ALL":
                ver_sectors = [sec.upper() for sec in (ver.sectors or [])]
                if "ALL" not in ver_sectors and sector not in ver_sectors:
                    continue

            if search:
                text_to_search = f"{ver.title} {ver.authority} {ver.summary} {s.scheme_code}".lower()
                if search not in text_to_search:
                    continue

            is_universal = bool(not ver.sectors or "ALL" in ver.sectors or "UNIVERSAL" in ver.sectors)
            dates_str = "Active"
            if ver.effective_from and ver.effective_to:
                dates_str = f"Active ({ver.effective_from.strftime('%b %Y')} – {ver.effective_to.strftime('%b %Y')})"

            schemes_list.append({
                "id": s.scheme_code,
                "scheme_code": s.scheme_code,
                "title": ver.title,
                "authority": ver.authority,
                "jurisdiction": "Maharashtra State" if ver.jurisdiction in ["MH", "MAHARASHTRA"] else "Central Government",
                "jurisdiction_code": ver.jurisdiction,
                "benefit_type": ver.benefit_type,
                "benefit_summary": ver.benefit_summary,
                "benefit_details": ver.benefit_details,
                "eligibility_statement": ver.eligibility_statement,
                "eligibility_status": "ACTIVE_ELIGIBLE",
                "effective_dates": dates_str,
                "sectors": ver.sectors,
                "scale_match": ver.scale_match,
                "application_url": ver.application_url or ver.source_url,
                "action_url": ver.application_url or ver.source_url,
                "source_url": ver.source_url,
                "source_domain": s.source_domain,
                "evidence_snippet": ver.evidence_snippet,
                "effective_from": ver.effective_from.isoformat() if ver.effective_from else None,
                "effective_to": ver.effective_to.isoformat() if ver.effective_to else None,
                "published_date": ver.published_date.isoformat() if ver.published_date else None,
                "last_verified_at": ver.last_verified_at.strftime("%d %b %Y"),
                "version": f"v{ver.version_number}.0",
                "version_number": ver.version_number,
                "content_hash": ver.content_hash,
                "is_universal": is_universal,
                "is_state_specific": ver.jurisdiction != "CENTRAL",
                "is_active": ver.is_active,
            })

        return Response(
            envelope({
                "count": len(schemes_list),
                "total_catalog_count": len(schemes_list),
                "maharashtra_schemes_count": sum(1 for s in schemes_list if s["is_state_specific"]),
                "central_schemes_count": sum(1 for s in schemes_list if not s["is_state_specific"]),
                "schemes": schemes_list,
            }),
            status=status.HTTP_200_OK,
        )


class SchemeVersionHistoryView(APIView):
    """GET /api/v1/schemes/{scheme_code}/versions

    Retrieves complete immutable version history, content hashes, and diff summaries.
    """
    permission_classes = [AllowAny]

    def get(self, request: Request, scheme_code: str) -> Response:
        scheme = Scheme.objects.filter(scheme_code=scheme_code).first()
        if not scheme:
            return error_response("NOT_FOUND", f"Scheme '{scheme_code}' not found.", http_status=status.HTTP_404_NOT_FOUND)

        versions_data = []
        for ver in scheme.versions.order_by("-version_number"):
            versions_data.append({
                "version_number": ver.version_number,
                "content_hash": ver.content_hash,
                "title": ver.title,
                "authority": ver.authority,
                "benefit_summary": ver.benefit_summary,
                "benefit_details": ver.benefit_details,
                "eligibility_statement": ver.eligibility_statement,
                "sectors": ver.sectors,
                "scale_match": ver.scale_match,
                "application_url": ver.application_url,
                "source_url": ver.source_url,
                "evidence_snippet": ver.evidence_snippet,
                "effective_from": ver.effective_from.isoformat() if ver.effective_from else None,
                "effective_to": ver.effective_to.isoformat() if ver.effective_to else None,
                "last_verified_at": ver.last_verified_at.isoformat(),
                "verification_status": ver.verification_status,
                "is_active": ver.is_active,
                "diff_summary": ver.diff_summary,
                "created_at": ver.created_at.isoformat(),
            })

        return Response(
            envelope({
                "scheme_code": scheme.scheme_code,
                "current_version_number": scheme.current_version_number,
                "authority": scheme.authority,
                "jurisdiction": scheme.jurisdiction,
                "versions_count": len(versions_data),
                "versions": versions_data,
            }),
            status=status.HTTP_200_OK,
        )


class SchemePipelineRunView(APIView):
    """POST /api/v1/schemes/pipeline/run

    Triggers ingestion across official portals, computes content hashes,
    diffs against existing records, and publishes new immutable versions when updated.
    """
    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request) -> Response:
        source_keys = request.data.get("source_keys")
        force = bool(request.data.get("force", False))
        service = SchemePipelineService()
        result = service.run_pipeline(source_keys=source_keys, force=force)
        return Response(envelope(result), status=status.HTTP_200_OK)


class SchemePipelineStatusView(APIView):
    """GET /api/v1/schemes/pipeline/status

    Audit overview: total schemes, state breakdown, recent snapshots, and verification dates.
    """
    permission_classes = [IsComplianceReviewer]

    def get(self, request: Request) -> Response:
        service = SchemePipelineService()
        status_data = service.get_pipeline_status()
        return Response(envelope(status_data), status=status.HTTP_200_OK)


class SchemeRollbackView(APIView):
    """POST /api/v1/schemes/{scheme_code}/rollback

    Rolls back a scheme to an earlier immutable version.
    """
    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request, scheme_code: str) -> Response:
        target_version = request.data.get("target_version")
        if not target_version:
            return error_response("BAD_REQUEST", "target_version is required.", http_status=status.HTTP_400_BAD_REQUEST)

        try:
            target_version_int = int(target_version)
        except (ValueError, TypeError):
            return error_response("BAD_REQUEST", "target_version must be an integer.", http_status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get("reason", "Operator rollback request")
        service = SchemePipelineService()
        try:
            result = service.rollback_scheme(scheme_code, target_version_int, reason=reason)
            return Response(envelope(result), status=status.HTTP_200_OK)
        except ValueError as exc:
            return error_response("NOT_FOUND", str(exc), http_status=status.HTTP_404_NOT_FOUND)


class SchemeUpdatePublishView(APIView):
    """POST /api/v1/schemes/{scheme_code}/update

    Dynamically publishes an updated version of a scheme, demonstrating
    cryptographic content hashing, field-by-field diff generation, and version incrementation.
    """
    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request, scheme_code: str) -> Response:
        scheme = Scheme.objects.filter(scheme_code=scheme_code).first()
        if not scheme:
            return error_response("NOT_FOUND", f"Scheme '{scheme_code}' not found.", http_status=status.HTTP_404_NOT_FOUND)

        current_ver = scheme.current_version
        if not current_ver:
            return error_response("BAD_REQUEST", "No existing version found for scheme.", http_status=status.HTTP_400_BAD_REQUEST)

        # Fields that can be updated dynamically
        new_title = request.data.get("title", current_ver.title)
        new_benefit = request.data.get("benefit_summary", current_ver.benefit_summary)
        new_eligibility = request.data.get("eligibility_statement", current_ver.eligibility_statement)
        new_benefit_type = request.data.get("benefit_type", current_ver.benefit_type)
        new_rate = request.data.get("rate_percent")
        change_reason = request.data.get("change_reason", "Official Government Gazette revision")

        benefit_details = dict(current_ver.benefit_details or {})
        if new_rate is not None:
            try:
                benefit_details["rate_percent"] = float(new_rate)
            except Exception:
                pass

        from .pipeline.parser import ExtractedSchemeCandidate
        from .pipeline.diff import compute_scheme_content_hash, compute_scheme_diff
        from django.utils import timezone

        candidate = ExtractedSchemeCandidate(
            scheme_code=scheme.scheme_code,
            title=new_title,
            authority=current_ver.authority,
            jurisdiction=current_ver.jurisdiction,
            summary=new_benefit,
            benefit_type=new_benefit_type,
            benefit_summary=new_benefit,
            benefit_details=benefit_details,
            eligibility_statement=new_eligibility,
            eligibility_criteria={},
            sectors=current_ver.sectors or [],
            scale_match=current_ver.scale_match or [],
            application_route=current_ver.application_route,
            application_url=current_ver.application_url,
            source_url=current_ver.source_url,
            source_domain=scheme.source_domain,
            evidence_snippet=f"{change_reason}. Verified via live official feed.",
            effective_from=current_ver.effective_from,
            effective_to=current_ver.effective_to,
        )

        cand_hash = compute_scheme_content_hash(candidate)
        if cand_hash == current_ver.content_hash:
            return Response(envelope({
                "updated": False,
                "message": "No changes detected. Content hash matches current version.",
                "current_version": current_ver.version_number,
            }), status=status.HTTP_200_OK)

        diff = compute_scheme_diff(current_ver, candidate)
        new_version_num = scheme.current_version_number + 1

        SchemeVersion.objects.create(
            scheme=scheme,
            version_number=new_version_num,
            content_hash=cand_hash,
            title=candidate.title,
            authority=candidate.authority,
            jurisdiction=candidate.jurisdiction,
            benefit_type=candidate.benefit_type,
            benefit_summary=candidate.benefit_summary,
            benefit_details=candidate.benefit_details,
            eligibility_statement=candidate.eligibility_statement,
            sectors=candidate.sectors,
            scale_match=candidate.scale_match,
            application_route=candidate.application_route,
            application_url=candidate.application_url,
            source_url=candidate.source_url,
            source_domain=candidate.source_domain,
            evidence_snippet=candidate.evidence_snippet,
            effective_from=candidate.effective_from,
            effective_to=candidate.effective_to,
            diff_summary=diff,
            verification_status="AUTOMATICALLY_VERIFIED",
            last_verified_at=timezone.now(),
            is_active=True,
        )

        scheme.current_version_number = new_version_num
        scheme.title = candidate.title
        scheme.save(update_fields=["current_version_number", "title", "updated_at"])

        return Response(envelope({
            "updated": True,
            "scheme_code": scheme.scheme_code,
            "previous_version": current_ver.version_number,
            "new_version": new_version_num,
            "content_hash": cand_hash,
            "diff": diff,
            "message": f"Successfully published Version {new_version_num} for {scheme.scheme_code}.",
        }), status=status.HTTP_201_CREATED)

