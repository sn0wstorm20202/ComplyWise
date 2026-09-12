"""URL routes for the businesses boundary."""

from __future__ import annotations

from django.urls import path

from . import views

app_name = "businesses"

urlpatterns = [
    path("user/workspace", views.UserWorkspaceView.as_view(), name="user-workspace"),
    path("user/profile", views.UserProfileHomeView.as_view(), name="user-profile"),
    path("user/home", views.UserProfileHomeView.as_view(), name="user-home"),
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
        "businesses/<uuid:business_id>/assessments",
        views.BusinessAssessmentListCreateView.as_view(),
        name="assessment-list-create",
    ),
    path(
        "businesses/<uuid:business_id>/assessments/<uuid:assessment_id>",
        views.BusinessAssessmentDetailView.as_view(),
        name="assessment-detail",
    ),
    path(
        "businesses/<uuid:business_id>/assessments/<uuid:assessment_id>/complete",
        views.AssessmentCompleteView.as_view(),
        name="assessment-complete",
    ),
    path(
        "assessments/<uuid:assessment_id>",
        views.AssessmentDetailDirectView.as_view(),
        name="assessment-detail-direct",
    ),
    path(
        "profile/variables",
        views.ProfileVariableDefinitionListView.as_view(),
        name="variable-definitions",
    ),
]
