"""Discovery recovery retains real captures without publishing guessed rules."""
from email.message import Message
from unittest.mock import Mock, patch

import pytest
from django.test import override_settings

from apps.ingestion.models import RetrievedDocument
from apps.ingestion.services import run_discovery
from apps.knowledge.models import RuleVersion
from domain.acquisition.base import WebAcquisitionResult
from domain.acquisition.crawlee_provider import CrawleeAcquisitionProvider
from tests.test_workspace_guidance import setup_assessment


def test_missing_crawlee_is_controlled_without_hidden_fetch():
    provider = CrawleeAcquisitionProvider()
    with patch("domain.acquisition.crawlee_provider.validate_destination"), patch.object(provider, "_fetch_via_crawlee", side_effect=ImportError("engine absent")), patch("urllib.request.urlopen") as network:
        result = provider.fetch_page("https://dgca.gov.in/fixture", {"use_browser": True})
    assert result.errors and not result.text_content
    assert result.acquisition_engine == "FAILED_ACQUISITION"
    network.assert_not_called()


@pytest.mark.django_db
@override_settings(SERPAPI_API_KEY="synthetic-fixture")
def test_crawlee_capture_persists_without_firecrawl(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    url = "https://dgca.gov.in/fixture"
    acquired = WebAcquisitionResult(source_url=url, resolved_url=url, domain="dgca.gov.in", title="Fixture",
        retrieved_at="", acquisition_engine="CRAWLEE_HTTP", text_content="Synthetic captured drone filming passage. " * 3)
    provider = Mock(); provider.fetch_page.return_value = acquired
    initial_rules = RuleVersion.objects.count()
    with patch("apps.ingestion.services.search_provider.search", return_value=[{"url": url, "title": "Fixture"}]), \
         patch("domain.acquisition.get_web_acquisition_provider", return_value=provider), \
         patch("apps.ingestion.services.extract_claims_from_text", return_value=[]):
        result = run_discovery(business, force_refresh=True, max_scrape=1, assessment=assessment, profile_version=profile)
    capture = RetrievedDocument.objects.get(source__canonical_url=url)
    assert capture.normalized_content == acquired.text_content
    assert capture.metadata["provider"] == "CRAWLEE_HTTP"
    assert result["sources_scraped"] == 1
    assert RuleVersion.objects.count() == initial_rules


@pytest.mark.django_db
@override_settings(SERPAPI_API_KEY="synthetic-fixture")
def test_redirect_to_unofficial_host_is_not_persisted(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    acquired = WebAcquisitionResult(source_url="https://dgca.gov.in/fixture", resolved_url="https://example.com/fixture",
        domain="example.com", title="Fixture", retrieved_at="", text_content="Synthetic passage " * 10)
    provider = Mock(); provider.fetch_page.return_value = acquired
    with patch("apps.ingestion.services.search_provider.search", return_value=[{"url": acquired.source_url}]), \
         patch("domain.acquisition.get_web_acquisition_provider", return_value=provider):
        result = run_discovery(business, force_refresh=True, max_scrape=1, assessment=assessment, profile_version=profile)
    assert result["sources_scraped"] == 0
    assert not RetrievedDocument.objects.filter(source__canonical_url=acquired.resolved_url).exists()
