"""Serializers for documents boundary."""

from __future__ import annotations

from rest_framework import serializers
from apps.documents.models import (
    DocumentRequirement,
    DocumentReview,
    DocumentSubmission,
)


class DocumentReviewSerializer(serializers.ModelSerializer):
    reviewer_email = serializers.ReadOnlyField(source="reviewer_user.email")

    class Meta:
        model = DocumentReview
        fields = [
            "id",
            "review_type",
            "reviewer_email",
            "status",
            "findings",
            "reviewer_comments",
            "reviewed_at",
            "created_at",
        ]


class DocumentSubmissionSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.ReadOnlyField(source="uploaded_by.email")
    reviews = DocumentReviewSerializer(many=True, read_only=True)
    latest_review = DocumentReviewSerializer(read_only=True)
    view_url = serializers.SerializerMethodField()
    metadata_url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentSubmission
        fields = [
            "id",
            "version_number",
            "file_name",
            "storage_path",
            "file_size_bytes",
            "mime_type",
            "checksum",
            "uploaded_by_email",
            "status_code",
            "metadata",
            "created_at",
            "reviews",
            "latest_review",
            "view_url",
            "metadata_url",
        ]

    def get_view_url(self, obj: DocumentSubmission) -> str:
        from apps.documents.services.storage_service import DocumentStorageService
        try:
            return DocumentStorageService.generate_signed_access_url(obj)
        except Exception:
            return f"/api/v1/documents/{obj.id}/view"

    def get_metadata_url(self, obj: DocumentSubmission) -> str:
        return f"/api/v1/documents/{obj.id}/metadata"



class DocumentRequirementSerializer(serializers.ModelSerializer):
    submissions = DocumentSubmissionSerializer(many=True, read_only=True)
    latest_submission = DocumentSubmissionSerializer(read_only=True)
    has_submission = serializers.SerializerMethodField()

    class Meta:
        model = DocumentRequirement
        fields = [
            "id",
            "document_type_code",
            "name",
            "description",
            "required",
            "status_code",
            "configuration",
            "submissions",
            "latest_submission",
            "has_submission",
            "created_at",
            "updated_at",
        ]

    def get_has_submission(self, obj: DocumentRequirement) -> bool:
        return obj.submissions.exists()
