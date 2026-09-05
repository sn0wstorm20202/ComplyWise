"""URL patterns for schemes app."""

from __future__ import annotations

from django.urls import path

from .views import BusinessSchemesListView

app_name = "schemes"

urlpatterns = [
    path("schemes", BusinessSchemesListView.as_view(), name="schemes-list"),
]
