"""Standards and certification views for Screen 14.

Authority: PRD_v2.0 §22, TRD_v2.0 §30, §31.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope


class StandardsSearchView(APIView):
    """Natural-language product-to-BIS/ISO standard search."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:  # noqa: ANN001
        query = request.query_params.get("query", "").strip().lower()

        standards = [
            {
                "standard_code": "IS 13252 (Part 1):2010",
                "title": "Information Technology Equipment — Safety (General Requirements)",
                "authority": "Bureau of Indian Standards (BIS)",
                "scheme": "Compulsory Registration Scheme (CRS)",
                "category": "MANDATORY",
                "applicable_products": ["Smart Meters", "Power Adapters", "Laptops", "Servers"],
                "testing_parameters": ["Electric Shock Protection", "Dielectric Strength", "Fire Enclosure"],
            },
            {
                "standard_code": "IS 15885 (Part 2/Sec 13):2012",
                "title": "Lamp Controlgear — Particular Requirements for DC or AC Supplied Electronic Controlgear for LED Modules",
                "authority": "Bureau of Indian Standards (BIS)",
                "scheme": "Compulsory Registration Scheme (CRS)",
                "category": "MANDATORY",
                "applicable_products": ["LED Drivers", "Lighting Modules"],
                "testing_parameters": ["Thermal Endurance", "Fault Condition Testing", "Insulation Resistance"],
            },
            {
                "standard_code": "IS 2491:2013",
                "title": "Food Hygiene — General Principles — Code of Practice",
                "authority": "Bureau of Indian Standards (BIS)",
                "scheme": "Voluntary / FSSAI Reference",
                "category": "RECOMMENDED",
                "applicable_products": ["Food Processing Facilities", "Packaged Snacks", "Catering"],
                "testing_parameters": ["HACCP Principles", "Sanitation", "Cross-contamination Controls"],
            },
            {
                "standard_code": "ISO 9001:2015",
                "title": "Quality Management Systems — Requirements",
                "authority": "International Organization for Standardization",
                "scheme": "Voluntary Certification",
                "category": "VOLUNTARY",
                "applicable_products": ["All Manufacturing & Service Industries"],
                "testing_parameters": ["Quality Policy", "Internal Audits", "Continuous Improvement"],
            },
        ]

        if query:
            filtered = [
                s for s in standards
                if query in s["title"].lower()
                or query in s["standard_code"].lower()
                or any(query in p.lower() for p in s["applicable_products"])
            ]
        else:
            filtered = standards

        return Response(
            envelope({"count": len(filtered), "query": query, "standards": filtered}),
            status=status.HTTP_200_OK,
        )
