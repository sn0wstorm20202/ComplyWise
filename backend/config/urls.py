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
]

if settings.DEBUG or settings.ENABLE_DJANGO_ADMIN:
    urlpatterns.append(path("admin/", admin.site.urls))
