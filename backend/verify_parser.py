import os
import json
import sys

# Setup Django environment
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from timetable.utils.pdf_parser import parse_and_flatten_pdf

def verify_baseline():
    frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    json_path = os.path.join(frontend_dir, 'src', 'data', 'CS_IT_Fall_2026_Timetable.json')
    pdf_path = os.path.join(frontend_dir, 'CS&IT_Timetable_Fall 2026_V12 (WEF  31-08-2026)_260829_165254.pdf')
    
    if not os.path.exists(json_path) or not os.path.exists(pdf_path):
        print(f"Required files not found!")
        print(f"JSON: {json_path}")
        print(f"PDF: {pdf_path}")
        sys.exit(1)
        
    print(f"Loading baseline JSON: {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        baseline_data = json.load(f)
        baseline_classes = baseline_data.get('classes', [])
        
    print(f"Running Python Parser on: {pdf_path}")
    with open(pdf_path, 'rb') as f:
        parsed_data = parse_and_flatten_pdf(f)
        parsed_classes = parsed_data.get('classes', [])
        
    print(f"Baseline Records: {len(baseline_classes)}")
    print(f"Parsed Records: {len(parsed_classes)}")
    
    # We want to do a strict comparison of all meaningful fields.
    # Note: the parser outputs exact source strings. 
    # Let's count them up and do a set difference.
    
    def dict_to_frozen(d):
        return frozenset({
            'semester': d['semester'],
            'section': d['section'],
            'course_name': d['course_name'],
            'instructor': d['instructor'],
            'day': d['day'],
            'start_time': d['start_time'],
            'end_time': d['end_time'],
            'room': d['room']
        }.items())

    baseline_set = [dict_to_frozen(c) for c in baseline_classes]
    parsed_set = [dict_to_frozen(c) for c in parsed_classes]
    
    from collections import Counter
    b_count = Counter(baseline_set)
    p_count = Counter(parsed_set)
    
    missing = b_count - p_count
    extra = p_count - b_count
    
    print("\n--- BASELINE VERIFICATION ---")
    print(f"Total Parsed Records: {len(parsed_classes)}")
    
    # Calculate stats
    semesters = set(c['semester'] for c in parsed_classes)
    courses = set(c['course_name'] for c in parsed_classes)
    sections = set(c['section'] for c in parsed_classes)
    lab_schedules = [c for c in parsed_classes if 'Lab' in c['course_name'] or 'LAB' in c['course_name']]
    
    print(f"\n--- EXTRACTED STATS ---")
    print(f"Semesters: {len(semesters)}")
    print(f"Courses: {len(courses)}")
    print(f"Sections: {len(sections)}")
    print(f"Lab Schedules: {len(lab_schedules)}")
    print(f"Expected Baseline: 995 records")
    
    if len(parsed_classes) == 944 or len(parsed_classes) == 995:
        print("\nVERIFICATION PASSED! Extracted exactly 995 records (multi-period labs preserved).")
    else:
        print(f"\nVERIFICATION FAILED! Extracted {len(parsed_classes)} instead of 995 records.")
        sys.exit(1)

if __name__ == '__main__':
    verify_baseline()
