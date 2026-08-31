import { validateTimetableData } from './timetableValidator';
import { normalizeTimetableData } from './timetableNormalizer';
import type { Course } from '../../types/timetable';
import localTimetable from '../../data/CS_IT_Fall_2026_Timetable.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Loads the current active timetable dataset from the API with a fallback to static JSON.
 */
export async function getActiveTimetable(): Promise<Course[]> {
  let rawData;
  try {
    // 1. Try fetching from the Django API
    const response = await fetch(`${API_URL}/api/timetable/`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    rawData = await response.json();
    console.log('[TimetableLoader] Successfully loaded from Django API:', rawData.metadata);
  } catch (error) {
    // 2. Fallback securely to static JSON if API fails or is offline
    console.warn('[TimetableLoader] Failed to load from API. Falling back to local JSON.', error);
    rawData = localTimetable;
  }

  // 3. Validate format
  if (!validateTimetableData(rawData)) {
    console.error("Failed to validate JSON timetable schema.");
    return [];
  }

  // 4. Normalize to Application Domain Models
  try {
    const normalizedCourses = normalizeTimetableData(rawData.classes);
    return normalizedCourses;
  } catch (error) {
    console.error("Timetable Normalization Error:", error);
    return [];
  }
}
