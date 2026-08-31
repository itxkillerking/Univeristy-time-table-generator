import pdfplumber
import json
import re
from collections import defaultdict

# Base periods logic
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
    # Common room patterns: CS-001, LB3-07, FIT-511, LAB-CS-305, etc.
    if re.match(r'^(CS-|LB\d-|FIT-|LAB|C\d|E\d)', line, re.IGNORECASE):
        return True
    if line.strip() == "Required": # Seen in test "Required\nLAB2"
        return True
    if line.strip() == "LAB2":
        return True
    return False

def parse_cell(text):
    if not text or not text.strip():
        return None
        
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if not lines:
        return None
        
    # Heuristic parsing to separate Room, Course, Instructor
    room = None
    
    # Check first line for room
    if is_room(lines[0]):
        room = lines.pop(0)
        # Handle cases like "LAB EE1-30\n8"
        if lines and lines[0].isdigit():
            room += lines.pop(0)
    # Check last line for room
    elif lines and is_room(lines[-1]):
        room = lines.pop(-1)
        if len(lines) >= 2 and lines[-1] == "Required": # "Required\nLAB2"
            room = lines.pop(-1) + " " + room
            
    # Now we have lines left. Usually Course and Instructor.
    # We don't have a perfect dictionary, so we do our best.
    # Some courses have (Lab) or (2hr) in them.
    course = None
    instructor = None
    
    # If exactly 2 lines left, assume one is course, one is instructor
    # Often Course is first, but sometimes Instructor is first.
    # E.g. "Shaukat Hayat\nApplied Phy.(2hr)" vs "Discrete\nShoaib Ahmad"
    # We will just join the rest as unresolved if we can't be sure, OR make a best guess
    # but the prompt says: "Do not silently guess... report it".
    
    return {
        "raw": text,
        "lines": lines,
        "room": room
    }

def main():
    pdf_path = "CS&IT_Timetable_Fall 2026_V12 (WEF  31-08-2026)_260829_165254.pdf"
    
    all_courses = {} # dict of courseName -> {id, courseCode, courseName, semester, sections: {}}
    
    stats = {
        "pages_processed": 0,
        "total_schedule_entries": 0,
        "multi_period_entries": 0,
        "missing_rooms": 0,
        "unresolved_cells": 0,
        "duplicate_candidates": 0
    }
    
    unresolved_list = []
    
    with pdfplumber.open(pdf_path) as pdf:
        stats["pages_processed"] = len(pdf.pages)
        for page_num, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            for table in tables:
                # Find the data rows (skip headers)
                # Row 0: Days, Row 1: Periods, Row 2+: Data
                if len(table) < 3: continue
                
                # Verify column count
                if len(table[0]) != 37:
                    continue
                    
                for row_idx in range(2, len(table)):
                    row = table[row_idx]
                    section_name = row[0]
                    if not section_name or not section_name.strip():
                        continue
                        
                    semester = get_semester(section_name)
                    
                    # Process columns 1 to 36
                    col_idx = 1
                    while col_idx <= 36:
                        cell_val = row[col_idx]
                        if cell_val and cell_val.strip():
                            # We found an entry!
                            # Check for spans (consecutive None/empty cells)
                            span_count = 1
                            next_col = col_idx + 1
                            while next_col <= 36 and (row[next_col] is None or row[next_col] == ''):
                                span_count += 1
                                next_col += 1
                                
                            parsed = parse_cell(cell_val)
                            
                            if parsed:
                                day_idx = (col_idx - 1) // 6
                                period_start_idx = (col_idx - 1) % 6
                                period_end_idx = period_start_idx + (span_count - 1)
                                
                                # Safety bounds check
                                if period_end_idx >= 6:
                                    period_end_idx = 5
                                    
                                day = DAYS[day_idx]
                                start_t = PERIODS[period_start_idx]["start"]
                                end_t = PERIODS[period_end_idx]["end"]
                                
                                schedule_entry = {
                                    "day": day,
                                    "startTime": start_t,
                                    "endTime": end_t,
                                    "startMinutes": time_to_minutes(start_t),
                                    "endMinutes": time_to_minutes(end_t),
                                    "span": span_count
                                }
                                
                                stats["total_schedule_entries"] += 1
                                if span_count > 1:
                                    stats["multi_period_entries"] += 1
                                if not parsed["room"]:
                                    stats["missing_rooms"] += 1
                                    
                                unresolved_list.append({
                                    "section": section_name,
                                    "day": day,
                                    "time": f"{start_t}-{end_t}",
                                    "raw": parsed["raw"],
                                    "lines": parsed["lines"],
                                    "room": parsed["room"]
                                })
                                
                        col_idx += span_count

    # Write unresolved list for manual inspection logic
    with open("extraction_report.json", "w", encoding="utf-8") as f:
        json.dump({
            "stats": stats,
            "extracted_cells": unresolved_list
        }, f, indent=2)
        
    print(json.dumps(stats, indent=2))
    print(f"Extracted {len(unresolved_list)} cells. Check extraction_report.json for details.")

if __name__ == "__main__":
    main()
