import { detectClashes } from '../clash/clashDetector';
import type { Course, Section } from '../../types/timetable';

/**
 * Recommends conflict-free sections for a specific course given the currently selected timetable.
 * Uses the exact existing clash detector to ensure mathematical consistency.
 * 
 * @param targetCourse The course we want to find alternative sections for.
 * @param allSelectedCourses The full array of selected course objects.
 * @param currentSelections The current record of { courseId: sectionId }.
 * @returns Array of completely clash-free sections from the targetCourse, ranked.
 */
export function recommendSections(
  targetCourse: Course,
  allSelectedCourses: Course[],
  currentSelections: Record<string, string>
): Section[] {
  
  const validRecommendations: Section[] = [];

  // Iterate over every possible section inside the target course
  // Semester isolation is natively guaranteed because targetCourse was already filtered
  for (const candidateSection of targetCourse.sections) {
    
    // Skip if it's already the currently selected section for this course
    if (currentSelections[targetCourse.id] === candidateSection.id) {
      continue;
    }

    // Temporarily inject the candidate section into a copy of selections
    const tempSelections = {
      ...currentSelections,
      [targetCourse.id]: candidateSection.id
    };

    // Run the definitive Phase 5 clash detector over the entire timetable using the candidate
    const clashReport = detectClashes(tempSelections, allSelectedCourses);

    // If no clashes exist anywhere in the timetable, this is a valid recommendation
    if (!clashReport.hasClashes) {
      validRecommendations.push(candidateSection);
    }
  }

  // Sort remaining sections by least fragmentation (fewer discrete class meetings)
  return validRecommendations.sort((a, b) => a.schedules.length - b.schedules.length);
}
