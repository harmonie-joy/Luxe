from typing import Literal

from pydantic import BaseModel, Field


ComplianceStatus = Literal["green", "yellow", "red"]
ComplianceCategory = Literal["gdpr", "consent", "ip", "claims"]
ComplianceSeverity = Literal["low", "medium", "high"]


class VocabularyRuleResult(BaseModel):
    preferred_term: str
    restricted_terms: list[str] = Field(default_factory=list)
    note: str = ""


class BannedPhraseResult(BaseModel):
    phrase: str
    reason: str = ""


class BrandVoiceExtractionResult(BaseModel):
    audience: str
    tone: list[str] = Field(default_factory=list)
    preferred_vocabulary: list[VocabularyRuleResult] = Field(default_factory=list)
    banned_phrases: list[BannedPhraseResult] = Field(default_factory=list)
    positioning_notes: str = ""


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
