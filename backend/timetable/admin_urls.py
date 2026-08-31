from django.urls import path
from .admin_views import (
    AdminTimetableStatusView,
    AdminTimetableVersionsView,
    AdminTimetablePublishView,
    AdminTimetableRollbackView,
    AdminTimetableImportPdfView
)

urlpatterns = [
    path('status/', AdminTimetableStatusView.as_view(), name='admin-timetable-status'),
    path('versions/', AdminTimetableVersionsView.as_view(), name='admin-timetable-versions'),
    path('publish/', AdminTimetablePublishView.as_view(), name='admin-timetable-publish'),
    path('rollback/<int:dataset_id>/', AdminTimetableRollbackView.as_view(), name='admin-timetable-rollback'),
    path('import-pdf/', AdminTimetableImportPdfView.as_view(), name='admin-timetable-import-pdf'),
]
