from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User, Group
from .models import AnalyticsEvent
import uuid
import json

class AnalyticsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.track_url = reverse('track-event')
        self.admin_url = reverse('admin-analytics')
        
        # Create groups
        self.admin_group = Group.objects.create(name='Admin')
        self.student_group = Group.objects.create(name='Student')
        
        # Create users
        self.admin_user = User.objects.create_user(username='admin', password='123')
        self.admin_user.groups.add(self.admin_group)
        
        self.student_user = User.objects.create_user(username='student', password='123')
        self.student_user.groups.add(self.student_group)

    def test_anonymous_event_accepted(self):
        payload = {
            "anonymous_session_id": str(uuid.uuid4()),
            "event_type": "BUILDER_STARTED",
            "metadata": {"semester": "FALL 2026"}
        }
        response = self.client.post(self.track_url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(AnalyticsEvent.objects.count(), 1)
        event = AnalyticsEvent.objects.first()
        self.assertEqual(event.event_type, "BUILDER_STARTED")

    def test_invalid_event_rejected(self):
        payload = {
            "anonymous_session_id": str(uuid.uuid4()),
            "event_type": "HACK_DATABASE",
        }
        response = self.client.post(self.track_url, payload, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(AnalyticsEvent.objects.count(), 0)

    def test_missing_fields_rejected(self):
        response = self.client.post(self.track_url, {"event_type": "BUILDER_STARTED"}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_admin_sees_aggregated_stats(self):
        # Create 3 events from 2 unique sessions
        s1 = str(uuid.uuid4())
        s2 = str(uuid.uuid4())
        AnalyticsEvent.objects.create(anonymous_session_id=s1, event_type="BUILDER_STARTED")
        AnalyticsEvent.objects.create(anonymous_session_id=s1, event_type="TIMETABLE_GENERATED")
        AnalyticsEvent.objects.create(anonymous_session_id=s2, event_type="TIMETABLE_GENERATED")
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.admin_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['all_time']['unique_sessions'], 2)
        self.assertEqual(data['all_time']['timetables_generated'], 2)
        self.assertEqual(data['all_time']['pdfs_generated'], 0)

    def test_student_denied_admin_analytics(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.admin_url)
        self.assertEqual(response.status_code, 403)
