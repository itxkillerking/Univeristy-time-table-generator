import type { RawTimetableRecord } from '../timetable/timetableValidator';
import { resolveCourseIdentity } from '../timetable/courseResolver';

export interface DiffResult {
  added: SectionDiff[];
  changed: SectionDiff[];
  removed: SectionDiff[];
  unchanged: SectionDiff[];
  invalid: RawTimetableRecord[];
  unresolved: RawTimetableRecord[];
}

export interface SectionDiff {
  id: string; // semester|section|canonicalCourseName
  semester: string;
  section: string;
  canonicalCourseName: string;
  currentRecords: RawTimetableRecord[];
  importedRecords: RawTimetableRecord[];
}

function timeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function generateTimetableDiff(
  currentRecords: RawTimetableRecord[], 
  importedRecords: RawTimetableRecord[]
): DiffResult {
  const diff: DiffResult = {
    added: [],
    changed: [],
    removed: [],
    unchanged: [],
    invalid: [],
    unresolved: []
  };

  const groupRecords = (
    records: RawTimetableRecord[], 
    invalidList?: RawTimetableRecord[], 
    unresolvedList?: RawTimetableRecord[]
  ) => {
    const map = new Map<string, SectionDiff>();
    
    for (const record of records) {
      // Basic validity check (times)
      const startMin = timeToMinutes(record.start_time);
      const endMin = timeToMinutes(record.end_time);
      
      if (isNaN(startMin) || isNaN(endMin) || startMin >= endMin) {
        if (invalidList) invalidList.push(record);
        continue;
      }

      const canonical = resolveCourseIdentity(record.course_name, record.semester);
      if (!canonical) {
        if (unresolvedList) unresolvedList.push(record);
        continue;
      }

      const id = `${record.semester}|${record.section}|${canonical.courseName}`;
      
      if (!map.has(id)) {
        map.set(id, {
          id,
          semester: record.semester,
          section: record.section,
          canonicalCourseName: canonical.courseName,
          currentRecords: [],
          importedRecords: []
        });
      }
      
      map.get(id)!.importedRecords.push(record);
    }
    
    return map;
  };

  const currentInvalid: RawTimetableRecord[] = [];
  const currentUnresolved: RawTimetableRecord[] = [];
  const currentMap = groupRecords(currentRecords, currentInvalid, currentUnresolved);
  // Current map populates importedRecords by default since we used the same function, let's move them.
  for (const section of currentMap.values()) {
    section.currentRecords = section.importedRecords;
    section.importedRecords = [];
  }

  const importedInvalid: RawTimetableRecord[] = [];
  const importedUnresolved: RawTimetableRecord[] = [];
  const importedMap = groupRecords(importedRecords, importedInvalid, importedUnresolved);

  // Only report NEW invalid/unresolved records to avoid blocking the user on pre-existing issues
  const stringifyRecord = (r: RawTimetableRecord) => JSON.stringify(r);
  const currentInvalidSet = new Set(currentInvalid.map(stringifyRecord));
  const currentUnresolvedSet = new Set(currentUnresolved.map(stringifyRecord));

  diff.invalid = importedInvalid.filter(r => !currentInvalidSet.has(stringifyRecord(r)));
  diff.unresolved = importedUnresolved.filter(r => !currentUnresolvedSet.has(stringifyRecord(r)));

  // Compare maps
  const allIds = new Set([...currentMap.keys(), ...importedMap.keys()]);

  for (const id of allIds) {
    const current = currentMap.get(id);
    const imported = importedMap.get(id);

    if (current && !imported) {
      // Potentially removed
      diff.removed.push(current);
    } else if (!current && imported) {
      // New
      diff.added.push(imported);
    } else if (current && imported) {
      // Exists in both, check if changed
      // Simple stringify comparison of sorted records
      const cStr = JSON.stringify(current.currentRecords.map(normalizeForCompare).sort(sortRecords));
      const iStr = JSON.stringify(imported.importedRecords.map(normalizeForCompare).sort(sortRecords));
      
      if (cStr === iStr) {
        diff.unchanged.push({
          ...imported,
          currentRecords: current.currentRecords
        });
      } else {
        diff.changed.push({
          ...imported,
          currentRecords: current.currentRecords
        });
      }
    }
  }

  return diff;
}

// Helpers to make comparison robust against minor whitespace or key ordering issues
function normalizeForCompare(record: RawTimetableRecord) {
  return {
    day: record.day.trim().toLowerCase(),
    start_time: record.start_time.trim(),
    end_time: record.end_time.trim(),
    room: record.room.trim().toLowerCase(),
    instructor: record.instructor.trim().toLowerCase(),
    // We do NOT compare course_name string literally, because canonical identity handles "CN" vs "C.Network".
    // but the actual schedule matters.
  };
}

function sortRecords(a: any, b: any) {
  if (a.day !== b.day) return a.day.localeCompare(b.day);
  return a.start_time.localeCompare(b.start_time);
}
