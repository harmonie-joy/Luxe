"""Deterministic failure-path checks; no Docker, model or application DB required."""

import contextlib
import io
import json
import os
from pathlib import Path
from types import SimpleNamespace
import shlex
import signal
import subprocess
import tempfile
import time
import unittest
from unittest.mock import Mock, patch

import evaluate_local_ai
import runner_health


class LocalCITests(unittest.TestCase):
    def test_completion_metadata_distinguishes_full_json_from_prefix(self):
        for raw, full, prefix, trailing in (
            (' {"ok": true} \n', True, True, 0),
            ('{"ok": true}\nDone.', False, True, 5),
            ('{"ok":', False, False, 0),
            ('not JSON', False, False, 0),
            ('NaN', False, True, 0),
        ):
            with self.subTest(raw=raw):
                result = evaluate_local_ai.completion_metadata({"response": raw, "done": True, "done_reason": "stop"})
                self.assertEqual(result["strict_json_valid"], full)
                self.assertEqual(result["prefix_json_valid"], prefix)
                self.assertEqual(result["trailing_nonspace_characters"], trailing)
                self.assertNotIn(raw, json.dumps(result))

    def test_prefix_accepted_by_provider_still_fails_full_json_evaluation(self):
        provider = Mock()
        metadata = {}
        def generate(*_):
            metadata.update(evaluate_local_ai.completion_metadata({
                "response": '{"channel":"linkedin"}\nDone.', "done": True, "done_reason": "stop",
            }))
            return SimpleNamespace(channel="linkedin", content="Synthetic content")
        provider.generate.side_effect = generate
        result = evaluate_local_ai.evaluate_case(provider, object, "synthetic", "draft", metadata)
        self.assertTrue(result["schema_valid"])
        self.assertEqual(result["schema_validation"], "ACCEPTED")
        self.assertTrue(result["semantic_checks_pass"])
        self.assertTrue(result["completion"]["prefix_json_valid"])
        self.assertFalse(result["case_pass"])
        self.assertIn("response_json", result["failure_stages"])

    def test_valid_json_does_not_mask_provider_schema_failure(self):
        class ValidationError(ValueError):
            """Provider contract double; backend tests exercise actual Pydantic."""

        provider = Mock()
        metadata = {}
        def generate(*_):
            metadata.update(evaluate_local_ai.completion_metadata({"response": '{}', "done": True, "done_reason": "stop"}))
            raise ValidationError("private schema error")
        provider.generate.side_effect = generate
        result = evaluate_local_ai.evaluate_case(provider, object, "synthetic", "voice", metadata)
        self.assertTrue(result["completion"]["strict_json_valid"])
        self.assertFalse(result["schema_valid"])
        self.assertEqual(result["schema_validation"], "REJECTED")
        self.assertFalse(result["case_pass"])
        self.assertNotIn("private schema error", json.dumps(result))

    def test_completion_metadata_does_not_call_a_length_stop_complete(self):
        result = evaluate_local_ai.completion_metadata({
            "response": '{}', "done": True, "done_reason": "length", "eval_count": 768,
            "thinking": "private reasoning", "unexpected": "private value",
        })
        self.assertTrue(result["strict_json_valid"])
        self.assertFalse(result["generation_complete"])
        self.assertEqual(result["eval_count"], 768)
        self.assertNotIn("private", json.dumps(result))

    def test_low_context_never_certifies_abstention_from_schema_alone(self):
        for case in ("missing-context", "insufficient-context"):
            for confidence, notes, examples in ((85, "Evidence missing", []), (0, "", []), (0, "Evidence missing", [{"text": "invented"}]), (0, "Evidence missing", [])):
                with self.subTest(case=case, confidence=confidence, notes=notes, examples=examples):
                    output = SimpleNamespace(confidence=confidence, extraction_notes=notes, model_dump=lambda: {"examples": examples})
                    provider = Mock()
                    metadata = {}
                    def generate(*_):
                        metadata.update(strict_json_valid=True, generation_complete=True)
                        return output
                    provider.generate.side_effect = generate
                    result = evaluate_local_ai.evaluate_case(provider, object, "synthetic", case, metadata)
                    self.assertTrue(result["schema_valid"])
                    self.assertEqual(result["appropriate_uncertainty"], "NOT_ESTABLISHED")
                    self.assertFalse(result["case_pass"])
                    self.assertEqual(result["uncertainty_checks"]["confidence_zero"], confidence == 0)
                    self.assertEqual(result["uncertainty_checks"]["notes_present"], bool(notes))
                    self.assertEqual(result["uncertainty_checks"]["no_unsupported_derived_fields"], not examples)

    def test_low_context_rejects_unsupported_segments_and_positioning(self):
        for claims in ({"audience_segments": [{"name": "Invented"}]}, {"positioning": {"category": "Invented"}}):
            with self.subTest(claims=claims):
                provider = Mock()
                provider.generate.return_value = SimpleNamespace(confidence=0, extraction_notes="Evidence missing", model_dump=lambda: claims)
                result = evaluate_local_ai.evaluate_case(provider, object, "synthetic", "insufficient-context")
                self.assertFalse(result["uncertainty_checks"]["no_unsupported_derived_fields"])
                self.assertEqual(result["unsupported_derived_fields"], list(claims))

    def test_wrong_channel_or_empty_draft_fails_even_with_valid_schema(self):
        for channel, content in (("blog", "Synthetic content"), ("linkedin", " ")):
            with self.subTest(channel=channel, content=content):
                provider = Mock()
                metadata = {}
                def generate(*_):
                    metadata.update(strict_json_valid=True, generation_complete=True)
                    return SimpleNamespace(channel=channel, content=content)
                provider.generate.side_effect = generate
                result = evaluate_local_ai.evaluate_case(provider, object, "synthetic", "draft", metadata)
                self.assertTrue(result["schema_valid"])
                self.assertFalse(result["semantic_checks_pass"])
                self.assertFalse(result["case_pass"])

    def test_prior_completion_metadata_cannot_mask_a_new_provider_failure(self):
        provider = Mock()
        provider.generate.side_effect = ValueError("private model response")
        metadata = {"strict_json_valid": True, "generation_complete": True}
        result = evaluate_local_ai.evaluate_case(provider, object, "synthetic", "voice", metadata)
        self.assertFalse(result["schema_valid"])
        self.assertEqual(result["schema_validation"], "NOT_RUN")
        self.assertFalse(result["case_pass"])
        self.assertEqual(metadata, {})
        self.assertIsNone(result["completion"].get("strict_json_valid"))

    def test_executable_workflows_do_not_route_to_local_runners(self):
        root = Path(__file__).resolve().parents[2]
        for workflow in (root / ".github/workflows").glob("*.yml"):
            self.assertNotRegex(workflow.read_text(), r"self-hosted|theluxe-(?:local|gpu|trusted)", workflow.name)

    def test_local_workflow_stays_inert_and_restricts_dispatch(self):
        root = Path(__file__).resolve().parents[2]
        self.assertFalse((root / ".github/workflows/trusted-local.yml").exists())
        template = (root / ".github/runner-templates/trusted-local.yml").read_text()
        self.assertIn("on:\n  workflow_dispatch:", template)
        self.assertNotRegex(template, r"(?m)^  (?:pull_request|pull_request_target|schedule|workflow_run):")
        for restriction in ("github.actor_id == '57563103'", "github.ref_protected", "private master", "group: theluxe-trusted", "persist-credentials: false"):
            self.assertIn(restriction, template)

    def test_diagnostic_missing_tool_and_timeout_are_safe(self):
        with patch("runner_health.subprocess.run", side_effect=FileNotFoundError("secret")):
            self.assertIsNone(runner_health.command(["unavailable"]))
        with patch("runner_health.subprocess.run", side_effect=subprocess.TimeoutExpired("secret", 8)):
            self.assertIsNone(runner_health.command(["unavailable"]))

    def test_health_does_not_certify_isolation(self):
        with patch("runner_health.command", return_value=None), patch("runner_health.ollama_models", return_value=None):
            report = runner_health.report()
        self.assertFalse(report["isolation_verified"])
        self.assertIsNone(report["gpu"])
        self.assertIsNone(report["docker"])

    def test_ai_requires_installed_model_without_generating(self):
        output = io.StringIO()
        with patch("evaluate_local_ai.installed_models", return_value=set()), contextlib.redirect_stdout(output):
            self.assertEqual(evaluate_local_ai.main(["--model", "missing"]), 2)
        self.assertEqual(json.loads(output.getvalue())["reason"], "model_not_installed")

    def test_ai_service_failure_is_not_mock_success(self):
        output = io.StringIO()
        with patch("evaluate_local_ai.installed_models", side_effect=OSError("private content")), contextlib.redirect_stdout(output):
            self.assertEqual(evaluate_local_ai.main(["--model", "missing"]), 2)
        self.assertNotIn("private content", output.getvalue())
        self.assertEqual(json.loads(output.getvalue())["reason"], "ollama_unavailable")

    def test_ai_invalid_response_does_not_leak_content(self):
        provider = Mock()
        provider.generate.side_effect = ValueError("private model response")
        for case in ("voice", "missing-context", "insufficient-context"):
            with self.subTest(case=case):
                result = evaluate_local_ai.evaluate_case(provider, object, "synthetic", case)
                self.assertFalse(result["schema_valid"])
                self.assertEqual(result["schema_validation"], "NOT_RUN")
                self.assertEqual(result["error_type"], "ValueError")
                self.assertNotIn("private model response", json.dumps(result))
                if case != "voice":
                    self.assertEqual(result["appropriate_uncertainty"], "NOT_ESTABLISHED")

    def test_ai_valid_response_records_factual_checks(self):
        provider = Mock()
        provider.generate.return_value = Mock(channel="linkedin", content="Synthetic content")
        result = evaluate_local_ai.evaluate_case(provider, object, "synthetic", "draft")
        self.assertTrue(result["schema_valid"])
        self.assertTrue(result["linkedin_channel"])
        self.assertTrue(result["content_nonempty"])
        self.assertNotIn("Synthetic content", json.dumps(result))

    def test_ai_disables_inherited_netrc_before_provider_call(self):
        provider = Mock()
        provider.generate.side_effect = lambda *_: self.assertEqual(os.environ["NETRC"], os.devnull)
        with patch.dict(os.environ, {"NETRC": "/private/credentials"}):
            result = evaluate_local_ai.evaluate_case(provider, object, "synthetic", "voice")
        self.assertTrue(result["schema_valid"])

    def test_integration_rejects_arbitrary_suite_before_work(self):
        script = Path(__file__).with_name("run_local_integration.sh")
        result = subprocess.run(["bash", str(script), "rm -rf /"], capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn("Usage:", result.stderr)

    def test_integration_failure_cleans_only_owned_resources_and_scrubs_secrets(self):
        script = Path(__file__).with_name("run_local_integration.sh").resolve()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            container = "a" * 64
            log = shlex.quote(str(root / "docker.log"))
            (root / "docker").write_text(
                "#!/bin/bash\nset -eu\n"
                f"printf '%s\\n' \"$*\" >> {log}\n"
                "test -z \"${PRIVATE_TEST_SECRET:-}\"\n"
                f"case $1 in run) echo {container};; inspect) echo \"${{@: -1}}\";; exec) exit 0;; port) echo 127.0.0.1:12345;; rm) exit 0;; *) exit 44;; esac\n"
            )
            (root / "python3").write_text(
                "#!/bin/bash\nset -eu\nmkdir -p \"$3/bin\"\n"
                f"printf '%s' \"$3\" > {shlex.quote(str(root / 'venv-path'))}\n"
                "cat > \"$3/bin/python\" <<'PYTHON'\n"
                "#!/bin/bash\nset -eu\n"
                "test -z \"${PRIVATE_TEST_SECRET:-}\"\n"
                "if [[ $1 == manage.py ]]; then exit 17; fi\n"
                "PYTHON\nchmod +x \"$3/bin/python\"\n"
            )
            for tool in ("docker", "python3"):
                (root / tool).chmod(0o700)
            result = subprocess.run(
                ["bash", str(script), "backend"], cwd=script.parents[2],
                env={**os.environ, "PATH": f"{root}:{os.environ['PATH']}", "PRIVATE_TEST_SECRET": "must-not-reach-tools"},
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 17, result.stderr)
            operations = (root / "docker.log").read_text().splitlines()
            temporary = Path((root / "venv-path").read_text()).parent
            self.assertEqual([line for line in operations if line.startswith("rm ")], [f"rm -f theluxe-ci-{temporary.name.split('.')[-1]}"])
            self.assertFalse(temporary.exists())

    def test_term_during_container_allocation_cleans_owned_name(self):
        script = Path(__file__).with_name("run_local_integration.sh").resolve()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "docker").write_text(
                "#!/bin/bash\nset -eu\n"
                f"printf '%s\\n' \"$*\" >> {shlex.quote(str(root / 'docker.log'))}\n"
                "case $1 in\nrun)\n"
                f"printf '%s' \"$HOME\" > {shlex.quote(str(root / 'task-home'))}\n"
                f"touch {shlex.quote(str(root / 'created'))}\n"
                "sleep 30\n;;\ninspect) echo \"${@: -1}\";;\nrm) exit 0;;\n*) exit 44;;\nesac\n"
            )
            (root / "docker").chmod(0o700)
            process = subprocess.Popen(
                ["bash", str(script), "backend"], cwd=script.parents[2],
                env={**os.environ, "PATH": f"{root}:{os.environ['PATH']}"},
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True,
            )
            try:
                deadline = time.monotonic() + 5
                while not (root / "created").exists() and time.monotonic() < deadline:
                    time.sleep(0.02)
                self.assertTrue((root / "created").exists())
                os.killpg(process.pid, signal.SIGTERM)
                _, stderr = process.communicate(timeout=5)
                self.assertEqual(process.returncode, 143, stderr)
                temporary = Path((root / "task-home").read_text()).parent
                operations = (root / "docker.log").read_text().splitlines()
                name = f"theluxe-ci-{temporary.name.split('.')[-1]}"
                self.assertEqual([line for line in operations if line.startswith("rm ")], [f"rm -f {name}"])
                self.assertFalse(temporary.exists())
            finally:
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.communicate()


if __name__ == "__main__":
    unittest.main()
