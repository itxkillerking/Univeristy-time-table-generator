import sys
from pypdf import PdfReader

try:
    reader = PdfReader("CS&IT_Timetable_Fall 2026_V12 (WEF  31-08-2026)_260829_165254.pdf")
    print(f"Total pages: {len(reader.pages)}")
    for i in range(min(2, len(reader.pages))):
        print(f"\n--- PAGE {i+1} ---")
        text = reader.pages[i].extract_text()
        print(text[:1500])
except Exception as e:
    print(f"Error: {e}")
