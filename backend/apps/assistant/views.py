"""AI Assistant views for Screen 15.

Authority: PRD_v2.0 §24, §P4, §P5; TRD_v2.0 §4, §30, §31.

Thin: retrieval and generation live in `services.answer_question`, which grounds
every answer in evidence fetched from the knowledge base and returns citations even
when no model is configured.

The previous implementation selected one of four pre-written paragraphs by keyword
(`if "food" in prompt.lower()`) and attached whatever evidence happened to match —
or, when nothing matched, the first two records in the table. That produced confident
statements of statutory thresholds and section numbers that no source in the system
supported, under citations that did not relate to the text above them.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import envelope, error_response
from domain.providers import UnknownProvider, get_llm_provider

from .services import answer_question

#: Longest question accepted. Bounds the prompt sent to a metered provider.
MAX_PROMPT_LENGTH = 2000


class AssistantChatView(APIView):
    """Source-grounded regulatory copilot answering questions with statutory citations."""

    # Authenticated: this endpoint spends credits at a metered provider, so it is
    # not left open. It was previously AllowAny.
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        prompt = str(request.data.get("prompt", "") or "").strip()
        if not prompt:
            return error_response(
                "VALIDATION_ERROR", "Prompt is required.", http_status=status.HTTP_400_BAD_REQUEST
            )
        if len(prompt) > MAX_PROMPT_LENGTH:
            return error_response(
                "VALIDATION_ERROR",
                f"Prompt must be at most {MAX_PROMPT_LENGTH} characters.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        business = None
        business_id = request.data.get("business_id")
        if business_id:
            from apps.businesses.models import Business
            business = Business.accessible_to(request.user).filter(pk=business_id).first()

        assessment_id = request.data.get("assessment_id")

        try:
            # Resolve the provider up front: constructing it is side-effect free,
            # but an unrecognised LLM_PROVIDER must fail loudly here rather than
            # only on the (conditional) code path that reaches the network.
            llm = get_llm_provider()
            payload = answer_question(prompt, provider=llm, business=business, assessment_id=assessment_id)
        except UnknownProvider as exc:
            # A misconfigured LLM_PROVIDER is an operator error, not a user error,
            # and is reported as such rather than silently using a default.
            return error_response(
                "PROVIDER_MISCONFIGURED",
                str(exc),
                http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(envelope(payload), status=status.HTTP_200_OK)
