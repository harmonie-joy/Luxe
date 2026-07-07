from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from brand.models import BrandAsset
from brand.serializers import BrandAssetSerializer
from content.models import ContentDraft

from . import services
from .serializers import (
    BrandVoiceExtractionRequestSerializer,
    DraftGenerationRequestSerializer,
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def extract_brand_voice(request):
    serializer = BrandVoiceExtractionRequestSerializer(
        data=request.data,
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)

    suggestions, voice, run = services.extract_brand_voice(
        serializer.validated_data["workspace"],
        serializer.validated_data["brand_profile"],
        assets=serializer.validated_data["assets"],
        user=request.user,
    )

    return Response(
        {
            "aiRunId": str(run.id),
            "voice": {
                "id": str(voice.id),
                "version": voice.version,
                "isActive": voice.is_active,
            },
            "suggestions": suggestions.model_dump(mode="json"),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def analyze_brand_assets(request):
    serializer = BrandVoiceExtractionRequestSerializer(
        data=request.data,
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)

    workspace = serializer.validated_data["workspace"]
    brand_profile = serializer.validated_data["brand_profile"]
    assets = serializer.validated_data["assets"]
    ai_run_ids = []
    warnings = []

    for asset in assets:
        try:
            _result, run = services.analyze_brand_asset(
                workspace,
                brand_profile,
                asset,
                user=request.user,
            )
            ai_run_ids.append(str(run.id))
        except Exception as error:
            if asset.media_type != BrandAsset.MediaType.IMAGE:
                raise
            warnings.append(
                {
                    "assetId": str(asset.id),
                    "message": f"Image analysis skipped: {error}",
                }
            )

    return Response(
        {
            "aiRunIds": ai_run_ids,
            "assets": BrandAssetSerializer(assets, many=True).data,
            "warnings": warnings,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_drafts(request):
    serializer = DraftGenerationRequestSerializer(
        data=request.data,
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)

    workspace = serializer.validated_data["workspace"]
    brief = serializer.validated_data["brief"]
    ai_run_ids = []
    drafts = []

    for channel in serializer.validated_data["channels"]:
        result, run = services.generate_draft(
            workspace,
            brief,
            channel,
            user=request.user,
        )
        draft, created = ContentDraft.objects.get_or_create(
            brief=brief,
            channel=channel,
            defaults={
                "created_by": request.user,
                "title": result.title,
                "content": result.content,
                "status": ContentDraft.DraftStatus.DRAFT,
            },
        )
        if not created:
            draft.title = result.title
            draft.content = result.content
            draft.status = ContentDraft.DraftStatus.DRAFT
            draft.save(update_fields=["title", "content", "status", "updated_at"])
        ai_run_ids.append(str(run.id))
        drafts.append(_draft_response(draft))

    return Response({"aiRunIds": ai_run_ids, "drafts": drafts})


def _draft_response(draft):
    return {
        "id": str(draft.id),
        "brief": str(draft.brief_id),
        "channel": draft.channel,
        "title": draft.title,
        "content": draft.content,
        "status": draft.status,
    }
