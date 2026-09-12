"""Profile versioning, immutability and value provenance.

These assertions encode PRD_v2.0 §26 / TRD_v2.0 §8–§9: a decision made last month
must remain explainable, and a machine-derived value must never be presented as
something the user said.
"""

from __future__ import annotations

from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.businesses.models import BusinessProfileVersion, merge_variables
from common.enums import VariableOrigin
from domain.profile.variables import CORE_VARIABLE_KEYS, PROFILE_VARIABLES

pytestmark = pytest.mark.django_db


def post_profile(client, business, variables, **extra):  # noqa: ANN001
    payload = {"variables": variables, **extra}
    return client.post(
        f"/api/v1/businesses/{business.id}/profile", payload, format="json"
    )


# --- version numbering ------------------------------------------------------


def test_first_version_is_one_and_subsequent_versions_increment(auth_client, business):
    first = post_profile(auth_client, business, {"state": {"value": "Gujarat"}})
    assert first.status_code == 201, first.content
    assert first.json()["data"]["version"] == 1

    second = post_profile(auth_client, business, {"district": {"value": "Rajkot"}})
    assert second.json()["data"]["version"] == 2

    assert business.profile_versions.count() == 2
    assert business.current_profile.version == 2


def test_history_returns_every_version_newest_first(auth_client, business):
    post_profile(auth_client, business, {"state": {"value": "Gujarat"}})
    post_profile(auth_client, business, {"state": {"value": "Telangana"}})

    body = auth_client.get(f"/api/v1/businesses/{business.id}/profile/history").json()
    assert [v["version"] for v in body["data"]] == [2, 1]
    # The superseded answer is still readable — that is what makes an old decision
    # explainable after the fact.
    assert body["data"][1]["variables"]["state"]["value"] == "GUJARAT"
    assert body["meta"]["count"] == 2


# --- immutability -----------------------------------------------------------


def test_saving_an_existing_version_is_rejected(auth_client, business, user):
    version = BusinessProfileVersion.create_next(
        business=business,
        variables={"state": BusinessProfileVersion.build_entry("Gujarat")},
        created_by=user,
    )
    version.variables = {"state": BusinessProfileVersion.build_entry("Telangana")}
    with pytest.raises(ValidationError):
        version.save()

    version.refresh_from_db()
    assert version.variables["state"]["value"] == "Gujarat"


def test_new_version_does_not_mutate_the_previous_one(auth_client, business):
    post_profile(auth_client, business, {"annual_turnover": {"value": "5000000"}})
    v1 = business.profile_versions.get(version=1)
    snapshot = dict(v1.variables)

    post_profile(auth_client, business, {"annual_turnover": {"value": "9000000"}})
    v1.refresh_from_db()
    assert v1.variables == snapshot


def test_profile_is_not_editable_in_place_via_http(auth_client, business):
    post_profile(auth_client, business, {"state": {"value": "Gujarat"}})
    url = f"/api/v1/businesses/{business.id}/profile"
    assert auth_client.put(url, {"variables": {}}, format="json").status_code == 405
    assert auth_client.patch(url, {"variables": {}}, format="json").status_code == 405


# --- carry-forward ----------------------------------------------------------


def test_partial_update_carries_previous_answers_forward(auth_client, business):
    post_profile(
        auth_client,
        business,
        {"state": {"value": "Gujarat"}, "total_worker_count": {"value": 24}},
    )
    response = post_profile(auth_client, business, {"total_worker_count": {"value": 31}})

    variables = response.json()["data"]["variables"]
    assert variables["total_worker_count"]["value"] == 31
    assert variables["state"]["value"] == "GUJARAT"  # not erased (normalized by serializer)


def test_carry_forward_can_be_disabled_explicitly(auth_client, business):
    post_profile(auth_client, business, {"state": {"value": "Gujarat"}})
    response = post_profile(
        auth_client, business, {"district": {"value": "Rajkot"}}, carry_forward=False
    )
    assert "state" not in response.json()["data"]["variables"]


# --- provenance -------------------------------------------------------------


def test_user_provided_values_record_their_origin(auth_client, business):
    response = post_profile(auth_client, business, {"state": {"value": "Gujarat"}})
    entry = response.json()["data"]["variables"]["state"]
    assert entry["origin"] == VariableOrigin.USER_PROVIDED
    assert entry["confidence"] is None
    assert entry["recorded_at"]


def test_user_provided_value_may_not_carry_a_confidence_score(auth_client, business):
    response = post_profile(
        auth_client, business, {"state": {"value": "Gujarat", "confidence": 0.9}}
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_derived_value_must_declare_confidence(auth_client, business):
    response = post_profile(
        auth_client,
        business,
        {"industrial_zone_status": {"value": "SPECIAL_ECONOMIC_ZONE", "origin": "DERIVED"}},
    )
    assert response.status_code == 400


def test_derived_value_never_overwrites_a_user_answer():
    """The core provenance rule, tested at the merge function directly."""
    existing = {
        "industrial_zone_status": BusinessProfileVersion.build_entry(
            "OUTSIDE_NOTIFIED_INDUSTRIAL_AREA"
        )
    }
    incoming = {
        "industrial_zone_status": BusinessProfileVersion.build_entry(
            "INSIDE_NOTIFIED_INDUSTRIAL_AREA",
            origin=VariableOrigin.DERIVED,
            confidence=0.94,
            derived_from=["district"],
        )
    }

    merged = merge_variables(existing, incoming)
    entry = merged["industrial_zone_status"]

    assert entry["value"] == "OUTSIDE_NOTIFIED_INDUSTRIAL_AREA"
    assert entry["origin"] == VariableOrigin.USER_PROVIDED
    # The machine's opinion is kept for review, not silently discarded either.
    assert entry["superseded_suggestions"][0]["value"] == "INSIDE_NOTIFIED_INDUSTRIAL_AREA"
    assert entry["superseded_suggestions"][0]["confidence"] == 0.94


def test_a_later_user_answer_replaces_an_earlier_user_answer():
    existing = {"state": BusinessProfileVersion.build_entry("Gujarat")}
    incoming = {"state": BusinessProfileVersion.build_entry("Telangana")}
    assert merge_variables(existing, incoming)["state"]["value"] == "Telangana"


def test_build_entry_rejects_an_unknown_origin():
    with pytest.raises(ValidationError):
        BusinessProfileVersion.build_entry("Gujarat", origin="GUESSED")


# --- validation of values ---------------------------------------------------


def test_unknown_variable_key_is_rejected(auth_client, business):
    response = post_profile(
        auth_client, business, {"requires_factory_licence": {"value": True}}
    )
    assert response.status_code == 400
    details = response.json()["error"]["details"]
    assert any("requires_factory_licence" in (d.get("field") or "") for d in details)
    assert business.profile_versions.count() == 0  # nothing partially stored


def test_unrecognised_choice_option_is_rejected(auth_client, business):
    response = post_profile(
        auth_client, business, {"legal_constitution": {"value": "SOLE_TRADER_ISH"}}
    )
    assert response.status_code == 400


def test_valid_choice_option_is_accepted(auth_client, business):
    response = post_profile(
        auth_client, business, {"legal_constitution": {"value": "PRIVATE_LIMITED"}}
    )
    assert response.status_code == 201
    assert response.json()["data"]["variables"]["legal_constitution"]["value"] == "PRIVATE_LIMITED"


def test_non_numeric_currency_is_rejected_not_coerced(auth_client, business):
    response = post_profile(auth_client, business, {"annual_turnover": {"value": "about five crore"}})
    assert response.status_code == 400
    assert business.profile_versions.count() == 0


def test_currency_is_stored_as_an_exact_decimal_string(auth_client, business):
    response = post_profile(auth_client, business, {"annual_turnover": {"value": "49999999.99"}})
    stored = response.json()["data"]["variables"]["annual_turnover"]["value"]
    # Round-tripping through float would give 49999999.990000002 or similar.
    assert stored == "49999999.99"
    assert Decimal(stored) == Decimal("49999999.99")


def test_empty_variable_payload_is_rejected(auth_client, business):
    assert post_profile(auth_client, business, {}).status_code == 400


# --- unanswered variables stay unanswered -----------------------------------


def test_profile_endpoint_reports_missing_core_variables_without_a_profile(auth_client, business):
    body = auth_client.get(f"/api/v1/businesses/{business.id}/profile").json()["data"]
    assert body["current_version"] is None
    assert set(body["missing_core_variables"]) == set(CORE_VARIABLE_KEYS)
    assert body["variable_definitions"], "the variable schema must be served, not hardcoded in the UI"


def test_missing_value_reads_as_none_not_false(auth_client, business, user):
    version = BusinessProfileVersion.create_next(
        business=business,
        variables={"state": BusinessProfileVersion.build_entry("Gujarat")},
        created_by=user,
    )
    # An unanswered boolean must be None ("we were not told"), never False.
    assert version.raw_value("hazardous_waste_generation") is None
    assert "hazardous_waste_generation" in version.missing_keys()


def test_explicit_null_is_recorded_as_unknown_not_as_false(auth_client, business):
    response = post_profile(
        auth_client, business, {"hazardous_waste_generation": {"value": None}}
    )
    assert response.status_code == 201
    entry = response.json()["data"]["variables"]["hazardous_waste_generation"]
    assert entry["value"] is None
    version = business.profile_versions.get(version=1)
    assert "hazardous_waste_generation" in version.missing_keys()


def test_variable_definitions_endpoint_lists_the_canonical_registry(auth_client):
    body = auth_client.get("/api/v1/profile/variables").json()
    keys = [item["key"] for item in body["data"]]
    assert len(keys) == len(set(keys)) == len(PROFILE_VARIABLES)
    assert body["meta"]["core_variables"] == list(CORE_VARIABLE_KEYS)
    # The registry is schema only — it must not ship thresholds or conditions.
    assert all("threshold" not in item for item in body["data"])
