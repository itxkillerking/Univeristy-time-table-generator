import type { Course, Section, Schedule } from '../../types/timetable';

export interface ClashConflict {
  id: string; // deterministic deduplication ID
  courseA: Course;
  sectionA: Section;
  scheduleA: Schedule;
  courseB: Course;
  sectionB: Section;
  scheduleB: Schedule;
  day: string;
  overlapStartMinutes: number;
  overlapEndMinutes: number;
}

export interface ClashReport {
  hasClashes: boolean;
  conflicts: ClashConflict[];
  conflictingSectionIds: Set<string>; // fast lookup
}

interface FlatSchedule {
  course: Course;
  section: Section;
  schedule: Schedule;
}

export function detectClashes(selectedSectionIds: Record<string, string>, allCourses: Course[]): ClashReport {
  // 1. Flatten all selected schedules
  const flatSchedules: FlatSchedule[] = [];
  
  for (const course of allCourses) {
    const selectedSectionId = selectedSectionIds[course.id];
    if (!selectedSectionId) continue;
    
    const section = course.sections.find(s => s.id === selectedSectionId);
    if (!section) continue;
    
    for (const schedule of section.schedules) {
      // Must have valid times
      if (schedule.startMinutes !== -1 && schedule.endMinutes !== -1 && schedule.day) {
        flatSchedules.push({ course, section, schedule });
      }
    }
  }
  
  const conflicts: ClashConflict[] = [];
  const conflictingSectionIds = new Set<string>();
  const reportedPairs = new Set<string>();
  
  // 2. O(N^2) comparison
  for (let i = 0; i < flatSchedules.length; i++) {
    for (let j = i + 1; j < flatSchedules.length; j++) {
      const a = flatSchedules[i];
      const b = flatSchedules[j];
      
      // RULE: Do NOT report clash if they belong to the SAME Course + Section selection
      // Since a student only selects one section per course, we just check course.id
      if (a.course.id === b.course.id) {
        continue;
      }
      
      // RULE: Must be on the same day
      if (a.schedule.day.toLowerCase() !== b.schedule.day.toLowerCase()) {
        continue;
      }
      
      // RULE: Mathematical overlap
      // A.start < B.end AND B.start < A.end
      if (
        a.schedule.startMinutes < b.schedule.endMinutes &&
        b.schedule.startMinutes < a.schedule.endMinutes
      ) {
        
        // Generate deterministic deduplication ID based on course, section, day, and time
        const idA = `${a.course.id}_${a.section.id}_${a.schedule.day}_${a.schedule.startMinutes}`;
        const idB = `${b.course.id}_${b.section.id}_${b.schedule.day}_${b.schedule.startMinutes}`;
        
        const ids = [idA, idB].sort();
        const conflictId = `${ids[0]}_vs_${ids[1]}`;
        
        if (!reportedPairs.has(conflictId)) {
          reportedPairs.add(conflictId);
          
          conflictingSectionIds.add(a.section.id);
          conflictingSectionIds.add(b.section.id);
          
          conflicts.push({
            id: conflictId,
            courseA: a.course,
            sectionA: a.section,
            scheduleA: a.schedule,
            courseB: b.course,
            sectionB: b.section,
            scheduleB: b.schedule,
            day: a.schedule.day,
            overlapStartMinutes: Math.max(a.schedule.startMinutes, b.schedule.startMinutes),
            overlapEndMinutes: Math.min(a.schedule.endMinutes, b.schedule.endMinutes)
          });
        }
      }
    }
  }
  
  return {
    hasClashes: conflicts.length > 0,
    conflicts,
    conflictingSectionIds
  };
}
