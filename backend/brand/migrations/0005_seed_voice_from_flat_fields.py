"""
Data migration: seed the Voice DNA models from the deprecated flat fields.

What changes and why (no schema changes; 0004 added the tables):

- Every existing BrandProfile gets a BrandVoice version 1 (is_active=True):
  - preferred_vocabulary entries become VocabularyRule-shaped objects
    ({'term', 'instead_of', 'note'}). Strings are wrapped; the old
    serializer shape ({'preferred_term', 'restricted_terms', 'note'}) is
    mapped so no data is lost; unknown object shapes pass through.
  - banned_phrases become {'phrase', 'reason', 'severity': 'soft'} objects.
  - positioning_notes is copied verbatim into BrandVoice.extraction_notes
    prefixed with 'Legacy positioning_notes:' so nothing is lost; the new
    structured positioning fields stay empty for re-extraction.
  - The old tone tag list becomes tone_tags; the four NN/g sliders are
    seeded from the first tag (see SLIDER_SEEDS) and extraction_notes says
    they are seeded, not extracted.
- Every non-empty BrandProfile.audience becomes one AudienceSegment
  (name='Primary audience', is_primary=True, notes=<old text>).

Reverse is a no-op: the deprecated source columns are untouched, so
rolling back the schema loses only the derived rows.
"""

from django.db import migrations

SLIDER_SEEDS = {
    "professional": {"casual": 25, "funny": 15, "irreverent": 10, "enthusiastic": 40},
    "authoritative": {"casual": 25, "funny": 15, "irreverent": 10, "enthusiastic": 40},
    "sophisticated": {"casual": 20, "funny": 10, "irreverent": 10, "enthusiastic": 35},
    "approachable": {"casual": 65, "funny": 40, "irreverent": 20, "enthusiastic": 60},
    "visionary": {"casual": 45, "funny": 25, "irreverent": 25, "enthusiastic": 75},
}
DEFAULT_SLIDERS = {"casual": 50, "funny": 50, "irreverent": 50, "enthusiastic": 50}


def seed_sliders(tone_tags):
    first = tone_tags[0] if tone_tags else None
    return SLIDER_SEEDS.get(first, DEFAULT_SLIDERS)


def map_vocabulary(entries):
    mapped = []
    for entry in entries or []:
        if isinstance(entry, str):
            mapped.append({"term": entry, "instead_of": None, "note": ""})
        elif isinstance(entry, dict) and "preferred_term" in entry:
            restricted = entry.get("restricted_terms") or []
            mapped.append(
                {
                    "term": entry["preferred_term"],
                    "instead_of": ", ".join(restricted) or None,
                    "note": entry.get("note", ""),
                }
            )
        else:
            mapped.append(entry)
    return mapped


def map_banned_phrases(entries):
    mapped = []
    for entry in entries or []:
        if isinstance(entry, str):
            mapped.append({"phrase": entry, "reason": "", "severity": "soft"})
        elif isinstance(entry, dict):
            mapped.append(
                {
                    "phrase": entry.get("phrase", ""),
                    "reason": entry.get("reason", ""),
                    "severity": entry.get("severity", "soft"),
                }
            )
        else:
            mapped.append(entry)
    return mapped


def build_extraction_notes(positioning_notes):
    notes = [
        "Tone sliders are seeded from the legacy tone tags, not extracted "
        "from samples. Re-run voice extraction for evidence-based scores."
    ]
    if positioning_notes:
        notes.append(f"Legacy positioning_notes:\n{positioning_notes}")
    return "\n\n".join(notes)


def seed_voice_dna(apps, schema_editor):
    BrandProfile = apps.get_model("brand", "BrandProfile")
    BrandVoice = apps.get_model("brand", "BrandVoice")
    AudienceSegment = apps.get_model("brand", "AudienceSegment")

    for profile in BrandProfile.objects.all():
        tone_tags = list(profile.tone or [])
        sliders = seed_sliders(tone_tags)
        if not profile.voices.exists():
            BrandVoice.objects.create(
                brand_profile=profile,
                version=1,
                is_active=True,
                tone_funny=sliders["funny"],
                tone_casual=sliders["casual"],
                tone_irreverent=sliders["irreverent"],
                tone_enthusiastic=sliders["enthusiastic"],
                tone_tags=tone_tags,
                preferred_vocabulary=map_vocabulary(profile.preferred_vocabulary),
                banned_phrases=map_banned_phrases(profile.banned_phrases),
                extraction_confidence=0,
                extraction_notes=build_extraction_notes(profile.positioning_notes),
            )
        if profile.audience and not profile.segments.exists():
            AudienceSegment.objects.create(
                brand_profile=profile,
                name="Primary audience",
                is_primary=True,
                notes=profile.audience,
            )


class Migration(migrations.Migration):

    dependencies = [
        ("brand", "0004_voice_dna_models"),
    ]

    operations = [
        migrations.RunPython(seed_voice_dna, migrations.RunPython.noop),
    ]
