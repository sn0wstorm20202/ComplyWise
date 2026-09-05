"""URL patterns for documents app."""

from __future__ import annotations

from django.urls import path

from .views import BusinessDocumentsListView, DocumentUploadView

app_name = "documents"

urlpatterns = [
    path("documents", BusinessDocumentsListView.as_view(), name="documents-list"),
    path("documents/upload", DocumentUploadView.as_view(), name="documents-upload"),
]
