"""
Prompt builders for the brand engine.

Conventions:
- No tenant/brand names hardcoded — everything comes from context. The
  platform's own name is not the customer's brand and must not appear here.
- Prompts demand behavioral rules, never bare adjectives ("professional" on
  its own is banned as an output; "opens with the answer, no hedging, active
  voice" is the required register).
- Tone is scored on the four NN/g dimensions with an evidence-based
  justification, so the sliders are auditable rather than vibes.
- Evidence is weighted: top-performing and recent assets count more; stale
  or excluded assets are ignored.
"""

import json


def _ctx(context: dict) -> str:
    return json.dumps(context, indent=2, ensure_ascii=False, default=str)


# --------------------------------------------------------------------------
# Asset analysis
# --------------------------------------------------------------------------

def brand_asset_analysis_prompt(context: dict, is_image: bool) -> str:
    if is_image:
        instruction = (
            "Analyze the attached image as brand reference material. Extract "
            "visual tone signals (formality, luxury vs. casual, energy), "
            "audience clues, emotional positioning, and implications for "
            "written language. Explicitly list what must NOT be inferred "
            "from a single image."
        )
    else:
        instruction = (
            "Analyze the text or transcript as brand reference material. "
            "Extract audience clues, tone signals, sentence-level patterns "
            "(length, structure, openings), recurring vocabulary, cliché or "
            "generic phrases that appear, and any claims made — noting "
            "whether each claim is substantiated within the asset."
        )
    return (
        f"You are a brand strategist building an evidence file for a later "
        f"voice extraction.\n\n{instruction}\n\n"
        "Rules:\n"
        "- Describe patterns behaviorally, with short verbatim fragments as "
        "evidence, not adjectives alone.\n"
        "- Do not invent demographics, metrics, guarantees, or legal claims.\n"
        "- Set quality_flag to 'recommend_exclude' if the asset is generic, "
        "clearly outdated, off-brand relative to the brand profile, or too "
        "short to carry signal, and explain why in quality_reason.\n"
        "- Detect and report the asset's language.\n\n"
        f"Context:\n{_ctx(context)}"
    )


# --------------------------------------------------------------------------
# Voice extraction
# --------------------------------------------------------------------------

def brand_voice_extraction_prompt(context: dict) -> str:
    brand_name = context.get("brand_profile", {}).get("name") or "this brand"
    return (
        f"You are a senior brand strategist. Extract a reusable Voice DNA "
        f"profile for {brand_name} from the brand profile and the evidence "
        f"assets provided.\n\n"
        "EVIDENCE WEIGHTING\n"
        "- Weight assets marked performance_signal='top' and recent "
        "content_date most heavily.\n"
        "- Down-weight stale assets and anything flagged weak; ignore assets "
        "with status 'excluded'.\n"
        "- Where assets conflict (e.g. website formal, socials playful), "
        "resolve toward the higher-weighted evidence and record the conflict "
        "in extraction_notes.\n\n"
        "TONE\n"
        "- Score the four tone dimensions 0-100: funny (0 serious), casual "
        "(0 formal), irreverent (0 respectful), enthusiastic (0 "
        "matter-of-fact).\n"
        "- Justify the scores by citing concrete patterns from the samples "
        "(sentence openings, punctuation habits, word choices). No score "
        "without evidence.\n"
        "- tone_tags: at most 4 descriptors, and each must be specific "
        "('quietly confident'), never generic ('professional', 'engaging', "
        "'high quality').\n\n"
        "BEHAVIORAL RULES, NOT ADJECTIVES\n"
        "- sentence_style, pacing, and proof_style must be written as rules "
        "a writer or an LLM can execute: 'Open with the answer. One idea per "
        "sentence. Numbers over superlatives. Never hedge with \"we "
        "believe\".'\n"
        "- preferred_vocabulary entries should, where possible, pair a term "
        "with what it replaces (instead_of).\n"
        "- banned_phrases: include clichés observed in weak assets and "
        "category clichés this brand should avoid ('boost your brand', "
        "'stand out online', 'game-changing') — severity 'soft' unless the "
        "brand profile marks it hard.\n\n"
        "CLAIMS\n"
        "- claim_boundaries: rules about what this brand may and may not "
        "claim, derived from the evidence. Do not invent metrics, case "
        "studies, testimonials, or guarantees anywhere in the output.\n\n"
        "EXAMPLES\n"
        "- Produce at least 3 'do' and 3 'dont' examples. 'Do' examples "
        "should be drawn or lightly adapted from the strongest assets; "
        "'dont' examples should show realistic failure modes (generic, "
        "off-tone, over-claiming). Every example needs an annotation naming "
        "the pattern, e.g. 'Direct opening, names the specific feature, no "
        "hedging.'\n\n"
        "AUDIENCE AND POSITIONING\n"
        "- audience_segments: only segments actually evidenced. Each needs "
        "buyer type, maturity level, pains, and desired outcomes.\n"
        "- positioning: category (frame of reference), key benefit, "
        "differentiators, reasons to believe, and what the brand wants to "
        "be known for. Distinguish positioning (why choose us) from tone "
        "(how we sound).\n\n"
        "CONFIDENCE\n"
        "- Report confidence 0-100 based on sample volume, recency, and "
        "internal consistency. In extraction_notes, state exactly what "
        "additional evidence would raise it (e.g. 'no customer-facing email "
        "samples; tone in support contexts is inferred').\n\n"
        f"Extraction context:\n{_ctx(context)}"
    )


# --------------------------------------------------------------------------
# Draft generation
# --------------------------------------------------------------------------

def draft_generation_prompt(context: dict) -> str:
    brand_name = context.get("brand_profile", {}).get("name") or "the brand"
    channel = context.get("channel", "")
    return (
        f"You are the in-house writer for {brand_name}. Write one "
        f"channel-ready draft for the '{channel}' channel.\n\n"
        "HOW TO APPLY THE INPUTS\n"
        "- brief: intent, angle, and constraints. Constraints win over "
        "style preferences.\n"
        "- audience_segment: write to this reader's maturity level and "
        "jargon tolerance; pre-empt their listed objections where natural.\n"
        "- voice: obey the tone sliders (after channel deltas are applied "
        "in effective_tone), sentence_style, pacing, point_of_view, and "
        "proof_style as hard rules.\n"
        "- channel_style: respect target_length, structure_norms, "
        "emoji_policy, hashtag_policy, and cta_style exactly.\n"
        "- examples: 'do' examples show the register to hit; 'dont' "
        "examples show failure modes to avoid. Match their patterns, do "
        "not copy their content.\n\n"
        "HARD RULES\n"
        "- Never use any banned phrase (hard or soft severity).\n"
        "- Never violate claim_boundaries; make no unsubstantiated claims, "
        "invented metrics, testimonials, or guarantees.\n"
        "- Use preferred vocabulary where the concept arises.\n\n"
        "Before finalizing, run one self-check pass: report in self_check "
        "any place where the draft drifts from the tone sliders or comes "
        "near a banned phrase, and fix it in the content first.\n"
        f"Set channel to {channel!r}. In rationale, explain briefly how the "
        "draft applies the positioning and voice.\n\n"
        f"Context:\n{_ctx(context)}"
    )


# --------------------------------------------------------------------------
# Voice review (enforcement)
# --------------------------------------------------------------------------

def voice_review_prompt(context: dict) -> str:
    return (
        "You are a brand governance reviewer. Score the draft against the "
        "brand voice profile using this rubric (each 0-100):\n"
        "- tone_alignment: does the draft sit within ~10 points of each "
        "effective tone slider? Cite the drifting spans.\n"
        "- vocabulary: preferred terms used where relevant; banned phrases "
        "absent (any 'hard' banned phrase caps this score at 20).\n"
        "- sentence_style: adherence to the behavioral sentence/pacing/POV "
        "rules.\n"
        "- claims: no violations of claim_boundaries; no unsubstantiated "
        "metrics, guarantees, or testimonials.\n"
        "- channel_fit: length, structure, emoji/hashtag/CTA norms for the "
        "target channel.\n\n"
        "overall_score is a weighted judgment, not an average: hard "
        "violations (banned phrases, claim breaches) dominate.\n"
        "Every violation must quote the exact span, name the issue, set "
        "severity, and give a concrete rewrite. In summary, lead with the "
        "single highest-impact fix.\n"
        "Be strict but fair: do not invent violations, and do not penalize "
        "deliberate, brief-mandated deviations.\n\n"
        f"Context:\n{_ctx(context)}"
    )


# --------------------------------------------------------------------------
# Compliance review
# --------------------------------------------------------------------------

def compliance_review_prompt(context: dict) -> str:
    jurisdiction = context.get("jurisdiction", "EU")
    return (
        "You are a marketing-compliance screener (automated screening, not "
        "legal advice — say so in the disclaimer field).\n"
        f"Primary jurisdiction: {jurisdiction}.\n\n"
        "Screen the draft for these issue categories:\n"
        "- gdpr: personal data handling implications, tracking promises, "
        "data-use statements.\n"
        "- consent: implied opt-ins, pre-checked expectations, unsolicited "
        "outreach framing.\n"
        "- ip: third-party brand names, slogans, or creative works used in "
        "ways that could imply endorsement or copy protected expression.\n"
        "- claims: superiority, results, health, financial, or guarantee "
        "claims lacking substantiation; check against the brand's "
        "claim_boundaries if provided.\n\n"
        "For every issue: quote the exact span, classify the category, rate "
        "severity low/medium/high, explain in one or two sentences, and "
        "give a compliant rewrite. Set passed=false if any high-severity "
        "issue exists.\n\n"
        f"Context:\n{_ctx(context)}"
    )
