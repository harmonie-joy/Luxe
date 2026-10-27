"""Verify generated permission, output and dependency contracts without PyYAML."""

import json
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github/workflows"


def job(text, name):
    match = re.search(rf"^  {name}:\n(.*?)(?=^  [A-Za-z_][A-Za-z0-9_-]*:\n|\Z)", text, re.M | re.S)
    if not match:
        raise AssertionError(f"Missing generated job: {name}")
    return match[1]


class WorkflowTests(unittest.TestCase):
    def test_release_pins_and_agent_isolation(self):
        for name in ("luxe-independent-qa", "luxe-bounded-repair"):
            with self.subTest(name=name):
                text = (WORKFLOWS / f"{name}.lock.yml").read_text()
                manifest = json.loads(re.search(r"^# gh-aw-manifest: (.+)$", text, re.M)[1])
                self.assertIn("permissions: {}", text)
                self.assertNotIn("pull_request_target:", text)
                self.assertTrue(all(re.fullmatch(r"[a-f0-9]{40}", a["sha"]) for a in manifest["actions"]))
                self.assertTrue(all(re.fullmatch(r"sha256:[a-f0-9]{64}", c["digest"])
                                    for c in manifest["containers"]))
                setup = [a for a in manifest["actions"] if a["repo"] == "github/gh-aw/actions/setup"]
                self.assertEqual(setup[0]["sha"], "32ecafbc061c9af57e9361942099e381102ae304")
                agent = job(text, "agent")
                self.assertNotIn("LUXE_REPAIR_APP_PRIVATE_KEY", agent)
                self.assertNotRegex(agent, r"(?m)^    environment:")
                self.assertNotRegex(agent, r"(?m)^      (contents|issues|pull-requests): write")
                self.assertIn("copilot-requests: write", agent)
                self.assertIn("timeout-minutes: 15", agent)
                self.assertNotIn("Checkout PR branch", agent)
                self.assertNotIn("check_out_pull_request", agent)
                self.assertNotIn("--allow-all-tools", agent)
                self.assertNotIn("--allow-tool shell", agent)
                self.assertNotIn("--allow-tool write", agent)
                self.assertIn("needs.detection.result == 'success'", job(text, "safe_outputs"))
                for tools in manifest["mcp_servers"]:
                    if tools["name"] == "github":
                        self.assertEqual(set(tools["tools"]), {
                            "actions_get", "actions_list", "get_file_contents",
                            "issue_read", "pull_request_read"})

    def test_comment_only_and_post_agent_validation(self):
        text = (WORKFLOWS / "luxe-independent-qa.lock.yml").read_text()
        native = job(text, "safe_outputs")
        source = (WORKFLOWS / "luxe-independent-qa.md").read_text()
        source_condition = re.search(r"^    if: (.+)$", job(source, "safe_outputs"), re.M)[1]
        lock_condition = re.search(r"^    if: >\n((?:      .+\n?)+)", native, re.M)[1]
        self.assertIn("needs.validate_qa.result == 'success'", source_condition)
        self.assertIn("needs.validate_qa.result == 'success'", lock_condition)

        def may_publish(statuses):
            return (
                statuses["agent"] != "skipped"
                and statuses["detection"] == "success"
                and statuses["validate_qa"] == "success"
            )

        for validator_result in ("failure", "skipped"):
            statuses = {"agent": "success", "detection": "success", "validate_qa": validator_result}
            self.assertFalse(may_publish(statuses), f"validator={validator_result}")
        self.assertTrue(may_publish({"agent": "success", "detection": "success", "validate_qa": "success"}))
        self.assertIn("- validate_qa", native)
        config_line = re.search(r'^          GH_AW_SAFE_OUTPUTS_HANDLER_CONFIG: (".*")$', native, re.M)[1]
        config = json.loads(json.loads(config_line))["submit_pull_request_review"]
        self.assertEqual(config["allowed_events"], ["COMMENT"])
        self.assertEqual(config["commit_id"], "${{ needs.preflight.outputs.head }}")
        self.assertEqual(config["target"], "${{ needs.preflight.outputs.pr }}")
        validator = job(text, "validate_qa")
        self.assertIn("gh_aw_policy.py --validate-output", validator)
        self.assertNotIn("pull-requests: write", validator)
        self.assertIn("needs.detection.result == 'success'", validator)

    def test_repair_app_can_trigger_only_the_trusted_qa_paths(self):
        source = (WORKFLOWS / "luxe-independent-qa.md").read_text()
        lock = (WORKFLOWS / "luxe-independent-qa.lock.yml").read_text()
        self.assertIn(
            'bots: ["${{ vars.LUXE_REPAIR_APP_BOT_LOGIN }}", "github-actions[bot]"]',
            source,
        )
        self.assertIn("types: [opened, reopened, synchronize]", source)
        self.assertIn("workflows: [CI]", source)
        self.assertIn('GH_AW_ALLOWED_BOTS: "${{ vars.LUXE_REPAIR_APP_BOT_LOGIN }},github-actions[bot]"', lock)
        pre_activation = job(lock, "pre_activation")
        self.assertIn("GH_AW_REQUIRED_ROLES: \"admin,maintainer,write\"", pre_activation)
        self.assertIn(
            'GH_AW_ALLOWED_BOTS: "${{ vars.LUXE_REPAIR_APP_BOT_LOGIN }},github-actions[bot]"',
            pre_activation,
        )
        self.assertIn("check_membership.cjs", pre_activation)
        activation = job(lock, "activation")
        self.assertIn("github.event.workflow_run.repository.id == github.repository_id", activation)
        self.assertIn("!(github.event.workflow_run.repository.fork)", activation)

    def test_repair_qa_relay_is_default_branch_and_provenance_gated(self):
        source = (WORKFLOWS / "luxe-qa-dispatch.yml").read_text()
        self.assertIn("workflows: [CI]", source)
        self.assertIn("branches: ['luxe-pilot/**']", source)
        self.assertIn("ref: master", source)
        self.assertIn("python3 .github/scripts/gh_aw_qa_dispatch.py", source)
        self.assertIn("contents: write", job(source, "dispatch"))
        self.assertIn("actions: read", job(source, "dispatch"))
        self.assertNotIn("pull-requests: write", source)

    def test_repair_secret_only_in_safe_output_and_no_extra_mutations(self):
        text = (WORKFLOWS / "luxe-bounded-repair.lock.yml").read_text()
        safe = job(text, "propose_repair")
        executable = "\n".join(line for line in text.splitlines() if not line.startswith("#"))
        self.assertEqual(executable.count("${{ secrets.LUXE_REPAIR_APP_PRIVATE_KEY }}"), 1)
        self.assertIn("private-key: ${{ secrets.LUXE_REPAIR_APP_PRIVATE_KEY }}", safe)
        self.assertIn("environment: luxe-gh-aw-repair", safe)
        self.assertIn("ref: ${{ github.workflow_sha }}", safe)
        self.assertIn("persist-credentials: false", safe)
        self.assertIn("permission-contents: write", safe)
        self.assertIn("permission-issues: write", safe)
        self.assertNotIn("permission-workflows:", safe)
        self.assertNotIn("permission-administration:", safe)
        self.assertIn("gh_aw_repair.py --apply", safe)
        self.assertIn("timeout-minutes: 2", safe)
        self.assertIn("needs.detection.result == 'success'", safe)
        self.assertNotIn("push_to_pull_request_branch", text)
        self.assertNotIn("assign_copilot", text)
        self.assertNotIn("merge_pull_request", text)
        source = (WORKFLOWS / "luxe-bounded-repair.md").read_text()
        self.assertIn(
            "run-name: THE LUXE Bounded Repair for ${{ github.event.workflow_run.head_branch }}",
            source,
        )
        self.assertIn(
            "run-name: THE LUXE Bounded Repair for ${{ github.event.workflow_run.head_branch }}",
            text,
        )
        agent = job(text, "agent")
        config_line = re.search(r'^          GH_AW_SAFE_OUTPUTS_CONFIG: (".*")$', agent, re.M)[1]
        inputs = json.loads(json.loads(config_line))["propose-repair"]["inputs"]
        self.assertEqual(set(inputs), {"binding", "content_base64", "path"})

    def test_default_policy_remains_disabled(self):
        policy = json.loads((ROOT / ".github/gh-aw-policy.json").read_text())
        self.assertIs(policy["qa_enabled"], False)
        self.assertIs(policy["repair_enabled"], False)
        self.assertEqual(policy["approver_ids"], [])
        self.assertEqual(policy["qa_reviewer_ids"], [])
        self.assertEqual(policy["qa_bot_ids"], [])
        self.assertIsNone(policy["repair_bot_id"])
        self.assertLessEqual(policy["max_qa_reviews_per_pr"], 6)
        controller = json.loads((ROOT / ".github/autonomy.json").read_text())
        self.assertIs(controller["enabled"], False)
        self.assertEqual(controller["max_repairs"], 0)


if __name__ == "__main__":
    unittest.main()
