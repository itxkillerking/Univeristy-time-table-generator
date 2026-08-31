import { ArrowRight, Trash2, BookCheck } from 'lucide-react';
import type { Course } from '../../types/timetable';

interface SelectedCoursesProps {
  selectedCourses: Course[];
  onRemoveCourse: (courseId: string) => void;
  onContinue: () => void;
}

export default function SelectedCourses({ selectedCourses, onRemoveCourse, onContinue }: SelectedCoursesProps) {
  // Group selected courses by semester
  const groupedCourses = selectedCourses.reduce((acc, course) => {
    if (!acc[course.semester]) {
      acc[course.semester] = [];
    }
    acc[course.semester].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  const semesters = Object.keys(groupedCourses).sort();
  const totalSelected = selectedCourses.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BookCheck className="w-5 h-5 text-blue-600" />
          My Selections
        </h2>
        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
          {totalSelected} {totalSelected === 1 ? 'Course' : 'Courses'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {totalSelected === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-dashed border-slate-200">
              <BookCheck className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm text-center max-w-[200px]">
              No courses selected yet. Choose courses from the left to build your schedule.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {semesters.map(semester => (
              <div key={semester}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {semester}
                </h3>
                <ul className="space-y-2.5">
                  {groupedCourses[semester].map(course => (
                    <li key={course.id} className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate" title={course.courseName}>
                          {course.courseName}
                        </p>
                        {course.shortName && (
                          <p className="text-xs font-bold text-indigo-600 mt-0.5">
                            {course.shortName}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveCourse(course.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 border-t border-slate-100 bg-white">
        <button
          onClick={onContinue}
          disabled={totalSelected === 0}
          className={`w-full flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-sm ${
            totalSelected > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Choose Sections</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
