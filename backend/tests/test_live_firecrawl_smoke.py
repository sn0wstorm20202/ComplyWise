"""Live Firecrawl smoke test.

Authority: Milestone Section 9 (Automated Test Suite & Smoke Testing).
Runs an actual live search against the Firecrawl API if FIRECRAWL_API_KEY is configured.
Gracefully skips if FIRECRAWL_API_KEY is unset or empty.
"""

from __future__ import annotations

import pytest
from apps.ingestion.firecrawl import is_configured, search


@pytest.mark.django_db
def test_live_firecrawl_smoke():
    """Verify live communication with Firecrawl v2 search API using the configured key."""
    if not is_configured():
        pytest.skip("FIRECRAWL_API_KEY not configured; skipping live Firecrawl smoke test.")

    # Execute a focused query against official Indian regulatory portals
    query = "site:gov.in consent to establish pollution control board"
    try:
        results = search(query=query, limit=3, scrape_markdown=False)
    except Exception as exc:
        pytest.fail(f"Live Firecrawl API call failed: {exc}")

    assert isinstance(results, list), "Expected list of search results"
    if results:
        first = results[0]
        assert "url" in first, "Search result missing 'url'"
        assert isinstance(first["url"], str)
        assert len(first["url"]) > 0
