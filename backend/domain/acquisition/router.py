"""Web Acquisition Router and Factory for ComplyWise.

Authority: Implementation Prompt §14; Audit Instruction §16.
"""

from __future__ import annotations

import logging
from typing import Any

from .base import BaseWebAcquisitionLayer
from .crawlee_provider import CrawleeAcquisitionProvider

logger = logging.getLogger(__name__)

_DEFAULT_PROVIDER: BaseWebAcquisitionLayer | None = None


def get_web_acquisition_provider() -> BaseWebAcquisitionLayer:
    """Return the configured web acquisition provider. Defaults to Crawlee."""
    global _DEFAULT_PROVIDER
    if _DEFAULT_PROVIDER is None:
        _DEFAULT_PROVIDER = CrawleeAcquisitionProvider()
    return _DEFAULT_PROVIDER


def set_web_acquisition_provider(provider: BaseWebAcquisitionLayer) -> None:
    """Explicitly override the web acquisition provider (useful for testing/mocking)."""
    global _DEFAULT_PROVIDER
    _DEFAULT_PROVIDER = provider
