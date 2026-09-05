"""Health endpoints.

Deliberately unauthenticated: a load balancer and the frontend's connectivity
indicator both need them before any user exists. They expose no business data and
no credential values — see `common.health`.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope
from common.health import liveness_payload, readiness_payload


class HealthView(APIView):
    """Liveness. Answers as long as the process can serve a request."""

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response(envelope(liveness_payload()))


class ReadinessView(APIView):
    """Readiness. Reports dependency state and fails with 503 when not ready."""

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        payload, is_ready = readiness_payload()
        http_status = (
            status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(envelope(payload), status=http_status)
