"""Source-grounded guidance and immutable assessment/document regressions."""
import json
from unittest.mock import Mock, patch

import pytest

from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Assessment, BusinessProfileVersion, WorkspaceGuidance
from apps.documents.models import DocumentRequirement
from apps.documents.views import _persist_checklist_record
from apps.knowledge.models import RequirementDefinition
from apps.workflows.services.case_factory import generate_compliance_cases_for_business
from apps.workflows.services.case_service import CaseService
from domain.intelligence.document_derivation import derive_business_documents
from domain.intelligence.output_safety import validate_question_plan, validate_workspace_shape
from domain.intelligence.workspace_guidance import generate_workspace, normalize_workspace
from domain.providers.base import CompletionResult, ProviderError


def test_gemini_translates_structured_output_contract_to_native_json_mode():
    from django.test import override_settings

    from domain.providers.base import ChatMessage
    from domain.providers.gemini_provider import GeminiProvider
    response = {"candidates": [{"content": {"parts": [{"text": '{"questions":[]}'}]}}]}
    with override_settings(GEMINI_MODEL="synthetic-model"), patch("domain.providers.gemini_provider.post_json", return_value=response) as request:
        provider = GeminiProvider()
        provider._complete_once([ChatMessage("user", "Synthetic structured task")], key="synthetic-key",
            response_format={"type": "json_object"}, response_validator=validate_question_plan)
        assert request.call_args.args[1]["generationConfig"]["responseMimeType"] == "application/json"
        provider._complete_once([ChatMessage("user", "Synthetic ordinary task")], key="synthetic-key")
        assert "responseMimeType" not in request.call_args.args[1]["generationConfig"]


@pytest.mark.parametrize("field,wording", [
    ("question_text", "Under the Battery Waste Management Rules, do you sell products under your own brand?"),
    ("reason", "These products have distinct automotive mandates."),
    ("why_it_matters", "Needed to establish the exact hazardous waste classification codes."),
    ("allowed_values", ["AIS-156 mandatory category", "Other"]),
    ("question_text", "Do your products comply with ISO 10993?"),
    ("reason", "Registration applies above the threshold of 86 workers."),
])
def test_interview_plan_rejects_legal_claims_without_supplied_passages(field, wording):
    question = {"target_variable_id": "dynamic_operations", "question_text": "Do you sell under your own brand?",
                "answer_type": "SINGLE_CHOICE", "allowed_values": ["Yes", "No"]}
    question[field] = wording
    with pytest.raises(ValueError):
        validate_question_plan(json.dumps({"questions": [question]}))


def test_interview_allows_operational_choices_and_counts_without_inventing_thresholds():
    validate_question_plan(json.dumps({"questions": [{"target_variable_id": "dynamic_seating",
        "question_text": "What is your seating capacity?", "answer_type": "SINGLE_CHOICE",
        "allowed_values": ["1-10 seats", "11-20 seats", "more than 20 seats"]}]}))


def test_cached_interview_preserves_fact_question_and_neutralizes_unsupported_explanation():
    from apps.onboarding.question_policy import normalize_candidate
    question = normalize_candidate({"variable_key": "dynamic_brand_ownership", "answer_type": "BOOLEAN",
        "question_text": "Under the Battery Waste Management Rules, do you sell products under your own brand?",
        "reason": "This determines whether registration is mandatory.",
        "why_it_matters": "Different vehicles correspond to AIS-156 mandates."}, {})
    assert question["question_text"] == "do you sell products under your own brand?"
    assert question["fact_key"] == "dynamic_brand_ownership"
    assert "supporting evidence" in question["why_it_matters"]
    assert "mandatory" not in question["reason"]
    assert question["source_decision_refs"] == []
    assert normalize_candidate({"variable_key": "dynamic_test", "question_text": "Is the ISO 10993 test complete?"}, {}) is None
    assert normalize_candidate({"variable_key": "dynamic_test", "question_text": "Is testing complete?",
        "options": [{"value": "iso", "label": "ISO 10993"}]}, {}) is None


@pytest.mark.django_db
def test_persisted_question_plan_cannot_restore_an_unsourced_legal_explanation(business):
    from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan
    from apps.onboarding.planner import plan_adaptive_smart_questions
    snapshot = BusinessProfileVersion.objects.create(business=business, version=1,
        variables={"product_description": {"value": "Battery-pack assembly"}, "state": {"value": "MAHARASHTRA"}})
    assessment = Assessment.objects.create(business=business, profile_version=snapshot)
    plan = SmartQuestionPlan.objects.create(business=business, assessment=assessment)
    stored = SmartQuestionInstance.objects.create(business=business, plan=plan, question_id="brand",
        variable_key="dynamic_brand_ownership", target_variable_id="dynamic_brand_ownership",
        question_text="Under the Battery Waste Management Rules, do you sell under your own brand?",
        why_it_matters="This determines whether registration is mandatory.", data_type="BOOLEAN")
    with patch("apps.onboarding.planner.get_llm_provider") as provider:
        result = plan_adaptive_smart_questions(business, assessment_id=str(assessment.id))
        provider.return_value.complete.assert_not_called()
    question = next(row for row in result["questions"] if row["question_id"] == "brand")
    assert question["question_text"] == "do you sell under your own brand?"
    assert "supporting evidence" in question["why_it_matters"]
    stored.refresh_from_db()
    assert stored.question_text.startswith("Under")  # historical input remains recorded
    from apps.onboarding.planner import get_next_adaptive_question
    next_question = get_next_adaptive_question(business, assessment_id=str(assessment.id))
    assert next_question["question_text"] == question["question_text"]
    assert next_question["why_it_matters"] == question["why_it_matters"]


@pytest.mark.django_db
def test_question_get_upgrades_legacy_cache_without_counting_unrelated_answers(business, auth_client):
    from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan
    snapshot = BusinessProfileVersion.objects.create(business=business, version=1,
        variables={"product_description": {"value": "Battery-pack assembly"}, "state": {"value": "MAHARASHTRA"}})
    assessment = Assessment.objects.create(business=business, profile_version=snapshot, step_state={"stage_metadata": {
        "answers": {"prior": "Saved previous answer"},
        "question_generation": {"question_policy_version": 4, "questions": [{"question_id": "brand",
            "question": "Under the Battery Waste Management Rules, do you sell under your own brand?"}]}}})
    plan = SmartQuestionPlan.objects.create(business=business, assessment=assessment)
    SmartQuestionInstance.objects.create(business=business, plan=plan, question_id="brand",
        variable_key="dynamic_brand_ownership", target_variable_id="dynamic_brand_ownership",
        question_text="Under the Battery Waste Management Rules, do you sell under your own brand?",
        why_it_matters="This determines whether registration is mandatory.", data_type="BOOLEAN")
    with patch("apps.onboarding.planner.get_llm_provider") as provider:
        response = auth_client.get(f"/api/v1/assessments/{assessment.id}/questions/")
        provider.return_value.complete.assert_not_called()
    assert response.status_code == 200
    payload = response.data["data"]
    assert "Under" not in payload["questions"][0]["question"]
    assert payload["answered_count"] == 0 and payload["is_complete"] is False
    assessment.refresh_from_db()
    assert assessment.step_state["stage_metadata"]["answers"]["prior"] == "Saved previous answer"
    assert assessment.step_state["stage_metadata"]["question_generation"]["question_policy_version"] == 5


def guidance(count=None):
    reason = f"The saved profile records {count} employees." if count is not None else "The saved business operates a workshop."
    return {"compliance_items": [{"key": "records", "title": "Review workforce records",
        "why_it_may_apply": reason, "recommended_next_step": "Confirm the relevant filing requirements."}],
        "documents": [{"title": "Workforce information checklist", "description": reason,
                       "requirement_key": "records"}],
        "workflows": [{"title": "Prepare workforce information", "requirement_key": "records",
                       "steps": ["Gather the saved business information", "Confirm filing needs with the authority"]}]}


def context(count=86):
    return {"profile_facts": {"total_worker_count": {"value": count},
        "product_description": {"value": "Workshop operations"}}}


@pytest.mark.parametrize("collection,field,text", [
    ("compliance_items", "why_it_may_apply", "Submit form 999 within 7 days"),
    ("compliance_items", "confidence_explanation", "Verified by section 999"),
    ("documents", "description", "Pay a fee of INR 50000"),
    ("workflows", "steps", ["Submit form 999 within 7 days"]),
    ("compliance_items", "description", "You must obtain the authorization"),
    ("compliance_items", "why_it_may_apply", "The programme is eligible for this business"),
    ("compliance_items", "why_it_may_apply", "The registration threshold is 86 workers"),
    ("compliance_items", "description", "The minimum qualifying headcount is 86"),
    ("compliance_items", "description", "Registration applies above 86 employees"),
    ("compliance_items", "description", "86 workers is the registration threshold"),
    ("compliance_items", "description", "Registration applies at 86 workers"),
    ("compliance_items", "description", "Battery Waste Management Rules 2022 govern this business"),
])
def test_all_visible_guidance_fields_reject_unsupported_legal_details(collection, field, text):
    payload = guidance()
    payload[collection][0][field] = text
    with pytest.raises(ValueError):
        validate_workspace_shape(payload, context())


@pytest.mark.parametrize("field,value", [
    ("quote", "An invented passage"), ("source", {"id": "SOURCE-FAKE"}),
    ("source_title", "A fabricated official publication"),
    ("evidence_excerpt", "An invented passage"), ("publication_date", "2026-10-04"),
    ("is_mandatory", True), ("status", "APPLICABLE"),
    ("evidence_id", "EVIDENCE-FAKE"), ("citation_id", "CITATION-FAKE"),
    ("source_ids", ["SOURCE-FAKE"]),
])
def test_contextual_guidance_cannot_assign_evidence_or_final_decision_metadata(field, value):
    payload = guidance()
    payload["compliance_items"][0][field] = value
    with pytest.raises(ValueError):
        validate_workspace_shape(payload, context())


def test_profile_url_does_not_authorize_a_source_link():
    supplied = context()
    supplied["profile_facts"]["product_description"]["value"] += " https://example.gov.in/fake-notification"
    payload = guidance()
    payload["compliance_items"][0]["source_reference"] = "https://example.gov.in/fake-notification"
    with pytest.raises(ValueError, match="unsupplied source URL"):
        validate_workspace_shape(payload, json.dumps(supplied))


def test_actual_source_record_authorizes_only_its_exact_url_and_quote():
    supplied = context()
    supplied["verified_passages"] = [{"evidence_id": "SYNTHETIC-EVIDENCE", "source_id": "SYNTHETIC-SOURCE",
        "source_url": "https://example.gov.in/actual-publication.pdf", "authority": "Synthetic test authority",
        "excerpt": "Synthetic filing information is recorded in form 123."}]
    payload = guidance()
    payload["compliance_items"][0]["description"] = "Review form 123 in the supplied source."
    payload["compliance_items"][0]["source_reference"] = "https://example.gov.in/actual-publication.pdf"
    validate_workspace_shape(payload, supplied)
    payload["compliance_items"][0]["source_reference"] = "https://example.gov.in/"
    with pytest.raises(ValueError):
        validate_workspace_shape(payload, supplied)
    payload["compliance_items"][0]["source_reference"] = "Synthetic test authority"
    payload["compliance_items"][0]["description"] = 'The source states "Every workshop must pay a fee".'
    with pytest.raises(ValueError):
        validate_workspace_shape(payload, supplied)


def test_unrecorded_source_names_are_removed_instead_of_presented_as_provenance():
    payload = guidance()
    payload["compliance_items"][0].update(source_reference="Invented regulator", authority_or_regulator="Invented regulator")
    result = normalize_workspace(payload, [], context())
    assert result["compliance_items"][0]["source_reference"] == ""
    assert result["compliance_items"][0]["authority_or_regulator"] == ""
    assert result["compliance_items"][0]["status"] == "SUGGESTED"
    assert result["compliance_items"][0]["citations"] == []


def test_employee_claim_uses_profile_snapshot_even_when_evidence_contains_old_count():
    supplied = context(86)
    supplied["verified_passages"] = [{"evidence_id": "SYNTHETIC-EVIDENCE", "excerpt": "An older illustrative record mentions 64 employees."}]
    validate_workspace_shape(guidance(86), supplied)
    with pytest.raises(ValueError, match="employee count"):
        validate_workspace_shape(guidance(64), supplied)


def test_employee_alias_and_source_backed_threshold_keep_distinct_meanings():
    supplied = {"profile_facts": {"total_workforce": {"value": 86}},
        "verified_passages": [{"evidence_id": "SYNTHETIC-EVIDENCE", "excerpt": "Synthetic threshold is 86 workers."}]}
    validate_workspace_shape(guidance(86), supplied)
    threshold = guidance(86)
    threshold["compliance_items"][0]["description"] = "Check the synthetic threshold is 86 workers in the recorded passage."
    validate_workspace_shape(threshold, supplied)
    with pytest.raises(ValueError):
        validate_workspace_shape(guidance(64), supplied)


@pytest.mark.parametrize("observation", [
    "The saved annual turnover is INR 6000000.",
    "The reported annual revenue is ₹6,000,000.00.",
    "The recorded turnover: Rs. 6000000.",
    "The saved plant and machinery investment is INR 1200000.",
    "Investment in plant & machinery of ₹1,200,000 was reported.",
])
def test_named_saved_financial_amount_is_an_observation_not_a_legal_claim(observation):
    supplied = context()
    supplied["profile_facts"].update(annual_turnover={"value": 6000000},
                                     plant_machinery_investment={"value": 1200000})
    payload = guidance()
    payload["compliance_items"][0]["why_it_may_apply"] = observation
    validate_workspace_shape(payload, supplied)


def test_worker_word_suffix_does_not_become_a_rupee_claim():
    payload = guidance()
    payload["compliance_items"][0]["why_it_may_apply"] = "The saved profile reports total workers 86."
    validate_workspace_shape(payload, context(86))


@pytest.mark.parametrize("unsupported", [
    "The saved annual turnover is INR 1200000.",
    "The saved plant and machinery investment is INR 6000000.",
    "The saved annual turnover is INR 7000000.",
    "The saved annual turnover is INR 6 million.",
    "The saved annual turnover is INR 6000000 lakh.",
    "The saved annual turnover is INR 6000000%.",
    "The licence fee is INR 6000000.",
    "The subsidy is INR 1200000.",
    "The eligibility threshold is INR 6000000.",
    "The annual turnover of INR 6000000 is the minimum for registration.",
    "Annual turnover is INR 6000000 and qualifies for the grant.",
    "Annual turnover is INR 6000000, the statutory filing fee.",
    "The saved annual turnover is INR 6000000. The licence fee is INR 6000000.",
    "The saved amount is INR 6000000.",
])
def test_profile_amount_cannot_authorize_another_fact_fee_or_threshold(unsupported):
    supplied = context()
    supplied["profile_facts"].update(annual_turnover={"value": 6000000},
                                     plant_machinery_investment={"value": 1200000})
    payload = guidance()
    payload["documents"][0]["description"] = unsupported
    with pytest.raises(ValueError):
        validate_workspace_shape(payload, supplied)


def test_financial_observation_requires_the_named_fact_in_the_current_snapshot():
    supplied = context()
    supplied["profile_facts"]["total_worker_count"] = {"value": 6000000}
    payload = guidance()
    payload["compliance_items"][0]["description"] = "The saved annual turnover is INR 6000000."
    with pytest.raises(ValueError):
        validate_workspace_shape(payload, supplied)


def test_actual_supplied_fee_remains_evidence_bound_not_profile_bound():
    supplied = context()
    supplied["verified_passages"] = [{"evidence_id": "SYNTHETIC-PASSAGE",
        "excerpt": "A synthetic test fee of INR 50000 is recorded here."}]
    payload = guidance()
    payload["compliance_items"][0]["description"] = "Check the recorded fee of INR 50000 in the supplied passage."
    validate_workspace_shape(payload, supplied)


def assessment_with_result(business, count, number, requirement):
    profile = BusinessProfileVersion.objects.create(business=business, version=number,
        variables={"total_worker_count": {"value": count}, "product_description": {"value": "Workshop operations"}})
    assessment = Assessment.objects.create(business=business, assessment_number=number, profile_version=profile)
    run = DecisionRun.objects.create(business=business, assessment=assessment, profile_version=profile, status="COMPLETED")
    DecisionResult.objects.create(decision_run=run, requirement_id=requirement.requirement_id,
        requirement_name=requirement.name, status="APPLICABLE")
    assessment.decision_run = run
    assessment.save(update_fields=["decision_run"])
    return assessment, profile


@pytest.mark.django_db
def test_cases_and_documents_are_separate_for_each_assessment_snapshot(make_business, user):
    business = make_business(user)
    requirement = RequirementDefinition.objects.create(requirement_id="SYNTHETIC-RECORDS", name="Synthetic records",
        authority="Synthetic test authority", jurisdiction="CENTRAL", domain="LABOR", status="PUBLISHED",
        metadata={"required_documents": ["Workforce information checklist"]})
    old, old_profile = assessment_with_result(business, 64, 1, requirement)
    new, new_profile = assessment_with_result(business, 86, 2, requirement)
    old_case = generate_compliance_cases_for_business(business, old)[0]
    new_case = generate_compliance_cases_for_business(business, new)[0]
    assert old_case.id != new_case.id
    assert old_case.assessment_id == old.id and old_case.profile_version_id == old_profile.id
    assert new_case.assessment_id == new.id and new_case.profile_version_id == new_profile.id
    assert CaseService.get_business_context(old_case)["workers"] == 64
    assert CaseService.get_business_context(new_case)["workers"] == 86
    old_doc = old_case.document_requirements.get()
    new_doc = new_case.document_requirements.get()
    assert old_doc.id != new_doc.id
    assert generate_compliance_cases_for_business(business, new)[0].id == new_case.id
    assert DocumentRequirement.objects.filter(case=new_case).count() == 1


@pytest.mark.django_db
def test_explicit_unevaluated_assessment_never_reuses_business_latest_run(make_business, user):
    business = make_business(user)
    requirement = RequirementDefinition.objects.create(requirement_id="SYNTHETIC-RECORDS", name="Synthetic records",
        authority="Synthetic test authority", jurisdiction="CENTRAL", domain="LABOR", status="PUBLISHED")
    evaluated, profile = assessment_with_result(business, 64, 1, requirement)
    unevaluated = Assessment.objects.create(business=business, assessment_number=2, profile_version=profile)
    assert generate_compliance_cases_for_business(business, unevaluated) == []
    other = make_business(user, name="Different workshop")
    with pytest.raises(ValueError):
        generate_compliance_cases_for_business(other, evaluated)


@pytest.mark.django_db
def test_generated_document_text_reads_new_snapshot_and_preserves_old_assessment(make_business, user):
    business = make_business(user)
    provider = Mock()
    old = None
    for number, count in enumerate((64, 86), 1):
        profile = BusinessProfileVersion.objects.create(business=business, version=number,
            variables={"total_worker_count": {"value": count}, "product_description": {"value": "Workshop operations"}})
        assessment = Assessment.objects.create(business=business, assessment_number=number, profile_version=profile)
        provider.complete.return_value = CompletionResult(json.dumps(guidance(count)), "test", "test-model")
        with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
            generate_workspace(business, assessment, profile, [], {})
        supplied = json.loads(provider.complete.call_args.args[0][1].content)
        assert supplied["profile_facts"]["total_worker_count"]["value"] == count
        documents = derive_business_documents(business, assessment_id=str(assessment.id))["documents"]
        assert documents[0]["description"] == f"The saved profile records {count} employees."
        if old is None:
            old = assessment
    historical = derive_business_documents(business, assessment_id=str(old.id))["documents"]
    assert historical[0]["description"] == "The saved profile records 64 employees."


@pytest.mark.django_db
def test_stale_model_employee_value_is_rejected_before_persistence(make_business, user):
    business = make_business(user)
    profile = BusinessProfileVersion.objects.create(business=business, version=1, variables=context(86)["profile_facts"])
    assessment = Assessment.objects.create(business=business, profile_version=profile)
    provider = Mock()
    provider.complete.return_value = CompletionResult(json.dumps(guidance(64)), "test", "test-model")
    with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
        with pytest.raises(ProviderError):
            generate_workspace(business, assessment, profile, [], {})
    assert not WorkspaceGuidance.objects.filter(assessment=assessment).exists()


@pytest.mark.django_db
def test_foreign_snapshot_is_rejected_without_provider_request(make_business, user):
    business = make_business(user)
    other = make_business(user, name="Different workshop")
    profile = BusinessProfileVersion.objects.create(business=other, version=1, variables={})
    assessment = Assessment.objects.create(business=business)
    with patch("domain.intelligence.workspace_guidance.get_llm_provider") as provider:
        with pytest.raises(ValueError):
            generate_workspace(business, assessment, profile, [], {})
    provider.assert_not_called()


@pytest.mark.django_db
def test_case_and_document_apis_reject_foreign_assessment_and_scope_results(make_business, user, api_client):
    business = make_business(user)
    other = make_business(user, name="Different workshop")
    requirement = RequirementDefinition.objects.create(requirement_id="SYNTHETIC-RECORDS", name="Synthetic records",
        authority="Synthetic test authority", jurisdiction="CENTRAL", domain="LABOR", status="PUBLISHED",
        metadata={"required_documents": ["Workforce information checklist"]})
    old, _ = assessment_with_result(business, 64, 1, requirement)
    new, _ = assessment_with_result(business, 86, 2, requirement)
    foreign, _ = assessment_with_result(other, 12, 1, requirement)
    old_case = generate_compliance_cases_for_business(business, old)[0]
    api_client.force_authenticate(user)
    response = api_client.get(f"/api/v1/businesses/{business.id}/cases?assessment_id={new.id}")
    assert response.status_code == 200, response.data
    assert len(response.data["data"]["cases"]) == 1
    assert response.data["data"]["cases"][0]["id"] != str(old_case.id)
    for endpoint in ("cases", "documents"):
        response = api_client.get(f"/api/v1/businesses/{business.id}/{endpoint}?assessment_id={foreign.id}")
        assert response.status_code == 404
    response = api_client.post(f"/api/v1/businesses/{business.id}/cases", {"assessment_id": str(foreign.id)}, format="json")
    assert response.status_code == 404


@pytest.mark.django_db
def test_upload_checklist_reuses_actual_assessment_case_without_duplicate(make_business, user):
    business = make_business(user)
    requirement = RequirementDefinition.objects.create(requirement_id="SYNTHETIC-RECORDS", name="Synthetic records",
        authority="Synthetic test authority", jurisdiction="CENTRAL", domain="LABOR", status="PUBLISHED")
    assessment, _ = assessment_with_result(business, 86, 1, requirement)
    case = generate_compliance_cases_for_business(business, assessment)[0]
    document = {"id": "SYNTHETIC-RECORDS::DOC-1", "name": "Workforce checklist",
        "requirement_id": requirement.requirement_id, "requirement_name": requirement.name,
        "authority": requirement.authority, "mandatory": False}
    record = _persist_checklist_record(business, assessment, document)
    assert record.case_id == case.id


@pytest.mark.django_db
def test_unresolved_rule_does_not_make_its_preparation_documents_mandatory(make_business, user):
    business = make_business(user)
    requirement = RequirementDefinition.objects.create(requirement_id="SYNTHETIC-UNRESOLVED", name="Synthetic unresolved records",
        authority="Synthetic test authority", jurisdiction="CENTRAL", domain="LABOR", status="PUBLISHED",
        metadata={"required_documents": ["Workforce information checklist"]})
    assessment, _ = assessment_with_result(business, 86, 1, requirement)
    assessment.decision_run.results.update(status="NEEDS_INFORMATION")
    case = generate_compliance_cases_for_business(business, assessment)[0]
    assert case.document_requirements.get().required is False
    documents = derive_business_documents(business, assessment_id=str(assessment.id))["documents"]
    assert documents[0]["mandatory"] is False
    assert "applicability still needs confirmation" in documents[0]["notes"]


@pytest.mark.django_db
def test_missing_published_checklist_does_not_invent_statutory_documents(make_business, user):
    business = make_business(user)
    requirement = RequirementDefinition.objects.create(requirement_id="SYNTHETIC-UNRECORDED", name="Synthetic records",
        authority="Synthetic test authority", jurisdiction="CENTRAL", domain="LABOR", status="PUBLISHED")
    assessment, _ = assessment_with_result(business, 86, 1, requirement)
    case = generate_compliance_cases_for_business(business, assessment)[0]
    document = case.document_requirements.get()
    assert document.required is False
    assert "Business information checklist" in document.name
    assert document.configuration["result_origin"] == "PLANNING_CHECKLIST"
    assert "Statutory Declaration" not in document.name
