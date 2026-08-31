from django.urls import path
from .views import PublishedTimetableView

urlpatterns = [
    path('', PublishedTimetableView.as_view(), name='published-timetable'),
]
