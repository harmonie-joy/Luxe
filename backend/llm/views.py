from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from content.models import ContentDraft

from .serializers import (
    BrandVoiceExtractionRequestSerializer,
    DraftGenerationRequestSerializer,
)
from .services import extract_brand_voice_with_run, generate_draft_with_run


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def extract_brand_voice(request):
    serializer = BrandVoiceExtractionRequestSerializer(
        data=request.data,
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)

    assets = serializer.validated_data["assets"]
    suggestions, run = extract_brand_voice_with_run(
        serializer.validated_data["workspace"],
        assets,
        user=request.user,
    )

    return Response(
        {
            "aiRunId": str(run.id),
            "suggestions": suggestions.model_dump(mode="json"),
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
        result, run = generate_draft_with_run(
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
