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

SEMESTER_COURSES = {
    "1st Semester": ["Applied Phy.(2hr)", "Phy (LAB)", "AICT (Lab)", "AICT", "Pre Cal-1", "Pre Cal-2"],
    "2nd Semester": ["Discrete", "Functional English", "DLD (Lab)", "DLD", "PF (Lab)", "PF", "E.Writing", "Prob. Stat", "Civics & CE (2hr)", "PP (2hr)"],
    "3rd Semester": ["COAL(Lab)", "COAL", "OOP (Lab)", "OOP", "Calculus", "LA", "Mngmnt (2hr)", "Multi. Cal"],
    "4th Semester": ["CN (Lab)", "C.Networks", "SE (Lab)", "SE", "TBW", "S/w Req Engg.", "SRE", "DS", "DS (Lab)", "Linear", "HRM (2hr)"],
    "5th Semester": ["DB (Lab)", "DB", "HCI (Lab)", "HCI", "S/w Design & Archi.", "SDA (Lab)", "SDA", "Web P. (Lab)", "Web P.", "Web", "Web (Lab)", "ToA", "ADBMS", "ADBMS (LAB)", "Differential", "Numerical", "AA", "Compiler"],
    "6th Semester": ["OS (Lab)", "OS", "S/w Quality", "SQE", "Info. Security", "IS", "S/w Project Mngmnt", "SPM", "T&BW"],
    "7th Semester": ["MAD (Lab)", "MAD", "ML", "PDC", "Data Mining", "Freelancing", "Info. Assur.", "CV", "Deep L", "Q.A.", "NLP", "GT", "TOC", "CDC", "ENT", "AI (Lab)", "AI"],
    "8th Semester": ["PPIT", "CC", "DIP", "FYP-1", "AI", "WE", "E-Com", "DDBS", "MAD", "ML", "S.Testing", "OB", "ANN"]
}

ALL_KNOWN_COURSES = list(set([c for sublist in SEMESTER_COURSES.values() for c in sublist]))
ALL_KNOWN_COURSES.sort(key=len, reverse=True)

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
    if re.match(r'^(CS-|LB\d-|FIT-|LAB|C\d|E\d|DLD-LAB)', line, re.IGNORECASE): return True
    if line.strip() in ["Required", "LAB2"]: return True
    return False

def reconstruct_cell_lines(raw_text):
    lines = raw_text.split('\n')
    reconstructed = []
    for i, line in enumerate(lines):
        line = line.strip()
        if not line: continue
        if i == 0:
            reconstructed.append(line)
        else:
            prev_line = reconstructed[-1]
            if re.search(r'[a-z]$', prev_line) and re.search(r'^[a-z]', line):
                reconstructed[-1] = prev_line + line
            else:
                reconstructed.append(line)
    return reconstructed

def parse_cell(text, semester):
    if not text or not text.strip(): return None
    
    lines = reconstruct_cell_lines(text)
    if not lines: return None
        
    room = None
    if is_room(lines[0]):
        room = lines.pop(0)
        if lines and lines[0].isdigit(): 
            room += lines.pop(0)
    elif lines and is_room(lines[-1]):
        room = lines.pop(-1)
        if len(lines) >= 2 and lines[-1] == "Required":
            room = lines.pop(-1) + " " + room

    course = None
    instructor = None
    unresolved = False
    
    full_text = " ".join(lines)
    
    candidate_courses = SEMESTER_COURSES.get(semester, [])
    candidate_courses = sorted(candidate_courses, key=len, reverse=True)
    
    matched_course = None
    
    for kc in candidate_courses:
        escaped_kc = re.escape(kc)
        pattern = re.compile(rf'(?:^|\b|\s){escaped_kc}(?:$|\b|\s)', re.IGNORECASE)
        if pattern.search(full_text):
            matched_course = kc
            break
            
    if not matched_course:
        for kc in ALL_KNOWN_COURSES:
            escaped_kc = re.escape(kc)
            pattern = re.compile(rf'(?:^|\b|\s){escaped_kc}(?:$|\b|\s)', re.IGNORECASE)
            if pattern.search(full_text):
                matched_course = kc
                break
                
    if matched_course:
        course = matched_course
        escaped_kc = re.escape(matched_course)
        pattern = re.compile(rf'(?:^|\b|\s){escaped_kc}(?:$|\b|\s)', re.IGNORECASE)
        instructor = pattern.sub(" ", full_text).strip()
        instructor = re.sub(r'\s+', ' ', instructor)
    else:
        unresolved = True
        course = "UNRESOLVED_COURSE"
        instructor = full_text # DO NOT LOSE THE ORIGINAL TEXT
        
    return {
        "raw": text,
        "room": room,
        "course": course,
        "instructor": instructor,
        "unresolved": unresolved
    }

def main():
    pdf_path = "CS&IT_Timetable_Fall 2026_V12 (WEF  31-08-2026)_260829_165254.pdf"
    
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
        "remaining_unresolved": 0
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if len(table) < 3 or len(table[0]) != 37: continue
                    
                for row_idx in range(2, len(table)):
                    row = table[row_idx]
                    section_name = row[0]
                    if not section_name or not section_name.strip(): continue
                        
                    semester = get_semester(section_name)
                    
                    col_idx = 1
                    while col_idx <= 36:
                        cell_val = row[col_idx]
                        if cell_val and cell_val.strip():
                            span_count = 1
                            next_col = col_idx + 1
                            while next_col <= 36 and (row[next_col] is None or row[next_col] == ''):
                                span_count += 1
                                next_col += 1
                                
                            parsed = parse_cell(cell_val, semester)
                            
                            if parsed:
                                day_idx = (col_idx - 1) // 6
                                period_start_idx = (col_idx - 1) % 6
                                period_end_idx = min(period_start_idx + (span_count - 1), 5)
                                
                                day = DAYS[day_idx]
                                start_t = PERIODS[period_start_idx]["start"]
                                end_t = PERIODS[period_end_idx]["end"]
                                sm = time_to_minutes(start_t)
                                em = time_to_minutes(end_t)
                                
                                schedule_entry = {
                                    "day": day,
                                    "startTime": start_t,
                                    "endTime": end_t,
                                    "startMinutes": sm,
                                    "endMinutes": em
                                }
                                
                                if parsed["unresolved"]:
                                    stats["remaining_unresolved"] += 1
                                    
                                c_name = parsed["course"]
                                inst = parsed["instructor"]
                                rm = parsed["room"] or "" 
                                
                                c_obj = courses_map[c_name][semester]
                                c_obj["courseName"] = c_name
                                c_obj["semester"] = semester
                                
                                sec_obj = c_obj["sections"][section_name]
                                sec_obj["sectionName"] = section_name
                                sec_obj["instructor"] = inst
                                sec_obj["room"] = rm
                                sec_obj["schedules"].append(schedule_entry)
                                
                            col_idx += span_count
                        else:
                            col_idx += 1

    final_courses = []
    for c_name, sem_dict in courses_map.items():
        for sem, c_obj in sem_dict.items():
            final_sections = []
            for sec_name, sec_obj in c_obj["sections"].items():
                final_sections.append(sec_obj)
            c_obj["sections"] = final_sections
            final_courses.append(c_obj)

    ts_content = f"// AUTO-GENERATED TIMETABLE DATA FROM PDF\nimport type {{ Course }} from '../types/timetable';\n\nexport const sampleCourses: Course[] = {json.dumps(final_courses, indent=2)};\n"
    with open("src/data/timetableData.ts", "w", encoding="utf-8") as f:
        f.write(ts_content)
        
    print(json.dumps(stats, indent=2))

if __name__ == "__main__":
    main()
