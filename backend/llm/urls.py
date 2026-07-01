from django.urls import path

from . import views


urlpatterns = [
    path("ai/brand/extract/", views.extract_brand_voice, name="ai-brand-extract"),
]
