from django.db import models
from django.utils import timezone
import uuid

class AnalyticsEvent(models.Model):
    EVENT_TYPES = [
        ('BUILDER_STARTED', 'Builder Started'),
        ('TIMETABLE_GENERATED', 'Timetable Generated'),
        ('PDF_GENERATED', 'PDF Generated'),
    ]

    anonymous_session_id = models.UUIDField(db_index=True)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES, db_index=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['anonymous_session_id', 'event_type']),
            models.Index(fields=['timestamp', 'event_type']),
        ]

    def __str__(self):
        return f"{self.event_type} at {self.timestamp}"
