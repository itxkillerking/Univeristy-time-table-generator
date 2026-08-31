import CourseCard from './CourseCard';
import { BookOpen } from 'lucide-react';
import type { Course } from '../../types/timetable';

interface CourseListProps {
  courses: Course[];
  selectedCourseIds: string[];
  onToggleSelect: (courseId: string) => void;
}

export default function CourseList({ courses, selectedCourseIds, onToggleSelect }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <div className="bg-white p-3 rounded-full shadow-sm mb-4">
          <BookOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No courses found</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          We couldn't find any courses matching your criteria. Try adjusting your search or selecting a different semester.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isSelected={selectedCourseIds.includes(course.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
