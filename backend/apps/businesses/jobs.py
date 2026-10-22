"""Durable assessment work using the existing database and orchestration service.

Delivery is at least once. A short claim transaction is followed by a transaction
holding the job and assessment locks through domain writes. A crashed worker rolls
those writes back; another worker can reclaim the expired lease. External reads can
repeat, but assessment side effects commit together with job success.
"""
from __future__ import annotations

import hashlib
from datetime import timedelta

import rfc8785
from django.db import connection, transaction
from django.db.models import Q
from django.utils import timezone

from .models import Assessment, AssessmentJob

ALLOWED_STAGES = {"BUSINESS_UNDERSTANDING", "QUESTION_GENERATION", "REGULATORY_DISCOVERY", "COMPLIANCE_SYNTHESIS"}


class JobConflict(ValueError):
    pass


def input_fingerprint(assessment):
    from apps.applicability.snapshots import current_catalogue_hash, EVALUATOR_VERSION
    from django.conf import settings
    state = assessment.step_state or {}
    return hashlib.sha256(rfc8785.dumps({
        "profile": str(assessment.profile_version_id),
        "answers": state.get("stage_metadata", {}).get("answers", {}),
        "strategy": state.get("strategy"),
        "knowledge": current_catalogue_hash(), "evaluator": EVALUATOR_VERSION,
        "evaluation_date": timezone.localdate().isoformat(),
        "demo": getattr(settings, "COMPLYWISE_DEMO_MODE", False),
    })).hexdigest()


@transaction.atomic
def enqueue(assessment, actor, stage, *, idempotency_key="", force_refresh=False):
    if not isinstance(stage, str) or stage not in ALLOWED_STAGES:
        raise ValueError("Unsupported assessment stage.")
    if not isinstance(idempotency_key, str) or len(idempotency_key) > 128:
        raise ValueError("Idempotency key must be at most 128 characters.")
    if force_refresh and not idempotency_key:
        raise ValueError("Force refresh requires an idempotency key.")
    if not assessment.is_accessible_by(actor):
        raise PermissionError("Assessment is unavailable.")
    fingerprint = input_fingerprint(assessment)
    key = idempotency_key or f"{stage}:{fingerprint}"
    # A worker may hold the assessment lock throughout a long provider call.
    # Resume an already persisted operation before waiting for that lock. New
    # submissions still serialize below and repeat these checks under the lock.
    existing = AssessmentJob.objects.filter(assessment=assessment, idempotency_key=key).first()
    if existing:
        if existing.stage != stage or existing.input_fingerprint != fingerprint or existing.force_refresh != force_refresh:
            raise JobConflict("This retry key belongs to different assessment inputs.")
        return existing
    active = AssessmentJob.objects.filter(assessment=assessment, status__in=["QUEUED", "RUNNING"]).first()
    if active:
        if active.stage == stage and active.input_fingerprint == fingerprint and active.force_refresh == force_refresh:
            return active
        raise JobConflict("An operation is already running for this assessment.")
    assessment = Assessment.objects.select_for_update().get(pk=assessment.pk)
    if not assessment.is_accessible_by(actor):
        raise PermissionError("Assessment is unavailable.")
    # Inputs could change between the initial read and this lock acquisition.
    if input_fingerprint(assessment) != fingerprint:
        raise JobConflict("Assessment inputs changed while submitting this operation. Please try again.")
    existing = AssessmentJob.objects.filter(assessment=assessment, idempotency_key=key).first()
    if existing:
        if existing.stage != stage or existing.input_fingerprint != fingerprint or existing.force_refresh != force_refresh:
            raise JobConflict("This retry key belongs to different assessment inputs.")
        return existing
    active = AssessmentJob.objects.filter(assessment=assessment, status__in=["QUEUED", "RUNNING"]).first()
    if active:
        if active.stage == stage and active.input_fingerprint == fingerprint and active.force_refresh == force_refresh:
            return active
        raise JobConflict("An operation is already running for this assessment.")
    return AssessmentJob.objects.create(assessment=assessment, actor=actor, stage=stage,
        idempotency_key=key, input_fingerprint=fingerprint, force_refresh=force_refresh)


def claim_next(assessment_id=None):
    now = timezone.now()
    with transaction.atomic():
        query = AssessmentJob.objects.filter(
            Q(status="QUEUED", available_at__lte=now) | Q(status="RUNNING", lease_until__lt=now)
        ).order_by("created_at")
        if assessment_id is not None:
            query = query.filter(assessment_id=assessment_id)
        if connection.features.has_select_for_update_skip_locked:
            query = query.select_for_update(skip_locked=True)
        else:
            query = query.select_for_update()
        job = query.first()
        if not job:
            return None
        if job.attempts >= 3:
            job.status = "FAILED"; job.error_code = "RETRY_EXHAUSTED"
            job.save(update_fields=["status", "error_code", "updated_at"])
            return job.id, job.attempts
        job.status = "RUNNING"
        job.attempts += 1
        job.lease_until = now + timedelta(minutes=15)
        job.save(update_fields=["status", "attempts", "lease_until", "updated_at"])
        return job.id, job.attempts


def process_next(assessment_id=None):
    claim = claim_next(assessment_id=assessment_id)
    if claim is None:
        return False
    identifier, attempt = claim
    try:
        with transaction.atomic():
            job = AssessmentJob.objects.select_for_update(of=("self",)).select_related("actor").get(pk=identifier)
            if job.status != "RUNNING" or job.attempts != attempt:
                return True
            assessment = Assessment.objects.select_for_update(of=("self",)).select_related("business", "profile_version").get(pk=job.assessment_id)
            if not job.actor or not assessment.is_accessible_by(job.actor):
                job.status = "FAILED"; job.error_code = "ACCESS_REVOKED"
            elif input_fingerprint(assessment) != job.input_fingerprint:
                job.status = "FAILED"; job.error_code = "INPUT_CHANGED"
            else:
                from domain.intelligence.orchestration import AssessmentRun, AssessmentStage, assessment_orchestrator
                run = AssessmentRun(assessment)
                if job.force_refresh:
                    metadata = dict(run.stage_metadata)
                    metadata.pop(job.stage.lower(), None)
                    metadata.pop(job.stage, None)
                    run.stage_metadata = metadata
                    run.save()
                result = assessment_orchestrator.execute_stage(run, AssessmentStage(job.stage))
                if str(result.status) == "FAILED":
                    raise RuntimeError("Stage failed.")
                job.status = "SUCCEEDED"
                job.result = result.data
                job.error_code = ""
            job.lease_until = None
            job.save(update_fields=["status", "result", "error_code", "lease_until", "updated_at"])
    except Exception as exc:
        # No exception messages in public state: provider failures can contain credentials.
        from domain.providers.base import ProviderError
        retryable = isinstance(exc, (ProviderError, TimeoutError, ConnectionError))
        with transaction.atomic():
            job = AssessmentJob.objects.select_for_update().get(pk=identifier)
            if job.status != "RUNNING" or job.attempts != attempt:
                return True
            job.status = "QUEUED" if retryable and job.attempts < 3 else "FAILED"
            job.error_code = "DEPENDENCY_UNAVAILABLE" if retryable else "STAGE_FAILED"
            job.available_at = timezone.now() + timedelta(seconds=2 ** job.attempts)
            job.lease_until = None
            job.save(update_fields=["status", "error_code", "available_at", "lease_until", "updated_at"])
    return True


def project(job):
    return {"job_id": str(job.id), "assessment_id": str(job.assessment_id), "stage": job.stage,
        "status": job.status, "attempts": job.attempts, "retry_after_seconds": 2,
        "created_at": job.created_at.isoformat(), "updated_at": job.updated_at.isoformat(),
        "result": job.result if job.status == "SUCCEEDED" else None,
        "error": {"code": job.error_code, "message": "This operation could not complete. Your saved details are retained."} if job.status == "FAILED" else None}
