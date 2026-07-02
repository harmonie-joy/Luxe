from django.contrib.auth import get_user_model
from rest_framework import serializers

from tenancy.models import Membership


User = get_user_model()


class AuthSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    display_name = serializers.CharField(max_length=150, required=False, allow_blank=True)


class AuthLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class AuthProfileUpdateSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=150)


def serialize_session(user):
    memberships = (
        Membership.objects.select_related("workspace")
        .filter(user=user)
        .order_by("workspace__name")
    )
    workspaces = [
        {
            "id": str(membership.workspace_id),
            "name": membership.workspace.name,
            "role": membership.role,
        }
        for membership in memberships
    ]

    return {
        "user": {
            "id": str(user.id),
            "username": user.get_username(),
            "email": user.email,
            "displayName": user.get_full_name() or user.get_username(),
        },
        "workspaces": workspaces,
        "activeWorkspaceId": workspaces[0]["id"] if workspaces else None,
    }
