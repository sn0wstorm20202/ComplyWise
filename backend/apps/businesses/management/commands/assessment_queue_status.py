import json
from django.core.management.base import BaseCommand
from django.db.models import Count
from django.utils import timezone
from apps.businesses.models import AssessmentJob
from apps.businesses.worker_health import worker_ready


class Command(BaseCommand):
    help = "Print aggregate queue health without business inputs or provider credentials."

    def handle(self, *args, **options):
        queued = AssessmentJob.objects.filter(status="QUEUED").order_by("created_at").first()
        self.stdout.write(json.dumps({"worker_ready": worker_ready(),
            "counts": {row["status"]: row["count"] for row in AssessmentJob.objects.values("status").annotate(count=Count("id"))},
            "oldest_queued_seconds": round((timezone.now() - queued.created_at).total_seconds()) if queued else None,
            "expired_running_leases": AssessmentJob.objects.filter(status="RUNNING", lease_until__lt=timezone.now()).count()}))
