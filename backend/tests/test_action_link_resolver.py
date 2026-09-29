"""Action-URL Regression Test Suite (Tests A through J).

Authority: Sections 8, 9, 10, 15 of Post Fast-Track Master Specification.
Invariant: NEVER INVENT AN ACTION URL.
"""

from __future__ import annotations

import pytest

from apps.acquisition.registry import OfficialSourceRegistry
from apps.acquisition.router import AcquisitionRouter, AcquisitionSecurityError
from apps.acquisition.resolver import ActionLinkResolver


@pytest.fixture
def registry() -> OfficialSourceRegistry:
    return OfficialSourceRegistry(allow_test_hosts=False)


@pytest.fixture
def router(registry: OfficialSourceRegistry) -> AcquisitionRouter:
    return AcquisitionRouter(registry=registry)


@pytest.fixture
def resolver(registry: OfficialSourceRegistry) -> ActionLinkResolver:
    return ActionLinkResolver(registry=registry)


class TestActionUrlResolutionRegression:
    """Action-URL Regression Tests A through J per Section 15."""

    def test_a_exact_internal_application_link_discovered(
        self, router: AcquisitionRouter, resolver: ActionLinkResolver
    ) -> None:
        """Test A: Exact internal application link is discovered."""
        html = """
        <html>
            <head><title>GPCB Official Portal</title></head>
            <body>
                <header><a href="/">Home</a></header>
                <div class="content">
                    <h1>Gujarat Pollution Control Board</h1>
                    <p>Statutory services for industrial units.</p>
                    <a class="btn primary" href="/online/cte-application">Apply for Consent to Establish (CTE)</a>
                </div>
            </body>
        </html>
        """
        page = router.acquire_from_fixture(html, "https://gpcb.gujarat.gov.in")
        dest = resolver.resolve_action(
            requirement_id="REQ-GPCB-CTE",
            requirement_name="Consent to Establish (Water & Air Pollution Control)",
            authoritative_source_url="https://gpcb.gujarat.gov.in",
            acquired_page=page,
        )

        assert dest.verification_status == "VERIFIED_ACTION_PAGE"
        assert dest.action_type == "APPLY"
        assert dest.action_url == "https://gpcb.gujarat.gov.in/online/cte-application"
        assert dest.official_domain == "gpcb.gujarat.gov.in"
        assert dest.confidence >= 0.70

    def test_b_javascript_application_button_discovered(
        self, router: AcquisitionRouter, resolver: ActionLinkResolver
    ) -> None:
        """Test B: JavaScript application button is discovered."""
        html = """
        <html>
            <head><title>DISH Gujarat</title></head>
            <body>
                <main>
                    <h2>Factory Registration and Safety Directorate</h2>
                    <button class="btn-register" onclick="window.location.href='/factory-license/register'">
                        Register Factory Online
                    </button>
                </main>
            </body>
        </html>
        """
        page = router.acquire_from_fixture(html, "https://dish.gujarat.gov.in")
        dest = resolver.resolve_action(
            requirement_id="REQ-GUJ-FACTORY-LICENSE",
            requirement_name="Factory License & Plan Approval",
            authoritative_source_url="https://dish.gujarat.gov.in",
            acquired_page=page,
        )

        assert dest.verification_status == "VERIFIED_ACTION_PAGE"
        assert dest.action_type == "REGISTER"
        assert dest.action_url == "https://dish.gujarat.gov.in/factory-license/register"
        assert dest.official_domain == "dish.gujarat.gov.in"
        assert dest.confidence >= 0.70

    def test_c_external_officially_linked_government_portal_discovered(
        self, router: AcquisitionRouter, resolver: ActionLinkResolver
    ) -> None:
        """Test C: External officially-linked government portal is discovered."""
        html = """
        <html>
            <head><title>MahaIT Single Window</title></head>
            <body>
                <h1>Maharashtra Industry Single Window</h1>
                <p>Environmental statutory clearances:</p>
                <a href="https://mpcb.gov.in/industry/consent-management">
                    Apply for MPCB Consent Management
                </a>
            </body>
        </html>
        """
        page = router.acquire_from_fixture(html, "https://mahait.org/udyogsarathi")
        dest = resolver.resolve_action(
            requirement_id="REQ-MH-ENV-CTE",
            requirement_name="Consent to Establish (MPCB)",
            authoritative_source_url="https://mahait.org/udyogsarathi",
            acquired_page=page,
        )

        assert dest.verification_status == "VERIFIED_ACTION_PAGE"
        assert dest.action_type == "APPLY"
        assert dest.action_url == "https://mpcb.gov.in/industry/consent-management"
        assert dest.official_domain == "mpcb.gov.in"

    def test_d_generic_homepage_rejected_when_verified_action_page_exists(
        self, router: AcquisitionRouter, resolver: ActionLinkResolver
    ) -> None:
        """Test D: Generic homepage is NOT accepted when a verified action page exists."""
        html = """
        <html>
            <head><title>GPCB Services</title></head>
            <body>
                <a href="https://gpcb.gujarat.gov.in/">GPCB Home</a>
                <a href="https://gpcb.gujarat.gov.in/index.html">Portal Index</a>
                <div class="actions">
                    <a href="https://gpcb.gujarat.gov.in/services/cte/apply">Apply for CTE Online</a>
                </div>
            </body>
        </html>
        """
        page = router.acquire_from_fixture(html, "https://gpcb.gujarat.gov.in")
        dest = resolver.resolve_action(
            requirement_id="REQ-GPCB-CTE",
            requirement_name="Consent to Establish",
            authoritative_source_url="https://gpcb.gujarat.gov.in",
            acquired_page=page,
        )

        assert dest.verification_status == "VERIFIED_ACTION_PAGE"
        assert dest.action_url == "https://gpcb.gujarat.gov.in/services/cte/apply"
        assert dest.action_url != "https://gpcb.gujarat.gov.in/"
        assert dest.action_url != "https://gpcb.gujarat.gov.in/index.html"

    def test_e_unrelated_apply_link_rejected(
        self, router: AcquisitionRouter, resolver: ActionLinkResolver
    ) -> None:
        """Test E: Unrelated 'Apply' link is rejected (careers, tenders)."""
        html = """
        <html>
            <head><title>Department of Boilers</title></head>
            <body>
                <nav>
                    <a href="/careers/apply">Apply for Staff Recruitment / Vacancy</a>
                    <a href="/procurement/tenders/apply">Apply for Security Tender Bid</a>
                </nav>
                <div class="info">
                    <p>Information regarding boiler inspections and rules.</p>
                </div>
            </body>
        </html>
        """
        page = router.acquire_from_fixture(html, "https://dish.gujarat.gov.in")
        dest = resolver.resolve_action(
            requirement_id="REQ-GUJ-BOILER-REG",
            requirement_name="Boiler Registration & Inspection Certificate",
            authoritative_source_url="https://dish.gujarat.gov.in",
            acquired_page=page,
        )

        assert dest.verification_status == "ACTION_PAGE_NOT_VERIFIED"
        assert dest.action_url == ""
        assert "careers" not in dest.action_url
        assert "tenders" not in dest.action_url

    def test_f_malicious_external_link_rejected(
        self, router: AcquisitionRouter, resolver: ActionLinkResolver
    ) -> None:
        """Test F: Malicious/unapproved external link is rejected."""
        html = """
        <html>
            <head><title>Portal</title></head>
            <body>
                <a href="https://phishing-scam-portal.com/apply-cte">
                    Apply for CTE Online Fast
                </a>
            </body>
        </html>
        """
        page = router.acquire_from_fixture(html, "https://gpcb.gujarat.gov.in")
        dest = resolver.resolve_action(
            requirement_id="REQ-GPCB-CTE",
            requirement_name="Consent to Establish",
            authoritative_source_url="https://gpcb.gujarat.gov.in",
            acquired_page=page,
        )

        assert dest.verification_status in ("MALICIOUS_REJECTED", "DOMAIN_REJECTED")
        assert dest.action_url == ""

    def test_g_unverified_guessed_url_rejected(
        self, router: AcquisitionRouter, resolver: ActionLinkResolver
    ) -> None:
        """Test G: Unverified guessed URL is rejected (assert resolver NEVER fabricates URLs)."""
        html = """
        <html>
            <head><title>State Portal</title></head>
            <body>
                <p>Welcome to the portal. General announcements.</p>
            </body>
        </html>
        """
        page = router.acquire_from_fixture(html, "https://dish.gujarat.gov.in")
        dest = resolver.resolve_action(
            requirement_id="REQ-GUJ-BOILER-REG",
            requirement_name="Boiler Registration",
            authoritative_source_url="https://dish.gujarat.gov.in",
            acquired_page=page,
        )

        assert dest.verification_status == "ACTION_PAGE_NOT_VERIFIED"
        assert dest.action_url == ""
        assert dest.final_resolved_url == ""
        assert dest.authoritative_source_url == "https://dish.gujarat.gov.in"
        # Assert no guessed slug was manufactured
        assert not dest.action_url.endswith("/boiler-registration")
        assert not dest.action_url.endswith("/apply")

    def test_h_redirect_to_approved_official_portal_succeeds(
        self, registry: OfficialSourceRegistry
    ) -> None:
        """Test H: Redirect to approved official portal succeeds."""
        source = "https://gpcb.gujarat.gov.in/services"
        destination = "https://nsws.gov.in/portal/approvals"

        valid, reason = registry.validate_redirect(source, destination)
        assert valid is True
        assert reason == "VALID_OFFICIAL_URL"

    def test_i_redirect_to_unapproved_domain_fails(
        self, registry: OfficialSourceRegistry
    ) -> None:
        """Test I: Redirect to unapproved domain fails (SSRF/domain check)."""
        source = "https://gpcb.gujarat.gov.in/services"
        malicious_destination = "https://malicious-external-proxy.org/steal"

        valid, reason = registry.validate_redirect(source, malicious_destination)
        assert valid is False
        assert "UNAPPROVED_DOMAIN" in reason

        # Also test redirect to private IP (SSRF)
        ssrf_destination = "http://192.168.1.100/admin"
        valid_ssrf, reason_ssrf = registry.validate_redirect(source, ssrf_destination)
        assert valid_ssrf is False

    def test_j_action_not_found_produces_action_page_not_verified(
        self, router: AcquisitionRouter, resolver: ActionLinkResolver
    ) -> None:
        """Test J: Action-not-found produces ACTION_PAGE_NOT_VERIFIED with honest explanation."""
        html = """
        <html>
            <head><title>GPCB Static Notices</title></head>
            <body>
                <h1>Public Notices & Annual Speeches</h1>
                <a href="/about-us">About Us</a>
                <a href="/board-members">Board Members</a>
                <a href="/disclaimer">Disclaimer</a>
            </body>
        </html>
        """
        page = router.acquire_from_fixture(html, "https://gpcb.gujarat.gov.in")
        dest = resolver.resolve_action(
            requirement_id="REQ-GPCB-CTE",
            requirement_name="Consent to Establish",
            authoritative_source_url="https://gpcb.gujarat.gov.in",
            acquired_page=page,
        )

        assert dest.verification_status == "ACTION_PAGE_NOT_VERIFIED"
        assert dest.action_url == ""
        assert dest.confidence == 0.0
        assert "No action links matched" in dest.explanation or "Found navigational links" in dest.explanation
