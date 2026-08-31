import type { Course, Schedule } from '../../types/timetable';
import type { RawTimetableRecord } from './timetableValidator';
import { timeToMinutes, generateId } from './timetableUtils';
import { resolveCourseIdentity } from './courseResolver';

/**
 * Normalizes a flat array of raw timetable records into the hierarchical
 * Course -> Section -> Schedule structure.
 */
export function normalizeTimetableData(records: RawTimetableRecord[]): Course[] {
  const courseMap = new Map<string, Course>();

  for (const record of records) {
    // Generate unique composite key for Course (Course Name + Semester)
    // We strip (Lab), (LAB), (2hr) suffixes ONLY for grouping so that Lecture and Lab fall under the exact same Course/Section.
    const rawBaseName = record.course_name.replace(/\s*\((lab|2hr)\)/i, '').trim();
    
    // Resolve official course identity bounds to the current semester
    const resolvedIdentity = resolveCourseIdentity(record.course_name, record.semester);
    
    const canonicalName = resolvedIdentity ? resolvedIdentity.courseName : rawBaseName;
    const shortName = resolvedIdentity ? resolvedIdentity.shortName : rawBaseName;
    const aliases = resolvedIdentity ? resolvedIdentity.aliases : [];
    
    const courseKey = `${canonicalName}_${record.semester}`;
    
    if (!courseMap.has(courseKey)) {
      courseMap.set(courseKey, {
        id: generateId('crs', courseKey),
        courseName: canonicalName,
        shortName: shortName,
        aliases: aliases,
        semester: record.semester,
        sections: []
      });
    }

    const courseObj = courseMap.get(courseKey)!;

    // Find or create the Section under this Course
    let sectionObj = courseObj.sections.find(s => s.sectionName === record.section);
    if (!sectionObj) {
      sectionObj = {
        id: generateId('sec', `${courseKey}_${record.section}`),
        sectionName: record.section,
        schedules: []
      };
      courseObj.sections.push(sectionObj);
    }

    // Convert time to minutes for deterministic clash detection
    const startMins = timeToMinutes(record.start_time);
    const endMins = timeToMinutes(record.end_time);
    
    // Determine the type strictly from the source string
    const scheduleType = /\b(Lab|LAB)\b/.test(record.course_name) ? 'Lab' : 'Lecture';

    // Verify if schedule already exists to prevent duplicate entries.
    // Must match EXACTLY across all properties to be a duplicate.
    const existingScheduleIndex = sectionObj.schedules.findIndex(
      s => s.day === record.day && 
           s.startTime === record.start_time && 
           s.endTime === record.end_time &&
           s.room === record.room &&
           s.instructor === record.instructor &&
           s.type === scheduleType
    );

    if (existingScheduleIndex === -1) {
      const newSchedule: Schedule = {
        day: record.day as Schedule['day'],
        startTime: record.start_time,
        endTime: record.end_time,
        startMinutes: startMins,
        endMinutes: endMins,
        room: record.room,
        instructor: record.instructor,
        type: scheduleType
      };
      
      sectionObj.schedules.push(newSchedule);
    }
  }

  // Convert the map to an array and sort by semester then course name
  const courses = Array.from(courseMap.values());
  courses.sort((a, b) => {
    if (a.semester !== b.semester) {
      return a.semester.localeCompare(b.semester);
    }
    return a.courseName.localeCompare(b.courseName);
  });

  return courses;
}
