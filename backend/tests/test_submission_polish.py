import io
import json
import socket
import urllib.error
from unittest.mock import Mock, patch

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.ingestion import search_provider
from apps.businesses.models import Business, BusinessProfileVersion
from apps.ingestion.claim_extraction import _validate_claim_output
from domain.acquisition.base import AcquisitionError
from domain.acquisition.crawlee_provider import normalize_capture, validate_destination
from domain.intelligence.output_safety import validate_workspace_shape, validate_question_plan
from domain.providers.base import ProviderError


@pytest.fixture(autouse=True)
def reset_search():
    search_provider._unavailable_until = 0
    yield
    search_provider._unavailable_until = 0


@override_settings(SERPAPI_API_KEY="synthetic-serp-key")
def test_search_contract_does_not_treat_snippets_as_capture():
    response = Mock()
    response.read.return_value = json.dumps({"search_metadata": {"id": "fixture-search"}, "organic_results": [
        {"link": "https://bis.gov.in/fixture", "title": "Fixture", "snippet": "Synthetic snippet"}]}).encode()
    response.__enter__ = Mock(return_value=response); response.__exit__ = Mock(return_value=False)
    with patch("urllib.request.urlopen", return_value=response):
        rows = search_provider.search("synthetic query")
    assert rows[0]["acquisition_mode"] == "SEARCH_API"
    assert "markdown" not in rows[0] and "text_content" not in rows[0]


@pytest.mark.parametrize("status,kind", [(401,"authentication"),(429,"rate_limit"),(503,"provider_unavailable")])
@override_settings(SERPAPI_API_KEY="synthetic-serp-key")
def test_search_failure_is_classified_and_redacted(status, kind):
    error = urllib.error.HTTPError("https://provider.invalid?api_key=synthetic-secret", status, "failed", {}, io.BytesIO(b"private vendor body"))
    with patch("urllib.request.urlopen", side_effect=error) as network:
        with pytest.raises(ProviderError) as caught: search_provider.search("private business query")
    assert caught.value.failure_type == kind and network.call_count == 1
    assert "secret" not in str(caught.value) and "private" not in str(caught.value)


@override_settings(SERPAPI_API_KEY="synthetic-serp-key")
def test_search_malformed_metadata_is_controlled_provider_failure():
    response = Mock()
    response.read.return_value = b'{"organic_results":[],"search_metadata":[1]}'
    response.__enter__ = Mock(return_value=response)
    response.__exit__ = Mock(return_value=False)
    with patch("urllib.request.urlopen", return_value=response):
        with pytest.raises(ProviderError) as caught:
            search_provider.search("synthetic query")
    assert caught.value.failure_type == "malformed_response"


@pytest.mark.parametrize("url", ["http://127.0.0.1", "https://example.com", "https://bis.gov.in:8443", "https://user:pass@bis.gov.in"])
def test_unsafe_source_rejected_before_network(url):
    with patch("socket.getaddrinfo") as dns, pytest.raises(AcquisitionError): validate_destination(url)
    dns.assert_not_called()


def test_official_host_resolving_to_private_address_is_rejected():
    with patch("socket.getaddrinfo", return_value=[(socket.AF_INET,0,0,"",("10.0.0.1",443))]), pytest.raises(AcquisitionError):
        validate_destination("https://bis.gov.in")


@pytest.mark.parametrize("body,mime", [(b"<title>Login</title>Sign in to proceed", "text/html"),
    (b"<title>Just a moment</title>" + b"CAPTCHA "*100, "text/html"), (b"<div id='root'></div>", "text/html"),
    (b"error"*30, "application/json"), (b"%PDF truncated", "application/pdf")])
def test_unusable_capture_is_not_evidence(body, mime):
    with pytest.raises(AcquisitionError): normalize_capture("https://bis.gov.in", "https://bis.gov.in", body, mime, 200, mode="CRAWLEE_HTTP")


def test_capture_identity_includes_raw_and_normalized_hashes():
    result = normalize_capture("https://bis.gov.in/fixture", "https://bis.gov.in/fixture", b"<title>Synthetic fixture</title><main>"+b"Synthetic source passage. "*20+b"</main>", "text/html", 200, mode="CRAWLEE_HTTP")
    assert result.crawl_metadata["raw_content_hash"] != result.content_hash
    assert result.acquisition_tier == "HTTP" and result.acquisition_engine == "CRAWLEE_HTTP"


@pytest.mark.django_db
def test_admin_creation_is_atomic_and_platform_scoped(make_user):
    admin = make_user(email="platform@example.com", is_superuser=True, is_staff=True)
    owner = make_user(email="owner@example.com")
    client = APIClient(); client.force_authenticate(owner)
    payload = {"name": "Synthetic starting profile", "owner_email": owner.email,
        "profile": {"variables": {"state": {"value": "KARNATAKA"}, "product_description": {"value": "Synthetic retail operation"}}}}
    assert client.post("/api/v1/admin/businesses/create", payload, format="json").status_code == 403
    client.force_authenticate(admin)
    response = client.post("/api/v1/admin/businesses/create", payload, format="json")
    assert response.status_code == 201, response.data
    business = Business.objects.get(pk=response.data["data"]["id"])
    assert business.owner == owner and business.memberships.filter(user=owner).exists()
    assert business.current_profile.raw_value("state") == "KARNATAKA"
    assert not business.assessments.exists()
    initial = Business.objects.count()
    payload["profile"]["variables"] = {"unknown-made-up-key": {"value": 1}}
    assert client.post("/api/v1/admin/businesses/create", payload, format="json").status_code == 400
    assert Business.objects.count() == initial


@pytest.mark.django_db
def test_admin_new_user_does_not_receive_privileges_or_token(make_user):
    admin = make_user(is_superuser=True, is_staff=True)
    client = APIClient(); client.force_authenticate(admin)
    data = {"name": "Synthetic business", "owner_email": "new-owner@example.com",
        "new_user": {"email": "new-owner@example.com", "password": "Synthetic-Manual-Password-2048"},
        "profile": {"variables": {"state": {"value": "KARNATAKA"}}}}
    response = client.post("/api/v1/admin/businesses/create", data, format="json")
    assert response.status_code == 201, response.data
    owner = Business.objects.get(pk=response.data["data"]["id"]).owner
    from rest_framework.authtoken.models import Token
    assert not owner.is_staff and not owner.is_superuser and not Token.objects.filter(user=owner).exists()
    assert "token" not in response.data["data"]
    duplicate = client.post("/api/v1/admin/businesses/create", data, format="json")
    assert duplicate.status_code == 400
    assert "The user already exists. Please sign in." in str(duplicate.data)


def test_guidance_rejects_fabricated_sources_and_rule_identity():
    base = {"compliance_items": [{"key": "x", "title": "Review activity", "why_it_may_apply": "Supplied activity"}]}
    validate_workspace_shape(base, "Supplied activity")
    for field,value in [("source_reference","https://fake.gov.in/rule"),("rule_id","RULE-FAKE"),("description","Submit form 999 within 7 days")]:
        candidate = json.loads(json.dumps(base)); candidate["compliance_items"][0][field] = value
        with pytest.raises(ValueError): validate_workspace_shape(candidate, "Supplied activity")


def test_claim_rejects_invented_quote_or_deadline():
    source = "Synthetic requirement has no statutory deadline."
    _validate_claim_output(json.dumps({"claims": [{"requirement_name":"Fixture", "excerpt":source}]}), source)
    with pytest.raises(ValueError): _validate_claim_output(json.dumps({"claims": [{"requirement_name":"Fixture", "excerpt":source, "deadline_info":"7 days"}]}), source)
    with pytest.raises(ValueError): validate_question_plan('{"questions":[{},{}]}')


def test_msme_classification_does_not_replace_missing_facts_with_zero():
    from decimal import Decimal
    from datetime import date
    from domain.context.business_context import derive_msme_scale
    assert derive_msme_scale(None, Decimal("1000")) == "UNKNOWN"
    assert derive_msme_scale(Decimal("1000"), None) == "UNKNOWN"
    assert derive_msme_scale(Decimal("25000000"), Decimal("100000000")) == "MICRO"
    assert derive_msme_scale(Decimal("25000001"), Decimal("100000000")) == "SMALL"
    assert derive_msme_scale(Decimal("25000000"), Decimal("100000000"), as_of=date(2024,1,1)) == "SMALL"


@pytest.mark.django_db
def test_onboarding_orchestration_reuses_existing_assessment_and_preserves_server_state(make_business, user, auth_client):
    from apps.businesses.models import Assessment
    from domain.intelligence.orchestration import assessment_orchestrator
    business = make_business(user)
    first = Assessment.objects.create(business=business, created_by=user, status="IN_PROGRESS", step_state={"products":{"description":"Synthetic activity"}})
    run = assessment_orchestrator.create_run(business, user=user)
    assert run.run_id == str(first.id) and business.assessments.count() == 1
    first.refresh_from_db()
    first.step_state["stage_metadata"] = {"business_understanding":{"primary_activity":"Supplied activity"}}
    first.save()
    from apps.businesses.serializers import AssessmentSerializer
    serializer = AssessmentSerializer(first, data={"step_state":{"products":{"description":"Edited activity"}, "stage_metadata":{}}}, partial=True)
    assert serializer.is_valid(), serializer.errors
    serializer.save(); first.refresh_from_db()
    assert first.step_state["stage_metadata"]["business_understanding"]["primary_activity"] == "Supplied activity"


def test_retrieved_context_is_bounded_without_changing_original_capture():
    import json
    from domain.intelligence.workspace_guidance import compact_context
    source={"source_url":"https://bis.gov.in/fixture", "text_content":"Synthetic source text. "*10000}
    result=compact_context({"sources":[source]*10})
    assert len(json.dumps(result)) < 14000
    assert result["bounded_excerpt_context"] is True
    assert result["sources"][0]["source_url"] == source["source_url"]
    assert len(source["text_content"]) > 100000
