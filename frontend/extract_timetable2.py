import pdfplumber
import json
import re
from collections import defaultdict
import uuid

PERIODS = [
    {"start": "08:00", "end": "09:15"},
    {"start": "09:30", "end": "10:45"},
    {"start": "11:00", "end": "12:15"},
    {"start": "12:30", "end": "13:45"},
    {"start": "14:00", "end": "15:15"},
    {"start": "15:30", "end": "16:45"}
]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

def time_to_minutes(t_str):
    h, m = map(int, t_str.split(':'))
    return h * 60 + m

def get_semester(section_name):
    match = re.search(r'-(\d)', section_name)
    if match:
        num = match.group(1)
        suffix = "th"
        if num == "1": suffix = "st"
        elif num == "2": suffix = "nd"
        elif num == "3": suffix = "rd"
        return f"{num}{suffix} Semester"
    return "Unknown Semester"

def is_room(line):
    if re.match(r'^(CS-|LB\d-|FIT-|LAB|C\d|E\d)', line, re.IGNORECASE): return True
    if line.strip() in ["Required", "LAB2"]: return True
    return False

KNOWN_COURSES = [
    "Applied Phy.(2hr)", "Discrete", "AICT (Lab)", "AICT", "Functional English", "Function al Englis h", "Phy (LAB)", "Pre Cal-1", "DLD (Lab)", "DLD", "PF", "E.Writing", "Prob. Stat", "Civics & CE (2hr)", "PP (2hr)", "PF (Lab)", "Pre Cal-2", "COAL", "OOP", "CN (Lab)", "COAL(Lab)", "Calculus", "OOP (Lab)", "C.Networks", "SE", "SE (Lab)", "LA", "Mngmnt (2hr)", "TBW", "S/w Req Engg.", "DB (Lab)", "SRE", "DB", "HCI (Lab)", "HCI", "S/w Design & Archi.", "Web P. (Lab)", "SDA (Lab)", "SDA", "Web P.", "OS (Lab)", "OS", "S/w Quality", "SQE", "Info. Security", "IS", "S/w Project Mngmnt", "SPM"
]

def clean_course_name(name):
    # Fix broken wrapped lines for known common ones
    name = name.replace("Function al Englis h", "Functional English")
    name = name.replace("C.Netwo rks", "C.Networks")
    name = name.replace("E.Writin g", "E.Writing")
    name = name.replace("E. Writin g", "E.Writing")
    name = name.replace("Prob. Stat", "Probability & Stats")
    return name.strip()

def parse_cell(text):
    if not text or not text.strip(): return None
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if not lines: return None
        
    room = None
    if is_room(lines[0]):
        room = lines.pop(0)
        if lines and lines[0].isdigit(): room += lines.pop(0)
    elif lines and is_room(lines[-1]):
        room = lines.pop(-1)
        if len(lines) >= 2 and lines[-1] == "Required":
            room = lines.pop(-1) + " " + room

    # Attempt to separate Course and Instructor
    course = None
    instructor = None
    unresolved = False
    
    # Try to match a known course string in the remaining lines
    course_matched_indices = []
    joined_lines = " ".join(lines)
    
    for i, line in enumerate(lines):
        for kc in KNOWN_COURSES:
            # simple fuzzy match
            if kc.lower() in line.lower() or line.lower() in kc.lower():
                course_matched_indices.append(i)
                break
                
    if len(lines) == 2:
        # Standard: one is course, one is instructor
        if len(course_matched_indices) == 1:
            c_idx = course_matched_indices[0]
            course = clean_course_name(lines[c_idx])
            instructor = lines[1 - c_idx]
        else:
            # Can't confidently guess, mark unresolved
            unresolved = True
    elif len(lines) > 2:
        # Heavily wrapped text (e.g. "Discrete\nShoaib\nAhmad")
        # Try to find the course, the rest is instructor
        if len(course_matched_indices) == 1:
            c_idx = course_matched_indices[0]
            course = clean_course_name(lines[c_idx])
            inst_lines = [l for j, l in enumerate(lines) if j != c_idx]
            instructor = " ".join(inst_lines)
        else:
            # Too complex
            unresolved = True
    elif len(lines) == 1:
        unresolved = True

    if unresolved:
        course = "UNRESOLVED_COURSE"
        instructor = "UNRESOLVED_INSTRUCTOR"
        
    return {
        "raw": text,
        "lines": lines,
        "room": room,
        "course": course,
        "instructor": instructor,
        "unresolved": unresolved
    }

def main():
    pdf_path = "CS&IT_Timetable_Fall 2026_V12 (WEF  31-08-2026)_260829_165254.pdf"
    
    # Data architecture: courses[courseName][semester] = { course obj }
    courses_map = defaultdict(lambda: defaultdict(lambda: {
        "id": str(uuid.uuid4()),
        "courseCode": "",
        "courseName": "",
        "semester": "",
        "sections": defaultdict(lambda: {
            "id": str(uuid.uuid4()),
            "sectionName": "",
            "instructor": "",
            "room": "",
            "schedules": []
        })
    }))
    
    stats = {
        "pages_processed": 0,
        "section_groups_found": set(),
        "semesters_found": set(),
        "total_courses": 0,
        "total_sections": 0,
        "total_schedule_entries": 0,
        "multi_period_entries": 0,
        "missing_rooms": 0,
        "unresolved_cells": 0,
        "duplicate_candidates": 0,
        "suspicious_cells": 0
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        stats["pages_processed"] = len(pdf.pages)
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if len(table) < 3 or len(table[0]) != 37: continue
                    
                for row_idx in range(2, len(table)):
                    row = table[row_idx]
                    section_name = row[0]
                    if not section_name or not section_name.strip(): continue
                        
                    semester = get_semester(section_name)
                    stats["section_groups_found"].add(section_name)
                    stats["semesters_found"].add(semester)
                    
                    col_idx = 1
                    while col_idx <= 36:
                        cell_val = row[col_idx]
                        if cell_val and cell_val.strip():
                            span_count = 1
                            next_col = col_idx + 1
                            while next_col <= 36 and (row[next_col] is None or row[next_col] == ''):
                                span_count += 1
                                next_col += 1
                                
                            parsed = parse_cell(cell_val)
                            
                            if parsed:
                                day_idx = (col_idx - 1) // 6
                                period_start_idx = (col_idx - 1) % 6
                                period_end_idx = min(period_start_idx + (span_count - 1), 5)
                                
                                day = DAYS[day_idx]
                                start_t = PERIODS[period_start_idx]["start"]
                                end_t = PERIODS[period_end_idx]["end"]
                                sm = time_to_minutes(start_t)
                                em = time_to_minutes(end_t)
                                
                                # Validation: Impossible time values
                                if sm >= em:
                                    stats["suspicious_cells"] += 1
                                    
                                schedule_entry = {
                                    "day": day,
                                    "startTime": start_t,
                                    "endTime": end_t,
                                    "startMinutes": sm,
                                    "endMinutes": em
                                }
                                
                                stats["total_schedule_entries"] += 1
                                if span_count > 1:
                                    stats["multi_period_entries"] += 1
                                if not parsed["room"]:
                                    stats["missing_rooms"] += 1
                                if parsed["unresolved"]:
                                    stats["unresolved_cells"] += 1
                                    
                                c_name = parsed["course"]
                                inst = parsed["instructor"]
                                rm = parsed["room"] or "" # Store null/empty string for missing rooms, NO "TBA"
                                
                                # Assign to hierarchy
                                c_obj = courses_map[c_name][semester]
                                c_obj["courseName"] = c_name
                                c_obj["semester"] = semester
                                
                                sec_obj = c_obj["sections"][section_name]
                                sec_obj["sectionName"] = section_name
                                sec_obj["instructor"] = inst
                                sec_obj["room"] = rm
                                sec_obj["schedules"].append(schedule_entry)
                                
                        col_idx += span_count

    # Flatten architecture for output
    final_courses = []
    for c_name, sem_dict in courses_map.items():
        for sem, c_obj in sem_dict.items():
            final_sections = []
            for sec_name, sec_obj in c_obj["sections"].items():
                final_sections.append(sec_obj)
                stats["total_sections"] += 1
            c_obj["sections"] = final_sections
            final_courses.append(c_obj)
            stats["total_courses"] += 1

    # Write TypeScript file
    ts_content = f"// AUTO-GENERATED TIMETABLE DATA FROM PDF\nimport type {{ Course }} from '../types/timetable';\n\nexport const sampleCourses: Course[] = {json.dumps(final_courses, indent=2)};\n"
    with open("src/data/timetableData.ts", "w", encoding="utf-8") as f:
        f.write(ts_content)
        
    stats["section_groups_found"] = len(stats["section_groups_found"])
    stats["semesters_found"] = len(stats["semesters_found"])
    
    print(json.dumps(stats, indent=2))

if __name__ == "__main__":
    main()
