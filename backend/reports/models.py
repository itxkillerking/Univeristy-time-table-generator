from django.db import models
from django.contrib.auth.models import User

class StudentReport(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('NOTED', 'Noted'),
        ('RESOLVED', 'Resolved'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    category = models.CharField(max_length=100)
    course = models.CharField(max_length=150, blank=True, null=True)
    section = models.CharField(max_length=50, blank=True, null=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    admin_reply = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    replied_at = models.DateTimeField(blank=True, null=True)
    replied_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='report_replies')

    def __str__(self):
        return f"{self.student.username} - {self.category} ({self.status})"
