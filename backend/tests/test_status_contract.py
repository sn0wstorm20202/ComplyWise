"""Contract integrity test between backend enums/serializers and frontend TypeScript types.

Authority: TRD_v2.0 §30, §31, §32; FRONTEND_INSTRUCTIONS.md §5; Audit Finding A4.

Fails the build if frontend/types/index.ts drifts from backend canonical contracts.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from common import enums
from apps.accounts.serializers import UserSerializer
from apps.applicability.serializers import (
    DecisionResultSerializer,
    DecisionRunSerializer,
)
from apps.businesses.serializers import (
    BusinessProfileVersionSerializer,
    BusinessSerializer,
    ProfileVariableDefinitionSerializer,
)

FRONTEND_TYPES_PATH = Path(__file__).resolve().parent.parent.parent / "frontend" / "types" / "index.ts"


def _extract_ts_type_union(content: str, type_name: str) -> set[str]:
    """Extract string values from a TypeScript union type like:
    export type ApplicabilityStatus = "APPLICABLE" | "NOT_APPLICABLE" | ...;
    """
    pattern = rf"export\s+type\s+{type_name}\s*=\s*([^;]+);"
    match = re.search(pattern, content)
    if not match:
        raise ValueError(f"Could not find TypeScript type '{type_name}' in {FRONTEND_TYPES_PATH}")
    raw_union = match.group(1)
    values = set(re.findall(r'"([^"]+)"', raw_union))
    return values


def _extract_ts_interface_fields(content: str, interface_name: str) -> set[str]:
    """Extract top-level field names from a TypeScript interface."""
    pattern = rf"export\s+interface\s+{interface_name}\s*\{{([^}}]+)\}}"
    match = re.search(pattern, content)
    if not match:
        raise ValueError(f"Could not find TypeScript interface '{interface_name}' in {FRONTEND_TYPES_PATH}")
    body = match.group(1)
    fields = set()
    for line in body.splitlines():
        line = line.strip()
        if not line or line.startswith("//") or line.startswith("/*"):
            continue
        field_match = re.match(r"([a-zA-Z0-9_]+)\??\s*:", line)
        if field_match:
            fields.add(field_match.group(1))
    return fields


@pytest.fixture(scope="module")
def ts_content() -> str:
    assert FRONTEND_TYPES_PATH.exists(), f"Frontend types file missing: {FRONTEND_TYPES_PATH}"
    return FRONTEND_TYPES_PATH.read_text(encoding="utf-8")


@pytest.mark.parametrize(
    ("enum_class", "ts_type_name"),
    [
        (enums.ApplicabilityStatus, "ApplicabilityStatus"),
        (enums.WorkflowStatus, "WorkflowStatus"),
        (enums.DocumentStatus, "DocumentStatus"),
        (enums.PrevalidationOutcome, "PrevalidationOutcome"),
        (enums.KnowledgeStatus, "KnowledgeStatus"),
        (enums.SourceStatus, "SourceStatus"),
        (enums.VerificationStatus, "VerificationStatus"),
        (enums.VariableOrigin, "VariableOrigin"),
        (enums.VariableRelevance, "VariableRelevance"),
        (enums.DecisionRunStatus, "DecisionRunStatus"),
        (enums.AssessmentStatus, "AssessmentStatus"),
    ],
)
def test_frontend_enum_matches_backend(ts_content, enum_class, ts_type_name):
    """Every member of every backend TextChoices enum must exist in frontend types and vice versa."""
    backend_values = set(enum_class.values)
    frontend_values = _extract_ts_type_union(ts_content, ts_type_name)
    assert frontend_values == backend_values, (
        f"Contract drift in {ts_type_name}: "
        f"Backend has {backend_values - frontend_values}, "
        f"Frontend has {frontend_values - backend_values}"
    )


def test_user_serializer_fields_match_frontend_type(ts_content):
    backend_fields = set(UserSerializer().get_fields().keys())
    frontend_fields = _extract_ts_interface_fields(ts_content, "User")
    assert frontend_fields == backend_fields


def test_business_serializer_fields_match_frontend_type(ts_content):
    backend_fields = set(BusinessSerializer().get_fields().keys())
    frontend_fields = _extract_ts_interface_fields(ts_content, "Business")
    assert frontend_fields == backend_fields


def test_business_profile_version_serializer_fields_match_frontend_type(ts_content):
    backend_fields = set(BusinessProfileVersionSerializer().get_fields().keys())
    frontend_fields = _extract_ts_interface_fields(ts_content, "BusinessProfileVersion")
    assert frontend_fields == backend_fields


def test_profile_variable_definition_serializer_fields_match_frontend_type(ts_content):
    backend_fields = set(ProfileVariableDefinitionSerializer().get_fields().keys())
    frontend_fields = _extract_ts_interface_fields(ts_content, "ProfileVariableDefinition")
    assert frontend_fields == backend_fields


def test_decision_result_serializer_fields_match_frontend_type(ts_content):
    backend_fields = set(DecisionResultSerializer().get_fields().keys())
    frontend_fields = _extract_ts_interface_fields(ts_content, "DecisionResult")
    assert frontend_fields == backend_fields


def test_decision_run_serializer_fields_match_frontend_type(ts_content):
    backend_fields = set(DecisionRunSerializer().get_fields().keys())
    frontend_fields = _extract_ts_interface_fields(ts_content, "DecisionRun")
    assert frontend_fields == backend_fields
