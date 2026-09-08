"""Regulatory updates views for Screen 15.

Authority: PRD_v2.0 §23, §P5; TRD_v2.0 §30, §31.

No regulatory-change ingestion exists: `apps.regulatory_updates` has no models and
nothing watches authority portals for amendments. The endpoint therefore reports the
capability as unavailable rather than returning curated headlines.

The previous implementation returned three fabricated notifications with invented
publication and effective dates ("FSSAI Mandatory Online Annual Return, effective
2026-09-01"). Rendered on a screen titled Regulatory Updates, that reads as live
monitoring of Indian regulatory change, which the system does not perform.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.capability import unavailable
from common.envelope import envelope


class RegulatoryUpdatesListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:  # noqa: ANN001
        payload = unavailable(
            capability="REGULATORY_CHANGE_FEED",
            reason=(
                "No regulatory-change monitoring is configured. Nothing in the system "
                "tracks amendments, notifications or effective-date changes at any "
                "authority, so no update can be reported."
            ),
            requires=(
                "A change-detection pipeline over authority sources that records each "
                "amendment with its publication date, effective date and citation, plus "
                "review events against the affected published knowledge."
            ),
            items_key="updates",
        )
        return Response(envelope(payload), status=status.HTTP_200_OK)
