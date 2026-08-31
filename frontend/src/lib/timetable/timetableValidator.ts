export interface RawTimetableRecord {
  semester: string;
  section: string;
  course_name: string;
  instructor: string;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
}

export interface RawTimetableData {
  metadata: {
    title: string;
    source: string;
    effective_date: string;
    record_count: number;
    schema: string[];
  };
  classes: RawTimetableRecord[];
}

export function validateTimetableData(data: any): data is RawTimetableData {
  if (!data || typeof data !== 'object') {
    console.error('Validation Error: Data is not an object');
    return false;
  }

  if (!Array.isArray(data.classes)) {
    console.error('Validation Error: classes is not an array');
    return false;
  }

  // Check a sample of records to ensure schema matches
  const sampleSize = Math.min(data.classes.length, 5);
  for (let i = 0; i < sampleSize; i++) {
    const record = data.classes[i];
    if (
      typeof record.semester !== 'string' ||
      typeof record.section !== 'string' ||
      typeof record.course_name !== 'string' ||
      typeof record.instructor !== 'string' ||
      typeof record.day !== 'string' ||
      typeof record.start_time !== 'string' ||
      typeof record.end_time !== 'string' ||
      typeof record.room !== 'string'
    ) {
      console.error('Validation Error: Record structure is invalid at index', i, record);
      return false;
    }
  }

  return true;
}
