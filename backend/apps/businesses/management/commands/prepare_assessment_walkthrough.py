"""Prepare engine-evaluated sample history without changing the knowledge catalogue."""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.test.utils import override_settings
from apps.applicability.engine import ApplicabilityEngine
from apps.businesses.comparison_views import WALKTHROUGH_ID
from apps.businesses.models import Assessment, Business, BusinessProfileVersion


class Command(BaseCommand):
    help = "Prepare three fictional fact snapshots for an existing non-privileged demo account."

    def add_arguments(self, parser):
        parser.add_argument("--owner-email", required=True)

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.COMPLYWISE_DEMO_MODE:
            raise CommandError("Preparing sample history requires explicit demo mode.")
        user = get_user_model().objects.filter(email=options["owner_email"]).first()
        if not user or user.is_staff or user.is_superuser or getattr(user, "is_compliance_officer", False):
            raise CommandError("Use an existing non-privileged demo account.")
        business, created = Business.objects.get_or_create(pk=WALKTHROUGH_ID,
            defaults={"name": "Threadline operating model walkthrough", "owner": user})
        if business.owner_id != user.id:
            raise CommandError("The walkthrough belongs to another account.")
        existing = list(business.assessments.select_for_update().select_related("decision_run"))
        if existing:
            if len(existing) == 3 and all(a.decision_run and a.decision_run.cir_snapshot for a in existing):
                self.stdout.write("Existing sealed walkthrough retained.")
                return
            raise CommandError("Incomplete or changed history requires inspection; no records overwritten.")
        base = {"state": "TAMIL_NADU", "district": "TIRUPPUR", "legal_structure": "PRIVATE_LIMITED",
                "import_export_intent": "EXPORT_ONLY", "total_worker_count": 48,
                "annual_turnover": 320000000, "is_manufacturing": False,
                "connected_power_load": 0,
                "product_description": "Merchant exporter buying finished apparel; no manufacturing premises."}
        variants = [
            ("1 · Merchant export · no production power", {}),
            ("2 · Manufacturing · production power recorded", {"is_manufacturing": True,
                "connected_power_load": 50, "product_description": "Apparel manufacture and export from own powered production premises."}),
            ("3 · Manufacturing · power information unknown", {"is_manufacturing": True,
                "connected_power_load": None, "product_description": "Apparel manufacture and export from own production premises; power details not established."}),
        ]
        # Exercise the ordinary evaluator, even on a deployment with curated demo
        # mode. No special scenario resolver or new legal rules are used here.
        with override_settings(COMPLYWISE_DEMO_MODE=False):
            for number, (title, changes) in enumerate(variants, 1):
                values = {**base, **changes}
                profile = BusinessProfileVersion.objects.create(business=business, version=number,
                    variables={key: BusinessProfileVersion.build_entry(value) for key, value in values.items()},
                    created_by=user, change_note="Fictional judging walkthrough; ordinary evaluator; existing catalogue only.")
                assessment = Assessment.objects.create(business=business, created_by=user,
                    assessment_number=number, title=title, profile_version=profile)
                run = ApplicabilityEngine().evaluate_business_profile(business=business,
                    profile_version=profile, assessment=assessment)
                assessment.decision_run = run
                assessment.status = "COMPLETED"
                assessment.save(update_fields=["decision_run", "status", "updated_at"])
        self.stdout.write("Prepared three sealed sample decisions. Unverified evidence and missing information are retained.")
