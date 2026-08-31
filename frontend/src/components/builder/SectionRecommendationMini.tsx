import { CheckCircle2, Clock } from 'lucide-react';
import type { Course, Section } from '../../types/timetable';

interface SectionRecommendationMiniProps {
  course: Course;
  recommendedSection: Section;
  onUseSection: (courseId: string, sectionId: string) => void;
}

export default function SectionRecommendationMini({
  course,
  recommendedSection,
  onUseSection,
}: SectionRecommendationMiniProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/30 transition-colors hover:bg-blue-50/60">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-slate-800 text-sm">
            {recommendedSection.sectionName}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            No conflicts
          </span>
        </div>

        <div className="space-y-1.5">
          {recommendedSection.schedules.map((schedule, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider
                ${schedule.type === 'Lab' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}
              `}>
                {schedule.type}
              </span>
              <div className="flex items-center font-medium">
                <Clock className="w-3 h-3 mr-1 text-slate-400" />
                <span className="font-semibold text-slate-700 mr-1">{schedule.day}</span>
                {schedule.startTime}–{schedule.endTime}
              </div>
              <span className="text-slate-400">·</span>
              <span className="truncate">{schedule.room || 'TBA'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0">
        <button
          onClick={() => onUseSection(course.id, recommendedSection.id)}
          className="w-full sm:w-auto px-4 py-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 text-sm font-bold rounded-lg transition-colors shadow-sm"
        >
          Use This Section
        </button>
      </div>
    </div>
  );
}
