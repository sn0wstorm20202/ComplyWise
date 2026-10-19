"""Dashboard reads must not fetch government portals behind the user's request."""
from unittest.mock import patch

import pytest
from apps.dashboard.services import get_dashboard_summary
from apps.knowledge.models import RuleVersion
from tests.test_knowledge_review_connections import candidate_fixture, review_payload


@pytest.mark.django_db
def test_dashboard_is_offline_even_outside_the_test_runtime(make_business, user, api_client, settings):
    business, assessment, candidate = candidate_fixture(make_business, user)
    user.is_staff = True; user.save(); api_client.force_authenticate(user)
    response = api_client.post(f"/api/v1/admin/knowledge/{candidate.pk}/review", review_payload(), format="json")
    assert response.status_code == 200
    definition = RuleVersion.objects.get(rule_id="fixture-rule").requirement
    definition.metadata = {**definition.metadata, "portal": "https://dgca.gov.in/"}
    definition.save()
    settings.RUNNING_TESTS = False
    with patch("apps.acquisition.services.AcquisitionRouter.acquire", side_effect=AssertionError("Read attempted network")) as acquire:
        summary = get_dashboard_summary(business, str(assessment.pk))
    assert summary["has_evaluation"] is True
    assert summary["priority_actions"]
    acquire.assert_not_called()
