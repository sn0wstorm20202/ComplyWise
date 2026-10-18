import time
from django.core.management.base import BaseCommand, CommandError
from django.db import close_old_connections, connection
from apps.businesses.jobs import process_next


class Command(BaseCommand):
    help = "Run the durable assessment worker (PostgreSQL required for multiple workers)."

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true")

    def handle(self, *args, **options):
        if connection.vendor != "postgresql" and not options["once"]:
            raise CommandError("Continuous workers require PostgreSQL; use --once for local SQLite tests.")
        while True:
            close_old_connections()
            worked = process_next()
            if options["once"]:
                self.stdout.write("Processed one operation." if worked else "No pending operations.")
                return
            if not worked:
                time.sleep(1)
