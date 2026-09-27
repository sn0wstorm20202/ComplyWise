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
            "is_complete": len(answers) >= len(enriched_questions) and len(enriched_questions) >= 4,
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
    """Retrieve structured compliance requirements and executive summary.

    Source priority (per audit mandate — RAG retrieves, rules decide, LLM explains):
    1. Engine 2 DecisionResults linked via assessment.decision_run  ← canonical, always preferred
    2. Orchestration compliance_synthesis cache                      ← LLM, only used as fallback
    """

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
            assessment = run.assessment
            biz = assessment.business

            # ----------------------------------------------------------------
            # PRIORITY 1: Engine 2 DecisionResults (canonical, deterministic)
            # ----------------------------------------------------------------
            engine2_run = None
            if assessment.decision_run_id:
                engine2_run = assessment.decision_run
            if engine2_run is None:
                # Try the most recent DecisionRun for this assessment
                from apps.applicability.models import DecisionRun as EngineDecisionRun
                engine2_run = EngineDecisionRun.objects.filter(
                    assessment=assessment
                ).prefetch_related("results").order_by("-created_at").first()

            if engine2_run and engine2_run.results.exists():
                # Build response from Engine 2 DecisionResults
                from apps.knowledge.models import RequirementDefinition
                from apps.evidence.models import Evidence
                from knowledge_packs.catalogs import resolve_statutory_portal
                from apps.requirements.views import _why_summary, PORTAL_KEY

                results = list(engine2_run.results.all())
                req_ids = [r.requirement_id for r in results]
                req_defs = {
                    rd.requirement_id: rd
                    for rd in RequirementDefinition.objects.filter(requirement_id__in=req_ids)
                }

                all_ev_ids: set[str] = set()
                for r in results:
                    for ref in (r.evidence_refs or []):
                        ev_id = ref.get("evidence_id") if isinstance(ref, dict) else ref
                        if ev_id:
                            all_ev_ids.add(str(ev_id))
                evidences_map = {
                    ev.evidence_id: ev
                    for ev in Evidence.objects.filter(evidence_id__in=all_ev_ids).select_related("source")
                }

                requirements = []
                for r in results:
                    req_def = req_defs.get(r.requirement_id)
                    auth = req_def.authority if req_def else "Authority"
                    cat = req_def.category if req_def else "GENERAL"
                    jur = req_def.jurisdiction if req_def else "CENTRAL"
                    metadata = (req_def.metadata or {}) if req_def else {}
                    raw_portal = str(metadata.get(PORTAL_KEY) or "").strip()
                    portal_info = resolve_statutory_portal(
                        authority=auth,
                        requirement_name=r.requirement_name,
                        requirement_id=r.requirement_id,
                        raw_portal=raw_portal,
                    )
                    canonical_source_url = portal_info["url"]
                    portal_name = portal_info["name"]
                    citations = []
                    for ref in (r.evidence_refs or []):
                        ev_id = ref.get("evidence_id") if isinstance(ref, dict) else ref
                        ev_obj = evidences_map.get(str(ev_id))
                        if ev_obj and ev_obj.source:
                            citations.append({
                                "evidence_id": ev_obj.evidence_id,
                                "source_title": ev_obj.source.title,
                                "authority": ev_obj.source.authority,
                                "locator": ev_obj.locator,
                                "excerpt": ev_obj.excerpt,
                                "verification_status": ev_obj.verification_status,
                                "canonical_url": ev_obj.source.canonical_url,
                            })
                    requirements.append({
                        "requirement_id": r.requirement_id,
                        "name": r.requirement_name,
                        "title": r.requirement_name,
                        "authority": auth,
                        "category": cat,
                        "jurisdiction": jur,
                        "domain": req_def.domain if req_def else "GENERAL",
                        "regulatory_domain": req_def.domain if req_def else "GENERAL",
                        "description": req_def.description if req_def else "",
                        "status": r.status,
                        "matched_rule_id": r.explanation_trace.get("matched_rule_id"),
                        "evidence_count": len(r.evidence_refs or []),
                        "explanation_reason": r.explanation_trace.get("reason"),
                        "reason_summary": _why_summary(r.explanation_trace, req_def) if req_def else "",
                        "notes": r.explanation_trace.get("note", ""),
                        "portal": canonical_source_url,
                        "portal_url": canonical_source_url,
                        "portal_name": portal_name,
                        "source_url": canonical_source_url,
                        "source_title": (citations[0]["source_title"] if citations else (req_def.name if req_def else auth)),
                        "citations": citations,
                        "citation_count": len(citations),
                    })

                applicable = [r for r in requirements if r["status"] == "APPLICABLE"]
                needs_info = [r for r in requirements if r["status"] in {"NEEDS_INFORMATION", "NEEDS_VERIFICATION"}]
                not_applicable = [r for r in requirements if r["status"] == "NOT_APPLICABLE"]
                comp_data = {
                    "requirements": requirements,
                    "applicable_count": len(applicable),
                    "source": "ENGINE2_DECISION_RESULTS",
                    "executive_summary": {
                        "total_evaluated": len(requirements),
                        "applicable_count": len(applicable),
                        "needs_information_count": len(needs_info),
                        "not_applicable_count": len(not_applicable),
                        "total_applicable": len(applicable),
                        "total_needs_info": len(needs_info),
                        "total_not_applicable": len(not_applicable),
                        "high_priority_count": len(applicable),
                    },
                    "summary": {
                        "total_applicable": len(applicable),
                        "total_needs_info": len(needs_info),
                        "total_not_applicable": len(not_applicable),
                        "high_priority_count": len(applicable),
                    },
                }
                return Response(
                    envelope(comp_data, meta={"correlation_id": run.correlation_id, "source": "engine2"}),
                    status=status.HTTP_200_OK,
                )

            # ----------------------------------------------------------------
            # PRIORITY 2: Orchestration compliance_synthesis cache (LLM, fallback only)
            # ----------------------------------------------------------------
            from domain.intelligence.orchestration import AssessmentStage
            if "compliance_synthesis" not in run.stage_metadata:
                if "regulatory_discovery" not in run.stage_metadata:
                    assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY)
                res = assessment_orchestrator.execute_stage(run, AssessmentStage.COMPLIANCE_SYNTHESIS)
                comp_data = res.data
            else:
                comp_data = run.stage_metadata["compliance_synthesis"]
                reqs = comp_data.get("requirements") or []
                fssai_count = sum(
                    1 for r in reqs
                    if "fssai" in (r.get("title") or "").lower()
                    or "fssai" in (r.get("authority") or "").lower()
                    or (r.get("regulatory_domain") or "").upper() == "FOOD_SAFETY"
                )
                from domain.intelligence.synthesis import _sanitize_and_prune_irrelevant_requirements
                profile_desc = ""
                if biz and biz.current_profile:
                    p_vars = biz.current_profile.variables or {}
                    p_val = p_vars.get("product_description")
                    profile_desc = p_val.get("value", "") if isinstance(p_val, dict) else str(p_val or "")
                if not profile_desc and biz:
                    profile_desc = biz.name

                reqs = _sanitize_and_prune_irrelevant_requirements(reqs, profile_desc)
                comp_data["requirements"] = reqs
                comp_data["applicable_count"] = sum(1 for r in reqs if r.get("status") == "APPLICABLE")

                if fssai_count > 1:
                    from domain.intelligence.synthesis import _consolidate_fssai_requirements
                    from domain.intelligence.orchestration import OrchestrationContext
                    ctx = OrchestrationContext.from_business(
                        run.assessment.business,
                        assessment=run.assessment,
                        correlation_id=run.correlation_id,
                    )
                    consolidated = _consolidate_fssai_requirements(ctx, reqs)
                    comp_data["requirements"] = consolidated
                    comp_data["applicable_count"] = sum(1 for r in consolidated if r.get("status") == "APPLICABLE")

                if isinstance(comp_data.get("executive_summary"), dict):
                    final_reqs = comp_data["requirements"]
                    comp_data["executive_summary"]["total_evaluated"] = len(final_reqs)
                    comp_data["executive_summary"]["applicable_count"] = sum(1 for r in final_reqs if r.get("status") == "APPLICABLE")
                    comp_data["executive_summary"]["needs_information_count"] = sum(
                        1 for r in final_reqs if r.get("status") in {"NEEDS_INFORMATION", "NEEDS_VERIFICATION"}
                    )
                state = dict(run.stage_metadata)
                state["compliance_synthesis"] = comp_data
                if "COMPLIANCE_SYNTHESIS" in state and isinstance(state["COMPLIANCE_SYNTHESIS"], dict):
                    state["COMPLIANCE_SYNTHESIS"]["data"] = comp_data
                run.stage_metadata = state
                run.save()

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


