"""Models for the workflows boundary.

Authority: Architectural Specification §1-§40.
Enforces:
1. Compliance determines the case. Workflow determines the progress.
2. Configuration-driven workflow templates: Database determines steps and transitions, code only executes.
3. Every state transition is an immutable WorkflowEvent.
4. Separation between internal review and external government portal tracking.
"""

from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from common.enums import (
    ActorType,
    AdminDisposition,
    CaseStatus,
    ExternalApplicationStatusEnum,
    NotificationChannel,
    NotificationDeliveryStatus,
    OutboxStatus,
    Priority,
    QuerySeverity,
    QueryStatus,
    QueryType,
    StepStatus,
    WorkflowStatus,
    WorkflowStepType,
)
from common.models import AppendOnlyModel, BaseModel


# ---------------------------------------------------------------------------
# 1. Configuration-Driven Workflow Templates
# ---------------------------------------------------------------------------

class WorkflowDefinition(BaseModel):
    """Template definition for a regulatory or statutory workflow."""

    code = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    scope = models.CharField(max_length=50, default="REGULATORY")
    is_active = models.BooleanField(default=True)
    current_version = models.ForeignKey(
        "WorkflowDefinitionVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_definition"
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class WorkflowDefinitionVersion(BaseModel):
    """Versioned immutable definition of a workflow graph."""

    workflow_definition = models.ForeignKey(
        WorkflowDefinition,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=30, default="PUBLISHED")
    effective_from = models.DateTimeField(null=True, blank=True)
    effective_until = models.DateTimeField(null=True, blank=True)
    configuration = models.JSONField(default=dict, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "workflows_definition_version"
        ordering = ["workflow_definition", "-version_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["workflow_definition", "version_number"],
                name="uniq_workflow_version",
            )
        ]

    def __str__(self) -> str:
        return f"{self.workflow_definition.code} v{self.version_number} [{self.status}]"


class WorkflowStepDefinition(BaseModel):
    """Configured step in a workflow definition version."""

    workflow_version = models.ForeignKey(
        WorkflowDefinitionVersion,
        on_delete=models.CASCADE,
        related_name="step_definitions",
    )
    code = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=255)
    step_type = models.CharField(
        max_length=50,
        choices=WorkflowStepType.choices,
        default=WorkflowStepType.INFORMATION,
    )
    description = models.TextField(blank=True, default="")
    sequence = models.PositiveIntegerField(default=1)
    is_required = models.BooleanField(default=True)
    configuration = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_step_definition"
        ordering = ["workflow_version", "sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["workflow_version", "code"],
                name="uniq_step_code_per_version",
            )
        ]

    def __str__(self) -> str:
        return f"{self.workflow_version.workflow_definition.code} v{self.workflow_version.version_number}: Step {self.sequence} - {self.name} ({self.code})"


class WorkflowTransitionDefinition(BaseModel):
    """Directed state transition edge in a workflow graph."""

    workflow_version = models.ForeignKey(
        WorkflowDefinitionVersion,
        on_delete=models.CASCADE,
        related_name="transition_definitions",
    )
    from_step = models.ForeignKey(
        WorkflowStepDefinition,
        on_delete=models.CASCADE,
        related_name="outgoing_transitions",
    )
    to_step = models.ForeignKey(
        WorkflowStepDefinition,
        on_delete=models.CASCADE,
        related_name="incoming_transitions",
    )
    event_code = models.CharField(max_length=100, db_index=True)
    condition = models.JSONField(default=dict, blank=True)
    allowed_actor_type = models.CharField(
        max_length=30,
        choices=ActorType.choices,
        default=ActorType.ANY,
    )
    priority = models.IntegerField(default=100)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_transition_definition"
        ordering = ["priority", "event_code"]

    def __str__(self) -> str:
        return f"{self.from_step.code} --[{self.event_code}]--> {self.to_step.code}"


# ---------------------------------------------------------------------------
# 2. Central Parent: ComplianceCase
# ---------------------------------------------------------------------------

class ComplianceCase(BaseModel):
    """The central case coordinating documents, forms, workflow, and tracking for a requirement."""

    case_number = models.CharField(max_length=64, unique=True, db_index=True)
    business = models.ForeignKey(
        "businesses.Business",
        on_delete=models.CASCADE,
        related_name="compliance_cases",
        db_index=True,
    )
    assessment = models.ForeignKey(
        "businesses.Assessment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="compliance_cases",
    )
    requirement = models.ForeignKey(
        "knowledge.RequirementDefinition",
        on_delete=models.CASCADE,
        related_name="compliance_cases",
        null=True,
        blank=True,
    )
    requirement_id_code = models.CharField(max_length=100, db_index=True)
    rule_version = models.ForeignKey(
        "knowledge.RuleVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="compliance_cases",
    )
    profile_version = models.ForeignKey(
        "businesses.BusinessProfileVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="compliance_cases",
    )
    workflow_definition = models.ForeignKey(
        WorkflowDefinition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="compliance_cases",
    )
    workflow_version = models.ForeignKey(
        WorkflowDefinitionVersion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="compliance_cases",
    )
    current_workflow_instance = models.ForeignKey(
        "WorkflowInstance",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    status_code = models.CharField(
        max_length=30,
        choices=CaseStatus.choices,
        default=CaseStatus.OPEN,
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    assigned_reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_compliance_cases",
    )
    opened_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    concurrency_version = models.PositiveIntegerField(
        default=1,
        db_index=True,
        help_text="Optimistic concurrency control version. Increments on every transition/action.",
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_compliance_case"
        ordering = ["-opened_at"]
        indexes = [
            models.Index(fields=["business", "status_code"]),
            models.Index(fields=["requirement_id_code", "status_code"]),
        ]

    def __str__(self) -> str:
        return f"{self.case_number} - {self.requirement_id_code} [{self.status_code}]"


# ---------------------------------------------------------------------------
# 3. Workflow Execution Instances
# ---------------------------------------------------------------------------

class WorkflowInstance(BaseModel):
    """Runtime execution instance of a workflow for a compliance case."""

    compliance_case = models.ForeignKey(
        ComplianceCase,
        on_delete=models.CASCADE,
        related_name="workflow_instances",
    )
    workflow_definition_version = models.ForeignKey(
        WorkflowDefinitionVersion,
        on_delete=models.CASCADE,
        related_name="instances",
    )
    current_step = models.ForeignKey(
        WorkflowStepDefinition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    status_code = models.CharField(
        max_length=30,
        choices=WorkflowStatus.choices,
        default=WorkflowStatus.IN_PROGRESS,
    )
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    context_snapshot = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_instance"
        ordering = ["-started_at"]

    def __str__(self) -> str:
        step_name = self.current_step.name if self.current_step else "Finished"
        return f"WorkflowInstance {self.id} for {self.compliance_case.case_number} ({step_name})"


class WorkflowStepInstance(BaseModel):
    """Specific step execution entry within a workflow instance."""

    workflow_instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.CASCADE,
        related_name="step_instances",
    )
    step_definition = models.ForeignKey(
        WorkflowStepDefinition,
        on_delete=models.CASCADE,
        related_name="+",
    )
    status_code = models.CharField(
        max_length=30,
        choices=StepStatus.choices,
        default=StepStatus.NOT_STARTED,
    )
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    assigned_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    assigned_role = models.CharField(max_length=50, blank=True, default="")
    data = models.JSONField(default=dict, blank=True)
    result = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_step_instance"
        ordering = ["workflow_instance", "started_at"]

    def __str__(self) -> str:
        return f"{self.step_definition.name} [{self.status_code}]"


# ---------------------------------------------------------------------------
# 3b. Human Review Tasks & Scrutiny Records
# ---------------------------------------------------------------------------

class ReviewTask(BaseModel):
    """Specific human review assignment for a compliance case.

    Authority: Architectural Specification §12, §13, §44.
    """

    case = models.ForeignKey(
        ComplianceCase,
        on_delete=models.CASCADE,
        related_name="review_tasks",
        db_index=True,
    )
    assigned_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_review_tasks",
    )
    review_type = models.CharField(
        max_length=50,
        default="DOCUMENT_REVIEW",
    )
    status = models.CharField(
        max_length=30,
        default="PENDING",
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_review_task"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        admin_str = self.assigned_admin.email if self.assigned_admin else "Unassigned"
        return f"ReviewTask for {self.case.case_number} [{self.status}] - {admin_str}"


class HumanReview(BaseModel):
    """Official scrutiny decision recorded by a human compliance officer.

    Authority: Architectural Specification §12, §15, §33.
    """

    task = models.ForeignKey(
        ReviewTask,
        on_delete=models.CASCADE,
        related_name="human_reviews",
        null=True,
        blank=True,
    )
    case = models.ForeignKey(
        ComplianceCase,
        on_delete=models.CASCADE,
        related_name="human_reviews",
        db_index=True,
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conducted_human_reviews",
    )
    decision = models.CharField(
        max_length=30,
        choices=[
            ("APPROVE", "Approve"),
            ("QUERY", "Raise Query"),
            ("REJECT", "Reject"),
        ],
    )
    reason = models.TextField(blank=True, default="")
    required_action = models.TextField(blank=True, default="")
    reviewed_at = models.DateTimeField(default=timezone.now)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_human_review"
        ordering = ["-reviewed_at"]

    def __str__(self) -> str:
        return f"{self.decision} on {self.case.case_number} by {self.reviewer}"


class CaseQuery(BaseModel):
    """First-class compliance case and document query/objection object.

    Authority: Architectural Specification §9, §10, §15, §16.
    Created when Compliance Officer raises a query or document correction request.
    Attached to the exact ComplianceCase and optional DocumentRequirement/DocumentSubmission.
    """

    case = models.ForeignKey(
        ComplianceCase,
        on_delete=models.CASCADE,
        related_name="case_queries",
        db_index=True,
    )
    document_requirement = models.ForeignKey(
        "documents.DocumentRequirement",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="case_queries",
    )
    document_submission = models.ForeignKey(
        "documents.DocumentSubmission",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="case_queries",
    )
    raised_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="raised_case_queries",
    )
    query_type = models.CharField(
        max_length=50,
        choices=QueryType.choices,
        default=QueryType.DOCUMENT_CORRECTION,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    required_action = models.TextField()
    severity = models.CharField(
        max_length=20,
        choices=QuerySeverity.choices,
        default=QuerySeverity.MEDIUM,
    )
    status = models.CharField(
        max_length=30,
        choices=QueryStatus.choices,
        default=QueryStatus.OPEN,
        db_index=True,
    )
    due_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    response_notes = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_case_query"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["case", "status"]),
        ]

    def __str__(self) -> str:
        return f"Query [{self.status}]: {self.title} on {self.case.case_number}"


class CaseRequirementDisposition(BaseModel):
    """Case-level administrative treatment of a statutory compliance obligation.

    Authority: Architectural Specification §11-§16, §40.
    CRITICAL INVARIANT: Never overwrites original system rule applicability.
    Stores the distinct admin operational judgment (CONFIRMED_REQUIRED, NOT_REQUIRED, etc.)
    with mandatory rationale and audit provenance.
    """

    case = models.ForeignKey(
        ComplianceCase,
        on_delete=models.CASCADE,
        related_name="dispositions",
        db_index=True,
    )
    requirement = models.ForeignKey(
        "knowledge.RequirementDefinition",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="case_dispositions",
    )
    requirement_id_code = models.CharField(max_length=100, db_index=True)
    original_applicability_status = models.CharField(
        max_length=50,
        default="APPLICABLE",
        help_text="Immutable rule-engine result (APPLICABLE, CONDITIONAL, etc.)",
    )
    admin_disposition = models.CharField(
        max_length=50,
        choices=AdminDisposition.choices,
        default=AdminDisposition.CONFIRMED_REQUIRED,
        db_index=True,
    )
    source = models.CharField(
        max_length=50,
        default="SYSTEM_RULE",
        help_text="SYSTEM_RULE, ADMIN_ASSIGNED, or CATALOG_ATTACHED",
    )
    reason = models.TextField(
        blank=True,
        default="",
        help_text="Mandatory rationale when changing treatment from default rule evaluation",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requirement_dispositions",
    )
    evidence_refs = models.JSONField(default=list, blank=True)
    user_visible = models.BooleanField(default=True)
    user_action_required = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_requirement_disposition"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["case", "requirement_id_code"],
                name="uniq_case_requirement_disposition",
            )
        ]

    def __str__(self) -> str:
        return f"{self.requirement_id_code} -> {self.admin_disposition} for {self.case.case_number}"



# ---------------------------------------------------------------------------
# 4. Immutable Audit Events
# ---------------------------------------------------------------------------

class WorkflowEvent(AppendOnlyModel):
    """Immutable audit trail of state transitions, reviews, and case milestones."""

    compliance_case = models.ForeignKey(
        ComplianceCase,
        on_delete=models.CASCADE,
        related_name="events",
    )
    workflow_instance = models.ForeignKey(
        WorkflowInstance,
        on_delete=models.CASCADE,
        related_name="events",
        null=True,
        blank=True,
    )
    from_step = models.ForeignKey(
        WorkflowStepDefinition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    to_step = models.ForeignKey(
        WorkflowStepDefinition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    event_code = models.CharField(max_length=100, db_index=True)
    actor_type = models.CharField(
        max_length=30,
        choices=ActorType.choices,
        default=ActorType.SYSTEM,
    )
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    payload = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "workflows_event"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.event_code} by {self.actor_type} on {self.compliance_case.case_number}"


# ---------------------------------------------------------------------------
# 5. Form Tracking & External Government Portal Status
# ---------------------------------------------------------------------------

class ApplicationForm(BaseModel):
    """Statutory or filing form specification."""

    code = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    schema = models.JSONField(default=dict, blank=True)
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "workflows_application_form"
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class FormSubmission(BaseModel):
    """Completed application form submission tied to a compliance case."""

    compliance_case = models.ForeignKey(
        ComplianceCase,
        on_delete=models.CASCADE,
        related_name="form_submissions",
    )
    workflow_step_instance = models.ForeignKey(
        WorkflowStepInstance,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="form_submissions",
    )
    form = models.ForeignKey(
        ApplicationForm,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    version_number = models.PositiveIntegerField(default=1)
    form_data = models.JSONField(default=dict, blank=True)
    status_code = models.CharField(max_length=30, default="SUBMITTED")
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    submitted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "workflows_form_submission"
        ordering = ["-submitted_at"]

    def __str__(self) -> str:
        return f"{self.form.code} v{self.version_number} for {self.compliance_case.case_number}"


class ExternalApplicationStatus(BaseModel):
    """Official status reported by external government portal (FoSCoS, SPCB, etc.).

    Invariant: Strictly separate from internal review. Internal human review = our platform team.
    External status = government authority.
    """

    compliance_case = models.ForeignKey(
        ComplianceCase,
        on_delete=models.CASCADE,
        related_name="external_statuses",
    )
    portal_name = models.CharField(max_length=100)
    application_reference_number = models.CharField(max_length=100, blank=True, default="")
    status_code = models.CharField(
        max_length=50,
        choices=ExternalApplicationStatusEnum.choices,
        default=ExternalApplicationStatusEnum.SUBMITTED,
    )
    status_date = models.DateTimeField(default=timezone.now)
    portal_remarks = models.TextField(blank=True, default="")
    next_followup_date = models.DateField(null=True, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_external_application_status"
        ordering = ["-status_date"]

    def __str__(self) -> str:
        return f"{self.portal_name} [{self.status_code}] for {self.compliance_case.case_number}"


# ---------------------------------------------------------------------------
# 6. Idempotent Notification System
# ---------------------------------------------------------------------------

class NotificationEvent(AppendOnlyModel):
    """Notification event generated by workflow transitions, reviews, or queries."""

    event_type = models.CharField(max_length=100, db_index=True)
    compliance_case = models.ForeignKey(
        ComplianceCase,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    recipient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="compliance_notifications",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_notification_event"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Notification: {self.title} -> {self.recipient_user.email}"


class NotificationDelivery(BaseModel):
    """Specific channel delivery attempt for a notification event."""

    notification_event = models.ForeignKey(
        NotificationEvent,
        on_delete=models.CASCADE,
        related_name="deliveries",
    )
    channel = models.CharField(
        max_length=30,
        choices=NotificationChannel.choices,
    )
    status = models.CharField(
        max_length=20,
        choices=NotificationDeliveryStatus.choices,
        default=NotificationDeliveryStatus.PENDING,
    )
    delivered_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")

    class Meta:
        db_table = "workflows_notification_delivery"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["notification_event", "channel"],
                name="uniq_delivery_event_channel",
            )
        ]

    def __str__(self) -> str:
        return f"{self.channel} [{self.status}] for {self.notification_event.title}"


# ---------------------------------------------------------------------------
# 7. Transactional Outbox & Security Audit Log
# ---------------------------------------------------------------------------

class OutboxEvent(AppendOnlyModel):
    """Transactional outbox for reliable asynchronous side effects (Email, Calendar, Realtime).

    Authority: Architectural Specification §22, §23, §33.
    Guarantees that database state commits before side effects execute, preventing partial failures.
    """

    event_type = models.CharField(max_length=100, db_index=True)
    payload = models.JSONField(default=dict)
    status = models.CharField(
        max_length=30,
        choices=OutboxStatus.choices,
        default=OutboxStatus.PENDING,
        db_index=True,
    )
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    last_error = models.TextField(blank=True, default="")
    idempotency_key = models.CharField(max_length=255, unique=True, null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "workflows_outbox_event"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"OutboxEvent {self.event_type} [{self.status}]"


class SecurityAuditEvent(AppendOnlyModel):
    """Immutable audit record of sensitive document access, admin overrides, and security actions.

    Authority: Architectural Specification §35, §38.
    """

    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    actor_type = models.CharField(
        max_length=30,
        choices=ActorType.choices,
        default=ActorType.USER,
    )
    action = models.CharField(max_length=100, db_index=True)
    resource_type = models.CharField(max_length=100, db_index=True)
    resource_id = models.CharField(max_length=100, db_index=True)
    ip_address = models.CharField(max_length=100, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "workflows_security_audit"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"SecurityAudit: {self.actor_type} {self.action} on {self.resource_type}:{self.resource_id}"
