## 1 User Journey

```
Login

↓

Dashboard

↓

Brand Voice

↓

Upload Assets

↓

Analyze

↓

Accept Voice DNA

↓

Create Brief

↓

Generate Draft

↓

Compliance Review

↓

Save Draft

↓

Calendar
```

---

## 2 Data Flow

```
BrandAsset

↓

BrandVoiceProfile

↓

ContentBrief

↓

Prompt Builder

↓

LLM

↓

ContentDraft

↓

ComplianceCheck

↓

AuditEvent
```

---

## 3 API Flow

```
POST Brand Assets

↓

POST Analyze

↓

POST Save Profile

↓

POST Draft Generate

↓

POST Compliance Review

↓

POST Save Draft

↓

GET Calendar
```

---

## 4 AI Flow

```
Assets

↓

Analyzer

↓

Voice DNA

↓

Stored Profile

↓

Prompt Builder

↓

Draft Generation

↓

Compliance

↓

Suggestions
```

---

## 5 Screen Navigation

```
Dashboard

↓

Brand Voice

↓

Create Brief

↓

Draft Studio

↓

Compliance

↓

Calendar
```

---

## 6 Backend Sequence

```
Request

↓

Auth

↓

Workspace

↓

Serializer

↓

Service

↓

LLM Provider

↓

Persistence

↓

Audit
```

---

## 7 State Diagram

This becomes invaluable later.

Example

```
Brand Profile

Draft

Pending

Generating

Generated

Saved

Reviewed

Approved

Scheduled
```