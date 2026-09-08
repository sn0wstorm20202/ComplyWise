"""Documents boundary views for Screen 10.

Authority: PRD_v2.0 §18, §P5; TRD_v2.0 §30, §31; FRONTEND_INSTRUCTIONS §9.

Document storage and AI pre-validation do not exist: `apps.documents` has no models,
no blob storage is wired, and no extraction runs. So this boundary reports two things
honestly instead of one thing falsely.

The checklist is real where knowledge records it — the documents an authority requires
are read from the metadata of requirements the engine found APPLICABLE. Upload and
pre-validation are reported as not configured.

The previous implementation returned four invented documents already marked VERIFIED
with `prevalidation_status: PASS` ("Verified against Income Tax portal format"), and
the upload endpoint returned "Document uploaded and pre-validated successfully"
without persisting anything. A user would believe their PAN card had been checked.
"""

from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.enums import ApplicabilityStatus, DocumentStatus, PrevalidationOutcome
from common.envelope import envelope, error_response
from apps.applicability.models import DecisionRun
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition
from apps.requirements.views import DOCUMENTS_KEY, _str_list

#: Stated on every response: pre-validation is not official approval, and here it
#: has not run at all.
PREVALIDATION_DISCLAIMER = (
    "AI pre-validation is not official government approval. No pre-validation has run: "
    "document upload and extraction are not configured."
)


from domain.intelligence.document_derivation import derive_business_documents


class BusinessDocumentsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        payload = derive_business_documents(business)
        return Response(envelope(payload), status=status.HTTP_200_OK)


class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        # Refusing is the only honest response: there is no document model and no
        # storage backend, so a 200 here would tell the user their statutory
        # document was received and checked when nothing was retained.
        return error_response(
            "NOT_CONFIGURED",
            (
                "Document upload is not configured. No document storage or extraction "
                "backend is wired, so files cannot be accepted or pre-validated."
            ),
            http_status=status.HTTP_501_NOT_IMPLEMENTED,
        )
