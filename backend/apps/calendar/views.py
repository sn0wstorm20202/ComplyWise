"""Calendar views for Screen 12.

Authority: PRD_v2.0 §20, §P5; TRD_v2.0 §30, §31.

The calendar reports only what published knowledge states: renewal cycles recorded
in requirement metadata for requirements the engine found APPLICABLE. There is no
statutory filing calendar in the repository, so annual-return and inspection dates
are not emitted — and no penalty amounts are attached, because none are held.

The previous implementation returned three fabricated events at today+25/45/70 days
carrying penalty claims such as "₹100/day delay penalty under FSS Act §61". Those
dates had no statutory basis and the penalty text was not sourced.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business
from domain.intelligence.calendar_derivation import derive_business_calendar


class BusinessCalendarListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        payload = derive_business_calendar(business)
        return Response(envelope(payload), status=status.HTTP_200_OK)
