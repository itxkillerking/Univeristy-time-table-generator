from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Core Health Endpoint
    path('api/health/', include('core.urls')),
    
    # Authentication Endpoints
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/', include('accounts.urls')),

    # Timetable Endpoints
    path('api/timetable/', include('timetable.urls')),
    path('api/', include('reports.urls')),
    path('api/', include('announcements.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/admin/timetable/', include('timetable.admin_urls')),
    path('api/admin/analytics/', include('analytics.admin_urls')),
]
