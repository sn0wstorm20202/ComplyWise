"""Serializers for workflows boundary."""

from __future__ import annotations

from rest_framework import serializers
from apps.documents.serializers import DocumentRequirementSerializer
from apps.workflows.models import (
    ApplicationForm,
    CaseQuery,
    CaseRequirementDisposition,
    ComplianceCase,
    ExternalApplicationStatus,
    FormSubmission,
    HumanReview,
    ReviewTask,
    WorkflowDefinition,
    WorkflowDefinitionVersion,
    WorkflowEvent,
    WorkflowInstance,
    WorkflowStepDefinition,
    WorkflowStepInstance,
    WorkflowTransitionDefinition,
)



class WorkflowStepDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowStepDefinition
        fields = [
            "id",
            "code",
            "name",
            "step_type",
            "description",
            "sequence",
            "is_required",
            "configuration",
            "metadata",
        ]


class WorkflowTransitionDefinitionSerializer(serializers.ModelSerializer):
    from_step_code = serializers.ReadOnlyField(source="from_step.code")
    to_step_code = serializers.ReadOnlyField(source="to_step.code")

    class Meta:
        model = WorkflowTransitionDefinition
        fields = [
            "id",
            "from_step_code",
            "to_step_code",
            "event_code",
            "allowed_actor_type",
            "priority",
            "condition",
        ]


class WorkflowStepInstanceSerializer(serializers.ModelSerializer):
    step_code = serializers.ReadOnlyField(source="step_definition.code")
    step_name = serializers.ReadOnlyField(source="step_definition.name")
    step_type = serializers.ReadOnlyField(source="step_definition.step_type")
    sequence = serializers.ReadOnlyField(source="step_definition.sequence")

    class Meta:
        model = WorkflowStepInstance
        fields = [
            "id",
            "step_code",
            "step_name",
            "step_type",
            "sequence",
            "status_code",
            "started_at",
            "completed_at",
            "assigned_role",
            "data",
            "result",
        ]


class WorkflowInstanceSerializer(serializers.ModelSerializer):
    current_step = WorkflowStepDefinitionSerializer(read_only=True)
    step_instances = WorkflowStepInstanceSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowInstance
        fields = [
            "id",
            "status_code",
            "started_at",
            "completed_at",
            "current_step",
            "step_instances",
            "metadata",
        ]


class WorkflowEventSerializer(serializers.ModelSerializer):
    from_step_code = serializers.ReadOnlyField(source="from_step.code")
    to_step_code = serializers.ReadOnlyField(source="to_step.code")
    actor_email = serializers.ReadOnlyField(source="actor_user.email")

    class Meta:
        model = WorkflowEvent
        fields = [
            "id",
            "from_step_code",
            "to_step_code",
            "event_code",
            "actor_type",
            "actor_email",
            "payload",
            "notes",
            "created_at",
        ]


class ApplicationFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationForm
        fields = [
            "id",
            "code",
            "name",
            "description",
            "schema",
            "version",
        ]


class FormSubmissionSerializer(serializers.ModelSerializer):
    form_code = serializers.ReadOnlyField(source="form.code")
    submitted_by_email = serializers.ReadOnlyField(source="submitted_by.email")

    class Meta:
        model = FormSubmission
        fields = [
            "id",
            "form_code",
            "version_number",
            "form_data",
            "status_code",
            "submitted_by_email",
            "submitted_at",
        ]


class ExternalApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalApplicationStatus
        fields = [
            "id",
            "portal_name",
            "application_reference_number",
            "status_code",
            "status_date",
            "portal_remarks",
            "next_followup_date",
            "raw_response",
        ]


class ComplianceCaseListSerializer(serializers.ModelSerializer):
    business_name = serializers.ReadOnlyField(source="business.name")
    current_step_code = serializers.ReadOnlyField(source="current_workflow_instance.current_step.code")
    current_step_name = serializers.ReadOnlyField(source="current_workflow_instance.current_step.name")
    current_step_type = serializers.ReadOnlyField(source="current_workflow_instance.current_step.step_type")
    current_step_number = serializers.ReadOnlyField(source="current_workflow_instance.current_step.sequence")
    requirement_name = serializers.SerializerMethodField()
    authority = serializers.SerializerMethodField()
    documents_count = serializers.SerializerMethodField()
    documents_verified_count = serializers.SerializerMethodField()
    document_requirements = DocumentRequirementSerializer(many=True, read_only=True)

    class Meta:
        model = ComplianceCase
        fields = [
            "id",
            "case_number",
            "business",
            "business_name",
            "requirement_id_code",
            "requirement_name",
            "authority",
            "status_code",
            "priority",
            "current_step_code",
            "current_step_name",
            "current_step_type",
            "current_step_number",
            "documents_count",
            "documents_verified_count",
            "document_requirements",
            "opened_at",
            "completed_at",
            "updated_at",
        ]

    def get_requirement_name(self, obj: ComplianceCase) -> str:
        if obj.requirement and obj.requirement.name:
            return obj.requirement.name
        return obj.metadata.get("requirement_name") or obj.requirement_id_code

    def get_authority(self, obj: ComplianceCase) -> str:
        if obj.requirement and obj.requirement.authority:
            return obj.requirement.authority
        return obj.metadata.get("authority", "")

    def get_documents_count(self, obj: ComplianceCase) -> int:
        return obj.document_requirements.count()

    def get_documents_verified_count(self, obj: ComplianceCase) -> int:
        return obj.document_requirements.filter(status_code="VERIFIED").count()


class ReviewTaskSerializer(serializers.ModelSerializer):
    assigned_admin_email = serializers.ReadOnlyField(source="assigned_admin.email")
    assigned_admin_name = serializers.ReadOnlyField(source="assigned_admin.full_name")

    class Meta:
        model = ReviewTask
        fields = [
            "id",
            "review_type",
            "status",
            "priority",
            "assigned_admin_email",
            "assigned_admin_name",
            "started_at",
            "completed_at",
            "created_at",
        ]


class HumanReviewSerializer(serializers.ModelSerializer):
    reviewer_email = serializers.ReadOnlyField(source="reviewer.email")
    reviewer_name = serializers.ReadOnlyField(source="reviewer.full_name")

    class Meta:
        model = HumanReview
        fields = [
            "id",
            "decision",
            "reason",
            "required_action",
            "reviewer_email",
            "reviewer_name",
            "reviewed_at",
            "created_at",
        ]


class CaseQuerySerializer(serializers.ModelSerializer):
    raised_by_email = serializers.ReadOnlyField(source="raised_by.email")
    raised_by_name = serializers.ReadOnlyField(source="raised_by.full_name")
    resolved_by_email = serializers.ReadOnlyField(source="resolved_by.email")
    document_name = serializers.ReadOnlyField(source="document_requirement.name")

    class Meta:
        model = CaseQuery
        fields = [
            "id",
            "case",
            "document_requirement",
            "document_name",
            "document_submission",
            "raised_by",
            "raised_by_email",
            "raised_by_name",
            "query_type",
            "title",
            "message",
            "required_action",
            "severity",
            "status",
            "due_at",
            "resolved_at",
            "resolved_by",
            "resolved_by_email",
            "response_notes",
            "metadata",
            "created_at",
            "updated_at",
        ]


class CaseRequirementDispositionSerializer(serializers.ModelSerializer):
    requirement_name = serializers.SerializerMethodField()
    authority = serializers.SerializerMethodField()
    reviewer_name = serializers.SerializerMethodField()
    reviewer_email = serializers.ReadOnlyField(source="reviewer.email")

    class Meta:
        model = CaseRequirementDisposition
        fields = [
            "id",
            "case",
            "requirement",
            "requirement_id_code",
            "requirement_name",
            "authority",
            "original_applicability_status",
            "admin_disposition",
            "source",
            "reason",
            "reviewer",
            "reviewer_name",
            "reviewer_email",
            "evidence_refs",
            "user_visible",
            "user_action_required",
            "metadata",
            "created_at",
            "updated_at",
        ]

    def get_requirement_name(self, obj: CaseRequirementDisposition) -> str:
        if obj.requirement and obj.requirement.name:
            return obj.requirement.name
        return obj.requirement_id_code

    def get_authority(self, obj: CaseRequirementDisposition) -> str:
        if obj.requirement and obj.requirement.authority:
            return obj.requirement.authority
        return "Statutory Authority"

    def get_reviewer_name(self, obj: CaseRequirementDisposition) -> str | None:
        if obj.reviewer:
            return obj.reviewer.full_name or obj.reviewer.email
        return None


class ComplianceCaseDetailSerializer(serializers.ModelSerializer):
    business_name = serializers.ReadOnlyField(source="business.name")
    assigned_reviewer_email = serializers.ReadOnlyField(source="assigned_reviewer.email")
    assigned_reviewer_name = serializers.ReadOnlyField(source="assigned_reviewer.full_name")
    requirement_name = serializers.SerializerMethodField()
    authority = serializers.SerializerMethodField()
    workflow_instance = WorkflowInstanceSerializer(source="current_workflow_instance", read_only=True)
    document_requirements = DocumentRequirementSerializer(many=True, read_only=True)
    form_submissions = FormSubmissionSerializer(many=True, read_only=True)
    external_statuses = ExternalApplicationStatusSerializer(many=True, read_only=True)
    active_review_task = serializers.SerializerMethodField()
    human_reviews = HumanReviewSerializer(many=True, read_only=True)
    available_transitions = serializers.SerializerMethodField()
    workflow_steps = serializers.SerializerMethodField()
    business_context = serializers.SerializerMethodField()
    why_applicable = serializers.SerializerMethodField()
    current_task = serializers.SerializerMethodField()
    concurrency_version = serializers.IntegerField(read_only=True)
    active_queries = serializers.SerializerMethodField()
    dispositions = serializers.SerializerMethodField()
    deadlines = serializers.SerializerMethodField()

    class Meta:
        model = ComplianceCase
        fields = [
            "id",
            "case_number",
            "business",
            "business_name",
            "concurrency_version",
            "assigned_reviewer",
            "assigned_reviewer_email",
            "assigned_reviewer_name",
            "requirement_id_code",
            "requirement_name",
            "authority",
            "status_code",
            "priority",
            "opened_at",
            "completed_at",
            "closed_at",
            "metadata",
            "business_context",
            "why_applicable",
            "current_task",
            "active_review_task",
            "human_reviews",
            "active_queries",
            "dispositions",
            "deadlines",
            "workflow_instance",
            "workflow_steps",
            "document_requirements",
            "form_submissions",
            "external_statuses",
            "available_transitions",
            "created_at",
            "updated_at",
        ]

    def get_requirement_name(self, obj: ComplianceCase) -> str:
        if obj.requirement and obj.requirement.name:
            return obj.requirement.name
        return obj.metadata.get("requirement_name") or obj.requirement_id_code

    def get_authority(self, obj: ComplianceCase) -> str:
        if obj.requirement and obj.requirement.authority:
            return obj.requirement.authority
        return obj.metadata.get("authority", "")

    def get_workflow_steps(self, obj: ComplianceCase) -> list[dict]:
        if not obj.workflow_version:
            return []
        steps = obj.workflow_version.step_definitions.all().order_by("sequence")
        return WorkflowStepDefinitionSerializer(steps, many=True).data

    def get_available_transitions(self, obj: ComplianceCase) -> list[dict]:
        inst = obj.current_workflow_instance
        if not inst or not inst.current_step or not obj.workflow_version:
            return []
        transitions = WorkflowTransitionDefinition.objects.filter(
            workflow_version=obj.workflow_version,
            from_step=inst.current_step,
        ).order_by("priority")
        return WorkflowTransitionDefinitionSerializer(transitions, many=True).data

    def get_active_review_task(self, obj: ComplianceCase) -> dict | None:
        task = obj.review_tasks.order_by("-created_at").first()
        if task:
            return ReviewTaskSerializer(task).data
        return None

    def get_business_context(self, obj: ComplianceCase) -> dict:
        from apps.workflows.services.case_service import CaseService
        return CaseService.get_business_context(obj)

    def get_why_applicable(self, obj: ComplianceCase) -> str:
        from apps.workflows.services.case_service import CaseService
        return CaseService.get_why_applicable_summary(obj)

    def get_current_task(self, obj: ComplianceCase) -> dict:
        from apps.workflows.services.case_service import CaseService
        return CaseService.get_current_user_task(obj)

    def get_active_queries(self, obj: ComplianceCase) -> list[dict]:
        qs = obj.case_queries.all().order_by("-created_at")
        return CaseQuerySerializer(qs, many=True).data

    def get_dispositions(self, obj: ComplianceCase) -> list[dict]:
        qs = obj.dispositions.all().order_by("-created_at")
        return CaseRequirementDispositionSerializer(qs, many=True).data

    def get_deadlines(self, obj: ComplianceCase) -> list[dict]:
        from apps.calendar.serializers import DeadlineSerializer
        qs = obj.calendar_deadlines.all().order_by("due_at")
        return DeadlineSerializer(qs, many=True).data


