"""Dashboard URL patterns."""

from __future__ import annotations

from django.urls import path

from .views import BusinessDashboardView

app_name = "dashboard"

urlpatterns = [
    path("dashboard", BusinessDashboardView.as_view(), name="dashboard-summary"),
]
