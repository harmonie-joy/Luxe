"""Static safety checks for the compiled independent QA entrypoint."""

from pathlib import Path
import os
import subprocess
import tempfile
import unittest


class QAWorkflowTests(unittest.TestCase):
    def test_pr_events_and_revision_guard(self):
        source = Path(".github/workflows/autonomous-qa.md").read_text()
        for event in ("opened", "reopened", "ready_for_review", "synchronize"):
            self.assertIn(event, source)
        self.assertIn("branches: [master]", source)
        self.assertIn("bots: [Copilot, copilot-swe-agent]", source)
        self.assertIn("group: luxe-independent-qa-${{ github.event.pull_request.number }}", source)
        self.assertIn("cancel-in-progress: true", source)
        self.assertIn('test "$current" = "$EXPECTED_HEAD $EXPECTED_BASE open"', source)
        self.assertEqual(source.count('test "$current" = "$EXPECTED_HEAD $EXPECTED_BASE open"'), 2)
        self.assertIn('grep -Fx -- "$EXPECTED_HEAD $EXPECTED_BASE open"', source)
        self.assertIn("Refuse changed revision before review publication", source)
        self.assertIn("Refuse stale review before processing", source)
        self.assertIn("if: needs.agent.result == 'success'", source)

    def test_compiled_permissions_and_read_only_review(self):
        source = Path(".github/workflows/autonomous-qa.md").read_text()
        compiled = Path(".github/workflows/autonomous-qa.lock.yml").read_text()
        self.assertIn("checkout: false", source)
        self.assertIn("allowed-events: [COMMENT]", source)
        self.assertNotIn("pull_request_target:", source)
        self.assertNotIn("merge-pull-request:", source)
        self.assertNotIn("push-to-pull-request-branch:", source)
        self.assertIn("GH_AW_HEAD_SHA: ${{ github.event.pull_request.head.sha }}", compiled)
        self.assertIn("GH_AW_ENGINE_ID: \"copilot\"", compiled)
        agent_permissions = compiled.split("  agent:\n", 1)[1].split("    timeout-minutes:", 1)[0]
        output_permissions = compiled.split("  safe_outputs:\n", 1)[1].split("    timeout-minutes:", 1)[0]
        self.assertNotIn("pull-requests: write", agent_permissions)
        self.assertNotIn("issues: write", agent_permissions)
        self.assertIn("pull-requests: write", output_permissions)
        self.assertIn("contents: read", output_permissions)
        self.assertIn("copilot-requests: write", compiled)
        self.assertIn("needs.agent.result == 'success'", compiled)
        compiled_safe_outputs = compiled.split("  safe_outputs:\n", 1)[1]
        stale_guard = compiled_safe_outputs.index("name: Refuse stale review before processing")
        process_review = compiled_safe_outputs.index("name: Process Safe Outputs")
        self.assertLess(stale_guard, process_review)

    def test_activation_gates_precede_inference_and_publication(self):
        source = Path(".github/workflows/autonomous-qa.md").read_text()
        compiled = Path(".github/workflows/autonomous-qa.lock.yml").read_text()
        frontmatter = source.split("---", 2)[1]
        self.assertIn("vars.LUXE_GH_AW_QA_ENABLED == 'true'", frontmatter)
        self.assertIn("github.event.pull_request.head.repo.full_name == 'harmonie-joy/Luxe'", frontmatter)
        self.assertEqual(frontmatter.count("Require QA activation policy"), 2)
        self.assertEqual(frontmatter.count("QA_ENABLED: ${{ vars.LUXE_GH_AW_QA_ENABLED }}"), 2)
        self.assertEqual(frontmatter.count(".get(\"qa_enabled\") is True"), 2)

        agent = compiled.split("  agent:\n", 1)[1].split("  detection:\n", 1)[0]
        safe_outputs = compiled.split("  safe_outputs:\n", 1)[1]
        self.assertLess(agent.index("name: Require QA activation policy before inference"),
                        agent.index("name: Execute GitHub Copilot CLI"))
        self.assertLess(safe_outputs.index("name: Require QA activation policy before publication"),
                        safe_outputs.index("name: Process Safe Outputs"))

    def test_publication_guard_rejects_changed_base_head_and_api_error(self):
        source = Path(".github/workflows/autonomous-qa.md").read_text()
        frontmatter = source.split("---", 2)[1]
        post_agent = frontmatter.split("post-steps:", 1)[1]
        safe_outputs = frontmatter.split("safe-outputs:", 1)[1].split("post-steps:", 1)[0]

        def commands_in(section):
            return [line.strip() for line in section.splitlines()
                    if line.strip().startswith(('current=$(gh api ', 'test "$current" = '))]

        post_agent_commands = commands_in(post_agent)
        safe_output_commands = [line.strip() for line in safe_outputs.splitlines()
                                if line.strip().startswith(('set -o pipefail', 'gh api ',
                                                           'grep -Fx -- "$EXPECTED_HEAD'))]
        self.assertEqual(len(post_agent_commands), 2)
        self.assertEqual(len(safe_output_commands), 3)
        self.assertEqual(safe_output_commands[0], "set -o pipefail")
        with tempfile.TemporaryDirectory() as directory:
            gh = Path(directory) / "gh"
            gh.write_text('#!/bin/sh\n[ "$MOCK_FAIL" != 1 ] || exit 1\nprintf "%s\\n" "$MOCK_CURRENT"\n')
            gh.chmod(0o755)
            env = {**os.environ, "PATH": directory + os.pathsep + os.environ["PATH"],
                   "EXPECTED_HEAD": "h" * 40, "EXPECTED_BASE": "b" * 40, "PR_NUMBER": "80"}
            for current, fail, passes in (("h" * 40 + " " + "b" * 40 + " open", "0", True),
                                          ("j" * 40 + " " + "b" * 40 + " open", "0", False),
                                          ("h" * 40 + " " + "c" * 40 + " open", "0", False),
                                          ("h" * 40 + " " + "b" * 40 + " closed", "0", False),
                                          ("", "1", False)):
                with self.subTest(current=current, fail=fail):
                    result = subprocess.run(["bash", "-e", "-c", "\n".join(safe_output_commands)],
                                            env={**env, "MOCK_CURRENT": current, "MOCK_FAIL": fail},
                                            capture_output=True, text=True)
                    self.assertEqual(result.returncode == 0, passes)

            agent_result = subprocess.run(
                ["bash", "-e", "-c", "\n".join(post_agent_commands)],
                env={**env, "MOCK_CURRENT": "h" * 40 + " " + "b" * 40 + " open",
                     "MOCK_FAIL": "0"},
                capture_output=True, text=True)
            self.assertEqual(agent_result.returncode, 0)

            changed_base_result = subprocess.run(
                ["bash", "-e", "-c", "\n".join(safe_output_commands)],
                env={**env, "MOCK_CURRENT": "h" * 40 + " " + "c" * 40 + " open",
                     "MOCK_FAIL": "0"},
                capture_output=True, text=True)
            self.assertNotEqual(changed_base_result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
