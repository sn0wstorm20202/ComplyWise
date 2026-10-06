"""Provision the explicitly configured demo reviewer through real authentication."""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email
from django.db import transaction

from common.enums import AdminRole


class Command(BaseCommand):
    help = "Create a dedicated demo reviewer from backend environment settings; never overwrite an account."

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEMO_REVIEWER_AUTOFILL_ENABLED:
            raise CommandError("DEMO_REVIEWER_AUTOFILL_ENABLED must be explicitly enabled.")
        email = settings.DEMO_REVIEWER_EMAIL.lower()
        password = settings.DEMO_REVIEWER_PASSWORD
        try:
            validate_email(email)
        except ValidationError:
            raise CommandError("Set a valid DEMO_REVIEWER_EMAIL.") from None
        User = get_user_model()
        user = User.objects.select_for_update().filter(email__iexact=email).first()
        if user:
            eligible = user.is_active and user.is_compliance_officer
            if not settings.DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT:
                eligible = eligible and not user.is_staff and not user.is_superuser and user.role == AdminRole.COMPLIANCE_OFFICER
            if not eligible or not user.check_password(password):
                raise CommandError("Existing account does not match the dedicated demo configuration; no account changed.")
        else:
            if len(password) < 16:
                raise CommandError("Set DEMO_REVIEWER_PASSWORD to a dedicated demo passphrase of at least 16 characters.")
            User.objects.create_user(email=email, password=password, full_name="Demo Reviewer",
                                     role=AdminRole.COMPLIANCE_OFFICER, is_staff=False, is_superuser=False)
        self.stdout.write(self.style.SUCCESS("Dedicated demo reviewer configured. Use normal reviewer sign-in."))
