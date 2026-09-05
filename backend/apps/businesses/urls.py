"""URL routes for the businesses boundary."""

from __future__ import annotations

from django.urls import path

from . import views

app_name = "businesses"

urlpatterns = [
    path("businesses", views.BusinessListCreateView.as_view(), name="list-create"),
    path("businesses/<uuid:business_id>", views.BusinessDetailView.as_view(), name="detail"),
    path(
        "businesses/<uuid:business_id>/profile",
        views.BusinessProfileView.as_view(),
        name="profile",
    ),
    path(
        "businesses/<uuid:business_id>/profile/history",
        views.BusinessProfileHistoryView.as_view(),
        name="profile-history",
    ),
    path(
        "profile/variables",
        views.ProfileVariableDefinitionListView.as_view(),
        name="variable-definitions",
    ),
]
