"""URL patterns for the onboarding boundary."""

from __future__ import annotations

from django.urls import path

from .views import (
    OnboardingAnswersView,
    OnboardingProductsActivitiesView,
    OnboardingQuestionsView,
    OnboardingSequentialQuestionView,
    OnboardingStatusView,
)

app_name = "onboarding"

urlpatterns = [
    path("questions", OnboardingQuestionsView.as_view(), name="questions"),
    path("questions/next", OnboardingSequentialQuestionView.as_view(), name="questions-next"),
    path("answers", OnboardingAnswersView.as_view(), name="answers"),
    path("products-activities", OnboardingProductsActivitiesView.as_view(), name="products-activities"),
    path("status", OnboardingStatusView.as_view(), name="status"),
]
