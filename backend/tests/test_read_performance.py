from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, get_ident
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from common.read_scope import read_scope, scoped_projection


def test_scoped_reads_reuse_work_without_cross_business_or_mutable_data_leaks():
    calls = []

    @scoped_projection
    def projection(business, assessment_id=None):
        calls.append((business.pk, assessment_id))
        return {"rows": [len(calls)]}

    @read_scope
    def response():
        business = SimpleNamespace(pk="one")
        first = projection(business, "assessment")
        first["rows"].append("caller enrichment")
        second = projection(business, assessment_id="assessment")
        assert second["rows"][-1] != "caller enrichment"
        projection(SimpleNamespace(pk="two"), "assessment")
        projection(business, "other-assessment")
        return second

    assert response()["rows"] == [1]
    assert len(calls) == 3
    assert response()["rows"] == [4]
    assert len(calls) == 6


def test_read_scope_is_cleared_after_errors_and_isolated_between_threads():
    barrier = Barrier(2)

    @scoped_projection
    def projection(identifier):
        return get_ident()

    @read_scope
    def response():
        identity = projection("same-key")
        barrier.wait(timeout=5)
        assert projection("same-key") == identity == get_ident()
        return identity

    with ThreadPoolExecutor(max_workers=2) as pool:
        identities = list(pool.map(lambda _: response(), range(2)))
    assert identities[0] != identities[1]

    @read_scope
    def failing():
        projection("same-key")
        raise RuntimeError("Synthetic read failure")

    with pytest.raises(RuntimeError):
        failing()
    assert projection("same-key") == get_ident()


@pytest.mark.django_db
def test_scheme_version_queries_are_bounded_as_catalogue_grows(business):
    from apps.schemes.models import Scheme, SchemeVersion
    from apps.schemes.engine.matcher import match_business_schemes
    from domain.context.business_context import build_business_context
    context = build_business_context(business)
    versions = []
    for index in range(40):
        scheme = Scheme.objects.create(scheme_code=f"SYNTHETIC-{index}", title="Synthetic support area",
            authority="Synthetic authority", source_url="https://example.test/source", source_domain="example.test")
        versions.append(SchemeVersion.objects.create(scheme=scheme, version_number=1,
            content_hash=f"{index:064d}", title="Synthetic version", summary="Synthetic test record"))
    selected = []
    with patch("apps.schemes.engine.matcher.is_authored_fixture_version", side_effect=lambda version: selected.append(version.pk) or True):
        with CaptureQueriesContext(connection) as queries:
            result = match_business_schemes(business, context=context)
    assert set(selected) == {version.pk for version in versions}
    assert result["excluded_unreviewed_count"] == 40
    version_queries = [query for query in queries if 'FROM "schemes_schemeversion"' in query["sql"]]
    assert len(version_queries) == 1
    assert len(queries) <= 5


@pytest.mark.django_db
def test_scheme_current_version_precedes_newer_versions_and_inactive_falls_back(business):
    from apps.schemes.models import Scheme, SchemeVersion
    from apps.schemes.engine.matcher import match_business_schemes
    from domain.context.business_context import build_business_context
    scheme = Scheme.objects.create(scheme_code="SYNTHETIC", title="Synthetic support area",
        authority="Synthetic authority", source_url="https://example.test/source", source_domain="example.test")
    for number, active in [(1, True), (2, False), (3, True)]:
        SchemeVersion.objects.create(scheme=scheme, version_number=number, is_active=active,
            content_hash=f"{number:064d}", title="Synthetic version", summary="Synthetic test record")
    context = build_business_context(business)
    seen = []
    with patch("apps.schemes.engine.matcher.is_authored_fixture_version", side_effect=lambda version: seen.append(version.version_number) or True):
        match_business_schemes(business, context=context)
        scheme.current_version_number = 2
        scheme.save(update_fields=["current_version_number"])
        match_business_schemes(business, context=context)
    assert seen == [1, 3]
