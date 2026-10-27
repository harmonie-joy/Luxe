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
        self.assertIn("Refuse changed revision before review publication", source)
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
        self.assertIn("copilot-requests: write", compiled)
        self.assertIn("needs.agent.result == 'success'", compiled)

    def test_publication_guard_rejects_changed_base_head_and_api_error(self):
        source = Path(".github/workflows/autonomous-qa.md").read_text()
        commands = [line.strip() for line in source.splitlines()
                    if line.strip().startswith(('current=$(gh api ', 'test "$current" = '))]
        self.assertEqual(len(commands), 4)
        self.assertEqual(commands[:2], commands[2:])
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
                    result = subprocess.run(["bash", "-e", "-c", "\n".join(commands[:2])],
                                            env={**env, "MOCK_CURRENT": current, "MOCK_FAIL": fail},
                                            capture_output=True, text=True)
                    self.assertEqual(result.returncode == 0, passes)


if __name__ == "__main__":
    unittest.main()
