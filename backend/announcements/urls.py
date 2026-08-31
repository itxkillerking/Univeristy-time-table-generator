from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicAnnouncementViewSet, AdminAnnouncementViewSet

router = DefaultRouter()
router.register(r'announcements', PublicAnnouncementViewSet, basename='public-announcements')
router.register(r'admin/announcements', AdminAnnouncementViewSet, basename='admin-announcements')

urlpatterns = [
    path('', include(router.urls)),
]
