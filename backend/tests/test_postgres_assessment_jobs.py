"""Real PostgreSQL concurrency checks; SQLite cannot establish these guarantees."""
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, Lock
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.db import connection, close_old_connections
from apps.businesses.models import Assessment, BusinessProfileVersion
from apps.businesses.jobs import enqueue, claim_next, process_next

pytestmark = pytest.mark.django_db(transaction=True)


def parallel(function):
    barrier = Barrier(2)
    def worker():
        close_old_connections()
        try:
            barrier.wait(timeout=10)
            return function()
        finally:
            connection.close()
    with ThreadPoolExecutor(max_workers=2) as executor:
        return list(executor.map(lambda _:worker(), range(2)))


def test_two_workers_claim_distinct_jobs(business, user):
    if connection.vendor != "postgresql":
        pytest.skip("Requires PostgreSQL SELECT FOR UPDATE SKIP LOCKED.")
    profile = BusinessProfileVersion.objects.create(business=business, version=1, variables={})
    assessments = [Assessment.objects.create(business=business, created_by=user, profile_version=profile, assessment_number=i+1) for i in range(2)]
    jobs = [enqueue(assessment, user, "REGULATORY_DISCOVERY") for assessment in assessments]
    claims = parallel(claim_next)
    assert {claim[0] for claim in claims} == {job.id for job in jobs}
    assert all(claim[1] == 1 for claim in claims)


def test_two_workers_commit_a_single_job_once(business, user):
    if connection.vendor != "postgresql":
        pytest.skip("Requires PostgreSQL row locks.")
    profile = BusinessProfileVersion.objects.create(business=business, version=1, variables={})
    assessment = Assessment.objects.create(business=business, created_by=user, profile_version=profile)
    job = enqueue(assessment, user, "REGULATORY_DISCOVERY")
    calls = []; lock = Lock()
    def execute(run, stage):
        with lock:
            calls.append(run.run_id)
        return SimpleNamespace(status="COMPLETED", data={"saved":True})
    with patch("domain.intelligence.orchestration.assessment_orchestrator.execute_stage", side_effect=execute):
        results = parallel(process_next)
    job.refresh_from_db()
    assert len(calls) == 1 and results.count(True) == 1
    assert job.status == "SUCCEEDED" and job.attempts == 1
