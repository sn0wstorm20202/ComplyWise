"""Fail closed when the release's independently supervised worker is unavailable."""
from datetime import timedelta
from django.conf import settings
from django.db import DatabaseError
from django.utils import timezone
from .models import AssessmentWorkerHeartbeat


def worker_ready():
    if not settings.ASSESSMENT_WORKER_HEALTH_REQUIRED:
        return True
    try:
        return AssessmentWorkerHeartbeat.objects.filter(release=settings.COMPLYWISE_VERSION,
            seen_at__gte=timezone.now() - timedelta(seconds=60)).exists()
    except DatabaseError:
        return False
