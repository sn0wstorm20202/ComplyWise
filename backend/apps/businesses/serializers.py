"""Serializers for the businesses boundary.

Authority: TRD_v2.0 §31, §32; PRD_v2.0 §11.

Note on scope: these serializers deliberately contain **no regulatory logic**.
They validate shape and type only. Nothing here decides what applies to a
business — that is the evaluator's job, over published knowledge.
"""

from __future__ import annotations

from typing import Any

from rest_framework import serializers

from common.enums import VariableOrigin
from domain.profile.variables import (
    PROFILE_VARIABLES,
    coerce_value,
    get_variable,
)

from .models import Business, BusinessProfileVersion


class BusinessSerializer(serializers.ModelSerializer):
    profile_version = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = ["id", "name", "is_active", "created_at", "updated_at", "profile_version"]
        read_only_fields = ["id", "is_active", "created_at", "updated_at"]

    def get_profile_version(self, obj: Business) -> int | None:
        current = obj.current_profile
        return current.version if current else None

    def validate_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Business name is required.")
        return name


class ProfileVariableDefinitionSerializer(serializers.Serializer):
    """Read-only description of a profile variable, for rendering the form.

    The frontend must not hardcode this list; it is served from the single
    canonical registry so the two cannot drift.
    """

    code = serializers.CharField()
    key = serializers.CharField()
    label = serializers.CharField()
    data_type = serializers.CharField()
    why_it_matters = serializers.CharField()
    unit = serializers.CharField(allow_null=True)
    default_relevance = serializers.CharField()
    options = serializers.SerializerMethodField()

    def get_options(self, obj) -> list[dict[str, str]]:  # noqa: ANN001
        return [{"value": o.value, "label": o.label} for o in obj.options]


class ProfileVariableEntrySerializer(serializers.Serializer):
    """One submitted variable value plus its provenance."""

    value = serializers.JSONField(allow_null=True)
    origin = serializers.ChoiceField(
        choices=VariableOrigin.choices, default=VariableOrigin.USER_PROVIDED
    )
    confidence = serializers.FloatField(required=False, allow_null=True, min_value=0, max_value=1)
    derived_from = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        origin = attrs.get("origin", VariableOrigin.USER_PROVIDED)
        confidence = attrs.get("confidence")
        if origin == VariableOrigin.USER_PROVIDED and confidence is not None:
            # A confidence score on user input would misrepresent the user's own
            # answer as a machine estimate (TRD_v2.0 §8).
            raise serializers.ValidationError(
                {"confidence": "A user-provided value must not carry a confidence score."}
            )
        if origin == VariableOrigin.DERIVED and confidence is None:
            raise serializers.ValidationError(
                {"confidence": "A derived value must record the confidence it was derived with."}
            )
        return attrs


class BusinessProfileVersionSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True, default=None)
    missing_core_variables = serializers.SerializerMethodField()

    class Meta:
        model = BusinessProfileVersion
        fields = [
            "id",
            "business",
            "version",
            "variables",
            "change_note",
            "created_at",
            "created_by_email",
            "missing_core_variables",
        ]
        read_only_fields = fields

    def get_missing_core_variables(self, obj: BusinessProfileVersion) -> list[str]:
        from domain.profile.variables import CORE_VARIABLE_KEYS

        return obj.missing_keys(CORE_VARIABLE_KEYS)


class BusinessProfileVersionCreateSerializer(serializers.Serializer):
    """Validates a submitted profile revision.

    Unknown variable keys are rejected rather than stored, so that a typo cannot
    become a silently-ignored decision input.
    """

    variables = serializers.DictField(child=serializers.DictField(), allow_empty=False)
    change_note = serializers.CharField(max_length=300, required=False, allow_blank=True, default="")
    carry_forward = serializers.BooleanField(required=False, default=True)

    def validate_variables(self, value: dict[str, Any]) -> dict[str, dict[str, Any]]:
        cleaned: dict[str, dict[str, Any]] = {}
        errors: dict[str, Any] = {}

        for key, payload in value.items():
            variable = get_variable(key)
            if variable is None:
                errors[key] = "Not a recognised business profile variable."
                continue

            entry_serializer = ProfileVariableEntrySerializer(data=payload)
            if not entry_serializer.is_valid():
                errors[key] = entry_serializer.errors
                continue
            entry = entry_serializer.validated_data

            if variable.user_input_only and entry["origin"] != VariableOrigin.USER_PROVIDED:
                errors[key] = f"{variable.label} may only be supplied by the user."
                continue

            try:
                coerced = coerce_value(variable, entry["value"])
            except ValueError as exc:
                errors[key] = str(exc)
                continue

            if variable.key == "state" and isinstance(coerced, str):
                from domain.jurisdictions.resolver import normalize_jurisdiction
                canonical_jurisdiction = normalize_jurisdiction(coerced)
                if canonical_jurisdiction:
                    coerced = canonical_jurisdiction

            cleaned[variable.key] = BusinessProfileVersion.build_entry(
                # Decimal is not JSON-serialisable; store the exact string form so
                # no precision is lost on the round trip (TRD_v2.0 §67).
                value=str(coerced) if _is_decimalish(variable) and coerced is not None else coerced,
                origin=entry["origin"],
                confidence=entry.get("confidence"),
                derived_from=entry.get("derived_from") or [],
            )

        if errors:
            raise serializers.ValidationError(errors)
        return cleaned


def _is_decimalish(variable) -> bool:  # noqa: ANN001
    from domain.profile.variables import DECIMAL_DATA_TYPES

    return variable.data_type in DECIMAL_DATA_TYPES


def profile_variable_definitions() -> list[dict[str, Any]]:
    return ProfileVariableDefinitionSerializer(PROFILE_VARIABLES, many=True).data
