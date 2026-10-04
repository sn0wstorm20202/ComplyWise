"""Legacy boundary must never make a request, even with old credentials."""
from unittest.mock import patch
import pytest
from apps.ingestion import firecrawl

def test_retired_firecrawl_cannot_execute():
    with patch("urllib.request.urlopen") as network:
        assert firecrawl.is_configured() is False
        with pytest.raises(firecrawl.FirecrawlUnavailable): firecrawl.search("synthetic")
        with pytest.raises(firecrawl.FirecrawlUnavailable): firecrawl.scrape("https://bis.gov.in")
    network.assert_not_called()
