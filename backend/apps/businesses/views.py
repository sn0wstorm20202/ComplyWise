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
from django.utils import timezone
from common.enums import AssessmentStatus
from common.permissions import IsBusinessMember
from domain.profile.variables import CORE_VARIABLE_KEYS

from .models import Assessment, Business, BusinessMembership, BusinessProfileVersion
from .serializers import (
    AssessmentSerializer,
    AssessmentSummarySerializer,
    BusinessProfileVersionCreateSerializer,
    BusinessProfileVersionSerializer,
    BusinessSerializer,
    BusinessSummarySerializer,
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


class UserProfileHomeView(APIView):
    """Profile home data for authenticated user: their businesses & recent assessments."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        businesses = Business.accessible_to(user).order_by("-created_at")
        assessments = Assessment.accessible_to(user).order_by("-updated_at")

        data = {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": getattr(user, "full_name", "") or user.email,
            },
            "businesses": BusinessSummarySerializer(businesses, many=True).data,
            "recent_assessments": AssessmentSummarySerializer(assessments[:10], many=True).data,
            "total_businesses": businesses.count(),
            "total_assessments": assessments.count(),
        }
        return Response(envelope(data), status=status.HTTP_200_OK)


class BusinessAssessmentListCreateView(_BusinessScopedView):
    """List assessments for a business or start a new assessment."""

    def get(self, request: Request, business_id) -> Response:
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessments = business.assessments.all().order_by("-assessment_number")
        return Response(
            envelope(
                AssessmentSerializer(assessments, many=True).data,
                meta={"count": assessments.count()},
            )
        )

    def post(self, request: Request, business_id) -> Response:
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        latest = business.assessments.order_by("-assessment_number").first()
        next_num = (latest.assessment_number + 1) if latest else 1

        title = request.data.get("title") or f"Compliance Assessment #{next_num}"
        profile_version = None
        profile_version_id = request.data.get("profile_version_id")
        if profile_version_id:
            profile_version = business.profile_versions.filter(pk=profile_version_id).first()
        if profile_version is None:
            profile_version = business.current_profile

        try:
            initial_step = int(request.data.get("current_step", 1))
        except (ValueError, TypeError):
            initial_step = 1

        step_state = request.data.get("step_state", {})
        if not isinstance(step_state, dict):
            step_state = {}

        assessment = Assessment.objects.create(
            business=business,
            created_by=request.user,
            assessment_number=next_num,
            title=title,
            status=AssessmentStatus.IN_PROGRESS,
            profile_version=profile_version,
            current_step=initial_step,
            step_state=step_state,
        )

        return Response(
            envelope(AssessmentSerializer(assessment).data),
            status=status.HTTP_201_CREATED,
        )


class BusinessAssessmentDetailView(_BusinessScopedView):
    """Retrieve or update an individual assessment."""

    def get(self, request: Request, business_id, assessment_id) -> Response:
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment = business.assessments.filter(pk=assessment_id).first()
        if assessment is None:
            return error_response("NOT_FOUND", "Assessment not found.", http_status=status.HTTP_404_NOT_FOUND)

        return Response(envelope(AssessmentSerializer(assessment).data))

    def patch(self, request: Request, business_id, assessment_id) -> Response:
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment = business.assessments.filter(pk=assessment_id).first()
        if assessment is None:
            return error_response("NOT_FOUND", "Assessment not found.", http_status=status.HTTP_404_NOT_FOUND)

        if "current_step" in request.data:
            try:
                assessment.current_step = int(request.data["current_step"])
            except (ValueError, TypeError):
                pass

        if "step_state" in request.data and isinstance(request.data["step_state"], dict):
            merged_state = dict(assessment.step_state)
            merged_state.update(request.data["step_state"])
            assessment.step_state = merged_state

        if "title" in request.data and request.data["title"]:
            assessment.title = str(request.data["title"]).strip()

        if "status" in request.data and request.data["status"] in AssessmentStatus.values:
            assessment.status = request.data["status"]
            if assessment.status == AssessmentStatus.COMPLETED and not assessment.completed_at:
                assessment.completed_at = timezone.now()

        assessment.save()
        return Response(envelope(AssessmentSerializer(assessment).data))


class AssessmentCompleteView(_BusinessScopedView):
    """Mark an assessment completed and snapshot summary metrics."""

    def post(self, request: Request, business_id, assessment_id) -> Response:
        business = self.get_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment = business.assessments.filter(pk=assessment_id).first()
        if assessment is None:
            return error_response("NOT_FOUND", "Assessment not found.", http_status=status.HTTP_404_NOT_FOUND)

        if "summary" in request.data and isinstance(request.data["summary"], dict):
            merged_summary = dict(assessment.summary)
            merged_summary.update(request.data["summary"])
            assessment.summary = merged_summary

        if "decision_run_id" in request.data and request.data["decision_run_id"]:
            assessment.decision_run_id = request.data["decision_run_id"]
        if "discovery_run_id" in request.data and request.data["discovery_run_id"]:
            assessment.discovery_run_id = request.data["discovery_run_id"]
        if "profile_version_id" in request.data and request.data["profile_version_id"]:
            assessment.profile_version_id = request.data["profile_version_id"]

        assessment.status = AssessmentStatus.COMPLETED
        assessment.current_step = 5
        assessment.completed_at = timezone.now()
        assessment.save()

        return Response(envelope(AssessmentSerializer(assessment).data))


class AssessmentDetailDirectView(APIView):
    """Retrieve an assessment directly by its ID, scoped to user."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, assessment_id) -> Response:
        assessment = Assessment.accessible_to(request.user).filter(pk=assessment_id).first()
        if assessment is None:
            return error_response("NOT_FOUND", "Assessment not found.", http_status=status.HTTP_404_NOT_FOUND)

        return Response(envelope(AssessmentSerializer(assessment).data))
