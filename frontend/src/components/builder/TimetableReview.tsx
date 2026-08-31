import { useMemo, useState } from 'react';
import { ArrowLeft, Clock, MapPin, User, AlertTriangle, Download, Loader2 } from 'lucide-react';
import type { Course, Schedule } from '../../types/timetable';
import { detectClashes } from '../../lib/clash/clashDetector';
import { generateTimetablePDF } from '../../lib/pdf/timetablePdf';

interface TimetableReviewProps {
  selectedCoursesData: Course[];
  selectedSectionIds: Record<string, string>;
  onBack: () => void;
}

interface FlatScheduleBlock {
  id: string;
  course: Course;
  sectionName: string;
  schedule: Schedule;
}

export default function TimetableReview({
  selectedCoursesData,
  selectedSectionIds,
  onBack
}: TimetableReviewProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // 1. Clash Safety Guard
  // The system should not reach here with clashes, but we implement a defensive check.
  const clashReport = useMemo(() => {
    return detectClashes(selectedSectionIds, selectedCoursesData);
  }, [selectedSectionIds, selectedCoursesData]);

  // 2. Data Preparation: Flatten all selected schedules
  const scheduleBlocks = useMemo(() => {
    const blocks: FlatScheduleBlock[] = [];
    
    for (const course of selectedCoursesData) {
      const sectionId = selectedSectionIds[course.id];
      if (!sectionId) continue;
      
      const section = course.sections.find(s => s.id === sectionId);
      if (!section) continue;
      
      // Iterate and push ALL schedule records unconditionally (preserves multi-period labs & theory+lab)
      for (const schedule of section.schedules) {
        if (schedule.startMinutes !== -1 && schedule.endMinutes !== -1 && schedule.day) {
          blocks.push({
            id: `${course.id}_${section.id}_${schedule.day}_${schedule.startMinutes}`,
            course,
            sectionName: section.sectionName,
            schedule
          });
        }
      }
    }
    
    // Sort all blocks chronologically
    return blocks.sort((a, b) => a.schedule.startMinutes - b.schedule.startMinutes);
  }, [selectedCoursesData, selectedSectionIds]);

  // 3. Group strictly by Day
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const blocksByDay = useMemo(() => {
    const grouped: Record<string, FlatScheduleBlock[]> = {
      'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [], 'Saturday': []
    };
    
    for (const block of scheduleBlocks) {
      if (grouped[block.schedule.day]) {
        grouped[block.schedule.day].push(block);
      } else {
        // If it's a Sunday or unexpected day, initialize the array
        grouped[block.schedule.day] = [block];
        if (!daysOfWeek.includes(block.schedule.day)) {
          daysOfWeek.push(block.schedule.day);
        }
      }
    }
    
    return grouped;
  }, [scheduleBlocks]);

  // Defensive Check UI
  if (clashReport.hasClashes) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Unresolved Conflicts</h2>
        <p className="text-lg text-slate-600 mb-8">
          Please resolve all schedule conflicts before reviewing your timetable.
        </p>
        <button 
          onClick={onBack}
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Sections
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Final Timetable
            </h1>
            <p className="mt-2 text-base text-slate-500">
              Your selected courses and sections
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 self-start sm:self-auto">
            <button 
              onClick={onBack}
              disabled={isGeneratingPDF}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <button 
              onClick={async () => {
                if (clashReport.hasClashes) {
                  alert("Please resolve timetable clashes before downloading the final timetable.");
                  return;
                }
                setIsGeneratingPDF(true);
                try {
                  // Pass the exact semester from the first course (since all courses share the same semester)
                  const semesterStr = selectedCoursesData.length > 0 ? selectedCoursesData[0].semester : 'Unknown Semester';
                  
                  await generateTimetablePDF(semesterStr, scheduleBlocks, {
                    coursesCount: selectedCoursesData.length,
                    sectionsCount: Object.keys(selectedSectionIds).length,
                    meetingsCount: scheduleBlocks.length
                  });
                } catch (error) {
                  console.error("PDF generation failed", error);
                  alert("Failed to generate PDF. Please try again.");
                } finally {
                  setIsGeneratingPDF(false);
                }
              }}
              disabled={isGeneratingPDF || scheduleBlocks.length === 0 || clashReport.hasClashes}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="inline-flex flex-wrap items-center bg-blue-50 border border-blue-100 rounded-lg p-1 shadow-sm">
          <div className="px-4 py-2 text-sm font-semibold text-blue-900">
            {selectedCoursesData.length} Courses
          </div>
          <div className="w-px h-5 bg-blue-200"></div>
          <div className="px-4 py-2 text-sm font-semibold text-blue-900">
            {Object.keys(selectedSectionIds).length} Sections
          </div>
          <div className="w-px h-5 bg-blue-200"></div>
          <div className="px-4 py-2 text-sm font-semibold text-blue-900">
            {scheduleBlocks.length} Class Meetings
          </div>
        </div>
      </div>

      {scheduleBlocks.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Clock className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No timetable entries found</h3>
          <p className="text-slate-500 mt-2 text-center max-w-md">
            Please return to Section Selection and verify your selected sections.
          </p>
        </div>
      ) : (
        <div className="flex-grow bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* DESKTOP GRID (> lg) */}
          <div className="hidden lg:grid grid-cols-6 divide-x divide-slate-200 flex-grow">
            {daysOfWeek.slice(0, 6).map(day => (
              <div key={day} className="flex flex-col h-full">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-center">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">{day}</h3>
                </div>
                <div className="flex-grow p-3 space-y-3 bg-slate-50/30">
                  {blocksByDay[day]?.map(block => (
                    <div 
                      key={block.id} 
                      className={`p-3 rounded-xl border shadow-sm transition-all hover:shadow-md
                        ${block.schedule.type === 'Lab' 
                          ? 'bg-amber-50 border-amber-200' 
                          : 'bg-white border-blue-100 hover:border-blue-300'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 leading-tight line-clamp-2" title={block.course.courseName}>
                            {block.course.courseName}
                          </p>
                        </div>
                        {block.course.shortName && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wider border border-slate-200">
                            {block.course.shortName}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                          {block.sectionName}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider
                          ${block.schedule.type === 'Lab' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}
                        `}>
                          {block.schedule.type}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center font-medium text-slate-800">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          {block.schedule.startTime} – {block.schedule.endTime}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          <span className="truncate">{block.schedule.room || 'TBA'}</span>
                        </div>
                        <div className="flex items-center">
                          <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          <span className="truncate">{block.schedule.instructor || 'TBA'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* MOBILE/TABLET VIEW (<= lg) */}
          <div className="lg:hidden flex-grow flex flex-col divide-y divide-slate-200">
            {daysOfWeek.map(day => (
              blocksByDay[day]?.length > 0 && (
                <div key={day} className="flex flex-col">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 sticky top-0 z-10">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">{day}</h3>
                  </div>
                  <div className="p-4 space-y-4 bg-white">
                    {blocksByDay[day].map(block => (
                      <div 
                        key={block.id} 
                        className={`p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4
                          ${block.schedule.type === 'Lab' 
                            ? 'bg-amber-50/50 border-amber-200' 
                            : 'bg-white border-slate-200'
                          }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                              {block.sectionName}
                            </span>
                            {block.course.shortName && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wider border border-slate-200">
                                {block.course.shortName}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider ml-auto sm:ml-0
                              ${block.schedule.type === 'Lab' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}
                            `}>
                              {block.schedule.type}
                            </span>
                          </div>
                          
                          <p className="font-bold text-slate-900 text-base mb-2">
                            {block.course.courseName}
                          </p>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                            <div className="flex items-center font-medium text-slate-800">
                              <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                              {block.schedule.startTime} – {block.schedule.endTime}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                              {block.schedule.room || 'TBA'}
                            </div>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1.5 text-slate-400" />
                              {block.schedule.instructor || 'TBA'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
