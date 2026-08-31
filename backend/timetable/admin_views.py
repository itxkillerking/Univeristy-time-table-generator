from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import TimetableDataset, Semester, Course, Section, Schedule
import json
import re
from datetime import datetime
from django.utils import timezone
import uuid

# Custom Permission for Admin users
from rest_framework.permissions import BasePermission

class IsAdminUserGroup(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.groups.filter(name='Admin').exists())

class AdminTimetableStatusView(APIView):
    permission_classes = [IsAdminUserGroup]

    def get(self, request):
        dataset = TimetableDataset.objects.filter(status='PUBLISHED').first()
        if not dataset:
            return Response({"error": "No published timetable found."}, status=404)

        semesters = Semester.objects.filter(dataset=dataset).count()
        courses = Course.objects.filter(semester__dataset=dataset).count()
        sections = Section.objects.filter(course__semester__dataset=dataset).count()
        schedules = Schedule.objects.filter(section__course__semester__dataset=dataset).count()
        lab_schedules = Schedule.objects.filter(section__course__semester__dataset=dataset, schedule_type='LAB').count()

        return Response({
            "version": dataset.name,
            "lastUpdated": dataset.updated_at.isoformat(),
            "createdBy": dataset.created_by.username if dataset.created_by else "System",
            "semesters": semesters,
            "courses": courses,
            "sections": sections,
            "totalSchedules": schedules,
            "labSchedules": lab_schedules,
            "id": dataset.id
        })

class AdminTimetableVersionsView(APIView):
    permission_classes = [IsAdminUserGroup]

    def get(self, request):
        datasets = TimetableDataset.objects.all().order_by('-created_at')
        result = []
        for d in datasets:
            result.append({
                "id": d.id,
                "name": d.name,
                "status": d.status,
                "createdAt": d.created_at.isoformat(),
                "createdBy": d.created_by.username if d.created_by else "System",
                "recordCount": Schedule.objects.filter(section__course__semester__dataset=d).count(),
                "sectionCount": Section.objects.filter(course__semester__dataset=d).count()
            })
        return Response(result)

class AdminTimetableRollbackView(APIView):
    permission_classes = [IsAdminUserGroup]

    def post(self, request, dataset_id):
        try:
            target_dataset = TimetableDataset.objects.get(id=dataset_id)
        except TimetableDataset.DoesNotExist:
            return Response({"error": "Dataset not found."}, status=404)

        with transaction.atomic():
            TimetableDataset.objects.filter(status='PUBLISHED').update(status='ARCHIVED')
            target_dataset.status = 'PUBLISHED'
            target_dataset.save()
            
        return Response({"message": f"Successfully rolled back to version: {target_dataset.name}"})

def parse_time(t_str):
    return datetime.strptime(t_str, "%H:%M").time()

def get_catalogue_entries():
    # Helper to parse courseCatalogue.ts dynamically for canonical course names
    import os
    from django.conf import settings
    # The frontend is at BASE_DIR / '../frontend'
    base_dir = settings.BASE_DIR
    cat_path = os.path.join(base_dir, '..', 'frontend', 'src', 'data', 'courseCatalogue.ts')
    
    entries = []
    if not os.path.exists(cat_path):
        return entries
        
    with open(cat_path, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'\{([^\}]+)\}'
    for match in re.finditer(pattern, content):
        obj_str = match.group(1)
        if 'semester:' not in obj_str:
            continue
            
        semester_m = re.search(r'semester:\s*"([^"]+)"', obj_str)
        course_name_m = re.search(r'courseName:\s*"([^"]+)"', obj_str)
        short_name_m = re.search(r'shortName:\s*"([^"]+)"', obj_str)
        aliases_m = re.search(r'aliases:\s*(\[[^\]]*\])', obj_str)
        
        if semester_m and course_name_m:
            aliases = []
            if aliases_m:
                aliases = re.findall(r'"([^"]+)"', aliases_m.group(1))
            
            entries.append({
                'semester': semester_m.group(1),
                'courseName': course_name_m.group(1),
                'shortName': short_name_m.group(1) if short_name_m else '',
                'aliases': aliases
            })
    return entries

def resolve_course_identity(course_name, semester_name, catalogue_entries):
    base_name = re.sub(r'\s*\((lab|2hr)\)', '', course_name, flags=re.IGNORECASE).strip().lower()
    semester_entries = [e for e in catalogue_entries if e['semester'] == semester_name]
    
    for entry in semester_entries:
        if (
            entry['courseName'].lower() == base_name or
            entry.get('shortName', '').lower() == base_name or
            any(alias.lower() == base_name for alias in entry['aliases'])
        ):
            return entry['courseName']
            
    return base_name

class AdminTimetablePublishView(APIView):
    permission_classes = [IsAdminUserGroup]

    def post(self, request):
        payload = request.data
        classes = payload.get('classes', [])
        metadata = payload.get('metadata', {})
        base_version_id = request.data.get('base_version_id')

        if not classes:
            return Response({"error": "Empty timetable dataset provided."}, status=400)

        with transaction.atomic():
            # Stale version protection
            current_published = TimetableDataset.objects.select_for_update().filter(status='PUBLISHED').first()
            if current_published and base_version_id:
                if str(current_published.id) != str(base_version_id):
                    return Response({
                        "error": "This timetable changed after your review. Please reload and review the latest changes before publishing."
                    }, status=409)
            
            # Validation Step
            catalogue_entries = get_catalogue_entries()
            
            # Validate JSON Structure & Data before committing anything
            for i, record in enumerate(classes):
                required_fields = ['semester', 'section', 'course_name', 'instructor', 'day', 'start_time', 'end_time', 'room']
                for f in required_fields:
                    if f not in record:
                        return Response({"error": f"Missing field '{f}' in record index {i}."}, status=400)
                
                # Validate times
                try:
                    s_time = parse_time(record['start_time'])
                    e_time = parse_time(record['end_time'])
                    if s_time >= e_time:
                        return Response({"error": f"Record {i}: start_time must be before end_time."}, status=400)
                except ValueError:
                    return Response({"error": f"Record {i}: invalid time format. Use HH:MM."}, status=400)

            # Create new dataset version
            timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
            unique_suffix = uuid.uuid4().hex[:6]
            # Generate a new unique name.
            new_dataset_name = metadata.get('title', f"Timetable Update") + f" - v{timestamp}_{unique_suffix}"
            
            # Check if this exact dataset is completely identical to current_published
            # We can do this efficiently by comparing the count and the canonical set
            # But the requirement allows checking count first, and for safety we'll just insert.
            
            dataset = TimetableDataset.objects.create(
                name=new_dataset_name,
                status='PUBLISHED',
                created_by=request.user
            )

            for record in classes:
                sem_name = record['semester']
                sec_name = record['section']
                source_course_name = record['course_name']
                instructor = record['instructor']
                day = record['day']
                start_time_str = record['start_time']
                end_time_str = record['end_time']
                room = record['room']
                
                schedule_type = 'LAB' if re.search(r'\b(Lab|LAB)\b', source_course_name) else 'THEORY'
                canonical_name = resolve_course_identity(source_course_name, sem_name, catalogue_entries)
                
                semester, _ = Semester.objects.get_or_create(dataset=dataset, name=sem_name)
                course, _ = Course.objects.get_or_create(semester=semester, canonical_name=canonical_name)
                section, _ = Section.objects.get_or_create(course=course, name=sec_name)
                
                # Use get_or_create to silently ignore duplicate exact records within the same payload if they somehow exist
                Schedule.objects.get_or_create(
                    section=section,
                    day=day,
                    start_time=parse_time(start_time_str),
                    end_time=parse_time(end_time_str),
                    room=room,
                    instructor=instructor,
                    source_course_name=source_course_name,
                    defaults={'schedule_type': schedule_type}
                )

            # Archive the old ones
            if current_published:
                TimetableDataset.objects.filter(id=current_published.id).update(status='ARCHIVED')

        return Response({"message": "Timetable successfully published.", "new_version_id": dataset.id})

from rest_framework.parsers import MultiPartParser, FormParser
from .utils.pdf_parser import parse_and_flatten_pdf

class AdminTimetableImportPdfView(APIView):
    """
    Accepts a PDF upload, processes it using the Python parser,
    and returns a structured JSON payload that the frontend can preview.
    """
    permission_classes = [IsAdminUserGroup]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if not file_obj.name.lower().endswith('.pdf'):
            return Response({"error": "Only PDF files are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        # 5MB limit
        if file_obj.size > 5 * 1024 * 1024:
            return Response({"error": "File size exceeds 5MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed_data = parse_and_flatten_pdf(file_obj)
            return Response(parsed_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to parse PDF: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
