"""Django management command to execute the Central & Maharashtra Schemes Ingestion Pipeline.

Usage:
  python manage.py run_schemes_pipeline [--force] [--source-key KEY]
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from apps.schemes.pipeline.service import SchemePipelineService


class Command(BaseCommand):
    help = "Ingest, normalize, hash, and version Central and Maharashtra Government schemes."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force reprocessing even if snapshot content hash is unchanged",
        )
        parser.add_argument(
            "--source-key",
            type=str,
            default=None,
            help="Specific source to run (CENTRAL_MSME, MSME_CHAMPIONS, DPIIT_OFFERINGS, MAHARASHTRA_MCED)",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting Government Schemes Ingestion Pipeline..."))
        service = SchemePipelineService()
        source_keys = [options["source_key"]] if options["source_key"] else None
        force = options["force"]

        result = service.run_pipeline(source_keys=source_keys, force=force)

        self.stdout.write(self.style.SUCCESS(
            f"Pipeline completed: {result['total_new_schemes']} new schemes, "
            f"{result['total_updated_versions']} updated versions, "
            f"{result['total_unchanged_schemes']} unchanged schemes."
        ))

        for k, v in result["sources_details"].items():
            self.stdout.write(f"  - [{k}] Status: {v['status']} | Schemes: {v['scheme_count']}")
