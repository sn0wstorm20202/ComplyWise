"""Root URL configuration.

`/health` and `/health/ready` are also exposed unversioned so that platform
probes (Azure App Service, container health checks) do not depend on the API
version prefix.
"""

from __future__ import annotations

from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from .health_views import HealthView, ReadinessView

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("health/ready", ReadinessView.as_view(), name="health-ready"),
    path("api/v1/", include("config.api_urls")),
    # Vercel multi-service routing compatibility (/api/backend/...)
    path("api/backend/health", HealthView.as_view(), name="backend-health"),
    path("api/backend/health/ready", ReadinessView.as_view(), name="backend-health-ready"),
    path("api/backend/api/v1/", include("config.api_urls")),
    path("api/backend/", include("config.api_urls")),
]

if settings.DEBUG or settings.ENABLE_DJANGO_ADMIN:
    urlpatterns.append(path("admin/", admin.site.urls))
