"""Compliance deadline notification and calendar services.

Authority: PRD_v2.0 §20; TRD_v2.0 §30, §31.

Deterministic notification rules:
- T-7 (exactly 7 days remaining): Google Calendar reminder/event ONLY.
- T-1 (exactly 1 day remaining): Google Calendar reminder/event AND Email notification.
- Any other number of days remaining: NO notification.

Localization:
- Supports English ('en'), Hindi ('hi'), and Bengali ('bn').
- Preserves official statutory names of Acts, Authorities, and Standards.

Idempotency:
- Every notification is recorded in `DeadlineNotificationDelivery` scoped by:
  (user, business, requirement_id, deadline_date, offset_days, channel).
- Duplicate dispatches are prevented deterministically.
"""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timedelta
from typing import Any

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from apps.businesses.models import Business
from apps.calendar.models import (
    DeadlineNotificationDelivery,
    NotificationChannel,
    NotificationDeliveryStatus,
)
from domain.intelligence.calendar_derivation import derive_business_calendar

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = ("en", "hi", "bn")

CALENDAR_TEMPLATES: dict[str, dict[str, str]] = {
    "en": {
        "title": "[ComplyWise] {title} — Due in {days} day(s)",
        "description": (
            "Statutory Compliance Deadline Notice\n\n"
            "Enterprise: {business_name}\n"
            "Requirement: {title}\n"
            "Regulatory Authority: {authority}\n"
            "Due Date: {due_date}\n"
            "Legal / Statutory Basis: {basis}\n\n"
            "This compliance reminder was generated deterministically by ComplyWise. "
            "Please review the filing or renewal requirements on your dashboard."
        ),
    },
    "hi": {
        "title": "[ComplyWise] {title} — {days} दिनों में देय",
        "description": (
            "वैधानिक अनुपालन समय सीमा सूचना\n\n"
            "उद्यम: {business_name}\n"
            "आवश्यकता: {title}\n"
            "विनियामक प्राधिकरण: {authority}\n"
            "देय तिथि: {due_date}\n"
            "कानूनी / वैधानिक आधार: {basis}\n\n"
            "यह अनुपालन अनुस्मारक ComplyWise द्वारा नियतात्मक रूप से उत्पन्न किया गया है। "
            "कृपया अपने डैशबोर्ड पर फाइलिंग या नवीनीकरण आवश्यकताओं की समीक्षा करें।"
        ),
    },
    "bn": {
        "title": "[ComplyWise] {title} — {days} দিনের মধ্যে প্রযোজ্য",
        "description": (
            "সংবিধিবদ্ধ কমপ্লায়েন্সের সময়সীমার বিজ্ঞপ্তি\n\n"
            "উদ্যোগ: {business_name}\n"
            "প্রয়োজনীয়তা: {title}\n"
            "নিয়ন্ত্রক কর্তৃপক্ষ: {authority}\n"
            "নির্দিষ্ট তারিখ: {due_date}\n"
            "আইনি / সংবিধিবদ্ধ ভিত্তি: {basis}\n\n"
            "এই কমপ্লায়েন্স রিমাইন্ডারটি ComplyWise দ্বারা সুনির্দিষ্টভাবে তৈরি করা হয়েছে। "
            "অনুগ্রহ করে আপনার ড্যাশবোর্ডে ফাইলিং বা পুনর্নবীকরণের প্রয়োজনীয়তা পর্যালোচনা করুন।"
        ),
    },
}

EMAIL_TEMPLATES: dict[str, dict[str, str]] = {
    "en": {
        "subject": "Urgent Compliance Deadline Tomorrow: {title}",
        "body": (
            "Dear {recipient_name},\n\n"
            "This is an urgent statutory compliance notification from ComplyWise for {business_name}.\n\n"
            "The following compliance requirement has a statutory filing or renewal deadline TOMORROW ({due_date}):\n\n"
            "• Requirement: {title}\n"
            "• Regulatory Authority: {authority}\n"
            "• Legal Basis: {basis}\n"
            "• Status: Action Required\n\n"
            "To prevent regulatory penalties, show-cause notices, or operational disruption, please ensure "
            "the necessary filing is submitted through the designated department portal.\n\n"
            "View comprehensive filing workflows and document checklists on your ComplyWise portal.\n\n"
            "Warm regards,\n"
            "ComplyWise Compliance Intelligence Team\n"
            "https://complywise.in"
        ),
    },
    "hi": {
        "subject": "महत्वपूर्ण अनुपालन समय सीमा कल: {title}",
        "body": (
            "प्रिय {recipient_name},\n\n"
            "यह {business_name} के लिए ComplyWise की ओर से एक महत्वपूर्ण वैधानिक अनुपालन सूचना है।\n\n"
            "निम्नलिखित अनुपालन आवश्यकता के लिए वैधानिक फाइलिंग या नवीनीकरण की समय सीमा कल ({due_date}) समाप्त हो रही है:\n\n"
            "• आवश्यकता: {title}\n"
            "• विनियामक प्राधिकरण: {authority}\n"
            "• कानूनी आधार: {basis}\n"
            "• स्थिति: कार्रवाई आवश्यक\n\n"
            "विनियामक दंड, कारण बताओ नोटिस या व्यावसायिक बाधा से बचने के लिए, कृपया सुनिश्चित करें कि "
            "नामित विभाग पोर्टल के माध्यम से आवश्यक फाइलिंग पूरी की गई है।\n\n"
            "अपने ComplyWise पोर्टल पर विस्तृत फाइलिंग प्रक्रिया और दस्तावेज़ चेकलिस्ट देखें।\n\n"
            "सादर,\n"
            "ComplyWise अनुपालन इंटेलिजेंस टीम\n"
            "https://complywise.in"
        ),
    },
    "bn": {
        "subject": "জরুরি কমপ্লায়েন্স সময়সীমা আগামীকাল: {title}",
        "body": (
            "প্রিয় {recipient_name},\n\n"
            "এটি {business_name}-এর জন্য ComplyWise-এর পক্ষ থেকে একটি জরুরি সংবিধিবদ্ধ কমপ্লায়েন্স বিজ্ঞপ্তি।\n\n"
            "নিম্নলিখিত কমপ্লায়েন্স প্রয়োজনীয়তার সংবিধিবদ্ধ ফাইলিং বা পুনর্নবীকরণের সময়সীমা আগামীকাল ({due_date}) উত্তীর্ণ হচ্ছে:\n\n"
            "• প্রয়োজনীয়তা: {title}\n"
            "• নিয়ন্ত্রক কর্তৃপক্ষ: {authority}\n"
            "• আইনি ভিত্তি: {basis}\n"
            "• অবস্থা: পদক্ষেপ প্রয়োজন\n\n"
            "নিয়ন্ত্রক জরিমানা বা ব্যবসায়িক বিঘ্ন রোধ করতে, অনুগ্রহ করে মনোনীত বিভাগীয় পোর্টালের মাধ্যমে "
            "প্রয়োজনীয় ফাইলিং সম্পন্ন করা নিশ্চিত করুন।\n\n"
            "আপনার ComplyWise পোর্টালে বিস্তারিত ফাইলিং প্রক্রিয়া এবং নথিপত্রের তালিকা দেখুন।\n\n"
            "শুভেচ্ছান্তে,\n"
            "ComplyWise কমপ্লায়েন্স ইন্টেলিজেন্স টিম\n"
            "https://complywise.in"
        ),
    },
}


def get_notification_language(lang: str | None) -> str:
    """Normalize language code to one of 'en', 'hi', 'bn'."""
    if not lang:
        return "en"
    clean = str(lang).strip().lower()
    return clean if clean in SUPPORTED_LANGUAGES else "en"


def get_google_calendar_access_token() -> str:
    """Retrieve a valid Google Calendar access token, automatically refreshing via refresh_token if configured."""
    client_id = (getattr(settings, "GOOGLE_CALENDAR_CLIENT_ID", "") or "").strip()
    client_secret = (getattr(settings, "GOOGLE_CALENDAR_CLIENT_SECRET", "") or "").strip()
    refresh_token = (getattr(settings, "GOOGLE_CALENDAR_REFRESH_TOKEN", "") or "").strip()
    access_token = (getattr(settings, "GOOGLE_CALENDAR_ACCESS_TOKEN", "") or "").strip()

    if refresh_token and client_id and client_secret:
        try:
            import urllib.request
            import urllib.parse
            import json

            data = urllib.parse.urlencode({
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://oauth2.googleapis.com/token",
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                fresh_token = res_data.get("access_token")
                if fresh_token:
                    return fresh_token
        except Exception as exc:
            logger.error("Failed to refresh Google Calendar OAuth token: %s", exc)

    return access_token


def dispatch_google_calendar_event(
    user: Any,
    business: Business,
    event: dict[str, Any],
    due_date: date,
    offset_days: int,
    language: str = "en",
) -> dict[str, Any]:
    """Create or simulate a Google Calendar reminder event.

    Follows safe server-side API integration. If Google OAuth credentials are
    configured in settings, dispatches to Google Calendar API v3; otherwise returns
    a valid simulation response for development/testing without breaking or blocking.
    """
    lang = get_notification_language(language)
    tpl = CALENDAR_TEMPLATES.get(lang, CALENDAR_TEMPLATES["en"])

    title_formatted = tpl["title"].format(
        title=event.get("title", "Statutory Compliance Deadline"),
        days=offset_days,
    )
    desc_formatted = tpl["description"].format(
        business_name=business.name,
        title=event.get("title", "Statutory Compliance Deadline"),
        authority=event.get("authority", "Statutory Authority"),
        due_date=due_date.isoformat(),
        basis=event.get("basis", "Mandatory statutory schedule"),
    )

    # All-day calendar event representation for Google Calendar API v3
    # Note: Google Calendar requires the 'end' date for all-day events to be exclusive (due_date + 1 day)
    exclusive_end_date = due_date + timedelta(days=1)
    event_payload = {
        "summary": title_formatted,
        "description": desc_formatted,
        "start": {"date": due_date.isoformat()},
        "end": {"date": exclusive_end_date.isoformat()},
        "transparency": "transparent",
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 24 * 60},
                {"method": "email", "minutes": 24 * 60},
            ],
        },
    }

    # Check for live Google Calendar OAuth tokens
    access_token = get_google_calendar_access_token()
    if access_token:
        try:
            import urllib.request
            import urllib.error
            import json

            req = urllib.request.Request(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                data=json.dumps(event_payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return {
                    "provider": "google_calendar_live",
                    "status": "DELIVERED",
                    "event_id": data.get("id"),
                    "html_link": data.get("htmlLink"),
                    "title": title_formatted,
                    "target_calendar": "primary",
                }
        except urllib.error.HTTPError as exc:
            err_body = ""
            try:
                err_body = exc.read().decode("utf-8")
            except Exception:
                pass
            logger.error("Live Google Calendar API returned HTTP %s: %s", exc.code, err_body)
            return {
                "provider": "google_calendar_live",
                "status": "FAILED",
                "error": f"Google Calendar API HTTP {exc.code}: {err_body or exc.reason}",
                "title": title_formatted,
            }
        except Exception as exc:
            logger.error("Live Google Calendar API call failed: %s", exc)
            return {
                "provider": "google_calendar_live",
                "status": "FAILED",
                "error": str(exc),
                "title": title_formatted,
            }

    # Simulated/development provider
    simulated_id = f"gcal_sim_{uuid.uuid4().hex[:12]}"
    return {
        "provider": "google_calendar_simulator",
        "status": "SIMULATED",
        "event_id": simulated_id,
        "title": title_formatted,
        "due_date": due_date.isoformat(),
        "summary": title_formatted,
    }


def dispatch_email_notification(
    user: Any,
    business: Business,
    event: dict[str, Any],
    due_date: date,
    offset_days: int,
    language: str = "en",
) -> dict[str, Any]:
    """Send T-1 urgent compliance email notification using Django's email backend."""
    lang = get_notification_language(language)
    tpl = EMAIL_TEMPLATES.get(lang, EMAIL_TEMPLATES["en"])

    recipient_email = getattr(user, "email", None) or ""
    if not recipient_email:
        return {
            "status": "FAILED",
            "error": "User does not have a registered email address.",
        }

    recipient_name = getattr(user, "full_name", "") or getattr(user, "email", "Compliance Officer")

    subject = tpl["subject"].format(
        title=event.get("title", "Statutory Compliance Deadline"),
    )
    body = tpl["body"].format(
        recipient_name=recipient_name,
        business_name=business.name,
        title=event.get("title", "Statutory Compliance Deadline"),
        authority=event.get("authority", "Statutory Authority"),
        due_date=due_date.isoformat(),
        basis=event.get("basis", "Mandatory statutory schedule"),
    )

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "compliance-alerts@complywise.in")

    try:
        sent_count = send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        return {
            "provider": "django_mail",
            "status": "DELIVERED" if sent_count > 0 else "SIMULATED",
            "subject": subject,
            "recipient": recipient_email,
            "sent_count": sent_count,
        }
    except Exception as exc:
        logger.error("Failed to send compliance notification email to %s: %s", recipient_email, exc)
        return {
            "provider": "django_mail",
            "status": "FAILED",
            "error": str(exc),
            "recipient": recipient_email,
        }


def evaluate_and_send_deadline_notifications(
    business: Business,
    *,
    reference_date: date | None = None,
    target_offset_days: int | None = None,
    language: str = "en",
    dry_run: bool = False,
    force: bool = False,
) -> dict[str, Any]:
    """Evaluate compliance deadlines deterministically and dispatch notifications.

    Timing rules:
    - offset_days == 7: Google Calendar ONLY.
    - offset_days == 1: Google Calendar AND Email.
    - any other offset: NO NOTIFICATION.

    Idempotency:
    - At most once per (user, business, requirement_id, deadline_date, offset_days, channel).
    """
    if reference_date is None:
        reference_date = date.today()

    lang = get_notification_language(language)

    if not business.is_active:
        return {
            "business_id": str(business.id),
            "business_name": business.name,
            "status": "SKIPPED_INACTIVE_BUSINESS",
            "events_evaluated": 0,
            "notifications_dispatched": [],
            "duplicates_skipped": [],
        }

    # Determine recipient users for this business
    recipients = [business.owner]
    # Also notify active compliance managers if present
    for membership in business.memberships.select_related("user").filter(user__is_active=True):
        if membership.user and membership.user not in recipients:
            recipients.append(membership.user)

    # 1. Observe existing authoritative calendar events
    calendar_data = derive_business_calendar(business)
    events = calendar_data.get("events", [])

    evaluated_events: list[dict[str, Any]] = []
    dispatched: list[dict[str, Any]] = []
    skipped_duplicates: list[dict[str, Any]] = []

    for ev in events:
        req_id = ev.get("id")
        date_str = ev.get("date")
        if not req_id or not date_str:
            continue

        try:
            event_due_date = date.fromisoformat(date_str)
        except (ValueError, TypeError):
            continue

        # Respect existing application semantics: do not notify completed or cancelled items
        ev_status = str(ev.get("status", "")).upper()
        if ev_status in {"COMPLETED", "CANCELLED", "EXPIRED", "INACTIVE"}:
            continue

        # Calculate exact days remaining from reference_date
        actual_days_remaining = (event_due_date - reference_date).days

        # If running a targeted test simulation for a specific offset, use that offset
        effective_offset = target_offset_days if target_offset_days is not None else actual_days_remaining

        evaluated_events.append({
            "requirement_id": req_id,
            "title": ev.get("title"),
            "due_date": date_str,
            "days_remaining": effective_offset,
        })

        # DETERMINISTIC NOTIFICATION TIMING LOGIC (NO LLM / NO HEURISTIC)
        channels: list[str] = []
        if effective_offset == 7:
            channels = [NotificationChannel.GOOGLE_CALENDAR]
        elif effective_offset == 1:
            channels = [NotificationChannel.GOOGLE_CALENDAR, NotificationChannel.EMAIL]
        else:
            channels = []  # EXACTLY zero notifications on any other day offset

        if not channels:
            continue

        for user in recipients:
            for channel in channels:
                # Idempotency check
                existing = DeadlineNotificationDelivery.objects.filter(
                    user=user,
                    business=business,
                    requirement_id=req_id,
                    deadline_date=event_due_date,
                    offset_days=effective_offset,
                    channel=channel,
                ).first()

                if existing and not force:
                    skipped_duplicates.append({
                        "user_id": str(user.id),
                        "requirement_id": req_id,
                        "channel": channel,
                        "offset_days": effective_offset,
                        "deadline_date": date_str,
                        "reason": "Idempotent: notification already delivered.",
                    })
                    continue

                if dry_run:
                    cal_title = CALENDAR_TEMPLATES.get(lang, CALENDAR_TEMPLATES["en"])["title"].format(
                        title=ev.get("title", "Statutory Deadline"), days=effective_offset
                    )
                    email_subj = EMAIL_TEMPLATES.get(lang, EMAIL_TEMPLATES["en"])["subject"].format(
                        title=ev.get("title", "Statutory Deadline")
                    )
                    sub_title = cal_title if channel == NotificationChannel.GOOGLE_CALENDAR else email_subj
                    dispatched.append({
                        "user_id": str(user.id),
                        "user_email": user.email,
                        "requirement_id": req_id,
                        "channel": channel,
                        "offset_days": effective_offset,
                        "deadline_date": date_str,
                        "subject_or_title": sub_title,
                        "dry_run": True,
                    })
                    continue


                # Execute dispatch
                dispatch_result: dict[str, Any] = {}
                subject_title = ""

                if channel == NotificationChannel.GOOGLE_CALENDAR:
                    dispatch_result = dispatch_google_calendar_event(
                        user=user,
                        business=business,
                        event=ev,
                        due_date=event_due_date,
                        offset_days=effective_offset,
                        language=lang,
                    )
                    subject_title = dispatch_result.get("title", "")
                elif channel == NotificationChannel.EMAIL:
                    dispatch_result = dispatch_email_notification(
                        user=user,
                        business=business,
                        event=ev,
                        due_date=event_due_date,
                        offset_days=effective_offset,
                        language=lang,
                    )
                    subject_title = dispatch_result.get("subject", "")

                status_val = dispatch_result.get("status", NotificationDeliveryStatus.DELIVERED)

                # Persist immutable delivery audit record (or update when forced)
                record, _ = DeadlineNotificationDelivery.objects.update_or_create(
                    user=user,
                    business=business,
                    requirement_id=req_id,
                    deadline_date=event_due_date,
                    offset_days=effective_offset,
                    channel=channel,
                    defaults={
                        "status": status_val,
                        "language": lang,
                        "subject_or_title": subject_title,
                        "recipient": user.email,
                        "details": dispatch_result,
                    },
                )

                dispatched.append({
                    "record_id": str(record.id),
                    "user_id": str(user.id),
                    "user_email": user.email,
                    "requirement_id": req_id,
                    "channel": channel,
                    "offset_days": effective_offset,
                    "deadline_date": date_str,
                    "status": status_val,
                    "subject_or_title": subject_title,
                    "details": dispatch_result,
                })

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "reference_date": reference_date.isoformat(),
        "target_offset_days": target_offset_days,
        "language": lang,
        "total_evaluated_events": len(evaluated_events),
        "total_dispatched": len(dispatched),
        "total_skipped_duplicates": len(skipped_duplicates),
        "dispatched": dispatched,
        "skipped_duplicates": skipped_duplicates,
        "evaluated_events": evaluated_events,
    }
