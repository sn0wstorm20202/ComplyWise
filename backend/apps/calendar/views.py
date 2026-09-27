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
from rest_framework.permissions import AllowAny, IsAuthenticated
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


class GoogleCalendarAuthUrlView(APIView):
    """Generate per-user Google Calendar OAuth authorization consent URL."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        import urllib.parse
        from django.conf import settings

        client_id = (getattr(settings, "GOOGLE_CALENDAR_CLIENT_ID", "") or "").strip()
        if not client_id:
            return Response(
                envelope({
                    "configured": False,
                    "message": "Google Calendar Client ID is not configured on this server.",
                    "auth_url": "",
                }),
                status=status.HTTP_200_OK,
            )

        redirect_uri = request.query_params.get("redirect_uri")
        if not redirect_uri:
            # Default to frontend calendar origin
            redirect_uri = "http://localhost:3000/calendar"

        # Minimum required scope: only calendar events
        scope = "https://www.googleapis.com/auth/calendar.events"
        state = f"user_{request.user.id}"

        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": scope,
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)

        return Response(
            envelope({
                "configured": True,
                "auth_url": auth_url,
                "scope": scope,
            }),
            status=status.HTTP_200_OK,
        )


class GoogleCalendarCallbackView(APIView):
    """Exchange authorization code for user-specific tokens and persist connection."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        import json
        import urllib.error
        import urllib.parse
        import urllib.request
        from datetime import timedelta
        from django.conf import settings
        from apps.calendar.models import UserGoogleCalendarConnection

        code = (request.data.get("code") or "").strip()
        if not code:
            return error_response("INVALID_CODE", "Authorization code is required.", http_status=status.HTTP_400_BAD_REQUEST)

        client_id = (getattr(settings, "GOOGLE_CALENDAR_CLIENT_ID", "") or "").strip()
        client_secret = (getattr(settings, "GOOGLE_CALENDAR_CLIENT_SECRET", "") or "").strip()
        if not client_id or not client_secret:
            return error_response(
                "OAUTH_MISCONFIGURED",
                "Google Calendar client credentials are not configured on this server.",
                http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        redirect_uri = request.data.get("redirect_uri") or "http://localhost:3000/calendar"

        # Exchange code for tokens
        try:
            token_payload = urllib.parse.urlencode({
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            }).encode("utf-8")

            token_req = urllib.request.Request(
                "https://oauth2.googleapis.com/token",
                data=token_payload,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                method="POST",
            )
            with urllib.request.urlopen(token_req, timeout=15) as resp:
                token_data = json.loads(resp.read().decode("utf-8"))

            access_token = token_data.get("access_token", "")
            refresh_token = token_data.get("refresh_token", "")
            expires_in = int(token_data.get("expires_in", 3600))

            if not access_token:
                return error_response("TOKEN_EXCHANGE_FAILED", "Google did not return an access token.", http_status=status.HTTP_400_BAD_REQUEST)

            # Retrieve primary calendar identity using the calendar token itself
            google_email = ""
            try:
                cal_req = urllib.request.Request(
                    "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                with urllib.request.urlopen(cal_req, timeout=10) as cal_resp:
                    cal_data = json.loads(cal_resp.read().decode("utf-8"))
                    google_email = cal_data.get("id") or cal_data.get("summary") or ""
            except Exception:
                google_email = request.user.email

            now = timezone.now()
            expires_at = now + timedelta(seconds=expires_in)

            # Fetch existing connection to preserve refresh_token if Google omitted it on re-consent
            existing = UserGoogleCalendarConnection.objects.filter(user=request.user).first()
            final_refresh = refresh_token or (existing.refresh_token if existing else "")

            conn, _ = UserGoogleCalendarConnection.objects.update_or_create(
                user=request.user,
                defaults={
                    "google_email": google_email or request.user.email,
                    "access_token": access_token,
                    "refresh_token": final_refresh,
                    "expires_at": expires_at,
                    "is_active": True,
                    "calendar_id": "primary",
                    "scopes": "https://www.googleapis.com/auth/calendar.events",
                },
            )

            return Response(
                envelope({
                    "connected": True,
                    "google_email": conn.google_email,
                    "message": "Google Calendar successfully connected.",
                }),
                status=status.HTTP_200_OK,
            )

        except urllib.error.HTTPError as exc:
            err_msg = ""
            try:
                err_msg = exc.read().decode("utf-8")
            except Exception:
                pass
            return error_response("OAUTH_ERROR", f"Google token exchange failed: {err_msg or exc.reason}", http_status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return error_response("OAUTH_ERROR", f"Failed to connect Google Calendar: {exc}", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleCalendarStatusView(APIView):
    """Check current user's Google Calendar connection status."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        from apps.calendar.models import UserGoogleCalendarConnection

        conn = UserGoogleCalendarConnection.objects.filter(user=request.user, is_active=True).first()
        if conn is None:
            return Response(
                envelope({
                    "connected": False,
                    "google_email": "",
                    "last_synced_at": None,
                }),
                status=status.HTTP_200_OK,
            )

        return Response(
            envelope({
                "connected": True,
                "google_email": conn.google_email,
                "last_synced_at": conn.last_synced_at.isoformat() if conn.last_synced_at else None,
                "calendar_id": conn.calendar_id,
            }),
            status=status.HTTP_200_OK,
        )


class GoogleCalendarDisconnectView(APIView):
    """Disconnect and revoke Google Calendar authorization for the current user."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        from apps.calendar.models import UserGoogleCalendarConnection

        conn = UserGoogleCalendarConnection.objects.filter(user=request.user).first()
        if conn:
            conn.is_active = False
            conn.access_token = ""
            conn.refresh_token = ""
            conn.save(update_fields=["is_active", "access_token", "refresh_token", "updated_at"])

        return Response(
            envelope({
                "connected": False,
                "message": "Google Calendar disconnected.",
            }),
            status=status.HTTP_200_OK,
        )


class CaseDeadlinesListView(APIView):
    """Retrieve compliance deadlines associated with a specific case."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, case_id) -> Response:
        from apps.calendar.models import Deadline
        from apps.calendar.serializers import DeadlineSerializer
        from apps.workflows.models import ComplianceCase

        case = ComplianceCase.objects.filter(pk=case_id).first()
        if not case:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        deadlines = Deadline.objects.filter(case=case).order_by("due_at")
        data = DeadlineSerializer(deadlines, many=True).data
        return Response(envelope({"count": len(data), "deadlines": data}), status=status.HTTP_200_OK)


class AdminCaseDeadlinesView(APIView):
    """Admin compliance deadline management for a case (§18, §19, §21)."""

    permission_classes = [AllowAny]

    def get(self, request: Request, case_id) -> Response:
        from apps.calendar.models import Deadline
        from apps.calendar.serializers import DeadlineSerializer
        from apps.workflows.models import ComplianceCase

        case = ComplianceCase.objects.filter(pk=case_id).first()
        if not case:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        deadlines = Deadline.objects.filter(case=case).order_by("due_at")
        data = DeadlineSerializer(deadlines, many=True).data
        return Response(envelope({"count": len(data), "deadlines": data}), status=status.HTTP_200_OK)

    def post(self, request: Request, case_id) -> Response:
        from apps.calendar.serializers import DeadlineSerializer
        from apps.calendar.services import DeadlineService
        from apps.workflows.models import ComplianceCase
        from dateutil import parser as date_parser

        case = ComplianceCase.objects.filter(pk=case_id).first()
        if not case:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        title = request.data.get("title")
        due_at_raw = request.data.get("due_at") or request.data.get("due_date")
        if not title:
            return error_response("VALIDATION_ERROR", "Title is required for a deadline.", http_status=status.HTTP_400_BAD_REQUEST)
        if not due_at_raw:
            return error_response("VALIDATION_ERROR", "Due date is required for a deadline.", http_status=status.HTTP_400_BAD_REQUEST)

        try:
            if isinstance(due_at_raw, str):
                due_at = date_parser.parse(due_at_raw)
            else:
                due_at = due_at_raw
            if timezone.is_naive(due_at):
                due_at = timezone.make_aware(due_at)
        except Exception as exc:
            return error_response("INVALID_DATE", f"Invalid date format: {exc}", http_status=status.HTTP_400_BAD_REQUEST)

        description = request.data.get("description", "")
        priority = request.data.get("priority", "MEDIUM")
        notes = request.data.get("notes", "")
        reminder_policy = request.data.get("reminder_policy") or {"days_before": [7, 3, 1]}
        email_notification_enabled = request.data.get("email_notification_enabled", True)
        calendar_notification_enabled = request.data.get("calendar_notification_enabled", True)
        in_app_notification_enabled = request.data.get("in_app_notification_enabled", True)

        deadline = DeadlineService.create_deadline(
            case=case,
            business=case.business,
            title=title,
            due_at=due_at,
            requirement_id_code=case.requirement_id_code,
            description=description,
            priority=priority,
            source="ADMIN_SET",
            created_by=request.user if (request.user and request.user.is_authenticated) else None,
            email_notification_enabled=email_notification_enabled,
            calendar_notification_enabled=calendar_notification_enabled,
            in_app_notification_enabled=in_app_notification_enabled,
            reminder_policy=reminder_policy,
            notes=notes,
        )

        return Response(
            envelope({
                "message": "Deadline successfully created.",
                "deadline": DeadlineSerializer(deadline).data,
            }),
            status=status.HTTP_201_CREATED,
        )


class AdminDeadlineDetailView(APIView):
    """Admin update or cancel a deadline (§18, §19)."""

    permission_classes = [AllowAny]

    def patch(self, request: Request, deadline_id) -> Response:
        from apps.calendar.models import Deadline
        from apps.calendar.serializers import DeadlineSerializer
        from apps.calendar.services import DeadlineService
        from dateutil import parser as date_parser

        deadline = Deadline.objects.filter(pk=deadline_id).first()
        if not deadline:
            return error_response("NOT_FOUND", "Deadline not found.", http_status=status.HTTP_404_NOT_FOUND)

        updates = {}
        for field in [
            "title",
            "description",
            "status",
            "priority",
            "notes",
            "reminder_policy",
            "email_notification_enabled",
            "calendar_notification_enabled",
            "in_app_notification_enabled",
        ]:
            if field in request.data:
                updates[field] = request.data[field]

        if "due_at" in request.data or "due_date" in request.data:
            due_at_raw = request.data.get("due_at") or request.data.get("due_date")
            try:
                if isinstance(due_at_raw, str):
                    parsed_date = date_parser.parse(due_at_raw)
                else:
                    parsed_date = due_at_raw
                if timezone.is_naive(parsed_date):
                    parsed_date = timezone.make_aware(parsed_date)
                updates["due_at"] = parsed_date
            except Exception as exc:
                return error_response("INVALID_DATE", f"Invalid date format: {exc}", http_status=status.HTTP_400_BAD_REQUEST)

        updated_deadline = DeadlineService.update_deadline(
            deadline=deadline,
            updated_by=request.user if (request.user and request.user.is_authenticated) else None,
            **updates,
        )

        return Response(
            envelope({
                "message": "Deadline successfully updated.",
                "deadline": DeadlineSerializer(updated_deadline).data,
            }),
            status=status.HTTP_200_OK,
        )

    def delete(self, request: Request, deadline_id) -> Response:
        from apps.calendar.models import Deadline
        from apps.calendar.serializers import DeadlineSerializer
        from apps.calendar.services import DeadlineService

        deadline = Deadline.objects.filter(pk=deadline_id).first()
        if not deadline:
            return error_response("NOT_FOUND", "Deadline not found.", http_status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get("reason", "Cancelled by administrative action")
        cancelled_deadline = DeadlineService.cancel_deadline(
            deadline=deadline,
            reason=reason,
            actor=request.user if (request.user and request.user.is_authenticated) else None,
        )

        return Response(
            envelope({
                "message": "Deadline cancelled successfully.",
                "deadline": DeadlineSerializer(cancelled_deadline).data,
            }),
            status=status.HTTP_200_OK,
        )


class AdminDeadlineSendAlertView(APIView):
    """Trigger immediate multi-channel alert dispatch for a deadline (§18, §21)."""

    permission_classes = [AllowAny]

    def post(self, request: Request, deadline_id) -> Response:
        from apps.calendar.models import Deadline
        from apps.calendar.services import DeadlineService

        deadline = Deadline.objects.filter(pk=deadline_id).first()
        if not deadline:
            return error_response("NOT_FOUND", "Deadline not found.", http_status=status.HTTP_404_NOT_FOUND)

        notes = request.data.get("notes", "Instant compliance alert dispatched by Compliance Officer.")
        result = DeadlineService.send_alert_now(
            deadline=deadline,
            actor=request.user if (request.user and request.user.is_authenticated) else None,
            notes=notes,
        )

        return Response(
            envelope({
                "message": "Compliance alert dispatched successfully.",
                "result": result,
            }),
            status=status.HTTP_200_OK,
        )


