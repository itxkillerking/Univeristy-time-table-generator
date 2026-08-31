import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Course } from '../../types/timetable';
import { detectClashes } from '../../lib/clash/clashDetector';
import { recommendSections } from '../../lib/recommendations/sectionRecommender';
import SectionCard from './SectionCard';
import SectionRecommendation from './SectionRecommendation';
import SectionRecommendationMini from './SectionRecommendationMini';

interface SectionSelectionLayoutProps {
  selectedCoursesData: Course[];
  selectedSectionIds: Record<string, string>;
  onSelectSection: (courseId: string, sectionId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function SectionSelectionLayout({
  selectedCoursesData,
  selectedSectionIds,
  onSelectSection,
  onBack,
  onContinue
}: SectionSelectionLayoutProps) {
  
  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(new Set());
  
  // Sort the selected courses
  const displayCourses = useMemo(() => {
    return [...selectedCoursesData]
      .sort((a, b) => {
        // Sort by semester first, then name
        if (a.semester !== b.semester) return a.semester.localeCompare(b.semester);
        return a.courseName.localeCompare(b.courseName);
      });
  }, [selectedCoursesData]);

  const totalRequired = displayCourses.length;
  const validSelectionsCount = displayCourses.filter(c => {
    const selectedSecId = selectedSectionIds[c.id];
    return selectedSecId && c.sections.some(s => s.id === selectedSecId);
  }).length;
  
  // Detect clashes strictly across selected sections
  const clashReport = useMemo(() => {
    return detectClashes(selectedSectionIds, selectedCoursesData);
  }, [selectedSectionIds, selectedCoursesData]);

  // Generate Clash Recommendations
  const clashRecommendations = useMemo(() => {
    if (!clashReport.hasClashes) return [];
    
    // Find unique courses involved in clashes
    const conflictingCourseIds = new Set<string>();
    clashReport.conflicts.forEach(c => {
      conflictingCourseIds.add(c.courseA.id);
      conflictingCourseIds.add(c.courseB.id);
    });

    const recommendations: { course: Course; section: any }[] = [];
    
    Array.from(conflictingCourseIds).forEach(courseId => {
      const targetCourse = selectedCoursesData.find(c => c.id === courseId);
      if (targetCourse) {
        const validRecs = recommendSections(targetCourse, selectedCoursesData, selectedSectionIds);
        // Take the absolute best one for this course if it exists
        if (validRecs.length > 0) {
          recommendations.push({ course: targetCourse, section: validRecs[0] });
        }
      }
    });

    return recommendations;
  }, [clashReport, selectedCoursesData, selectedSectionIds]);

  const canContinue = totalRequired > 0 && validSelectionsCount === totalRequired && !clashReport.hasClashes;

  // Track if the user has dismissed the mini notification
  const [isDismissed, setIsDismissed] = useState(false);

  // Un-dismiss if the selections change
  useEffect(() => {
    setIsDismissed(false);
  }, [selectedSectionIds]);

  // Formatting helper for minutes back to string (e.g. 540 -> "09:00")
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Header and Progress */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Select Your Sections
        </h1>
        <p className="mt-2 text-base text-slate-500 max-w-2xl">
          Choose exactly one timetable section for each of your selected courses.
        </p>
        
        <div className="mt-6 flex items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm max-w-2xl">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">Progress</span>
              <span className="text-sm font-medium text-slate-500">{validSelectionsCount} of {totalRequired} Sections Selected</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ease-out ${clashReport.hasClashes ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${totalRequired > 0 ? (validSelectionsCount / totalRequired) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Clash Summary Dashboard */}
      {clashReport.hasClashes && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-bold text-red-900">
                {clashReport.conflicts.length} {clashReport.conflicts.length === 1 ? 'Conflict' : 'Conflicts'} Found
              </h2>
            </div>
            <div className="space-y-4">
              {clashReport.conflicts.map(conflict => (
                <div key={conflict.id} className="bg-white rounded-lg border border-red-100 p-4 shadow-sm flex flex-col lg:flex-row items-center gap-4 lg:gap-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-400"></div>
                  
                  {/* Course A */}
                  <div className="flex-1 w-full pl-2">
                    <h4 className="font-bold text-slate-800">{conflict.courseA.courseName}</h4>
                    <p className="text-sm font-semibold text-indigo-600 mb-2">{conflict.sectionA.sectionName}</p>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><span className="font-medium text-slate-800">{conflict.scheduleA.day}</span> · {conflict.scheduleA.startTime}–{conflict.scheduleA.endTime}</p>
                      <p>Instructor: {conflict.scheduleA.instructor || 'TBA'}</p>
                      <p>Room: {conflict.scheduleA.room || 'TBA'}</p>
                      <span className={`inline-block px-1.5 py-0.5 mt-1 rounded text-xs font-bold uppercase ${conflict.scheduleA.type === 'Lab' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {conflict.scheduleA.type}
                      </span>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="flex flex-col items-center justify-center flex-shrink-0 px-4 py-2 lg:py-0">
                    <span className="text-xs font-bold text-slate-400 mb-1">VS</span>
                    <div className="h-px lg:h-8 w-8 lg:w-px bg-slate-200"></div>
                  </div>

                  {/* Course B */}
                  <div className="flex-1 w-full">
                    <h4 className="font-bold text-slate-800">{conflict.courseB.courseName}</h4>
                    <p className="text-sm font-semibold text-indigo-600 mb-2">{conflict.sectionB.sectionName}</p>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><span className="font-medium text-slate-800">{conflict.scheduleB.day}</span> · {conflict.scheduleB.startTime}–{conflict.scheduleB.endTime}</p>
                      <p>Instructor: {conflict.scheduleB.instructor || 'TBA'}</p>
                      <p>Room: {conflict.scheduleB.room || 'TBA'}</p>
                      <span className={`inline-block px-1.5 py-0.5 mt-1 rounded text-xs font-bold uppercase ${conflict.scheduleB.type === 'Lab' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {conflict.scheduleB.type}
                      </span>
                    </div>
                  </div>
                  
                  {/* Overlap Summary */}
                  <div className="flex-shrink-0 w-full lg:w-auto bg-red-50 p-3 rounded-lg border border-red-100 text-center lg:text-left mt-4 lg:mt-0">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Exact Overlap</p>
                    <p className="font-semibold text-red-900">{conflict.day}</p>
                    <p className="text-sm text-red-800 font-medium">{formatTime(conflict.overlapStartMinutes)} – {formatTime(conflict.overlapEndMinutes)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Clash Recommendations */}
            {clashRecommendations.length > 0 && (
              <div className="mt-6 border-t border-red-100 pt-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Recommended Alternatives</h3>
                <div className="space-y-3">
                  {clashRecommendations.map((rec, idx) => (
                    <SectionRecommendation 
                      key={`${rec.course.id}-${idx}`}
                      course={rec.course}
                      recommendedSection={rec.section}
                      onUseSection={onSelectSection}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Clash - Optional Backup Recommendations */}
      {/* Courses List */}
      <div className="flex-grow space-y-10 mb-20">
        {displayCourses.map(course => (
          <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible relative">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-800">{course.courseName}</h3>
                  {course.shortName && (
                    <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                      {course.shortName}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500 mt-1">{course.semester}</p>
              </div>
              <div className="flex-shrink-0">
                {selectedSectionIds[course.id] && course.sections.some(s => s.id === selectedSectionIds[course.id]) ? (
                  clashReport.conflictingSectionIds.has(selectedSectionIds[course.id]) ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="w-4 h-4 mr-1.5" />
                      Conflict
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Selected
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    Action Required
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {course.sections.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-slate-500 font-medium">No sections available for this course.</p>
                  <p className="text-sm text-slate-400 mt-1">Please go back and remove this course to continue.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* The actual Section Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {course.sections.map(section => (
                      <SectionCard 
                        key={section.id}
                        section={section}
                        isSelected={selectedSectionIds[course.id] === section.id}
                        isConflict={selectedSectionIds[course.id] === section.id && clashReport.conflictingSectionIds.has(section.id)}
                        onSelect={(secId) => onSelectSection(course.id, secId)}
                      />
                    ))}
                  </div>

                  {/* Per-Course Mini Recommendations (Floating Menu) */}
                  {selectedSectionIds[course.id] && !dismissedRecs.has(`${course.id}_${selectedSectionIds[course.id]}`) && (() => {
                    const recs = recommendSections(course, selectedCoursesData, selectedSectionIds).slice(0, 2);
                    if (recs.length === 0) return null;
                    
                    return (
                      <div className="absolute top-16 right-6 z-20 w-[350px] bg-white shadow-2xl border border-blue-200 rounded-xl p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">
                              Recommended Alternatives
                            </h4>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                          </div>
                          <button 
                            onClick={() => setDismissedRecs(prev => new Set(prev).add(`${course.id}_${selectedSectionIds[course.id]}`))}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                            aria-label="Close recommendations"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          {recs.map(rec => (
                            <SectionRecommendationMini
                              key={rec.id}
                              course={course}
                              recommendedSection={rec}
                              onUseSection={onSelectSection}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {displayCourses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">No courses selected</h3>
            <p className="mt-1 text-slate-500">Go back and select some courses to continue.</p>
          </div>
        )}
      </div>
      
      {/* Floating Clash Notification */}
      {clashReport.hasClashes && clashReport.conflicts.length > 0 && !isDismissed && (
        <div className="fixed bottom-24 right-4 sm:right-8 z-50 max-w-xs w-full animate-in slide-in-from-bottom-8 fade-in duration-300 shadow-2xl rounded-xl">
          <div className="bg-white rounded-xl border border-red-200 overflow-hidden flex flex-col">
            <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                <span className="text-red-800 font-bold text-sm">
                  {clashReport.conflicts.length} Schedule {clashReport.conflicts.length === 1 ? 'conflict' : 'conflicts'}
                </span>
              </div>
              <button 
                onClick={() => setIsDismissed(true)} 
                className="text-red-400 hover:text-red-700 transition-colors p-1 -mr-1"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 text-sm text-slate-700 space-y-3">
              <div>
                <p className="font-bold text-slate-900 truncate" title={clashReport.conflicts[0].courseA.courseName}>
                  {clashReport.conflicts[0].courseA.courseName} <span className="font-normal text-slate-500">· {clashReport.conflicts[0].sectionA.sectionName}</span>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {clashReport.conflicts[0].scheduleA.day} · {clashReport.conflicts[0].scheduleA.startTime}–{clashReport.conflicts[0].scheduleA.endTime}
                </p>
              </div>
              
              <div className="flex items-center text-[10px] font-bold text-red-500 uppercase tracking-wider">
                <div className="flex-1 h-px bg-red-100"></div>
                <span className="px-2">conflicts with</span>
                <div className="flex-1 h-px bg-red-100"></div>
              </div>
              
              <div>
                <p className="font-bold text-slate-900 truncate" title={clashReport.conflicts[0].courseB.courseName}>
                  {clashReport.conflicts[0].courseB.courseName} <span className="font-normal text-slate-500">· {clashReport.conflicts[0].sectionB.sectionName}</span>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {clashReport.conflicts[0].scheduleB.day} · {clashReport.conflicts[0].scheduleB.startTime}–{clashReport.conflicts[0].scheduleB.endTime}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                aria-label="View conflict details"
              >
                View conflict{clashReport.conflicts.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg p-4 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Courses
          </button>
          
          <div className="flex items-center gap-4">
            {!canContinue && totalRequired > 0 && (
              <span className="text-sm text-amber-600 font-medium hidden sm:inline-block">
                {clashReport.hasClashes 
                  ? `Resolve ${clashReport.conflicts.length} conflict${clashReport.conflicts.length > 1 ? 's' : ''} to continue` 
                  : 'Select a section for all courses to continue'
                }
              </span>
            )}
            <button 
              onClick={onContinue}
              disabled={!canContinue}
              className={`
                px-8 py-2.5 font-bold rounded-lg transition-all shadow-sm flex items-center
                ${canContinue 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Review Timetable
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
