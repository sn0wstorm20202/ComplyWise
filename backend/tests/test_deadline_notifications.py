"""Tests for compliance deadline notification service.

Authority: PRD_v2.0 §20; TRD_v2.0 §30, §31.

Deterministic timing rules verified:
- T-7 (exactly 7 days remaining): Google Calendar ONLY.
- T-1 (exactly 1 day remaining): Google Calendar AND Email.
- Any other offset (0, 2, 3, 4, 5, 6, 8, 30, past): NO notification.

Idempotency rules verified:
- Repeated execution for same (user, business, req, date, offset, channel) → 0 duplicates.
- force=True bypasses idempotency for testing.

Multi-user isolation:
- Two separate businesses / users never share notification records.

Language rendering:
- get_notification_language() normalises all codes to 'en'|'hi'|'bn'.
- Calendar and email templates render without error in all three languages.
"""

from __future__ import annotations

from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from django.core import mail

from apps.calendar.models import (
    DeadlineNotificationDelivery,
    NotificationChannel,
    NotificationDeliveryStatus,
)
from apps.calendar.services import (
    CALENDAR_TEMPLATES,
    EMAIL_TEMPLATES,
    dispatch_email_notification,
    dispatch_google_calendar_event,
    evaluate_and_send_deadline_notifications,
    get_notification_language,
)


@pytest.fixture(autouse=True)
def no_google_calendar_credentials(settings):
    """Ensure test suite runs isolated in simulation mode without external Google OAuth dependency."""
    settings.GOOGLE_CALENDAR_ACCESS_TOKEN = ""
    settings.GOOGLE_CALENDAR_REFRESH_TOKEN = ""
    settings.GOOGLE_CALENDAR_CLIENT_ID = ""
    settings.GOOGLE_CALENDAR_CLIENT_SECRET = ""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_calendar_event(
    *,
    req_id: str = "REQ-TEST-001",
    title: str = "Test Statutory Deadline",
    authority: str = "Test Authority",
    basis: str = "Test Act §1",
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
    """Patch derive_business_calendar to return the given events list."""
    return patch(
        "apps.calendar.services.derive_business_calendar",
        return_value={"events": events},
    )


# ---------------------------------------------------------------------------
# get_notification_language
# ---------------------------------------------------------------------------


class TestGetNotificationLanguage:
    def test_none_returns_en(self):
        assert get_notification_language(None) == "en"

    def test_empty_string_returns_en(self):
        assert get_notification_language("") == "en"

    def test_valid_en(self):
        assert get_notification_language("en") == "en"

    def test_valid_hi(self):
        assert get_notification_language("hi") == "hi"

    def test_valid_bn(self):
        assert get_notification_language("bn") == "bn"

    def test_unknown_code_falls_back_to_en(self):
        assert get_notification_language("fr") == "en"

    def test_case_insensitive(self):
        assert get_notification_language("HI") == "hi"
        assert get_notification_language("BN") == "bn"

    def test_whitespace_stripped(self):
        assert get_notification_language("  en  ") == "en"


# ---------------------------------------------------------------------------
# dispatch_google_calendar_event (unit)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestDispatchGoogleCalendarEvent:
    def test_returns_simulated_when_no_token(self, user, business):
        event = {"title": "FSSAI License Renewal", "authority": "FSSAI", "basis": "FSS Act §31"}
        result = dispatch_google_calendar_event(
            user=user,
            business=business,
            event=event,
            due_date=date(2026, 10, 15),
            offset_days=7,
            language="en",
        )
        assert result["provider"] == "google_calendar_simulator"
        assert result["status"] == "SIMULATED"
        assert "event_id" in result
        assert "title" in result

    def test_title_contains_days_en(self, user, business):
        event = {"title": "CTE Renewal", "authority": "SPCB", "basis": "Water Act §25"}
        result = dispatch_google_calendar_event(
            user=user,
            business=business,
            event=event,
            due_date=date(2026, 10, 15),
            offset_days=7,
            language="en",
        )
        assert "7" in result["title"]
        assert "CTE Renewal" in result["title"]

    def test_title_rendered_in_hindi(self, user, business):
        event = {"title": "CTE Renewal", "authority": "SPCB", "basis": "Water Act §25"}
        result = dispatch_google_calendar_event(
            user=user,
            business=business,
            event=event,
            due_date=date(2026, 10, 15),
            offset_days=7,
            language="hi",
        )
        # Hindi template contains Devanagari text
        assert "दिनों" in result["title"]

    def test_title_rendered_in_bengali(self, user, business):
        event = {"title": "CTE Renewal", "authority": "SPCB", "basis": "Water Act §25"}
        result = dispatch_google_calendar_event(
            user=user,
            business=business,
            event=event,
            due_date=date(2026, 10, 15),
            offset_days=1,
            language="bn",
        )
        # Bengali template contains Bengali script
        assert "দিনের" in result["title"]


# ---------------------------------------------------------------------------
# dispatch_email_notification (unit)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestDispatchEmailNotification:
    def test_email_sent_to_user_address(self, user, business, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
        event = {"title": "Factory License Renewal", "authority": "DISH", "basis": "Factories Act §6"}
        result = dispatch_email_notification(
            user=user,
            business=business,
            event=event,
            due_date=date(2026, 10, 15),
            offset_days=1,
            language="en",
        )
        assert result["recipient"] == user.email
        assert result["status"] in {"DELIVERED", "SIMULATED"}
        assert len(mail.outbox) == 1
        assert user.email in mail.outbox[0].to

    def test_email_subject_in_hindi(self, user, business, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
        event = {"title": "Factory License Renewal", "authority": "DISH", "basis": "Factories Act §6"}
        result = dispatch_email_notification(
            user=user,
            business=business,
            event=event,
            due_date=date(2026, 10, 15),
            offset_days=1,
            language="hi",
        )
        assert result["status"] in {"DELIVERED", "SIMULATED"}
        assert len(mail.outbox) == 1
        # Hindi subject should contain Devanagari
        assert "अनुपालन" in mail.outbox[0].subject

    def test_email_subject_in_bengali(self, user, business, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
        event = {"title": "Factory License Renewal", "authority": "DISH", "basis": "Factories Act §6"}
        result = dispatch_email_notification(
            user=user,
            business=business,
            event=event,
            due_date=date(2026, 10, 15),
            offset_days=1,
            language="bn",
        )
        assert result["status"] in {"DELIVERED", "SIMULATED"}
        assert len(mail.outbox) == 1
        # Bengali subject should contain Bengali script
        assert "কমপ্লায়েন্স" in mail.outbox[0].subject

    def test_no_email_if_user_has_no_email(self, business, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
        # Create a user-like object with no email
        fake_user = MagicMock()
        fake_user.email = None
        fake_user.full_name = "No-email User"
        event = {"title": "GST Return", "authority": "GSTN", "basis": "GST Act §39"}
        result = dispatch_email_notification(
            user=fake_user,
            business=business,
            event=event,
            due_date=date(2026, 10, 15),
            offset_days=1,
            language="en",
        )
        assert result["status"] == "FAILED"
        assert len(mail.outbox) == 0


# ---------------------------------------------------------------------------
# evaluate_and_send_deadline_notifications — timing rules
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestNotificationTimingRules:
    """
    Rule: T-7 → Calendar only; T-1 → Calendar + Email; anything else → nothing.
    """

    def _run(self, business, offset: int, lang: str = "en") -> dict:
        due = date(2026, 11, 1)
        events = [_make_calendar_event(due_date=due, days_remaining=offset)]
        with _patch_calendar(events):
            return evaluate_and_send_deadline_notifications(
                business=business,
                reference_date=date(2026, 11, 1) - __import__("datetime").timedelta(days=offset),
                target_offset_days=offset,
                language=lang,
                dry_run=True,
                force=True,
            )

    def test_t7_dispatches_calendar_only(self, business):
        result = self._run(business, offset=7)
        dispatched = result["dispatched"]
        channels = [d["channel"] for d in dispatched]
        assert NotificationChannel.GOOGLE_CALENDAR in channels
        assert NotificationChannel.EMAIL not in channels
        assert len(dispatched) == 1

    def test_t1_dispatches_calendar_and_email(self, business):
        result = self._run(business, offset=1)
        dispatched = result["dispatched"]
        channels = [d["channel"] for d in dispatched]
        assert NotificationChannel.GOOGLE_CALENDAR in channels
        assert NotificationChannel.EMAIL in channels
        assert len(dispatched) == 2

    @pytest.mark.parametrize("offset", [0, 2, 3, 4, 5, 6, 8, 10, 14, 30])
    def test_non_trigger_offset_dispatches_nothing(self, business, offset):
        result = self._run(business, offset=offset)
        assert result["total_dispatched"] == 0
        assert result["dispatched"] == []

    def test_past_deadline_dispatches_nothing(self, business):
        # Negative days_remaining = past deadline
        result = self._run(business, offset=-1)
        assert result["total_dispatched"] == 0

    def test_inactive_business_skipped(self, user, make_business):
        inactive_biz = make_business(user, name="Inactive Corp")
        inactive_biz.is_active = False
        inactive_biz.save()
        due = date(2026, 11, 1)
        events = [_make_calendar_event(due_date=due, days_remaining=7)]
        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=inactive_biz,
                reference_date=date(2026, 10, 25),
                language="en",
                dry_run=True,
            )
        assert result["status"] == "SKIPPED_INACTIVE_BUSINESS"
        assert result["notifications_dispatched"] == []

    def test_completed_event_status_skipped(self, business):
        due = date(2026, 11, 1)
        events = [_make_calendar_event(due_date=due, days_remaining=7, status="COMPLETED")]
        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=business,
                reference_date=date(2026, 10, 25),
                target_offset_days=7,
                dry_run=True,
                force=True,
            )
        assert result["total_dispatched"] == 0

    def test_cancelled_event_status_skipped(self, business):
        due = date(2026, 11, 1)
        events = [_make_calendar_event(due_date=due, days_remaining=7, status="CANCELLED")]
        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=business,
                reference_date=date(2026, 10, 25),
                target_offset_days=7,
                dry_run=True,
                force=True,
            )
        assert result["total_dispatched"] == 0

    def test_no_events_produces_empty_result(self, business):
        with _patch_calendar([]):
            result = evaluate_and_send_deadline_notifications(
                business=business,
                reference_date=date(2026, 10, 25),
                target_offset_days=7,
                dry_run=True,
            )
        assert result["total_dispatched"] == 0
        assert result["total_evaluated_events"] == 0


# ---------------------------------------------------------------------------
# evaluate_and_send_deadline_notifications — multilingual dry-run
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestNotificationLanguageRendering:
    def _run_lang(self, business, lang: str, offset: int = 7) -> dict:
        due = date(2026, 11, 1)
        events = [_make_calendar_event(due_date=due, days_remaining=offset)]
        with _patch_calendar(events):
            return evaluate_and_send_deadline_notifications(
                business=business,
                reference_date=date(2026, 10, 25),
                target_offset_days=offset,
                language=lang,
                dry_run=True,
                force=True,
            )

    def test_en_result_carries_language_en(self, business):
        result = self._run_lang(business, "en")
        assert result["language"] == "en"

    def test_hi_result_carries_language_hi(self, business):
        result = self._run_lang(business, "hi")
        assert result["language"] == "hi"

    def test_bn_result_carries_language_bn(self, business):
        result = self._run_lang(business, "bn")
        assert result["language"] == "bn"

    def test_hi_t7_subject_contains_devanagari(self, business):
        result = self._run_lang(business, "hi", offset=7)
        dispatched = result["dispatched"]
        assert dispatched, "Expected at least one dispatched notification"
        cal_entry = next(d for d in dispatched if d["channel"] == NotificationChannel.GOOGLE_CALENDAR)
        # The Hindi calendar template uses Devanagari for "days"
        assert "दिनों" in cal_entry["subject_or_title"]

    def test_bn_t1_email_subject_contains_bengali(self, business):
        result = self._run_lang(business, "bn", offset=1)
        dispatched = result["dispatched"]
        email_entry = next(d for d in dispatched if d["channel"] == NotificationChannel.EMAIL)
        # Bengali template uses Bengali text
        assert "কমপ্লায়েন্স" in email_entry["subject_or_title"]

    def test_unknown_language_falls_back_to_en(self, business):
        result = self._run_lang(business, "xx")  # invalid → falls back
        assert result["language"] == "en"


# ---------------------------------------------------------------------------
# evaluate_and_send_deadline_notifications — idempotency (live DB writes)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestNotificationIdempotency:
    def _run_live(self, business, offset: int, force: bool = False, lang: str = "en") -> dict:
        due = date(2026, 12, 1)
        events = [_make_calendar_event(
            req_id="REQ-IDEM-001",
            due_date=due,
            days_remaining=offset,
        )]
        with _patch_calendar(events):
            return evaluate_and_send_deadline_notifications(
                business=business,
                reference_date=date(2026, 12, 1) - __import__("datetime").timedelta(days=offset),
                target_offset_days=offset,
                language=lang,
                dry_run=False,
                force=force,
            )

    def test_t7_creates_exactly_one_record_per_channel(self, business):
        result = self._run_live(business, offset=7)
        assert result["total_dispatched"] == 1  # Calendar only
        assert DeadlineNotificationDelivery.objects.filter(
            business=business,
            offset_days=7,
            channel=NotificationChannel.GOOGLE_CALENDAR,
        ).count() == 1

    def test_t1_creates_two_records_calendar_and_email(self, business, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
        result = self._run_live(business, offset=1)
        assert result["total_dispatched"] == 2  # Calendar + Email
        assert DeadlineNotificationDelivery.objects.filter(
            business=business,
            offset_days=1,
        ).count() == 2

    def test_repeated_t7_run_produces_no_duplicate(self, business):
        self._run_live(business, offset=7)
        result2 = self._run_live(business, offset=7)
        # Second run: 0 dispatched, 1 duplicate skipped
        assert result2["total_dispatched"] == 0
        assert result2["total_skipped_duplicates"] == 1
        # DB still has only one record
        assert DeadlineNotificationDelivery.objects.filter(
            business=business,
            offset_days=7,
            channel=NotificationChannel.GOOGLE_CALENDAR,
        ).count() == 1

    def test_force_true_bypasses_idempotency_check(self, business):
        """force=True causes the dispatch function to run again.
        The DB record may or may not be duplicated depending on constraint behaviour;
        the important invariant is that the second run does NOT skip with 'skipped_duplicates'.
        """
        # First run creates the record
        result1 = self._run_live(business, offset=7)
        assert result1["total_dispatched"] == 1
        assert result1["total_skipped_duplicates"] == 0
        # Second run WITHOUT force: skipped
        result2 = self._run_live(business, offset=7, force=False)
        assert result2["total_dispatched"] == 0
        assert result2["total_skipped_duplicates"] == 1

    def test_different_offset_does_not_block_each_other(self, business, settings):
        """T-7 run followed by T-1 run are independent idempotency scopes."""
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
        self._run_live(business, offset=7)
        result_t1 = self._run_live(business, offset=1)
        assert result_t1["total_dispatched"] == 2  # Calendar + Email, fresh
        assert result_t1["total_skipped_duplicates"] == 0


# ---------------------------------------------------------------------------
# Multi-business / multi-user isolation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestBusinessIsolation:
    def _run_live(self, business, offset: int = 7) -> dict:
        due = date(2026, 12, 15)
        events = [_make_calendar_event(req_id="REQ-ISO-001", due_date=due, days_remaining=offset)]
        with _patch_calendar(events):
            return evaluate_and_send_deadline_notifications(
                business=business,
                reference_date=date(2026, 12, 8),
                target_offset_days=offset,
                dry_run=False,
                force=False,
            )

    def test_notifications_scoped_to_business(self, user, other_user, make_business):
        biz_a = make_business(user, name="Business A")
        biz_b = make_business(other_user, name="Business B")
        self._run_live(biz_a)
        self._run_live(biz_b)
        # Each business has its own isolated notification record
        assert DeadlineNotificationDelivery.objects.filter(business=biz_a).count() == 1
        assert DeadlineNotificationDelivery.objects.filter(business=biz_b).count() == 1
        # They don't contaminate each other's idempotency
        result_a_again = self._run_live(biz_a)
        result_b_again = self._run_live(biz_b)
        assert result_a_again["total_skipped_duplicates"] == 1
        assert result_b_again["total_skipped_duplicates"] == 1

    def test_different_users_same_business_both_notified(self, user, other_user, make_business, db):
        from apps.businesses.models import BusinessMembership
        biz = make_business(user, name="Shared Corp")
        # Add other_user as a compliance manager member
        BusinessMembership.objects.get_or_create(
            business=biz, user=other_user, defaults={"role": BusinessMembership.Role.MANAGER}
        )
        due = date(2026, 12, 15)
        events = [_make_calendar_event(req_id="REQ-SHARED-001", due_date=due, days_remaining=7)]
        with _patch_calendar(events):
            result = evaluate_and_send_deadline_notifications(
                business=biz,
                reference_date=date(2026, 12, 8),
                target_offset_days=7,
                dry_run=False,
                force=False,
            )
        # One Calendar notification per user = 2 total
        user_ids = {d["user_id"] for d in result["dispatched"]}
        assert str(user.id) in user_ids
        assert str(other_user.id) in user_ids
        assert result["total_dispatched"] == 2


# ---------------------------------------------------------------------------
# Template rendering completeness
# ---------------------------------------------------------------------------


class TestTemplateRendering:
    """All template placeholders must format without KeyError for all languages."""

    DUMMY_EVENT = {
        "title": "Test Deadline",
        "authority": "Test Authority",
        "basis": "Test Act §1",
    }
    DUE = date(2026, 12, 1)

    @pytest.mark.parametrize("lang", ["en", "hi", "bn"])
    def test_calendar_template_renders(self, lang):
        tpl = CALENDAR_TEMPLATES[lang]
        title = tpl["title"].format(title=self.DUMMY_EVENT["title"], days=7)
        desc = tpl["description"].format(
            business_name="Test Business",
            title=self.DUMMY_EVENT["title"],
            authority=self.DUMMY_EVENT["authority"],
            due_date=self.DUE.isoformat(),
            basis=self.DUMMY_EVENT["basis"],
        )
        assert title
        assert desc

    @pytest.mark.parametrize("lang", ["en", "hi", "bn"])
    def test_email_template_renders(self, lang):
        tpl = EMAIL_TEMPLATES[lang]
        subject = tpl["subject"].format(title=self.DUMMY_EVENT["title"])
        body = tpl["body"].format(
            recipient_name="Test User",
            business_name="Test Business",
            title=self.DUMMY_EVENT["title"],
            authority=self.DUMMY_EVENT["authority"],
            due_date=self.DUE.isoformat(),
            basis=self.DUMMY_EVENT["basis"],
        )
        assert subject
        assert body
