import pdfplumber

def test():
    with pdfplumber.open("CS&IT_Timetable_Fall 2026_V12 (WEF  31-08-2026)_260829_165254.pdf") as pdf:
        page = pdf.pages[0]
        # Extract tables
        tables = page.extract_tables()
        print(f"Found {len(tables)} tables on page 1")
        if tables:
            for row in tables[0][:5]:
                print(row)
        
        # Also try text extraction with layout
        print("\n\n--- TEXT LAYOUT ---")
        print(page.extract_text(layout=True)[:1000])

test()
