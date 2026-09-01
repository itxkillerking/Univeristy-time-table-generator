from django.urls import path
from .views import TrackEventView

urlpatterns = [
    path('events/', TrackEventView.as_view(), name='track-event'),
]
