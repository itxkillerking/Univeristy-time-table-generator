/**
 * Timetable Data Architecture
 * Source of truth: CS&IT_Timetable_Fall 2026_V12 PDF
 * 
 * Hierarchy: Course -> Section -> Schedule
 */

export interface Schedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  
  // Display times (e.g., "09:30", "10:45")
  startTime: string;
  endTime: string;
  
  // Mathematical time representation for future clash detection
  // Format: minutes from midnight (e.g., 09:30 = 9*60+30 = 570)
  startMinutes: number;
  endMinutes: number;
  
  // Room and instructor are specific to a schedule because a Lab
  // could have a different room/instructor than the Lecture
  room: string;
  instructor: string;
  
  // Indicates if the schedule is for a Lab or Lecture based on source JSON course_name
  type: 'Lecture' | 'Lab' | 'Other';
}

export interface Section {
  id: string;
  sectionName: string; // e.g., "BSCS-2A", "BSCS-3B"
  schedules: Schedule[];
}

export interface Course {
  id: string;
  courseCode?: string; // e.g., "CS-201"
  courseName: string; // e.g., "Discrete", "COAL", "OOP"
  shortName?: string; // e.g., "CN", "AICT"
  aliases?: string[];
  semester: string;   // e.g., "2nd Semester", "3rd Semester"
  sections: Section[];
}
