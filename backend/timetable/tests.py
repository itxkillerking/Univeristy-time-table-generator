from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from .models import TimetableDataset, Semester, Course, Section, Schedule
import json

class TimetableAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(username='admin', password='password')
        self.student_user = User.objects.create_user(username='student', password='password')
        
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        student_group, _ = Group.objects.get_or_create(name='Student')
        
        self.admin_user.groups.add(admin_group)
        self.student_user.groups.add(student_group)
        
        self.valid_payload = {
            "metadata": {"title": "Test V1"},
            "classes": [
                {
                    "semester": "1st Semester",
                    "section": "A",
                    "course_name": "Intro to CS",
                    "instructor": "Dr. Smith",
                    "day": "Monday",
                    "start_time": "08:00",
                    "end_time": "09:00",
                    "room": "Room 101"
                }
            ]
        }

    def test_unauthenticated_post_publish(self):
        response = self.client.post('/api/admin/timetable/publish/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, 401)

    def test_student_post_publish(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post('/api/admin/timetable/publish/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, 403)

    def test_admin_post_publish(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/admin/timetable/publish/', self.valid_payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(TimetableDataset.objects.filter(status='PUBLISHED').count(), 1)
        self.assertEqual(Schedule.objects.count(), 1)

    def test_rollback(self):
        self.client.force_authenticate(user=self.admin_user)
        # Publish version A
        res_a = self.client.post('/api/admin/timetable/publish/', self.valid_payload, format='json')
        id_a = res_a.json()['new_version_id']
        
        # Publish version B
        payload_b = self.valid_payload.copy()
        payload_b['classes'][0]['room'] = 'Room 102'
        res_b = self.client.post('/api/admin/timetable/publish/', payload_b, format='json')
        id_b = res_b.json()['new_version_id']
        
        # Rollback to A
        res_rollback = self.client.post(f'/api/admin/timetable/rollback/{id_a}/')
        self.assertEqual(res_rollback.status_code, 200)
        
        dataset_a = TimetableDataset.objects.get(id=id_a)
        dataset_b = TimetableDataset.objects.get(id=id_b)
        
        self.assertEqual(dataset_a.status, 'PUBLISHED')
        self.assertEqual(dataset_b.status, 'ARCHIVED')

    def test_stale_version_protection(self):
        self.client.force_authenticate(user=self.admin_user)
        res_a = self.client.post('/api/admin/timetable/publish/', self.valid_payload, format='json')
        id_a = res_a.json()['new_version_id']
        
        # Another admin publishes version B based on an older id
        payload_b = self.valid_payload.copy()
        payload_b['base_version_id'] = 99999 # Wrong ID
        res_b = self.client.post('/api/admin/timetable/publish/', payload_b, format='json')
        
        self.assertEqual(res_b.status_code, 409)
        self.assertIn("changed after your review", res_b.json()['error'])

    def test_import_malformed_record(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "metadata": {"title": "Test"},
            "classes": [
                {
                    "semester": "1st Semester",
                    "section": "A",
                    # Missing fields
                }
            ]
        }
        res = self.client.post('/api/admin/timetable/publish/', payload, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn("Missing field", res.json()['error'])
        
    def test_multi_period_lab(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "metadata": {"title": "Test Lab"},
            "classes": [
                {
                    "semester": "1st Semester", "section": "A", "course_name": "CS Lab",
                    "instructor": "Dr. Smith", "day": "Monday", "start_time": "14:00", "end_time": "15:15", "room": "Lab 1"
                },
                {
                    "semester": "1st Semester", "section": "A", "course_name": "CS Lab",
                    "instructor": "Dr. Smith", "day": "Monday", "start_time": "15:30", "end_time": "16:45", "room": "Lab 1"
                }
            ]
        }
        res = self.client.post('/api/admin/timetable/publish/', payload, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Schedule.objects.filter(section__course__semester__name="1st Semester").count(), 2)

    def test_semester_isolation(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "metadata": {"title": "Test isolation"},
            "classes": [
                {
                    "semester": "3rd Semester", "section": "A", "course_name": "Computer Networks",
                    "instructor": "Dr. A", "day": "Monday", "start_time": "14:00", "end_time": "15:15", "room": "R1"
                },
                {
                    "semester": "6th Semester", "section": "A", "course_name": "Computer Networks",
                    "instructor": "Dr. B", "day": "Tuesday", "start_time": "14:00", "end_time": "15:15", "room": "R1"
                }
            ]
        }
        res = self.client.post('/api/admin/timetable/publish/', payload, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Course.objects.count(), 2) # Should be two distinct courses

    def test_admin_api_status(self):
        self.client.force_authenticate(user=self.admin_user)
        self.client.post('/api/admin/timetable/publish/', self.valid_payload, format='json')
        res = self.client.get('/api/admin/timetable/status/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['totalSchedules'], 1)
        self.assertEqual(res.json()['courses'], 1)

    def test_student_api_read_only(self):
        self.client.force_authenticate(user=self.admin_user)
        self.client.post('/api/admin/timetable/publish/', self.valid_payload, format='json')
        
        # Students should be able to read from the public endpoint
        self.client.force_authenticate(user=self.student_user)
        res = self.client.get('/api/timetable/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()['classes']), 1)

    def test_pdf_import_unauthorized(self):
        # Unauthenticated
        with open('../frontend/CS&IT_Timetable_Fall 2026_V12 (WEF  31-08-2026)_260829_165254.pdf', 'rb') as f:
            res = self.client.post('/api/admin/timetable/import-pdf/', {'file': f})
        self.assertEqual(res.status_code, 401)
        
        # Student
        self.client.force_authenticate(user=self.student_user)
        with open('../frontend/CS&IT_Timetable_Fall 2026_V12 (WEF  31-08-2026)_260829_165254.pdf', 'rb') as f:
            res = self.client.post('/api/admin/timetable/import-pdf/', {'file': f})
        self.assertEqual(res.status_code, 403)

    def test_pdf_import_invalid_file(self):
        self.client.force_authenticate(user=self.admin_user)
        from django.core.files.uploadedfile import SimpleUploadedFile
        fake_file = SimpleUploadedFile("fake.txt", b"file_content", content_type="text/plain")
        res = self.client.post('/api/admin/timetable/import-pdf/', {'file': fake_file})
        self.assertEqual(res.status_code, 400)
        self.assertIn("Only PDF files", res.json()['error'])
