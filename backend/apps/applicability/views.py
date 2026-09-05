"""Views for the applicability evaluation boundary.

Authority: TRD_v2.0 §14, §17, §30, §31; PRD_v2.0 §P3, §P5; Task 2 C9 Audit Corrections.
"""

from __future__ import annotations

import datetime

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from common.pagination import EnvelopePageNumberPagination
from domain.rules.ast import AstValidationError
from apps.businesses.models import Business, BusinessProfileVersion
from .engine import ApplicabilityEngine
from .models import DecisionRun
from .serializers import DecisionRunSerializer


class _BusinessScopedView(APIView):
    """Base view for business-scoped applicability endpoints."""

    permission_classes = [IsAuthenticated]

    def get_business(self, request: Request, business_id) -> Business | None:  # noqa: ANN001
        return Business.accessible_to(request.user).filter(pk=business_id).first()


class BusinessEvaluateView(_BusinessScopedView):
    """Trigger deterministic compliance evaluation against a business profile version."""

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        # Profile version selection: explicit or latest
        profile_version_id = request.data.get("profile_version_id")
        if profile_version_id:
            profile_version = business.profile_versions.filter(pk=profile_version_id).first()
            if profile_version is None:
                return error_response(
                    "NOT_FOUND",
                    "Specified profile version not found for this business.",
                    http_status=status.HTTP_404_NOT_FOUND,
                )
        else:
            profile_version = business.current_profile
            if profile_version is None:
                return error_response(
                    "NO_PROFILE_VERSION",
                    "Business does not have a profile version to evaluate.",
                    http_status=status.HTTP_400_BAD_REQUEST,
                )

        eval_date: datetime.date | None = None
        eval_date_str = request.data.get("evaluation_date")
        if eval_date_str:
            try:
                eval_date = datetime.date.fromisoformat(str(eval_date_str))
            except ValueError:
                return error_response(
                    "VALIDATION_ERROR",
                    "Invalid evaluation_date format. Expected YYYY-MM-DD.",
                    http_status=status.HTTP_400_BAD_REQUEST,
                )

        engine = ApplicabilityEngine()
        try:
            decision_run = engine.evaluate_business_profile(
                business=business,
                profile_version=profile_version,
                evaluation_date=eval_date,
                save_run=True,
            )
        except AstValidationError as exc:
            return error_response(
                "AST_VALIDATION_ERROR",
                f"Rule AST validation error during evaluation: {exc}",
                details={"error": str(exc)},
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return error_response(
                "EVALUATION_FAILED",
                f"Evaluation failed unexpectedly: {exc}",
                details={"error": str(exc)},
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = DecisionRunSerializer(decision_run)
        return Response(envelope(serializer.data), status=status.HTTP_200_OK)


class BusinessDecisionRunsListView(_BusinessScopedView):
    """List historical decision runs for a business with pagination."""

    pagination_class = EnvelopePageNumberPagination

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        runs = (
            DecisionRun.objects.filter(business=business)
            .select_related("profile_version")
            .order_by("-created_at")
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(runs, request, view=self)
        if page is not None:
            serializer = DecisionRunSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = DecisionRunSerializer(runs, many=True)
        return Response(envelope(serializer.data))


class DecisionRunDetailView(_BusinessScopedView):
    """Retrieve details and itemized results of a specific decision run."""

    def get(self, request: Request, business_id, run_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        run = (
            DecisionRun.objects.filter(business=business, pk=run_id)
            .select_related("profile_version")
            .prefetch_related("results")
            .first()
        )
        if run is None:
            return error_response(
                "NOT_FOUND", "Decision run not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        serializer = DecisionRunSerializer(run)
        return Response(envelope(serializer.data))
