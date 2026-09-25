"""Management command to seed default workflow templates."""

from django.core.management.base import BaseCommand
from apps.workflows.seed import ensure_default_workflow_definition


class Command(BaseCommand):
    help = "Seeds the default regulatory workflow templates into the database."

    def handle(self, *args, **options):
        version = ensure_default_workflow_definition()
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully initialized default workflow: {version.workflow_definition.code} v{version.version_number}"
            )
        )
