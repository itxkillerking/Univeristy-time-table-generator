from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, BasePermission
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from .models import AnalyticsEvent
import uuid

class IsAdminUserGroup(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.groups.filter(name='Admin').exists())

class TrackEventView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        payload = request.data
        
        # 1. Validate Payload Size / Type
        if not isinstance(payload, dict):
            return Response({"error": "Invalid payload format."}, status=400)
            
        session_id_str = payload.get('anonymous_session_id')
        event_type = payload.get('event_type')
        metadata = payload.get('metadata', {})
        
        if not session_id_str or not event_type:
            return Response({"error": "Missing required fields."}, status=400)
            
        # 2. Validate UUID
        try:
            session_uuid = uuid.UUID(session_id_str)
        except ValueError:
            return Response({"error": "Invalid session ID format."}, status=400)
            
        # 3. Validate Event Type
        allowed_events = dict(AnalyticsEvent.EVENT_TYPES).keys()
        if event_type not in allowed_events:
            return Response({"error": "Invalid event type."}, status=400)
            
        # 4. Limit Metadata
        if not isinstance(metadata, dict):
            metadata = {}
        
        # Only allow specific safe fields
        safe_metadata = {}
        if 'semester' in metadata and isinstance(metadata['semester'], str):
            safe_metadata['semester'] = metadata['semester'][:100]
            
        # Create Event
        AnalyticsEvent.objects.create(
            anonymous_session_id=session_uuid,
            event_type=event_type,
            metadata=safe_metadata
        )
        
        return Response({"status": "recorded"})


class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminUserGroup]
    
    def get(self, request):
        now = timezone.now()
        
        def get_stats_for_period(start_time):
            qs = AnalyticsEvent.objects.all()
            if start_time:
                qs = qs.filter(timestamp__gte=start_time)
                
            unique_sessions = qs.values('anonymous_session_id').distinct().count()
            timetables_generated = qs.filter(event_type='TIMETABLE_GENERATED').count()
            pdfs_generated = qs.filter(event_type='PDF_GENERATED').count()
            
            return {
                "unique_sessions": unique_sessions,
                "timetables_generated": timetables_generated,
                "pdfs_generated": pdfs_generated
            }
            
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        
        return Response({
            "today": get_stats_for_period(today_start),
            "seven_days": get_stats_for_period(seven_days_ago),
            "thirty_days": get_stats_for_period(thirty_days_ago),
            "all_time": get_stats_for_period(None)
        })
