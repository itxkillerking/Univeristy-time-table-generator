from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import TimetableDataset, Schedule
from .serializers import TimetableScheduleSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class PublishedTimetableView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(cache_page(60 * 15)) # Cache for 15 minutes
    def get(self, request):
        try:
            # Only serve the currently published dataset
            dataset = TimetableDataset.objects.get(status='PUBLISHED')
        except TimetableDataset.DoesNotExist:
            return Response(
                {"error": "No published timetable available."},
                status=404
            )
        except TimetableDataset.MultipleObjectsReturned:
            dataset = TimetableDataset.objects.filter(status='PUBLISHED').first()

        # Prefetch to avoid N+1 queries during serialization
        schedules = Schedule.objects.filter(
            section__course__semester__dataset=dataset
        ).select_related('section', 'section__course', 'section__course__semester')
        
        serializer = TimetableScheduleSerializer(schedules, many=True)
        
        # Return exact format expected by frontend loader
        return Response({
            "metadata": {
                "title": f"Django API - {dataset.name}",
                "source": "Django Database REST API",
                "record_count": len(schedules),
            },
            "classes": serializer.data
        })
