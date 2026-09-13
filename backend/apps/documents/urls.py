"""URL patterns for documents app."""

from __future__ import annotations

from django.urls import path

from .views import (
    BusinessDocumentsListView,
    DocumentConfigLLMView,
    DocumentPortalStatusView,
    DocumentScanView,
    DocumentUploadView,
    DocumentVerifyView,
)

app_name = "documents"

urlpatterns = [
    path("documents", BusinessDocumentsListView.as_view(), name="documents-list"),
    path("documents/upload", DocumentUploadView.as_view(), name="documents-upload"),
    path("documents/verify", DocumentVerifyView.as_view(), name="documents-verify"),
    path("documents/scan", DocumentScanView.as_view(), name="documents-scan"),
    path("documents/portal-status", DocumentPortalStatusView.as_view(), name="documents-portal-status"),
    path("documents/config-llm", DocumentConfigLLMView.as_view(), name="documents-config-llm"),
]
