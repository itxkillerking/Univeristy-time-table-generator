from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User, Group
from .models import StudentReport

class ReportsAPITests(APITestCase):
    def setUp(self):
        # Create groups
        self.student_group, _ = Group.objects.get_or_create(name='Student')
        self.admin_group, _ = Group.objects.get_or_create(name='Admin')

        # Create student 1
        self.student1 = User.objects.create_user(username='student1', password='password123')
        self.student1.groups.add(self.student_group)

        # Create student 2
        self.student2 = User.objects.create_user(username='student2', password='password123')
        self.student2.groups.add(self.student_group)

        # Create admin
        self.admin = User.objects.create_user(username='admin', password='password123')
        self.admin.groups.add(self.admin_group)

        # URLs
        self.student_url = '/api/reports/'
        self.admin_url = '/api/admin/reports/'

    def test_unauthenticated_report_creation_fails(self):
        response = self.client.post(self.student_url, {
            'category': 'Bug',
            'message': 'Cannot see timetable'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_can_create_report(self):
        self.client.force_authenticate(user=self.student1)
        response = self.client.post(self.student_url, {
            'category': 'Bug',
            'message': 'Cannot see timetable'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StudentReport.objects.count(), 1)
        self.assertEqual(StudentReport.objects.first().student, self.student1)
        self.assertEqual(StudentReport.objects.first().status, 'OPEN')

    def test_student_report_isolation(self):
        # Student 1 creates a report
        StudentReport.objects.create(student=self.student1, category='Issue', message='Test 1')
        
        # Student 2 creates a report
        StudentReport.objects.create(student=self.student2, category='Issue', message='Test 2')

        # Student 1 checks reports
        self.client.force_authenticate(user=self.student1)
        response = self.client.get(self.student_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['message'], 'Test 1')

    def test_student_cannot_change_status_or_reply(self):
        report = StudentReport.objects.create(student=self.student1, category='Issue', message='Test 1')
        self.client.force_authenticate(user=self.student1)
        
        # Try to PUT update status
        response = self.client.put(f'{self.student_url}{report.id}/', {
            'status': 'RESOLVED',
            'admin_reply': 'Hacked'
        })
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Verify db unchanged
        report.refresh_from_db()
        self.assertEqual(report.status, 'OPEN')
        self.assertIsNone(report.admin_reply)

    def test_admin_can_manage_reports(self):
        report = StudentReport.objects.create(student=self.student1, category='Issue', message='Test 1')
        self.client.force_authenticate(user=self.admin)
        
        # Admin views reports
        response = self.client.get(self.admin_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Admin replies and marks resolved
        response = self.client.put(f'{self.admin_url}{report.id}/', {
            'student': self.student1.id,
            'category': 'Issue',
            'message': 'Test 1',
            'status': 'RESOLVED',
            'admin_reply': 'Fixed it for you.'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        report.refresh_from_db()
        self.assertEqual(report.status, 'RESOLVED')
        self.assertEqual(report.admin_reply, 'Fixed it for you.')
        self.assertEqual(report.replied_by, self.admin)
        self.assertIsNotNone(report.replied_at)
