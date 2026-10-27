"""Static safety checks for the compiled independent QA entrypoint."""

from pathlib import Path
import unittest


class QAWorkflowTests(unittest.TestCase):
    def test_pr_events_and_revision_guard(self):
        source = Path(".github/workflows/autonomous-qa.md").read_text()
        for event in ("opened", "reopened", "ready_for_review", "synchronize"):
            self.assertIn(event, source)
        self.assertIn("branches: [master]", source)
        self.assertIn("group: luxe-independent-qa-${{ github.event.pull_request.number }}", source)
        self.assertIn("cancel-in-progress: true", source)
        self.assertIn('test "$current" = "$EXPECTED_HEAD $EXPECTED_BASE open"', source)
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


if __name__ == "__main__":
    unittest.main()
