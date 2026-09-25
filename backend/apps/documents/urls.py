"""URL patterns for documents app."""

from __future__ import annotations

from django.urls import path

from .views import (
    BusinessDocumentsListView,
    CaseDocumentUploadView,
    DocumentConfigLLMView,
    DocumentMetadataEndpoint,
    DocumentPortalStatusView,
    DocumentScanView,
    DocumentSubmissionReviewView,
    DocumentUploadView,
    DocumentVerifyView,
    DocumentViewEndpoint,
)

app_name = "documents"

urlpatterns = [
    path("documents", BusinessDocumentsListView.as_view(), name="documents-list"),
    path("documents/upload", DocumentUploadView.as_view(), name="documents-upload"),
    path("documents/verify", DocumentVerifyView.as_view(), name="documents-verify"),
    path("documents/scan", DocumentScanView.as_view(), name="documents-scan"),
    path("documents/portal-status", DocumentPortalStatusView.as_view(), name="documents-portal-status"),
    path("documents/config-llm", DocumentConfigLLMView.as_view(), name="documents-config-llm"),
    # Case Document Upload & Human Review Endpoints
    path("cases/<uuid:case_id>/documents/<uuid:document_requirement_id>/upload", CaseDocumentUploadView.as_view(), name="case-document-upload"),
    path("cases/<str:case_id>/documents/<str:document_requirement_id>/upload", CaseDocumentUploadView.as_view(), name="case-document-upload-str"),
    path("documents/submissions/<uuid:submission_id>/review", DocumentSubmissionReviewView.as_view(), name="document-submission-review"),
    path("documents/submissions/<str:submission_id>/review", DocumentSubmissionReviewView.as_view(), name="document-submission-review-str"),
    # Document Secure View & Metadata Endpoints (Fix #1 & §3, §35)
    path("documents/<uuid:document_version_id>/view", DocumentViewEndpoint.as_view(), name="document-view"),
    path("documents/<str:document_version_id>/view", DocumentViewEndpoint.as_view(), name="document-view-str"),
    path("documents/<uuid:document_version_id>/metadata", DocumentMetadataEndpoint.as_view(), name="document-metadata"),
    path("documents/<str:document_version_id>/metadata", DocumentMetadataEndpoint.as_view(), name="document-metadata-str"),
]
