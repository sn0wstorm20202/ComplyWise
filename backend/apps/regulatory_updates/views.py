"""Regulatory updates views for Screen 15.

Authority: PRD_v2.0 §23, TRD_v2.0 §30, §31.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope
from apps.evidence.models import Source


class RegulatoryUpdatesListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:  # noqa: ANN001
        sources = {s.authority: s.canonical_url for s in Source.objects.all()}

        updates = [
            {
                "id": "REG-2026-001",
                "title": "FSSAI Mandatory Online Annual Return (FoSCoS)",
                "authority": "FSSAI",
                "published_date": "2026-08-15",
                "effective_date": "2026-09-01",
                "impact_level": "MANDATORY",
                "affected_domains": ["FOOD"],
                "summary": "All Food Business Operators (FBOs) holding state or central licences must file annual returns exclusively through the FoSCoS portal.",
                "official_url": sources.get("FSSAI", ""),
            },
            {
                "id": "REG-2026-002",
                "title": "CPCB Revised Effluent Standards for Notified Industrial Zones",
                "authority": "CPCB",
                "published_date": "2026-07-28",
                "effective_date": "2026-10-01",
                "impact_level": "MANDATORY",
                "affected_domains": ["ENVIRONMENT", "MANUFACTURING"],
                "summary": "Revised BOD and COD concentration limits for industrial effluent discharge into common effluent treatment plants (CETPs).",
                "official_url": sources.get("CPCB", ""),
            },
            {
                "id": "REG-2026-003",
                "title": "MeitY Compulsory Registration Scheme Extension for Smart Devices",
                "authority": "MeitY / BIS",
                "published_date": "2026-06-10",
                "effective_date": "2026-08-01",
                "impact_level": "COMPLIANCE_NOTICE",
                "affected_domains": ["ELECTRONICS"],
                "summary": "Updated list of electronic equipment and cellular IoT devices requiring mandatory BIS safety registration prior to market placement.",
                "official_url": sources.get("BIS", ""),
            },
        ]
        return Response(
            envelope({"count": len(updates), "updates": updates}),
            status=status.HTTP_200_OK,
        )
