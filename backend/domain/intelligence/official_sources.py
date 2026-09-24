"""Official Source Policy & Classification for Live Regulatory Intelligence.

Authority: Step 03 Specification §6, §7, §8; PRD_v2.0 §27A; TRD_v2.0 §11A.

Classification tiers:
- PRIMARY_OFFICIAL: Authoritative government or statutory regulator portals.
                    ONLY primary official sources can directly support compliance requirements.
- SECONDARY: Reputable statutory development bodies, policy repositories, or authorized guides.
             Retained as discovery leads, but cannot be sole evidence for a verified requirement.
- UNVERIFIED: General web, blogs, private legal portals, commercial aggregators.
              Strictly excluded from evidence backing.
"""

from __future__ import annotations

from enum import StrEnum
import logging
import re
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class SourceTier(StrEnum):
    PRIMARY_OFFICIAL = "PRIMARY_OFFICIAL"
    SECONDARY = "SECONDARY"
    UNVERIFIED = "UNVERIFIED"


# 1. Primary official suffixes
OFFICIAL_TLD_SUFFIXES = (
    ".gov.in",
    ".nic.in",
    ".res.in",
)

# 2. Known statutory, regulator, and single-window government portals
# that may use different suffixes or specific subdomains
KNOWN_PRIMARY_OFFICIAL_HOSTS: dict[str, dict[str, str]] = {
    # Central Authorities
    "cpcb.nic.in": {"authority": "CPCB", "jurisdiction": "CENTRAL", "name": "Central Pollution Control Board"},
    "eprewastecpcb.in": {"authority": "CPCB", "jurisdiction": "CENTRAL", "name": "CPCB E-Waste EPR Portal"},
    "eprplastic.cpcb.gov.in": {"authority": "CPCB", "jurisdiction": "CENTRAL", "name": "CPCB Plastic Packaging EPR"},
    "eprbattery.cpcb.gov.in": {"authority": "CPCB", "jurisdiction": "CENTRAL", "name": "CPCB Battery Waste EPR"},
    "bis.gov.in": {"authority": "BIS", "jurisdiction": "CENTRAL", "name": "Bureau of Indian Standards"},
    "crsbis.in": {"authority": "BIS", "jurisdiction": "CENTRAL", "name": "BIS Compulsory Registration Scheme (CRS)"},
    "manakonline.in": {"authority": "BIS", "jurisdiction": "CENTRAL", "name": "BIS Manakonline Portal"},
    "dgft.gov.in": {"authority": "DGFT", "jurisdiction": "CENTRAL", "name": "Directorate General of Foreign Trade"},
    "fssai.gov.in": {"authority": "FSSAI", "jurisdiction": "CENTRAL", "name": "Food Safety and Standards Authority of India"},
    "foscos.fssai.gov.in": {"authority": "FSSAI", "jurisdiction": "CENTRAL", "name": "FoSCoS Food Safety Compliance System"},
    "jaivikbharat.fssai.gov.in": {"authority": "FSSAI", "jurisdiction": "CENTRAL", "name": "Jaivik Bharat Organic Portal"},
    "saralsanchar.gov.in": {"authority": "WPC_DOT", "jurisdiction": "CENTRAL", "name": "Saral Sanchar WPC Telecom Licensing"},
    "lm.doca.gov.in": {"authority": "LEGAL_METROLOGY", "jurisdiction": "CENTRAL", "name": "Department of Consumer Affairs LMPC"},
    "nsws.gov.in": {"authority": "DPIIT", "jurisdiction": "CENTRAL", "name": "National Single Window System"},
    "shramsuvidha.gov.in": {"authority": "MINISTRY_OF_LABOUR", "jurisdiction": "CENTRAL", "name": "Shram Suvidha Unified Labor Portal"},
    "epfindia.gov.in": {"authority": "EPFO", "jurisdiction": "CENTRAL", "name": "Employees Provident Fund Organisation"},
    "esic.gov.in": {"authority": "ESIC", "jurisdiction": "CENTRAL", "name": "Employees State Insurance Corporation"},
    "peso.gov.in": {"authority": "PESO", "jurisdiction": "CENTRAL", "name": "Petroleum and Explosives Safety Organization"},
    "mca.gov.in": {"authority": "MCA", "jurisdiction": "CENTRAL", "name": "Ministry of Corporate Affairs"},
    "udyamregistration.gov.in": {"authority": "MSME", "jurisdiction": "CENTRAL", "name": "Udyam MSME Registration Portal"},
    "cgwa-noc.gov.in": {"authority": "CGWA", "jurisdiction": "CENTRAL", "name": "Central Ground Water Authority NOC Portal"},
    "cbic.gov.in": {"authority": "CBIC", "jurisdiction": "CENTRAL", "name": "Central Board of Indirect Taxes and Customs"},
    "icegate.gov.in": {"authority": "CUSTOMS", "jurisdiction": "CENTRAL", "name": "Indian Customs Electronic Gateway"},
    "indiacode.nic.in": {"authority": "LEGISLATIVE_DEPT", "jurisdiction": "CENTRAL", "name": "India Code Digital Repository"},
    "egazette.gov.in": {"authority": "GOVT_OF_INDIA", "jurisdiction": "CENTRAL", "name": "The Gazette of India"},
    "parivesh.nic.in": {"authority": "MOEFCC", "jurisdiction": "CENTRAL", "name": "Parivesh Environmental Clearances"},
    "moef.gov.in": {"authority": "MOEFCC", "jurisdiction": "CENTRAL", "name": "Ministry of Environment, Forest and Climate Change"},
    "msme.gov.in": {"authority": "MSME", "jurisdiction": "CENTRAL", "name": "Ministry of Micro, Small and Medium Enterprises"},
    "dpiit.gov.in": {"authority": "DPIIT", "jurisdiction": "CENTRAL", "name": "Department for Promotion of Industry and Internal Trade"},
    "apeda.gov.in": {"authority": "APEDA", "jurisdiction": "CENTRAL", "name": "Agricultural and Processed Food Products Export Development Authority"},

    # Maharashtra Regulators
    "mpcb.gov.in": {"authority": "MPCB", "jurisdiction": "MAHARASHTRA", "name": "Maharashtra Pollution Control Board"},
    "ecmpcb.in": {"authority": "MPCB", "jurisdiction": "MAHARASHTRA", "name": "MPCB Electronic Consent Management System"},
    "maharashtra.gov.in": {"authority": "GOVT_MAHARASHTRA", "jurisdiction": "MAHARASHTRA", "name": "Government of Maharashtra"},
    "mahakamgar.gov.in": {"authority": "LABOUR_MAHARASHTRA", "jurisdiction": "MAHARASHTRA", "name": "Maharashtra Labour Department / DISH"},
    "industry.maharashtra.gov.in": {"authority": "INDUSTRIES_MAHARASHTRA", "jurisdiction": "MAHARASHTRA", "name": "Directorate of Industries Maharashtra"},
    "midcindia.org": {"authority": "MIDC", "jurisdiction": "MAHARASHTRA", "name": "Maharashtra Industrial Development Corporation"},

    # Gujarat Regulators
    "gpcb.gujarat.gov.in": {"authority": "GPCB", "jurisdiction": "GUJARAT", "name": "Gujarat Pollution Control Board"},
    "xgn.gpcb.gov.in": {"authority": "GPCB", "jurisdiction": "GUJARAT", "name": "Gujarat Extended Green Node (XGN)"},
    "dish.gujarat.gov.in": {"authority": "DISH_GUJARAT", "jurisdiction": "GUJARAT", "name": "Directorate of Industrial Safety & Health Gujarat"},

    # West Bengal Regulators
    "wbpcb.gov.in": {"authority": "WBPCB", "jurisdiction": "WEST_BENGAL", "name": "West Bengal Pollution Control Board"},
    "wbfactories.gov.in": {"authority": "WB_FACTORIES", "jurisdiction": "WEST_BENGAL", "name": "Directorate of Factories, West Bengal"},
    "labour.wb.gov.in": {"authority": "WB_LABOUR", "jurisdiction": "WEST_BENGAL", "name": "Department of Labour, Government of West Bengal"},
    "silpasathi.wb.gov.in": {"authority": "SILPA_SATHI", "jurisdiction": "WEST_BENGAL", "name": "Silpa Sathi West Bengal Single Window"},

    # Karnataka Regulators
    "kspcb.karnataka.gov.in": {"authority": "KSPCB", "jurisdiction": "KARNATAKA", "name": "Karnataka State Pollution Control Board"},
    "kcmms.karnataka.gov.in": {"authority": "KSPCB", "jurisdiction": "KARNATAKA", "name": "KSPCB Consent Management System"},

    # Tamil Nadu Regulators
    "tnpcb.gov.in": {"authority": "TNPCB", "jurisdiction": "TAMIL_NADU", "name": "Tamil Nadu Pollution Control Board"},
    "tnocmms.nic.in": {"authority": "TNPCB", "jurisdiction": "TAMIL_NADU", "name": "Tamil Nadu Online Consent System"},
    "dish.tn.gov.in": {"authority": "DISH_TN", "jurisdiction": "TAMIL_NADU", "name": "Directorate of Industrial Safety & Health Tamil Nadu"},

    # Telangana Regulators
    "tgocmms.nic.in": {"authority": "TSPCB", "jurisdiction": "TELANGANA", "name": "Telangana Online Consent System"},

    # Delhi Regulators
    "dpccocmms.nic.in": {"authority": "DPCC", "jurisdiction": "DELHI", "name": "Delhi Pollution Control Committee Consent Portal"},
}

# 3. Secondary authoritative guidance & development portals
SECONDARY_HOSTS: dict[str, dict[str, str]] = {
    "prsindia.org": {"authority": "PRS_LEGISLATIVE_RESEARCH", "jurisdiction": "CENTRAL", "name": "PRS Legislative Research"},
    "investindia.gov.in": {"authority": "INVEST_INDIA", "jurisdiction": "CENTRAL", "name": "Invest India National Investment Promotion"},
    "ibbi.gov.in": {"authority": "IBBI", "jurisdiction": "CENTRAL", "name": "Insolvency and Bankruptcy Board of India"},
    "cgtmse.in": {"authority": "CGTMSE", "jurisdiction": "CENTRAL", "name": "Credit Guarantee Trust for MSMEs"},
    "indextb.com": {"authority": "INDEXTB", "jurisdiction": "GUJARAT", "name": "Industrial Extension Bureau Gujarat"},
    "wbidc.com": {"authority": "WBIDC", "jurisdiction": "WEST_BENGAL", "name": "West Bengal Industrial Development Corporation"},
    "guidancekerala.com": {"authority": "GUIDANCE_KERALA", "jurisdiction": "KERALA", "name": "Guidance Kerala Single Window"},
}

# 4. Strictly blocked spam / commercial / social domains
BLOCKED_DOMAINS = (
    "blogspot.com",
    "wordpress.com",
    "medium.com",
    "quora.com",
    "reddit.com",
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "youtube.com",
    "linkedin.com",
    "pinterest.com",
    "tiktok.com",
)


def canonicalize_url(url: str) -> str:
    """Normalize a URL to canonical form for deduplication."""
    if not url:
        return ""
    clean = url.strip()
    try:
        parsed = urlparse(clean)
        scheme = parsed.scheme.lower() or "https"
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        path = parsed.path.rstrip("/")
        # Remove common tracking parameters
        query = parsed.query
        if query:
            params = [
                p for p in query.split("&")
                if not any(p.lower().startswith(trk) for trk in ["utm_", "ref=", "fbclid=", "gclid="])
            ]
            query = "&".join(params)
        canon = f"{scheme}://{netloc}{path}"
        if query:
            canon += f"?{query}"
        return canon
    except Exception:
        return clean


def classify_source_url(url: str) -> tuple[SourceTier, dict[str, Any]]:
    """Classify a URL into PRIMARY_OFFICIAL, SECONDARY, or UNVERIFIED.

    Returns:
        (tier, metadata_dict)
    """
    if not url:
        return SourceTier.UNVERIFIED, {}

    try:
        parsed = urlparse(url.strip())
        host = (parsed.hostname or "").lower()
    except Exception:
        return SourceTier.UNVERIFIED, {}

    if not host:
        return SourceTier.UNVERIFIED, {}

    # Check blocked domains
    if any(blocked in host for blocked in BLOCKED_DOMAINS):
        return SourceTier.UNVERIFIED, {"reason": "Blocked spam/social domain", "host": host}

    # Check known primary official hosts directly
    for k_host, meta in KNOWN_PRIMARY_OFFICIAL_HOSTS.items():
        if host == k_host or host.endswith(f".{k_host}"):
            return SourceTier.PRIMARY_OFFICIAL, {
                "authority": meta["authority"],
                "authority_name": meta["name"],
                "jurisdiction": meta["jurisdiction"],
                "host": host,
                "is_primary": True,
            }

    # Check known secondary sources first (e.g. investindia.gov.in which uses .gov.in but is secondary guidance)
    for s_host, meta in SECONDARY_HOSTS.items():
        if host == s_host or host.endswith(f".{s_host}"):
            return SourceTier.SECONDARY, {
                "authority": meta["authority"],
                "authority_name": meta["name"],
                "jurisdiction": meta["jurisdiction"],
                "host": host,
                "is_primary": False,
            }

    # Check official TLD suffixes (.gov.in, .nic.in, .res.in)
    if any(host.endswith(sfx) or host == sfx.lstrip(".") for sfx in OFFICIAL_TLD_SUFFIXES):
        # Extract probable authority from subdomain
        parts = host.split(".")
        probable_auth = parts[0].upper() if len(parts) >= 3 else host
        # Detect state in domain name
        jur = "CENTRAL"
        state_hints = {
            "maharashtra": "MAHARASHTRA",
            "gujarat": "GUJARAT",
            "karnataka": "KARNATAKA",
            "tamilnadu": "TAMIL_NADU",
            "tn": "TAMIL_NADU",
            "westbengal": "WEST_BENGAL",
            "wb": "WEST_BENGAL",
            "telangana": "TELANGANA",
            "delhi": "DELHI",
            "mp": "MADHYA_PRADESH",
            "up": "UTTAR_PRADESH",
        }
        for hint, state_code in state_hints.items():
            if hint in host:
                jur = state_code
                break

        return SourceTier.PRIMARY_OFFICIAL, {
            "authority": probable_auth,
            "authority_name": f"{probable_auth} Official Portal",
            "jurisdiction": jur,
            "host": host,
            "is_primary": True,
        }

    # Unverified source
    return SourceTier.UNVERIFIED, {
        "authority": host,
        "authority_name": host,
        "jurisdiction": "UNKNOWN",
        "host": host,
        "is_primary": False,
    }


def is_primary_official_source(url: str) -> bool:
    """Convenience predicate for primary official sources."""
    tier, _ = classify_source_url(url)
    return tier == SourceTier.PRIMARY_OFFICIAL
