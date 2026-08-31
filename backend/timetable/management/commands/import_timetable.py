import os
import json
import re
from datetime import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from timetable.models import TimetableDataset, Semester, Course, Section, Schedule

def parse_time(t_str):
    """Parse '08:00' to datetime.time"""
    return datetime.strptime(t_str, "%H:%M").time()

def resolve_course_identity(course_name, semester_name, catalogue_entries):
    # 1. Strip lab/schedule suffixes to get the core course name alias
    base_name = re.sub(r'\s*\((lab|2hr)\)', '', course_name, flags=re.IGNORECASE).strip().lower()
    
    # 2. Filter catalogue entries to ONLY those matching the exact semester
    semester_entries = [e for e in catalogue_entries if e['semester'] == semester_name]
    
    # 3. Search for a matching identity within this semester
    for entry in semester_entries:
        if (
            entry['courseName'].lower() == base_name or
            entry.get('shortName', '').lower() == base_name or
            any(alias.lower() == base_name for alias in entry['aliases'])
        ):
            return entry['courseName']
            
    # Fallback to the stripped raw name if not in catalogue
    return base_name

class Command(BaseCommand):
    help = 'Imports the JSON timetable into the Django relational models'

    def add_arguments(self, parser):
        parser.add_argument('json_path', type=str, help='Path to the timetable JSON file')
        parser.add_argument('catalogue_path', type=str, help='Path to courseCatalogue.ts')
        parser.add_argument('--dataset-name', type=str, default='FALL 2026', help='Name of the dataset')

    def parse_catalogue(self, filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        entries = []
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

    def handle(self, *args, **options):
        json_path = options['json_path']
        catalogue_path = options['catalogue_path']
        dataset_name = options['dataset_name']
        
        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f'JSON file not found: {json_path}'))
            return
            
        if not os.path.exists(catalogue_path):
            self.stdout.write(self.style.ERROR(f'Catalogue file not found: {catalogue_path}'))
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        classes = data.get('classes', [])
        
        catalogue_entries = self.parse_catalogue(catalogue_path)
        self.stdout.write(f"Parsed {len(catalogue_entries)} courses from catalogue.")

        with transaction.atomic():
            # Get or create Dataset
            dataset, _ = TimetableDataset.objects.get_or_create(
                name=dataset_name,
                defaults={'status': 'PUBLISHED'}
            )
            
            # Optionally clear existing records for this dataset to make it idempotent
            Semester.objects.filter(dataset=dataset).delete()
            
            records_created = 0
            
            for record in classes:
                sem_name = record['semester']
                sec_name = record['section']
                source_course_name = record['course_name']
                instructor = record['instructor']
                day = record['day']
                start_time_str = record['start_time']
                end_time_str = record['end_time']
                room = record['room']
                
                # Determine schedule type exactly as frontend does
                schedule_type = 'LAB' if re.search(r'\b(Lab|LAB)\b', source_course_name) else 'THEORY'
                
                canonical_name = resolve_course_identity(source_course_name, sem_name, catalogue_entries)
                
                # Get or Create Semester
                semester, _ = Semester.objects.get_or_create(
                    dataset=dataset,
                    name=sem_name
                )
                
                # Get or Create Course
                course, _ = Course.objects.get_or_create(
                    semester=semester,
                    canonical_name=canonical_name
                )
                
                # Get or Create Section
                section, _ = Section.objects.get_or_create(
                    course=course,
                    name=sec_name
                )
                
                # Create Schedule
                schedule, created = Schedule.objects.get_or_create(
                    section=section,
                    day=day,
                    start_time=parse_time(start_time_str),
                    end_time=parse_time(end_time_str),
                    room=room,
                    instructor=instructor,
                    source_course_name=source_course_name,
                    defaults={'schedule_type': schedule_type}
                )
                
                if created:
                    records_created += 1

            self.stdout.write(self.style.SUCCESS(f'Successfully imported {records_created} unique schedule records.'))
