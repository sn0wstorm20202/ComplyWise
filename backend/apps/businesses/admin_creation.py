"""Explicit platform-admin creation; never returns or assigns login tokens."""
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.serializers import RegisterSerializer
from common.envelope import envelope
from .models import Business, BusinessMembership, BusinessProfileVersion
from .serializers import BusinessProfileVersionCreateSerializer, BusinessSerializer


class IsPlatformAdministrator(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class AdminBusinessCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200, trim_whitespace=True)
    owner_email = serializers.EmailField()
    new_user = RegisterSerializer(required=False)
    profile = BusinessProfileVersionCreateSerializer()


class AdminBusinessCreateView(APIView):
    permission_classes = [IsPlatformAdministrator]

    @transaction.atomic
    def post(self, request):
        serializer = AdminBusinessCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        owner = get_user_model().objects.filter(email__iexact=data["owner_email"], is_active=True).first()
        if owner is None:
            registration = data.get("new_user")
            if not registration or registration["email"].casefold() != data["owner_email"].casefold():
                raise serializers.ValidationError({"owner_email": "Choose an existing account or supply matching new-user credentials."})
            owner = RegisterSerializer().create(registration)
        elif data.get("new_user"):
            raise serializers.ValidationError({"owner_email": "The user already exists. Please sign in."})
        business = Business.objects.create(name=data["name"], owner=owner)
        BusinessMembership.objects.create(business=business, user=owner, role=BusinessMembership.Role.OWNER)
        profile = data["profile"]
        BusinessProfileVersion.create_next(business=business, variables=profile["variables"],
            created_by=request.user, change_note="Profile created by platform administrator", carry_forward=False)
        return Response(envelope(BusinessSerializer(business).data), status=status.HTTP_201_CREATED)
