"""Comprehensive tests for upgraded compliance notification system.

Verifies:
1. Configurable notification policies (LOW, MEDIUM, HIGH, CRITICAL).
2. Priority levels & risk-based urgency.
3. In-app notification creation, listing, read/unread states, and mark-read endpoints.
4. Overdue detection, non-spam cadence, and completed item suppression.
5. Escalation to compliance managers on high/critical priority or overdue.
6. Bounded retry mechanism and failure reason auditing.
7. Independent channel failure handling (Calendar fail != Email fail).
8. User notification preferences (channel toggles & language).
9. Multilingual notification rendering (en, hi, bn).
10. Dashboard notification summary API.
"""

from __future__ import annotations

import uuid
from datetime import date, timedelta
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from rest_framework.test import APIClient

from apps.businesses.models import Business, BusinessMembership
from apps.calendar.models import (
    DeadlineNotificationDelivery,
    NotificationChannel,
    NotificationDeliveryStatus,
    NotificationEventType,
    NotificationPreference,
    NotificationPriority,
)
from apps.calendar.policies import (
    CRITICAL_NOTIFICATION_POLICY,
    DEFAULT_NOTIFICATION_POLICY,
    HIGH_NOTIFICATION_POLICY,
    LOW_NOTIFICATION_POLICY,
    MEDIUM_NOTIFICATION_POLICY,
    resolve_notification_policy,
)
from apps.calendar.services import (
    dispatch_email_notification,
    dispatch_google_calendar_event,
    dispatch_in_app_notification,
    evaluate_and_send_deadline_notifications,
    get_notification_language,
    retry_failed_notifications,
)

User = get_user_model()


@pytest.fixture(autouse=True)
def no_google_calendar_credentials(settings):
    """Ensure tests run in simulation mode without external Google OAuth dependency."""
    settings.GOOGLE_CALENDAR_ACCESS_TOKEN = ""
    settings.GOOGLE_CALENDAR_REFRESH_TOKEN = ""
    settings.GOOGLE_CALENDAR_CLIENT_ID = ""
    settings.GOOGLE_CALENDAR_CLIENT_SECRET = ""


@pytest.fixture
def test_user(db):
    return User.objects.create_user(
        email="upgrade.founder@example.com",
        password="ValidPassword123!",
        full_name="Upgrade Founder",
    )


@pytest.fixture
def manager_user(db):
    return User.objects.create_user(
        email="compliance.manager@example.com",
        password="ValidPassword123!",
        full_name="Compliance Manager",
    )


@pytest.fixture
def test_business(db, test_user):
    biz = Business.objects.create(
        name="Apex Diagnostics Pvt Ltd",
        owner=test_user,
    )
    BusinessMembership.objects.create(
        business=biz,
        user=test_user,
        role=BusinessMembership.Role.OWNER,
    )
    return biz


def _make_calendar_event(
    *,
    req_id: str = "REQ-UPGRADE-01",
    title: str = "Factory Licence Renewal",
    authority: str = "State Industrial Safety Directorate",
    basis: str = "Factories Act 1948 Section 6",
    due_date: date,
    days_remaining: int,
    status: str = "PENDING",
) -> dict:
    return {
        "id": req_id,
        "title": title,
        "authority": authority,
        "basis": basis,
        "date": due_date.isoformat(),
        "days_remaining": days_remaining,
        "status": status,
    }


def _patch_calendar(events: list[dict]):
    return patch(
        "apps.calendar.services.derive_business_calendar",
        return_value={"events": events},
    )


# ---------------------------------------------------------------------------
# 1. Configurable Notification Policies
# ---------------------------------------------------------------------------

class TestConfigurablePolicies:
    def test_default_policy_offsets(self):
        assert DEFAULT_NOTIFICATION_POLICY.offsets == [7, 1]
        assert DEFAULT_NOTIFICATION_POLICY.get_channels_for_offset(7) == [NotificationChannel.GOOGLE_CALENDAR]
        assert DEFAULT_NOTIFICATION_POLICY.get_channels_for_offset(1) == [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.EMAIL]

    def test_medium_policy_includes_t14(self, test_business):
        due = date(2026, 12, 20)
        events = [_make_calendar_event(due_date=due, days_remaining=14)]
        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=date(2026, 12, 6),
                target_offset_days=14,
                policy=MEDIUM_NOTIFICATION_POLICY,
                dry_run=True,
                force=True,
            )
        assert result["total_dispatched"] == 1
        assert result["dispatched"][0]["channel"] == NotificationChannel.GOOGLE_CALENDAR

    def test_high_policy_includes_t30_and_in_app(self, test_business):
        due = date(2026, 12, 30)
        events = [_make_calendar_event(due_date=due, days_remaining=30)]
        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=date(2026, 11, 30),
                target_offset_days=30,
                policy=HIGH_NOTIFICATION_POLICY,
                dry_run=True,
                force=True,
            )
        assert result["total_dispatched"] == 1
        assert result["dispatched"][0]["channel"] == NotificationChannel.IN_APP
        assert result["dispatched"][0]["priority"] == NotificationPriority.HIGH

    def test_critical_policy_triggers_on_t3(self, test_business):
        due = date(2026, 12, 10)
        events = [_make_calendar_event(due_date=due, days_remaining=3)]
        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=date(2026, 12, 7),
                target_offset_days=3,
                policy=CRITICAL_NOTIFICATION_POLICY,
                dry_run=True,
                force=True,
            )
        channels = [d["channel"] for d in result["dispatched"]]
        assert NotificationChannel.GOOGLE_CALENDAR in channels
        assert NotificationChannel.EMAIL in channels

    def test_resolve_notification_policy(self):
        meta_high = {"notification_priority": "high"}
        meta_crit = {"priority": "critical"}
        meta_none = {}
        assert resolve_notification_policy(meta_high) == HIGH_NOTIFICATION_POLICY
        assert resolve_notification_policy(meta_crit) == CRITICAL_NOTIFICATION_POLICY
        assert resolve_notification_policy(meta_none) == DEFAULT_NOTIFICATION_POLICY


# ---------------------------------------------------------------------------
# 2. In-App Notifications & Read State
# ---------------------------------------------------------------------------

class TestInAppNotifications:
    def test_in_app_dispatch_creates_record(self, test_business, test_user):
        due = date(2026, 11, 15)
        ev = _make_calendar_event(due_date=due, days_remaining=7)
        res = dispatch_in_app_notification(
            user=test_user,
            business=test_business,
            event=ev,
            due_date=due,
            offset_days=7,
            priority="HIGH",
        )
        assert res["provider"] == "complywise_in_app"
        assert res["status"] == "DELIVERED"
        assert "Factory Licence Renewal" in res["title"]

    def test_in_app_delivery_record_saved_unread(self, test_business, test_user):
        due = date(2026, 11, 20)
        events = [_make_calendar_event(due_date=due, days_remaining=1)]
        with _patch_calendar(events):
            res = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=date(2026, 11, 19),
                target_offset_days=1,
                include_in_app=True,
                force=True,
            )
        in_app_records = DeadlineNotificationDelivery.objects.filter(
            business=test_business,
            channel=NotificationChannel.IN_APP,
        )
        assert in_app_records.exists()
        record = in_app_records.first()
        assert record.is_read is False
        assert record.read_at is None

    def test_mark_notification_read_api(self, test_business, test_user):
        client = APIClient()
        client.force_authenticate(user=test_user)

        record = DeadlineNotificationDelivery.objects.create(
            user=test_user,
            business=test_business,
            requirement_id="REQ-TEST-READ",
            deadline_date=date(2026, 12, 1),
            offset_days=1,
            channel=NotificationChannel.IN_APP,
            status=NotificationDeliveryStatus.DELIVERED,
            is_read=False,
        )

        url = f"/api/v1/businesses/{test_business.id}/calendar/notifications/{record.id}/read"
        resp = client.patch(url)
        assert resp.status_code == 200
        assert resp.json()["data"]["is_read"] is True

        record.refresh_from_db()
        assert record.is_read is True
        assert record.read_at is not None

    def test_mark_all_read_api(self, test_business, test_user):
        client = APIClient()
        client.force_authenticate(user=test_user)

        for i in range(3):
            DeadlineNotificationDelivery.objects.create(
                user=test_user,
                business=test_business,
                requirement_id=f"REQ-TEST-READ-{i}",
                deadline_date=date(2026, 12, 1),
                offset_days=i + 1,
                channel=NotificationChannel.IN_APP,
                status=NotificationDeliveryStatus.DELIVERED,
                is_read=False,
            )

        url = f"/api/v1/businesses/{test_business.id}/calendar/notifications/read-all"
        resp = client.post(url)
        assert resp.status_code == 200
        assert resp.json()["data"]["updated_count"] >= 3

        unread = DeadlineNotificationDelivery.objects.filter(business=test_business, is_read=False)
        assert not unread.exists()


# ---------------------------------------------------------------------------
# 3. Overdue Detection & Cadence
# ---------------------------------------------------------------------------

class TestOverdueDetection:
    def test_overdue_detected_on_cadence_day_1(self, test_business, test_user):
        # 1 day overdue (due yesterday)
        due = date(2026, 10, 10)
        ref = date(2026, 10, 11)
        events = [_make_calendar_event(due_date=due, days_remaining=-1)]

        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=ref,
                check_overdue=True,
                dry_run=True,
                force=True,
            )

        assert result["total_dispatched"] > 0
        dispatched = result["dispatched"]
        channels = [d["channel"] for d in dispatched]
        assert NotificationChannel.EMAIL in channels
        assert dispatched[0]["event_type"] == NotificationEventType.OVERDUE
        assert dispatched[0]["offset_days"] == 1

    def test_overdue_not_spammed_on_non_cadence_day(self, test_business, test_user):
        # 4 days overdue: default cadence is [1, 7, 14, 30], so 4 is NOT triggered
        due = date(2026, 10, 10)
        ref = date(2026, 10, 14) # 4 days overdue
        events = [_make_calendar_event(due_date=due, days_remaining=-4)]

        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=ref,
                check_overdue=True,
                dry_run=True,
                force=True,
            )

        assert result["total_dispatched"] == 0

    def test_completed_overdue_item_never_dispatched(self, test_business, test_user):
        # Item is overdue but status is COMPLETED
        due = date(2026, 10, 10)
        ref = date(2026, 10, 11)
        events = [_make_calendar_event(due_date=due, days_remaining=-1, status="COMPLETED")]

        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=ref,
                check_overdue=True,
                dry_run=True,
                force=True,
            )

        assert result["total_dispatched"] == 0

    def test_cancelled_or_expired_overdue_suppressed(self, test_business, test_user):
        due = date(2026, 10, 10)
        ref = date(2026, 10, 11)
        for st in ["CANCELLED", "EXPIRED", "INACTIVE"]:
            events = [_make_calendar_event(due_date=due, days_remaining=-1, status=st)]
            with _patch_calendar(events):
                res = evaluate_and_send_deadline_notifications(
                    business=test_business,
                    reference_date=ref,
                    check_overdue=True,
                    dry_run=True,
                    force=True,
                )
            assert res["total_dispatched"] == 0


# ---------------------------------------------------------------------------
# 4. Completion Before Notification (Cancellation)
# ---------------------------------------------------------------------------

class TestCompletionBeforeNotification:
    def test_completion_between_t7_and_t1_suppresses_t1(self, test_business):
        due = date(2026, 12, 10)

        # At T-7, status is PENDING -> sends notification
        ev_t7 = [_make_calendar_event(due_date=due, days_remaining=7, status="PENDING")]
        with _patch_calendar(ev_t7):
            res_t7 = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=date(2026, 12, 3),
                target_offset_days=7,
                dry_run=True,
                force=True,
            )
        assert res_t7["total_dispatched"] == 1

        # User completes requirement -> status is COMPLETED
        ev_t1 = [_make_calendar_event(due_date=due, days_remaining=1, status="COMPLETED")]
        with _patch_calendar(ev_t1):
            res_t1 = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=date(2026, 12, 9),
                target_offset_days=1,
                dry_run=True,
                force=True,
            )
        assert res_t1["total_dispatched"] == 0


# ---------------------------------------------------------------------------
# 5. Escalation Routing
# ---------------------------------------------------------------------------

class TestEscalationRouting:
    def test_escalation_includes_compliance_manager(self, test_business, test_user, manager_user):
        BusinessMembership.objects.create(
            business=test_business,
            user=manager_user,
            role=BusinessMembership.Role.MANAGER,
        )

        due = date(2026, 12, 10)
        events = [_make_calendar_event(due_date=due, days_remaining=1)]

        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=date(2026, 12, 9),
                target_offset_days=1,
                policy=CRITICAL_NOTIFICATION_POLICY,
                dry_run=True,
                force=True,
            )

        notified_users = {d["user_id"] for d in result["dispatched"]}
        assert str(test_user.id) in notified_users
        assert str(manager_user.id) in notified_users

        # Check event_type is ESCALATION
        for d in result["dispatched"]:
            assert d["event_type"] == NotificationEventType.ESCALATION


# ---------------------------------------------------------------------------
# 6. Bounded Retries & Channel Independence
# ---------------------------------------------------------------------------

class TestRetriesAndChannelIndependence:
    def test_calendar_failure_does_not_block_email(self, test_business, test_user):
        due = date(2026, 12, 20)
        events = [_make_calendar_event(due_date=due, days_remaining=1)]

        # Mock Google Calendar to fail, email to succeed
        with _patch_calendar(events):
            with patch("apps.calendar.services.dispatch_google_calendar_event") as mock_cal:
                mock_cal.return_value = {
                    "provider": "google_calendar_live",
                    "status": NotificationDeliveryStatus.FAILED,
                    "error": "Google API 503 Service Unavailable",
                    "attempts": 3,
                }
                result = evaluate_and_send_deadline_notifications(
                    business=test_business,
                    reference_date=date(2026, 12, 19),
                    target_offset_days=1,
                    dry_run=False,
                    force=True,
                )

        cal_rec = DeadlineNotificationDelivery.objects.filter(
            business=test_business, channel=NotificationChannel.GOOGLE_CALENDAR
        ).first()
        email_rec = DeadlineNotificationDelivery.objects.filter(
            business=test_business, channel=NotificationChannel.EMAIL
        ).first()

        assert cal_rec is not None
        assert cal_rec.status == NotificationDeliveryStatus.FAILED
        assert "503" in cal_rec.failure_reason

        assert email_rec is not None
        assert email_rec.status in {NotificationDeliveryStatus.DELIVERED, NotificationDeliveryStatus.SIMULATED}

    def test_retry_failed_notifications_recovers(self, test_business, test_user):
        record = DeadlineNotificationDelivery.objects.create(
            user=test_user,
            business=test_business,
            requirement_id="REQ-RETRY-01",
            deadline_date=date(2026, 12, 25),
            offset_days=1,
            channel=NotificationChannel.EMAIL,
            status=NotificationDeliveryStatus.FAILED,
            attempt_count=1,
            failure_reason="SMTP connection timeout",
        )

        with patch("apps.calendar.services.send_mail", return_value=1):
            retry_res = retry_failed_notifications(business=test_business, max_retries=3)

        assert retry_res["total_retried"] == 1
        record.refresh_from_db()
        assert record.status == NotificationDeliveryStatus.DELIVERED
        assert record.attempt_count == 2
        assert record.failure_reason == ""


# ---------------------------------------------------------------------------
# 7. User Preferences
# ---------------------------------------------------------------------------

class TestUserPreferences:
    def test_disabled_email_preference_suppresses_email(self, test_business, test_user):
        NotificationPreference.objects.create(
            user=test_user,
            business=test_business,
            email_enabled=False,
            calendar_enabled=True,
            in_app_enabled=True,
        )

        due = date(2026, 12, 15)
        events = [_make_calendar_event(due_date=due, days_remaining=1)]

        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=test_business,
                reference_date=date(2026, 12, 14),
                target_offset_days=1,
                dry_run=True,
                force=True,
            )

        channels = [d["channel"] for d in result["dispatched"]]
        assert NotificationChannel.GOOGLE_CALENDAR in channels
        assert NotificationChannel.EMAIL not in channels

    def test_preference_api_get_and_put(self, test_business, test_user):
        client = APIClient()
        client.force_authenticate(user=test_user)

        url = f"/api/v1/businesses/{test_business.id}/calendar/preferences"
        get_res = client.get(url)
        assert get_res.status_code == 200
        assert get_res.json()["data"]["email_enabled"] is True

        put_res = client.put(url, {"email_enabled": False, "language": "hi"}, format="json")
        assert put_res.status_code == 200
        assert put_res.json()["data"]["email_enabled"] is False
        assert put_res.json()["data"]["language"] == "hi"

        pref = NotificationPreference.objects.get(user=test_user, business=test_business)
        assert pref.email_enabled is False
        assert pref.language == "hi"


# ---------------------------------------------------------------------------
# 8. Multilingual Rendering
# ---------------------------------------------------------------------------

class TestMultilingualRendering:
    def test_overdue_email_renders_in_hindi_and_bengali(self, test_business, test_user):
        due = date(2026, 10, 10)
        ev = _make_calendar_event(due_date=due, days_remaining=-1)

        res_hi = dispatch_email_notification(
            user=test_user,
            business=test_business,
            event=ev,
            due_date=due,
            offset_days=1,
            language="hi",
            is_overdue=True,
        )
        assert "अतिदेय" in res_hi["subject"]

        res_bn = dispatch_email_notification(
            user=test_user,
            business=test_business,
            event=ev,
            due_date=due,
            offset_days=1,
            language="bn",
            is_overdue=True,
        )
        assert "বকেয়া" in res_bn["subject"]


# ---------------------------------------------------------------------------
# 9. Dashboard Notification Summary API
# ---------------------------------------------------------------------------

class TestDashboardNotificationSummaryApi:
    def test_summary_counts_accurate(self, test_business, test_user):
        client = APIClient()
        client.force_authenticate(user=test_user)

        # Create 2 unread, 1 overdue, 1 urgent
        DeadlineNotificationDelivery.objects.create(
            user=test_user,
            business=test_business,
            requirement_id="REQ-SUM-01",
            deadline_date=date(2026, 12, 1),
            offset_days=1,
            channel=NotificationChannel.EMAIL,
            priority=NotificationPriority.CRITICAL,
            event_type=NotificationEventType.UPCOMING,
            status=NotificationDeliveryStatus.DELIVERED,
            is_read=False,
        )
        DeadlineNotificationDelivery.objects.create(
            user=test_user,
            business=test_business,
            requirement_id="REQ-SUM-02",
            deadline_date=date(2026, 11, 1),
            offset_days=7,
            channel=NotificationChannel.IN_APP,
            priority=NotificationPriority.MEDIUM,
            event_type=NotificationEventType.OVERDUE,
            status=NotificationDeliveryStatus.DELIVERED,
            is_read=False,
        )

        url = f"/api/v1/businesses/{test_business.id}/calendar/notifications/summary"
        resp = client.get(url)
        assert resp.status_code == 200
        data = resp.json()["data"]

        assert data["total"] == 2
        assert data["unread_count"] == 2
        assert data["urgent_count"] >= 1
        assert data["overdue_count"] == 1
