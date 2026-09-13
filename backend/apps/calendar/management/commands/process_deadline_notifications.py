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
"""

from __future__ import annotations

import uuid
from typing import Any

from django.core.management.base import BaseCommand, CommandError

from apps.businesses.models import Business
from apps.calendar.services import evaluate_and_send_deadline_notifications


class Command(BaseCommand):
    help = "Deterministically process compliance deadline notifications (T-7 Google Calendar, T-1 Calendar + Email)"

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

        businesses = Business.objects.filter(is_active=True)
        if biz_id_arg:
            try:
                biz_uuid = uuid.UUID(str(biz_id_arg))
                businesses = businesses.filter(pk=biz_uuid)
            except (ValueError, TypeError):
                businesses = businesses.filter(name__icontains=biz_id_arg)

            if not businesses.exists():
                raise CommandError(f"No active business found matching '{biz_id_arg}'.")

        self._safe_write(
            f"Processing deadline notifications for {businesses.count()} business(es)... "
            f"[Offset: {'Live Date' if offset is None else f'Simulated T-{offset}'}, Language: {lang}, Dry Run: {dry_run}]",
            self.style.NOTICE,
        )

        total_dispatched = 0
        total_skipped = 0

        for biz in businesses:
            self._safe_write(f"\n--- Enterprise: {biz.name} ({biz.id}) ---")
            result = evaluate_and_send_deadline_notifications(
                business=biz,
                target_offset_days=offset,
                language=lang,
                dry_run=dry_run,
                force=force,
            )

            dispatched = result.get("dispatched", [])
            skipped = result.get("skipped_duplicates", [])
            total_dispatched += len(dispatched)
            total_skipped += len(skipped)

            if dispatched:
                for item in dispatched:
                    self._safe_write(
                        f"  [DISPATCHED] {item['channel']} -> {item['requirement_id']} (T-{item['offset_days']}) "
                        f"to {item.get('user_email', 'User')}: {item.get('subject_or_title')}",
                        self.style.SUCCESS,
                    )
            if skipped:
                for item in skipped:
                    self._safe_write(
                        f"  [IDEMPOTENT SKIP] {item['channel']} -> {item['requirement_id']} (T-{item['offset_days']}): {item['reason']}",
                        self.style.WARNING,
                    )

            if not dispatched and not skipped:
                self._safe_write("  (No deadline matched notification criteria for this execution)", self.style.NOTICE)

        self._safe_write(
            f"\nFinished. Total dispatched: {total_dispatched}, Total skipped (idempotency): {total_skipped}.",
            self.style.SUCCESS,
        )

