"""Management command to process and dispatch compliance deadline notifications.

Authority: PRD_v2.0 §20; TRD_v2.0 §30, §31.

Usage:
  # Normal scheduled production execution (today's date, all active businesses):
  python manage.py process_deadline_notifications

  # Targeted business execution:
  python manage.py process_deadline_notifications --business-id <UUID>

  # Development / Test simulation for T-7 (Google Calendar only):
  python manage.py process_deadline_notifications --offset 7 --lang en

  # Development / Test simulation for T-1 (Google Calendar + Email):
  python manage.py process_deadline_notifications --offset 1 --lang hi

  # Dry-run inspection:
  python manage.py process_deadline_notifications --offset 7 --dry-run

  # Check overdue compliance requirements:
  python manage.py process_deadline_notifications --check-overdue

  # Retry failed deliveries:
  python manage.py process_deadline_notifications --retry-failed
"""

from __future__ import annotations

import uuid
from typing import Any

from django.core.management.base import BaseCommand, CommandError

from apps.businesses.models import Business
from apps.calendar.policies import NAMED_POLICIES
from apps.calendar.services import (
    evaluate_and_send_deadline_notifications,
    retry_failed_notifications,
)


class Command(BaseCommand):
    help = "Deterministically process compliance deadline notifications (T-7 Google Calendar, T-1 Calendar + Email, Overdue, and Policies)"

    def add_arguments(self, parser):  # noqa: ANN001
        parser.add_argument(
            "--business-id",
            type=str,
            help="UUID or name substring of a specific business to evaluate.",
        )
        parser.add_argument(
            "--offset",
            type=int,
            default=None,
            help="Simulate specific days remaining offset (7 for T-7, 1 for T-1, etc.).",
        )
        parser.add_argument(
            "--lang",
            type=str,
            default="en",
            choices=["en", "hi", "bn"],
            help="Language for notification content ('en', 'hi', 'bn'). Defaults to 'en'.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate execution without persisting delivery records or sending external notifications.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Bypass idempotency filter (for testing duplicate handling).",
        )
        parser.add_argument(
            "--check-overdue",
            action="store_true",
            help="Explicitly evaluate and alert on overdue compliance deadlines.",
        )
        parser.add_argument(
            "--retry-failed",
            action="store_true",
            help="Retry previously failed notification dispatches.",
        )
        parser.add_argument(
            "--policy",
            type=str,
            default="default",
            choices=list(NAMED_POLICIES.keys()),
            help="Notification policy schedule to apply ('default', 'low', 'medium', 'high', 'critical').",
        )
        parser.add_argument(
            "--with-in-app",
            action="store_true",
            help="Explicitly generate in-app notification records.",
        )

    def _safe_write(self, msg: str, style_func=None) -> None:
        formatted = style_func(msg) if style_func else msg
        try:
            self.stdout.write(formatted)
        except UnicodeEncodeError:
            encoding = getattr(self.stdout, "encoding", None) or "ascii"
            safe_text = formatted.encode(encoding, errors="backslashreplace").decode(encoding)
            self.stdout.write(safe_text)

    def handle(self, *args: Any, **options: Any) -> None:  # noqa: ANN002
        biz_id_arg = options.get("business_id")
        offset = options.get("offset")
        lang = options.get("lang", "en")
        dry_run = options.get("dry_run", False)
        force = options.get("force", False)
        check_overdue = options.get("check_overdue", False)
        retry_failed = options.get("retry_failed", False)
        policy_name = options.get("policy", "default")
        with_in_app = options.get("with_in_app", False)

        businesses = Business.objects.filter(is_active=True)
        if biz_id_arg:
            try:
                biz_uuid = uuid.UUID(str(biz_id_arg))
                businesses = businesses.filter(pk=biz_uuid)
            except (ValueError, TypeError):
                businesses = businesses.filter(name__icontains=biz_id_arg)

            if not businesses.exists():
                raise CommandError(f"No active business found matching '{biz_id_arg}'.")

        # 1. If retry requested
        if retry_failed:
            self._safe_write("Retrying failed notifications...", self.style.NOTICE)
            total_retried = 0
            for biz in businesses:
                res = retry_failed_notifications(business=biz)
                cnt = res.get("total_retried", 0)
                total_retried += cnt
                if cnt:
                    self._safe_write(f"  {biz.name}: retried {cnt} notification(s).", self.style.SUCCESS)
            self._safe_write(f"Retry phase complete. Total retried: {total_retried}.\n", self.style.SUCCESS)

        self._safe_write(
            f"Processing deadline notifications for {businesses.count()} business(es)... "
            f"[Offset: {'Live Date' if offset is None else f'Simulated T-{offset}'}, Policy: {policy_name}, "
            f"Language: {lang}, Overdue Check: {check_overdue}, Dry Run: {dry_run}]",
            self.style.NOTICE,
        )

        total_dispatched = 0
        total_skipped = 0
        upcoming_count = 0
        overdue_count = 0

        for biz in businesses:
            self._safe_write(f"\n--- Enterprise: {biz.name} ({biz.id}) ---")
            result = evaluate_and_send_deadline_notifications(
                business=biz,
                target_offset_days=offset,
                language=lang,
                dry_run=dry_run,
                force=force,
                policy=policy_name,
                check_overdue=check_overdue if check_overdue else None,
                include_in_app=True if with_in_app else None,
            )

            dispatched = result.get("dispatched", [])
            skipped = result.get("skipped_duplicates", [])
            total_dispatched += len(dispatched)
            total_skipped += len(skipped)

            if dispatched:
                for item in dispatched:
                    is_ovd = item.get("event_type") == "OVERDUE"
                    if is_ovd:
                        overdue_count += 1
                        offset_str = f"Overdue +{item['offset_days']}d"
                    else:
                        upcoming_count += 1
                        offset_str = f"T-{item['offset_days']}"

                    self._safe_write(
                        f"  [DISPATCHED] {item['channel']} -> {item['requirement_id']} ({offset_str}) "
                        f"[{item.get('priority', 'MEDIUM')}] to {item.get('user_email', 'User')}: {item.get('subject_or_title')}",
                        self.style.SUCCESS,
                    )
            if skipped:
                for item in skipped:
                    self._safe_write(
                        f"  [IDEMPOTENT SKIP] {item['channel']} -> {item['requirement_id']} (offset {item['offset_days']}): {item['reason']}",
                        self.style.WARNING,
                    )

            if not dispatched and not skipped:
                self._safe_write("  (No deadline matched notification criteria for this execution)", self.style.NOTICE)

        self._safe_write(
            f"\nFinished. Total dispatched: {total_dispatched} (Upcoming: {upcoming_count}, Overdue: {overdue_count}), "
            f"Total skipped (idempotency): {total_skipped}.",
            self.style.SUCCESS,
        )
