from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github/workflows"


class IndependentQAWorkflowTests(unittest.TestCase):
    def test_only_the_current_independent_qa_workflow_is_installed(self):
        qa_sources = sorted(
            path.name for path in WORKFLOWS.glob("*.md")
            if "name: THE LUXE Independent QA" in path.read_text()
        )
        self.assertEqual(qa_sources, ["luxe-independent-qa.md"])
        self.assertFalse((WORKFLOWS / "autonomous-qa.lock.yml").exists())
        self.assertTrue((WORKFLOWS / "luxe-independent-qa.lock.yml").is_file())


if __name__ == "__main__":
    unittest.main()
