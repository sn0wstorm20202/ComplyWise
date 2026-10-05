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
        rows = CandidateRequirement.objects.exclude(verification_status="VERIFIED").select_related("source", "evidence", "business")[:100]
        return Response(envelope({"candidates": [{"id": str(c.id), "business_name": c.business.name,
            "title": c.requirement_name, "description": c.applicability_statement, "authority": c.authority,
            "jurisdiction": c.jurisdiction, "category": c.category, "status": c.verification_status,
            "source_url": c.source.canonical_url if c.source else None,
            "source_title": c.source.title if c.source else "", "excerpt": c.evidence.excerpt if c.evidence else "",
            "content_hash": c.source.content_hash if c.source else ""} for c in rows]}))


class KnowledgeCandidateReviewView(APIView):
    permission_classes = [IsComplianceReviewer]

    @transaction.atomic
    def post(self, request, candidate_id):
        candidate = CandidateRequirement.objects.select_for_update().select_related("evidence", "source", "business").filter(pk=candidate_id).first()
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
                validate_ast(ast)
            except AstValidationError as exc:
                return error_response("VALIDATION_ERROR", str(exc), http_status=400)
            requirement_id = str(request.data.get("requirement_id", "")).strip()
            rule_id = str(request.data.get("rule_id", "")).strip()
            if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", requirement_id) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", rule_id):
                return error_response("VALIDATION_ERROR", "Record valid catalogue requirement and rule identifiers.", http_status=400)
            if RuleVersion.objects.filter(rule_id=rule_id).exists():
                return error_response("CONFLICT", "This rule identifier already exists; review a new version instead.", http_status=409)
            if RequirementDefinition.objects.filter(requirement_id=requirement_id).exists():
                return error_response("CONFLICT", "This requirement already exists; use its version review process.", http_status=409)
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
            requirement = RequirementDefinition.objects.create(requirement_id=requirement_id,
                name=candidate.requirement_name, description=candidate.applicability_statement,
                authority=candidate.authority[:100], jurisdiction=candidate.jurisdiction,
                domain=str(request.data.get("domain", candidate.category))[:50], category=candidate.category,
                status="PUBLISHED", evidence_refs=[candidate.evidence.evidence_id],
                metadata={"reviewed_candidate_id": str(candidate.id), "reviewer_id": str(request.user.id),
                          "required_documents": candidate.document_requirements})
            rule = RuleVersion.objects.create(rule_id=rule_id, requirement=requirement, domain=requirement.domain,
                jurisdiction=requirement.jurisdiction, condition_ast=ast, evidence_refs=requirement.evidence_refs,
                status="PUBLISHED", result="APPLICABLE")
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
                run = ApplicabilityEngine().evaluate_business_profile(business=candidate.business, profile_version=profile)
                if assessment:
                    run.assessment = assessment
                    run.save(update_fields=["assessment"])
                    assessment.decision_run = run
                    assessment.save(update_fields=["decision_run", "updated_at"])
        return Response(envelope({"candidate_id": str(candidate.id), "status": candidate.verification_status,
                                  "rule_version_id": str(rule.id) if rule else None}))
