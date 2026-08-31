from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User, Group
from .models import Announcement

class AnnouncementsAPITests(APITestCase):
    def setUp(self):
        self.student_group, _ = Group.objects.get_or_create(name='Student')
        self.admin_group, _ = Group.objects.get_or_create(name='Admin')

        self.student = User.objects.create_user(username='student', password='password123')
        self.student.groups.add(self.student_group)

        self.admin = User.objects.create_user(username='admin', password='password123')
        self.admin.groups.add(self.admin_group)

        self.public_url = '/api/announcements/'
        self.admin_url = '/api/admin/announcements/'

    def test_public_can_read_published_announcements(self):
        Announcement.objects.create(title='Pub', content='1', status='PUBLISHED')
        Announcement.objects.create(title='Draft', content='2', status='DRAFT')
        
        response = self.client.get(self.public_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Pub')

    def test_student_cannot_manage_announcements(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.admin_url, {
            'title': 'Hack',
            'content': 'I am admin now',
            'status': 'PUBLISHED'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_publish_and_archive(self):
        self.client.force_authenticate(user=self.admin)
        
        # Create
        response = self.client.post(self.admin_url, {
            'title': 'New Update',
            'content': 'Hello',
            'status': 'DRAFT'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ann_id = response.data['id']
        
        # Publish
        response = self.client.put(f'{self.admin_url}{ann_id}/', {
            'title': 'New Update',
            'content': 'Hello',
            'status': 'PUBLISHED'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'PUBLISHED')
        
        # Archive (Delete method)
        response = self.client.delete(f'{self.admin_url}{ann_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify it was archived, not deleted
        ann = Announcement.objects.get(id=ann_id)
        self.assertEqual(ann.status, 'ARCHIVED')
