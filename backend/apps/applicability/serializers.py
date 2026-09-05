"""Serializers for the applicability boundary.

Authority: TRD_v2.0 §30, §31; PRD_v2.0 §14, §15.
"""

from __future__ import annotations

from rest_framework import serializers

from .models import DecisionResult, DecisionRun


class DecisionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = DecisionResult
        fields = [
            "id",
            "requirement_id",
            "requirement_name",
            "status",
            "explanation_trace",
            "evidence_refs",
            "created_at",
        ]
        read_only_fields = fields


class DecisionRunSerializer(serializers.ModelSerializer):
    results = DecisionResultSerializer(many=True, read_only=True)
    profile_version_number = serializers.IntegerField(
        source="profile_version.version", read_only=True
    )

    class Meta:
        model = DecisionRun
        fields = [
            "id",
            "business",
            "profile_version",
            "profile_version_number",
            "status",
            "evaluation_date",
            "created_at",
            "results",
        ]
        read_only_fields = fields
