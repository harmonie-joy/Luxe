import json

import requests
from django.conf import settings


class AIProviderError(RuntimeError):
    pass


class MockProvider:
    name = "mock"
    model = "mock"

    def __init__(self, fail=False):
        self.fail = fail

    def generate(self, prompt, schema):
        if self.fail:
            raise AIProviderError("Mock provider failure.")

        return schema.model_validate(MOCK_RESULTS[schema.__name__])


class OllamaProvider:
    name = "ollama"

    def __init__(self, base_url=None, model=None, timeout=60):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = timeout

    def generate(self, prompt, schema):
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": (
                    f"{prompt}\n\nReturn only JSON matching this schema: "
                    f"{schema.model_json_schema()}"
                ),
                "stream": False,
                "format": "json",
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        try:
            raw = response.json()["response"]
            data = json.loads(raw) if isinstance(raw, str) else raw
        except (KeyError, TypeError, json.JSONDecodeError) as error:
            raise AIProviderError("Ollama returned an invalid JSON response.") from error
        return schema.model_validate(data)


def get_provider():
    if settings.AI_PROVIDER.lower() == "ollama":
        return OllamaProvider()
    return MockProvider()


MOCK_RESULTS: dict[str, dict] = {
    "BrandVoiceExtractionResult": {
        "audience": "Founders and brand teams seeking polished content.",
        "tone": ["professional", "sophisticated"],
        "preferred_vocabulary": [
            {
                "preferred_term": "clientele",
                "restricted_terms": ["customers"],
                "note": "Use elevated brand language.",
            }
        ],
        "banned_phrases": [
            {
                "phrase": "go viral",
                "reason": "Conflicts with restrained positioning.",
            }
        ],
        "positioning_notes": "Quiet authority with practical clarity.",
    },
    "DraftGenerationResult": {
        "title": "A considered launch note",
        "content": "Introduce the announcement with a calm, editorial point of view.",
        "channel": "linkedin",
        "rationale": "Matches the requested channel and restrained tone.",
    },
    "VoiceReviewResult": {
        "status": "green",
        "summary": "The draft fits the configured voice.",
        "strengths": ["Clear audience fit", "Consistent vocabulary"],
        "issues": [],
        "suggested_revisions": [],
    },
    "ComplianceReviewResult": {
        "status": "yellow",
        "summary": "One claim should be qualified before approval.",
        "issues": [
            {
                "title": "Unqualified performance claim",
                "category": "claims",
                "severity": "medium",
                "explanation": "The draft implies an outcome without evidence.",
                "suggested_fix": "Qualify the claim or add support.",
            }
        ],
    },
}
