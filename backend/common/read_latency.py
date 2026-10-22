"""Bounded, credential-free read timing logs for aggregation by the host."""
import json
import logging
import time
import uuid
from django.conf import settings

logger = logging.getLogger("complywise.read_latency")


class ReadLatencyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        started = time.perf_counter()
        response = self.get_response(request)
        match = getattr(request, "resolver_match", None)
        if request.method == "GET" and match and request.path.startswith("/api/v1/"):
            duration = round((time.perf_counter() - started) * 1000, 1)
            request_id = str(uuid.uuid4())
            response["Server-Timing"] = f"app;dur={duration}"
            response["X-Request-ID"] = request_id
            logger.info(json.dumps({"event": "api_read", "route": match.route,
                "status": response.status_code, "duration_ms": duration,
                "request_id": request_id, "release": settings.COMPLYWISE_VERSION}))
        return response
