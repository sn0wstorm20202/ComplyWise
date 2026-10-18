"""Adversarial history tests: catalogue edits and forged hashes cannot rewrite truth."""
from copy import deepcopy
import hashlib

import pytest
from django.core.exceptions import ValidationError

from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.services import build_compliance_intelligence_record, verify_cir_integrity, _canonical_json_bytes, get_latest_cir
from apps.businesses.models import BusinessProfileVersion, Assessment
from apps.evidence.models import Evidence, Source
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.requirements.selectors import load_requirement_evidence

pytestmark = pytest.mark.django_db


@pytest.fixture
def evaluated(business):
    source = Source.objects.create(source_id="SYNTHETIC-SOURCE", title="Synthetic test statute", authority="Test Authority")
    evidence = Evidence.objects.create(evidence_id="SYNTHETIC-EVIDENCE", source=source,
                                      excerpt="Synthetic rule example only.", verification_status="VERIFIED")
    requirement = RequirementDefinition.objects.create(requirement_id="SYNTHETIC-REQUIREMENT", name="Synthetic obligation",
        authority="Test Authority", jurisdiction="CENTRAL", domain="TEST", status="PUBLISHED", evidence_refs=[evidence.evidence_id])
    rule = RuleVersion.objects.create(rule_id="SYNTHETIC-RULE", requirement=requirement, jurisdiction="CENTRAL", domain="TEST",
        status="PUBLISHED", condition_ast={"op":"EQ", "left":{"var":"is_manufacturing"}, "right":True}, evidence_refs=[evidence.evidence_id])
    profile = BusinessProfileVersion.objects.create(business=business, version=1, variables={"is_manufacturing":{"value":True}})
    run = ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=profile)
    return run, requirement, evidence, rule


def test_catalogue_edits_cannot_change_saved_cir_or_citations(evaluated):
    run, requirement, evidence, rule = evaluated
    original = build_compliance_intelligence_record(run)
    requirement.name = "Later replacement"; requirement.save()
    evidence.excerpt = "Later passage"; evidence.save()
    rule.condition_ast = {"op":"EQ", "left":{"var":"is_manufacturing"}, "right":False}; rule.save()
    run.refresh_from_db()
    assert build_compliance_intelligence_record(run) == original
    definitions, citations = load_requirement_evidence(list(run.results.all()))
    assert definitions[requirement.requirement_id].name == "Synthetic obligation"
    assert citations[evidence.evidence_id].excerpt == "Synthetic rule example only."
    assert run.evaluation_manifest["rules"][str(rule.pk)]["condition_ast"]["right"] is True


def test_saved_document_checklist_does_not_follow_later_catalogue_edits(evaluated):
    from domain.intelligence.document_derivation import derive_business_documents
    from apps.businesses.models import Assessment
    run, requirement, evidence, rule = evaluated
    requirement.metadata = {"required_documents":["Synthetic original checklist"]}; requirement.save()
    assessment = Assessment.objects.create(business=run.business, profile_version=run.profile_version)
    archived = ApplicabilityEngine().evaluate_business_profile(business=run.business, profile_version=run.profile_version, assessment=assessment)
    assessment.decision_run = archived; assessment.save()
    before = derive_business_documents(run.business, assessment_id=str(assessment.id))
    assert any(doc["name"] == "Synthetic original checklist" for doc in before["documents"])
    requirement.metadata = {"required_documents":["Synthetic later checklist"]}; requirement.save()
    after = derive_business_documents(run.business, assessment_id=str(assessment.id))
    assert before["documents"] == after["documents"]


def test_recomputing_hash_does_not_forge_authority_signature(evaluated):
    cir = build_compliance_intelligence_record(evaluated[0])
    assert verify_cir_integrity(cir)
    forged = deepcopy(cir)
    forged["determinations"][0]["status"] = "FORGED"
    unsigned = {k:v for k,v in forged.items() if k not in {"content_hash", "authority_signature"}}
    forged["content_hash"] = "sha256:" + hashlib.sha256(_canonical_json_bytes(unsigned)).hexdigest()
    assert not verify_cir_integrity(forged)
    forged = deepcopy(cir); forged["authority_signature"] = None
    assert not verify_cir_integrity(forged)


def test_archive_is_write_once(evaluated):
    run = evaluated[0]
    run.evaluation_manifest["profile"] = {}
    with pytest.raises(ValidationError):
        run.save()


def test_explicit_empty_assessment_never_falls_back(evaluated):
    run = evaluated[0]
    empty = Assessment.objects.create(business=run.business, assessment_number=1)
    assert get_latest_cir(run.business, str(empty.id)) is None
    assert get_latest_cir(run.business, "00000000-0000-0000-0000-000000000000") is None


def test_signature_rotation_and_missing_key(evaluated, settings):
    cir = build_compliance_intelligence_record(evaluated[0])
    old_key = settings.CIR_AUTHORITY_KEY
    settings.CIR_SIGNING_KEY_ID = "next"
    settings.CIR_AUTHORITY_KEY = "new-test-only-key"
    settings.CIR_VERIFICATION_KEYS = {"primary": old_key}
    assert verify_cir_integrity(cir)
    settings.CIR_VERIFICATION_KEYS = {}
    assert not verify_cir_integrity(cir)


def test_canonicalization_uses_rfc8785_unicode_and_numbers():
    assert _canonical_json_bytes({"text":"é", "value":1.0}) == '{"text":"é","value":1}'.encode()
