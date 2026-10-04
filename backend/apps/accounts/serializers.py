"""Serializers for the authentication foundation."""

from __future__ import annotations

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

import re

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public shape of the authenticated user. Never includes the password."""

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone_number", "is_staff", "is_superuser", "role", "is_compliance_officer", "date_joined"]
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=32, default="")

    def validate_email(self, value: str) -> str:
        normalised = value.strip().lower()
        if User.objects.filter(email__iexact=normalised).exists():
            raise serializers.ValidationError("The user already exists. Please sign in.")
        return normalised

    def validate_password(self, value: str) -> str:
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def validate_phone_number(self, value: str) -> str:
        clean = (value or "").strip()
        if not clean:
            return ""
        digits = re.sub(r"\D", "", clean)
        if len(digits) < 7 or len(digits) > 15:
            raise serializers.ValidationError("Enter a valid phone number (7 to 15 digits).")
        return clean

    def create(self, validated_data: dict) -> User:
        from django.db import IntegrityError, transaction
        try:
            with transaction.atomic():
                return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data.get("full_name", ""),
            phone_number=validated_data.get("phone_number", ""),
        )
        except IntegrityError:
            raise serializers.ValidationError({"email": "The user already exists. Please sign in."}) from None



class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict) -> dict:
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].strip().lower(),
            password=attrs["password"],
        )
        if user is None:
            # Deliberately generic: do not disclose whether the account exists.
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        attrs["user"] = user
        return attrs
