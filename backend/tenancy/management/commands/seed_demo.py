from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from brand.models import BrandProfile
from tenancy.models import Membership, Workspace


class Command(BaseCommand):
    help = "Seed a local demo user, workspace, membership, and brand profile."

    def add_arguments(self, parser):
        parser.add_argument("--reset-password", action="store_true")

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        user, created_user = User.objects.get_or_create(
            email="demo@theluxe.local",
            defaults={
                "username": "demo",
                "first_name": "THE LUXE",
                "last_name": "Demo",
            },
        )
        if created_user or options["reset_password"]:
            user.set_password("theluxe-demo")
            user.save()

        workspace, _created_workspace = Workspace.objects.get_or_create(
            name="THE LUXE Demo Workspace",
            defaults={"created_by": user},
        )
        Membership.objects.get_or_create(
            user=user,
            workspace=workspace,
            defaults={"role": Membership.Role.OWNER},
        )
        BrandProfile.objects.get_or_create(
            workspace=workspace,
            name="Private Client Services",
            defaults={
                "audience": "Founders, creators, and boutique teams preparing premium content.",
                "tone": [
                    BrandProfile.ToneValue.AUTHORITATIVE,
                    BrandProfile.ToneValue.SOPHISTICATED,
                ],
                "preferred_vocabulary": [
                    {
                        "id": "craft",
                        "preferred_term": "craft",
                        "restricted_terms": ["hack"],
                        "note": "Keep positioning premium and intentional.",
                    }
                ],
                "banned_phrases": [
                    {
                        "id": "viral",
                        "phrase": "guaranteed viral",
                        "reason": "Avoid unverifiable performance claims.",
                    }
                ],
                "positioning_notes": "Protect brand voice while preparing review-ready content.",
            },
        )

        self.stdout.write(
            self.style.SUCCESS("Seeded demo login: demo@theluxe.local / theluxe-demo")
        )
