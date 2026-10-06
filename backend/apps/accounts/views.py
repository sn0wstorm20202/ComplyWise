"""Authentication endpoints — TRD_v2.0 §31.

    POST /api/v1/auth/register
    POST /api/v1/auth/login
    POST /api/v1/auth/logout
    GET  /api/v1/auth/me

Token authentication keeps the hackathon setup simple while remaining a real
credential: the token is issued server-side and never appears in a URL.
"""

from __future__ import annotations

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.enums import AdminRole
from common.envelope import error_response

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


def _auth_payload(user, token: Token) -> dict:
    return {"user": UserSerializer(user).data, "token": token.key}


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(_auth_payload(user, token), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        # A session is also established so the browsable API and admin work.
        django_login(request, user)
        return Response(_auth_payload(user, token))


class AdminLoginView(APIView):
    """Dedicated login endpoint strictly for compliance officers and platform administrators."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if not user.is_compliance_officer:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": "Access denied: Compliance Officer or Administrator credentials required."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)
        django_login(request, user)
        return Response(_auth_payload(user, token), status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        django_logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class DemoReviewerCredentialsView(APIView):
    """Opt-in autofill of a dedicated demo reviewer, without issuing a session.

    Enabling this endpoint deliberately makes ONLY these demo credentials public.
    A supplied admin account additionally requires explicit privileged-demo opt-in.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        if not settings.DEMO_REVIEWER_AUTOFILL_ENABLED:
            response = error_response("DEMO_DISABLED", "Demo reviewer access is not enabled.", 403)
        elif not settings.DEMO_REVIEWER_EMAIL or not settings.DEMO_REVIEWER_PASSWORD:
            response = error_response("DEMO_NOT_CONFIGURED", "Demo reviewer credentials are not configured.", 503)
        else:
            user = get_user_model().objects.filter(email__iexact=settings.DEMO_REVIEWER_EMAIL).first()
            eligible = bool(user and user.is_active and user.is_compliance_officer)
            if user and not settings.DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT:
                eligible = eligible and not user.is_staff and not user.is_superuser and user.role == AdminRole.COMPLIANCE_OFFICER
            if not eligible or not user.check_password(settings.DEMO_REVIEWER_PASSWORD):
                response = error_response("DEMO_NOT_CONFIGURED", "The configured demo reviewer account is unavailable.", 503)
            else:
                response = Response({"email": user.email, "password": settings.DEMO_REVIEWER_PASSWORD})
        response["Cache-Control"] = "no-store, private"
        response["Pragma"] = "no-cache"
        return response

