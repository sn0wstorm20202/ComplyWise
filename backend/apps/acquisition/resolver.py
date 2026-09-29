"""Action Link Resolver and Official Action Destination Validation.

Authority: 01_ENGINEERING_CONSTITUTION.md;
           Sections 8, 9, 10: Action-Link Discovery, Scoring & Anti-Hallucination.

Crucial Invariant:
    NEVER INVENT AN ACTION URL.
    Constructing URLs from guessed slugs or hallucinating portals is strictly prohibited.
    If the exact action destination cannot be verified, return:
        verification_status = "ACTION_PAGE_NOT_VERIFIED"
        action_url = ""
"""

from __future__ import annotations

import datetime
import logging
import re
import urllib.parse
from dataclasses import dataclass, field
from typing import Any

from apps.acquisition.registry import OfficialSourceRegistry, REGISTRY
from apps.acquisition.router import DiscoveredLink, NormalizedAcquiredPage

logger = logging.getLogger("complywise.acquisition.resolver")


# Action intent classifications and associated regex weights
ACTION_PATTERNS: dict[str, list[re.Pattern]] = {
    "APPLY": [
        re.compile(r"\bapply\s+online\b", re.I),
        re.compile(r"\bapply\s+now\b", re.I),
        re.compile(r"\bapply\s+for\b", re.I),
        re.compile(r"\bnew\s+application\b", re.I),
        re.compile(r"\bapplication\s+form\b", re.I),
        re.compile(r"\bapply\b", re.I),
    ],
    "REGISTER": [
        re.compile(r"\bnew\s+registration\b", re.I),
        re.compile(r"\bonline\s+registration\b", re.I),
        re.compile(r"\bregister\s+here\b", re.I),
        re.compile(r"\bregister\s+unit\b", re.I),
        re.compile(r"\bregistration\b", re.I),
        re.compile(r"\bregister\b", re.I),
    ],
    "RENEW": [
        re.compile(r"\brenew\s+license\b", re.I),
        re.compile(r"\brenewal\s+of\b", re.I),
        re.compile(r"\bonline\s+renewal\b", re.I),
        re.compile(r"\brenew\b", re.I),
        re.compile(r"\brenewal\b", re.I),
    ],
    "FILE": [
        re.compile(r"\bfile\s+return\b", re.I),
        re.compile(r"\be-filing\b", re.I),
        re.compile(r"\bannual\s+return\b", re.I),
        re.compile(r"\bfile\b", re.I),
    ],
    "DOWNLOAD_FORM": [
        re.compile(r"\bdownload\s+form\b", re.I),
        re.compile(r"\bdownload\s+application\b", re.I),
        re.compile(r"\bprescribed\s+format\b", re.I),
        re.compile(r"\bform\s+\d+\b", re.I),
    ],
    "PORTAL_LOGIN": [
        re.compile(r"\bapplicant\s+login\b", re.I),
        re.compile(r"\bportal\s+login\b", re.I),
        re.compile(r"\bsign\s+in\b", re.I),
        re.compile(r"\blogin\b", re.I),
    ],
}

# Negative / Disqualification patterns (Unrelated actions, careers, tenders, generic footers)
DISQUALIFYING_PATTERNS: list[re.Pattern] = [
    re.compile(r"\bcareer(?:s)?\b", re.I),
    re.compile(r"\bjob(?:s)?\b", re.I),
    re.compile(r"\brecruitment\b", re.I),
    re.compile(r"\bvacancy\b|\bvacancies\b", re.I),
    re.compile(r"\bapply\s+for\s+post\b", re.I),
    re.compile(r"\btender(?:s)?\b", re.I),
    re.compile(r"\be-tender\b", re.I),
    re.compile(r"\bprocurement\b", re.I),
    re.compile(r"\bvendor\s+registration\b", re.I),
    re.compile(r"\bcontractor\s+registration\b", re.I),
    re.compile(r"\binternship\b", re.I),
    re.compile(r"\brti\b", re.I),
    re.compile(r"\bfeedback\b", re.I),
    re.compile(r"\bcontact\s+us\b", re.I),
    re.compile(r"\babout\s+us\b", re.I),
    re.compile(r"\bdisclaimer\b", re.I),
    re.compile(r"\bprivacy\s+policy\b", re.I),
    re.compile(r"\bsitemap\b", re.I),
]


@dataclass
class ActionDestination:
    requirement_id: str
    requirement_name: str
    action_type: str
    action_label: str
    authoritative_source_url: str
    action_url: str
    final_resolved_url: str
    navigation_path: list[str] = field(default_factory=list)
    official_domain: str = ""
    verification_status: str = "ACTION_PAGE_NOT_VERIFIED"
    confidence: float = 0.0
    discovered_at: str = ""
    content_hash: str = ""
    explanation: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "requirement_id": self.requirement_id,
            "requirement_name": self.requirement_name,
            "action_type": self.action_type,
            "action_label": self.action_label,
            "authoritative_source_url": self.authoritative_source_url,
            "action_url": self.action_url,
            "final_resolved_url": self.final_resolved_url,
            "navigation_path": self.navigation_path,
            "official_domain": self.official_domain,
            "verification_status": self.verification_status,
            "confidence": self.confidence,
            "discovered_at": self.discovered_at,
            "content_hash": self.content_hash,
            "explanation": self.explanation,
        }


class ActionLinkResolver:
    """Discovers, scores, and verifies exact official action URLs."""

    def __init__(self, registry: OfficialSourceRegistry | None = None):
        self.registry = registry or REGISTRY

    def resolve_action(
        self,
        requirement_id: str,
        requirement_name: str,
        authoritative_source_url: str,
        acquired_page: NormalizedAcquiredPage | None = None,
        requirement_keywords: list[str] | None = None,
    ) -> ActionDestination:
        """Resolve exact verified action URL for a statutory requirement.

        Crucial Invariant: If no verified link is found, return ACTION_PAGE_NOT_VERIFIED
        and NEVER construct or invent an action URL.
        """
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        domain = urllib.parse.urlparse(authoritative_source_url).netloc.lower()

        base_destination = ActionDestination(
            requirement_id=requirement_id,
            requirement_name=requirement_name,
            action_type="UNRESOLVED",
            action_label="",
            authoritative_source_url=authoritative_source_url,
            action_url="",
            final_resolved_url="",
            navigation_path=[],
            official_domain=domain,
            verification_status="ACTION_PAGE_NOT_VERIFIED",
            confidence=0.0,
            discovered_at=now_iso,
            content_hash="",
            explanation="No acquired page available for resolution.",
        )

        if not acquired_page or not acquired_page.links:
            base_destination.explanation = "Portal page contained no navigable links or buttons."
            return base_destination

        # Prepare requirement domain keywords
        kw_set = set(requirement_keywords or [])
        # Extract title tokens
        title_tokens = [t.lower() for t in re.findall(r"\b[A-Za-z0-9]+\b", requirement_name) if len(t) > 2]
        kw_set.update(title_tokens)
        if "cte" in requirement_id.lower() or "consent" in requirement_name.lower():
            kw_set.update(["cte", "cto", "consent", "noc", "pollution", "water", "air"])
        if "factory" in requirement_id.lower() or "factory" in requirement_name.lower():
            kw_set.update(["factory", "license", "plan", "dish", "form 2"])
        if "boiler" in requirement_id.lower() or "boiler" in requirement_name.lower():
            kw_set.update(["boiler", "inspection", "steam", "economiser"])
        if "dpdp" in requirement_id.lower() or "data" in requirement_name.lower():
            kw_set.update(["dpdp", "privacy", "data", "consent", "compliance"])

        # Score candidate links
        scored_candidates: list[dict[str, Any]] = []

        for link in acquired_page.links:
            score, action_type, reason = self._score_link(link, kw_set, authoritative_source_url)
            if score <= 0.0:
                continue

            scored_candidates.append({
                "link": link,
                "score": score,
                "action_type": action_type,
                "reason": reason,
            })

        if not scored_candidates:
            base_destination.explanation = "No action links matched the statutory requirement context."
            return base_destination

        # Sort candidate links descending by score
        scored_candidates.sort(key=lambda c: -c["score"])

        # Validate top candidates against OfficialSourceRegistry and security rules
        for candidate in scored_candidates:
            link: DiscoveredLink = candidate["link"]
            target_url = link.url
            score = candidate["score"]
            action_type = candidate["action_type"]

            # Section 10: Generic homepage is NOT accepted when a specific action page is required
            if self._is_generic_homepage(target_url, authoritative_source_url):
                logger.info("Discarding generic homepage candidate: %s", target_url)
                continue

            # Verify official domain and SSRF
            valid, reason = self.registry.validate_target_url(target_url)
            if not valid:
                if "UNAPPROVED_DOMAIN" in reason or "NON_HTTPS" in reason:
                    logger.warning("Rejected unapproved/malicious action link '%s': %s", target_url, reason)
                    return ActionDestination(
                        requirement_id=requirement_id,
                        requirement_name=requirement_name,
                        action_type=action_type,
                        action_label=link.text or "Action Link",
                        authoritative_source_url=authoritative_source_url,
                        action_url="",
                        final_resolved_url="",
                        navigation_path=[acquired_page.url, target_url],
                        official_domain=urllib.parse.urlparse(target_url).netloc,
                        verification_status="MALICIOUS_REJECTED" if "UNAPPROVED" in reason else "DOMAIN_REJECTED",
                        confidence=0.0,
                        discovered_at=now_iso,
                        content_hash=acquired_page.content_hash,
                        explanation=f"Action destination rejected by perimeter security: {reason}",
                    )
                continue

            # Verified action link discovered!
            final_domain = urllib.parse.urlparse(target_url).netloc
            return ActionDestination(
                requirement_id=requirement_id,
                requirement_name=requirement_name,
                action_type=action_type,
                action_label=link.text or f"{action_type.title()} Online",
                authoritative_source_url=authoritative_source_url,
                action_url=target_url,
                final_resolved_url=target_url,
                navigation_path=[acquired_page.url, target_url],
                official_domain=final_domain,
                verification_status="VERIFIED_ACTION_PAGE",
                confidence=round(min(score, 0.99), 2),
                discovered_at=now_iso,
                content_hash=acquired_page.content_hash,
                explanation=f"Verified official action destination discovered ({candidate['reason']}).",
            )

        # Fallback if no candidate passed verification
        base_destination.explanation = (
            "Found navigational links on official portal, but none met verified operational action criteria."
        )
        return base_destination

    def _score_link(
        self,
        link: DiscoveredLink,
        kw_set: set[str],
        base_portal_url: str,
    ) -> tuple[float, str, str]:
        """Score a discovered link based on action intent, context keywords, and DOM structure."""
        url_lower = link.url.lower()
        text_lower = link.text.lower()
        haystack = f"{text_lower} {url_lower} {link.classes.lower()} {link.onclick.lower()}"

        # 1. Disqualification check (Careers, Tenders, Recruitment, etc.)
        for disq in DISQUALIFYING_PATTERNS:
            if disq.search(haystack):
                return 0.0, "DISQUALIFIED", "Disqualifying non-operational keyword matched"

        # 2. Action Intent Matching
        detected_action = ""
        action_score = 0.0
        for action, patterns in ACTION_PATTERNS.items():
            for pat in patterns:
                if pat.search(text_lower):
                    action_score = 0.50
                    detected_action = action
                    break
                elif pat.search(url_lower):
                    action_score = 0.35
                    detected_action = action
                    break
            if detected_action:
                break

        if not detected_action:
            return 0.0, "NO_ACTION_INTENT", "No action keyword found"

        # 3. Requirement Context Matching
        matched_kws = [kw for kw in kw_set if kw in haystack]
        context_score = min(len(matched_kws) * 0.15, 0.40)

        # 4. Interactive element boost (Buttons, CTA classes, form actions)
        element_boost = 0.0
        if link.is_button or link.tag == "button":
            element_boost += 0.10
        if link.onclick:
            element_boost += 0.05
        if "btn" in link.classes or "primary" in link.classes:
            element_boost += 0.05

        total_score = action_score + context_score + element_boost
        reason = f"Action={detected_action}, Context={matched_kws}, Interactive={link.is_button}"
        return total_score, detected_action, reason

    def _is_generic_homepage(self, candidate_url: str, base_url: str) -> bool:
        """Check if candidate URL is merely a generic homepage root."""
        parsed_c = urllib.parse.urlparse(candidate_url)
        path = parsed_c.path.strip("/")
        if not path or path in ("index.html", "index.htm", "index.php", "default.aspx", "home"):
            return True

        parsed_b = urllib.parse.urlparse(base_url)
        if parsed_c.netloc == parsed_b.netloc and parsed_c.path == parsed_b.path:
            return True

        return False
