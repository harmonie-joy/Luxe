"""Real test database lifecycle and independent persisted-state assertions. No HTTP mocks."""

import json
import os
from pathlib import Path
import sys
import uuid

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
os.environ["DJANGO_SETTINGS_MODULE"] = "config.e2e_settings"

import django

django.setup()  # validates the isolated database guard before every operation

from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.management import call_command
from django.db import connection, transaction
from brand.models import BrandProfile, BrandVoice, BrandVoiceApproval
from content.models import ContentItem, ExecutionCheckpoint, Project
from tenancy.models import Membership, Workspace

User = get_user_model()
action = sys.argv[1]
if action == "guard":
    sys.exit()  # settings guard succeeded; no database connection was opened
if action == "serve":
    call_command("migrate", interactive=False)
    call_command("runserver", "127.0.0.1:8154", use_reloader=False)
    sys.exit()

namespace = uuid.UUID(sys.argv[2])
prefix = f"e2e54-{namespace}"


def users():
    return User.objects.filter(username__in=[f"{prefix}-a", f"{prefix}-b"])


def workspaces():
    return Workspace.objects.filter(created_by__in=users(), name__startswith=prefix)


if action == "seed":
    with transaction.atomic():
        result = {}
        password = sys.stdin.read().strip()
        if not password:
            raise ValueError("Synthetic password must be provided on stdin")
        for role in ("a", "b"):
            username = f"{prefix}-{role}"
            user = User.objects.create_user(username=username, email=f"{username}@example.invalid", password=password, first_name=f"Creator {role.upper()}")
            workspace = Workspace.objects.create(name=f"{prefix} Workspace {role.upper()}", created_by=user)
            Membership.objects.create(user=user, workspace=workspace, role=Membership.Role.OWNER)
            profile = BrandProfile.objects.create(workspace=workspace, name=f"Editorial {role.upper()}")
            voice = BrandVoice.objects.create(brand_profile=profile, version=2, is_active=True, voice_summary=f"Synthetic editorial voice {role.upper()}; use specific evidence.")
            replacement = BrandVoice.objects.create(brand_profile=profile, version=3)
            result[role] = {"userId": user.pk, "email": user.email, "displayName": user.first_name, "workspaceId": workspace.pk, "workspaceName": workspace.name, "profileId": str(profile.pk), "voiceId": str(voice.pk), "replacementVoiceId": str(replacement.pk)}
        print(json.dumps(result))
elif action == "read":
    items = ContentItem.objects.filter(project__workspace__in=workspaces())
    print(json.dumps({
        "postgresVersion": connection.pg_version,
        "items": list(items.values("id", "project_id", "project__workspace_id", "brand_voice_id", "title", "goal", "workflow_stage", "next_action", "decisions", "open_questions", "revision")),
        "checkpoints": list(ExecutionCheckpoint.objects.filter(content_item__in=items).order_by("revision").values("id", "content_item_id", "revision", "goal", "workflow_stage", "next_action", "decisions", "open_questions")),
        "approvals": list(BrandVoiceApproval.objects.filter(workspace__in=workspaces()).values("voice_id", "workspace_id", "approved_by_id")),
    }, default=str))
elif action == "cleanup":
    with transaction.atomic():
        user_ids = {str(pk) for pk in users().values_list("pk", flat=True)}
        # Only sessions belonging to this run's synthetic users are removed.
        for session in Session.objects.all():
            if session.get_decoded().get("_auth_user_id") in user_ids:
                session.delete()
        ContentItem.objects.filter(project__workspace__in=workspaces()).delete()
        Project.objects.filter(workspace__in=workspaces()).delete()
        workspaces().delete()
        users().delete()
else:
    raise ValueError("Unknown test fixture operation")
