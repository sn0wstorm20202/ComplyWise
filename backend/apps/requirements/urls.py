"""URL patterns for the requirements boundary."""

from __future__ import annotations

from django.urls import path

from .views import (
    BusinessComplianceListView,
    BusinessRequirementDetailView,
)

app_name = "requirements"

urlpatterns = [
    path("compliance", BusinessComplianceListView.as_view(), name="compliance-list"),
    path("compliance/<str:requirement_id>", BusinessRequirementDetailView.as_view(), name="compliance-detail"),
]
