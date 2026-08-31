from rest_framework import serializers
from .models import StudentReport
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class StudentReportSerializer(serializers.ModelSerializer):
    student_details = UserSerializer(source='student', read_only=True)
    replied_by_details = UserSerializer(source='replied_by', read_only=True)

    class Meta:
        model = StudentReport
        fields = [
            'id', 'student', 'student_details', 'category', 'course', 'section', 
            'message', 'status', 'admin_reply', 'created_at', 'updated_at', 
            'replied_at', 'replied_by', 'replied_by_details'
        ]
        read_only_fields = [
            'student', 'status', 'admin_reply', 'created_at', 'updated_at', 
            'replied_at', 'replied_by'
        ]

class AdminReportSerializer(serializers.ModelSerializer):
    student_details = UserSerializer(source='student', read_only=True)
    replied_by_details = UserSerializer(source='replied_by', read_only=True)

    class Meta:
        model = StudentReport
        fields = '__all__'
        read_only_fields = [
            'student', 'category', 'course', 'section', 'message', 
            'created_at', 'updated_at', 'replied_at', 'replied_by'
        ]
