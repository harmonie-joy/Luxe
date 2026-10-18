"""Explicit opt-in settings for isolated, local PostgreSQL browser verification."""

import os
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured

database_url = os.environ.get("E2E_DATABASE_URL", "")
database = urlparse(database_url)
if (
    database.scheme not in ("postgres", "postgresql")
    or database.hostname not in ("localhost", "127.0.0.1")
    or not database.path.startswith("/theluxe_e2e_")
    or os.environ.get("E2E_ALLOW_ISOLATED_DATABASE") != "1"
):
    raise ImproperlyConfigured(
        "E2E requires explicit E2E_ALLOW_ISOLATED_DATABASE=1 and E2E_DATABASE_URL "
        "pointing to a loopback PostgreSQL database named theluxe_e2e_*."
    )

# Override before importing settings so a developer .env cannot select another DB.
os.environ["DATABASE_URL"] = database_url
from .settings import *  # noqa: E402,F403

DEBUG = False
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
CORS_ALLOWED_ORIGINS = ["http://localhost:3154"]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
