import { courseCatalogue } from '../../data/courseCatalogue';
import type { CourseCatalogueEntry } from '../../data/courseCatalogue';

/**
 * Deterministically resolves a timetable course alias to the official course catalogue entry.
 * It is strictly semester-aware to prevent mixing courses across semesters.
 */
export function resolveCourseIdentity(timetableCourseName: string, semester: string): CourseCatalogueEntry | null {
  // 1. Strip lab/schedule suffixes to get the core course name alias
  // We use regex to replace (lab) or (2hr) case-insensitively, keeping the base string intact.
  const baseName = timetableCourseName.replace(/\s*\((lab|2hr)\)/i, '').trim().toLowerCase();
  
  // 2. Filter catalogue entries to ONLY those matching the exact semester
  const semesterEntries = courseCatalogue.filter(c => c.semester === semester);
  
  // 3. Search for a matching identity within this semester
  for (const entry of semesterEntries) {
    if (
      entry.courseName.toLowerCase() === baseName ||
      entry.shortName.toLowerCase() === baseName ||
      entry.aliases.some(alias => alias.toLowerCase() === baseName)
    ) {
      return entry;
    }
  }
  
  return null;
}
