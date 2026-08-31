import json
from django.core.management.base import BaseCommand
from timetable.models import TimetableDataset, Schedule

class Command(BaseCommand):
    help = 'Verifies the Django database exactly matches the source JSON'

    def add_arguments(self, parser):
        parser.add_argument('json_path', type=str, help='Path to the timetable JSON file')
        parser.add_argument('--dataset-name', type=str, default='FALL 2026', help='Name of the dataset')

    def handle(self, *args, **options):
        json_path = options['json_path']
        dataset_name = options['dataset_name']

        try:
            dataset = TimetableDataset.objects.get(name=dataset_name, status='PUBLISHED')
        except TimetableDataset.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"No PUBLISHED dataset found with name {dataset_name}"))
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        source_classes = data.get('classes', [])
        
        # Build canonical list of strings for exact match comparison
        def make_canonical(c):
            return json.dumps({
                "semester": c["semester"],
                "section": c["section"],
                "course_name": c["course_name"],
                "instructor": c["instructor"],
                "day": c["day"],
                "start_time": c["start_time"],
                "end_time": c["end_time"],
                "room": c["room"]
            }, sort_keys=True)
            
        source_set = [make_canonical(c) for c in source_classes]
        source_set.sort()
        
        # Query Django
        db_schedules = Schedule.objects.filter(section__course__semester__dataset=dataset)
        
        db_classes = []
        for s in db_schedules:
            db_classes.append({
                "semester": s.section.course.semester.name,
                "section": s.section.name,
                "course_name": s.source_course_name,
                "instructor": s.instructor,
                "day": s.day,
                "start_time": s.start_time.strftime("%H:%M"),
                "end_time": s.end_time.strftime("%H:%M"),
                "room": s.room
            })
            
        db_set = [make_canonical(c) for c in db_classes]
        db_set.sort()
        
        source_count = len(source_set)
        db_count = len(db_set)
        
        self.stdout.write(f"SOURCE COUNT: {source_count}")
        self.stdout.write(f"DATABASE COUNT: {db_count}")
        
        if source_count != db_count:
            self.stdout.write(self.style.ERROR("COUNT MISMATCH!"))
            return
            
        differences = 0
        for i in range(source_count):
            if source_set[i] != db_set[i]:
                differences += 1
                self.stdout.write(self.style.ERROR(f"MISMATCH at index {i}:"))
                self.stdout.write(f"Source: {source_set[i]}")
                self.stdout.write(f"DB:     {db_set[i]}")
                
        if differences == 0:
            self.stdout.write(self.style.SUCCESS("VERIFICATION PASSED! ZERO missing, ZERO extra, ZERO changed values."))
        else:
            self.stdout.write(self.style.ERROR(f"VERIFICATION FAILED! {differences} differences found."))
