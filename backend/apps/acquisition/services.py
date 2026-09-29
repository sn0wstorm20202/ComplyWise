"""Acquisition and Action Resolution Application Services.

Authority: 01_ENGINEERING_CONSTITUTION.md;
           Sections 8, 9, 10, 11: End-to-End Action Destination Resolution.
"""

from __future__ import annotations

import logging
from typing import Any

from apps.acquisition.registry import OfficialSourceRegistry, REGISTRY
from apps.acquisition.router import AcquisitionRouter, NormalizedAcquiredPage
from apps.acquisition.resolver import ActionDestination, ActionLinkResolver

logger = logging.getLogger("complywise.acquisition.services")


def resolve_action_for_requirement(
    requirement_id: str,
    requirement_name: str,
    authority: str = "",
    state_code: str = "",
    authoritative_url: str = "",
    html_fixture: str | None = None,
    allow_test_hosts: bool = False,
    allow_live_network: bool | None = None,
) -> ActionDestination:
    """Resolve exact verified official action destination for a statutory requirement.

    Integrates:
        OfficialSourceRegistry -> AcquisitionRouter -> ActionLinkResolver -> ActionDestination

    Crucial Invariants:
        1. Action destination is distinct from legal applicability evidence.
        2. NEVER fabricate or guess action URLs.
        3. If unverified, returns verification_status = ACTION_PAGE_NOT_VERIFIED.
    """
    if allow_live_network is None:
        from django.conf import settings
        allow_live_network = not getattr(settings, "RUNNING_TESTS", False)

    registry = OfficialSourceRegistry(allow_test_hosts=allow_test_hosts)
    router = AcquisitionRouter(registry=registry)
    resolver = ActionLinkResolver(registry=registry)

    # 1. Determine authoritative portal URL if not provided
    portal_url = authoritative_url
    if not portal_url and authority:
        portal_info = registry.lookup_portal_for_authority(authority, state_code)
        if portal_info:
            portal_url = portal_info.get("url", "")

    if not portal_url:
        return resolver.resolve_action(
            requirement_id=requirement_id,
            requirement_name=requirement_name,
            authoritative_source_url="",
            acquired_page=None,
        )

    # 2. Acquire portal page (from fixture if provided, or via live router if network allowed)
    acquired_page: NormalizedAcquiredPage | None = None
    if html_fixture is not None:
        try:
            acquired_page = router.acquire_from_fixture(html_fixture, portal_url)
        except Exception as exc:
            logger.warning("Fixture acquisition failed for %s: %s", portal_url, exc)
    elif allow_live_network:
        try:
            acquired_page = router.acquire(portal_url)
        except Exception as exc:
            logger.warning("Live acquisition failed for %s: %s", portal_url, exc)

    # 3. Resolve exact action destination
    return resolver.resolve_action(
        requirement_id=requirement_id,
        requirement_name=requirement_name,
        authoritative_source_url=portal_url,
        acquired_page=acquired_page,
    )
