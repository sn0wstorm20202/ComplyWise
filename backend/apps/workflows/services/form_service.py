"""Form Service managing application form definitions, verification, and submissions.

Authority: Architectural Specification §26, §38.
"""

from __future__ import annotations

import logging
from typing import Any
from django.db import transaction

from common.enums import ActorType
from apps.workflows.engine import GenericWorkflowEngine
from apps.workflows.models import ApplicationForm, ComplianceCase, FormSubmission

logger = logging.getLogger(__name__)


class FormService:
    @classmethod
    def get_form_spec(cls) -> ApplicationForm | None:
        """Return active standard statutory application form template."""
        return ApplicationForm.objects.filter(is_active=True).first()

    @classmethod
    @transaction.atomic
    def submit_application_form(
        cls,
        *,
        case: ComplianceCase,
        form_data: dict[str, Any],
        user=None,
    ) -> FormSubmission:
        """Create versioned form submission and advance workflow to EXTERNAL_PROCESSING."""
        form = cls.get_form_spec()
        if not form:
            raise ValueError("No active ApplicationForm found.")

        sub_count = case.form_submissions.count()
        submission = FormSubmission.objects.create(
            compliance_case=case,
            form=form,
            version_number=sub_count + 1,
            form_data=dict(form_data),
            status_code="SUBMITTED",
            submitted_by=user,
        )

        try:
            GenericWorkflowEngine.trigger_transition(
                compliance_case=case,
                event_code="FORM_SUBMITTED",
                actor_type=ActorType.USER,
                actor_user=user,
                payload={"form_submission_id": str(submission.id), "form_code": form.code},
                notes=f"Statutory Application Form {form.name} submitted.",
            )
        except Exception as exc:
            logger.debug("FORM_SUBMITTED transition error: %s", exc)

        return submission
