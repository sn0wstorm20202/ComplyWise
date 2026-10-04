"""Tests for Central & Maharashtra Government Schemes Pipeline.

Validates:
1. Ingestion of official portals: Central MSME, Champions, DPIIT, and Maharashtra MCED.
2. Cryptographic snapshot hashing and idempotency.
3. Versioning and immutable records (version increments, diff summaries).
4. Rollback functionality and audit logging.
5. Business Context-driven matching (Maharashtra vs Non-Maharashtra, sector filters, MSME scale).
6. REST API endpoints (business schemes, catalog, pipeline status, version history, rollback).
"""

from __future__ import annotations

import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from apps.businesses.models import Business, BusinessProfileVersion
from apps.schemes.models import Scheme, SchemeRollbackLog, SchemeSourceSnapshot, SchemeVersion
from apps.schemes.pipeline.service import SchemePipelineService
from apps.schemes.engine.matcher import match_business_schemes
from domain.context.business_context import build_business_context

User = get_user_model()


@pytest.fixture(autouse=True)
def recorded_portal_content(monkeypatch):
    """Parser/version tests use explicit fixture HTML, never a live/offline production fallback."""
    from apps.schemes.pipeline.fetcher import SchemePortalFetcher, SNAPSHOT_FALLBACK_MAP
    original = SchemePortalFetcher.fetch
    def fetch(self, config, simulate_changed_content=None):
        return original(self, config, simulate_changed_content=(simulate_changed_content
            if simulate_changed_content is not None else SNAPSHOT_FALLBACK_MAP[config.key]))
    monkeypatch.setattr(SchemePortalFetcher, "fetch", fetch)


@pytest.fixture
def api_client():
    return APIClient()


from common.enums import VariableOrigin

@pytest.fixture
def mh_food_business(make_business, user):
    """Manufacturing MSME located in Maharashtra (Pune)."""
    biz = make_business(owner=user, name="Sahyadri Agro & Food Processing LLP")
    variables = {
        "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
        "district": {"value": "Pune", "origin": VariableOrigin.USER_PROVIDED},
        "product_description": {
            "value": "Processing of dehydrated fruits, millets, spices, and packaged snacks.",
            "origin": VariableOrigin.USER_PROVIDED,
        },
        "annual_turnover": {"value": 25000000, "origin": VariableOrigin.USER_PROVIDED},
        "plant_machinery_investment": {"value": 8000000, "origin": VariableOrigin.USER_PROVIDED},
        "total_worker_count": {"value": 18, "origin": VariableOrigin.USER_PROVIDED},
        "connected_power_load": {"value": 45.0, "origin": VariableOrigin.USER_PROVIDED},
    }
    BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables=variables,
        created_by=user,
    )
    return biz


@pytest.fixture
def gujarat_eng_business(make_business, user):
    """Small precision engineering enterprise in Gujarat (Surat)."""
    biz = make_business(owner=user, name="Gujarat Precision Gears Pvt Ltd")
    variables = {
        "state": {"value": "GUJARAT", "origin": VariableOrigin.USER_PROVIDED},
        "district": {"value": "Surat", "origin": VariableOrigin.USER_PROVIDED},
        "product_description": {
            "value": "CNC precision machining, gearboxes, automotive components, and metal fabrication.",
            "origin": VariableOrigin.USER_PROVIDED,
        },
        "annual_turnover": {"value": 120000000, "origin": VariableOrigin.USER_PROVIDED},
        "plant_machinery_investment": {"value": 35000000, "origin": VariableOrigin.USER_PROVIDED},
        "total_worker_count": {"value": 42, "origin": VariableOrigin.USER_PROVIDED},
        "connected_power_load": {"value": 120.0, "origin": VariableOrigin.USER_PROVIDED},
    }
    BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables=variables,
        created_by=user,
    )
    return biz


@pytest.mark.django_db
def test_pipeline_ingestion_and_snapshot_creation():
    """Verify that running the pipeline ingests Central and Maharashtra schemes."""
    service = SchemePipelineService()
    result = service.run_pipeline(force=True)

    assert result["total_new_schemes"] >= 10
    assert Scheme.objects.count() >= 10
    assert SchemeVersion.objects.count() >= 10

    # Verify Maharashtra specific schemes are created
    mh_schemes = Scheme.objects.filter(jurisdiction="MH")
    assert mh_schemes.count() >= 5
    assert mh_schemes.filter(scheme_code="SCHEME-MH-PSI-2019").exists()
    assert mh_schemes.filter(scheme_code="SCHEME-MH-ELECTRICITY-DUTY").exists()

    # Verify Central schemes are created
    central_schemes = Scheme.objects.filter(jurisdiction="CENTRAL")
    assert central_schemes.count() >= 4
    assert central_schemes.filter(scheme_code="SCHEME-CGTMSE").exists()
    assert central_schemes.filter(scheme_code="SCHEME-ZED-CERTIFICATION").exists()

    # Check snapshots
    assert SchemeSourceSnapshot.objects.filter(status="SUCCESS").count() >= 2


@pytest.mark.django_db
def test_pipeline_hash_unchanged_idempotency():
    """Verify that a repeated run without changes marks sources as UNCHANGED."""
    service = SchemePipelineService()
    service.run_pipeline(force=True)
    initial_version_count = SchemeVersion.objects.count()

    # Second run without force
    result2 = service.run_pipeline(force=False)
    assert result2["total_updated_versions"] == 0
    assert SchemeVersion.objects.count() == initial_version_count


@pytest.mark.django_db
def test_pipeline_version_increment_on_content_change():
    """Simulate a revised guidelines notification and verify version increment and diff logging."""
    service = SchemePipelineService()
    service.run_pipeline(force=True)

    scheme = Scheme.objects.get(scheme_code="SCHEME-MH-PSI-2019")
    v1 = scheme.current_version
    assert v1.version_number == 1
    assert v1.is_active is True

    # Simulate updated HTML from Maharashtra portal with revised benefit ceiling
    simulated_html = f"""
    <div class="mced-item" data-code="SCHEME-MH-PSI-2019">
      <h2 class="mced-title">Maharashtra Package Scheme of Incentives (PSI 2024 Revised)</h2>
      <div class="mced-authority">Directorate of Industries, Government of Maharashtra</div>
      <div class="mced-jurisdiction">MH</div>
      <div class="mced-sectors">MANUFACTURING, PROCESSING, ENGINEERING, FOOD_PROCESSING, TEXTILE</div>
      <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
      <div class="mced-benefit-type">CAPITAL_SUBSIDY</div>
      <div class="mced-benefit-desc">Enhanced Industrial Promotion Subsidy up to 120% of Fixed Capital Investment for green manufacturing MSMEs over 12 years.</div>
      <div class="mced-eligibility">New or expanding MSMEs in Maharashtra with green industrial compliance.</div>
      <div class="mced-evidence">GR No. PSI-2024/REVISED/IND-8. Maximum incentive enhanced to 120% of FCI for zero-discharge units.</div>
      <div class="mced-route">Apply via MAITRI Single Window.</div>
      <a class="mced-url" href="https://maitri.mahaonline.gov.in">https://maitri.mahaonline.gov.in</a>
      <div class="mced-validity" data-from="2024-01-01" data-to="2034-12-31">Active (2024 - 2034)</div>
    </div>
    """

    res = service.run_pipeline(
        source_keys=["MAHARASHTRA_MCED"],
        force=True,
        simulate_payloads={"MAHARASHTRA_MCED": simulated_html},
    )

    scheme.refresh_from_db()
    assert scheme.current_version_number == 2
    v2 = scheme.current_version
    assert v2.version_number == 2
    assert v2.is_active is True
    assert "Enhanced Industrial Promotion Subsidy" in v2.benefit_summary

    # Verify v1 is now archived
    v1.refresh_from_db()
    assert v1.is_active is False

    # Check diff summary
    assert v2.diff_summary["has_changes"] is True
    assert "benefit_summary" in v2.diff_summary["changed_fields"]


@pytest.mark.django_db
def test_pipeline_rollback_safety():
    """Verify that an updated scheme can be safely rolled back to a previous version."""
    service = SchemePipelineService()
    service.run_pipeline(force=True)

    scheme = Scheme.objects.get(scheme_code="SCHEME-MH-PSI-2019")
    v1_title = scheme.title

    # Bump version
    simulated_html = f"""
    <div class="mced-item" data-code="SCHEME-MH-PSI-2019">
      <h2 class="mced-title">Maharashtra PSI Temporarily Altered</h2>
      <div class="mced-authority">Directorate of Industries, Maharashtra</div>
      <div class="mced-jurisdiction">MH</div>
      <div class="mced-sectors">MANUFACTURING</div>
      <div class="mced-scales">MICRO</div>
      <div class="mced-benefit-type">CAPITAL_SUBSIDY</div>
      <div class="mced-benefit-desc">Temporary subsidy text.</div>
      <div class="mced-eligibility">Temporary eligibility.</div>
      <a class="mced-url" href="https://maitri.mahaonline.gov.in">https://maitri.mahaonline.gov.in</a>
    </div>
    """
    service.run_pipeline(
        source_keys=["MAHARASHTRA_MCED"],
        force=True,
        simulate_payloads={"MAHARASHTRA_MCED": simulated_html},
    )

    scheme.refresh_from_db()
    assert scheme.current_version_number == 2

    # Perform Rollback to version 1
    rollback_res = service.rollback_scheme(scheme.scheme_code, target_version=1, reason="Accidental publication test")
    assert rollback_res["status"] == "ROLLBACK_SUCCESSFUL"
    assert rollback_res["from_version"] == 2
    assert rollback_res["to_version"] == 1

    scheme.refresh_from_db()
    assert scheme.current_version_number == 1
    assert scheme.title == v1_title

    # Verify version 1 is active, version 2 is inactive
    v1 = scheme.versions.get(version_number=1)
    v2 = scheme.versions.get(version_number=2)
    assert v1.is_active is True
    assert v2.is_active is False

    # Check audit log
    log = SchemeRollbackLog.objects.filter(scheme=scheme).first()
    assert log is not None
    assert log.from_version == 2
    assert log.to_version == 1
    assert log.reason == "Accidental publication test"


@pytest.mark.django_db
def test_maharashtra_business_context_matching(mh_food_business):
    """Verify that a Maharashtra food processing MSME matches Maharashtra schemes + Central schemes."""
    # Run pipeline first
    SchemePipelineService().run_pipeline(force=True)

    result = match_business_schemes(mh_food_business)
    assert result["available"] is True
    assert result["state"] == "MH"
    assert result["msme_scale"] == "MICRO"

    scheme_codes = [s["scheme_code"] for s in result["schemes"]]

    # Maharashtra schemes must be present
    assert "SCHEME-MH-PSI-2019" in scheme_codes
    assert "SCHEME-MH-INTEREST-SUBSIDY" in scheme_codes
    assert "SCHEME-MH-POWER-TARIFF" in scheme_codes
    assert "SCHEME-MH-ELECTRICITY-DUTY" in scheme_codes

    # Central schemes must be present
    assert "SCHEME-CGTMSE" in scheme_codes
    assert "SCHEME-PMEGP" in scheme_codes

    # Verify relevance rationale is populated and explains Maharashtra + Food Processing context
    psi_scheme = next(s for s in result["schemes"] if s["scheme_code"] == "SCHEME-MH-PSI-2019")
    assert "Maharashtra" in psi_scheme["relevance_rationale"]
    assert "qualifying for state industrial incentives" in psi_scheme["relevance_rationale"]
    assert psi_scheme["is_state_specific"] is True
    assert psi_scheme["last_verified_at"] is not None


@pytest.mark.django_db
def test_non_maharashtra_business_context_matching(gujarat_eng_business):
    """Verify that a Gujarat business matches Central schemes, but does NOT see Maharashtra schemes."""
    SchemePipelineService().run_pipeline(force=True)

    result = match_business_schemes(gujarat_eng_business)
    assert result["state"] == "GJ"
    assert result["msme_scale"] == "SMALL"

    scheme_codes = [s["scheme_code"] for s in result["schemes"]]

    # Central schemes must be present
    assert "SCHEME-CGTMSE" in scheme_codes
    assert "SCHEME-ZED-CERTIFICATION" in scheme_codes
    assert "SCHEME-DPIIT-BHAVYA" in scheme_codes  # Automotive precision machining in DPIIT

    # Maharashtra state schemes MUST NOT be present for Gujarat business
    assert "SCHEME-MH-PSI-2019" not in scheme_codes
    assert "SCHEME-MH-ELECTRICITY-DUTY" not in scheme_codes
    assert "SCHEME-MH-POWER-TARIFF" not in scheme_codes
    assert result["maharashtra_schemes_count"] == 0


@pytest.mark.django_db
def test_business_schemes_api_endpoint(api_client, user, mh_food_business):
    """Test GET /api/v1/businesses/{id}/schemes endpoint with authentication."""
    SchemePipelineService().run_pipeline(force=True)
    api_client.force_authenticate(user=user)

    url = reverse("api-v1:schemes:schemes-list", kwargs={"business_id": mh_food_business.id})
    response = api_client.get(url)

    assert response.status_code == 200
    res_json = response.json()
    assert "data" in res_json
    payload = res_json["data"]
    assert payload["business_name"] == mh_food_business.name
    assert payload["total_schemes_found"] > 0
    assert len(payload["schemes"]) > 0

    first_scheme = payload["schemes"][0]
    assert "title" in first_scheme
    assert "relevance_rationale" in first_scheme
    assert "effective_dates" in first_scheme
    assert "authority" in first_scheme


@pytest.mark.django_db
def test_schemes_catalog_api_endpoint(api_client):
    """Test GET /api/v1/schemes/catalog with filtering."""
    SchemePipelineService().run_pipeline(force=True)

    # 1. Full catalog
    response = api_client.get("/api/v1/schemes/catalog")
    assert response.status_code == 200
    catalog = response.json()["data"]
    assert catalog["count"] >= 10

    # 2. Filter by jurisdiction MH
    response_mh = api_client.get("/api/v1/schemes/catalog?jurisdiction=MH")
    catalog_mh = response_mh.json()["data"]
    assert all(s["jurisdiction_code"] == "MH" for s in catalog_mh["schemes"])
    assert catalog_mh["count"] >= 5

    # 3. Filter by Central
    response_central = api_client.get("/api/v1/schemes/catalog?jurisdiction=CENTRAL")
    catalog_central = response_central.json()["data"]
    assert all(s["jurisdiction_code"] == "CENTRAL" for s in catalog_central["schemes"])


@pytest.mark.django_db
def test_pipeline_status_and_version_history_api(api_client, user):
    """Test pipeline status and scheme version history endpoints."""
    SchemePipelineService().run_pipeline(force=True)

    # Operational pipeline metadata is restricted to a reviewer.
    assert api_client.get("/api/v1/schemes/pipeline/status").status_code == 401
    user.is_staff = True
    user.save()
    api_client.force_authenticate(user=user)
    # Status endpoint
    resp_status = api_client.get("/api/v1/schemes/pipeline/status")
    assert resp_status.status_code == 200
    status_data = resp_status.json()["data"]
    assert status_data["total_schemes"] >= 10
    assert status_data["maharashtra_schemes_count"] >= 5
    assert status_data["central_schemes_count"] >= 4
    assert len(status_data["registered_sources"]) == 4

    # Version history endpoint for SCHEME-CGTMSE
    resp_history = api_client.get("/api/v1/schemes/SCHEME-CGTMSE/versions")
    assert resp_history.status_code == 200
    hist_data = resp_history.json()["data"]
    assert hist_data["scheme_code"] == "SCHEME-CGTMSE"
    assert hist_data["versions_count"] >= 1
    assert "content_hash" in hist_data["versions"][0]
