"""Workflow progress belongs to an assessment even when profiles are reused."""

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Assessment, BusinessProfileVersion
from apps.knowledge.models import RequirementDefinition
from apps.workflows.models import ComplianceCase, WorkflowEvent

pytestmark = pytest.mark.django_db


@pytest.fixture
def shared_profile_workflows(make_business, user):
    business = make_business(user, name="Synthetic workflow isolation business")
    profile = BusinessProfileVersion.objects.create(
        business=business, version=1,
        variables={"state": {"value": "MAHARASHTRA", "origin": "USER_PROVIDED"}},
    )
    requirement = RequirementDefinition.objects.create(
        requirement_id="TEST-WORKFLOW-ISOLATION", name="Synthetic review process",
        category="COMPLIANCE", authority="Synthetic authority", jurisdiction="CENTRAL",
        domain="TEST", status="PUBLISHED",
    )
    assessments = []
    cases = []
    opened_at = timezone.now() - timedelta(days=1)
    for number in (1, 2):
        assessment = Assessment.objects.create(
            business=business, profile_version=profile, assessment_number=number,
        )
        decision_run = DecisionRun.objects.create(
            business=business, profile_version=profile, assessment=assessment, status="COMPLETED",
        )
        assessment.decision_run = decision_run
        assessment.save(update_fields=["decision_run"])
        DecisionResult.objects.create(
            decision_run=decision_run, requirement_id=requirement.requirement_id,
            requirement_name=requirement.name, status="APPLICABLE",
        )
        case = ComplianceCase.objects.create(
            business=business, assessment=assessment, profile_version=profile,
            requirement=requirement, requirement_id_code=requirement.requirement_id,
            case_number=f"TEST-ISOLATION-{number}", opened_at=opened_at + timedelta(hours=number),
        )
        assessments.append(assessment)
        cases.append(case)
    return business, requirement, assessments, cases


def test_workflow_read_does_not_borrow_other_assessment_progress(
    shared_profile_workflows, auth_client,
):
    business, requirement, assessments, cases = shared_profile_workflows
    cases[0].metadata = {"workflow_state": {"steps": {"1": {
        "status": "COMPLETED", "user_reference": "Only the first assessment",
        "notes": "Saved against the first assessment snapshot",
    }}}}
    cases[0].save(update_fields=["metadata"])

    def load(assessment):
        response = auth_client.get(
            f"/api/v1/businesses/{business.id}/workflows?assessment_id={assessment.id}"
        )
        assert response.status_code == 200, response.data
        return next(workflow for workflow in response.data["data"]["workflows"]
                    if workflow["requirement_id"] == requirement.requirement_id)

    first = load(assessments[0])
    second = load(assessments[1])
    assert first["case_id"] == str(cases[0].id)
    assert first["steps"][0]["status"] == "COMPLETED"
    assert first["steps"][0]["user_reference"] == "Only the first assessment"
    assert second["case_id"] == str(cases[1].id)
    assert second["progress_percent"] == 0
    assert second["steps"][0]["status"] == "READY"
    assert second["steps"][0].get("user_reference") != "Only the first assessment"
    assert second["steps"][0].get("notes") != "Saved against the first assessment snapshot"


def test_workflow_step_write_targets_selected_assessment_case(
    shared_profile_workflows, auth_client,
):
    business, requirement, assessments, cases = shared_profile_workflows
    response = auth_client.post(
        f"/api/v1/businesses/{business.id}/workflows/step",
        {"workflow_id": f"WF::{requirement.requirement_id}",
         "assessment_id": str(assessments[0].id), "step_number": 1,
         "status": "COMPLETED", "user_reference": "Only the selected assessment"},
        format="json",
    )
    assert response.status_code == 200, response.data
    assert response.data["data"]["case_number"] == cases[0].case_number
    for case in cases:
        case.refresh_from_db()
    assert cases[0].metadata["workflow_state"]["steps"]["1"]["status"] == "COMPLETED"
    assert cases[0].metadata["workflow_state"]["steps"]["1"]["user_reference"] == "Only the selected assessment"
    assert "workflow_state" not in cases[1].metadata
    assert WorkflowEvent.objects.filter(compliance_case=cases[0]).count() == 1
    assert not WorkflowEvent.objects.filter(compliance_case=cases[1]).exists()


def test_legacy_narrative_standard_cannot_create_actionable_workflow(
    shared_profile_workflows, auth_client,
):
    business, requirement, assessments, _ = shared_profile_workflows
    requirement.category = "STANDARD"
    requirement.save(update_fields=["category"])
    # Historical APPLICABLE is not sufficient when no typed product scope was
    # recorded. Read paths must not silently make this claim actionable again.
    response = auth_client.get(
        f"/api/v1/businesses/{business.id}/workflows?assessment_id={assessments[0].id}"
    )
    assert response.status_code == 200, response.data
    assert not any(workflow["requirement_id"] == requirement.requirement_id
                   for workflow in response.data["data"]["workflows"])
    assert DecisionResult.objects.filter(requirement_id=requirement.requirement_id,
                                         status="APPLICABLE").count() == 2
