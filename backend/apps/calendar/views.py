"""Calendar views for Screen 12.

Authority: PRD_v2.0 §20, TRD_v2.0 §30, §31.
"""

from __future__ import annotations

import datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business


class BusinessCalendarListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        today = timezone.localdate()
        events = [
            {
                "id": "EVT-01",
                "title": "FSSAI Annual Return Filing (Form D-1)",
                "date": str(today + datetime.timedelta(days=25)),
                "type": "STATUTORY_RETURN",
                "authority": "FSSAI",
                "penalty_risk": "₹100/day delay penalty under FSS Act §61",
                "status": "UPCOMING",
            },
            {
                "id": "EVT-02",
                "title": "SPCB Environmental Statement (Form V)",
                "date": str(today + datetime.timedelta(days=45)),
                "type": "ENVIRONMENTAL_AUDIT",
                "authority": "SPCB",
                "penalty_risk": "Show cause notice under Water & Air Acts",
                "status": "UPCOMING",
            },
            {
                "id": "EVT-03",
                "title": "Factory Half-Yearly Return",
                "date": str(today + datetime.timedelta(days=70)),
                "type": "LABOUR_RETURN",
                "authority": "Directorate of Industrial Safety & Health",
                "penalty_risk": "Inspection penalty under Factories Act §92",
                "status": "SCHEDULED",
            },
        ]

        return Response(
            envelope({"business_id": str(business.id), "events": events}),
            status=status.HTTP_200_OK,
        )
