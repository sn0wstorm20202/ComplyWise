"""Resilient Token Authentication for ComplyWise APIs.

Authority: TRD_v2.0 §30, §31.

Ensures:
1. Both 'Token <key>' and 'Bearer <key>' authorization headers are supported.
2. If a request includes a stale, deleted, or expired token in the Authorization
   header, it gracefully yields (returns None) rather than raising
   AuthenticationFailed. This prevents stale tokens in client storage from
   bricking login, registration, or public API views.
3. Protected endpoints (IsAuthenticated) still enforce authentication via DRF
   permission checks and return HTTP 401 NotAuthenticated.
"""

from __future__ import annotations

from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions
from rest_framework.authentication import TokenAuthentication, get_authorization_header


class SafeTokenAuthentication(TokenAuthentication):
    """Token authentication supporting 'Token' and 'Bearer' keywords without
    aborting public endpoints or login attempts on stale tokens."""

    keyword = "Token"

    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth:
            return None

        prefix = auth[0].decode("utf-8", errors="ignore").lower()
        if prefix not in ("token", "bearer"):
            return None

        if len(auth) == 1:
            # Token prefix provided without key; treat as unauthenticated
            return None
        elif len(auth) > 2:
            return None

        try:
            key = auth[1].decode("utf-8", errors="ignore").strip()
        except UnicodeError:
            return None

        if not key:
            return None

        try:
            token = self.get_model().objects.select_related("user").get(key=key)
        except self.get_model().DoesNotExist:
            # Token does not exist in DB (e.g. stale client localStorage token).
            # Return None to allow AllowAny views (login, register, health) to proceed.
            # Views with IsAuthenticated will cleanly reject with NotAuthenticated (401).
            return None

        if not token.user.is_active:
            raise exceptions.AuthenticationFailed(_("User inactive or deleted."))

        return (token.user, token)
