"""Web Acquisition Layer package for ComplyWise."""

from .base import (
    AcquisitionError,
    AcquisitionRateLimited,
    AcquisitionTimeout,
    BaseWebAcquisitionLayer,
    WebAcquisitionResult,
)
from .crawlee_provider import CrawleeAcquisitionProvider
from .router import get_web_acquisition_provider, set_web_acquisition_provider

__all__ = [
    "AcquisitionError",
    "AcquisitionRateLimited",
    "AcquisitionTimeout",
    "BaseWebAcquisitionLayer",
    "CrawleeAcquisitionProvider",
    "WebAcquisitionResult",
    "get_web_acquisition_provider",
    "set_web_acquisition_provider",
]
