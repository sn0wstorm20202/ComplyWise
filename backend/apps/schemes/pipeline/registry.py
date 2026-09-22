"""Official Scheme Sources Registry.

Authority: User Specification — Central & Maharashtra Government Schemes Pipeline.
Authoritative catalogs:
1. Ministry of MSME (Central) — msme.gov.in
2. CHAMPIONS Portal (Ministry of MSME) — champions.gov.in
3. DPIIT Offerings (Ministry of Commerce & Industry) — dpiit.gov.in/offerings
4. Maharashtra State (MCED / MAITRI / Directorate of Industries) — mced.co.in / maitri.mahaonline.gov.in
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class SchemeSourceConfig:
    key: str
    name: str
    authority: str
    jurisdiction: Literal["CENTRAL", "MH"]
    primary_url: str
    domain: str
    description: str
    schedule_interval_hours: int = 24


OFFICIAL_SCHEME_SOURCES: dict[str, SchemeSourceConfig] = {
    "CENTRAL_MSME": SchemeSourceConfig(
        key="CENTRAL_MSME",
        name="Ministry of MSME Government Portal",
        authority="Ministry of Micro, Small and Medium Enterprises, Government of India",
        jurisdiction="CENTRAL",
        primary_url="https://msme.gov.in/all-schemes",
        domain="msme.gov.in",
        description="National MSME support programs: credit guarantees, margin subsidies, technology modernization, and procurement preferences.",
        schedule_interval_hours=24,
    ),
    "MSME_CHAMPIONS": SchemeSourceConfig(
        key="MSME_CHAMPIONS",
        name="MSME Champions Portal Unified Catalog",
        authority="Office of Development Commissioner (MSME), Government of India",
        jurisdiction="CENTRAL",
        primary_url="https://champions.gov.in/Government-Schemes.htm",
        domain="champions.gov.in",
        description="Central unified repository of quality certification, cluster development, and testing subsidies.",
        schedule_interval_hours=24,
    ),
    "DPIIT_OFFERINGS": SchemeSourceConfig(
        key="DPIIT_OFFERINGS",
        name="DPIIT Industrial Development Offerings",
        authority="Department for Promotion of Industry and Internal Trade (DPIIT)",
        jurisdiction="CENTRAL",
        primary_url="https://dpiit.gov.in/offerings",
        domain="dpiit.gov.in",
        description="National industrial development incentives: UNNATI, BHAVYA, PLI manufacturing, and fast-track industrial clearances.",
        schedule_interval_hours=24,
    ),
    "MAHARASHTRA_MCED": SchemeSourceConfig(
        key="MAHARASHTRA_MCED",
        name="Maharashtra State Industrial & Entrepreneurship Development (MCED / MAITRI)",
        authority="Directorate of Industries & MCED, Government of Maharashtra",
        jurisdiction="MH",
        primary_url="https://mced.co.in/schemes-incentives",
        domain="mced.co.in",
        description="Maharashtra State specific industrial incentives: Package Scheme of Incentives (PSI), Electricity Duty waiver, Stamp Duty exemption, Power Tariff Subsidy, and CMEGP.",
        schedule_interval_hours=24,
    ),
}
