"""Synthetic source/scope fixtures prove trust boundaries, not legal coverage."""
from datetime import date, timedelta
from unittest.mock import Mock

import pytest

from apps.businesses.models import Assessment, BusinessProfileVersion
from apps.evidence.models import Evidence, Source
from apps.evidence.presentation import evidence_projection, exact_source_url, source_projection
from apps.schemes.engine.matcher import evaluate_sector_eligibility, match_business_schemes
from apps.schemes.models import Scheme, SchemeSourceSnapshot, SchemeVersion
from apps.schemes.pipeline.fetcher import FetchResult
from apps.schemes.pipeline.parser import SchemeDOMParser
from apps.schemes.pipeline.registry import OFFICIAL_SCHEME_SOURCES
from apps.schemes.pipeline.service import SchemePipelineService
from apps.schemes.presentation import scheme_evidence_projection, scheme_source_projection
from apps.schemes.provenance import is_authored_fixture_version
from tests.test_standards_hardening import evaluate
from tests.test_standards_hardening import standard_business as standard_business

pytestmark = pytest.mark.django_db


@pytest.fixture
def make_scheme():
    def create(code="SYNTHETIC-SUPPORT", **values):
        scheme = Scheme.objects.create(scheme_code=code, title="Synthetic support fixture", authority="Synthetic authority",
            source_url="https://msme.gov.in/synthetic-source-document", source_domain="msme.gov.in")
        defaults = {"title": scheme.title, "authority": scheme.authority, "jurisdiction": "CENTRAL",
            "summary": "Synthetic support terms", "benefit_summary": "Synthetic benefit", "eligibility_statement": "Synthetic enterprises",
            "source_url": scheme.source_url, "source_domain": scheme.source_domain, "evidence_snippet": "Synthetic captured support passage.",
            "content_hash": "f" * 64, "sectors": ["ALL"], "verification_status": "VERIFIED"}
        defaults.update(values)
        return SchemeVersion.objects.create(scheme=scheme, version_number=1, **defaults)
    return create


@pytest.fixture
def scoped_business(make_business, user):
    business = make_business(user)
    profile = BusinessProfileVersion.objects.create(business=business, version=1, variables={
        "state": {"value": "MAHARASHTRA"}, "product_description": {"value": "Lithium-ion traction battery pack assembly"},
        "product_type": {"value": "BATTERY_PACK"}, "is_manufacturing": {"value": True},
        "total_worker_count": {"value": 64}, "annual_turnover": {"value": 1000},
        "plant_machinery_investment": {"value": 1000}, "lifecycle_stage": {"value": "OPERATING"},
        "import_export_intent": {"value": "IMPORT_ONLY"}, "exports": {"value": False}})
    assessment = Assessment.objects.create(business=business, profile_version=profile)
    return business, profile, assessment


@pytest.fixture
def authored_scheme_version():
    from apps.schemes.pipeline.diff import compute_scheme_content_hash
    from apps.schemes.pipeline.fetcher import SNAPSHOT_FALLBACK_MAP
    candidate = SchemeDOMParser().parse(SNAPSHOT_FALLBACK_MAP["CENTRAL_MSME"], OFFICIAL_SCHEME_SOURCES["CENTRAL_MSME"])[0]
    scheme = Scheme.objects.create(scheme_code=candidate.scheme_code, title=candidate.title,
        authority=candidate.authority, source_url=candidate.source_url, source_domain=candidate.source_domain)
    return SchemeVersion.objects.create(scheme=scheme, version_number=1,
        content_hash=compute_scheme_content_hash(candidate), verification_status="VERIFIED", **{
            name: getattr(candidate, name) for name in (
                "title", "authority", "jurisdiction", "summary", "benefit_type", "benefit_summary",
                "benefit_details", "eligibility_statement", "eligibility_criteria", "sectors", "scale_match",
                "application_route", "application_url", "source_url", "source_domain", "evidence_snippet",
                "effective_from", "effective_to", "published_date")})


@pytest.mark.parametrize("url", ["https://msme.gov.in", "https://msme.gov.in/", "https://bis.gov.in/BIS/", "https://msme.gov.in/home/index.aspx", "https://msme.gov.in/search?q=fixture", "javascript:alert(1)",
    "https://msme.gov.in/?id=", "https://msme.gov.in/?document=%20", "https://msme.gov.in/resources?q=fixture",
    "https://msme.gov.in/resources?query=fixture", "https://msme.gov.in/resources?search=fixture"])
def test_generic_or_unsafe_link_is_not_an_exact_source(url):
    assert exact_source_url(url) is None


def test_exact_recorded_document_link_and_fragment_are_preserved():
    url = "https://msme.gov.in/documents/synthetic-guideline.pdf#page=4"
    assert exact_source_url(url) == url


def test_recorded_nonempty_resource_query_remains_exact():
    url = "https://msme.gov.in/?document_id=synthetic-publication#section-2"
    assert exact_source_url(url) == url


def test_empty_resource_query_cannot_validate_source_review():
    source = Source(source_id="synthetic-empty-query", canonical_url="https://msme.gov.in/?id=", status="ACTIVE")
    evidence = Evidence(source=source, verification_status="VERIFIED", excerpt="Synthetic recorded passage.")
    assert source_projection(source, evidence)["reviewed"] is False
    assert source_projection(source, evidence)["url"] is None


@pytest.mark.parametrize("final", ["https://msme.gov.in/", "https://unofficial.example/synthetic-guideline"])
def test_invalid_recorded_final_url_never_recovers_original_link(final):
    source = Source.objects.create(source_id="synthetic-redirect", title="Stored source title", authority="Stored authority",
        canonical_url="https://msme.gov.in/documents/synthetic.pdf", metadata={"final_url": final})
    assert source_projection(source)["url"] is None


def test_official_root_to_unofficial_redirect_is_not_reviewed():
    source = Source.objects.create(source_id="synthetic-root-redirect", title="Stored source title", authority="Stored authority",
        canonical_url="https://msme.gov.in/", status="ACTIVE", metadata={"final_url": "https://unofficial.example/synthetic-document"})
    evidence = Evidence.objects.create(evidence_id="synthetic-root-passage", source=source, excerpt="Synthetic passage", verification_status="VERIFIED")
    payload = source_projection(source, evidence)
    assert payload["url"] is None
    assert payload["reviewed"] is False
    assert payload["evidence_status"] == "VERIFIED"


def test_exact_provenance_and_excerpt_share_the_same_stored_source():
    source = Source.objects.create(source_id="synthetic-source", title="Stored source title", authority="Stored authority",
        canonical_url="https://msme.gov.in/documents/synthetic.pdf", metadata={"retrieved_at": "2026-10-04T12:00:00Z", "acquisition_mode": "CRAWLEE_HTTP"})
    evidence = Evidence.objects.create(evidence_id="synthetic-passage", source=source, excerpt="Actual synthetic captured passage", locator="Page 4", verification_status="VERIFIED")
    payload = evidence_projection(evidence)
    assert payload["source_id"] == payload["source"]["id"] == source.source_id
    assert payload["excerpt"] == evidence.excerpt
    assert payload["source"]["url"] == source.canonical_url
    assert payload["source"]["title"] == source.title
    assert payload["source"]["authority"] == source.authority
    assert payload["source"]["acquisition_method"] == "CRAWLEE_HTTP"


def test_importing_does_not_qualify_business_for_export_scheme(scoped_business, make_scheme):
    make_scheme(sectors=["EXPORT"], eligibility_statement="Synthetic exporter-only support")
    assert match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"] == []


@pytest.mark.parametrize("sectors,description", [(["AUTOMOTIVE"], "Software development and IT consulting"), (["SERVICES"], "Lithium-ion battery-pack manufacturing")])
def test_short_sector_keywords_do_not_match_inside_unrelated_words(sectors, description):
    assert evaluate_sector_eligibility(sectors, description, True, True)[0] is False


def test_generic_sector_similarity_is_candidate_not_eligibility(scoped_business, make_scheme):
    make_scheme(sectors=["MANUFACTURING"])
    row = match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"][0]
    assert row["eligibility_status"] == "CANDIDATE"
    assert "full eligibility has not been established" in row["relevance_rationale"]
    assert "product_description" in row["matched_facts"]
    assert row["source"]["url"] == "https://msme.gov.in/synthetic-source-document"
    assert row["evidence"][0]["source_id"] == row["source"]["id"]


@pytest.mark.parametrize("criteria,statement", [
    ({"requires_exports": True}, "Synthetic support"),
    ({"product_type": "BATTERY_CELL"}, "Synthetic cell production support"),
    ({"applicant_type": "HOUSEHOLD"}, "Synthetic residential support"),
    ({}, "Households installing residential equipment"),
    ({}, "Individuals setting up a new micro-enterprise"),
])
def test_explicit_contradictions_suppress_schemes(scoped_business, make_scheme, criteria, statement):
    make_scheme(eligibility_criteria=criteria, eligibility_statement=statement)
    assert match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"] == []


def test_reviewed_predicate_and_capture_support_eligibility(scoped_business, make_scheme):
    make_scheme(eligibility_criteria={"eligibility_ast": {"op": "AND", "args": [
        {"op": "EQ", "left": {"var": "product_type"}, "right": "BATTERY_PACK"},
        {"op": "GTE", "left": {"var": "total_worker_count"}, "right": 50},
        {"op": "NOT", "arg": {"op": "EQ", "left": {"var": "exports"}, "right": True}}]}})
    row = match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"][0]
    assert row["eligibility_status"] == "EVIDENCE_SUPPORTED"
    assert row["matched_fact_values"]["total_worker_count"] == 64
    assert row["matched_fact_values"]["exports"] is False


def test_missing_eligibility_fact_stays_needs_review(scoped_business, make_scheme):
    make_scheme(eligibility_criteria={"eligibility_ast": {"op": "EQ", "left": {"var": "udyam_registered"}, "right": True}})
    row = match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"][0]
    assert row["eligibility_status"] == "NEEDS_REVIEW"
    assert row["unresolved_facts"] == ["udyam_registered"]


def test_expired_window_is_not_active_eligible(scoped_business, make_scheme):
    make_scheme(effective_to=date.today() - timedelta(days=1))
    row = match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"][0]
    assert row["eligibility_status"] == "EXPIRED_OR_NOT_CURRENT"


def test_source_homepage_is_missing_not_replaced_by_application_link(scoped_business, make_scheme):
    make_scheme(source_url="https://msme.gov.in/", application_url="https://msme.gov.in/synthetic-apply")
    row = match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"][0]
    assert row["source"]["url"] is None
    assert row["source_url"] is None
    assert row["action_url"] == "https://msme.gov.in/synthetic-apply"


def test_new_profile_does_not_change_old_assessment_scheme_facts(scoped_business, make_scheme):
    business, previous, assessment = scoped_business
    make_scheme(eligibility_criteria={"eligibility_ast": {"op": "GTE", "left": {"var": "total_worker_count"}, "right": 60}})
    variables = dict(previous.variables)
    variables["total_worker_count"] = {"value": 86}
    profile = BusinessProfileVersion.objects.create(business=business, version=2, variables=variables)
    later = Assessment.objects.create(business=business, profile_version=profile, assessment_number=2)
    first = match_business_schemes(business, assessment_id=assessment.id)["schemes"][0]
    second = match_business_schemes(business, assessment_id=later.id)["schemes"][0]
    assert first["matched_fact_values"]["total_worker_count"] == 64
    assert second["matched_fact_values"]["total_worker_count"] == 86
    assert "86" not in first["relevance_rationale"]
    assert "64" not in second["relevance_rationale"]


def test_failed_acquisition_never_publishes_a_verified_version():
    fetcher = Mock()
    parser = Mock()
    fetcher.fetch.return_value = FetchResult("CENTRAL_MSME", "https://msme.gov.in/all-schemes", "msme.gov.in", "", "0"*64, False, "FAILED", "Synthetic timeout")
    result = SchemePipelineService(fetcher=fetcher, parser=parser).run_pipeline(source_keys=["CENTRAL_MSME"])
    assert result["sources_details"]["CENTRAL_MSME"]["status"] == "FAILED"
    assert not SchemeVersion.objects.exists()
    assert SchemeSourceSnapshot.objects.get().status == "FAILED"
    parser.parse.assert_not_called()


def test_parser_does_not_manufacture_missing_evidence_quote():
    rows = SchemeDOMParser().parse('<article class="scheme-card"><h2 class="scheme-title">Synthetic support</h2><div class="scheme-eligibility">Synthetic enterprises</div></article>', OFFICIAL_SCHEME_SOURCES["CENTRAL_MSME"])
    assert rows[0].evidence_snippet == ""


def test_catalog_never_claims_business_eligibility(api_client, make_scheme):
    version = make_scheme(source_url="https://msme.gov.in/")
    response = api_client.get("/api/v1/schemes/catalog")
    assert response.status_code == 200
    row = response.json()["data"]["schemes"][0]
    assert row["eligibility_status"] == "CANDIDATE"
    assert row["source"]["id"] == str(version.id)
    assert row["source"]["url"] is None
    assert row["evidence"][0]["excerpt"] == version.evidence_snippet


def test_reviewer_note_is_not_a_fabricated_source_quote(auth_client, user, make_scheme):
    version = make_scheme(eligibility_criteria={"requires_exports": False})
    user.is_staff = True
    user.save()
    response = auth_client.post(f"/api/v1/schemes/{version.scheme.scheme_code}/update", {
        "benefit_summary": "Synthetic changed support terms", "change_reason": "Synthetic reviewer note"}, format="json")
    assert response.status_code == 201
    revised = version.scheme.versions.get(version_number=2)
    assert revised.evidence_snippet == version.evidence_snippet
    assert "Verified via live official feed" not in revised.evidence_snippet
    assert revised.verification_status == "PENDING_REVIEW"
    assert revised.eligibility_criteria == version.eligibility_criteria
    assert revised.diff_summary["review_note"] == "Synthetic reviewer note"


def test_public_context_evaluation_uses_negative_facts_and_candidate_status(api_client, make_scheme):
    make_scheme(sectors=["EXPORT"])
    response = api_client.post("/api/v1/schemes/evaluate", {"state": "MH", "product_description": "Battery-pack assembly",
        "is_manufacturing": True, "is_cross_border": True, "trade_intent": "IMPORT_ONLY", "exports": False}, format="json")
    assert response.status_code == 200
    assert response.json()["data"]["schemes"] == []


def test_unlinked_mandatory_metadata_is_not_a_legal_reference(standard_business):
    requirement = standard_business[3]
    requirement.metadata = {"is_mandatory": True}
    requirement.save()
    payload = evaluate(standard_business)
    assert payload["standards"], list(standard_business[2].decision_run.results.values("status", "explanation_trace"))
    row = payload["standards"][0]
    assert row["is_mandatory"] is None
    assert row["source"]["id"] == row["evidence"][0]["source_id"]
    assert "product_type" in row["matched_facts"]


def test_standard_read_does_not_promote_historical_broad_text_decision(standard_business):
    evaluate(standard_business)
    assessment = standard_business[2]
    row = assessment.decision_run.results.get(requirement_id=standard_business[3].requirement_id)
    row.explanation_trace = {"evaluations": [{"truth_value": "TRUE", "trace": {
        "op": "CONTAINS", "result": "TRUE", "variables_used": {"product_description": "Synthetic electronic equipment"}}}]}
    row.save()
    from domain.intelligence.standards_discovery import discover_business_standards
    assert discover_business_standards(standard_business[0], assessment_id=assessment.id)["standards"] == []


def test_mandatory_standard_requires_bound_rule_and_passage(standard_business):
    requirement, rule, evidence = standard_business[3:]
    requirement.metadata = {"is_mandatory": True, "mandatory_reference": {
        "rule_id": rule.rule_id, "evidence_ids": [evidence.evidence_id]}}
    requirement.save()
    assert evaluate(standard_business)["standards"][0]["is_mandatory"] is True


def test_optional_export_conformity_does_not_veto_domestic_business(scoped_business, make_scheme):
    make_scheme(eligibility_statement="Enterprises acquiring laboratory test reports for certification, export conformity, or regulatory compliance.")
    rows = match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"]
    assert len(rows) == 1
    assert rows[0]["eligibility_status"] == "CANDIDATE"


def test_exporter_only_applicant_scope_still_vetoes_non_exporter(scoped_business, make_scheme):
    make_scheme(eligibility_statement="Only manufacturer and merchant exporters shipping goods from India.")
    assert match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"] == []


def test_authored_version_quarantine_keeps_original_recorded_marker(authored_scheme_version):
    source = scheme_source_projection(authored_scheme_version)
    assert source["origin"] == "AUTHORED_FIXTURE"
    assert source["evidence_status"] == "UNVERIFIED"
    assert source["recorded_verification_status"] == "VERIFIED"
    assert source["url"] is None
    assert source["authority"] is None
    assert source["reviewed"] is False
    assert scheme_evidence_projection(authored_scheme_version) == []
    authored_scheme_version.refresh_from_db()
    assert authored_scheme_version.verification_status == "VERIFIED"


def test_quarantine_matches_fields_even_if_recorded_hash_is_altered(authored_scheme_version):
    authored_scheme_version.content_hash = "z" * 64
    authored_scheme_version.save(update_fields=["content_hash"])
    assert is_authored_fixture_version(authored_scheme_version)


def test_authored_scheme_is_not_a_business_recommendation(scoped_business, authored_scheme_version):
    payload = match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)
    assert payload["schemes"] == []
    assert payload["excluded_unreviewed_count"] == 1
    assert payload["scope_status"] == "SOURCE_REVIEW_REQUIRED"


def test_all_authored_catalog_is_a_neutral_review_state(api_client, authored_scheme_version):
    payload = api_client.get("/api/v1/schemes/catalog").json()["data"]
    assert payload["schemes"] == []
    assert payload["count"] == 0
    assert payload["excluded_unreviewed_count"] == 1
    assert payload["scope_status"] == "SOURCE_REVIEW_REQUIRED"
    assert "No reviewed scheme sources" in payload["scope_note"]


def test_independently_captured_metadata_is_not_quarantined(scoped_business, make_scheme):
    version = make_scheme(title="Synthetic independently captured support", source_url="https://msme.gov.in/synthetic-independent-publication")
    from types import SimpleNamespace

    from apps.schemes.pipeline.diff import compute_scheme_content_hash
    version.content_hash = compute_scheme_content_hash(SimpleNamespace(scheme_code=version.scheme.scheme_code, **{
        name: getattr(version, name) for name in ("title", "authority", "jurisdiction", "benefit_type", "benefit_summary",
            "eligibility_statement", "sectors", "scale_match", "effective_from", "effective_to", "application_url")}))
    version.save(update_fields=["content_hash"])
    assert not is_authored_fixture_version(version)
    assert scheme_source_projection(version)["reviewed"] is True
    assert scheme_source_projection(version)["url"] == version.source_url
    assert len(match_business_schemes(scoped_business[0], assessment_id=scoped_business[2].id)["schemes"]) == 1


def test_editing_authored_record_does_not_invent_a_live_source(auth_client, user, authored_scheme_version):
    user.is_staff = True
    user.save()
    original_quote = authored_scheme_version.evidence_snippet
    response = auth_client.post(f"/api/v1/schemes/{authored_scheme_version.scheme.scheme_code}/update", {
        "benefit_summary": "Synthetic amended terms", "change_reason": "Synthetic review note"}, format="json")
    assert response.status_code == 201
    revised = authored_scheme_version.scheme.versions.get(version_number=2)
    assert revised.evidence_snippet == ""
    assert revised.diff_summary["provenance_origin"] == "AUTHORED_FIXTURE"
    assert is_authored_fixture_version(revised)
    authored_scheme_version.refresh_from_db()
    assert authored_scheme_version.evidence_snippet == original_quote
