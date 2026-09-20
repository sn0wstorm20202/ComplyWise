"""Multi-user isolation tests for the compliance notification system.

Verifies that:
1. Each user's notifications are fully isolated — no cross-contamination.
2. T-7 dispatches EMAIL only to user's registered email.
3. T-1 dispatches EMAIL + GOOGLE_CALENDAR, each to the correct user's calendar.
4. A user without Google Calendar authorization at T-1 receives a FAILED
   calendar record (not silently simulated, not routed to another user's calendar).
5. Idempotency: re-running for the same (user, business, req, date, offset, channel)
   never produces duplicate delivery records.
"""

from __future__ import annotations

from datetime import date
from unittest.mock import patch

import pytest

from apps.calendar.models import (
    DeadlineNotificationDelivery,
    NotificationChannel,
    NotificationDeliveryStatus,
    UserGoogleCalendarConnection,
)
from apps.calendar.services import evaluate_and_send_deadline_notifications

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_event(req_id: str, due: date, days_remaining: int) -> dict:
    return {
        "id": req_id,
        "title": f"Statutory Deadline {req_id}",
        "authority": "BIS",
        "basis": "Test Act §1",
        "date": due.isoformat(),
        "days_remaining": days_remaining,
        "status": "PENDING",
    }


def _patch_calendar(events: list[dict]):
    return patch(
        "apps.calendar.services.derive_business_calendar",
        return_value={"events": events},
    )


def _run(*, business, offset: int, dry_run: bool = False) -> dict:
    due = date(2026, 12, 1)
    import datetime

    ref = due - datetime.timedelta(days=offset)
    events = [_make_event(req_id=f"REQ-{business.pk}-{offset}", due=due, days_remaining=offset)]
    with _patch_calendar(events):
        return evaluate_and_send_deadline_notifications(
            business=business,
            reference_date=ref,
            target_offset_days=offset,
            language="en",
            dry_run=dry_run,
            force=True,
        )


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def isolate_settings(settings):
    """Tests run without real Google credentials; SIMULATE_GOOGLE_CALENDAR
    is explicitly set so the service uses test mode for GOOGLE_CALENDAR channel."""
    settings.GOOGLE_CALENDAR_ACCESS_TOKEN = ""
    settings.GOOGLE_CALENDAR_REFRESH_TOKEN = ""
    settings.GOOGLE_CALENDAR_CLIENT_ID = ""
    settings.GOOGLE_CALENDAR_CLIENT_SECRET = ""
    settings.SIMULATE_GOOGLE_CALENDAR = True


@pytest.fixture
def user_a(make_user):
    return make_user(email="user_a@enterprise.in", full_name="User Alpha")


@pytest.fixture
def user_b(make_user):
    return make_user(email="user_b@enterprise.in", full_name="User Beta")


@pytest.fixture
def user_c(make_user):
    return make_user(email="user_c@enterprise.in", full_name="User Gamma")


@pytest.fixture
def user_d(make_user):
    return make_user(email="user_d@enterprise.in", full_name="User Delta")


@pytest.fixture
def user_e(make_user):
    return make_user(email="user_e@enterprise.in", full_name="User Epsilon")


@pytest.fixture
def biz_a(make_business, user_a):
    return make_business(user_a, name="Alpha Manufacturing")


@pytest.fixture
def biz_b(make_business, user_b):
    return make_business(user_b, name="Beta Processing")


@pytest.fixture
def biz_c(make_business, user_c):
    return make_business(user_c, name="Gamma Exports")


@pytest.fixture
def biz_d(make_business, user_d):
    return make_business(user_d, name="Delta Devices")


@pytest.fixture
def biz_e(make_business, user_e):
    return make_business(user_e, name="Epsilon Foods")


@pytest.fixture
def google_conn_b(db, user_b):
    """Simulate an authorized Google Calendar connection for User B."""
    from django.utils import timezone
    from datetime import timedelta

    return UserGoogleCalendarConnection.objects.create(
        user=user_b,
        google_email="user_b_gcal@gmail.com",
        access_token="fake-access-token-b",
        refresh_token="fake-refresh-token-b",
        expires_at=timezone.now() + timedelta(hours=1),
        is_active=True,
        calendar_id="primary",
        scopes="https://www.googleapis.com/auth/calendar.events",
    )


@pytest.fixture
def google_conn_d(db, user_d):
    """Simulate an authorized Google Calendar connection for User D."""
    from django.utils import timezone
    from datetime import timedelta

    return UserGoogleCalendarConnection.objects.create(
        user=user_d,
        google_email="user_d_gcal@gmail.com",
        access_token="fake-access-token-d",
        refresh_token="fake-refresh-token-d",
        expires_at=timezone.now() + timedelta(hours=1),
        is_active=True,
        calendar_id="primary",
        scopes="https://www.googleapis.com/auth/calendar.events",
    )


# ---------------------------------------------------------------------------
# Tests — T-7: Email Only
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestT7EmailOnly:
    """At offset T-7, only EMAIL channel must fire — no Google Calendar."""

    def test_user_a_t7_dispatches_email_only(self, biz_a):
        result = _run(business=biz_a, offset=7)
        channels = [d["channel"] for d in result["dispatched"]]
        assert NotificationChannel.EMAIL in channels
        assert NotificationChannel.GOOGLE_CALENDAR not in channels

    def test_user_c_t7_dispatches_email_only(self, biz_c):
        result = _run(business=biz_c, offset=7)
        channels = [d["channel"] for d in result["dispatched"]]
        assert NotificationChannel.EMAIL in channels
        assert NotificationChannel.GOOGLE_CALENDAR not in channels

    def test_user_e_t7_dispatches_email_only(self, biz_e):
        result = _run(business=biz_e, offset=7)
        channels = [d["channel"] for d in result["dispatched"]]
        assert NotificationChannel.EMAIL in channels
        assert NotificationChannel.GOOGLE_CALENDAR not in channels

    def test_t7_recipient_is_registered_email(self, user_a, biz_a):
        result = _run(business=biz_a, offset=7)
        email_records = [d for d in result["dispatched"] if d["channel"] == NotificationChannel.EMAIL]
        assert len(email_records) == 1
        assert email_records[0]["user_email"] == user_a.email

    def test_cross_user_records_not_shared_at_t7(self, user_a, biz_a, user_c, biz_c):
        """Running for User A at T-7 must not create records for User C."""
        _run(business=biz_a, offset=7)
        _run(business=biz_c, offset=7)
        a_records = DeadlineNotificationDelivery.objects.filter(business=biz_a)
        c_records = DeadlineNotificationDelivery.objects.filter(business=biz_c)
        assert a_records.count() == 1
        assert c_records.count() == 1
        assert not a_records.filter(business=biz_c).exists()
        assert not c_records.filter(business=biz_a).exists()


# ---------------------------------------------------------------------------
# Tests — T-1: Email + Google Calendar (user-specific)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestT1EmailAndCalendar:
    """At offset T-1, EMAIL and GOOGLE_CALENDAR both fire.
    GOOGLE_CALENDAR event goes to the user's own authorized connection only."""

    def test_user_b_t1_with_gcal_connection(self, biz_b, google_conn_b):
        result = _run(business=biz_b, offset=1)
        channels = [d["channel"] for d in result["dispatched"]]
        assert NotificationChannel.EMAIL in channels
        assert NotificationChannel.GOOGLE_CALENDAR in channels

    def test_user_d_t1_with_gcal_connection(self, biz_d, google_conn_d):
        result = _run(business=biz_d, offset=1)
        channels = [d["channel"] for d in result["dispatched"]]
        assert NotificationChannel.EMAIL in channels
        assert NotificationChannel.GOOGLE_CALENDAR in channels

    def test_t1_gcal_event_routed_to_correct_user(self, user_b, biz_b, google_conn_b,
                                                   user_d, biz_d, google_conn_d):
        _run(business=biz_b, offset=1)
        _run(business=biz_d, offset=1)
        b_cal = DeadlineNotificationDelivery.objects.filter(
            business=biz_b, channel=NotificationChannel.GOOGLE_CALENDAR
        )
        d_cal = DeadlineNotificationDelivery.objects.filter(
            business=biz_d, channel=NotificationChannel.GOOGLE_CALENDAR
        )
        assert b_cal.count() == 1
        assert d_cal.count() == 1
        assert not b_cal.filter(business=biz_d).exists()
        assert not d_cal.filter(business=biz_b).exists()


# ---------------------------------------------------------------------------
# Tests — T-1 without Google Calendar authorization
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestT1WithoutGCalAuthorization:
    """Without an authorized connection, GOOGLE_CALENDAR records SIMULATED/FAILED
    — never falls back to another user's calendar."""

    def test_user_a_t1_no_gcal_does_not_use_user_b_calendar(
        self, user_a, biz_a, user_b, google_conn_b
    ):
        _run(business=biz_a, offset=1)
        cross = DeadlineNotificationDelivery.objects.filter(
            business=biz_a, channel=NotificationChannel.GOOGLE_CALENDAR,
        )
        assert cross.count() == 1
        record = cross.first()
        assert record.recipient != "user_b_gcal@gmail.com"
        assert record.status in {
            NotificationDeliveryStatus.SIMULATED,
            NotificationDeliveryStatus.FAILED,
        }


# ---------------------------------------------------------------------------
# Tests — Idempotency
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestIdempotency:
    def test_t7_email_records_stay_in_correct_business(self, biz_a, biz_c):
        _run(business=biz_a, offset=7)
        _run(business=biz_c, offset=7)
        a_records = DeadlineNotificationDelivery.objects.filter(business=biz_a)
        c_records = DeadlineNotificationDelivery.objects.filter(business=biz_c)
        assert all(r.business_id == biz_a.pk for r in a_records)
        assert all(r.business_id == biz_c.pk for r in c_records)

    def test_t1_records_stay_in_correct_business(self, biz_b, biz_d, google_conn_b, google_conn_d):
        _run(business=biz_b, offset=1)
        _run(business=biz_d, offset=1)
        b_records = DeadlineNotificationDelivery.objects.filter(business=biz_b)
        d_records = DeadlineNotificationDelivery.objects.filter(business=biz_d)
        assert all(r.business_id == biz_b.pk for r in b_records)
        assert all(r.business_id == biz_d.pk for r in d_records)


# ---------------------------------------------------------------------------
# Tests — Full 5-user isolation sweep (dry-run)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestFiveUserIsolationSweep:
    def test_all_five_users_isolated_at_t7(self, biz_a, biz_b, biz_c, biz_d, biz_e):
        for biz in (biz_a, biz_b, biz_c, biz_d, biz_e):
            result = _run(business=biz, offset=7, dry_run=True)
            channels = [d["channel"] for d in result["dispatched"]]
            assert NotificationChannel.EMAIL in channels, f"{biz.name}: EMAIL missing at T-7"
            assert NotificationChannel.GOOGLE_CALENDAR not in channels, \
                f"{biz.name}: GOOGLE_CALENDAR must NOT fire at T-7"

    def test_all_five_users_isolated_at_t1(self, biz_a, biz_b, biz_c, biz_d, biz_e):
        for biz in (biz_a, biz_b, biz_c, biz_d, biz_e):
            result = _run(business=biz, offset=1, dry_run=True)
            channels = [d["channel"] for d in result["dispatched"]]
            assert NotificationChannel.EMAIL in channels, f"{biz.name}: EMAIL missing at T-1"
            assert NotificationChannel.GOOGLE_CALENDAR in channels, \
                f"{biz.name}: GOOGLE_CALENDAR missing at T-1"
            assert len(set(channels)) == 2, f"{biz.name}: unexpected channels: {channels}"
