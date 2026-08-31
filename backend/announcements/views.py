from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from .models import Announcement
from .serializers import AnnouncementSerializer

class IsAdminUserGroup(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.groups.filter(name='Admin').exists())

class PublicAnnouncementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public ViewSet for Announcements. Returns only PUBLISHED announcements.
    No authentication required.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Announcement.objects.filter(status='PUBLISHED').order_by('-created_at')


class AdminAnnouncementViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing Announcements.
    """
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserGroup]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # Do not permanently delete published announcements. Archive them instead.
        instance = self.get_object()
        instance.status = 'ARCHIVED'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
