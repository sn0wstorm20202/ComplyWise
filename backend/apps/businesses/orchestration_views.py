"""API views for central assessment orchestration.

Authority: Milestone Step 01 Specification; TRD_v2.0 §30, §31; PRD_v2.0 §10, §14.

Endpoints:
- POST /api/v1/assessments/
- GET  /api/v1/assessments/{run_id}/
- POST /api/v1/businesses/{business_id}/assessments/orchestrate
- GET  /api/v1/businesses/{business_id}/assessments/{run_id}/orchestrate

Guarantees:
1. Pure standard envelope response contract {"data": ..., "meta": {...}}.
2. Strict tenant and business ownership enforcement.
3. Idempotency & duplicate active run protection.
4. Safe progress and error state reporting without leaking internal prompts,
   provider credentials, or strategy mode names to the frontend.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business, UserWorkspaceState
from domain.intelligence.orchestration import (
    BudgetExceeded,
    OrchestrationConflict,
    OrchestrationError,
    assessment_orchestrator,
)

logger = logging.getLogger(__name__)


def _resolve_business(request: Request, business_id: Any) -> Business | None:
    if not business_id:
        return None
    try:
        biz_uuid = uuid.UUID(str(business_id))
    except (ValueError, TypeError):
        return None

    if request.user and request.user.is_authenticated:
        return Business.accessible_to(request.user).filter(pk=biz_uuid).first()
    return None


class AssessmentOrchestrationCreateView(APIView):
    """Create or reuse an assessment orchestration run."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_id: Any = None) -> Response:
        target_biz_id = business_id or request.data.get("business_id") or request.query_params.get("business_id")
        if not target_biz_id:
            return error_response(
                "VALIDATION_ERROR",
                "business_id is required to create an assessment run.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        business = _resolve_business(request, target_biz_id)
        if business is None:
            return error_response(
                "NOT_FOUND",
                "Business not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        if not getattr(settings, "ENABLE_API_ORCHESTRATION", True):
            return error_response(
                "FEATURE_DISABLED",
                "API Orchestration is currently disabled by configuration.",
                http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        correlation_id = str(
            request.data.get("correlation_id")
            or request.headers.get("X-Correlation-ID")
            or request.headers.get("X-Request-ID")
            or uuid.uuid4()
        )
        idempotency_key = request.data.get("idempotency_key") or request.headers.get("Idempotency-Key")
        strategy = request.data.get("strategy")

        try:
            run = assessment_orchestrator.create_run(
                business=business,
                user=request.user,
                correlation_id=correlation_id,
                strategy=strategy,
                idempotency_key=idempotency_key,
            )

            # Update authoritative UserWorkspaceState
            try:
                ws, _ = UserWorkspaceState.objects.get_or_create(user=request.user)
                ws.active_business = business
                ws.active_assessment = run.assessment
                ws.save()
            except Exception as ws_exc:
                logger.warning("Could not sync user workspace state: %s", ws_exc)

            response_data = {
                "run_id": run.run_id,
                "assessment_id": run.run_id,
                "business_id": run.business_id,
                "status": run.status,
                "stage": str(run.current_stage),
                "created_at": run.created_at,
            }
            return Response(
                envelope(response_data, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_201_CREATED,
            )

        except OrchestrationConflict as conflict_exc:
            return error_response(
                "ORCHESTRATION_CONFLICT",
                conflict_exc.message_safe,
                http_status=status.HTTP_409_CONFLICT,
            )
        except BudgetExceeded as budget_exc:
            return error_response(
                "BUDGET_EXCEEDED",
                budget_exc.message_safe,
                http_status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except OrchestrationError as orch_exc:
            return error_response(
                orch_exc.code,
                orch_exc.message_safe,
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception("Unexpected error in assessment run creation: %s", exc)
            return error_response(
                "INTERNAL_ERROR",
                "Failed to create assessment run. Please try again.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AssessmentOrchestrationStatusView(APIView):
    """Retrieve safe progress and status for an assessment orchestration run."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, run_id: uuid.UUID, business_id: Any = None) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        if business_id:
            try:
                biz_uuid = uuid.UUID(str(business_id))
                if str(run.business_id) != str(biz_uuid):
                    return error_response(
                        "NOT_FOUND",
                        "Assessment run does not belong to specified business.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    )
            except (ValueError, TypeError):
                return error_response(
                    "NOT_FOUND",
                    "Invalid business identifier.",
                    http_status=status.HTTP_404_NOT_FOUND,
                )

        payload = run.to_safe_dict()
        return Response(
            envelope(payload, meta={"correlation_id": run.correlation_id}),
            status=status.HTTP_200_OK,
        )
