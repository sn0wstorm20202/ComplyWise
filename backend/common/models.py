"""Abstract model bases shared across domain apps.

Authority: TRD_v2.0 §30 (UUIDs, ISO-8601 timestamps), §62 (audit metadata).
"""

from __future__ import annotations

import uuid

from django.db import models


class UUIDModel(models.Model):
    """Primary keys are UUIDs so that identifiers are safe to expose in APIs."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimestampedModel):
    """Default base for ComplyWise records."""

    class Meta:
        abstract = True


class AppendOnlyModel(UUIDModel):
    """Base for immutable historical facts.

    Decision runs, decision results and profile versions are historical facts
    (TRD_v2.0 §18, §22, §48). They gain an explicit `created_at` but no
    `updated_at`, because rewriting them would destroy reproducibility.
    """

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        abstract = True
