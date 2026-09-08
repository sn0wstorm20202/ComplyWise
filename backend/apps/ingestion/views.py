"""Discovery boundary views.

Authority: Milestone Task — Parts C, D, E, F, J; TRD_v2.0 §11A, §30.

Endpoints:
- GET  .../discovery/status               -> Coverage assessment & status
- POST .../discovery/run                  -> Execute or return cached discovery run
- GET  .../discovery/runs                 -> List all discovery runs for business
- GET  .../discovery/runs/<id>            -> Specific run details & summary
- GET  .../discovery/runs/<id>/sources    -> Sources captured in run
- GET  .../discovery/runs/<id>/candidates -> Candidate requirements in quarantine
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business
from apps.evidence.models import Source

from .models import CandidateRequirement, DiscoveryRun
from .services import assess_knowledge_coverage, run_discovery


class _DiscoveryScopedView(APIView):
    permission_classes = [IsAuthenticated]

    def get_business(self, request: Request, business_id) -> Business | None:  # noqa: ANN001
        return Business.accessible_to(request.user).filter(pk=business_id).first()


class DiscoveryStatusView(_DiscoveryScopedView):
    """Coverage state for the active business plus latest discovery run state."""

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        coverage = assess_knowledge_coverage(business)
        latest_run = DiscoveryRun.objects.filter(business=business).order_by("-created_at").first()

        candidate_requirements_count = CandidateRequirement.objects.filter(business=business).count()

        return Response(
            envelope(
                {
                    "business_id": str(business.id),
                    "coverage": coverage,
                    "discovery_available": coverage["discovery_available"],
                    "latest_run": {
                        "id": str(latest_run.id),
                        "status": latest_run.status,
                        "candidate_count": latest_run.candidate_count,
                        "scraped_count": latest_run.scraped_count,
                        "official_source_count": latest_run.official_source_count,
                        "created_at": latest_run.created_at.isoformat(),
                    } if latest_run else None,
                    "candidate_requirements_count": candidate_requirements_count,
                }
            ),
            status=status.HTTP_200_OK,
        )


class DiscoveryRunView(_DiscoveryScopedView):
    """Run or retrieve a bounded regulatory discovery pass for the business."""

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        force = bool(request.data.get("force_refresh", False))
        result = run_discovery(business, force_refresh=force)
        return Response(envelope(result), status=status.HTTP_200_OK)


class DiscoveryRunsListView(_DiscoveryScopedView):
    """List all discovery runs for this business."""

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        runs = DiscoveryRun.objects.filter(business=business).order_by("-created_at")[:20]
        data = [
            {
                "id": str(r.id),
                "provider": r.provider,
                "status": r.status,
                "candidate_count": r.candidate_count,
                "scraped_count": r.scraped_count,
                "official_source_count": r.official_source_count,
                "verified_count": r.verified_count,
                "created_at": r.created_at.isoformat(),
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            }
            for r in runs
        ]
        return Response(envelope(data), status=status.HTTP_200_OK)


class DiscoveryRunDetailView(_DiscoveryScopedView):
    """Retrieve full audit details of one discovery run."""

    def get(self, request: Request, business_id, run_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        run = DiscoveryRun.objects.filter(business=business, pk=run_id).first()
        if run is None:
            return error_response(
                "NOT_FOUND", "Discovery run not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        candidates = list(run.candidate_requirements.all()[:50])
        return Response(
            envelope(
                {
                    "id": str(run.id),
                    "business_id": str(business.id),
                    "provider": run.provider,
                    "status": run.status,
                    "queries": run.queries,
                    "candidate_count": run.candidate_count,
                    "scraped_count": run.scraped_count,
                    "official_source_count": run.official_source_count,
                    "verified_count": run.verified_count,
                    "candidate_urls": run.candidate_urls,
                    "scraped_urls": run.scraped_urls,
                    "candidate_requirements": [
                        {
                            "id": str(cr.id),
                            "name": cr.requirement_name,
                            "authority": cr.authority,
                            "jurisdiction": cr.jurisdiction,
                            "category": cr.category,
                            "applicability_statement": cr.applicability_statement,
                            "prerequisite": cr.prerequisite,
                            "document_requirements": cr.document_requirements,
                            "fee_info": cr.fee_info,
                            "deadline_info": cr.deadline_info,
                            "validity_info": cr.validity_info,
                            "verification_status": cr.verification_status,
                        }
                        for cr in candidates
                    ],
                    "summary": run.summary,
                    "error": run.error,
                    "created_at": run.created_at.isoformat(),
                    "completed_at": run.completed_at.isoformat() if run.completed_at else None,
                }
            ),
            status=status.HTTP_200_OK,
        )


class DiscoveryCandidatesView(_DiscoveryScopedView):
    """Retrieve quarantined candidate requirements for a discovery run or latest run."""

    def get(self, request: Request, business_id, run_id=None) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        if run_id is None:
            run = DiscoveryRun.objects.filter(business=business).order_by("-created_at").first()
        else:
            run = DiscoveryRun.objects.filter(business=business, pk=run_id).first()

        if run is None:
            return Response(envelope([]), status=status.HTTP_200_OK)

        candidates = CandidateRequirement.objects.filter(discovery_run=run)
        data = [
            {
                "id": str(cr.id),
                "requirement_name": cr.requirement_name,
                "category": cr.category,
                "authority": cr.authority,
                "jurisdiction": cr.jurisdiction,
                "applicability_statement": cr.applicability_statement,
                "verification_status": cr.verification_status,
                "source_id": cr.source.source_id if cr.source else None,
                "source_url": cr.source.canonical_url if cr.source else None,
                "evidence_excerpt": cr.evidence.excerpt if cr.evidence else None,
            }
            for cr in candidates
        ]
        return Response(envelope(data), status=status.HTTP_200_OK)


class AnalysisOrchestrateView(_DiscoveryScopedView):
    """Orchestrate complete multi-stage compliance analysis for a business."""

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        from domain.intelligence.orchestration import orchestrate_compliance_analysis
        force = bool(request.data.get("force_live_discovery", True))
        payload = orchestrate_compliance_analysis(business, force_live_discovery=force)
        return Response(envelope(payload), status=status.HTTP_200_OK)


class AnalysisStatusView(_DiscoveryScopedView):
    """Retrieve current staged analysis state and executive metrics."""

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        from domain.intelligence.orchestration import orchestrate_compliance_analysis
        payload = orchestrate_compliance_analysis(business, force_live_discovery=False)
        return Response(envelope(payload), status=status.HTTP_200_OK)
