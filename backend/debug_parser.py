import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from timetable.utils.pdf_parser import extract_timetable

def debug():
    frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    pdf_path = os.path.join(frontend_dir, 'CS&IT_Timetable_Fall 2026_V12 (WEF  31-08-2026)_260829_165254.pdf')
    
    with open(pdf_path, 'rb') as f:
        courses, stats, all_schedules = extract_timetable(f)
        
    print(f"Total schedule entries in all_schedules: {len(all_schedules)}")
    print(f"Total schedule entries from courses: {sum(len(s.schedules) for c in courses for s in c.sections)}")

if __name__ == '__main__':
    debug()
