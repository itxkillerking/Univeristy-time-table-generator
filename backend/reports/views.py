from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from django.utils import timezone
from .models import StudentReport
from .serializers import StudentReportSerializer, AdminReportSerializer

class IsStudentUserGroup(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.groups.filter(name='Student').exists())

class IsAdminUserGroup(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.groups.filter(name='Admin').exists())

class StudentReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for students to create and view their own reports.
    """
    serializer_class = StudentReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentUserGroup]

    def get_queryset(self):
        # A Student may ONLY read their own reports
        return StudentReport.objects.filter(student=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    # Disable update/delete for students (they can only create and read)
    def update(self, request, *args, **kwargs):
        return Response({"error": "Method not allowed."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        
    def partial_update(self, request, *args, **kwargs):
        return Response({"error": "Method not allowed."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response({"error": "Method not allowed."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class AdminReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admins to view all reports and reply/update status.
    """
    queryset = StudentReport.objects.all().order_by('-created_at')
    serializer_class = AdminReportSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserGroup]

    def perform_update(self, serializer):
        # Automatically track who replied and when if admin_reply is changed
        instance = self.get_object()
        new_reply = serializer.validated_data.get('admin_reply')
        
        kwargs = {}
        if new_reply and new_reply != instance.admin_reply:
            kwargs['replied_at'] = timezone.now()
            kwargs['replied_by'] = self.request.user
            
        serializer.save(**kwargs)
