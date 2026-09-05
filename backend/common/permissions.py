"""Object-level authorization helpers.

Authority: TRD_v2.0 §32 — never trust a client-supplied business id. Every
business-scoped resource must be reached through a queryset already filtered by
the authenticated user's access, so that an unauthorized id yields 404 rather
than leaking existence.
"""

from __future__ import annotations

from typing import Protocol

from rest_framework import permissions


class HasBusiness(Protocol):
    business_id: object


class IsBusinessMember(permissions.BasePermission):
    """Allow access only to objects belonging to a business the user can access.

    Works for a `Business` itself and for any record exposing `business_id`.
    Views must still scope their queryset; this is defence in depth, not the
    primary control.
    """

    message = "You do not have access to this business."

    def has_object_permission(self, request, view, obj) -> bool:  # noqa: ANN001
        user = request.user
        if not user or not user.is_authenticated:
            return False

        business = obj if obj.__class__.__name__ == "Business" else getattr(obj, "business", None)
        if business is None:
            return False
        return business.is_accessible_by(user)
