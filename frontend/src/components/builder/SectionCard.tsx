
import type { Section } from '../../types/timetable';

interface SectionCardProps {
  section: Section;
  isSelected: boolean;
  isConflict?: boolean;
  onSelect: (sectionId: string) => void;
}

export default function SectionCard({ section, isSelected, isConflict, onSelect }: SectionCardProps) {
  // Sort schedules by day (simple sort assuming standard week)
  const dayOrder: Record<string, number> = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
  };
  
  const sortedSchedules = [...section.schedules].sort((a, b) => 
    (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99) || 
    (a.startMinutes - b.startMinutes)
  );

  let borderBgClass = 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm';
  if (isSelected && isConflict) {
    borderBgClass = 'bg-red-50/80 border-red-500 shadow-sm ring-1 ring-red-500';
  } else if (isSelected) {
    borderBgClass = 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500';
  }

  let checkClass = 'border-slate-300 text-transparent';
  if (isSelected && isConflict) {
    checkClass = 'bg-red-500 border-red-500 text-white';
  } else if (isSelected) {
    checkClass = 'bg-blue-500 border-blue-500 text-white';
  }

  return (
    <div 
      onClick={() => onSelect(section.id)}
      className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col h-full ${borderBgClass}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-lg font-bold text-slate-800">{section.sectionName}</h4>
        </div>
        
        {/* Checkmark indicator */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${checkClass}`}>
          {isSelected && isConflict ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      <div className="flex-grow space-y-3 mt-2">
        {sortedSchedules.map((schedule, idx) => (
          <div key={idx} className="flex items-start text-sm">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 flex-shrink-0 ${schedule.type === 'Lab' ? 'bg-amber-400' : 'bg-indigo-400'}`}></div>
            <div className="flex-1 text-slate-700 leading-tight">
              <div className="flex items-center flex-wrap gap-x-1">
                <span className="font-semibold text-slate-800">{schedule.day}</span>
                <span className="text-slate-400">·</span>
                <span>{schedule.startTime}–{schedule.endTime}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">Room {schedule.room || 'TBA'}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${schedule.type === 'Lab' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {schedule.type}
                </span>
                <span className="text-slate-500 text-xs">{schedule.instructor || 'Instructor TBA'}</span>
              </div>
            </div>
          </div>
        ))}
        {sortedSchedules.length === 0 && (
          <p className="text-sm text-slate-400 italic">No schedules available</p>
        )}
      </div>
    </div>
  );
}
