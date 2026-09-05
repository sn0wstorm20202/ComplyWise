"""Onboarding & Smart Questions API views.

Authority: PRD_v2.0 §10, TRD_v2.0 §8, §30, §31, §32.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.applicability.models import DecisionRun
from apps.businesses.models import Business
from apps.businesses.serializers import BusinessProfileVersionSerializer

from .serializers import (
    ProductsActivitiesCreateSerializer,
    SmartQuestionAnswerSerializer,
)
from .services import (
    get_dynamic_smart_questions,
    save_products_and_activities,
    save_smart_question_answers,
)


class _OnboardingScopedView(APIView):
    permission_classes = [IsAuthenticated]

    def get_business(self, request: Request, business_id) -> Business | None:  # noqa: ANN001
        return Business.accessible_to(request.user).filter(pk=business_id).first()


class OnboardingQuestionsView(_OnboardingScopedView):
    """Retrieve dynamic smart questions based on the business's current profile.

    Questions are computed at runtime from published rules matching the business's
    jurisdiction and product context.
    """

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        questions_data = get_dynamic_smart_questions(business)
        return Response(envelope(questions_data), status=status.HTTP_200_OK)


class OnboardingAnswersView(_OnboardingScopedView):
    """Submit answers to smart questions and update the business profile."""

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        serializer = SmartQuestionAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Invalid answers submitted.",
                details=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        answers = serializer.validated_data.get("answers", {})
        try:
            new_profile = save_smart_question_answers(
                business=business,
                answers=answers,
                user=request.user,
            )
        except ValueError as exc:
            return error_response(
                "VALIDATION_ERROR",
                str(exc),
                details=[{"field": "answers", "messages": [str(exc)]}],
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            envelope(
                {
                    "message": "Answers saved successfully.",
                    "profile_version": BusinessProfileVersionSerializer(new_profile).data,
                }
            ),
            status=status.HTTP_200_OK,
        )


class OnboardingProductsActivitiesView(_OnboardingScopedView):
    """Submit natural-language products & activities description."""

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProductsActivitiesCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "VALIDATION_ERROR",
                "Invalid products or activities description.",
                details=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        result = save_products_and_activities(
            business=business,
            product_description=serializer.validated_data["product_description"],
            import_export_intent=serializer.validated_data.get("import_export_intent"),
            user=request.user,
        )

        return Response(envelope(result), status=status.HTTP_200_OK)


class OnboardingStatusView(_OnboardingScopedView):
    """Check the onboarding progress status for a business."""

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = self.get_business(request, business_id)
        if business is None:
            return error_response(
                "NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND
            )

        profile = business.current_profile
        has_profile = profile is not None
        has_products = False
        variables_count = 0
        if profile and profile.variables:
            has_products = bool(profile.variables.get("product_description", {}).get("value"))
            variables_count = len([k for k, v in profile.variables.items() if v.get("value") is not None])

        latest_run = DecisionRun.objects.filter(business=business).order_by("-created_at").first()

        status_data = {
            "business_id": str(business.id),
            "business_name": business.name,
            "has_profile": has_profile,
            "profile_version": profile.version if profile else None,
            "has_products": has_products,
            "variables_count": variables_count,
            "has_evaluation": latest_run is not None,
            "latest_run_id": str(latest_run.id) if latest_run else None,
            "current_step": (
                7 if latest_run
                else 4 if has_products and variables_count >= 4
                else 3 if has_profile and not has_products
                else 2 if not has_profile
                else 1
            ),
        }
        return Response(envelope(status_data), status=status.HTTP_200_OK)
