"""Auth routes mounted under /api/v1/auth/."""

from __future__ import annotations

from django.urls import path

from . import views
from .google_auth import GoogleStartView, GoogleCallbackView, GoogleExchangeView

app_name = "accounts"

urlpatterns = [
    path("google/start", GoogleStartView.as_view(), name="google-start"),
    path("google/callback", GoogleCallbackView.as_view(), name="google-callback"),
    path("google/exchange", GoogleExchangeView.as_view(), name="google-exchange"),
    path("demo-reviewer-credentials", views.DemoReviewerCredentialsView.as_view(), name="demo-reviewer-credentials"),
    path("register", views.RegisterView.as_view(), name="register"),
    path("register/", views.RegisterView.as_view(), name="register-slash"),
    path("login", views.LoginView.as_view(), name="login"),
    path("login/", views.LoginView.as_view(), name="login-slash"),
    path("admin-login", views.AdminLoginView.as_view(), name="admin-login"),
    path("admin-login/", views.AdminLoginView.as_view(), name="admin-login-slash"),
    path("logout", views.LogoutView.as_view(), name="logout"),
    path("logout/", views.LogoutView.as_view(), name="logout-slash"),
    path("me", views.MeView.as_view(), name="me"),
    path("me/", views.MeView.as_view(), name="me-slash"),
]
