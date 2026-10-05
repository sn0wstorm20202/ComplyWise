"""Regressions for observed runtime intake aliases and assessment isolation."""
import json
from unittest.mock import Mock, patch
import pytest
from apps.businesses.models import Assessment, BusinessProfileVersion
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan
from apps.onboarding.planner import plan_adaptive_smart_questions
from apps.onboarding.services import save_smart_question_answers
from domain.context.business_context import build_business_context
from domain.providers.base import CompletionResult

pytestmark = pytest.mark.django_db

def profile(business, version=1, **facts):
    return BusinessProfileVersion.objects.create(business=business, version=version,
        variables={k:{"value":v,"origin":"USER_PROVIDED"} for k,v in facts.items()})

def test_planner_context_has_same_known_aliases_as_engine(make_business, user):
    b=make_business(user)
    profile(b,product_description="Software consultancy",total_worker_count=0,state="KARNATAKA")
    ctx=build_business_context(b)
    assert ctx.raw_variables["total_workforce"] == 0
    assert ctx.raw_variables["primary_activity"] == "Software consultancy"
    assert ctx.raw_variables["jurisdiction_state"] == "KARNATAKA"

def test_planner_uses_requested_snapshot_and_suppresses_reworded_known_facts(make_business,user):
    b=make_business(user)
    first=profile(b,product_description="Software consultancy",total_worker_count=12,connected_power_load=5,
                  hazardous_waste_generation=False,state="KARNATAKA")
    a=Assessment.objects.create(business=b,profile_version=first)
    profile(b,2,product_description="Unrelated metal factory",state="MAHARASHTRA")
    provider=Mock(is_configured=True)
    provider.complete.return_value=CompletionResult(json.dumps({"questions":[
        {"target_variable_id":"dynamic_number_of_workers","question_text":"How many workers do you have?","answer_type":"NUMBER","reason":"Workforce decisions"},
        {"target_variable_id":"primary_activity","question_text":"What is your primary activity?","answer_type":"TEXT","reason":"Activity decisions"},
        {"target_variable_id":"dynamic_client_data","question_text":"Do you process personal client data?","answer_type":"BOOLEAN","reason":"Refines privacy source discovery","domain":"DIGITAL_SAAS"}
    ]}),"fixture","fixture")
    with patch("apps.onboarding.planner.get_llm_provider",return_value=provider):
        result=plan_adaptive_smart_questions(b,assessment_id=a.id)
    assert not {"primary_activity","total_worker_count","dynamic_number_of_workers"} & {q["variable_key"] for q in result["questions"]}
    assert result["context_summary"]["product_description"] == "Software consultancy"
    assert result["questions"][0]["already_known"] is False
    assert result["questions"][0]["reason_code"] == "SOURCE_DISCOVERY_GAP"

def test_answers_do_not_mark_other_assessment_questions_or_merge_newer_snapshot(make_business,user):
    b=make_business(user)
    first=profile(b,product_description="First office",state="KARNATAKA")
    a=Assessment.objects.create(business=b,profile_version=first)
    second=profile(b,2,product_description="Second factory",state="MAHARASHTRA")
    other=Assessment.objects.create(business=b,assessment_number=2,profile_version=second)
    instances=[]
    for ass in (a,other):
        plan=SmartQuestionPlan.objects.create(business=b,assessment=ass)
        instances.append(SmartQuestionInstance.objects.create(business=b,plan=plan,variable_key="dynamic_client_data",question_text="Client data?"))
    saved=save_smart_question_answers(business=b,assessment_id=a.id,answers={"dynamic_client_data":False})
    assert saved.raw_value("product_description") == "First office"
    instances[1].refresh_from_db()
    assert instances[1].is_answered is False

def test_wrong_assessment_does_not_silently_plan_latest(make_business,user):
    b=make_business(user); other=make_business(user)
    a=Assessment.objects.create(business=other)
    with pytest.raises(ValueError,match="Assessment"):
        plan_adaptive_smart_questions(b,assessment_id=a.id)

def test_suggestion_is_editable_not_a_known_fact():
    from apps.onboarding.question_policy import normalize_candidate
    question={"variable_key":"dynamic_food_prepared_on_site","question_text":"Is food prepared on-site?","answer_type":"BOOLEAN","reason":"Operational source discovery"}
    item=normalize_candidate(question,{},suggestions={"dynamic_food_prepared_on_site":True})
    assert item["already_known"] is False and item["suggested_answer"] is True
    assert item["suggested_answer_origin"] == "STARTER_PROFILE"
    assert normalize_candidate(question,{"dynamic_food_prepared_on_site":False}) is None

def test_cooking_oil_question_cannot_become_hazardous_waste_fact():
    from apps.onboarding.question_policy import normalize_candidate
    item=normalize_candidate({"variable_key":"hazardous_waste_generation","question_text":"Do you generate used cooking oil for disposal?","answer_type":"BOOLEAN"},{})
    assert item["fact_key"] == "dynamic_waste_handling"

def test_all_orchestration_stages_use_requested_snapshot(make_business,user):
    from domain.intelligence.orchestration import OrchestrationContext
    b=make_business(user)
    first=profile(b,product_description="First software office",state="KARNATAKA",total_worker_count=12)
    a=Assessment.objects.create(business=b,profile_version=first)
    profile(b,2,product_description="Second factory",state="MAHARASHTRA",total_worker_count=99)
    context=OrchestrationContext.from_business(b,assessment=a)
    assert context.raw_business_description == "First software office"
    assert context.geography["state"] == "KARNATAKA"
    assert context.operational_facts["total_worker_count"] == 12

def test_emergency_understanding_does_not_invent_location_or_industrial_obligations():
    from domain.intelligence.orchestration import OrchestrationContext
    from domain.intelligence.business_understanding import generate_emergency_business_understanding
    context=OrchestrationContext(business_id="synthetic",business_name="Software office",raw_business_description="Software consultancy",operational_facts={"total_worker_count":12,"connected_power_load":None})
    result=generate_emergency_business_understanding(context)
    assert result.geography["state"] == "Not specified"
    assert result.geography["district"] == "Not specified"
    assert not any("applicable" in item.lower() for item in result.operational_characteristics)
    assert not any("Factories" in item for item in result.likely_regulatory_domains)
    assert result.normalized_facts[0]["source"] == "LOCAL_DESCRIPTION_HEURISTIC"

def test_non_manufacturing_search_preserves_negative_qualifiers(make_business,user):
    from apps.ingestion.query_planner import RegulatoryQueryPlanner
    b=make_business(user)
    profile(b,product_description="Software consultancy. No physical manufacturing.",state="KARNATAKA")
    context=build_business_context(b)
    assert context.is_manufacturing is False
    queries=RegulatoryQueryPlanner.plan_queries(context)
    assert queries and not any("factory licence" in q or "Quality Control Order" in q or "consent to establish" in q for q in queries)
    from apps.ingestion.query_planner import _clean_keywords
    assert "non-hazardous" in _clean_keywords("Warehouse storing non-hazardous packaged household goods")

def test_malformed_gemini_metadata_uses_next_slot():
    from domain.providers.gemini_provider import GeminiProvider,reset_pool_state
    from django.test import override_settings
    from domain.providers.base import ChatMessage
    reset_pool_state()

    bad={"candidates":[{"content":{"parts":[{"text":"{}"}]}}],"usageMetadata":[1]}
    good={"candidates":[{"content":{"parts":[{"text":"{}"}]}}]}
    with override_settings(GEMINI_API_KEY="synthetic-one",GEMINI_API_KEYS=["synthetic-two"],GEMINI_MODEL="synthetic"),patch("domain.providers.gemini_provider.post_json",side_effect=[bad,good]) as request:
        assert GeminiProvider().complete([ChatMessage("user","synthetic")]).text == "{}"
        assert request.call_count == 2
    reset_pool_state()

def test_connected_power_has_one_canonical_unit():
    from apps.onboarding.question_policy import normalize_candidate
    question=normalize_candidate({"variable_key":"connected_power_load","question_text":"Power in kW or HP?","answer_type":"DECIMAL","reason":"Electrical decisions"},{})
    assert question["unit"] == "HP"
    assert "kW" not in question["question_text"]
    assert question["question_text"].endswith("in HP?")

def test_workspace_resolution_is_idempotent_with_one_record(user):
    from apps.businesses.models import UserWorkspaceState
    first,_=UserWorkspaceState.resolve_for_user(user)
    second,_=UserWorkspaceState.resolve_for_user(user)
    assert first.pk == second.pk
    assert UserWorkspaceState.objects.filter(user=user).count() == 1
