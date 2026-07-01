from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import BrandVoiceExtractionRequestSerializer
from .services import extract_brand_voice_with_run


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def extract_brand_voice(request):
    serializer = BrandVoiceExtractionRequestSerializer(
        data=request.data,
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)

    assets = serializer.validated_data["assets"]
    sample_text = "\n\n".join(asset.content for asset in assets)
    suggestions, run = extract_brand_voice_with_run(
        serializer.validated_data["workspace"],
        sample_text,
        user=request.user,
    )

    return Response(
        {
            "aiRunId": str(run.id),
            "suggestions": suggestions.model_dump(mode="json"),
        }
    )
