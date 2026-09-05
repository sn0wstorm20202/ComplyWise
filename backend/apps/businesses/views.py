"""Business and profile endpoints.

Authority: TRD_v2.0 §31 (API surface), §32 (tenant isolation), §9 (profile
versioning).

Every queryset starts from `Business.accessible_to(request.user)`. A business id
in the URL is never trusted on its own.
"""

from __future__ import annotations

from django.db import transaction
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from common.permissions import IsBusinessMember
from domain.profile.variables import CORE_VARIABLE_KEYS

from .models import Business, BusinessMembership, BusinessProfileVersion
from .serializers import (
    BusinessProfileVersionCreateSerializer,
    BusinessProfileVersionSerializer,
    BusinessSerializer,
    profile_variable_definitions,
)


class BusinessListCreateView(generics.ListCreateAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Business.accessible_to(self.request.user).order_by("-created_at")

    @transaction.atomic
    def perform_create(self, serializer: BusinessSerializer) -> None:
        business = serializer.save(owner=self.request.user)
        BusinessMembership.objects.get_or_create(
            business=business,
            user=self.request.user,
            defaults={"role": BusinessMembership.Role.OWNER},
        )


class BusinessDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated, IsBusinessMember]
    lookup_url_kwarg = "business_id"

    def get_queryset(self):
        return Business.accessible_to(self.request.user)


class _BusinessScopedView(APIView):
    """Shared resolution of the business in the URL."""

    permission_classes = [IsAuthenticated]

    def get_business(self, request: Request, business_id) -> Business | None:  # noqa: ANN001
        return Business.accessible_to(request.user).filter(pk=business_id).first()


class BusinessProfileView(_BusinessScopedView):
    """Current profile for a business, plus the variable schema to render it."""

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        current = business.current_profile
        data = {
            "business_id": str(business.id),
            "current_version": BusinessProfileVersionSerializer(current).data if current else None,
            "variable_definitions": profile_variable_definitions(),
            # Which variables are still unanswered. This is *completeness*, not
            # applicability: an unanswered variable stays UNKNOWN downstream.
            "missing_core_variables": (
                current.missing_keys(CORE_VARIABLE_KEYS) if current else list(CORE_VARIABLE_KEYS)
            ),
        }
        return Response(envelope(data))

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        """Create a new immutable profile version.

        POST, not PUT: a profile is never edited in place (TRD_v2.0 §9).
        """
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        serializer = BusinessProfileVersionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        version = BusinessProfileVersion.create_next(
            business=business,
            variables=serializer.validated_data["variables"],
            created_by=request.user,
            change_note=serializer.validated_data.get("change_note", ""),
            carry_forward=serializer.validated_data.get("carry_forward", True),
        )
        return Response(
            envelope(BusinessProfileVersionSerializer(version).data),
            status=status.HTTP_201_CREATED,
        )


class BusinessProfileHistoryView(_BusinessScopedView):
    """Full version history — the audit trail behind every past decision."""

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        versions = business.profile_versions.order_by("-version")
        return Response(
            envelope(
                BusinessProfileVersionSerializer(versions, many=True).data,
                meta={"count": versions.count()},
            )
        )


class ProfileVariableDefinitionListView(APIView):
    """The canonical variable registry, independent of any one business."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        definitions = profile_variable_definitions()
        return Response(
            envelope(
                definitions,
                meta={"count": len(definitions), "core_variables": list(CORE_VARIABLE_KEYS)},
            )
        )
