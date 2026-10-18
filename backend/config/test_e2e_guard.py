"""No database connection: rejection must happen before base settings are imported."""

import os
from pathlib import Path
import runpy
import unittest
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured


class E2EDatabaseGuardTests(unittest.TestCase):
    def reject(self, url, opt_in="1"):
        with patch.dict(os.environ, {"E2E_DATABASE_URL": url, "E2E_ALLOW_ISOLATED_DATABASE": opt_in}):
            with self.assertRaisesRegex(ImproperlyConfigured, "E2E requires explicit"):
                runpy.run_path(str(Path(__file__).with_name("e2e_settings.py")))

    def test_missing_opt_in(self):
        self.reject("postgres://localhost/theluxe_e2e_guard", "")

    def test_non_postgresql(self):
        self.reject("sqlite:////tmp/theluxe_e2e_guard")

    def test_non_loopback(self):
        self.reject("postgres://database.example.invalid/theluxe_e2e_guard")

    def test_unprefixed_database(self):
        self.reject("postgres://localhost/theluxe")

    def test_query_cannot_override_database(self):
        self.reject("postgres://localhost/theluxe_e2e_guard?dbname=theluxe")

    def test_fragments_are_rejected(self):
        self.reject("postgres://localhost/theluxe_e2e_guard#unexpected")


if __name__ == "__main__":
    unittest.main()
