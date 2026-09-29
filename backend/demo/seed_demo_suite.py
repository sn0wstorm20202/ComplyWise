"""Seed script for all 6 ComplyWise demo scenario businesses and test accounts.

Authority: COMPLYWISE SELECTION DEMO SPECIFICATION
Creates:
1. Standard demo users: demo@complywise.test, admin@complywise.test, founder@example.com
2. 6 Curated Scenario Businesses with deterministic UUIDs:
   - Meridian Pharma Formulations Pvt. Ltd. (7f27ea65-f87d-4c48-9764-ae9edb14c506)
   - VoltGrid Mobility Services Pvt. Ltd. (8a11ea65-f87d-4c48-9764-ae9edb14c507)
   - ApexBuild Infrastructure Pvt. Ltd. (9b22ea65-f87d-4c48-9764-ae9edb14c508)
   - SilkRoute Exports Pvt. Ltd. (ac33ea65-f87d-4c48-9764-ae9edb14c509)
   - CloudAxis Data Centres India Pvt. Ltd. (bd44ea65-f87d-4c48-9764-ae9edb14c510)
   - Sahaya Microfinance Services Ltd. (ce55ea65-f87d-4c48-9764-ae9edb14c511)
3. Evaluates all businesses so DecisionRun, DecisionResults, CIR, and Workflows are persisted.
"""

import os
import sys
import uuid
from pathlib import Path

# Ensure Django settings loaded
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from django.contrib.auth import get_user_model
from apps.businesses.models import Business, BusinessProfileVersion, Assessment
from apps.applicability.engine import ApplicabilityEngine
from common.enums import VariableOrigin
from demo.resolver import DemoScenarioResolver

User = get_user_model()


def seed_all():
    print("--- SEEDING COMPLYWISE DEMO SCENARIO SUITE ---")

    # 1. Users
    demo_user, _ = User.objects.get_or_create(
        email="demo@complywise.test",
        defaults={"full_name": "Demo User", "role": "USER"},
    )
    demo_user.set_password("DemoPassword123!")
    demo_user.save()

    admin_user, _ = User.objects.get_or_create(
        email="admin@complywise.test",
        defaults={"full_name": "Admin User", "role": "SUPER_ADMIN", "is_staff": True, "is_superuser": True},
    )
    admin_user.set_password("DemoPassword123!")
    admin_user.save()

    founder_user, _ = User.objects.get_or_create(
        email="founder@example.com",
        defaults={"full_name": "Founder User", "role": "USER"},
    )
    founder_user.set_password("DemoPassword123!")
    founder_user.save()

    compliance_officer, _ = User.objects.get_or_create(
        email="compliance.officer@example.com",
        defaults={"full_name": "Lead Compliance Officer", "role": "USER"},
    )
    compliance_officer.set_password("CompliancePass123!")
    compliance_officer.save()

    admin_in, _ = User.objects.get_or_create(
        email="admin@complywise.in",
        defaults={"full_name": "Admin Official", "role": "SUPER_ADMIN", "is_staff": True, "is_superuser": True},
    )
    admin_in.set_password("Admin@1234")
    admin_in.save()

    print("Users seeded: demo@complywise.test, admin@complywise.test, compliance.officer@example.com, admin@complywise.in")

    # 2. Businesses
    businesses_data = [
        {
            "id": uuid.UUID("7f27ea65-f87d-4c48-9764-ae9edb14c506"),
            "name": "Meridian Pharma Formulations Pvt. Ltd.",
            "state": "TELANGANA",
            "district": "Hyderabad",
            "industry": "Pharmaceuticals & Biotechnology",
            "desc": "Manufacturing finished oral solid dosage formulations, tablets, and capsules with cleanrooms, DG sets, and contract workers.",
            "workers": 164,
            "turnover": 420000000,
            "is_mfg": True,
            "cross_border": True,
        },
        {
            "id": uuid.UUID("8a11ea65-f87d-4c48-9764-ae9edb14c507"),
            "name": "VoltGrid Mobility Services Pvt. Ltd.",
            "state": "MAHARASHTRA",
            "district": "Mumbai",
            "industry": "Energy & EV Infrastructure",
            "desc": "Public EV charging station network operator across Maharashtra with AC/DC fast chargers, CMS cloud platform, and DISCOM HT connections.",
            "workers": 64,
            "turnover": 180000000,
            "is_mfg": False,
            "cross_border": False,
        },
        {
            "id": uuid.UUID("9b22ea65-f87d-4c48-9764-ae9edb14c508"),
            "name": "ApexBuild Infrastructure Pvt. Ltd.",
            "state": "RAJASTHAN",
            "district": "Jaipur",
            "industry": "Civil Construction & Infrastructure",
            "desc": "Civil engineering and infrastructure contractor constructing commercial complexes, highways, and earthworks across project sites.",
            "workers": 220,
            "turnover": 650000000,
            "is_mfg": False,
            "cross_border": False,
        },
        {
            "id": uuid.UUID("ac33ea65-f87d-4c48-9764-ae9edb14c509"),
            "name": "SilkRoute Exports Pvt. Ltd.",
            "state": "TAMIL_NADU",
            "district": "Tiruppur",
            "industry": "Textile & Apparel Export",
            "desc": "Apparel merchant export house purchasing 100% finished garments from local manufacturers for global shipment via ICEGATE and AEPC.",
            "workers": 48,
            "turnover": 280000000,
            "is_mfg": False,
            "cross_border": True,
        },
        {
            "id": uuid.UUID("bd44ea65-f87d-4c48-9764-ae9edb14c510"),
            "name": "CloudAxis Data Centres India Pvt. Ltd.",
            "state": "TELANGANA",
            "district": "Hyderabad",
            "industry": "Critical IT Infrastructure & Colocation",
            "desc": "Tier-3 commercial data centre providing wholesale server colocation, 33kV dedicated substations, bulk diesel DG sets, and battery storage.",
            "workers": 85,
            "turnover": 1200000000,
            "is_mfg": False,
            "cross_border": False,
        },
        {
            "id": uuid.UUID("ce55ea65-f87d-4c48-9764-ae9edb14c511"),
            "name": "Sahaya Microfinance Services Ltd.",
            "state": "UTTAR_PRADESH",
            "district": "Lucknow",
            "industry": "Financial Services & Micro-lending",
            "desc": "Regulated micro-credit financial institution providing collateral-free loans to Joint Liability Groups and rural women entrepreneurs.",
            "workers": 110,
            "turnover": 850000000,
            "is_mfg": False,
            "cross_border": False,
        },
    ]

    for data in businesses_data:
        b_id = data["id"]
        b_name = data["name"]
        biz, created = Business.objects.update_or_create(
            id=b_id,
            defaults={
                "name": b_name,
                "owner": demo_user,
            },
        )
        biz.members.add(compliance_officer)

        vars_dict = {
            "state": {"value": data["state"], "origin": VariableOrigin.USER_PROVIDED},
            "district": {"value": data["district"], "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": data["desc"], "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": data["workers"], "origin": VariableOrigin.USER_PROVIDED},
            "annual_turnover": {"value": data["turnover"], "origin": VariableOrigin.USER_PROVIDED},
            "is_manufacturing": {"value": data["is_mfg"], "origin": VariableOrigin.USER_PROVIDED},
            "is_cross_border": {"value": data["cross_border"], "origin": VariableOrigin.USER_PROVIDED},
        }

        profile = BusinessProfileVersion.objects.filter(business=biz, version=1).first()
        if not profile:
            profile = BusinessProfileVersion.objects.create(
                business=biz,
                version=1,
                variables=vars_dict,
                created_by=demo_user,
            )

        # Create assessment
        assessment = Assessment.objects.filter(business=biz, assessment_number=1).first()
        if not assessment:
            assessment = Assessment.objects.create(
                business=biz,
                assessment_number=1,
                title=f"Initial Assessment for {b_name}",
                created_by=demo_user,
            )

        # Run evaluation to produce DecisionRun and DecisionResults
        print(f"Evaluating {b_name}...")
        engine = ApplicabilityEngine()
        decision_run = engine.evaluate_business_profile(business=biz, profile_version=profile)
        results = decision_run.results.all()
        print(f" -> {b_name}: {results.count()} requirements evaluated.")
        applicable = results.filter(status="APPLICABLE").count()
        needs_info = results.filter(status="NEEDS_INFORMATION").count()
        not_applicable = results.filter(status="NOT_APPLICABLE").count()
        print(f"    APPLICABLE: {applicable}, NEEDS_INFO: {needs_info}, NOT_APPLICABLE: {not_applicable}")

    print("\n--- SEEDING COMPLETED SUCCESSFULLY ---")


if __name__ == "__main__":
    seed_all()
