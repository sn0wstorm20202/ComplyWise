"""Management command to validate and load knowledge packs into the database.

Authority: TRD_v2.0 §27; PRD_v2.0 §1; Task 2 C12 Audit Corrections.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.knowledge.loader import KnowledgePackLoader, KnowledgePackLoaderError


class Command(BaseCommand):
    help = "Validate and load JSON knowledge packs into the database."

    def add_arguments(self, parser) -> None:  # noqa: ANN001
        parser.add_argument(
            "--dir",
            type=str,
            default=None,
            help="Path to specific knowledge pack directory or parent directory (defaults to KNOWLEDGE_PACKS_DIR).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate packs without writing to database.",
        )
        parser.add_argument(
            "--strict",
            action="store_true",
            help="Fail fast and exit non-zero on any validation error.",
        )
        parser.add_argument(
            "--force-status",
            action="store_true",
            help="Override human reviewer statuses with declared pack statuses.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        target_dir = Path(options["dir"]).resolve() if options.get("dir") else settings.KNOWLEDGE_PACKS_DIR
        dry_run = bool(options.get("dry_run"))
        strict = bool(options.get("strict"))
        force_status = bool(options.get("force_status"))

        if not target_dir.exists():
            raise CommandError(f"Target knowledge pack directory does not exist: '{target_dir}'.")

        self.stdout.write(
            f"Loading knowledge packs from '{target_dir}' "
            f"(dry_run={dry_run}, strict={strict}, force_status={force_status})..."
        )

        loader = KnowledgePackLoader(target_dir)

        try:
            # Check if target_dir is a single pack directory
            pack_files = ("rules.json", "requirements.json", "sources.json", "evidence.json")
            is_single_pack = any((target_dir / f).exists() for f in pack_files)
            if is_single_pack:
                counts = loader.load_pack_from_dir(
                    target_dir,
                    force_status=force_status,
                    dry_run=dry_run,
                )
                counts["packs_loaded"] = 1
            else:
                counts = loader.load_all_packs(
                    force_status=force_status,
                    dry_run=dry_run,
                )

            mode_str = "[DRY-RUN] " if dry_run else ""
            self.stdout.write(
                self.style.SUCCESS(
                    f"{mode_str}Knowledge pack processing complete: "
                    f"{counts.get('packs_loaded', 1)} packs, "
                    f"{counts['sources']} sources, "
                    f"{counts['evidence']} evidence, "
                    f"{counts['requirements']} requirements, "
                    f"{counts['rules']} rules."
                )
            )

        except KnowledgePackLoaderError as exc:
            self.stderr.write(self.style.ERROR(f"Knowledge pack validation failed: {exc}"))
            raise CommandError(str(exc)) from exc
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Unexpected error loading knowledge packs: {exc}"))
            raise CommandError(str(exc)) from exc
