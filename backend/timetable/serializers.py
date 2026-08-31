from rest_framework import serializers
from .models import Schedule, TimetableDataset

class TimetableScheduleSerializer(serializers.ModelSerializer):
    semester = serializers.CharField(source='section.course.semester.name')
    section = serializers.CharField(source='section.name')
    course_name = serializers.CharField(source='source_course_name')
    start_time = serializers.SerializerMethodField()
    end_time = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = [
            'semester',
            'section',
            'course_name',
            'instructor',
            'day',
            'start_time',
            'end_time',
            'room'
        ]

    def get_start_time(self, obj):
        return obj.start_time.strftime("%H:%M")

    def get_end_time(self, obj):
        return obj.end_time.strftime("%H:%M")
