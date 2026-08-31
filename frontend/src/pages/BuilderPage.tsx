import { useState, useMemo, useEffect } from 'react';

import { getActiveTimetable } from '../lib/timetable/timetableLoader';
import type { Course } from '../types/timetable';
import SemesterSelector from '../components/builder/SemesterSelector';
import CourseSearch from '../components/builder/CourseSearch';
import CourseList from '../components/builder/CourseList';
import SelectedCourses from '../components/builder/SelectedCourses';
import SectionSelectionLayout from '../components/builder/SectionSelectionLayout';
import TimetableReview from '../components/builder/TimetableReview';

type BuilderStep = 'course-selection' | 'section-selection' | 'review';

export default function BuilderPage() {
  const [timetableCourses, setTimetableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const courses = await getActiveTimetable();
      setTimetableCourses(courses);
      setLoading(false);
    }
    init();
  }, []);

  const [currentStep, setCurrentStep] = useState<BuilderStep>('course-selection');
  
  // State: store only IDs to keep state clean (Rule 1)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  
  // State: store section selections mapping courseId -> sectionId
  const [selectedSectionIds, setSelectedSectionIds] = useState<Record<string, string>>({});
  
  // Extract unique semesters from our data source
  const availableSemesters = useMemo(() => {
    const semesters = new Set(timetableCourses.map(c => c.semester));
    return Array.from(semesters).sort();
  }, [timetableCourses]);

  const [activeSemester, setActiveSemester] = useState<string>('');
  
  useEffect(() => {
    if (availableSemesters.length > 0 && !activeSemester) {
      setActiveSemester(availableSemesters[0]);
    }
  }, [availableSemesters, activeSemester]);

  const [searchQuery, setSearchQuery] = useState('');

  // Derived state: Filter courses for the main list
  const visibleCourses = useMemo(() => {
    let filtered = timetableCourses.filter(c => c.semester === activeSemester);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c => c.courseName.toLowerCase().includes(query) || 
             (c.shortName && c.shortName.toLowerCase().includes(query)) ||
             (c.aliases && c.aliases.some(alias => alias.toLowerCase().includes(query)))
      );
    }
    
    return filtered;
  }, [activeSemester, searchQuery]);

  // Derived state: Resolve full course objects for the selected view
  const selectedCoursesData = useMemo(() => {
    return selectedCourseIds
      .map(id => timetableCourses.find(c => c.id === id))
      .filter((c): c is Course => c !== undefined);
  }, [selectedCourseIds]);

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const handleRemoveCourse = (courseId: string) => {
    setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
  };

  // Rule: Do not leave orphaned section selections in state
  useEffect(() => {
    setSelectedSectionIds(prev => {
      const next = { ...prev };
      let hasChanges = false;
      
      Object.keys(next).forEach(courseId => {
        if (!selectedCourseIds.includes(courseId)) {
          delete next[courseId];
          hasChanges = true;
        }
      });
      
      return hasChanges ? next : prev;
    });
  }, [selectedCourseIds]);

  const handleSelectSection = (courseId: string, sectionId: string) => {
    setSelectedSectionIds(prev => ({
      ...prev,
      [courseId]: sectionId
    }));
  };

  const handleContinue = () => {
    if (currentStep === 'course-selection') {
      setCurrentStep('section-selection');
    } else if (currentStep === 'section-selection') {
      setCurrentStep('review');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-4 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading university timetable...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'section-selection') {
    return (
      <SectionSelectionLayout
        selectedCoursesData={selectedCoursesData}
        selectedSectionIds={selectedSectionIds}
        onSelectSection={handleSelectSection}
        onBack={() => setCurrentStep('course-selection')}
        onContinue={handleContinue}
      />
    );
  }

  if (currentStep === 'review') {
    return (
      <TimetableReview
        selectedCoursesData={selectedCoursesData}
        selectedSectionIds={selectedSectionIds}
        onBack={() => setCurrentStep('section-selection')}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Build Your Timetable
        </h1>
        <p className="mt-2 text-base text-slate-500 max-w-2xl">
          Select courses from any semester and build your schedule. Your selections are saved as you switch between semesters.
        </p>
      </div>
      
      {/* Main Workspace Layout */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Course Selection Workspace */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:flex-1">
                <SemesterSelector 
                  semesters={availableSemesters} 
                  activeSemester={activeSemester} 
                  onSelectSemester={setActiveSemester} 
                />
              </div>
              <div className="w-full sm:flex-1">
                <CourseSearch 
                  searchQuery={searchQuery} 
                  setSearchQuery={setSearchQuery} 
                />
              </div>
            </div>
          </div>

          <div className="flex-grow">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-semibold text-slate-800">Available Courses</h2>
              <span className="text-sm text-slate-500">{visibleCourses.length} results</span>
            </div>
            
            <CourseList 
              courses={visibleCourses} 
              selectedCourseIds={selectedCourseIds}
              onToggleSelect={handleToggleCourse}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Persistent Selected Courses */}
        <div className="lg:col-span-1 h-[600px] lg:h-[calc(100vh-220px)] lg:sticky lg:top-28">
          <SelectedCourses 
            selectedCourses={selectedCoursesData}
            onRemoveCourse={handleRemoveCourse}
            onContinue={handleContinue}
          />
        </div>
        
      </div>
    </div>
  );
}
