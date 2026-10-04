"""Identity model.

Authority: TRD_v2.0 §7 (User -> Business -> BusinessProfileVersion), §61 (data
minimisation).

Email is the login identifier. We collect a display name and nothing else:
no phone number, no government identifier, no address. Business context is
collected separately and only where it changes a regulatory decision.
"""

from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone


class UserManager(BaseUserManager):
    """Manager for the email-identified user."""

    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email: str, password: str | None = None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        if not extra["is_staff"] or not extra["is_superuser"]:
            raise ValueError("A superuser must have is_staff and is_superuser set.")
        return self._create_user(email, password, **extra)


from common.enums import AdminRole


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=32, blank=True, default="")

    role = models.CharField(
        max_length=50,
        choices=AdminRole.choices,
        default=AdminRole.USER,
        help_text="Operational role (COMPLIANCE_OFFICER, SENIOR_OFFICER, AUDITOR, SUPER_ADMIN, USER)",
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(
        default=False,
        help_text="Django admin access. Not a compliance-knowledge reviewer role.",
    )
    date_joined = models.DateTimeField(default=timezone.now)

    @property
    def is_compliance_officer(self) -> bool:
        return self.is_staff or self.is_superuser or self.role in (
            AdminRole.COMPLIANCE_OFFICER,
            AdminRole.SENIOR_OFFICER,
            AdminRole.SUPER_ADMIN,
        )

    @property
    def is_auditor(self) -> bool:
        return self.role == AdminRole.AUDITOR

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        db_table = "accounts_user"
        ordering = ["email"]
        constraints = [models.UniqueConstraint(Lower("email"), name="unique_user_email_casefold")]

    def __str__(self) -> str:
        return self.email

    def get_full_name(self) -> str:
        return self.full_name or self.email

    def get_short_name(self) -> str:
        return self.full_name.split(" ")[0] if self.full_name else self.email


class GoogleIdentity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="google_identities")
    subject = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class GoogleLoginAttempt(models.Model):
    state_digest = models.CharField(max_length=64, primary_key=True)
    nonce = models.CharField(max_length=128)
    code_verifier = models.CharField(max_length=128)
    handoff_challenge = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    callback_used_at = models.DateTimeField(null=True)
    ticket_digest = models.CharField(max_length=64, null=True, unique=True)
    ticket_used_at = models.DateTimeField(null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    is_new_user = models.BooleanField(default=False)
