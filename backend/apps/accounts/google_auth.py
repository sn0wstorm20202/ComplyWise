"""Google authorization-code sign-in with PKCE and a single-use browser handoff."""
from __future__ import annotations

import base64
import hashlib
import json
import logging
import re
import secrets
import urllib.request
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.envelope import error_response
from .models import GoogleIdentity, GoogleLoginAttempt
from .views import _auth_payload
from rest_framework.authtoken.models import Token

logger = logging.getLogger(__name__)


def verification_failure_reason(exc):
    """Classify failures without logging claims, tokens, codes or exception bodies."""
    message = str(exc)
    if message.startswith("Token used too early"):
        return "clock_skew"
    if message.startswith("Token expired"):
        return "expired_token"
    if message == "Invalid nonce.":
        return "nonce_mismatch"
    if "existing email and password" in message:
        return "existing_account"
    return "invalid_claims"


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def challenge(value):
    return base64.urlsafe_b64encode(hashlib.sha256(value.encode()).digest()).rstrip(b"=").decode()


def exchange_google_code(code, verifier):
    from google.auth.transport.requests import Request
    from google.oauth2.id_token import verify_oauth2_token

    body = urlencode({"code": code, "client_id": settings.GOOGLE_AUTH_CLIENT_ID,
        "client_secret": settings.GOOGLE_AUTH_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_AUTH_REDIRECT_URI,
        "grant_type": "authorization_code", "code_verifier": verifier}).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=15) as response:
        payload = json.load(response)
    # Signature, issuer, audience and expiry are checked by Google's maintained library.
    # Newly issued tokens can be a few seconds ahead of the host clock. Keep
    # signature/issuer/audience/expiry checks, with a small bounded time tolerance.
    return verify_oauth2_token(payload["id_token"], Request(), settings.GOOGLE_AUTH_CLIENT_ID,
                              clock_skew_in_seconds=30)


@transaction.atomic
def resolve_google_user(claims):
    if claims.get("email_verified") is not True or not claims.get("sub") or not claims.get("email"):
        raise ValueError("Google must supply a verified email address.")
    User = get_user_model()
    identity = GoogleIdentity.objects.select_related("user").filter(subject=claims["sub"]).first()
    if identity:
        if not identity.user.is_active:
            raise ValueError("This account is inactive.")
        return identity.user, False
    email = claims["email"].strip().lower()
    user = User.objects.filter(email__iexact=email).first()
    created = user is None
    # Google is authoritative for Gmail and verified Workspace domains. For other
    # domains, verification alone cannot safely link a pre-existing password account.
    if user and not (email.endswith("@gmail.com") or claims.get("hd")):
        raise ValueError("Please sign in with your existing email and password.")
    if not user:
        try:
            with transaction.atomic():
                user = User.objects.create_user(email=email, password=None,
                    full_name=str(claims.get("name") or "")[:150])
        except IntegrityError:
            user = User.objects.get(email__iexact=email)
            created = False
            if not (email.endswith("@gmail.com") or claims.get("hd")):
                raise ValueError("Please sign in with your existing email and password.") from None
    if not user.is_active:
        raise ValueError("This account is inactive.")
    GoogleIdentity.objects.get_or_create(subject=claims["sub"], defaults={"user": user})
    return user, created


class GoogleStartView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        if not settings.GOOGLE_AUTH_CLIENT_ID or not settings.GOOGLE_AUTH_CLIENT_SECRET:
            return HttpResponseRedirect(settings.GOOGLE_AUTH_FRONTEND_CALLBACK_URL + "?error=not_configured")
        handoff = request.query_params.get("handoff_challenge", "")
        if not re.fullmatch(r"[A-Za-z0-9_-]{43}", handoff):
            return error_response("VALIDATION_ERROR", "Start Google sign-in from the application.", 400)
        state, nonce, verifier = (secrets.token_urlsafe(32) for _ in range(3))
        GoogleLoginAttempt.objects.create(state_digest=digest(state), nonce=nonce,
            code_verifier=verifier, handoff_challenge=handoff,
            expires_at=timezone.now() + timedelta(minutes=10))
        params = {"client_id": settings.GOOGLE_AUTH_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_AUTH_REDIRECT_URI, "response_type": "code",
            "scope": "openid email profile", "state": state, "nonce": nonce,
            "code_challenge": challenge(verifier), "code_challenge_method": "S256", "prompt": "select_account"}
        response = HttpResponseRedirect("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params))
        response.set_cookie("cw_google_state", state, max_age=600, httponly=True,
            secure=not settings.DEBUG, samesite="Lax", path="/api/v1/auth/google/")
        response["Cache-Control"] = "no-store"
        return response


class GoogleCallbackView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        state = request.query_params.get("state", "")
        cookie = request.COOKIES.get("cw_google_state", "")
        target = settings.GOOGLE_AUTH_FRONTEND_CALLBACK_URL
        error = "cancelled" if request.query_params.get("error") else "verification_failed"
        if state and cookie and secrets.compare_digest(state, cookie):
            with transaction.atomic():
                attempt = GoogleLoginAttempt.objects.select_for_update().filter(
                    state_digest=digest(state), expires_at__gt=timezone.now(), callback_used_at__isnull=True).first()
                if attempt:
                    attempt.callback_used_at = timezone.now()
                    attempt.save(update_fields=["callback_used_at"])
            if not attempt:
                logger.warning("Google sign-in rejected: stage=callback_binding reason=expired_or_used_attempt")
            if attempt and request.query_params.get("code") and not request.query_params.get("error"):
                stage = "token_verification"
                try:
                    claims = exchange_google_code(request.query_params["code"], attempt.code_verifier)
                    stage = "nonce_verification"
                    if not secrets.compare_digest(str(claims.get("nonce", "")), attempt.nonce):
                        raise ValueError("Invalid nonce.")
                    stage = "account_resolution"
                    user, created = resolve_google_user(claims)
                    stage = "handoff_creation"
                    ticket = secrets.token_urlsafe(32)
                    attempt.user = user
                    attempt.is_new_user = created
                    attempt.ticket_digest = digest(ticket)
                    attempt.expires_at = timezone.now() + timedelta(seconds=60)
                    attempt.code_verifier = ""
                    attempt.save()
                    response = HttpResponseRedirect(target + "#ticket=" + ticket)
                    response.delete_cookie("cw_google_state", path="/api/v1/auth/google/")
                    response["Referrer-Policy"] = "no-referrer"
                    response["Cache-Control"] = "no-store"
                    return response
                except ValueError as exc:
                    logger.warning("Google sign-in rejected: stage=%s reason=%s", stage,
                                   verification_failure_reason(exc))
                    error = "existing_account" if "existing email" in str(exc) else "verification_failed"
                except Exception as exc:
                    logger.warning("Google sign-in failed: stage=%s exception_type=%s", stage, type(exc).__name__)
                    error = "provider_unavailable"
        elif not request.query_params.get("error"):
            reason = "missing_state_cookie" if not cookie else "state_mismatch"
            logger.warning("Google sign-in rejected: stage=callback_binding reason=%s", reason)
        response = HttpResponseRedirect(target + "?error=" + error)
        response.delete_cookie("cw_google_state", path="/api/v1/auth/google/")
        response["Cache-Control"] = "no-store"
        response["Referrer-Policy"] = "no-referrer"
        return response


class GoogleExchangeView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        ticket, verifier = request.data.get("ticket", ""), request.data.get("verifier", "")
        if not isinstance(ticket, str) or not isinstance(verifier, str) or len(ticket) > 128 or len(verifier) > 128:
            return error_response("VALIDATION_ERROR", "Invalid sign-in handoff.", 400)
        # Lock the handoff itself; its nullable user FK produces an outer join,
        # whose nullable side PostgreSQL cannot lock with plain FOR UPDATE.
        attempt = GoogleLoginAttempt.objects.select_for_update(of=("self",)).select_related("user").filter(
            ticket_digest=digest(ticket), ticket_used_at__isnull=True, expires_at__gt=timezone.now()).first()
        if not attempt or not attempt.user or not secrets.compare_digest(challenge(verifier), attempt.handoff_challenge):
            return error_response("AUTHENTICATION_FAILED", "Google sign-in expired. Please try again.", 401)
        if not attempt.user.is_active:
            return error_response("AUTHENTICATION_FAILED", "This account is inactive.", 401)
        attempt.ticket_used_at = timezone.now()
        attempt.save(update_fields=["ticket_used_at"])
        token, _ = Token.objects.get_or_create(user=attempt.user)
        return Response({**_auth_payload(attempt.user, token), "is_new_user": attempt.is_new_user})
