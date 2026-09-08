"""Schemes & incentives views for Screen 13.

Authority: PRD_v2.0 §21, §P5; TRD_v2.0 §30, §31.

There is no scheme catalogue in the repository: no `apps.schemes` models, and no
knowledge pack carries scheme records or eligibility rules. So there is nothing to
match a business against, and the endpoint says so rather than returning sample
subsidies. A hardcoded "15% to 35% capital subsidy" with an invented
`eligibility_status` is an unsourced financial claim the user cannot distinguish
from a verified one.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business
from domain.intelligence.scheme_discovery import discover_business_schemes


class BusinessSchemesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment_id = request.query_params.get("assessment_id")
        payload = discover_business_schemes(business, assessment_id=assessment_id)
        return Response(envelope(payload), status=status.HTTP_200_OK)
