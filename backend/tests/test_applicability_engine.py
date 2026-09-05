"""Tests for the applicability engine and evaluation API endpoints.

Authority: TRD_v2.0 §10, §14, §15, §16, §17, §25, §30, §31; PRD_v2.0 §P3, §P4, §P5, §P6.

Invariants verified:
1. ONLY `PUBLISHED` rules affect runtime compliance decisions.
2. Inactive/effective-date-expired rules are excluded.
3. Missing decision-critical variables produce `NEEDS_INFORMATION`.
4. Evidence verification status is propagated (VERIFIED -> APPLICABLE, UNVERIFIED -> UNVERIFIED, CONFLICTING -> CONFLICT_REVIEW).
5. Explanations and evidence references are attached to results.
6. Multi-tenant security: Users can only evaluate and read decisions for their own businesses.
"""

from __future__ import annotations

import datetime
from django.utils import timezone
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from common.enums import (
    ApplicabilityStatus,
    DecisionRunStatus,
    KnowledgeStatus,
    RequirementType,
    RuleType,
    SourceStatus,
    VerificationStatus,
)
from apps.accounts.models import User
from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Business, BusinessMembership, BusinessProfileVersion
from apps.evidence.models import Evidence, Source
from apps.knowledge.models import RequirementDefinition, RuleVersion


@pytest.fixture
def test_user(db) -> User:
    return User.objects.create_user(
        email="compliance.officer@example.com",
        password="ValidPassword123!",
        full_name="Compliance Officer",
    )


@pytest.fixture
def other_user(db) -> User:
    return User.objects.create_user(
        email="other.user@example.com",
        password="ValidPassword123!",
        full_name="Other User",
    )


@pytest.fixture
def test_business(db, test_user) -> Business:
    biz = Business.objects.create(name="Apex Foods Private Limited", owner=test_user)
    BusinessMembership.objects.create(
        business=biz,
        user=test_user,
        role=BusinessMembership.Role.OWNER,
    )
    return biz


@pytest.fixture
def test_source(db) -> Source:
    return Source.objects.create(
        source_id="SRC-FSSAI-ACT-2006",
        title="Food Safety and Standards Act, 2006",
        authority="FSSAI",
        canonical_url="https://example.org/fssai-act-2006",
        publication_date=timezone.now().date(),
        status=SourceStatus.ACTIVE,
    )


@pytest.fixture
def test_evidence(db, test_source) -> Evidence:
    return Evidence.objects.create(
        evidence_id="EVD-FSSAI-SEC31",
        source=test_source,
        locator="Section 31(1)",
        excerpt="No person shall commence or carry on any food business without a licence.",
        verification_status=VerificationStatus.VERIFIED,
    )


@pytest.fixture
def test_requirement(db, test_evidence) -> RequirementDefinition:
    return RequirementDefinition.objects.create(
        requirement_id="REQ-FSSAI-STATE-LIC",
        name="FSSAI State Food Business Licence",
        authority="FSSAI",
        category="LICENCE",
        jurisdiction="CENTRAL",
        domain="FOOD",
        status=KnowledgeStatus.PUBLISHED,
        evidence_refs=[test_evidence.evidence_id],
    )


@pytest.mark.django_db
def test_published_rules_only_invariant(test_business, test_requirement, test_evidence):
    """Draft, superseded, and rejected rules MUST NOT influence compliance evaluation."""
    profile_version = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={
            "state": {"value": "Gujarat", "origin": "USER_PROVIDED"},
            "is_food_business": {"value": True, "origin": "USER_PROVIDED"},
        },
    )

    # 1. Draft rule matching Gujarat -> SHOULD BE IGNORED
    RuleVersion.objects.create(
        rule_id="RULE-FSSAI-DRAFT",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.DRAFT,
        condition_ast={
            "op": "AND",
            "args": [
                {"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
                {"op": "EQ", "left": {"var": "is_food_business"}, "right": True},
            ],
        },
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )

    # 2. Superseded rule matching Gujarat -> SHOULD BE IGNORED
    RuleVersion.objects.create(
        rule_id="RULE-FSSAI-SUPERSEDED",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.SUPERSEDED,
        condition_ast={
            "op": "EQ",
            "left": {"var": "is_food_business"},
            "right": True,
        },
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(
        business=test_business,
        profile_version=profile_version,
    )

    # C5: No published rules exist for this requirement -> explicit UNVERIFIED (NO_PUBLISHED_RULE)
    res = run.results.filter(requirement_id=test_requirement.requirement_id).first()
    assert res is not None
    assert res.status == ApplicabilityStatus.UNVERIFIED
    assert res.explanation_trace["reason"] == "NO_PUBLISHED_RULE"


@pytest.mark.django_db
def test_effective_dates_boundary(test_business, test_requirement, test_evidence):
    """Rules with future effective_from or past effective_until must not be evaluated."""
    profile_version = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )

    today = timezone.now().date()

    # Future rule
    RuleVersion.objects.create(
        rule_id="RULE-FUTURE",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        effective_from=today + datetime.timedelta(days=30),
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )

    # Expired rule
    RuleVersion.objects.create(
        rule_id="RULE-EXPIRED",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        effective_from=today - datetime.timedelta(days=365),
        effective_until=today - datetime.timedelta(days=1),
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(
        business=test_business,
        profile_version=profile_version,
        evaluation_date=today,
    )

    # C5: Published rules exist but none in effective window -> explicit UNVERIFIED (OUTSIDE_EFFECTIVE_WINDOW)
    res = run.results.filter(requirement_id=test_requirement.requirement_id).first()
    assert res is not None
    assert res.status == ApplicabilityStatus.UNVERIFIED
    assert res.explanation_trace["reason"] == "OUTSIDE_EFFECTIVE_WINDOW"


@pytest.mark.django_db
def test_missing_critical_variable_leads_to_needs_information(
    test_business, test_requirement, test_evidence
):
    """If required variable is missing, requirement status becomes NEEDS_INFORMATION."""
    profile_version = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={
            "state": {"value": "Gujarat", "origin": "USER_PROVIDED"},
            # Notice annual_turnover is missing!
        },
    )

    RuleVersion.objects.create(
        rule_id="RULE-TURNOVER-THRESHOLD",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={
            "op": "AND",
            "args": [
                {"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
                {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 1200000},
            ],
        },
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(
        business=test_business,
        profile_version=profile_version,
    )

    res = run.results.filter(requirement_id=test_requirement.requirement_id).first()
    assert res is not None
    assert res.status == ApplicabilityStatus.NEEDS_INFORMATION
    assert res.status != ApplicabilityStatus.NOT_APPLICABLE


@pytest.mark.django_db
def test_evidence_verification_status_propagation(
    test_business, test_requirement, test_source
):
    """Unverified or conflicting evidence must downgrade status from APPLICABLE to UNVERIFIED or CONFLICT_REVIEW."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )

    unverified_ev = Evidence.objects.create(
        evidence_id="EVD-UNVERIFIED",
        source=test_source,
        locator="Section 10",
        excerpt="Tentative rule draft",
        verification_status=VerificationStatus.UNVERIFIED,
    )

    RuleVersion.objects.create(
        rule_id="RULE-UNVERIFIED-EVD",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[unverified_ev.evidence_id],
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(
        business=test_business,
        profile_version=profile,
    )

    res = run.results.filter(requirement_id=test_requirement.requirement_id).first()
    assert res is not None
    assert res.status == ApplicabilityStatus.UNVERIFIED
    assert len(res.evidence_refs) == 1
    assert res.evidence_refs[0]["evidence_id"] == unverified_ev.evidence_id


# ===========================================================================
# API Endpoint Integration Tests
# ===========================================================================

@pytest.mark.django_db
def test_evaluate_api_endpoint(test_user, test_business, test_requirement, test_evidence):
    client = APIClient()
    client.force_authenticate(user=test_user)

    # 1. Without profile version -> 400 NO_PROFILE_VERSION
    url = f"/api/v1/businesses/{test_business.id}/evaluate"
    res = client.post(url, format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.data["error"]["code"] == "NO_PROFILE_VERSION"

    # Create profile version and published rule
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={
            "state": {"value": "Gujarat", "origin": "USER_PROVIDED"},
            "annual_turnover": {"value": "2500000", "origin": "USER_PROVIDED"},
        },
    )

    RuleVersion.objects.create(
        rule_id="RULE-VALID-FSSAI",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={
            "op": "AND",
            "args": [
                {"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
                {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 1200000},
            ],
        },
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )

    # 2. Evaluate successfully
    res = client.post(url, format="json")
    assert res.status_code == status.HTTP_200_OK
    assert "data" in res.data
    data = res.data["data"]
    assert data["status"] == "COMPLETED"
    assert str(data["profile_version"]) == str(profile.id)
    assert len(data["results"]) == 1
    assert data["results"][0]["requirement_id"] == test_requirement.requirement_id
    assert data["results"][0]["status"] == ApplicabilityStatus.APPLICABLE

    run_id = data["id"]

    # 3. List decision runs
    list_url = f"/api/v1/businesses/{test_business.id}/decisions"
    res_list = client.get(list_url)
    assert res_list.status_code == status.HTTP_200_OK
    assert len(res_list.data["data"]) == 1
    assert str(res_list.data["data"][0]["id"]) == str(run_id)

    # 4. Retrieve decision run detail
    detail_url = f"/api/v1/businesses/{test_business.id}/decisions/{run_id}"
    res_detail = client.get(detail_url)
    assert res_detail.status_code == status.HTTP_200_OK
    assert str(res_detail.data["data"]["id"]) == str(run_id)
    assert len(res_detail.data["data"]["results"]) == 1


@pytest.mark.django_db
def test_evaluate_api_tenant_isolation(other_user, test_business):
    client = APIClient()
    client.force_authenticate(user=other_user)

    url = f"/api/v1/businesses/{test_business.id}/evaluate"
    res = client.post(url, format="json")
    # Must return 404 because other_user cannot access test_business
    assert res.status_code == status.HTTP_404_NOT_FOUND


# ===========================================================================
# C1 & C14: Rule Result Choices & Precedence
# ===========================================================================

@pytest.mark.django_db
def test_rule_result_is_honoured(test_business, test_requirement, test_evidence):
    """Engine must honour rule.result (e.g. NOT_APPLICABLE or EXEMPT) and not hardcode APPLICABLE."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-EXEMPT-SAMPLE",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        rule_type=RuleType.NORMAL,
        result=ApplicabilityStatus.NOT_APPLICABLE,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        evidence_refs=[test_evidence.evidence_id],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.NOT_APPLICABLE


@pytest.mark.django_db
def test_exemption_overrides_normal_rule(test_business, test_requirement, test_evidence):
    """Rule precedence: OVERRIDE > EXEMPTION > EXCEPTION > NORMAL."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-NORMAL",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        rule_type=RuleType.NORMAL,
        result=ApplicabilityStatus.APPLICABLE,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        evidence_refs=[test_evidence.evidence_id],
    )
    RuleVersion.objects.create(
        rule_id="RULE-EXEMPT",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        rule_type=RuleType.EXEMPTION,
        result=ApplicabilityStatus.NOT_APPLICABLE,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        evidence_refs=[test_evidence.evidence_id],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.NOT_APPLICABLE


@pytest.mark.django_db
def test_rule_result_rejects_invalid_choice(test_requirement):
    """RuleVersion.result must enforce ApplicabilityStatus.choices."""
    from django.core.exceptions import ValidationError
    rule = RuleVersion(
        rule_id="RULE-INVALID-RES",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        result="INVALID_STATUS_VALUE",
        condition_ast={"op": "EQ", "left": 1, "right": 1},
    )
    with pytest.raises(ValidationError):
        rule.full_clean()


# ===========================================================================
# C2: Multi-Rule Precedence & Conflict Review
# ===========================================================================

@pytest.mark.django_db
def test_contradictory_published_rules_yield_conflict_review(test_business, test_requirement, test_evidence):
    """Two published rules at the same precedence level yielding contradictory results must produce CONFLICT_REVIEW."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-CONFLICT-1",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        rule_type=RuleType.NORMAL,
        result=ApplicabilityStatus.APPLICABLE,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        evidence_refs=[test_evidence.evidence_id],
    )
    RuleVersion.objects.create(
        rule_id="RULE-CONFLICT-2",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        rule_type=RuleType.NORMAL,
        result=ApplicabilityStatus.NOT_APPLICABLE,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        evidence_refs=[test_evidence.evidence_id],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.CONFLICT_REVIEW
    conflicts = res.explanation_trace.get("conflicts", [])
    assert "RULE-CONFLICT-1" in conflicts
    assert "RULE-CONFLICT-2" in conflicts


@pytest.mark.django_db
def test_all_candidate_rules_appear_in_trace(test_business, test_requirement, test_evidence):
    """Engine must evaluate all candidate rules and record them in trace (no break)."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-CAND-1",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )
    RuleVersion.objects.create(
        rule_id="RULE-CAND-2",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Maharashtra"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )
    RuleVersion.objects.create(
        rule_id="RULE-CAND-3",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Karnataka"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    evaluations = res.explanation_trace.get("evaluations", [])
    evaluated_ids = [e["rule_id"] for e in evaluations]
    assert len(evaluated_ids) == 3
    assert "RULE-CAND-1" in evaluated_ids
    assert "RULE-CAND-2" in evaluated_ids
    assert "RULE-CAND-3" in evaluated_ids


# ===========================================================================
# C3: Non-Published Status Isolation (Parametrized)
# ===========================================================================

@pytest.mark.django_db
@pytest.mark.parametrize(
    "non_pub_status",
    [
        KnowledgeStatus.DRAFT,
        KnowledgeStatus.VALIDATION_PENDING,
        KnowledgeStatus.UNDER_REVIEW,
        KnowledgeStatus.APPROVED,
        KnowledgeStatus.SUPERSEDED,
        KnowledgeStatus.ARCHIVED,
        KnowledgeStatus.REJECTED,
    ],
)
def test_non_published_statuses_ignored_parameterized(
    test_business, test_requirement, test_evidence, non_pub_status
):
    """Every non-PUBLISHED status must NOT affect runtime decision."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id=f"RULE-NONPUB-{non_pub_status}",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=non_pub_status,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.UNVERIFIED
    assert res.explanation_trace.get("reason") == "NO_PUBLISHED_RULE"


# ===========================================================================
# C4: Jurisdiction Resolver & State Resolution
# ===========================================================================

def test_state_alias_normalisation():
    """Verify data-driven resolver maps aliases to canonical codes with zero hardcoded code branches."""
    from domain.jurisdictions.resolver import normalize_jurisdiction
    assert normalize_jurisdiction("gujarat") == "GUJARAT"
    assert normalize_jurisdiction("GJ") == "GUJARAT"
    assert normalize_jurisdiction("maharashtra") == "MAHARASHTRA"
    assert normalize_jurisdiction("MH") == "MAHARASHTRA"
    assert normalize_jurisdiction("CENTRAL") == "CENTRAL"


@pytest.mark.django_db
def test_unknown_state_yields_needs_information(test_business, test_requirement, test_evidence):
    """Unknown or unresolvable business state produces NEEDS_INFORMATION (JURISDICTION_UNRESOLVED)."""
    state_req = RequirementDefinition.objects.create(
        requirement_id="REQ-STATE-SPECIFIC",
        name="State Specific Requirement",
        authority="STATE_DEPT",
        category="LICENCE",
        jurisdiction="GUJARAT",
        domain="FOOD",
        status=KnowledgeStatus.PUBLISHED,
        evidence_refs=[test_evidence.evidence_id],
    )
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "AtlantisFictionalState"}},
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=state_req.requirement_id)
    assert res.status == ApplicabilityStatus.NEEDS_INFORMATION
    assert res.explanation_trace.get("reason") == "JURISDICTION_UNRESOLVED"


@pytest.mark.django_db
def test_absent_state_evaluates_only_central_rules(test_business, test_requirement, test_evidence):
    """Absent state evaluates central requirements normally but yields NEEDS_INFORMATION for state requirements."""
    state_req = RequirementDefinition.objects.create(
        requirement_id="REQ-STATE-ONLY",
        name="State Only Requirement",
        authority="STATE_DEPT",
        category="LICENCE",
        jurisdiction="GUJARAT",
        domain="FOOD",
        status=KnowledgeStatus.PUBLISHED,
        evidence_refs=[test_evidence.evidence_id],
    )
    # CENTRAL rule
    RuleVersion.objects.create(
        rule_id="RULE-CENTRAL-ALWAYS",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": 1, "right": 1},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )
    # Profile with NO state variable
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={},
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    
    # Central requirement evaluates to APPLICABLE
    res_central = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res_central.status == ApplicabilityStatus.APPLICABLE
    
    # State requirement cannot be determined -> NEEDS_INFORMATION
    res_state = run.results.get(requirement_id=state_req.requirement_id)
    assert res_state.status == ApplicabilityStatus.NEEDS_INFORMATION


# ===========================================================================
# C6: Evidence Chain Integrity
# ===========================================================================

@pytest.mark.django_db
def test_rule_without_evidence_is_unverified(test_business, test_requirement):
    """Rule with empty evidence_refs downgrades from APPLICABLE to UNVERIFIED."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-NO-EVD",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.UNVERIFIED
    assert res.explanation_trace.get("evidence_reason") == "ZERO_EVIDENCE"


@pytest.mark.django_db
def test_dangling_evidence_ref_is_unverified(test_business, test_requirement):
    """Rule referencing a non-existent evidence_id downgrades from APPLICABLE to UNVERIFIED."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-DANGLING-EVD",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=["EVD-DOES-NOT-EXIST"],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.UNVERIFIED
    assert res.explanation_trace.get("evidence_reason") == "DANGLING_EVIDENCE_REF"


@pytest.mark.django_db
def test_inactive_source_downgrades_to_unverified(test_business, test_requirement, test_source, test_evidence):
    """Evidence whose source is not ACTIVE downgrades result to UNVERIFIED."""
    test_source.status = SourceStatus.WITHDRAWN
    test_source.save()

    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-INACTIVE-SRC",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.UNVERIFIED
    assert "INACTIVE_SOURCE" in res.explanation_trace.get("evidence_reason", "")


@pytest.mark.django_db
def test_expired_evidence_downgrades_to_unverified(test_business, test_requirement, test_source):
    """Evidence past its effective_until date downgrades result to UNVERIFIED."""
    today = timezone.localdate()
    expired_ev = Evidence.objects.create(
        evidence_id="EVD-EXPIRED",
        source=test_source,
        locator="Sec 1",
        excerpt="Old text",
        effective_until=today - datetime.timedelta(days=1),
        verification_status=VerificationStatus.VERIFIED,
    )
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-EXP-EVD",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[expired_ev.evidence_id],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.UNVERIFIED
    assert res.explanation_trace.get("evidence_reason") == "EXPIRED_EVIDENCE"


@pytest.mark.django_db
def test_future_evidence_downgrades_to_unverified(test_business, test_requirement, test_source):
    """Evidence with future effective_from date downgrades result to UNVERIFIED."""
    today = timezone.localdate()
    future_ev = Evidence.objects.create(
        evidence_id="EVD-FUTURE",
        source=test_source,
        locator="Sec 1",
        excerpt="Future text",
        effective_from=today + datetime.timedelta(days=10),
        verification_status=VerificationStatus.VERIFIED,
    )
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-FUT-EVD",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[future_ev.evidence_id],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.UNVERIFIED
    assert res.explanation_trace.get("evidence_reason") == "FUTURE_EFFECTIVE_EVIDENCE"


@pytest.mark.django_db
def test_conflicting_evidence_yields_conflict_review(test_business, test_requirement, test_source):
    """Evidence marked CONFLICTING must cause final status to be CONFLICT_REVIEW."""
    conf_ev = Evidence.objects.create(
        evidence_id="EVD-CONFLICTING",
        source=test_source,
        locator="Sec 1",
        excerpt="Disputed",
        verification_status=VerificationStatus.CONFLICTING,
    )
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    RuleVersion.objects.create(
        rule_id="RULE-CONF-EVD",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[conf_ev.evidence_id],
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=test_business, profile_version=profile)
    res = run.results.get(requirement_id=test_requirement.requirement_id)
    assert res.status == ApplicabilityStatus.CONFLICT_REVIEW
    assert res.explanation_trace.get("evidence_reason") == "CONFLICTING_EVIDENCE"


# ===========================================================================
# C9: Decision Run Lifecycle & Error Handling
# ===========================================================================

@pytest.mark.django_db
def test_evaluator_failure_marks_run_failed(test_business, test_requirement):
    """Evaluator exception marks run as FAILED and re-raises exception."""
    from domain.rules.ast import AstValidationError
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    corrupt_rule = RuleVersion(
        rule_id="RULE-CORRUPT",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "INVALID_OP_UNKNOWN", "foo": "bar"},
        result=ApplicabilityStatus.APPLICABLE,
    )
    corrupt_rule.save()

    engine = ApplicabilityEngine()
    with pytest.raises(AstValidationError):
        engine.evaluate_business_profile(business=test_business, profile_version=profile)

    failed_run = DecisionRun.objects.filter(business=test_business).latest("created_at")
    assert failed_run.status == DecisionRunStatus.FAILED


@pytest.mark.django_db
def test_evaluate_api_returns_error_envelope_on_corrupt_rule(test_user, test_business, test_requirement):
    """API returns HTTP 500 error envelope when evaluation fails due to corrupt rule."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    corrupt_rule = RuleVersion(
        rule_id="RULE-CORRUPT-API",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "INVALID_OP_UNKNOWN", "foo": "bar"},
        result=ApplicabilityStatus.APPLICABLE,
    )
    corrupt_rule.save()

    client = APIClient()
    client.force_authenticate(user=test_user)
    url = f"/api/v1/businesses/{test_business.id}/evaluate"
    res = client.post(url, format="json")
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "error" in res.data
    assert res.data["error"]["code"] == "AST_VALIDATION_ERROR"


@pytest.mark.django_db
def test_evaluation_date_default_uses_local_date(test_business, test_requirement, test_evidence):
    """Default evaluation_date must use timezone.localdate()."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(
        business=test_business,
        profile_version=profile,
        evaluation_date=None,
    )
    assert run.evaluation_date == timezone.localdate()


@pytest.mark.django_db
def test_decisions_list_is_paginated(test_user, test_business, test_requirement):
    """Decisions list endpoint must return paginated response inside envelope."""
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    engine = ApplicabilityEngine()
    engine.evaluate_business_profile(business=test_business, profile_version=profile)

    client = APIClient()
    client.force_authenticate(user=test_user)
    url = f"/api/v1/businesses/{test_business.id}/decisions"
    res = client.get(url)
    assert res.status_code == status.HTTP_200_OK
    assert "data" in res.data
    assert "meta" in res.data
    assert "count" in res.data["meta"]
    assert "page" in res.data["meta"]


# ===========================================================================
# C13: Inclusive Date Boundaries
# ===========================================================================

@pytest.mark.django_db
def test_effective_date_inclusive_bounds(test_business, test_requirement, test_evidence):
    """Boundary dates: evaluation_date == effective_from and evaluation_date == effective_until are inclusive."""
    today = timezone.localdate()
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat"}},
    )
    
    # Exactly on effective_from boundary
    rule_from = RuleVersion.objects.create(
        rule_id="RULE-FROM-EXACT",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        effective_from=today,
        effective_until=today + datetime.timedelta(days=10),
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )
    engine = ApplicabilityEngine()
    run1 = engine.evaluate_business_profile(
        business=test_business,
        profile_version=profile,
        evaluation_date=today,
    )
    res1 = run1.results.get(requirement_id=test_requirement.requirement_id)
    assert res1.status == ApplicabilityStatus.APPLICABLE

    # Clean up rule_from and test exactly on effective_until boundary
    rule_from.delete()
    RuleVersion.objects.create(
        rule_id="RULE-UNTIL-EXACT",
        version=1,
        domain="FOOD",
        jurisdiction="CENTRAL",
        requirement=test_requirement,
        status=KnowledgeStatus.PUBLISHED,
        effective_from=today - datetime.timedelta(days=10),
        effective_until=today,
        condition_ast={"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=[test_evidence.evidence_id],
    )
    run2 = engine.evaluate_business_profile(
        business=test_business,
        profile_version=profile,
        evaluation_date=today,
    )
    res2 = run2.results.get(requirement_id=test_requirement.requirement_id)
    assert res2.status == ApplicabilityStatus.APPLICABLE

