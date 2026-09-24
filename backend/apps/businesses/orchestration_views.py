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
        
        # Server-controlled strategy for public users; override only allowed for staff/admin/tests
        server_strategy = getattr(settings, "ASSESSMENT_STRATEGY", "LLM_FIRST").strip().upper()
        requested_strategy = request.data.get("strategy")
        if requested_strategy and (
            getattr(request.user, "is_staff", False)
            or getattr(request.user, "is_superuser", False)
            or getattr(settings, "ALLOW_CLIENT_STRATEGY_OVERRIDE", False)
        ):
            strategy = requested_strategy
        else:
            strategy = server_strategy

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


class AssessmentBusinessUnderstandingView(APIView):
    """Execute AI business understanding for an assessment run."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        try:
            from domain.intelligence.orchestration import AssessmentStage
            res = assessment_orchestrator.execute_stage(run, AssessmentStage.BUSINESS_UNDERSTANDING)
            return Response(
                envelope(res.data, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_200_OK,
            )
        except OrchestrationError as o_exc:
            return error_response(o_exc.code, o_exc.message_safe, http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Error in business understanding: %s", exc)
            return error_response("INTERNAL_ERROR", "Failed to analyze business operations.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentQuestionGenerateView(APIView):
    """Generate exactly 15 intelligent compliance questions in a single LLM call."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        try:
            from domain.intelligence.orchestration import AssessmentStage
            res = assessment_orchestrator.execute_stage(run, AssessmentStage.QUESTION_GENERATION)
            return Response(
                envelope(res.data, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_200_OK,
            )
        except OrchestrationError as o_exc:
            return error_response(o_exc.code, o_exc.message_safe, http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Error in question generation: %s", exc)
            return error_response("INTERNAL_ERROR", "Failed to generate compliance questions.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentQuestionsListView(APIView):
    """List the 15 questions and user completion status for an assessment."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        q_meta = run.stage_metadata.get("question_generation", {}).get("questions", [])
        answers = run.stage_metadata.get("answers", {})

        # If questions not yet generated, attempt to generate or load them
        if not q_meta:
            from domain.intelligence.orchestration import AssessmentStage
            res = assessment_orchestrator.execute_stage(run, AssessmentStage.QUESTION_GENERATION)
            run = assessment_orchestrator.get_run(run.run_id) or run
            q_meta = run.stage_metadata.get("question_generation", {}).get("questions", [])
            if not q_meta and res and res.data:
                q_meta = res.data.get("questions", [])

        # Enrich questions with answer state
        enriched_questions = []
        for q in q_meta:
            qid = q.get("question_id")
            clean_q = {
                "question_id": qid,
                "question": q.get("question"),
                "category": q.get("category"),
                "answer_type": q.get("answer_type"),
                "required": q.get("required", True),
                "options": q.get("options", []),
                "unit": q.get("unit"),
                "help_text": q.get("help_text"),
                "reason": q.get("reason"),
                "order": q.get("order"),
                "is_answered": qid in answers,
                "current_value": answers.get(qid),
            }
            enriched_questions.append(clean_q)

        next_q = next((q for q in enriched_questions if not q["is_answered"]), None)

        response_data = {
            "questions": enriched_questions,
            "total_questions": len(enriched_questions),
            "answered_count": len(answers),
            "is_complete": len(answers) >= len(enriched_questions) and len(enriched_questions) == 15,
            "next_question": next_q,
        }
        return Response(
            envelope(response_data, meta={"correlation_id": run.correlation_id}),
            status=status.HTTP_200_OK,
        )


class AssessmentAnswersSubmitView(APIView):
    """Submit answer(s) to one or more questions without triggering LLM calls."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        from domain.intelligence.answer_interpretation import AnswerInterpreter
        interpreter = AnswerInterpreter()

        # Support single question submission {"question_id": "Q01", "value": ...}
        # Or dictionary submission {"answers": {"Q01": ..., "Q02": ...}}
        # Or array submission {"answers": [{"question_id": "Q01", "value": ...}]}
        answers_dict: dict[str, Any] = {}
        if "question_id" in request.data:
            answers_dict[str(request.data["question_id"])] = request.data.get("value")
        elif "answers" in request.data:
            raw = request.data["answers"]
            if isinstance(raw, dict):
                answers_dict = raw
            elif isinstance(raw, list):
                for item in raw:
                    if isinstance(item, dict) and "question_id" in item:
                        answers_dict[str(item["question_id"])] = item.get("value")

        if not answers_dict:
            return error_response(
                "VALIDATION_ERROR",
                "No answers provided. Include 'question_id' and 'value', or 'answers' map.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        last_result = None
        try:
            for qid, val in answers_dict.items():
                last_result = interpreter.record_answer(run, qid, val)

            return Response(
                envelope(last_result, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_200_OK,
            )
        except OrchestrationError as o_exc:
            return error_response(o_exc.code, o_exc.message_safe, http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Error saving answers: %s", exc)
            return error_response("INTERNAL_ERROR", "Failed to save answer.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentContextView(APIView):
    """Retrieve canonical enriched BusinessContext combining profile, understanding, and answers."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        from domain.intelligence.orchestration import AssessmentStage

        # Execute answer interpretation and context synthesis if needed
        if "context_synthesis" not in run.stage_metadata:
            if "answer_interpretation" not in run.stage_metadata:
                assessment_orchestrator.execute_stage(run, AssessmentStage.ANSWER_INTERPRETATION)
            res = assessment_orchestrator.execute_stage(run, AssessmentStage.CONTEXT_SYNTHESIS)
            context_data = res.data
        else:
            context_data = run.stage_metadata["context_synthesis"]

        return Response(
            envelope(context_data, meta={"correlation_id": run.correlation_id}),
            status=status.HTTP_200_OK,
        )


class AssessmentRegulatoryDiscoveryView(APIView):
    """Execute live regulatory discovery across official portals."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        try:
            from domain.intelligence.orchestration import AssessmentStage
            force_refresh = request.data.get("force_refresh", False)
            if force_refresh and "regulatory_discovery" in run.stage_metadata:
                state = dict(run.stage_metadata)
                del state["regulatory_discovery"]
                run.stage_metadata = state
                run.save()

            res = assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY)
            return Response(
                envelope(res.data, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_200_OK,
            )
        except OrchestrationError as o_exc:
            return error_response(o_exc.code, o_exc.message_safe, http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Error in regulatory discovery endpoint: %s", exc)
            return error_response("INTERNAL_ERROR", "Failed to execute regulatory discovery.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentComplianceSynthesisView(APIView):
    """Execute structured compliance synthesis grounded in official evidence."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        try:
            from domain.intelligence.orchestration import AssessmentStage
            force_refresh = request.data.get("force_refresh", False)
            if force_refresh and "compliance_synthesis" in run.stage_metadata:
                state = dict(run.stage_metadata)
                del state["compliance_synthesis"]
                run.stage_metadata = state
                run.save()

            res = assessment_orchestrator.execute_stage(run, AssessmentStage.COMPLIANCE_SYNTHESIS)
            return Response(
                envelope(res.data, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_200_OK,
            )
        except OrchestrationError as o_exc:
            return error_response(o_exc.code, o_exc.message_safe, http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Error in compliance synthesis endpoint: %s", exc)
            return error_response("INTERNAL_ERROR", "Failed to synthesize compliance requirements.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentComplianceView(APIView):
    """Retrieve structured compliance requirements and executive summary."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        try:
            from domain.intelligence.orchestration import AssessmentStage
            if "compliance_synthesis" not in run.stage_metadata:
                if "regulatory_discovery" not in run.stage_metadata:
                    assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY)
                res = assessment_orchestrator.execute_stage(run, AssessmentStage.COMPLIANCE_SYNTHESIS)
                comp_data = res.data
            else:
                comp_data = run.stage_metadata["compliance_synthesis"]

            return Response(
                envelope(comp_data, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_200_OK,
            )
        except OrchestrationError as o_exc:
            return error_response(o_exc.code, o_exc.message_safe, http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Error retrieving compliance requirements: %s", exc)
            return error_response("INTERNAL_ERROR", "Failed to retrieve compliance requirements.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentEvidenceView(APIView):
    """Retrieve discovered official evidence records with provenance metadata."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        try:
            from domain.intelligence.orchestration import AssessmentStage
            if "regulatory_discovery" not in run.stage_metadata:
                res = assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY)
                disc_data = res.data
            else:
                disc_data = run.stage_metadata["regulatory_discovery"]

            evidence_list = disc_data.get("evidence_candidates") or []
            sources_list = disc_data.get("sources") or []

            response_data = {
                "evidence": evidence_list,
                "total_evidence": len(evidence_list),
                "sources": sources_list,
                "total_sources": len(sources_list),
            }
            return Response(
                envelope(response_data, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_200_OK,
            )
        except OrchestrationError as o_exc:
            return error_response(o_exc.code, o_exc.message_safe, http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Error retrieving evidence: %s", exc)
            return error_response("INTERNAL_ERROR", "Failed to retrieve evidence records.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentSchemesView(APIView):
    """Retrieve matched government schemes and incentives for the assessment."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        try:
            from domain.intelligence.orchestration import AssessmentStage
            if "schemes" not in run.stage_metadata:
                res = assessment_orchestrator.execute_stage(run, AssessmentStage.SCHEMES)
                schemes_data = res.data
            else:
                schemes_data = run.stage_metadata["schemes"]

            return Response(
                envelope(schemes_data, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_200_OK,
            )
        except OrchestrationError as o_exc:
            return error_response(o_exc.code, o_exc.message_safe, http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Error retrieving schemes: %s", exc)
            return error_response("INTERNAL_ERROR", "Failed to retrieve schemes.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssessmentStandardsView(APIView):
    """Retrieve matched statutory and voluntary industrial standards."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, run_id: uuid.UUID) -> Response:
        run = assessment_orchestrator.get_run(run_id, user=request.user)
        if run is None:
            return error_response(
                "NOT_FOUND",
                "Assessment run not found or access denied.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        try:
            from domain.intelligence.orchestration import AssessmentStage
            if "standards" not in run.stage_metadata:
                res = assessment_orchestrator.execute_stage(run, AssessmentStage.STANDARDS)
                stds_data = res.data
            else:
                stds_data = run.stage_metadata["standards"]

            return Response(
                envelope(stds_data, meta={"correlation_id": run.correlation_id}),
                status=status.HTTP_200_OK,
            )
        except OrchestrationError as o_exc:
            return error_response(o_exc.code, o_exc.message_safe, http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Error retrieving standards: %s", exc)
            return error_response("INTERNAL_ERROR", "Failed to retrieve standards.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


