"""Prepare clearly synthetic records in an isolated local SQLite database only."""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()
from django.conf import settings
from django.db import connection
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from apps.businesses.models import Business, BusinessMembership, BusinessProfileVersion, Assessment, UserWorkspaceState
from apps.ingestion.models import DiscoveryRun, CandidateRequirement, SourceChange
from apps.ingestion.services import _store_discovered_source
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.applicability.engine import ApplicabilityEngine

if not settings.DEBUG or connection.vendor != "sqlite" or settings.COMPLYWISE_DEMO_MODE:
    raise RuntimeError("This seed requires DEBUG, isolated SQLite and demo mode disabled.")
output = os.environ["ARCHITECTURE_BROWSER_FIXTURE"]
user = get_user_model().objects.create_user(email="architecture-browser@example.test", password="Synthetic-browser-only-2026!", full_name="Synthetic Reviewer", is_staff=True)
token = Token.objects.create(user=user)
business = Business.objects.create(owner=user, name="Synthetic Architecture Browser Business")
BusinessMembership.objects.create(business=business, user=user, role="OWNER")
profile = BusinessProfileVersion.objects.create(business=business, version=1,
    variables={"state":{"value":"KARNATAKA"}, "product_description":{"value":"Synthetic records service"}, "synthetic_fact":{"value":True}})
assessment = Assessment.objects.create(business=business, created_by=user, profile_version=profile)
args = dict(url="https://dgca.gov.in/synthetic-architecture-fixture", title="Synthetic browser source", query="synthetic fixture", authority_tier="OFFICIAL")
source, evidence = _store_discovered_source(text="Synthetic old fixture passage. This is a software test, not a legal statement.", **args)
source.status = "ACTIVE"; source.save(); evidence.verification_status = "VERIFIED"; evidence.save()
requirement = RequirementDefinition.objects.create(requirement_id="SYNTHETIC-BROWSER", name="Synthetic browser obligation", authority="Synthetic authority",
    status="PUBLISHED", jurisdiction="CENTRAL", domain="SYNTHETIC", evidence_refs=[evidence.evidence_id])
RuleVersion.objects.create(rule_id="SYNTHETIC-BROWSER", requirement=requirement, jurisdiction="CENTRAL", domain="SYNTHETIC", status="PUBLISHED",
    condition_ast={"op":"EQ", "left":{"var":"synthetic_fact"}, "right":True}, evidence_refs=[evidence.evidence_id])
run = ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=profile, assessment=assessment)
assessment.decision_run = run; assessment.save()
UserWorkspaceState.objects.create(user=user, active_business=business, active_assessment=assessment)
new, newer = _store_discovered_source(text="Synthetic replacement fixture passage. This is a software test, not a legal statement.", **args)
discovery = DiscoveryRun.objects.create(business=business, assessment=assessment, status="COMPLETED")
candidate = CandidateRequirement.objects.create(discovery_run=discovery, business=business, source=new, evidence=newer,
    requirement_name="Synthetic browser obligation", authority="Synthetic authority", jurisdiction="CENTRAL",
    applicability_statement=newer.excerpt)
change = SourceChange.objects.get(new_source=new)
Path(output).write_text(json.dumps({"token":token.key, "business_id":str(business.id), "assessment_id":str(assessment.id),
    "candidate_id":str(candidate.id), "change_id":str(change.id), "original_run_id":str(run.id)}), encoding="utf-8")
print("Synthetic local browser fixtures prepared.")
