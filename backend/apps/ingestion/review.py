"""Human knowledge review: captured passage -> published AST -> reevaluation."""
import hashlib
import re

from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from common.envelope import envelope, error_response
from common.permissions import IsComplianceReviewer
from apps.ingestion.models import CandidateRequirement, RetrievedDocument
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.workflows.models import SecurityAuditEvent
from apps.applicability.engine import ApplicabilityEngine
from domain.rules.ast import validate_ast, AstValidationError


class KnowledgeReviewQueueView(APIView):
    permission_classes = [IsComplianceReviewer]

    def get(self, request):
        from .models import SourceChange
        changes = [{"id":str(change.id), "source_url":change.new_source.canonical_url,
                    "source_title":change.new_source.title, "affected_rule_count":len(change.affected_rule_ids),
                    "affected_decision_run_count":len(change.affected_decision_run_ids), "status":change.status,
                    "previous_hash": change.previous_source.content_hash, "new_hash": change.new_source.content_hash}
                   for change in SourceChange.objects.filter(status__in=["PENDING_REVIEW", "UPDATE_REQUIRED"]).select_related("new_source", "previous_source").order_by("-created_at")[:100]]
        rows = CandidateRequirement.objects.exclude(verification_status="VERIFIED").select_related("source", "evidence", "business")[:100]
        return Response(envelope({"source_changes":changes, "candidates": [{"id": str(c.id), "business_name": c.business.name,
            "title": c.requirement_name, "description": c.applicability_statement, "authority": c.authority,
            "jurisdiction": c.jurisdiction, "category": c.category, "status": c.verification_status,
            "source_url": c.source.canonical_url if c.source else None,
            "source_title": c.source.title if c.source else "", "excerpt": c.evidence.excerpt if c.evidence else "",
            "content_hash": c.source.content_hash if c.source else ""} for c in rows]}))


class KnowledgeCandidateReviewView(APIView):
    permission_classes = [IsComplianceReviewer]

    @transaction.atomic
    def post(self, request, candidate_id):
        candidate = CandidateRequirement.objects.select_for_update(of=("self",)).select_related("evidence", "source", "business").filter(pk=candidate_id).first()
        if not candidate:
            return error_response("NOT_FOUND", "Candidate not found.", http_status=404)
        reason = str(request.data.get("reason", "")).strip()
        decision = request.data.get("decision")
        if decision not in {"PUBLISH", "RETURN_FOR_REVIEW"} or not reason:
            return error_response("VALIDATION_ERROR", "Choose a decision and record a reason.", http_status=400)
        if candidate.verification_status == "VERIFIED":
            return error_response("CONFLICT", "This candidate has already been published. Review its next version instead.", http_status=409)
        before = candidate.verification_status
        rule = None
        if decision == "PUBLISH":
            ast = request.data.get("condition_ast")
            try:
                from apps.knowledge.publication import validate_publication
                ast, effective_from, effective_until, examples = validate_publication(ast,
                    request.data.get("effective_from"), request.data.get("effective_until"), request.data.get("examples"))
            except (AstValidationError, ValueError) as exc:
                return error_response("VALIDATION_ERROR", str(exc), http_status=400)
            requirement_id = str(request.data.get("requirement_id", "")).strip()
            rule_id = str(request.data.get("rule_id", "")).strip()
            if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", requirement_id) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", rule_id):
                return error_response("VALIDATION_ERROR", "Record valid catalogue requirement and rule identifiers.", http_status=400)
            existing_requirement = RequirementDefinition.objects.select_for_update().filter(requirement_id=requirement_id).first()
            prior = RuleVersion.objects.select_for_update().filter(rule_id=rule_id).order_by("-version").first()
            if prior and (not existing_requirement or prior.requirement_id != existing_requirement.pk):
                return error_response("CONFLICT", "A rule identifier cannot move to another requirement.", http_status=409)
            if existing_requirement and not prior:
                return error_response("CONFLICT", "Use the existing rule identifier to publish its next version.", http_status=409)
            capture = RetrievedDocument.objects.filter(source=candidate.source).first() if candidate.source else None
            excerpt = candidate.evidence.excerpt if candidate.evidence else ""
            normalized = lambda text: re.sub(r"\s+", " ", text).strip()
            from domain.intelligence.official_sources import is_primary_official_source
            if not candidate.source or not is_primary_official_source(candidate.source.canonical_url):
                return error_response("VALIDATION_ERROR", "An official regulatory source is required.", http_status=400)
            if candidate.evidence and candidate.evidence.source_id != candidate.source_id:
                return error_response("VALIDATION_ERROR", "The passage must belong to this captured source.", http_status=400)
            if not capture or not excerpt or normalized(excerpt) not in normalized(capture.normalized_content):
                return error_response("VALIDATION_ERROR", "A verbatim passage in persisted source content is required.", http_status=400)
            if hashlib.sha256(capture.normalized_content.encode()).hexdigest() != capture.content_hash:
                return error_response("CONFLICT", "Captured content no longer matches its recorded version.", http_status=409)
            # The reviewer authorises this exact captured version and granular claim.
            candidate.source.status = "ACTIVE"
            candidate.source.save(update_fields=["status", "updated_at"])
            candidate.evidence.verification_status = "VERIFIED"
            candidate.evidence.save(update_fields=["verification_status", "updated_at"])
            requirement = existing_requirement or RequirementDefinition.objects.create(requirement_id=requirement_id,
                name=candidate.requirement_name, description=candidate.applicability_statement,
                authority=candidate.authority[:100], jurisdiction=candidate.jurisdiction,
                domain=str(request.data.get("domain", candidate.category))[:50], category=candidate.category,
                status="PUBLISHED", evidence_refs=[candidate.evidence.evidence_id],
                metadata={"reviewed_candidate_id": str(candidate.id), "reviewer_id": str(request.user.id),
                          "required_documents": candidate.document_requirements})
            rule = RuleVersion.objects.create(rule_id=rule_id, requirement=requirement, domain=requirement.domain,
                version=prior.version + 1 if prior else 1, supersedes=prior,
                jurisdiction=requirement.jurisdiction, condition_ast=ast, evidence_refs=[candidate.evidence.evidence_id],
                status="PUBLISHED", result="APPLICABLE", effective_from=effective_from, effective_until=effective_until,
                review_record={"reviewer_id":str(request.user.pk), "reviewed_at":timezone.now().isoformat(),
                    "reason":reason, "source_hash":capture.content_hash, "source_url":candidate.source.canonical_url,
                    "examples":examples})
            candidate.verification_status = "VERIFIED"
        else:
            candidate.verification_status = "CONFLICTING"
        candidate.save(update_fields=["verification_status"])
        SecurityAuditEvent.objects.create(actor_user=request.user, actor_type="ADMIN", action="KNOWLEDGE_" + decision,
            resource_type="CandidateRequirement", resource_id=str(candidate.id), metadata={"reason": reason,
            "before": before, "after": candidate.verification_status, "source_hash": candidate.source.content_hash if candidate.source else None,
            "rule_version_id": str(rule.id) if rule else None, "reviewed_at": timezone.now().isoformat()})
        if rule:
            assessment = candidate.discovery_run.assessment
            profile = assessment.profile_version if assessment and assessment.profile_version else candidate.business.current_profile
            if profile:
                run = ApplicabilityEngine().evaluate_business_profile(business=candidate.business, profile_version=profile, assessment=assessment)
                if assessment:
                    run.assessment = assessment
                    run.save(update_fields=["assessment"])
                    assessment.decision_run = run
                    assessment.save(update_fields=["decision_run", "updated_at"])
        return Response(envelope({"candidate_id": str(candidate.id), "status": candidate.verification_status,
                                  "rule_version_id": str(rule.id) if rule else None}))


class SourceChangeReviewView(APIView):
    permission_classes = [IsComplianceReviewer]

    @transaction.atomic
    def post(self, request, change_id):
        from .models import SourceChange
        change = SourceChange.objects.select_for_update().filter(pk=change_id).first()
        if not change:
            return error_response("NOT_FOUND", "Source change not found.", http_status=404)
        decision = request.data.get("decision")
        reason = request.data.get("reason")
        if decision not in ("NO_RULE_CHANGE", "UPDATE_REQUIRED") or not isinstance(reason, str) or not reason.strip():
            return error_response("VALIDATION_ERROR", "Record the review outcome and reason.", http_status=400)
        before = change.status
        change.status = decision
        change.save(update_fields=["status"])
        SecurityAuditEvent.objects.create(actor_user=request.user, actor_type="ADMIN", action="SOURCE_CHANGE_REVIEW",
            resource_type="SourceChange", resource_id=str(change.id), metadata={
                "before": before, "after": decision, "reason": reason.strip(),
                "previous_hash": change.previous_source.content_hash, "new_hash": change.new_source.content_hash,
                "affected_rule_ids": change.affected_rule_ids,
                "affected_decision_run_ids": change.affected_decision_run_ids})
        return Response(envelope({"id": str(change.id), "status": change.status,
            "message": "Review recorded. Publish a reviewed rule version before reassessing affected businesses."}))


class SourceChangeReassessmentView(APIView):
    permission_classes = [IsComplianceReviewer]

    @transaction.atomic
    def post(self, request, change_id):
        from django.conf import settings
        from .models import SourceChange
        from apps.businesses.models import Assessment
        from apps.businesses.jobs import enqueue, JobConflict
        if not settings.ENABLE_ASSESSMENT_JOBS:
            return error_response("ASYNC_DISABLED", "Enable the assessment worker before scheduling reassessments.", http_status=503)
        change = SourceChange.objects.select_for_update().filter(pk=change_id).first()
        if not change:
            return error_response("NOT_FOUND", "Source change not found.", http_status=404)
        if change.status != "UPDATE_REQUIRED":
            return error_response("CONFLICT", "Record that a rule update is required first.", http_status=409)
        evidence_ids = set(change.new_source.evidence_records.filter(verification_status="VERIFIED").values_list("evidence_id", flat=True))
        old_rules = RuleVersion.objects.filter(pk__in=change.affected_rule_ids)
        from apps.applicability.engine import models_effective_filter
        replacements = RuleVersion.objects.filter(rule_id__in=old_rules.values("rule_id"), status="PUBLISHED").filter(
            models_effective_filter(timezone.localdate())).exclude(pk__in=change.affected_rule_ids)
        replaced = {rule.rule_id for rule in replacements if evidence_ids.intersection(rule.evidence_refs or [])}
        if set(old_rules.values_list("rule_id", flat=True)) - replaced:
            return error_response("CONFLICT", "Publish reviewed replacement versions citing the new capture before reassessment.", http_status=409)
        assessments = Assessment.accessible_to(request.user).filter(decision_run_records__id__in=change.affected_decision_run_ids).distinct().order_by("id")
        queued, busy = [], []
        for assessment in assessments:
            if not assessment.profile_version_id or assessment.status == "ARCHIVED":
                continue
            try:
                job = enqueue(assessment, request.user, "COMPLIANCE_SYNTHESIS",
                    idempotency_key=f"source:{change.id}:{assessment.id}", force_refresh=True)
                queued.append(str(job.id))
            except JobConflict:
                busy.append(str(assessment.id))
        SecurityAuditEvent.objects.create(actor_user=request.user, actor_type="ADMIN", action="SOURCE_CHANGE_REASSESS",
            resource_type="SourceChange", resource_id=str(change.id), metadata={"job_ids":queued, "busy_assessment_ids":busy})
        return Response(envelope({"job_ids": queued, "busy_assessment_ids": busy,
            "message": "Reassessment operations recorded. Historical decision runs are retained."}), status=202)
