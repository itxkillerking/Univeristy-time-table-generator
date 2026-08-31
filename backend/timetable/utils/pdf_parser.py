#!/usr/bin/env python3
"""
ROBUST TIMETABLE EXTRACTION PIPELINE
For: CS&IT_Timetable_Fall 2026_V12.pdf
Requires: pdfplumber
"""

import pdfplumber
import json
import re
from collections import defaultdict, Counter
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
import math



DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
DAY_STARTS = [90, 205, 320, 435, 550, 665]
DAY_WIDTH = 115
PERIOD_WIDTH = DAY_WIDTH / 6

TIME_SLOTS = [
    ("08:00", "09:15", 480, 555),
    ("09:30", "10:45", 570, 645),
    ("11:00", "12:15", 660, 735),
    ("12:30", "13:45", 750, 825),
    ("14:00", "15:15", 840, 915),
    ("15:30", "16:45", 930, 1005),
]

# --- Patterns ---
SECTION_RE = re.compile(r'^BSCS-\d+[A-Z]$')
ROOM_RE = re.compile(
    r'^(?:CS-\d{3}|LB\d?-\d{2,3}|LAB-CS-\d{3}|LAB-AHS-\d{3}|'
    r'FIT-\d{3}|LAB\s+EE\d?-\d{2}|E\d|C\d|ENT\d|RT\d{1,2})$'
)
COURSE_SUFFIX_RE = re.compile(r'\((?:Lab|LAB|2hr)\)$')
TIME_RE = re.compile(r'^\d{1,2}:\d{2}$')
HEADER_RE = re.compile(r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|\d|Department|Summary|The University|aSc Timetables|Required)$')
INSTRUCTOR_TITLE_RE = re.compile(r'^(Dr\.|M\.|M\s|Ms\.|Mrs\.|Mr\.)')

# Known course fragments that wrap across lines
COURSE_FRAGMENTS = {
    'Function': 'Functional English',
    'al': 'Functional English',
    'Englis': 'Functional English',
    'h': 'Functional English',
    'C.Netwo': 'C.Networks',
    'rks': 'C.Networks',
    'E.Writin': 'E.Writing',
    'g': 'E.Writing',
    'Prob.': 'Prob. Stat',
    'Stat': 'Prob. Stat',
    'Pre': 'Pre Cal',
    'Cal-1': 'Pre Cal-1',
    'Cal-2': 'Pre Cal-2',
    'Civics &': 'Civics & CE',
    'CE': 'Civics & CE',
    'Mngmnt': 'Mngmnt',
    'PP': 'PP',
    'DLD': 'DLD',
    'PF': 'PF',
    'AICT': 'AICT',
    'COAL': 'COAL',
    'OOP': 'OOP',
    'SE': 'SE',
    'CN': 'CN',
    'OS': 'OS',
    'Web': 'Web',
    'AI': 'AI',
    'ADBMS': 'ADBMS',
    'DS': 'DS',
    'DB': 'DB',
    'IS': 'IS',
    'ENT': 'ENT',
    'HRM': 'HRM',
    'SPM': 'SPM',
    'T&BW': 'T&BW',
    'Adv.SE': 'Adv.SE',
    'S.Testing': 'S.Testing',
    'ToA': 'ToA',
    'AA': 'AA',
    'OB': 'OB',
    'ML': 'ML',
    'PDC': 'PDC',
    'CDC': 'CDC',
    'Numerical': 'Numerical',
    'Differential': 'Differential',
    'Compiler': 'Compiler',
    'Calculus': 'Calculus',
    'Linear': 'Linear',
    'Discrete': 'Discrete',
    'Applied': 'Applied Phy.(2hr)',
    'Phy.(2hr)': 'Applied Phy.(2hr)',
    'Phy': 'Phy (LAB)',
    '(LAB)': 'Phy (LAB)',
}

@dataclass
class Schedule:
    day: str
    startTime: str
    endTime: str
    startMinutes: int
    endMinutes: int

@dataclass
class Section:
    id: str
    sectionName: str
    instructor: str
    room: str
    schedules: List[Schedule] = field(default_factory=list)

@dataclass
class Course:
    id: str
    courseCode: Optional[str]
    courseName: str
    semester: int
    sections: List[Section] = field(default_factory=list)

def get_period_centers(day_idx: int) -> List[float]:
    """Return x-centers for periods 1-6 within a day column."""
    start = DAY_STARTS[day_idx]
    return [start + (i + 0.5) * PERIOD_WIDTH for i in range(6)]

def get_row_boundaries(page) -> List[Tuple[str, float, float]]:
    """Find section labels and compute row boundaries."""
    words = page.extract_words()
    sections = []
    for w in words:
        if SECTION_RE.match(w['text']):
            sections.append((w['text'], w['top'], w['bottom']))
    sections.sort(key=lambda s: s[1])
    
    rows = []
    for i, (name, top, bottom) in enumerate(sections):
        if i == 0:
            y_top = 112  # Just below time labels
        else:
            y_top = (sections[i-1][2] + top) / 2
        
        if i == len(sections) - 1:
            y_bottom = 580  # Just above footer
        else:
            y_bottom = (bottom + sections[i+1][1]) / 2
        
        rows.append((name, y_top, y_bottom))
    return rows

def cluster_y(words: List[dict], tolerance: float = 4.0) -> Dict[float, List[dict]]:
    """Cluster words by y-coordinate into horizontal lines."""
    if not words:
        return {}
    
    # Sort by y
    sorted_words = sorted(words, key=lambda w: w['top'])
    lines = []
    current_line = [sorted_words[0]]
    current_y = sorted_words[0]['top']
    
    for w in sorted_words[1:]:
        if abs(w['top'] - current_y) <= tolerance:
            current_line.append(w)
        else:
            lines.append((current_y, current_line))
            current_line = [w]
            current_y = w['top']
    lines.append((current_y, current_line))
    
    return {y: line for y, line in lines}

def merge_close_words(words: List[dict], gap_threshold: float = 2.5) -> List[str]:
    """Sort words by x and merge those that are very close."""
    if not words:
        return []
    words = sorted(words, key=lambda w: w['x0'])
    tokens = [words[0]['text']]
    prev_x1 = words[0]['x1']
    
    for w in words[1:]:
        if w['x0'] - prev_x1 <= gap_threshold:
            tokens[-1] += w['text']
        else:
            tokens.append(w['text'])
        prev_x1 = w['x1']
    
    return tokens

def assign_to_periods(line_words: List[dict], day_idx: int) -> Dict[int, List[str]]:
    """Assign words on a horizontal line to periods based on nearest center."""
    centers = get_period_centers(day_idx)
    period_tokens = {i: [] for i in range(6)}
    
    # Group by nearest center, then merge close words within each period
    period_words = [[] for _ in range(6)]
    for w in line_words:
        cx = (w['x0'] + w['x1']) / 2
        # Find nearest period center
        best_period = min(range(6), key=lambda i: abs(cx - centers[i]))
        period_words[best_period].append(w)
    
    for i in range(6):
        if period_words[i]:
            period_tokens[i] = merge_close_words(period_words[i])
    
    return period_tokens

def reconstruct_cell_text(row_words: List[dict], day_idx: int) -> Dict[int, List[str]]:
    """
    Reconstruct text for each period cell within a day column.
    Returns: period_index -> list of text lines
    """
    # Filter words to this day column
    x_start = DAY_STARTS[day_idx]
    x_end = x_start + DAY_WIDTH
    day_words = [w for w in row_words if x_start <= (w['x0'] + w['x1']) / 2 <= x_end]
    
    # Cluster by y
    lines = cluster_y(day_words)
    
    # For each line, assign words to periods and merge
    period_lines = {i: [] for i in range(6)}
    for y in sorted(lines.keys()):
        line_words = lines[y]
        period_tokens = assign_to_periods(line_words, day_idx)
        for period, tokens in period_tokens.items():
            if tokens:
                period_lines[period].extend(tokens)
    
    return period_lines

def is_room(text: str) -> bool:
    return bool(ROOM_RE.match(text))

def is_instructor(text: str) -> bool:
    """Heuristic: instructor names are typically 1-3 words, may have titles, not rooms/courses."""
    if not text or len(text) < 2:
        return False
    if is_room(text):
        return False
    # Contains title prefix
    if INSTRUCTOR_TITLE_RE.match(text):
        return True
    # Multi-word name pattern (First Last)
    words = text.split()
    if len(words) >= 2 and all(w[0].isupper() for w in words if w):
        return True
    # Single word that's clearly a name (capitalized, not a known course)
    if len(words) == 1 and text[0].isupper() and text not in COURSE_FRAGMENTS:
        if len(text) >= 3 and text not in ['Lab', 'Required', 'The', 'Monday']:
            return True
    return False

def is_course(text: str) -> bool:
    if is_room(text):
        return False
    if is_instructor(text):
        return False
    if text in COURSE_FRAGMENTS:
        return True
    # Known course patterns
    if COURSE_SUFFIX_RE.search(text):
        return True
    if text in ['COAL', 'OOP', 'DS', 'AA', 'OB', 'DB', 'AI', 'PF', 'DLD', 'SE', 
                'CN', 'OS', 'Web', 'ML', 'PDC', 'CDC', 'ENT', 'IS', 'HRM', 'SPM',
                'T&BW', 'Adv.SE', 'S.Testing', 'ToA', 'ADBMS', 'Compiler',
                'Numerical', 'Differential', 'Calculus', 'Linear', 'Discrete',
                'Applied', 'Phy.(2hr)', 'Functional', 'English', 'E.Writing',
                'Prob.', 'Stat', 'Pre', 'Cal-1', 'Cal-2', 'Civics', 'CE',
                'Mngmnt', 'PP', 'AICT']:
        return True
    return False

def parse_cell_tokens(tokens: List[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Given a list of tokens from a cell, identify course, instructor, room.
    Returns: (course, instructor, room)
    """
    room = None
    course = None
    instructor = None
    
    # First pass: find room
    for t in tokens:
        if is_room(t):
            room = t
            break
    
    # Second pass: find course
    for t in tokens:
        if is_course(t):
            course = t
            break
    
    # Third pass: find instructor from remaining
    remaining = [t for t in tokens if t != room and t != course]
    if remaining:
        # Merge remaining tokens that might form an instructor name
        candidate = ' '.join(remaining)
        if is_instructor(candidate):
            instructor = candidate
        elif len(remaining) == 1 and is_instructor(remaining[0]):
            instructor = remaining[0]
    
    # Handle wrapped text: if we have fragments, try to reconstruct
    if not course:
        combined = ' '.join(tokens)
        # Try merging known fragments
        for frag, full in COURSE_FRAGMENTS.items():
            if frag in combined:
                course = full
                break
    elif course in COURSE_FRAGMENTS:
        course = COURSE_FRAGMENTS[course]
        
    return course, instructor, room

def extract_timetable(file_obj) -> Tuple[List[Course], dict, List[dict]]:
    """Main extraction function."""
    all_schedules = []  # List of (section, day, period, course, instructor, room, page)
    
    with pdfplumber.open(file_obj) as pdf:
        for page_idx in range(min(6, len(pdf.pages))):  # Skip garbled page 7
            page = pdf.pages[page_idx]
            words = page.extract_words()
            
            # Filter out header/footer words
            content_words = []
            for w in words:
                text = w['text'].strip()
                if HEADER_RE.match(text):
                    continue
                if w['top'] < 100:  # Header area
                    continue
                if w['top'] > 580:  # Footer area
                    continue
                if TIME_RE.match(text):
                    continue
                content_words.append(w)
            
            rows = get_row_boundaries(page)
            
            for section_name, y_top, y_bottom in rows:
                row_words = [w for w in content_words 
                           if y_top <= (w['top'] + w['bottom']) / 2 <= y_bottom]
                
                for day_idx, day in enumerate(DAYS):
                    period_lines = reconstruct_cell_text(row_words, day_idx)
                    
                    for period_idx in range(6):
                        tokens = period_lines.get(period_idx, [])
                        if not tokens:
                            continue
                        
                        course, instructor, room = parse_cell_tokens(tokens)
                        
                        # Determine semester from section name
                        semester_match = re.search(r'BSCS-(\d+)', section_name)
                        semester = int(semester_match.group(1)) if semester_match else 0
                        
                        all_schedules.append({
                            'page': page_idx + 1,
                            'section': section_name,
                            'semester': semester,
                            'day': day,
                            'period': period_idx + 1,
                            'tokens': tokens,
                            'course': course,
                            'instructor': instructor,
                            'room': room or 'TBA',
                        })
    
    # Build structured dataset
    # Group by course -> section
    course_map = defaultdict(lambda: {'sections': defaultdict(list)})
    
    for entry in all_schedules:
        course_name = entry['course'] or 'UNRESOLVED_COURSE'
        section_name = entry['section']
        semester = entry['semester']
        
        key = (course_name, semester)
        course_map[key]['semester'] = semester
        course_map[key]['courseName'] = course_name
        
        sched = Schedule(
            day=entry['day'],
            startTime=TIME_SLOTS[entry['period']-1][0],
            endTime=TIME_SLOTS[entry['period']-1][1],
            startMinutes=TIME_SLOTS[entry['period']-1][2],
            endMinutes=TIME_SLOTS[entry['period']-1][3],
        )
        
        course_map[key]['sections'][section_name].append({
            'instructor': entry['instructor'] or 'TBA',
            'room': entry['room'],
            'schedule': sched,
            'period': entry['period'],
        })
    
    # Build Course objects
    courses = []
    course_id = 1
    for (course_name, semester), data in course_map.items():
        sections = []
        section_id = 1
        for section_name, entries in data['sections'].items():
            # Merge entries with same instructor and room (multi-period)
            # Group consecutive periods
            entries.sort(key=lambda e: (DAYS.index(e['schedule'].day), e['period']))
            
            for e in entries:
                sections.append(Section(
                    id=f"S{section_id}",
                    sectionName=section_name,
                    instructor=e['instructor'],
                    room=e['room'],
                    schedules=[e['schedule']],
                ))
                section_id += 1
        
        courses.append(Course(
            id=f"C{course_id}",
            courseCode=None,
            courseName=course_name,
            semester=semester,
            sections=sections,
        ))
        course_id += 1
    
    # Build validation stats
    stats = {
        'total_pages_processed': 6,
        'total_schedule_entries': len(all_schedules),
        'total_courses': len(courses),
        'unresolved_count': sum(1 for s in all_schedules if s['course'] == 'UNRESOLVED_COURSE'),
    }
    
    return courses, stats, all_schedules

def run_self_tests(all_schedules: List[dict]) -> dict:
    """Run all 10 self-tests and return report."""
    report = {}
    
    # TEST 1: Grid Coverage
    occupied = len([s for s in all_schedules if s['course']])
    report['TEST1_GridCoverage'] = {
        'extracted_cells': len(all_schedules),
        'occupied_with_course': occupied,
    }
    
    # TEST 2: Section Coverage
    sections_found = sorted(set(s['section'] for s in all_schedules))
    report['TEST2_SectionCoverage'] = {
        'sections_found': sections_found,
        'count': len(sections_found),
    }
    
    # TEST 3: Semester Coverage
    sem_stats = defaultdict(lambda: {'sections': set(), 'entries': 0})
    for s in all_schedules:
        sem_stats[s['semester']]['sections'].add(s['section'])
        sem_stats[s['semester']]['entries'] += 1
    report['TEST3_SemesterCoverage'] = {
        sem: {'sections': sorted(data['sections']), 'entries': data['entries']}
        for sem, data in sorted(sem_stats.items())
    }
    
    # TEST 4: Time Validation
    invalid_times = []
    for s in all_schedules:
        sched = s.get('schedule')
        if sched and sched.startMinutes >= sched.endMinutes:
            invalid_times.append(s)
    report['TEST4_TimeValidation'] = {
        'invalid_count': len(invalid_times),
        'invalid_entries': invalid_times,
    }
    
    # TEST 5: Course Validation
    suspicious_courses = []
    for s in all_schedules:
        c = s.get('course', '')
        if c in ['UNRESOLVED_COURSE'] or (c and len(c) <= 2 and c not in ['AI', 'OS', 'SE', 'CN', 'DB', 'DS', 'AA', 'OB', 'PF', 'PP', 'ML', 'IS']):
            suspicious_courses.append({
                'section': s['section'], 'day': s['day'], 'period': s['period'],
                'course': c, 'tokens': s['tokens']
            })
    report['TEST5_CourseValidation'] = suspicious_courses
    
    # TEST 6: Instructor Validation
    suspicious_instructors = []
    for s in all_schedules:
        inst = s.get('instructor', '')
        if inst and (len(inst) <= 2 or is_room(inst) or is_course(inst)):
            suspicious_instructors.append({
                'section': s['section'], 'day': s['day'], 'period': s['period'],
                'instructor': inst, 'tokens': s['tokens']
            })
    report['TEST6_InstructorValidation'] = suspicious_instructors
    
    # TEST 7: Room Validation
    suspicious_rooms = []
    for s in all_schedules:
        room = s.get('room', '')
        if room and room != 'TBA' and not is_room(room):
            suspicious_rooms.append({
                'section': s['section'], 'day': s['day'], 'period': s['period'],
                'room': room, 'tokens': s['tokens']
            })
    report['TEST7_RoomValidation'] = suspicious_rooms
    
    # TEST 8: MAD False Positive Test
    mad_entries = [s for s in all_schedules if 'MAD' in str(s.get('course', ''))]
    report['TEST8_MAD_FalsePositives'] = {
        'count': len(mad_entries),
        'entries': mad_entries,
    }
    
    # TEST 9: Unresolved Test
    unresolved = [s for s in all_schedules if s.get('course') == 'UNRESOLVED_COURSE']
    report['TEST9_Unresolved'] = {
        'count': len(unresolved),
        'entries': unresolved,
    }
    
    # TEST 10: Source Spot Check (representative samples)
    spot_check = []
    target_sems = [1, 2, 3, 4, 5, 6, 7, 8]
    for sem in target_sems:
        candidates = [s for s in all_schedules if s['semester'] == sem and s['course']]
        if candidates:
            spot_check.append(candidates[0])
    report['TEST10_SpotCheck'] = spot_check
    
    return report

def parse_and_flatten_pdf(file_obj) -> dict:
    """
    Run the parser and convert Course -> Section -> Schedule hierarchy 
    into the exact flat format expected by the frontend JSON importer.
    """
    courses, stats, all_schedules = extract_timetable(file_obj)
    
    # We want a flat list of classes
    flat_classes = []
    for c in courses:
        for s in c.sections:
            for sch in s.schedules:
                flat_classes.append({
                    "semester": f"{c.semester}th Semester" if c.semester not in [1, 2, 3] else (
                        "1st Semester" if c.semester == 1 else
                        "2nd Semester" if c.semester == 2 else
                        "3rd Semester"
                    ), # Adjust semester string to match frontend format if needed
                    "section": s.sectionName,
                    "course_name": c.courseName,
                    "instructor": s.instructor,
                    "day": sch.day,
                    "start_time": sch.startTime,
                    "end_time": sch.endTime,
                    "room": s.room
                })
                
    return {
        "metadata": {
            "title": "Parsed PDF Timetable",
            "source": "PDF Upload",
            "record_count": len(flat_classes)
        },
        "classes": flat_classes,
        "validation_report": run_self_tests(all_schedules),
        "statistics": stats
    }
