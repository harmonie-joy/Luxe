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

    def generate(self, prompt, schema, images=None):
        if self.fail:
            raise AIProviderError("Mock provider failure.")

        return schema.model_validate(MOCK_RESULTS[schema.__name__])


class OllamaProvider:
    name = "ollama"

    def __init__(self, base_url=None, model=None, timeout=60):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = timeout
        if not self.model:
            raise AIProviderError("OLLAMA_MODEL must be set when AI_PROVIDER=ollama.")

    def generate(self, prompt, schema, images=None):
        payload = {
            "model": self.model,
            "prompt": f"{prompt}\n\nReturn only the JSON data object.",
            "stream": False,
            "format": schema.model_json_schema(),
            "options": {"num_predict": settings.OLLAMA_NUM_PREDICT},
        }
        if images:
            payload["images"] = images

        response = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=self.timeout,
        )
        response.raise_for_status()
        try:
            raw = response.json()["response"]
            data = (
                json.JSONDecoder().raw_decode(raw.strip())[0]
                if isinstance(raw, str)
                else raw
            )
        except (KeyError, TypeError, json.JSONDecodeError) as error:
            raise AIProviderError("Ollama returned an invalid JSON response.") from error
        return schema.model_validate(data)


def get_provider():
    if settings.AI_PROVIDER.lower() == "ollama":
        return OllamaProvider()
    return MockProvider()


MOCK_RESULTS: dict[str, dict] = {
    "BrandAssetAnalysisResult": {
        "summary": (
            "Audience: premium operators who value useful, composed guidance. "
            "Tone: practical, polished, and restrained. Use concrete process "
            "language and avoid broad growth promises."
        ),
        "audience_clues": ["premium operators", "small teams"],
        "tone_clues": ["practical", "polished", "restrained"],
        "vocabulary_observed": ["practical clarity", "brand voice", "content decisions"],
        "generic_or_banned_candidates": ["go viral", "boost your brand"],
        "claim_observations": [
            "No metrics or guarantees claimed; value is described as process, not outcomes."
        ],
        "do_not_infer": ["Do not infer demographics or outcomes from imagery alone."],
        "detected_language": "en",
        "quality_flag": "usable",
        "quality_reason": "Consistent tone signal, though the sample is short.",
    },
    "BrandVoiceExtractionResult": {
        "voice_summary": (
            "Calm, useful, operator-aware writing. Opens with the point, "
            "explains value in concrete process terms, and never hypes."
        ),
        "tone": {
            "funny": 15,
            "casual": 30,
            "irreverent": 10,
            "enthusiastic": 45,
            "justification": (
                "Samples open with declaratives, avoid exclamation marks, and "
                "use process nouns over superlatives."
            ),
        },
        "tone_tags": ["quietly confident", "practical", "composed"],
        "point_of_view": "we-to-you",
        "sentence_style": (
            "Open with the answer. One idea per sentence. Concrete nouns over "
            "abstractions. No rhetorical questions."
        ),
        "pacing": "Calm and explanatory, not hype-led.",
        "proof_style": (
            "Prefer concrete process notes and observed patterns. Never invent "
            "metrics, case studies, or testimonials."
        ),
        "claim_boundaries": [
            {
                "rule": "Never promise performance outcomes.",
                "reason": "No sample substantiates outcome claims.",
            }
        ],
        "preferred_vocabulary": [
            {
                "term": "practical clarity",
                "instead_of": "engaging content",
                "note": "Use when explaining how the brand turns ideas into usable content.",
            },
            {
                "term": "brand voice",
                "instead_of": "vibe",
                "note": "Use for the reusable communication system behind drafts.",
            },
        ],
        "banned_phrases": [
            {
                "phrase": "go viral",
                "reason": "Overpromises attention and does not fit a controlled brand voice.",
                "severity": "soft",
            },
            {
                "phrase": "stand out online",
                "reason": "Too generic unless a sample proves this exact positioning.",
                "severity": "soft",
            },
        ],
        "examples": [
            {
                "kind": "do",
                "text": "Use this voice when you need a clear launch note with restraint.",
                "annotation": "Direct opening, names the use case, no hedging.",
                "channel": "",
            },
            {
                "kind": "do",
                "text": "Explain the value in concrete terms before asking for action.",
                "annotation": "Value first, CTA second — matches the calm pacing rule.",
                "channel": "",
            },
            {
                "kind": "do",
                "text": "We prepared three considered options for your review.",
                "annotation": "We-to-you POV with a specific, countable claim.",
                "channel": "linkedin",
            },
            {
                "kind": "dont",
                "text": "This will skyrocket your engagement overnight.",
                "annotation": "Outcome promise with no evidence — breaks claim boundaries.",
                "channel": "",
            },
            {
                "kind": "dont",
                "text": "Boost your brand with high quality content that stands out online.",
                "annotation": "Stacked category clichés carry no specific meaning.",
                "channel": "",
            },
            {
                "kind": "dont",
                "text": "We're beyond excited!!! Huge news dropping soon!!!",
                "annotation": "Exclamation stacking and vague teaser conflict with the composed register.",
                "channel": "linkedin",
            },
        ],
        "audience_segments": [
            {
                "name": "Solo operators and SME founders",
                "buyer_type": "B2B decision maker",
                "maturity_level": "problem_aware",
                "pains": ["Content sounds generic", "No time to write well"],
                "desired_outcomes": ["Polished content that explains value clearly"],
                "jargon_tolerance": 40,
            }
        ],
        "positioning": {
            "category": "brand voice and content operations tool",
            "key_benefit": "turns brand guidance into reusable content decisions",
            "differentiators": ["Voice as operable rules, not adjectives"],
            "reasons_to_believe": ["Versioned voice profiles extracted from real samples"],
            "known_for": "Calm, specific, evidence-based brand content.",
        },
        "confidence": 62,
        "extraction_notes": (
            "Small, text-only sample set. No customer-facing email or support "
            "samples, so tone in those contexts is inferred."
        ),
    },
    "DraftGenerationResult": {
        "title": "A considered launch note",
        "content": "Introduce the announcement with a calm, editorial point of view.",
        "channel": "linkedin",
        "rationale": "Matches the requested channel and restrained tone.",
        "self_check": "No banned phrases used; tone sits within the effective sliders.",
    },
    "VoiceReviewResult": {
        "overall_score": 86,
        "tone_alignment": 88,
        "vocabulary": 90,
        "sentence_style": 82,
        "claims": 95,
        "channel_fit": 80,
        "violations": [
            {
                "span": "Introduce the announcement",
                "issue": "Opening describes the announcement instead of making it.",
                "severity": "soft",
                "suggested_fix": "Open with the announcement itself.",
            }
        ],
        "summary": (
            "Strong voice fit overall; the highest-impact fix is opening with "
            "the announcement instead of describing it."
        ),
    },
    "ComplianceReviewResult": {
        "passed": True,
        "issues": [
            {
                "span": "implies an outcome",
                "category": "claims",
                "severity": "medium",
                "explanation": "The draft implies an outcome without evidence.",
                "suggested_fix": "Qualify the claim or add support.",
            }
        ],
        "summary": "One claim should be qualified before approval.",
        "disclaimer": "Automated screening, not legal advice.",
    },
}
