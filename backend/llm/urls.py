from django.urls import path

from . import views


urlpatterns = [
    path(
        "ai/brand/analyze-assets/",
        views.analyze_brand_assets,
        name="ai-brand-analyze-assets",
    ),
    path("ai/brand/extract/", views.extract_brand_voice, name="ai-brand-extract"),
    path("ai/drafts/generate/", views.generate_drafts, name="ai-drafts-generate"),
]
