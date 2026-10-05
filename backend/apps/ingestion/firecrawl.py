"""Legacy Firecrawl boundary, disabled for the SIH submission.

Kept only so historical imports fail safely. No HTTP calls or credential reads.
"""
from domain.providers.base import ProviderError

class FirecrawlUnavailable(ProviderError):
    pass

def is_configured():
    return False

def search(*args, **kwargs):
    raise FirecrawlUnavailable("Firecrawl is retired from the active acquisition path.")

def scrape(*args, **kwargs):
    raise FirecrawlUnavailable("Firecrawl is retired from the active acquisition path.")
