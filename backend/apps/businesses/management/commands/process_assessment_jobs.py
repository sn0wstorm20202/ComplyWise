import os
import signal
import socket
import logging
from threading import Event, Thread
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import close_old_connections, connection
from django.utils import timezone
from apps.businesses.jobs import process_next
from apps.businesses.models import AssessmentWorkerHeartbeat


class Command(BaseCommand):
    help = "Run the durable assessment worker (PostgreSQL required for multiple workers)."

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true")
        parser.add_argument("--poll-interval", type=float, default=2)

    def handle(self, *args, **options):
        if connection.vendor != "postgresql" and not options["once"]:
            raise CommandError("Continuous workers require PostgreSQL; use --once for local SQLite tests.")
        if options["poll_interval"] <= 0:
            raise CommandError("poll-interval must be positive.")
        if options["once"]:
            worked = process_next()
            self.stdout.write("Processed one operation." if worked else "No pending operations.")
            return
        stopped = Event()
        worker_id = f"{socket.gethostname()}:{os.getpid()}"[:120]
        def heartbeat():
            try:
                while not stopped.is_set():
                    try:
                        close_old_connections()
                        AssessmentWorkerHeartbeat.objects.update_or_create(worker_id=worker_id,
                            defaults={"release": settings.COMPLYWISE_VERSION, "seen_at": timezone.now()})
                    except Exception as exc:
                        logging.getLogger(__name__).error("worker_heartbeat_failed error_type=%s", type(exc).__name__)
                    stopped.wait(15)
            finally:
                connection.close()
        previous = {s: signal.getsignal(s) for s in (signal.SIGTERM, signal.SIGINT)}
        for s in previous:
            signal.signal(s, lambda *_: stopped.set())
        thread = Thread(target=heartbeat, daemon=True)
        thread.start()
        self.stdout.write(f"Assessment worker running; release={settings.COMPLYWISE_VERSION}")
        try:
            while not stopped.is_set():
                try:
                    close_old_connections()
                    worked = process_next()
                    if not worked:
                        stopped.wait(options["poll_interval"])
                except Exception as exc:
                    logging.getLogger(__name__).error("worker_iteration_failed error_type=%s", type(exc).__name__)
                    stopped.wait(5)
        finally:
            stopped.set()
            thread.join(timeout=5)
            AssessmentWorkerHeartbeat.objects.filter(worker_id=worker_id).delete()
            for s, handler in previous.items():
                signal.signal(s, handler)
            connection.close()
