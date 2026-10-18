"""Stable requirement locks serialize independent reviewers on PostgreSQL."""
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from django.db import connection, close_old_connections
from rest_framework.test import APIClient

from apps.knowledge.models import RequirementRevision, RuleVersion
from tests.test_knowledge_review_connections import candidate_fixture, review_payload


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize("existing", [False, True])
def test_concurrent_reviewers_allocate_unique_releases(make_business, user, existing):
    if connection.vendor != "postgresql":
        pytest.skip("Requires PostgreSQL row locks and concurrent transactions.")
    _, _, candidate = candidate_fixture(make_business, user)
    user.is_staff = True; user.save()
    client = APIClient(); client.force_authenticate(user)
    if existing:
        response = client.post(f"/api/v1/admin/knowledge/{candidate.id}/review", review_payload(), format="json")
        assert response.status_code == 200, response.data
    candidates = []
    for _ in range(2):
        candidate.pk = None; candidate.verification_status = "UNVERIFIED"; candidate.save()
        candidates.append(candidate.pk)
    barrier = Barrier(2)
    def publish(candidate_id):
        close_old_connections()
        try:
            reviewer = APIClient(); reviewer.force_authenticate(user)
            barrier.wait(timeout=10)
            return reviewer.post(f"/api/v1/admin/knowledge/{candidate_id}/review", review_payload(), format="json").status_code
        finally:
            connection.close()
    with ThreadPoolExecutor(max_workers=2) as executor:
        outcomes = list(executor.map(publish, candidates))
    assert outcomes == [200, 200]
    expected = list(range(1, 4 if existing else 3))
    assert sorted(RequirementRevision.objects.values_list("version", flat=True)) == expected
    assert sorted(RuleVersion.objects.filter(rule_id="fixture-rule").values_list("version", flat=True)) == expected
