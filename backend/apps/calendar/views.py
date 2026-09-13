"""Calendar views for Screen 12 and in-app compliance notifications.

Authority: PRD_v2.0 §20, §P5; TRD_v2.0 §30, §31.

The calendar reports only what published knowledge states: renewal cycles recorded
in requirement metadata for requirements the engine found APPLICABLE.

In-app notification endpoints provide:
- Notification audit listing with filtering (read/unread, channel, priority, event_type).
- Read status mutation (mark single as read, mark all as read).
- Aggregate dashboard summaries (urgent, upcoming, overdue, unread).
- User notification preferences (channel toggles & localization).
"""

from __future__ import annotations

import uuid
from typing import Any

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from apps.businesses.models import Business
from apps.calendar.models import (
    DeadlineNotificationDelivery,
    NotificationPreference,
)
from domain.intelligence.calendar_derivation import derive_business_calendar


class BusinessCalendarListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment_id = request.query_params.get("assessment_id")
        payload = derive_business_calendar(business, assessment_id=assessment_id)
        return Response(envelope(payload), status=status.HTTP_200_OK)


class BusinessCalendarNotificationsListView(APIView):
    """List sent and pending deadline notification audit records for a business.

    Supports query filters:
    - `channel`: GOOGLE_CALENDAR, EMAIL, IN_APP
    - `status`: DELIVERED, SIMULATED, FAILED, PENDING, SKIPPED_DUPLICATE
    - `is_read`: true, false
    - `priority`: LOW, MEDIUM, HIGH, CRITICAL
    - `event_type`: UPCOMING, OVERDUE, ESCALATION
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        query = DeadlineNotificationDelivery.objects.filter(business=business)

        channel = request.query_params.get("channel")
        if channel:
            query = query.filter(channel=channel.upper())

        status_param = request.query_params.get("status")
        if status_param:
            query = query.filter(status=status_param.upper())

        is_read_param = request.query_params.get("is_read")
        if is_read_param is not None:
            if is_read_param.lower() in {"true", "1"}:
                query = query.filter(is_read=True)
            elif is_read_param.lower() in {"false", "0"}:
                query = query.filter(is_read=False)

        priority = request.query_params.get("priority")
        if priority:
            query = query.filter(priority=priority.upper())

        event_type = request.query_params.get("event_type")
        if event_type:
            query = query.filter(event_type=event_type.upper())

        limit = min(int(request.query_params.get("limit", 100)), 200)
        records = query.order_by("-created_at")[:limit]

        data = [
            {
                "id": str(r.id),
                "requirement_id": r.requirement_id,
                "deadline_date": r.deadline_date.isoformat(),
                "offset_days": r.offset_days,
                "channel": r.channel,
                "event_type": r.event_type,
                "priority": r.priority,
                "status": r.status,
                "language": r.language,
                "subject_or_title": r.subject_or_title,
                "recipient": r.recipient,
                "is_read": r.is_read,
                "read_at": r.read_at.isoformat() if r.read_at else None,
                "attempt_count": r.attempt_count,
                "failure_reason": r.failure_reason,
                "provider": r.provider,
                "created_at": r.created_at.isoformat(),
                "details": r.details,
            }
            for r in records
        ]
        return Response(envelope({"count": len(data), "notifications": data}), status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    """Mark an individual in-app notification as read."""

    permission_classes = [IsAuthenticated]

    def patch(self, request: Request, business_id, notification_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        try:
            notif_uuid = uuid.UUID(str(notification_id))
        except (ValueError, TypeError):
            return error_response("INVALID_ID", "Invalid notification UUID.", http_status=status.HTTP_400_BAD_REQUEST)

        record = DeadlineNotificationDelivery.objects.filter(pk=notif_uuid, business=business).first()
        if record is None:
            return error_response("NOT_FOUND", "Notification not found.", http_status=status.HTTP_404_NOT_FOUND)

        record.is_read = True
        record.read_at = timezone.now()
        record.save(update_fields=["is_read", "read_at", "updated_at"])

        return Response(
            envelope({
                "id": str(record.id),
                "is_read": record.is_read,
                "read_at": record.read_at.isoformat(),
                "message": "Notification marked as read.",
            }),
            status=status.HTTP_200_OK,
        )


class NotificationMarkAllReadView(APIView):
    """Mark all in-app notifications as read for a business."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        updated_count = DeadlineNotificationDelivery.objects.filter(
            business=business,
            is_read=False,
        ).update(is_read=True, read_at=now)

        return Response(
            envelope({
                "updated_count": updated_count,
                "read_at": now.isoformat(),
                "message": f"Marked {updated_count} notification(s) as read.",
            }),
            status=status.HTTP_200_OK,
        )


class NotificationSummaryView(APIView):
    """Provide aggregated counts of notifications for dashboard widgets."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        qs = DeadlineNotificationDelivery.objects.filter(business=business)
        total = qs.count()
        unread = qs.filter(is_read=False).count()
        urgent = qs.filter(priority__in=["HIGH", "CRITICAL"]).count()
        overdue = qs.filter(event_type="OVERDUE").count()
        upcoming = qs.filter(event_type="UPCOMING").count()

        by_priority = {
            "CRITICAL": qs.filter(priority="CRITICAL").count(),
            "HIGH": qs.filter(priority="HIGH").count(),
            "MEDIUM": qs.filter(priority="MEDIUM").count(),
            "LOW": qs.filter(priority="LOW").count(),
        }

        by_channel = {
            "GOOGLE_CALENDAR": qs.filter(channel="GOOGLE_CALENDAR").count(),
            "EMAIL": qs.filter(channel="EMAIL").count(),
            "IN_APP": qs.filter(channel="IN_APP").count(),
        }

        return Response(
            envelope({
                "total": total,
                "unread_count": unread,
                "urgent_count": urgent,
                "overdue_count": overdue,
                "upcoming_count": upcoming,
                "by_priority": by_priority,
                "by_channel": by_channel,
            }),
            status=status.HTTP_200_OK,
        )


class NotificationPreferenceView(APIView):
    """Retrieve and update user notification preferences."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        pref = (
            NotificationPreference.objects.filter(user=request.user, business=business).first()
            or NotificationPreference.objects.filter(user=request.user, business=None).first()
        )

        return Response(
            envelope({
                "email_enabled": pref.email_enabled if pref else True,
                "calendar_enabled": pref.calendar_enabled if pref else True,
                "in_app_enabled": pref.in_app_enabled if pref else True,
                "language": pref.language if pref else "en",
            }),
            status=status.HTTP_200_OK,
        )

    def put(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        data = request.data or {}
        pref, _ = NotificationPreference.objects.get_or_create(
            user=request.user,
            business=business,
            defaults={
                "email_enabled": True,
                "calendar_enabled": True,
                "in_app_enabled": True,
                "language": "en",
            },
        )

        if "email_enabled" in data:
            pref.email_enabled = bool(data["email_enabled"])
        if "calendar_enabled" in data:
            pref.calendar_enabled = bool(data["calendar_enabled"])
        if "in_app_enabled" in data:
            pref.in_app_enabled = bool(data["in_app_enabled"])
        if "language" in data:
            clean_lang = str(data["language"]).strip().lower()
            if clean_lang in {"en", "hi", "bn"}:
                pref.language = clean_lang

        pref.save()

        return Response(
            envelope({
                "email_enabled": pref.email_enabled,
                "calendar_enabled": pref.calendar_enabled,
                "in_app_enabled": pref.in_app_enabled,
                "language": pref.language,
                "message": "Notification preferences updated.",
            }),
            status=status.HTTP_200_OK,
        )


class NotificationSyncView(APIView):
    """Trigger on-demand evaluation and dispatch of compliance notifications for a business."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, business_id) -> Response:  # noqa: ANN001
        business = Business.accessible_to(request.user).filter(pk=business_id).first()
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        from apps.calendar.services import evaluate_and_send_deadline_notifications

        data = request.data or {}
        check_overdue = bool(data.get("check_overdue", True))
        include_in_app = bool(data.get("include_in_app", True))
        policy = data.get("policy", "default")

        result = evaluate_and_send_deadline_notifications(
            business=business,
            check_overdue=check_overdue,
            include_in_app=include_in_app,
            policy=policy,
        )

        return Response(
            envelope({
                "message": "Calendar notification evaluation completed successfully.",
                "dispatched_count": result.get("dispatched_count", 0),
                "skipped_idempotent_count": result.get("skipped_idempotent_count", 0),
                "failed_count": result.get("failed_count", 0),
                "results": result.get("results", []),
            }),
            status=status.HTTP_200_OK,
        )

