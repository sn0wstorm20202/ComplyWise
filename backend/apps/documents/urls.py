"""URL patterns for documents app."""

from __future__ import annotations

from django.urls import path

from .views import (
    BusinessDocumentsListView,
    DocumentPortalStatusView,
    DocumentUploadView,
    DocumentVerifyView,
)

app_name = "documents"

urlpatterns = [
    path("documents", BusinessDocumentsListView.as_view(), name="documents-list"),
    path("documents/upload", DocumentUploadView.as_view(), name="documents-upload"),
    path("documents/verify", DocumentVerifyView.as_view(), name="documents-verify"),
    path("documents/portal-status", DocumentPortalStatusView.as_view(), name="documents-portal-status"),
]
