from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentReportViewSet, AdminReportViewSet

router = DefaultRouter()
router.register(r'reports', StudentReportViewSet, basename='student-reports')
router.register(r'admin/reports', AdminReportViewSet, basename='admin-reports')

urlpatterns = [
    path('', include(router.urls)),
]
