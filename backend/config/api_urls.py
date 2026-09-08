"""Versioned API routes.

Authority: TRD_v2.0 §30 — everything the frontend consumes lives under
``/api/v1/``.

Only the modules that actually have working endpoints are wired up. A route that
would return invented regulatory data is deliberately absent rather than stubbed:
the frontend must be able to trust that a 200 means real data.
"""

from __future__ import annotations

from django.urls import include, path

from .health_views import HealthView, ReadinessView

app_name = "api-v1"

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("health/ready", ReadinessView.as_view(), name="health-ready"),
    path("auth/", include("apps.accounts.urls")),
    path("", include("apps.businesses.urls")),
    path("", include("apps.applicability.urls")),
    path("businesses/<uuid:business_id>/onboarding/", include("apps.onboarding.urls")),
    path("businesses/<uuid:business_id>/", include("apps.dashboard.urls")),
    path("businesses/<uuid:business_id>/", include("apps.requirements.urls")),
    path("businesses/<uuid:business_id>/", include("apps.documents.urls")),
    path("businesses/<uuid:business_id>/", include("apps.workflows.urls")),
    path("businesses/<uuid:business_id>/", include("apps.calendar.urls")),
    path("businesses/<uuid:business_id>/", include("apps.schemes.urls")),
    path("businesses/<uuid:business_id>/", include("apps.ingestion.urls")),
    path("", include("apps.standards.urls")),
    path("", include("apps.regulatory_updates.urls")),
    path("", include("apps.assistant.urls")),
]
