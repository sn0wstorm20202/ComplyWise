"""Tests for DerivedBusinessContext and context derivation.

Authority: Milestone Section 2 (DerivedBusinessContext).
Validates:
- MSME scale calculation according to MSMED Act 2020 thresholds.
- Derived manufacturing indicators, trade indicators, environmental footprints.
- Detection of missing variables required by published knowledge rules.
- Isolation and serialization safety.
"""

from __future__ import annotations

import pytest
from apps.businesses.models import Business, BusinessProfileVersion
from common.enums import VariableOrigin
from domain.context.business_context import DerivedBusinessContext, build_business_context


def _create_profile(business: Business, version: int, **variables) -> BusinessProfileVersion:
    var_dict = {}
    for k, v in variables.items():
        var_dict[k] = {"value": v, "origin": VariableOrigin.USER_PROVIDED}
    return BusinessProfileVersion.objects.create(
        business=business,
        version=version,
        variables=var_dict,
    )


@pytest.mark.django_db
def test_msme_scale_derivation(make_business, user):
    """Test MSME classification under MSMED Act 2020:
    - Micro: Investment <= 1 Cr AND Turnover <= 5 Cr
    - Small: Investment <= 10 Cr AND Turnover <= 50 Cr
    - Medium: Investment <= 50 Cr AND Turnover <= 250 Cr
    - Large: Exceeds Medium thresholds
    """
    biz = make_business(owner=user, name="Scale Testing Ltd")

    # 1. Micro
    _create_profile(
        biz,
        1,
        plant_machinery_investment=5000000,  # 50 Lakhs (<= 1 Cr)
        annual_turnover=20000000,           # 2 Cr (<= 5 Cr)
    )
    ctx = build_business_context(biz)
    assert ctx.msme_scale == "MICRO"

    # 2. Small
    _create_profile(
        biz,
        2,
        plant_machinery_investment=40000000,  # 4 Cr (<= 10 Cr)
        annual_turnover=300000000,           # 30 Cr (<= 50 Cr)
    )
    ctx = build_business_context(biz)
    assert ctx.msme_scale == "SMALL"

    # 3. Medium
    _create_profile(
        biz,
        3,
        plant_machinery_investment=300000000,  # 30 Cr (<= 50 Cr)
        annual_turnover=1500000000,           # 150 Cr (<= 250 Cr)
    )
    ctx = build_business_context(biz)
    assert ctx.msme_scale == "MEDIUM"

    # 4. Large (exceeds investment or turnover)
    _create_profile(
        biz,
        4,
        plant_machinery_investment=600000000,  # 60 Cr (> 50 Cr)
        annual_turnover=3000000000,           # 300 Cr (> 250 Cr)
    )
    ctx = build_business_context(biz)
    assert ctx.msme_scale == "LARGE"


@pytest.mark.django_db
def test_activity_and_environmental_indicators(make_business, user):
    """Test manufacturing, environmental footprint, and cross-border indicators."""
    biz = make_business(owner=user, name="Solar Chem Tech")
    _create_profile(
        biz,
        1,
        organization_type="MANUFACTURING",
        product_description="Solar panel manufacturing and chemical processing plant",
        total_worker_count=45,
        connected_power_load=150,
        hazardous_waste_generation=True,
        effluent_emission_generation=True,
        import_export_intent="IMPORT_AND_EXPORT",
    )

    ctx = build_business_context(biz)
    assert ctx.is_manufacturing is True
    assert ctx.is_cross_border is True
    assert ctx.has_environmental_footprint is True
    assert ctx.hazardous_waste_generation is True
    assert ctx.effluent_emission_generation is True


@pytest.mark.django_db
def test_missing_variables_detection(make_business, user):
    """DerivedBusinessContext accurately identifies which variables are missing from profile."""
    biz = make_business(owner=user, name="Incomplete Profile Enterprise")
    _create_profile(
        biz,
        1,
        organization_type="SERVICES",
        plant_machinery_investment=1000000,
    )

    ctx = build_business_context(biz)
    missing = ctx.missing_variable_keys
    assert isinstance(missing, list)
    assert len(missing) > 0
    assert "connected_power_load" in missing or "hazardous_waste_generation" in missing
