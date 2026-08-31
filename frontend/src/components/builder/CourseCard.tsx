import { Plus, Check, X } from 'lucide-react';
import type { Course } from '../../types/timetable';

interface CourseCardProps {
  course: Course;
  isSelected: boolean;
  onToggleSelect: (courseId: string) => void;
}

export default function CourseCard({ course, isSelected, onToggleSelect }: CourseCardProps) {
  return (
    <div 
      className={`relative rounded-xl border p-5 transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">
            {course.courseName}
          </h3>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {course.shortName && (
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                {course.shortName}
              </span>
            )}
            <span className="text-sm font-medium text-slate-500">
              {course.semester}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => onToggleSelect(course.id)}
          className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isSelected 
              ? 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 focus:ring-blue-500'
          }`}
          aria-label={isSelected ? 'Remove course' : 'Select course'}
        >
          {isSelected ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>
      
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-sm animate-in zoom-in duration-200">
          <Check className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}
