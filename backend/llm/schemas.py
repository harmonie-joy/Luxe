from typing import Literal

from pydantic import BaseModel, Field, field_validator


ComplianceStatus = Literal["green", "yellow", "red"]
ComplianceCategory = Literal["gdpr", "consent", "ip", "claims"]
ComplianceSeverity = Literal["low", "medium", "high"]
BrandVoiceTone = Literal[
    "professional",
    "authoritative",
    "sophisticated",
    "approachable",
    "visionary",
]


class VocabularyRuleResult(BaseModel):
    preferred_term: str
    restricted_terms: list[str] = Field(default_factory=list)
    note: str = ""


class BannedPhraseResult(BaseModel):
    phrase: str
    reason: str = ""


class BrandVoiceExtractionResult(BaseModel):
    audience: str
    tone: list[BrandVoiceTone] = Field(default_factory=list)
    preferred_vocabulary: list[VocabularyRuleResult] = Field(default_factory=list)
    banned_phrases: list[BannedPhraseResult] = Field(default_factory=list)
    positioning_notes: str = ""

    @field_validator("tone", mode="before")
    @classmethod
    def normalize_tone(cls, value):
        if isinstance(value, str):
            return [value]
        return list(value or [])[:1]

    @field_validator("preferred_vocabulary", mode="before")
    @classmethod
    def normalize_preferred_vocabulary(cls, value):
        return [
            {"preferred_term": item, "restricted_terms": [], "note": ""}
            if isinstance(item, str)
            else item
            for item in (value or [])
        ]

    @field_validator("banned_phrases", mode="before")
    @classmethod
    def normalize_banned_phrases(cls, value):
        return [
            {"phrase": item, "reason": ""}
            if isinstance(item, str)
            else item
            for item in (value or [])
        ]


class DraftGenerationResult(BaseModel):
    title: str
    content: str
    channel: str
    rationale: str = ""


class VoiceReviewResult(BaseModel):
    status: ComplianceStatus
    summary: str
    strengths: list[str] = Field(default_factory=list)
    issues: list[str] = Field(default_factory=list)
    suggested_revisions: list[str] = Field(default_factory=list)


class ComplianceIssueResult(BaseModel):
    title: str
    category: ComplianceCategory
    severity: ComplianceSeverity
    explanation: str
    suggested_fix: str = ""


class ComplianceReviewResult(BaseModel):
    status: ComplianceStatus
    summary: str
    issues: list[ComplianceIssueResult] = Field(default_factory=list)
