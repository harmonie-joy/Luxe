import threading
import time
import uuid
from unittest import skipUnless
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError, close_old_connections, connection, transaction
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from brand.models import BrandProfile, BrandVoice, BrandVoiceApproval
from tenancy.models import Membership, Workspace

from .models import ContentItem, ExecutionCheckpoint, Project


User = get_user_model()


@skipUnless(
    connection.vendor == "postgresql", "requires a PostgreSQL test database"
)
class PostgreSQLCheckpointConcurrencyTest(TransactionTestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="postgres_creator", password="pass")
        self.workspace = Workspace.objects.create(name="PostgreSQL workspace")
        Membership.objects.create(
            user=self.user, workspace=self.workspace, role=Membership.Role.EDITOR
        )
        self.profile = BrandProfile.objects.create(
            workspace=self.workspace, name="PostgreSQL brand"
        )
        self.voice = BrandVoice.objects.create(
            brand_profile=self.profile, version=1, is_active=True
        )
        BrandVoiceApproval.objects.create(
            workspace=self.workspace,
            voice=self.voice,
            approved_by=self.user,
            approved_by_identifier=str(self.user.pk),
        )
        self.client.force_authenticate(user=self.user)
        self.project = Project.objects.create(
            workspace=self.workspace, name="PostgreSQL project", created_by=self.user
        )
        self.item = ContentItem.objects.create(
            project=self.project,
            brand_profile=self.profile,
            brand_voice=self.voice,
            created_by=self.user,
            title="Concurrent post",
            goal="Initial goal",
            workflow_stage="idea",
            next_action="Start",
        )
        ExecutionCheckpoint.objects.create(
            content_item=self.item,
            revision=1,
            client_request_id=uuid.uuid4(),
            goal=self.item.goal,
            workflow_stage=self.item.workflow_stage,
            next_action=self.item.next_action,
            created_by=self.user,
        )

    def payload(self, request_id, goal):
        return {
            "expected_revision": 1,
            "client_request_id": str(request_id),
            "goal": goal,
            "workflow_stage": "drafting",
            "next_action": "Review",
            "decisions": [goal],
            "open_questions": [],
        }

    def test_postgresql_row_lock_blocks_a_second_connection(self):
        locked = threading.Event()
        contender_started = threading.Event()
        contender_acquired = threading.Event()
        release = threading.Event()
        errors = []

        def lock_item():
            close_old_connections()
            try:
                with transaction.atomic():
                    ContentItem.objects.select_for_update().get(pk=self.item.pk)
                    locked.set()
                    release.wait(timeout=10)
            except Exception as error:
                errors.append(error)
            finally:
                close_old_connections()

        def contend_for_item():
            close_old_connections()
            try:
                self.assertTrue(locked.wait(timeout=10))
                contender_started.set()
                with transaction.atomic():
                    ContentItem.objects.select_for_update().get(pk=self.item.pk)
                    contender_acquired.set()
            except Exception as error:
                errors.append(error)
            finally:
                close_old_connections()

        holder = threading.Thread(target=lock_item)
        contender = threading.Thread(target=contend_for_item)
        holder.start()
        contender.start()
        try:
            self.assertTrue(locked.wait(timeout=10))
            self.assertTrue(contender_started.wait(timeout=10))
            time.sleep(0.1)
            self.assertFalse(contender_acquired.is_set())
        finally:
            release.set()
        holder.join(timeout=10)
        contender.join(timeout=10)
        self.assertFalse(holder.is_alive())
        self.assertFalse(contender.is_alive())
        self.assertEqual(errors, [])
        self.assertTrue(contender_acquired.is_set())

    def test_postgresql_checkpoint_failure_rolls_back_the_item_update(self):
        with patch(
            "content.views.ExecutionCheckpoint.objects.create",
            side_effect=IntegrityError("forced checkpoint failure"),
        ):
            with self.assertRaises(IntegrityError):
                self.client.post(
                    f"/api/content-items/{self.item.id}/checkpoint/",
                    self.payload(uuid.uuid4(), "Failed update"),
                    format="json",
                )
        self.item.refresh_from_db()
        self.assertEqual(self.item.revision, 1)
        self.assertEqual(self.item.goal, "Initial goal")
        self.assertEqual(ExecutionCheckpoint.objects.filter(content_item=self.item).count(), 1)

    def test_two_postgresql_connections_preserve_one_checkpoint_and_conflict(self):
        barrier = threading.Barrier(2)
        results = []
        results_lock = threading.Lock()
        attempts = [
            (uuid.uuid4(), "Writer one"),
            (uuid.uuid4(), "Writer two"),
        ]

        def writer(request_id, goal):
            close_old_connections()
            client = APIClient()
            client.force_authenticate(user=self.user)
            try:
                barrier.wait(timeout=10)
                response = client.post(
                    f"/api/content-items/{self.item.id}/checkpoint/",
                    self.payload(request_id, goal),
                    format="json",
                )
                with results_lock:
                    results.append((request_id, goal, response.status_code, response.data))
            finally:
                close_old_connections()

        threads = [threading.Thread(target=writer, args=attempt) for attempt in attempts]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=15)
            self.assertFalse(thread.is_alive(), "concurrent checkpoint writer did not finish")

        self.assertCountEqual([result[2] for result in results], [201, 409])
        winner = next(result for result in results if result[2] == 201)
        loser = next(result for result in results if result[2] == 409)
        self.assertEqual(loser[3]["code"], "stale_revision")

        self.item.refresh_from_db()
        self.assertEqual(self.item.revision, 2)
        self.assertEqual(self.item.goal, winner[1])
        self.assertEqual(ExecutionCheckpoint.objects.filter(content_item=self.item).count(), 2)

        retry = self.client.post(
            f"/api/content-items/{self.item.id}/checkpoint/",
            self.payload(winner[0], winner[1]),
            format="json",
        )
        self.assertEqual(retry.status_code, 201, retry.data)
        self.assertEqual(ExecutionCheckpoint.objects.filter(content_item=self.item).count(), 2)

        conflicting_retry = self.client.post(
            f"/api/content-items/{self.item.id}/checkpoint/",
            self.payload(winner[0], "Different retry"),
            format="json",
        )
        self.assertEqual(conflicting_retry.status_code, 409)
        self.assertEqual(conflicting_retry.data["code"], "idempotency_key_reused")
        self.assertEqual(ExecutionCheckpoint.objects.filter(content_item=self.item).count(), 2)

        outsider = User.objects.create_user(username="postgres_outsider", password="pass")
        other_workspace = Workspace.objects.create(name="Other PostgreSQL workspace")
        Membership.objects.create(user=outsider, workspace=other_workspace)
        self.client.force_authenticate(user=outsider)
        self.assertEqual(
            self.client.get(f"/api/content-items/{self.item.id}/context/").status_code,
            404,
        )
