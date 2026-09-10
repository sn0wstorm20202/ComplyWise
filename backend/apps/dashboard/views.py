"""Dashboard API views.

Authority: PRD_v2.0 §14, TRD_v2.0 §30, §31, §32.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business

from .services import get_dashboard_summary


class BusinessDashboardView(APIView):
    """Aggregate high-level compliance intelligence and metrics for the business."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        assessment_id = request.query_params.get("assessment_id")
        data = get_dashboard_summary(business, assessment_id=assessment_id)

        if request.user.is_authenticated:
            try:
                from apps.businesses.models import Assessment, UserWorkspaceState
                ws, _ = UserWorkspaceState.objects.get_or_create(user=request.user)
                ws.active_business = business
                aid = data.get("assessment_id")
                if aid:
                    ass = Assessment.objects.filter(pk=aid).first()
                    if ass:
                        ws.active_assessment = ass
                ws.save()
            except Exception:
                pass

        return Response(envelope(data), status=status.HTTP_200_OK)
