"""Shared pytest fixtures.

No fixture here fabricates regulatory content. Where a test needs profile data it
supplies plainly synthetic business facts (a made-up company name, a round
turnover figure) — never a real threshold, fee or requirement.
"""

from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.businesses.models import Business, BusinessMembership

User = get_user_model()

# A password that satisfies Django's validators and is obviously not a secret.
TEST_PASSWORD = "test-Passphrase-2026"


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def make_user(db):
    def _make(email: str = "founder@example.com", **kwargs) -> User:
        return User.objects.create_user(
            email=email,
            password=kwargs.pop("password", TEST_PASSWORD),
            full_name=kwargs.pop("full_name", "Test Founder"),
            **kwargs,
        )

    return _make


@pytest.fixture
def user(make_user) -> User:
    return make_user()


@pytest.fixture
def other_user(make_user) -> User:
    return make_user(email="rival@example.com", full_name="Other Founder")


@pytest.fixture
def auth_client(api_client: APIClient, user: User) -> APIClient:
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def make_business(db):
    def _make(owner, name: str = "Example Manufacturing") -> Business:  # noqa: ANN001
        business = Business.objects.create(name=name, owner=owner)
        BusinessMembership.objects.create(
            business=business, user=owner, role=BusinessMembership.Role.OWNER
        )
        return business

    return _make


@pytest.fixture
def business(make_business, user) -> Business:
    return make_business(user)
