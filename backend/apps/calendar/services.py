"""Compliance deadline notification and calendar services.

Authority: PRD_v2.0 §20; TRD_v2.0 §30, §31.

Deterministic notification rules:
- T-7 (exactly 7 days remaining): Google Calendar reminder/event ONLY.
- T-1 (exactly 1 day remaining): Google Calendar reminder/event AND Email notification.
- Configurable policies support priority tiers (LOW, MEDIUM, HIGH, CRITICAL).
- Overdue compliance detection with non-spam cadence (+1, +7, +14, +30 days past deadline).
- In-App notifications with read/unread tracking.
- Bounded retries and independent channel delivery.
- User preference channel toggles.

Localization:
- Supports English ('en'), Hindi ('hi'), and Bengali ('bn').
- Preserves official statutory names of Acts, Authorities, and Standards.

Idempotency:
- Every notification is recorded in `DeadlineNotificationDelivery` scoped by:
  (user, business, requirement_id, deadline_date, offset_days, channel, event_type).
- Duplicate dispatches are prevented deterministically.
"""

from __future__ import annotations

import logging
import time
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
    NotificationEventType,
    NotificationPreference,
    NotificationPriority,
)
from apps.calendar.policies import (
    DEFAULT_NOTIFICATION_POLICY,
    NAMED_POLICIES,
    NotificationPolicy,
    resolve_notification_policy,
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

OVERDUE_EMAIL_TEMPLATES: dict[str, dict[str, str]] = {
    "en": {
        "subject": "URGENT OVERDUE NOTICE: {title} ({days} day(s) overdue)",
        "body": (
            "Dear {recipient_name},\n\n"
            "This is an urgent overdue compliance notice from ComplyWise for {business_name}.\n\n"
            "The statutory filing or renewal deadline for the following compliance mandate has PASSED:\n\n"
            "• Requirement: {title}\n"
            "• Regulatory Authority: {authority}\n"
            "• Statutory Due Date: {due_date}\n"
            "• Days Overdue: {days} day(s)\n"
            "• Legal Basis: {basis}\n"
            "• Current Status: OVERDUE\n\n"
            "Immediate submission is required through the appropriate regulatory portal to mitigate legal penalties, "
            "operational suspension, or compounded late filing fines.\n\n"
            "View actionable resolution steps on ComplyWise: https://complywise.in\n\n"
            "Sincerely,\n"
            "ComplyWise Compliance Escalation Desk\n"
            "https://complywise.in"
        ),
    },
    "hi": {
        "subject": "अतिदेय अनुपालन सूचना: {title} ({days} दिन बीत चुके)",
        "body": (
            "प्रिय {recipient_name},\n\n"
            "यह {business_name} के लिए ComplyWise की ओर से एक महत्वपूर्ण अतिदेय अनुपालन सूचना है।\n\n"
            "निम्नलिखित वैधानिक अनुपालन अधिदेश की अंतिम तिथि समाप्त हो चुकी है:\n\n"
            "• आवश्यकता: {title}\n"
            "• विनियामक प्राधिकरण: {authority}\n"
            "• वैधानिक देय तिथि: {due_date}\n"
            "• अतिदेय दिन: {days} दिन\n"
            "• कानूनी आधार: {basis}\n"
            "• स्थिति: अतिदेय (OVERDUE)\n\n"
            "विनियामक दंड या व्यावसायिक रोक से बचने के लिए संबंधित पोर्टल पर तुरंत फाइलिंग पूरी करें।\n\n"
            "विस्तृत जानकारी देखें: https://complywise.in\n\n"
            "सादर,\n"
            "ComplyWise अनुपालन एस्केलेशन डेस्क\n"
            "https://complywise.in"
        ),
    },
    "bn": {
        "subject": "জরুরি বকেয়া কমপ্লায়েন্স নোটিশ: {title} ({days} দিন অতিক্রান্ত)",
        "body": (
            "প্রিয় {recipient_name},\n\n"
            "এটি {business_name}-এর জন্য ComplyWise-এর পক্ষ থেকে একটি জরুরি বকেয়া কমপ্লায়েন্স নোটিশ।\n\n"
            "নিম্নলিখিত কমপ্লায়েন্সের সংবিধিবদ্ধ সময়সীমা ইতিমধ্যে পার হয়ে গেছে:\n\n"
            "• প্রয়োজনীয়তা: {title}\n"
            "• নিয়ন্ত্রক কর্তৃপক্ষ: {authority}\n"
            "• সংবিধিবদ্ধ নির্দিষ্ট তারিখ: {due_date}\n"
            "• বকেয়া দিন: {days} দিন\n"
            "• আইনি ভিত্তি: {basis}\n"
            "• অবস্থা: বকেয়া (OVERDUE)\n\n"
            "আইনি জরিমানা বা ব্যবসায়িক বিঘ্ন এড়াতে অনুগ্রহ করে অবিলম্বে নির্ধারিত পোর্টালে প্রয়োজনীয় ফাইলিং সম্পন্ন করুন।\n\n"
            "ComplyWise পোর্টালে দেখুন: https://complywise.in\n\n"
            "শুভেচ্ছান্তে,\n"
            "ComplyWise কমপ্লায়েন্স ডেস্ক\n"
            "https://complywise.in"
        ),
    },
}

IN_APP_TEMPLATES: dict[str, dict[str, str]] = {
    "en": {
        "upcoming_title": "{title} — Due in {days} day(s)",
        "upcoming_message": (
            "Statutory deadline due on {due_date} ({authority}). "
            "Prepare required documents and filings."
        ),
        "overdue_title": "OVERDUE: {title} ({days} day(s) past deadline)",
        "overdue_message": (
            "Statutory deadline of {due_date} has passed ({authority}). "
            "Action required immediately to avoid penalties."
        ),
    },
    "hi": {
        "upcoming_title": "{title} — {days} दिनों में देय",
        "upcoming_message": (
            "वैधानिक समय सीमा {due_date} ({authority}) को देय है। "
            "आवश्यक दस्तावेज और फाइलिंग तैयार करें।"
        ),
        "overdue_title": "अतिदेय: {title} ({days} दिन बीत चुके)",
        "overdue_message": (
            "{due_date} की वैधानिक समय सीमा समाप्त हो गई है ({authority})। "
            "दंड से बचने के लिए तत्काल कार्रवाई आवश्यक है।"
        ),
    },
    "bn": {
        "upcoming_title": "{title} — {days} দিনের মধ্যে প্রযোজ্য",
        "upcoming_message": (
            "সংবিধিবদ্ধ সময়সীমা {due_date} ({authority}) তারিখে শেষ হবে। "
            "প্রয়োজনীয় নথিপত্র এবং ফাইলিং প্রস্তুত রাখুন।"
        ),
        "overdue_title": "বকেয়া: {title} ({days} দিন অতিক্রান্ত)",
        "overdue_message": (
            "{due_date}-এর নির্দিষ্ট সময়সীমা উত্তীর্ণ হয়েছে ({authority})। "
            "জরিমানা এড়াতে অবিলম্বে পদক্ষেপ নিন।"
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
            import json
            import urllib.parse
            import urllib.request

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
    max_retries: int = 3,
) -> dict[str, Any]:
    """Create or simulate a Google Calendar reminder event with bounded retries."""
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

    access_token = get_google_calendar_access_token()
    if access_token:
        last_error = ""
        for attempt in range(1, max_retries + 1):
            try:
                import json
                import urllib.error
                import urllib.request

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
                        "attempts": attempt,
                    }
            except urllib.error.HTTPError as exc:
                err_body = ""
                try:
                    err_body = exc.read().decode("utf-8")
                except Exception:
                    pass
                last_error = f"Google Calendar API HTTP {exc.code}: {err_body or exc.reason}"
                logger.error("Google Calendar attempt %d returned HTTP %s: %s", attempt, exc.code, err_body)
                if exc.code < 500:
                    break
            except Exception as exc:
                last_error = str(exc)
                logger.error("Google Calendar attempt %d failed: %s", attempt, exc)

        return {
            "provider": "google_calendar_live",
            "status": "FAILED",
            "error": last_error,
            "title": title_formatted,
            "attempts": max_retries,
        }

    simulated_id = f"gcal_sim_{uuid.uuid4().hex[:12]}"
    return {
        "provider": "google_calendar_simulator",
        "status": "SIMULATED",
        "event_id": simulated_id,
        "title": title_formatted,
        "due_date": due_date.isoformat(),
        "summary": title_formatted,
        "attempts": 1,
    }


def dispatch_email_notification(
    user: Any,
    business: Business,
    event: dict[str, Any],
    due_date: date,
    offset_days: int,
    language: str = "en",
    is_overdue: bool = False,
    max_retries: int = 3,
) -> dict[str, Any]:
    """Send statutory compliance email notification using Django's email backend with bounded retries."""
    lang = get_notification_language(language)
    template_collection = OVERDUE_EMAIL_TEMPLATES if is_overdue else EMAIL_TEMPLATES
    tpl = template_collection.get(lang, template_collection["en"])

    recipient_email = getattr(user, "email", None) or ""
    if not recipient_email:
        return {
            "status": "FAILED",
            "error": "User does not have a registered email address.",
            "attempts": 0,
        }

    recipient_name = getattr(user, "full_name", "") or getattr(user, "email", "Compliance Officer")

    subject = tpl["subject"].format(
        title=event.get("title", "Statutory Compliance Deadline"),
        days=offset_days,
    )
    body = tpl["body"].format(
        recipient_name=recipient_name,
        business_name=business.name,
        title=event.get("title", "Statutory Compliance Deadline"),
        authority=event.get("authority", "Statutory Authority"),
        due_date=due_date.isoformat(),
        basis=event.get("basis", "Mandatory statutory schedule"),
        days=offset_days,
    )

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "compliance-alerts@complywise.in")

    last_error = ""
    for attempt in range(1, max_retries + 1):
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
                "attempts": attempt,
            }
        except Exception as exc:
            last_error = str(exc)
            logger.error("Failed to send compliance email to %s (attempt %d): %s", recipient_email, attempt, exc)

    return {
        "provider": "django_mail",
        "status": "FAILED",
        "error": last_error,
        "recipient": recipient_email,
        "attempts": max_retries,
    }


def dispatch_in_app_notification(
    user: Any,
    business: Business,
    event: dict[str, Any],
    due_date: date,
    offset_days: int,
    language: str = "en",
    is_overdue: bool = False,
    priority: str = "MEDIUM",
) -> dict[str, Any]:
    """Create in-app notification payload for the ComplyWise activity center."""
    lang = get_notification_language(language)
    tpl = IN_APP_TEMPLATES.get(lang, IN_APP_TEMPLATES["en"])

    title_key = "overdue_title" if is_overdue else "upcoming_title"
    msg_key = "overdue_message" if is_overdue else "upcoming_message"

    title = tpl[title_key].format(
        title=event.get("title", "Statutory Requirement"),
        days=offset_days,
        due_date=due_date.isoformat(),
        authority=event.get("authority", "Statutory Authority"),
    )
    message = tpl[msg_key].format(
        title=event.get("title", "Statutory Requirement"),
        days=offset_days,
        due_date=due_date.isoformat(),
        authority=event.get("authority", "Statutory Authority"),
    )

    action_url = f"/calendar?business_id={business.id}"

    return {
        "provider": "complywise_in_app",
        "status": "DELIVERED",
        "title": title,
        "message": message,
        "action_url": action_url,
        "priority": priority,
        "event_type": "OVERDUE" if is_overdue else "UPCOMING",
        "attempts": 1,
    }


def evaluate_and_send_deadline_notifications(
    business: Business,
    *,
    reference_date: date | None = None,
    target_offset_days: int | None = None,
    language: str = "en",
    dry_run: bool = False,
    force: bool = False,
    policy: NotificationPolicy | str | None = None,
    check_overdue: bool | None = None,
    include_in_app: bool | None = None,
    target_overdue_days: int | None = None,
) -> dict[str, Any]:
    """Evaluate compliance deadlines deterministically and dispatch notifications.

    Supports configurable policies, overdue detection, in-app alerts,
    bounded retries, and escalation to compliance managers.
    """
    if reference_date is None:
        reference_date = date.today()

    lang = get_notification_language(language)

    # Resolve active policy
    if policy is None:
        active_policy = DEFAULT_NOTIFICATION_POLICY
    elif isinstance(policy, str):
        active_policy = resolve_notification_policy(default_policy=policy)
    else:
        active_policy = policy

    # Overdue check:
    # If caller explicitly gave target_offset_days, disable overdue unless explicitly asked
    if check_overdue is None:
        check_overdue = target_overdue_days is not None or (target_offset_days is None)

    if not business.is_active:
        return {
            "business_id": str(business.id),
            "business_name": business.name,
            "status": "SKIPPED_INACTIVE_BUSINESS",
            "events_evaluated": 0,
            "notifications_dispatched": [],
            "duplicates_skipped": [],
        }

    # Determine recipient users for this business: owner + active compliance members
    base_recipients = [business.owner]
    for membership in business.memberships.select_related("user").filter(user__is_active=True):
        if membership.user and membership.user not in base_recipients:
            base_recipients.append(membership.user)

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

        # Exclude completed, cancelled, expired, or inactive items
        ev_status = str(ev.get("status", "")).upper()
        if ev_status in {"COMPLETED", "CANCELLED", "EXPIRED", "INACTIVE"}:
            continue

        actual_days_remaining = (event_due_date - reference_date).days

        # Case 1: Overdue Item (actual_days_remaining < 0)
        is_overdue_case = actual_days_remaining < 0
        if is_overdue_case:
            if not check_overdue:
                continue

            days_overdue = abs(actual_days_remaining)
            effective_overdue = target_overdue_days if target_overdue_days is not None else days_overdue

            # Check if this overdue day is in the cadence (e.g. 1, 7, 14, 30 days overdue)
            if target_overdue_days is None and not active_policy.is_overdue_trigger(effective_overdue):
                continue

            event_priority = getattr(active_policy, "priority", NotificationPriority.HIGH)
            event_type = (
                NotificationEventType.ESCALATION
                if active_policy.escalate_on_overdue
                else NotificationEventType.OVERDUE
            )

            recipients = list(base_recipients)

            channels = list(active_policy.overdue_channels)
            if include_in_app is False and NotificationChannel.IN_APP in channels:
                channels.remove(NotificationChannel.IN_APP)
            elif include_in_app is True and NotificationChannel.IN_APP not in channels:
                channels.append(NotificationChannel.IN_APP)

            evaluated_events.append({
                "requirement_id": req_id,
                "title": ev.get("title"),
                "due_date": date_str,
                "days_overdue": effective_overdue,
                "is_overdue": True,
            })

            for user in recipients:
                pref = NotificationPreference.objects.filter(user=user, business=business).first() or \
                       NotificationPreference.objects.filter(user=user, business=None).first()

                user_lang = get_notification_language(pref.language if pref else lang)

                for channel in channels:
                    if pref:
                        if channel == NotificationChannel.EMAIL and not pref.email_enabled:
                            continue
                        if channel == NotificationChannel.GOOGLE_CALENDAR and not pref.calendar_enabled:
                            continue
                        if channel == NotificationChannel.IN_APP and not pref.in_app_enabled:
                            continue

                    existing = DeadlineNotificationDelivery.objects.filter(
                        user=user,
                        business=business,
                        requirement_id=req_id,
                        deadline_date=event_due_date,
                        offset_days=effective_overdue,
                        channel=channel,
                        event_type=event_type,
                    ).first()

                    if existing and not force:
                        skipped_duplicates.append({
                            "user_id": str(user.id),
                            "requirement_id": req_id,
                            "channel": channel,
                            "offset_days": effective_overdue,
                            "deadline_date": date_str,
                            "event_type": event_type,
                            "reason": "Idempotent: notification already delivered.",
                        })
                        continue

                    if dry_run:
                        email_subj = OVERDUE_EMAIL_TEMPLATES.get(user_lang, OVERDUE_EMAIL_TEMPLATES["en"])["subject"].format(
                            title=ev.get("title", "Statutory Deadline"),
                            days=effective_overdue,
                        )
                        dispatched.append({
                            "user_id": str(user.id),
                            "user_email": user.email,
                            "requirement_id": req_id,
                            "channel": channel,
                            "offset_days": effective_overdue,
                            "deadline_date": date_str,
                            "event_type": event_type,
                            "subject_or_title": email_subj,
                            "priority": event_priority,
                            "dry_run": True,
                        })
                        continue

                    dispatch_result: dict[str, Any] = {}
                    subject_title = ""

                    if channel == NotificationChannel.EMAIL:
                        dispatch_result = dispatch_email_notification(
                            user=user,
                            business=business,
                            event=ev,
                            due_date=event_due_date,
                            offset_days=effective_overdue,
                            language=user_lang,
                            is_overdue=True,
                        )
                        subject_title = dispatch_result.get("subject", "")
                    elif channel == NotificationChannel.IN_APP:
                        dispatch_result = dispatch_in_app_notification(
                            user=user,
                            business=business,
                            event=ev,
                            due_date=event_due_date,
                            offset_days=effective_overdue,
                            language=user_lang,
                            is_overdue=True,
                            priority=event_priority,
                        )
                        subject_title = dispatch_result.get("title", "")
                    elif channel == NotificationChannel.GOOGLE_CALENDAR:
                        dispatch_result = dispatch_google_calendar_event(
                            user=user,
                            business=business,
                            event=ev,
                            due_date=event_due_date,
                            offset_days=effective_overdue,
                            language=user_lang,
                        )
                        subject_title = dispatch_result.get("title", "")

                    status_val = dispatch_result.get("status", NotificationDeliveryStatus.DELIVERED)
                    attempts = dispatch_result.get("attempts", 1)
                    fail_reason = dispatch_result.get("error", "")
                    prov = dispatch_result.get("provider", "")

                    record, _ = DeadlineNotificationDelivery.objects.update_or_create(
                        user=user,
                        business=business,
                        requirement_id=req_id,
                        deadline_date=event_due_date,
                        offset_days=effective_overdue,
                        channel=channel,
                        event_type=event_type,
                        defaults={
                            "priority": event_priority,
                            "status": status_val,
                            "language": user_lang,
                            "subject_or_title": subject_title,
                            "recipient": user.email,
                            "details": dispatch_result,
                            "attempt_count": attempts,
                            "failure_reason": fail_reason,
                            "provider": prov,
                        },
                    )

                    dispatched.append({
                        "record_id": str(record.id),
                        "user_id": str(user.id),
                        "user_email": user.email,
                        "requirement_id": req_id,
                        "channel": channel,
                        "offset_days": effective_overdue,
                        "deadline_date": date_str,
                        "event_type": event_type,
                        "priority": event_priority,
                        "status": status_val,
                        "subject_or_title": subject_title,
                        "details": dispatch_result,
                    })

            continue

        # Case 2: Upcoming Deadline (actual_days_remaining >= 0)
        effective_offset = target_offset_days if target_offset_days is not None else actual_days_remaining

        evaluated_events.append({
            "requirement_id": req_id,
            "title": ev.get("title"),
            "due_date": date_str,
            "days_remaining": effective_offset,
            "is_overdue": False,
        })

        # Check policy offset trigger
        channels = active_policy.get_channels_for_offset(effective_offset)

        # Allow caller to override in-app behavior
        if include_in_app is False and NotificationChannel.IN_APP in channels:
            channels = [c for c in channels if c != NotificationChannel.IN_APP]
        elif include_in_app is True and NotificationChannel.IN_APP not in channels:
            channels.append(NotificationChannel.IN_APP)

        if not channels:
            continue

        event_priority = getattr(active_policy, "priority", NotificationPriority.MEDIUM)
        should_escalate = effective_offset in active_policy.escalate_on_offsets
        event_type = NotificationEventType.ESCALATION if should_escalate else NotificationEventType.UPCOMING

        recipients = list(base_recipients)

        for user in recipients:
            pref = NotificationPreference.objects.filter(user=user, business=business).first() or \
                   NotificationPreference.objects.filter(user=user, business=None).first()

            user_lang = get_notification_language(pref.language if pref else lang)

            for channel in channels:
                if pref:
                    if channel == NotificationChannel.EMAIL and not pref.email_enabled:
                        continue
                    if channel == NotificationChannel.GOOGLE_CALENDAR and not pref.calendar_enabled:
                        continue
                    if channel == NotificationChannel.IN_APP and not pref.in_app_enabled:
                        continue

                existing = DeadlineNotificationDelivery.objects.filter(
                    user=user,
                    business=business,
                    requirement_id=req_id,
                    deadline_date=event_due_date,
                    offset_days=effective_offset,
                    channel=channel,
                    event_type=event_type,
                ).first()

                if existing and not force:
                    skipped_duplicates.append({
                        "user_id": str(user.id),
                        "requirement_id": req_id,
                        "channel": channel,
                        "offset_days": effective_offset,
                        "deadline_date": date_str,
                        "event_type": event_type,
                        "reason": "Idempotent: notification already delivered.",
                    })
                    continue

                if dry_run:
                    cal_title = CALENDAR_TEMPLATES.get(user_lang, CALENDAR_TEMPLATES["en"])["title"].format(
                        title=ev.get("title", "Statutory Deadline"), days=effective_offset
                    )
                    email_subj = EMAIL_TEMPLATES.get(user_lang, EMAIL_TEMPLATES["en"])["subject"].format(
                        title=ev.get("title", "Statutory Deadline")
                    )
                    in_app_title = IN_APP_TEMPLATES.get(user_lang, IN_APP_TEMPLATES["en"])["upcoming_title"].format(
                        title=ev.get("title", "Statutory Deadline"),
                        days=effective_offset,
                        due_date=date_str,
                        authority=ev.get("authority", "Statutory Authority"),
                    )
                    sub_title = (
                        cal_title
                        if channel == NotificationChannel.GOOGLE_CALENDAR
                        else email_subj
                        if channel == NotificationChannel.EMAIL
                        else in_app_title
                    )
                    dispatched.append({
                        "user_id": str(user.id),
                        "user_email": user.email,
                        "requirement_id": req_id,
                        "channel": channel,
                        "offset_days": effective_offset,
                        "deadline_date": date_str,
                        "event_type": event_type,
                        "priority": event_priority,
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
                        language=user_lang,
                    )
                    subject_title = dispatch_result.get("title", "")
                elif channel == NotificationChannel.EMAIL:
                    dispatch_result = dispatch_email_notification(
                        user=user,
                        business=business,
                        event=ev,
                        due_date=event_due_date,
                        offset_days=effective_offset,
                        language=user_lang,
                        is_overdue=False,
                    )
                    subject_title = dispatch_result.get("subject", "")
                elif channel == NotificationChannel.IN_APP:
                    dispatch_result = dispatch_in_app_notification(
                        user=user,
                        business=business,
                        event=ev,
                        due_date=event_due_date,
                        offset_days=effective_offset,
                        language=user_lang,
                        is_overdue=False,
                        priority=event_priority,
                    )
                    subject_title = dispatch_result.get("title", "")

                status_val = dispatch_result.get("status", NotificationDeliveryStatus.DELIVERED)
                attempts = dispatch_result.get("attempts", 1)
                fail_reason = dispatch_result.get("error", "")
                prov = dispatch_result.get("provider", "")

                record, _ = DeadlineNotificationDelivery.objects.update_or_create(
                    user=user,
                    business=business,
                    requirement_id=req_id,
                    deadline_date=event_due_date,
                    offset_days=effective_offset,
                    channel=channel,
                    event_type=event_type,
                    defaults={
                        "priority": event_priority,
                        "status": status_val,
                        "language": user_lang,
                        "subject_or_title": subject_title,
                        "recipient": user.email,
                        "details": dispatch_result,
                        "attempt_count": attempts,
                        "failure_reason": fail_reason,
                        "provider": prov,
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
                    "event_type": event_type,
                    "priority": event_priority,
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


def retry_failed_notifications(
    business: Business | None = None,
    max_retries: int = 3,
) -> dict[str, Any]:
    """Retry previously failed deadline notification dispatches bounded by max_retries."""
    query = DeadlineNotificationDelivery.objects.filter(
        status__in=[NotificationDeliveryStatus.FAILED, NotificationDeliveryStatus.RETRYING],
        attempt_count__lt=max_retries,
    )
    if business:
        query = query.filter(business=business)

    retried: list[dict[str, Any]] = []

    for item in query.select_related("user", "business"):
        mock_event = {
            "title": item.subject_or_title or item.requirement_id,
            "authority": item.details.get("authority", "Statutory Authority"),
            "basis": item.details.get("basis", "Mandatory statutory schedule"),
        }

        dispatch_result: dict[str, Any] = {}
        if item.channel == NotificationChannel.GOOGLE_CALENDAR:
            dispatch_result = dispatch_google_calendar_event(
                user=item.user,
                business=item.business,
                event=mock_event,
                due_date=item.deadline_date,
                offset_days=item.offset_days,
                language=item.language,
                max_retries=1,
            )
        elif item.channel == NotificationChannel.EMAIL:
            dispatch_result = dispatch_email_notification(
                user=item.user,
                business=item.business,
                event=mock_event,
                due_date=item.deadline_date,
                offset_days=item.offset_days,
                language=item.language,
                is_overdue=item.event_type == NotificationEventType.OVERDUE,
                max_retries=1,
            )

        new_status = dispatch_result.get("status", NotificationDeliveryStatus.FAILED)
        item.attempt_count += 1
        item.status = new_status
        if new_status in {NotificationDeliveryStatus.DELIVERED, NotificationDeliveryStatus.SIMULATED}:
            item.failure_reason = ""
        else:
            item.failure_reason = dispatch_result.get("error", "Retry attempt failed.")
        item.save(update_fields=["status", "attempt_count", "failure_reason", "updated_at"])

        retried.append({
            "record_id": str(item.id),
            "requirement_id": item.requirement_id,
            "channel": item.channel,
            "attempt_count": item.attempt_count,
            "new_status": new_status,
        })

    return {
        "total_retried": len(retried),
        "records": retried,
    }
