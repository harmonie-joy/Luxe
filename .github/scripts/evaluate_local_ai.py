"""Advisory synthetic Ollama evaluation; never reads application data or writes a DB."""

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
from types import SimpleNamespace
import urllib.request
from unittest.mock import patch

BASE_URL = "http://127.0.0.1:11434"
FIXTURES = Path(__file__).with_name("fixtures") / "local_ai_contexts.json"


def installed_models():
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(f"{BASE_URL}/api/tags", timeout=3) as response:
        return {model["name"] for model in json.load(response)["models"]}


def gpu_memory():
    try:
        output = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=3,
        )
        return sum(int(line) for line in output.stdout.splitlines()) if output.returncode == 0 else None
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None


def _reject_nonfinite(_):
    raise ValueError("Non-finite JSON constant")


def completion_metadata(body):
    """Observe protocol validity without retaining model content or repairing it."""
    body = body if isinstance(body, dict) else {}
    reason = body.get("done_reason")
    result = {
        "strict_json_valid": False, "prefix_json_valid": False,
        "trailing_nonspace_characters": 0,
        "generation_complete": body.get("done") is True and reason == "stop",
        "done": body.get("done") is True,
        "done_reason": reason if reason in ("stop", "length", None) else "other",
    }
    for key in ("eval_count", "prompt_eval_count", "total_duration", "load_duration", "eval_duration", "prompt_eval_duration"):
        if type(body.get(key)) is int and body[key] >= 0:
            result[key] = body[key]
    raw = body.get("response")
    result["response_characters"] = len(raw) if isinstance(raw, str) else None
    if not isinstance(raw, str):
        return result
    try:
        _, end = json.JSONDecoder().raw_decode(raw.strip())
        result["prefix_json_valid"] = True
        result["trailing_nonspace_characters"] = len(raw.strip()[end:].strip())
        json.loads(raw, parse_constant=_reject_nonfinite)
        result["strict_json_valid"] = True
    except ValueError as error:
        result["json_error_position"] = getattr(error, "pos", None)
    return result


def evaluate_case(provider, schema, prompt, case, metadata=None):
    start = time.monotonic()
    if metadata is not None:
        metadata.clear()
    result = {
        "case": f"synthetic-v2/{case}", "schema_valid": False, "schema_validation": "NOT_RUN",
        "semantic_correctness": "NOT_ESTABLISHED", "semantic_checks_pass": False,
    }
    if case in ("missing-context", "insufficient-context"):
        # Numeric tone is mandatory: zero describes a tone, never "unknown".
        result["appropriate_uncertainty"] = "NOT_ESTABLISHED"
        result["uncertainty_limit"] = "voice_schema_requires_numeric_tone_without_unknown"
    try:
        # requests otherwise reads inherited NETRC or ~/.netrc for loopback auth.
        os.environ["NETRC"] = os.devnull
        output = provider.generate(prompt, schema)
        result["schema_valid"] = True
        result["schema_validation"] = "ACCEPTED"
        if case == "draft":
            result["linkedin_channel"] = output.channel == "linkedin"
            result["content_nonempty"] = bool(output.content.strip())
            result["semantic_checks_pass"] = result["linkedin_channel"] and result["content_nonempty"]
        elif case == "voice":
            summary = getattr(output, "voice_summary", None)
            result["semantic_checks_pass"] = isinstance(summary, str) and bool(summary.strip())
        if case in ("missing-context", "insufficient-context"):
            result["reported_confidence"] = output.confidence
            result["missing_context_notes_present"] = bool(output.extraction_notes.strip())
            data = output.model_dump()
            derived = (
                "examples", "audience_segments", "preferred_vocabulary", "banned_phrases",
                "claim_boundaries", "tone_tags", "point_of_view", "sentence_style", "pacing", "proof_style",
            )
            unsupported = [field for field in derived if data.get(field)]
            if any(data.get("positioning", {}).values()):
                unsupported.append("positioning")
            result["unsupported_derived_fields"] = unsupported
            result["uncertainty_checks"] = {
                "confidence_zero": output.confidence == 0,
                "notes_present": result["missing_context_notes_present"],
                "no_unsupported_derived_fields": not unsupported,
            }
            result["semantic_checks_pass"] = all(result["uncertainty_checks"].values())
    except Exception as error:
        # Do not serialize exception messages: upstream errors can contain model output.
        result["error_type"] = type(error).__name__
        if result["error_type"] == "ValidationError":
            result["schema_validation"] = "REJECTED"
    result["completion"] = dict(metadata or {})
    result["failure_stages"] = []
    if not result["schema_valid"]:
        result["failure_stages"].append("schema_validation" if result.get("error_type") == "ValidationError" else "provider_error")
    if result["completion"].get("strict_json_valid") is not True:
        result["failure_stages"].append("response_json")
    if result["completion"].get("generation_complete") is not True:
        result["failure_stages"].append("completion_not_verified")
    if result["schema_valid"] and not result["semantic_checks_pass"]:
        result["failure_stages"].append("semantic_assertions")
    if case in ("missing-context", "insufficient-context"):
        result["failure_stages"].append("uncertainty_contract")
    result["case_pass"] = not result["failure_stages"]
    result["latency_seconds"] = round(time.monotonic() - start, 3)
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, help="Exact already-installed Ollama model name; no downloads")
    parser.add_argument("--case", choices=("all", "draft", "voice", "missing-context", "insufficient-context"), default="all")
    parser.add_argument("--num-predict", type=int, choices=(768, 1536), default=768, help="Bounded evaluation token budget; does not change application settings")
    parser.add_argument("--seed", type=int, default=4, help="Evaluation replay seed; hardware/runtime nondeterminism can remain")
    args = parser.parse_args(argv)
    try:
        if args.model not in installed_models():
            print(json.dumps({"status": "NOT VERIFIED", "reason": "model_not_installed"}))
            return 2
    except (OSError, ValueError, KeyError, TypeError):
        print(json.dumps({"status": "NOT VERIFIED", "reason": "ollama_unavailable"}))
        return 2

    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
    from django.conf import settings
    settings.configure(OLLAMA_BASE_URL=BASE_URL, OLLAMA_MODEL=args.model, OLLAMA_NUM_PREDICT=args.num_predict)
    import requests
    from llm import providers
    from llm import prompts, schemas

    # requests must never send loopback synthetic prompts through an inherited proxy.
    os.environ["NO_PROXY"] = os.environ["no_proxy"] = "127.0.0.1"
    fixtures = json.loads(FIXTURES.read_text())
    contexts = fixtures["contexts"]
    cases = {
        "draft": (schemas.DraftGenerationResult, prompts.draft_generation_prompt(contexts["draft"])),
        **{case: (schemas.BrandVoiceExtractionResult, prompts.brand_voice_extraction_prompt(contexts[case]))
           for case in ("voice", "missing-context", "insufficient-context")},
    }
    provider = providers.OllamaProvider(base_url=BASE_URL, model=args.model, timeout=60)
    samples = []
    stop = threading.Event()

    def sample():
        while not stop.is_set():
            value = gpu_memory()
            if value is not None:
                samples.append(value)
            stop.wait(0.5)

    sampler = threading.Thread(target=sample, daemon=True)
    sampler.start()
    started = time.monotonic()
    try:
        metadata = {}
        def observe(response, **_):
            try:
                metadata.update(completion_metadata(response.json()))
            except ValueError:
                metadata["strict_json_valid"] = False
            return response
        with requests.Session() as session:
            session.trust_env = False
            session.hooks["response"].append(observe)
            def post(url, **kwargs):
                kwargs["json"]["options"]["seed"] = args.seed
                return session.post(url, **kwargs)
            # Only the CLI transport is observed; every response remains real.
            with patch.object(providers, "requests", SimpleNamespace(post=post)):
                rows = [evaluate_case(provider, *cases[case], case, metadata) for case in cases if args.case in ("all", case)]
    finally:
        stop.set()
        sampler.join(timeout=4)
    elapsed = time.monotonic() - started
    valid = all(row["case_pass"] for row in rows)
    print(json.dumps({
        "status": "PASS" if valid else "FAIL",
        "provider": "ollama", "model": args.model, "fixture_version": fixtures["fixture_version"],
        "num_predict": args.num_predict, "seed": args.seed,
        "verdict_scope": "protocol, schema and bounded assertions; not semantic quality certification",
        "production_provider_changed": False, "quality_thresholds": "uncalibrated; human review required",
        "airun_provenance": "provider-only evaluation; application AIRun persistence covered by backend tests",
        "results": rows, "cases_per_minute": round(len(rows) * 60 / elapsed, 3),
        "sampled_system_gpu_memory_peak_mib": max(samples) if samples else None,
        "gpu_memory_scope": "all GPU processes, sampled; not per-model allocation",
    }, indent=2))
    return 0 if valid else 1


if __name__ == "__main__":
    sys.exit(main())
