"""A historical keyword match cannot become a new mandatory action."""

import pytest

from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Assessment, BusinessProfileVersion
from apps.documents.models import DocumentRequirement
from apps.knowledge.models import RequirementDefinition
from apps.workflows.models import ComplianceCase
from apps.workflows.services.case_factory import generate_compliance_cases_for_business
from apps.workflows.services.case_service import CaseService
from domain.intelligence.document_derivation import derive_business_documents
from tests.test_standards_hardening import standard_business as standard_business


@pytest.mark.django_db
def test_legacy_standard_match_does_not_derive_documents_or_start_case(business):
    definition = RequirementDefinition.objects.create(
        requirement_id="SYNTHETIC-LEGACY-STANDARD", name="Synthetic product standard",
        authority="Synthetic test authority", jurisdiction="CENTRAL", domain="QUALITY",
        category="STANDARD", status="PUBLISHED",
        metadata={"required_documents": ["Synthetic conformity checklist"]},
    )
    profile = BusinessProfileVersion.objects.create(
        business=business, version=1,
        variables={"product_description": {"value": "Component assembly"}},
    )
    assessment = Assessment.objects.create(business=business, profile_version=profile)
    run = DecisionRun.objects.create(
        business=business, assessment=assessment, profile_version=profile, status="COMPLETED",
    )
    recorded = DecisionResult.objects.create(
        decision_run=run, requirement_id=definition.requirement_id,
        requirement_name=definition.name, status="APPLICABLE",
        explanation_trace={"status": "APPLICABLE", "evaluations": []},
    )
    assessment.decision_run = run
    assessment.save(update_fields=["decision_run"])

    documents = derive_business_documents(business, assessment_id=str(assessment.id))
    assert documents["documents"] == []
    assert documents["requirements_summary"] == []
    assert generate_compliance_cases_for_business(business, assessment) == []
    assert not ComplianceCase.objects.filter(assessment=assessment).exists()
    # Read safety is not a rewrite of historical assessment evidence.
    recorded.refresh_from_db()
    assert recorded.status == "APPLICABLE"


@pytest.mark.django_db
def test_contextual_case_cannot_invent_statutory_reason_or_mandated_documents(business):
    case = ComplianceCase.objects.create(
        business=business, case_number="SYNTHETIC-CONTEXTUAL-CASE",
        requirement_id_code="synthetic-contextual-guidance",
        metadata={"result_origin": "LLM_FALLBACK_RESULT"},
    )
    DocumentRequirement.objects.create(
        case=case, document_type_code="synthetic-preparation", name="Preparation checklist", required=False,
    )
    summary = CaseService.get_why_applicable_summary(case)
    assert "Contextual preparation" in summary
    assert "statutory applicability has not been established" in summary
    task = CaseService.get_current_user_task(case)
    assert task["title"] == "Prepare Documents (1 remaining)"
    assert "Mandated" not in task["title"]
    case.document_requirements.all().delete()
    empty = CaseService.get_current_user_task(case)
    assert empty["title"] == "No Filing Checklist Recorded"
    assert "Documents Submitted" not in empty["title"]


@pytest.mark.django_db
def test_empty_historical_case_does_not_inherit_later_profile_or_invent_power_unit(business):
    old = Assessment.objects.create(business=business)
    BusinessProfileVersion.objects.create(
        business=business, version=1,
        variables={"total_worker_count": {"value": 86}, "connected_power_load": {"value": 12}},
    )
    case = ComplianceCase.objects.create(
        business=business, assessment=old, case_number="SYNTHETIC-EMPTY-CASE",
    )
    assert CaseService.get_business_context(case)["workers"] == "Not Specified"
    case.profile_version = business.current_profile
    assert CaseService.get_business_context(case)["power_load"] == "12 HP"


@pytest.mark.django_db
@pytest.mark.parametrize("mandate", [True, False, None])
def test_standard_document_mandate_agrees_with_reviewed_linkage(standard_business, mandate):
    business, profile, assessment, definition, rule, evidence = standard_business
    definition.metadata = {"required_documents": ["Synthetic quality checklist"]}
    if mandate is not None:
        definition.metadata["is_mandatory"] = mandate
    if mandate is True:
        definition.metadata["mandatory_reference"] = {
            "rule_id": rule.rule_id, "evidence_ids": [evidence.evidence_id],
        }
    definition.save(update_fields=["metadata"])
    run = ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=profile)
    run.assessment = assessment
    run.save(update_fields=["assessment"])
    assessment.decision_run = run
    assessment.save(update_fields=["decision_run"])
    assert run.results.get(requirement_id=definition.requirement_id).status == "APPLICABLE"
    documents = derive_business_documents(business, assessment_id=str(assessment.id))["documents"]
    checklist = next(doc for doc in documents if doc["requirement_id"] == definition.requirement_id)
    assert checklist["mandatory"] is (mandate is True)
    case = next(case for case in generate_compliance_cases_for_business(business, assessment)
                if case.requirement_id_code == definition.requirement_id)
    assert case.document_requirements.get().required is (mandate is True)
