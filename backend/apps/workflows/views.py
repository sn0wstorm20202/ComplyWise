"""Workflows views for Screen 11.

Authority: PRD_v2.0 §19, §P5; TRD_v2.0 §30, §31.

No workflow definitions exist in the repository: `apps.workflows` has no models and
no knowledge pack records the procedural steps an authority actually requires. The
previous hardcoded FSSAI/SPCB step lists asserted a filing procedure — including
which step the user was on — that nothing in the system had established.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business
from domain.intelligence.workflow_derivation import derive_business_workflows


class BusinessWorkflowsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        payload = derive_business_workflows(business)
        return Response(envelope(payload), status=status.HTTP_200_OK)
