from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import IntegrityError, transaction
from django.utils.text import slugify
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from tenancy.models import Membership, Workspace
from tenancy.serializers import (
    AuthLoginSerializer,
    AuthProfileUpdateSerializer,
    AuthSignupSerializer,
    serialize_session,
)


User = get_user_model()


def _username_from_email(email):
    base = slugify(email.split("@", 1)[0]) or "user"
    username = base
    counter = 2
    while User.objects.filter(username=username).exists():
        username = f"{base}-{counter}"
        counter += 1
    return username


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf(_request):
    return Response({"detail": "CSRF cookie set."})


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    serializer = AuthSignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"].lower()
    password = serializer.validated_data["password"]
    display_name = serializer.validated_data.get("display_name", "").strip()

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"detail": "An account with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=_username_from_email(email),
                email=email,
                password=password,
            )
            if display_name:
                parts = display_name.split(" ", 1)
                user.first_name = parts[0]
                user.last_name = parts[1] if len(parts) > 1 else ""
                user.save(update_fields=["first_name", "last_name"])
    except IntegrityError:
        return Response(
            {"detail": "An account with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    return Response(serialize_session(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = AuthLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"].lower()
    password = serializer.validated_data["password"]
    user = User.objects.filter(email__iexact=email).first()
    authenticated = authenticate(
        request,
        username=user.get_username() if user else email,
        password=password,
    )

    if authenticated is None:
        return Response(
            {"detail": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    login(request, authenticated)
    return Response(serialize_session(authenticated))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == "PATCH":
        serializer = AuthProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parts = serializer.validated_data["display_name"].split(" ", 1)
        request.user.first_name = parts[0]
        request.user.last_name = parts[1] if len(parts) > 1 else ""
        request.user.save(update_fields=["first_name", "last_name"])
    return Response(serialize_session(request.user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bootstrap_workspace(request):
    membership = (
        Membership.objects.select_related("workspace")
        .filter(user=request.user)
        .order_by("workspace__name")
        .first()
    )
    if membership is None:
        display_name = request.user.get_full_name() or request.user.get_username()
        workspace = Workspace.objects.create(
            name=f"{display_name}'s Workspace",
            created_by=request.user,
        )
        Membership.objects.create(
            user=request.user,
            workspace=workspace,
            role=Membership.Role.OWNER,
        )

    return Response(serialize_session(request.user))
