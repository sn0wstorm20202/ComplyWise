"""Business entity and versioned business profile.

Authority: PRD_v2.0 §11, §26; TRD_v2.0 §7, §8, §9, §32, §66.

Two invariants are enforced here:

1. **Profile versions are immutable.** A material change creates a new version
   (TRD_v2.0 §9). A decision run always references one specific version, which
   is what makes a past decision reproducible.
2. **Value provenance is preserved.** Each variable value records whether it was
   `USER_PROVIDED`, `DERIVED` or `LOOKUP`. A derived value must never overwrite
   what the user actually said (TRD_v2.0 §8).
"""

from __future__ import annotations

from typing import Any, Iterable

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone

from common.enums import VariableOrigin
from common.models import AppendOnlyModel, BaseModel
from domain.profile.variables import PROFILE_VARIABLES, ProfileVariable, get_variable


class Business(BaseModel):
    """A business the user is seeking compliance intelligence for.

    The tenant boundary for every other module. `owner` is the account that
    created it; `members` allows a compliance manager to be added later without
    a schema change.
    """

    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_businesses",
        db_index=True,
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="BusinessMembership",
        related_name="businesses",
        blank=True,
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "businesses_business"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["owner", "-created_at"])]

    def __str__(self) -> str:
        return self.name

    # -- access control ----------------------------------------------------
    def is_accessible_by(self, user) -> bool:  # noqa: ANN001
        """Single place that answers "may this user see this business?"."""
        if not user or not user.is_authenticated:
            return False
        if self.owner_id == user.id:
            return True
        return self.memberships.filter(user_id=user.id).exists()

    @classmethod
    def accessible_to(cls, user) -> models.QuerySet[Business]:  # noqa: ANN001
        """Queryset scoped to a user. Views must start from here, never from
        `Business.objects.all()` plus a client-supplied id (TRD_v2.0 §32)."""
        if not user or not user.is_authenticated:
            return cls.objects.none()
        return cls.objects.filter(
            models.Q(owner=user) | models.Q(memberships__user=user)
        ).distinct()

    # -- profile -----------------------------------------------------------
    @property
    def current_profile(self) -> BusinessProfileVersion | None:
        return self.profile_versions.order_by("-version").first()


class BusinessMembership(BaseModel):
    """Additional users with access to a business.

    Deliberately minimal: the MVP is explicitly not building a permission
    matrix (TRD_v2.0 §2).
    """

    class Role(models.TextChoices):
        OWNER = "OWNER", "Owner"
        MANAGER = "MANAGER", "Compliance manager"
        VIEWER = "VIEWER", "Viewer"

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business_memberships"
    )
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.MANAGER)

    class Meta:
        db_table = "businesses_membership"
        constraints = [
            models.UniqueConstraint(fields=["business", "user"], name="uniq_business_user")
        ]

    def __str__(self) -> str:
        return f"{self.user} @ {self.business} ({self.role})"


class BusinessProfileVersion(AppendOnlyModel):
    """An immutable snapshot of the business profile.

    Values live in `variables` as::

        {
          "annual_turnover": {
            "value": "42000000",
            "origin": "USER_PROVIDED",
            "confidence": null,
            "derived_from": [],
            "recorded_at": "2026-09-05T10:00:00Z"
          }
        }

    A JSON map rather than 19 columns because (a) which variables are relevant
    is decided at runtime by the knowledge dependency matrix, and (b) every value
    carries provenance metadata that a bare column cannot hold. The variable keys
    themselves are still a closed, validated set — see `domain.profile.variables`.
    """

    business = models.ForeignKey(
        Business, on_delete=models.CASCADE, related_name="profile_versions"
    )
    version = models.PositiveIntegerField()
    variables = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_profile_versions",
    )
    #: Free-text note on why this version exists (e.g. "turnover updated").
    change_note = models.CharField(max_length=300, blank=True)

    class Meta:
        db_table = "businesses_profile_version"
        ordering = ["-version"]
        constraints = [
            models.UniqueConstraint(
                fields=["business", "version"], name="uniq_business_profile_version"
            )
        ]
        indexes = [models.Index(fields=["business", "version"])]

    def __str__(self) -> str:
        return f"{self.business} profile v{self.version}"

    # -- reading -----------------------------------------------------------
    def entry(self, key: str) -> dict[str, Any] | None:
        return self.variables.get(key)

    def raw_value(self, key: str) -> Any:
        """Return the stored value, or `None` when the variable is unknown.

        `None` means "not known". Callers deciding applicability must lift it to
        `UNKNOWN` via `domain.evaluation.truth`, never to `False`.
        """
        entry = self.variables.get(key)
        return entry.get("value") if entry else None

    def origin(self, key: str) -> str | None:
        entry = self.variables.get(key)
        return entry.get("origin") if entry else None

    def known_keys(self) -> set[str]:
        return {key for key, entry in self.variables.items() if entry.get("value") is not None}

    def missing_keys(self, keys: Iterable[str] | None = None) -> list[str]:
        candidates = list(keys) if keys is not None else [v.key for v in PROFILE_VARIABLES]
        known = self.known_keys()
        return [key for key in candidates if key not in known]

    # -- writing -----------------------------------------------------------
    @staticmethod
    def build_entry(
        value: Any,
        origin: str = VariableOrigin.USER_PROVIDED,
        confidence: float | None = None,
        derived_from: list[str] | None = None,
    ) -> dict[str, Any]:
        if origin not in VariableOrigin.values:
            raise ValidationError(f"Unknown value origin {origin!r}.")
        if origin == VariableOrigin.USER_PROVIDED and confidence is not None:
            raise ValidationError("A user-provided value must not carry a confidence score.")
        return {
            "value": value,
            "origin": origin,
            "confidence": confidence,
            "derived_from": derived_from or [],
            "recorded_at": timezone.now().isoformat(),
        }

    @classmethod
    @transaction.atomic
    def create_next(
        cls,
        *,
        business: Business,
        variables: dict[str, dict[str, Any]],
        created_by=None,  # noqa: ANN001
        change_note: str = "",
        carry_forward: bool = True,
    ) -> BusinessProfileVersion:
        """Create the next immutable version for a business.

        `carry_forward` copies the previous version's values so that a partial
        update does not silently erase known context. A user-provided value is
        never replaced by a derived one; see `merge_variables`.
        """
        # select_for_update serialises concurrent version creation (TRD_v2.0 §63).
        previous = (
            cls.objects.select_for_update()
            .filter(business=business)
            .order_by("-version")
            .first()
        )
        next_version = (previous.version + 1) if previous else 1

        merged: dict[str, dict[str, Any]] = {}
        if carry_forward and previous:
            merged = {key: dict(entry) for key, entry in previous.variables.items()}
        merged = merge_variables(merged, variables)

        return cls.objects.create(
            business=business,
            version=next_version,
            variables=merged,
            created_by=created_by,
            change_note=change_note,
        )

    def save(self, *args, **kwargs):
        # `self.pk` is populated at instantiation for UUID primary keys, so
        # `_state.adding` is the only reliable "is this an insert?" signal here.
        if not self._state.adding and not kwargs.pop("_allow_update", False):
            # Guards the invariant at the model layer, not just in views.
            raise ValidationError(
                "Business profile versions are immutable. Create a new version instead."
            )
        kwargs.pop("_allow_update", None)
        return super().save(*args, **kwargs)


def merge_variables(
    existing: dict[str, dict[str, Any]],
    incoming: dict[str, dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    """Merge profile entries, protecting user input from derived values.

    Precedence: a `USER_PROVIDED` entry always wins over a `DERIVED` or `LOOKUP`
    entry for the same variable (TRD_v2.0 §8). Two entries of the same origin
    resolve to the newer one.
    """
    merged = {key: dict(entry) for key, entry in existing.items()}
    for key, entry in incoming.items():
        current = merged.get(key)
        if current is None:
            merged[key] = dict(entry)
            continue
        current_is_user = current.get("origin") == VariableOrigin.USER_PROVIDED
        incoming_is_user = entry.get("origin") == VariableOrigin.USER_PROVIDED
        if current_is_user and not incoming_is_user:
            # Keep the user's answer; record the machine's opinion alongside it.
            current.setdefault("superseded_suggestions", []).append(
                {k: v for k, v in entry.items() if k != "superseded_suggestions"}
            )
            merged[key] = current
            continue
        merged[key] = dict(entry)
    return merged


def known_variable(key: str) -> ProfileVariable:
    variable = get_variable(key)
    if variable is None:
        raise ValidationError(f"{key!r} is not a canonical business profile variable.")
    return variable
