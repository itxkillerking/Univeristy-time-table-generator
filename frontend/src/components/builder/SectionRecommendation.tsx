import { CheckCircle2, Clock, MapPin, User } from 'lucide-react';
import type { Course, Section } from '../../types/timetable';

interface SectionRecommendationProps {
  course: Course;
  recommendedSection: Section;
  onUseSection: (courseId: string, sectionId: string) => void;
  isBackup?: boolean;
}

export default function SectionRecommendation({
  course,
  recommendedSection,
  onUseSection,
  isBackup = false
}: SectionRecommendationProps) {
  return (
    <div className={`p-4 rounded-xl border ${isBackup ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/50 border-blue-100'} shadow-sm`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-slate-900">{course.courseName}</span>
            {course.shortName && (
              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wider">
                {course.shortName}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-indigo-700">
              Alternative: {recommendedSection.sectionName}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              No conflicts
            </span>
          </div>

          <div className="space-y-2">
            {recommendedSection.schedules.map((schedule, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider
                  ${schedule.type === 'Lab' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}
                `}>
                  {schedule.type}
                </span>
                <div className="flex items-center font-medium text-slate-800">
                  <Clock className="w-3 h-3 mr-1 text-slate-400" />
                  <span className="font-semibold mr-1">{schedule.day}</span> {schedule.startTime}–{schedule.endTime}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                  {schedule.room || 'TBA'}
                </div>
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1 text-slate-400" />
                  {schedule.instructor || 'TBA'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 flex sm:flex-col justify-end sm:justify-start">
          <button
            onClick={() => onUseSection(course.id, recommendedSection.id)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
          >
            Use This Section
          </button>
        </div>

      </div>
    </div>
  );
}
