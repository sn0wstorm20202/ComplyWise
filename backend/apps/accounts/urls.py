"""Auth routes mounted under /api/v1/auth/."""

from __future__ import annotations

from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("register", views.RegisterView.as_view(), name="register"),
    path("register/", views.RegisterView.as_view(), name="register-slash"),
    path("login", views.LoginView.as_view(), name="login"),
    path("login/", views.LoginView.as_view(), name="login-slash"),
    path("logout", views.LogoutView.as_view(), name="logout"),
    path("logout/", views.LogoutView.as_view(), name="logout-slash"),
    path("me", views.MeView.as_view(), name="me"),
    path("me/", views.MeView.as_view(), name="me-slash"),
]
