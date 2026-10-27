"""Advisory synthetic Ollama evaluation; never reads application data or writes a DB."""

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
import urllib.request

BASE_URL = "http://127.0.0.1:11434"


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


def evaluate_case(provider, schema, prompt, case):
    start = time.monotonic()
    result = {"case": f"synthetic-v1/{case}", "schema_valid": False}
    try:
        # requests otherwise reads inherited NETRC or ~/.netrc for loopback auth.
        os.environ["NETRC"] = os.devnull
        output = provider.generate(prompt, schema)
        result["schema_valid"] = True
        if case == "draft":
            result["linkedin_channel"] = output.channel == "linkedin"
            result["content_nonempty"] = bool(output.content.strip())
        if case == "missing-context":
            result["reported_confidence"] = output.confidence
            result["missing_context_notes_present"] = bool(output.extraction_notes.strip())
    except Exception as error:
        # Do not serialize exception messages: upstream errors can contain model output.
        result["error_type"] = type(error).__name__
    result["latency_seconds"] = round(time.monotonic() - start, 3)
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, help="Exact already-installed Ollama model name; no downloads")
    parser.add_argument("--case", choices=("all", "draft", "voice", "missing-context"), default="all")
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
    settings.configure(OLLAMA_BASE_URL=BASE_URL, OLLAMA_MODEL=args.model, OLLAMA_NUM_PREDICT=768)
    from llm.providers import OllamaProvider
    from llm import prompts, schemas

    # requests must never send loopback synthetic prompts through an inherited proxy.
    os.environ["NO_PROXY"] = os.environ["no_proxy"] = "127.0.0.1"
    voice_context = {
        "brand_profile": {"name": "Synthetic Workshop", "category": "editorial planning"},
        "assets": [{"status": "ready", "text": "Open with the decision. Explain one concrete next action. Never promise outcomes."}],
    }
    cases = {
        "draft": (schemas.DraftGenerationResult, prompts.draft_generation_prompt({
            "brand_profile": {"name": "Synthetic Workshop"}, "channel": "linkedin",
            "brief": {"objective": "Explain how to save a writing checkpoint in under 80 words", "constraints": "No invented metrics or outcome guarantees"},
            "voice": {"sentence_style": "Short declaratives, one concrete next action."},
        })),
        "voice": (schemas.BrandVoiceExtractionResult, prompts.brand_voice_extraction_prompt(voice_context)),
        "missing-context": (schemas.BrandVoiceExtractionResult, prompts.brand_voice_extraction_prompt({"brand_profile": {}, "assets": []})),
    }
    provider = OllamaProvider(base_url=BASE_URL, model=args.model, timeout=60)
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
        rows = [evaluate_case(provider, *cases[case], case) for case in cases if args.case in ("all", case)]
    finally:
        stop.set()
        sampler.join(timeout=4)
    elapsed = time.monotonic() - started
    valid = all(row["schema_valid"] for row in rows)
    print(json.dumps({
        "status": "PASS" if valid else "FAIL",
        "provider": "ollama", "model": args.model, "fixture_version": 1,
        "production_provider_changed": False, "quality_thresholds": "uncalibrated; human review required",
        "airun_provenance": "provider-only evaluation; application AIRun persistence covered by backend tests",
        "results": rows, "cases_per_minute": round(len(rows) * 60 / elapsed, 3),
        "sampled_system_gpu_memory_peak_mib": max(samples) if samples else None,
        "gpu_memory_scope": "all GPU processes, sampled; not per-model allocation",
    }, indent=2))
    return 0 if valid else 1


if __name__ == "__main__":
    sys.exit(main())
